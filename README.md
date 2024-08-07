# Embeddable OpenHistoricalMap
Embed version of OHM default map style

This is a simple embeddable version of the OpenHistoricalMap default map style, with the ability to select and display a single year via URL parameter or animate across a timespan. The map responds to gestures interactively, but the dates can only be adjusted via the URL.

The use case for this would be, for example, to embed map showing a specific place and time in a blog post about that place and time. The map is zoomable and pannable, but doesn't allow changing the year within the interface, such as is possible with the timeslider on openhistoricalmap.org.

The base URL of the embed is https://embed.openhistoricalmap.org/

## URL parameters

The URL has typical z/x/y parameters for map zoom and center.

So a parameter like `#map=10/43.9367/12.5528` is zoom 10 showing San Marino in Italy, which is at `43.9367/12.5528` in `lon,lat` format of decimal degrees. [See the map.](https://embed.openhistoricalmap.org/#map=10/43.9367/12.5528)

An embedded map is typically of a different size and aspect ratio from the original and thus must be scaled in order to cover a comparable area. This is accomplished by passing the original map's bounding box in the hash as `&bbox=minlon,minlat,maxlon,maxlat`. Once the embedded map gets its initial framing from the `bbox` the normal hash mechanism takes over. The San Marino example could be bounded by appending `&bbox=12.321338653564453,43.86782687726672,12.58037567138672,44.008373185063874` to the URL. [See this map.](https://embed.openhistoricalmap.org/#map=10/43.9367/12.5528&bbox=12.321338653564453,43.86782687726672,12.58037567138672,44.008373185063874)

### Dates

Without a date parameter, the map shows everything in the OHM tiles for which there is a style specified. 

OHM-specific parameters:

* `date` is a valid YYYY, YYYY-MM, or YYYY-MM-DD date, but we allow the year to be a variable number of digits or negative, unlike ISO 8601-1. So here is San Marino in the year 1500 `#map=10/43.9367/12.5528&date=1500`. [See this map.](https://embed.openhistoricalmap.org/#map=10/43.9367/12.5528&date=1500)
* `layer` selects one of the OHM-compatible styles currently offered on openhistoricalmap.org:

Map layer | `layer` | Example
----|:--:|----
Historical | `O` | [New York in 1700](https://embed.openhistoricalmap.org/#map=18/40.70486/-74.01313&date=1700&layer=O)
Railway | `R` | [Sydney in 1924](https://embed.openhistoricalmap.org/#map=14/-33.8677/151.2105&date=1924&layer=R)
Woodblock | `W` | [San Marino in 1500](https://embed.openhistoricalmap.org/#map=10/43.9367/12.5528&date=1500&layer=W)
Japanese Scroll | `J` | [Osaka in 1970](https://embed.openhistoricalmap.org/#map=13/34.6914/135.5011&date=1970&layer=J)

The map can optionally animate if you specify the following parameters:

* `start_date` is the initial value of `date` at the beginning of the animation. If you also specify `date`, the `start_date` is ignored in favor of `date`.
* `end_date` is the final value of `date` at the end of the animation.
* `interval` is the difference in the dates depicted by any two consecutive frames of the animation, expressed as an ISO&nbsp;8601-1 duration. For example, `P10Y6M1D` advances each frame by 10&nbsp;years, 6&nbsp;months, and 1&nbsp;day, while `-P10Y6M1D` turns back the clock by 10&nbsp;years, 6&nbsp;months, and 1&nbsp;day on each frame. This parameter only supports years, months, and/or days. By default, the animation advances by one year at a time.
* `framerate` is the frequency of the animation measured in hertz, defaulting to `1` (1 hertz, or 1 frame per second).

## Embedding

Simply use code like this to embed:
```html
    <iframe src="https://embed.openhistoricalmap.org/#map=10/43.9367/12.5528&date=1500&layer=O" height="500" width="100%" title="OpenHistoricalMap: San Marino in 1500"></iframe> 
```

Here's an [example iFrame](https://embed.openhistoricalmap.org/iframe-example.html).

## Feedback

Please submit bug reports and feature requests to [OpenHistoricalMap’s central issue tracker](https://github.com/OpenHistoricalMap/issues/issues/), noting “OpenHistoricalMap embed” somewhere in the title or description. 
