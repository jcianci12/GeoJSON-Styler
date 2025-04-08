import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Select } from '../../tableheaders.pipe';
import * as geojson from 'geojson';

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
  @Output() columnMappingChange = new EventEmitter<LatLngColumnMapping>();
  @Output() testPoints = new EventEmitter<geojson.Feature<geojson.Point>[]>();

  selectedLatColumn: string = '';
  selectedLngColumn: string = '';

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit() {
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