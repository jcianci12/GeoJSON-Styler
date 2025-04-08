import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Select } from '../../tableheaders.pipe';
import * as geojson from 'geojson';
import { FeatureCollectionLayer } from '../../featureCollection';
import { TableheadersPipe } from '../../tableheaders.pipe';
import { CSVtoJSONPipe } from '../../csvtojsonpipe';

export interface LatLngColumnMapping {
  latColumn: string;
  lngColumn: string;
}

@Component({
  selector: 'app-latlng-column',
  templateUrl: './latlng-column.component.html',
  styleUrls: ['./latlng-column.component.css']
})
export class LatLngColumnComponent {
  @Input() headers: Select[] = [];
  @Input() featurecollectionlayerindex!: number;
  @Input() featureCollectionLayers!: FeatureCollectionLayer[];
  @Output() columnMappingChange = new EventEmitter<LatLngColumnMapping>();
  @Output() testPoints = new EventEmitter<geojson.Feature<geojson.Point>[]>();

  selectedLatColumn: string = '';
  selectedLngColumn: string = '';

  constructor(
    private snackBar: MatSnackBar,
    private tableHeaders: TableheadersPipe,
    private csvToJson: CSVtoJSONPipe
  ) {}

  ngOnInit() {
    this.autoDetectColumns();
  }

  onFileAdded(files: FileList) {
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      const jsonData = this.csvToJson.csvJSON(csvData);
      
      if (jsonData && jsonData.length > 0) {
        // Convert the JSON data to the expected format (array of string arrays)
        const csvRows = [
          Object.keys(jsonData[0]), // Headers as first row
          ...jsonData.map(row => Object.values(row) as string[]) // Data rows
        ];
        
        // Update the feature collection layer with the CSV data
        this.featureCollectionLayers[this.featurecollectionlayerindex].styledata = csvRows;
        
        // Extract and set headers from the first row
        const headers = csvRows[0].map(header => ({
          value: header,
          viewValue: header
        }));
        this.headers = headers;
        
        // Auto-detect lat/lng columns
        this.autoDetectColumns();
      }
    };
    
    reader.readAsText(file);
  }

  autoDetectColumns() {
    // Auto-detect lat/lng columns based on common column names
    const latPatterns = ['lat', 'latitude', 'y'];
    const lngPatterns = ['lng', 'long', 'longitude', 'lon', 'x'];

    for (const header of this.headers) {
      const lowerHeader = header.value.toLowerCase();
      
      if (latPatterns.some(pattern => lowerHeader.includes(pattern)) && !this.selectedLatColumn) {
        this.selectedLatColumn = header.value;
      }
      
      if (lngPatterns.some(pattern => lowerHeader.includes(pattern)) && !this.selectedLngColumn) {
        this.selectedLngColumn = header.value;
      }
    }

    if (this.selectedLatColumn && this.selectedLngColumn) {
      this.emitMapping();
    }
  }

  onColumnChange() {
    if (this.selectedLatColumn && this.selectedLngColumn) {
      this.emitMapping();
    }
  }

  private emitMapping() {
    this.columnMappingChange.emit({
      latColumn: this.selectedLatColumn,
      lngColumn: this.selectedLngColumn
    });
  }

  addTestPoints() {
    const testPoints: geojson.Feature<geojson.Point>[] = [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [153.1466136, -27.6830342]
        },
        properties: {
          name: 'Test Point 1'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [153.0514866, -27.658187]
        },
        properties: {
          name: 'Test Point 2'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [153.0857745, -27.4815401]
        },
        properties: {
          name: 'Test Point 3'
        }
      }
    ];

    this.testPoints.emit(testPoints);
    this.snackBar.open('Test points added', 'OK', { duration: 2000 });
  }
} 