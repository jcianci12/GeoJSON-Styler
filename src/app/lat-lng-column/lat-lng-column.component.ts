import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as geojson from 'geojson';

@Component({
  selector: 'app-lat-lng-column',
  templateUrl: './lat-lng-column.component.html',
  styleUrls: ['./lat-lng-column.component.css']
})
export class LatLngColumnComponent {
  @Input() csvData: string = '';
  @Input() headers: string[] = [];
  
  @Output() testPoints = new EventEmitter<geojson.Feature<geojson.Point, geojson.GeoJsonProperties>[]>();

  latColumn: string = '';
  lngColumn: string = '';

  onColumnChange() {
    if (!this.latColumn || !this.lngColumn) return;

    const features: geojson.Feature<geojson.Point, geojson.GeoJsonProperties>[] = [];
    const rows = this.csvData.split('\n');
    const headerRow = rows[0].split(',');
    const latIndex = headerRow.indexOf(this.latColumn);
    const lngIndex = headerRow.indexOf(this.lngColumn);

    if (latIndex === -1 || lngIndex === -1) return;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(',');
      const lat = parseFloat(row[latIndex]);
      const lng = parseFloat(row[lngIndex]);

      if (isNaN(lat) || isNaN(lng)) continue;

      const properties: { [key: string]: any } = {};
      headerRow.forEach((header, index) => {
        if (index !== latIndex && index !== lngIndex) {
          properties[header] = row[index];
        }
      });

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties
      });
    }

    this.testPoints.emit(features);
  }
} 