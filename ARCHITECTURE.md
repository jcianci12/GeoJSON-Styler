# GeoJSON-Styler Architecture

## Overview
GeoJSON-Styler is an Angular application that allows users to style and visualize geographic data on a map. The application supports both GeoJSON polygon data and CSV point data, with flexible styling options.

## Core Components

### 1. App Component (`app.component`)
- Main application container
- Manages the map and layer system
- Handles layer addition/removal
- Coordinates between map and data components

### 2. Map Component (`map.component`)
- Renders the interactive map using Leaflet
- Handles map interactions (zoom, pan)
- Manages layer rendering
- Supports both polygon and point data visualization

### 3. Data Component (`data.component`)
- Manages data input and styling for each layer
- Handles two types of data sources:
  - GeoJSON files (polygons)
  - CSV files (points or styling data)
- Provides interface for:
  - File uploads
  - Column mapping
  - Style rule configuration

### 4. File Upload Component (`fileupload.component`)
- Handles file selection and validation
- Supports multiple file types (GeoJSON, CSV)
- Emits file data to parent components

### 5. GeoJSON Selector Component (`geojsonselector.component`)
- Manages GeoJSON file upload and parsing
- Validates GeoJSON structure
- Integrates with feature collection service

## Data Flow

1. **Data Input**
   - Users upload GeoJSON or CSV files
   - Files are processed and validated
   - Data is converted to internal format

2. **Data Processing**
   - CSV data is parsed and column headers are extracted
   - GeoJSON features are validated and stored
   - Column mappings are established for styling

3. **Styling**
   - Users configure style rules (color, opacity, text)
   - Rules are applied to features based on data values
   - Style configurations are stored with feature data

4. **Rendering**
   - Features are converted to Leaflet layers
   - Styles are applied to layers
   - Layers are added to the map

## Services

### Feature Collection Service (`featurecollection.service`)
- Manages the collection of geographic features
- Provides observable data streams
- Handles feature updates and modifications

## Data Models

### Feature Collection Layer
```typescript
interface FeatureCollectionLayer {
  features: Feature[];
  type: 'FeatureCollection';
  active: boolean;
  terms: Terms;
  stylerules: StyleRule[];
  styledata: string[][];
  geocolumn: GeoColumnMapping;
}
```

## Dependencies
- Angular
- Leaflet
- GeoJSON
- Material Design Components

## Future Enhancements
1. Support for additional data formats
2. Enhanced styling options
3. Data export capabilities
4. Layer interaction improvements 