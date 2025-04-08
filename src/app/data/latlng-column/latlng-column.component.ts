import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Select } from '../../tableheaders.pipe';
import * as geojson from 'geojson';
import { FeatureCollectionLayer } from '../../featureCollection';
import { TableheadersPipe } from '../../tableheaders.pipe';
import { CSVtoJSONPipe } from '../../csvtojsonpipe';
import { LatLngColumnMapping } from './latlng-column-mapping';
import { FileHandlerService } from '../../services/file-handler.service';
import { MapStateService } from '../../services/map-state.service';

@Component({
  selector: 'app-latlng-column',
  templateUrl: './latlng-column.component.html',
  styleUrls: ['./latlng-column.component.css']
})
export class LatLngColumnComponent {
  @Input() headers: Select[] = [];
  @Input() featurecollectionlayerindex!: number;
  @Input() featureCollectionLayers!: FeatureCollectionLayer[];
  
  selectedLatColumn: string = '';
  selectedLngColumn: string = '';
  rowCount: number = 0;
  showPreview: boolean = false;
  csvData: string = '';
  
  @Output() columnMappingChange = new EventEmitter<LatLngColumnMapping>();
  
  private csvToJson = new CSVtoJSONPipe();
  private tableHeaders = new TableheadersPipe();

  constructor(
    private snackBar: MatSnackBar,
    private fileHandler: FileHandlerService,
    private mapState: MapStateService
  ) {}

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  onFileAdded(files: FileList) {
    const file = files[0];
    
    this.fileHandler.processCSVFile(file)
      .then(result => {
        this.csvData = result.csvData;
        this.headers = result.headers;
        this.rowCount = result.rowCount;
        
        // Update the feature collection layer with the CSV data
        this.featureCollectionLayers = this.fileHandler.updateFeatureCollectionLayer(
          this.featureCollectionLayers,
          this.featurecollectionlayerindex,
          result.csvRows
        );
        
        // Auto-detect lat/lng columns
        this.autoDetectColumns();
      })
      .catch(error => {
        this.snackBar.open('Error processing CSV file: ' + error.message, 'OK', { duration: 3000 });
      });
  }

  private autoDetectColumns() {
    const latPatterns = ['lat', 'latitude', 'y'];
    const lngPatterns = ['lng', 'long', 'longitude', 'lon', 'x'];
    
    this.selectedLatColumn = this.headers.find(h => 
      latPatterns.some(pattern => h.value.toLowerCase().includes(pattern))
    )?.value || '';
    
    this.selectedLngColumn = this.headers.find(h => 
      lngPatterns.some(pattern => h.value.toLowerCase().includes(pattern))
    )?.value || '';
    
    if (this.selectedLatColumn && this.selectedLngColumn) {
      this.onColumnChange();
    }
  }

  onColumnChange() {
    if (this.selectedLatColumn && this.selectedLngColumn) {
      // Emit the column mapping change
      this.columnMappingChange.emit({
        latColumn: this.selectedLatColumn,
        lngColumn: this.selectedLngColumn
      });

      // Create and update features
      const csvData = this.featureCollectionLayers[this.featurecollectionlayerindex].styledata;
      if (!csvData || csvData.length < 2) {
        this.snackBar.open('No CSV data available', 'OK', { duration: 3000 });
        return;
      }

      const headers = csvData[0];
      const latIndex = headers.indexOf(this.selectedLatColumn);
      const lngIndex = headers.indexOf(this.selectedLngColumn);

      if (latIndex === -1 || lngIndex === -1) {
        this.snackBar.open('Could not find selected columns in data', 'OK', { duration: 3000 });
        return;
      }

      const features: geojson.Feature<geojson.Point>[] = csvData.slice(1)
        .map((row: string[]) => {
          const lat = parseFloat(row[latIndex]);
          const lng = parseFloat(row[lngIndex]);

          if (isNaN(lat) || isNaN(lng)) return null;

          const properties: { [key: string]: any } = {};
          headers.forEach((header, index) => {
            if (index !== latIndex && index !== lngIndex) {
              properties[header] = row[index];
            }
          });

          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            properties
          } as geojson.Feature<geojson.Point>;
        })
        .filter((feature): feature is geojson.Feature<geojson.Point> => feature !== null);

      // Initialize the layer if it doesn't exist
      const layerId = `layer-${this.featurecollectionlayerindex}`;
      const layer = this.mapState.layers.find(l => l.id === layerId);
      if (!layer) {
        this.mapState.addLayer({
          id: layerId,
          name: `CSV Layer ${this.featurecollectionlayerindex}`,
          type: 'csv',
          visible: true,
          features: []
        });
      }

      // Update the layer features
      this.mapState.updateLayerFeatures(layerId, features);
      
      // Show success message with feature count
      const totalRows = csvData.length - 1;
      const validRows = features.length;
      this.snackBar.open(`Added ${validRows} points out of ${totalRows} rows`, 'OK', { duration: 3000 });
    }
  }

  addTestPoints() {
    if (!this.selectedLatColumn || !this.selectedLngColumn) {
      this.snackBar.open('Please select both latitude and longitude columns', 'OK', { duration: 3000 });
      return;
    }

    const csvData = this.featureCollectionLayers[this.featurecollectionlayerindex].styledata;
    if (!csvData || csvData.length < 2) {
      this.snackBar.open('No CSV data available', 'OK', { duration: 3000 });
      return;
    }

    const headers = csvData[0];
    // Find the indices of the selected columns
    const latIndex = headers.indexOf(this.selectedLatColumn);
    const lngIndex = headers.indexOf(this.selectedLngColumn);

    if (latIndex === -1 || lngIndex === -1) {
      this.snackBar.open('Could not find selected columns in data', 'OK', { duration: 3000 });
      return;
    }

    const features: geojson.Feature<geojson.Point>[] = csvData.slice(1)
      .map((row: string[]) => {
        const lat = parseFloat(row[latIndex]);
        const lng = parseFloat(row[lngIndex]);

        if (isNaN(lat) || isNaN(lng)) return null;

        // Create properties object with all columns except lat/lng
        const properties: { [key: string]: any } = {};
        headers.forEach((header, index) => {
          if (index !== latIndex && index !== lngIndex) {
            properties[header] = row[index];
          }
        });

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties
        } as geojson.Feature<geojson.Point>;
      })
      .filter((feature): feature is geojson.Feature<geojson.Point> => feature !== null);

    // Initialize the layer if it doesn't exist
    const layerId = `layer-${this.featurecollectionlayerindex}`;
    const layer = this.mapState.layers.find(l => l.id === layerId);
    if (!layer) {
      this.mapState.addLayer({
        id: layerId,
        name: `CSV Layer ${this.featurecollectionlayerindex}`,
        type: 'csv',
        visible: true,
        features: []
      });
    }

    // Update the layer features
    this.mapState.updateLayerFeatures(layerId, features);
    
    // Show success message with feature count
    const totalRows = csvData.length - 1;
    const validRows = features.length;
    this.snackBar.open(`Added ${validRows} points out of ${totalRows} rows`, 'OK', { duration: 3000 });
  }
} 