var attribution = '<a href="https://www.openhistoricalmap.org/copyright">OpenHistoricalMap</a>';
var stylesByLayer = {
  /* Historic */
  O: 'https://openhistoricalmap.github.io/map-styles/ohm_timeslider_tegola/tegola-ohm.json',
  /* Japanese Scroll */
  J: 'https://openhistoricalmap.github.io/map-styles/japanese_scroll/ohm-japanese-scroll-map.json',
  /* Woodblock */
  W: 'https://openhistoricalmap.github.io/map-styles/woodblock/woodblock.json',
};

addEventListener('load', function () {
  var params = new URLSearchParams(location.hash.substring(1));
  var style = stylesByLayer[params.get('layer') || ''] || stylesByLayer.O;

  upgradeLegacyHash();

  window.map = new maplibregl.Map({
    container: 'map',
    hash: 'map',
    style: style,
    attributionControl: false,
    customAttribution: attribution,
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-left');
  map.addControl(new maplibregl.FullscreenControl(), 'top-left');
  map.addControl(new maplibregl.AttributionControl({
    customAttribution: attribution,
  }));

  var markerLongitude = parseFloat(params.get('mlon'));
  var markerLatitude = parseFloat(params.get('mlat'));
  if (markerLongitude && markerLatitude) {
    new maplibregl.Marker()
      .setLngLat([markerLongitude, markerLatitude])
      .addTo(map);
  }

  map.once('styledata', function (event) {
    filterByDate(map, params.get('date'));
  });

  addEventListener('hashchange', function (event) {
    upgradeLegacyHash();
    var oldParams = new URLSearchParams(new URL(event.oldURL).hash.substring(1));
    var newParams = new URLSearchParams(new URL(event.newURL).hash.substring(1));
    var oldDate = oldParams.get('date');
    var newDate = newParams.get('date');
    if (oldDate !== newDate) {
      filterByDate(map, newDate);
    }
  });
});

function upgradeLegacyHash() {
  var hash = location.hash.substring(1);
  if (!hash.includes('=')) {
    hash = '#map=' + hash;
  }
  location.hash = hash;
}

/**
 * Filters the map’s features by the `date` data attribute.
 *
 * @param map The MapboxGL map object to filter the style of.
 * @param date The date to filter by in YYYY-MM-DD format.
 */
function filterByDate(map, date) {
  if (date === null || date === '') {
    date = new Date().toISOString().split('T')[0];
  }
  var decimalYear = date && decimalYearFromISODate(date);
  if (!decimalYear) return;

  map.getStyle().layers.map(function (layer) {
    if (!('source-layer' in layer)) return;

    var filter = constrainFilterByDate(layer.filter, decimalYear);
    map.setFilter(layer.id, filter);
  });
}

/**
 * Converts the given ISO 8601-1 date to a decimal year.
 *
 * @param isoDate A date string in ISO 8601-1 format.
 * @returns A floating point number of years since year 0.
 */
function decimalYearFromISODate(isoDate) {
  // Require a valid YYYY, YYYY-MM, or YYYY-MM-DD date, but allow the year
  // to be a variable number of digits or negative, unlike ISO 8601-1.
  if (!isoDate || !/^-?\d{1,4}(?:-\d\d){0,2}$/.test(isoDate)) return;

  var ymd = isoDate.split('-');
  // A negative year results in an extra element at the beginning.
  if (ymd[0] === '') {
    ymd.shift();
    ymd[0] *= -1;
  }
  var year = +ymd[0];
  var date = dateFromUTC(year, +ymd[1] - 1, +ymd[2]);
  if (isNaN(date)) return;

  // Add the year and the fraction of the date between two New Year’s Days.
  var nextNewYear = dateFromUTC(year + 1, 0, 1).getTime();
  var lastNewYear = dateFromUTC(year, 0, 1).getTime();
  return year + (date.getTime() - lastNewYear) / (nextNewYear - lastNewYear);
}

/**
 * Returns a `Date` object representing the given UTC date components.
 *
 * @param year A one-based year in the proleptic Gregorian calendar.
 * @param month A zero-based month.
 * @param day A one-based day.
 * @returns A date object.
 */
function dateFromUTC(year, month, day) {
  var date = new Date(Date.UTC(year, month, day));
  // Date.UTC() treats a two-digit year as an offset from 1900.
  date.setUTCFullYear(year);
  return date;
}

/**
 * Returns a modified version of the given filter that only evaluates to
 * true if the feature coincides with the given decimal year.
 *
 * @param filter The original layer filter.
 * @param decimalYear The decimal year to filter by.
 * @returns A filter similar to the given filter, but with added conditions
 *	that require the feature to coincide with the decimal year.
 */
function constrainFilterByDate(filter, decimalYear) {
  if (filter && filter[0] === 'all' &&
      filter[1] && filter[1][0] === 'any') {
    if (filter[1][2] && filter[1][2][0] === '<=' && filter[1][2][1] === 'start_decdate') {
      filter[1][2][2] = decimalYear;
    }
    if (filter[2][2] && filter[2][2][0] === '>=' && filter[2][2][1] === 'end_decdate') {
      filter[2][2][2] = decimalYear;
    }
    return filter;
  }

  var dateFilter = [
    'all',
    ['any', ['!has', 'start_decdate'], ['<=', 'start_decdate', decimalYear]],
    ['any', ['!has', 'end_decdate'], ['>=', 'end_decdate', decimalYear]],
  ];
  if (filter) {
    dateFilter.push(filter);
  }
  return dateFilter;
}
