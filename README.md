# Embeddable Single-Year OpenHistoricalMap
Single year embed version of OHM default map style

This is a simple embeddable version of the OpenHistoricalMap default map style, with teh ability to select and display a single year via URL parameter.

The use case for this would be, for example, to embed map showing a specific place and time in a blog post about that place and time. The map is zoomable and pannable, but doesn't allow changing the year within the interface, such as is possible with the timeslider on openhistoricalmap.org.

The base URL of the embed is https://openhistoricalmap.github.io/ohm-embed-1yr/

## URL parameters

The URL has typical z/x/y parameters for map zoom and center. 

So a parameter like `#map=10/43.9367/12.5528` is zoom 10 showing San Marino in Italy, which is at `43.9367/12.5528` in `lon,lat` format of decimal degrees. [See the map.](https://openhistoricalmap.github.io/ohm-embed-1yr/#map=10/43.9367/12.5528)

Without a date parameter, the map shows everything in the OHM tiles for which there is a style specified. 

OHM-specific parameters:

* `date` is a valid YYYY, YYYY-MM, or YYYY-MM-DD date, but we allow the year to be a variable number of digits or negative, unlike ISO 8601-1. So here is San Marino in the year 1500 `#map=10/43.9367/12.5528&date=1500`. [See this map.](https://openhistoricalmap.github.io/ohm-embed-1yr/#map=10/43.9367/12.5528&date=1500)
* `layer` is one of `O`, `W`, or `J`. This allows the selection of alternative OHM-compatible styles currently offered on openhistoricalmap.org. The default OHM style is `O`. The Japanese Scroll style is `J`. The Woodblock style is `W`. Here is a query string for San Marino in 1500 in the Woodblock style: `#map=10/43.9367/12.5528&date=1500&layer=W`. [See this map](https://openhistoricalmap.github.io/ohm-embed-1yr/#map=10/43.9367/12.5528&date=1500&layer=W)

## Embedding

Simply use code like this to embed:
```html
    <iframe src="https://openhistoricalmap.github.io/ohm-embed-1yr/#map=10/43.9367/12.5528&date=1500&layer=O" height="500" width="100%" title="OpenHistoricalMap: San Marino in 1500"></iframe> 
```

Here's an [example iFrame](https://openhistoricalmap.github.io/ohm-embed-1yr/iframe-example.html).
