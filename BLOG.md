# Building a Styled Regional Map with GeoJSON-Styler

**Date:** July 2026

We needed a styled map showing local government areas across a specific region, with different colours and labels for each area. The source data was a 209-feature GeoJSON file containing detailed boundary polygons.

## The Problem

Loading a raw GeoJSON file with hundreds of complex polygon features into a browser map is slow. Creating a 50,000+ vertex SVG layer freezes the browser. Applying per-feature colours and text labels from a spreadsheet adds complexity. And once styled, panning and zooming the map needs to stay smooth.

## The Approach

We used **GeoJSON-Styler**, an open-source browser tool, to:

1. **Upload** the boundary GeoJSON (auto-detects geometry type and feature count)
2. **Paste styling data** — a simple tab-separated table mapping each area name to a colour
3. **Join** the styling data to the GeoJSON using a shared property column
4. **Apply style rules** — fill colour, opacity, and text labels — all driven by the spreadsheet data
5. **Toggle rendering** when ready — features stay hidden until you check "Active"

## Under the Hood

The app processes large files efficiently:

- **Web Worker parsing** — JSON parsing runs off the main thread so the UI stays responsive
- **Canvas rendering** — all 74,000+ vertices render to a single canvas element instead of thousands of DOM nodes
- **Viewport-aware** — overlay hides during panning and re-renders only when you stop
- **Change detection isolation** — map events run outside the application framework's change cycle

## The Result

The final map shows 20+ styled areas with fill colours, semi-transparent overlays, and text labels. Filters ensure only areas with matching styling data appear on the map. Pan and zoom remain smooth at 50-60fps.

The tool is available at [jcianci12.github.io/GeoJSON-Styler](https://jcianci12.github.io/GeoJSON-Styler/).

---

*Built with Angular, Leaflet, and the Canvas renderer.*
