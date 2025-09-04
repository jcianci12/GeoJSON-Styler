Have you ever wanted to style map polygons based on some arbitrary data? eg: population by suburb, and colour and opacity from the count?

This application allows you to choose your geojson polygons (such as suburbs) and some styling data (like text, colour, opacity) and render it on a map.

## Features

- **GeoJSON Styling**: Style polygons based on CSV data with custom colors, opacity, and text labels
- **Drawing Tools**: Draw, edit, and duplicate polygons directly on the map
- **Progressive Loading**: Handle large datasets with optimized rendering
- **Layer Management**: Organize and manage multiple data layers
- **Real-time Updates**: See changes immediately as you modify styling rules

## Drawing Features

The application now includes powerful drawing capabilities:

- **Draw Polygons**: Click "Start Drawing" and use the drawing tools to create new polygons
- **Edit Polygons**: Select existing polygons and modify their shape using the edit tools
- **Duplicate Polygons**: Select a polygon and create an exact copy with a different color
- **Clear All**: Remove all drawn polygons with a single click

## Getting Started

You can test out this angular application here:

https://jcianci12.github.io/GeoJSON-Styler/

For a detailed explanation of the application's architecture and components, see [ARCHITECTURE.md](ARCHITECTURE.md).

![plot](https://www.tekonline.com.au/wp-content/uploads/2022/10/image.png)

This app is written in angular. Run `npm i` to install dependencies and then `ng serve` to serve the app on port 4200 :)
