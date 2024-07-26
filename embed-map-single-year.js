var attribution = '<a href="https://www.openhistoricalmap.org/copyright">OpenHistoricalMap</a>';
var stylesByLayer = {
  /* Historic */
  O: 'https://www.openhistoricalmap.org/map-styles/main/main.json',
  /* Railway */
  R: 'https://www.openhistoricalmap.org/map-styles/rail/rail.json',
  /* Japanese Scroll */
  J: 'https://www.openhistoricalmap.org/map-styles/japanese_scroll/ohm-japanese-scroll-map.json',
  /* Woodblock */
  W: 'https://www.openhistoricalmap.org/map-styles/woodblock/woodblock.json',
};

addEventListener('load', function () {
  let
    params = new URLSearchParams(location.hash.substring(1)),
    style = stylesByLayer[params.get('layer') || ''] || stylesByLayer.O
  ;

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

  let
    markerLongitude = parseFloat(params.get('mlon')),
    markerLatitude = parseFloat(params.get('mlat')),
    bbox = params.get('bbox')
  ;

  // A bbox is provided in the Share=>HTML generated in ohm-website's side panel. It is used
  // for the initial bounding of an embedded map so that the view will be roughly equivalent,
  // and then the standard hash mechanism takes over.
  if (bbox && bbox.split(',').length === 4) {
    let bounds = new maplibregl.LngLatBounds(bbox.split(','));
    map.fitBounds(bounds, {duration:0});
  }

  if (markerLongitude && markerLatitude) {
    new maplibregl.Marker()
      .setLngLat([markerLongitude, markerLatitude])
      .addTo(map);
  }

  map.once('styledata', function (event) {
    if (params.get('start_date') || params.get('end_date')) {
      animate(map, params.get('start_date'), params.get('end_date'));
      return;
    }
    
    let isoDate = params.get('date');
    let date = dateFromISODate(isoDate || new Date());
    if (date) {
      filterByDate(map, date);
    }
  });

  addEventListener('hashchange', function (event) {
    upgradeLegacyHash();
    var oldParams = new URLSearchParams(new URL(event.oldURL).hash.substring(1));
    var newParams = new URLSearchParams(new URL(event.newURL).hash.substring(1));
    if (newParams.get('start_date') || newParams.get('end_date')) {
      if (oldParams.get('start_date') !== newParams.get('start_date') ||
          oldParams.get('end_date') !== newParams.get('end_date')) {
        animate(map, newParams.get('start_date'), newParams.get('end_date'));
      }
      return;
    }
    
    var oldISODate = oldParams.get('date');
    var newISODate = newParams.get('date');
    if (oldISODate !== newISODate) {
      let newDate = dateFromISODate(newISODate || new Date());
      if (newDate) {
        filterByDate(map, newDate);
      }
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

let animationInterval;

/**
 * Animates the map between the given dates.
 * 
 * @param map The MapboxGL map object to animate.
 * @param startDate The starting date in ISO 8601-1 format.
 * @param endDate The ending date in ISO 8601-1 format.
 */
function animate(map, startDate, endDate) {
  if (animationInterval) {
    clearInterval(animationInterval);
  }
  
  let hash = location.hash.substring(1);
  let params = new URLSearchParams(location.hash.substring(1));
  let duration = Duration.from(params.get('interval')) || new Duration(1);
  let framerate = parseFloat(params.get('framerate'));
  
  animationInterval = setInterval(function () {
    let hash = location.hash.substring(1);
    let params = new URLSearchParams(location.hash.substring(1));
    let isoDate = params.get('date') || startDate;
    let oldDate = dateFromISODate(isoDate);
    if (oldDate) {
      let newDate = dateAfterDuration(oldDate, duration);
      if (newDate <= new Date()) {
        filterByDate(map, newDate);
        params.set('date', newDate.toISOString().split('T')[0]);
        location.hash = '#' + params.toString();
      } else {
        clearInterval(animationInterval);
      }
    }
  }, 1000 / (isNaN(framerate) ? 1 : framerate));
}

/**
 * Filters the map’s features by a date.
 *
 * @param map The MapboxGL map object to filter the style of.
 * @param date The date to filter by.
 */
function filterByDate(map, date) {
  var decimalYear = decimalYearFromDate(date);
  map.getStyle().layers.map(function (layer) {
    if (!('source-layer' in layer)) return;

    var filter = constrainFilterByDate(map.getFilter(layer.id), decimalYear);
    map.setFilter(layer.id, filter);
  });
}

/**
 * Converts the given date to a decimal year.
 *
 * @param date A date object.
 * @returns A floating point number of years since year 0.
 */
function decimalYearFromDate(date) {
  // Add the year and the fraction of the date between two New Year’s Days.
  let year = date.getUTCFullYear();
  var nextNewYear = dateFromUTC(year + 1, 0, 1).getTime();
  var lastNewYear = dateFromUTC(year, 0, 1).getTime();
  return year + (date.getTime() - lastNewYear) / (nextNewYear - lastNewYear);
}

/**
 * Converts the given ISO 8601-1 date to a `Date` object.
 *
 * @param isoDate A date string in ISO 8601-1 format.
 * @returns A date object.
 */
function dateFromISODate(isoDate) {
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
  return !isNaN(date) && date;
}

/**
 * Similar to the `Temporal.Duration` class in TC39, but only for years, months, and days.
 */
function Duration(years, months, days) {
  this.years = isNaN(years) ? 0 : years;
  this.months = isNaN(months) ? 0 : months;
  this.days = isNaN(days) ? 0 : days;
}

/**
 * Converts the gven ISO 8601-1 duration to a duration object.
 */
Duration.from = function (isoDuration) {
  let match = isoDuration && isoDuration.match(/^([-+])?P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/);
  if (match) {
    let sign = (match[1] === '-') ? -1 : 1;
    let years = sign * parseInt(match[2], 0);
    let months = sign * parseInt(match[3], 0);
    let days = sign * parseInt(match[4], 0);
    return new Duration(years, months, days);
  }
};

/**
 * Returns a copy of the date advanced by the given duration.
 * 
 * @param date A date object.
 * @param duration A `Duration` object to advance `date` by.
 * @returns A date object advanced by the duration.
 */
function dateAfterDuration(date, duration) {
  let newDate = date;
  newDate.setUTCFullYear(newDate.getUTCFullYear() + duration.years);
  newDate.setUTCMonth(newDate.getUTCMonth() + duration.months);
  newDate.setUTCDate(newDate.getUTCDate() + duration.days);
  return newDate;
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
