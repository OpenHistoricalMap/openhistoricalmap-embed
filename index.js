import { filterByDate, dateRangeFromISODate } from '@openhistoricalmap/maplibre-gl-dates';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapboxLanguage from '@mapbox/mapbox-gl-language';

var attribution = '<a href="https://www.openhistoricalmap.org/copyright">OpenHistoricalMap</a>';
var stylesByLayer = {
  /* Historic (production) */
  O: 'https://www.openhistoricalmap.org/map-styles/main/main.json',
  /* Historic (staging) */
  O_staging: 'https://openhistoricalmap.github.io/map-styles/main/main.json',
  /* Railway (production) */
  R: 'https://www.openhistoricalmap.org/map-styles/rail/rail.json',
  /* Railway (staging) */
  R_staging: 'https://openhistoricalmap.github.io/map-styles/rail/rail.json',
  /* Japanese Scroll (production) */
  J: 'https://www.openhistoricalmap.org/map-styles/japanese_scroll/ohm-japanese-scroll-map.json',
  /* Japanese Scroll (staging) */
  J_staging: 'https://openhistoricalmap.github.io/map-styles/japanese_scroll/ohm-japanese-scroll-map.json',
  /* Woodblock (production) */
  W: 'https://www.openhistoricalmap.org/map-styles/woodblock/woodblock.json',
  /* Woodblock (staging) */
  W_staging: 'https://openhistoricalmap.github.io/map-styles/woodblock/woodblock.json',
};

addEventListener('load', function () {
  // Avoid lazy-loading RTL support because it maplibre-gl-leaflet doesn’t refresh the tiles when it first loads.
  maplibregl.setRTLTextPlugin('mapbox-gl-rtl-text.js', false);

  let
    params = new URLSearchParams(location.hash.substring(1)),
    style = stylesByLayer[params.get('layer') || ''] || stylesByLayer.O
  ;

  window.map = new maplibregl.Map({
    container: 'map',
    hash: 'map',
    style: style,
    attributionControl: {
      customAttribution: attribution,
    },
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-left');
  map.addControl(new maplibregl.FullscreenControl(), 'top-left');

  let languageCode = params.get('language');
  let language = new MapboxLanguage({
    defaultLanguage: languageCode,
    supportedLanguages: languageCode ? [languageCode] : undefined,
    languageSource: 'osm',
    getLanguageField: (languageCode) => {
      if (languageCode === 'mul') {
        return 'name';
      } else {
        // Optimistically follow the pattern in the tiler tag mapping without hard-coding the specific table columns.
        // https://github.com/OpenHistoricalMap/ohm-deploy/blob/main/images/tiler-server/config/languages.sql
        return 'name_' + languageCode.replace('-', '_').toLowerCase();
      }
    },
  });
  map.addControl(language);

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
    
    let date = params.get('date') || new Date();
    filterByDate(map, date);
  });

  addEventListener('hashchange', function (event) {
    upgradeLegacyHash();
    var oldParams = new URLSearchParams(new URL(event.oldURL).hash.substring(1));
    var newParams = new URLSearchParams(new URL(event.newURL).hash.substring(1));

    let oldLanguageCode = oldParams.get('language');
    let newLanguageCode = newParams.get('language');
    if (oldLanguageCode !== newLanguageCode) {
      if (!language.supportedLanguages.includes(newLanguageCode)) {
        // mapbox-gl-language assumes a limited set of language fields that is known in advance, as is the case with the Mapbox Streets source. But OHM tiles support hundreds of sparsely populated fields.
        language.supportedLanguages.push(newLanguageCode);
      }
      let newStyle = language.setLanguage(map.getStyle(), newLanguageCode);
      // Style diffing seems to miss changes to expression variable values for some reason.
      map.setStyle(newStyle, { diff: false });
    }

    if (newParams.get('start_date') || newParams.get('end_date')) {
      if (oldParams.get('start_date') !== newParams.get('start_date') ||
          oldParams.get('end_date') !== newParams.get('end_date')) {
        animate(map, newParams.get('start_date'), newParams.get('end_date'));
      }
      return;
    }
    
    var oldDate = oldParams.get('date');
    var newDate = newParams.get('date');
    if (oldDate !== newDate) {
      filterByDate(map, newDate || new Date());
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
    let oldDateRange = dateRangeFromISODate(isoDate);
    let oldDate = oldDateRange && oldDateRange.startDate;
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
