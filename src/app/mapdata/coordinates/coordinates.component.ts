import { Component, Input } from '@angular/core';
import * as L from 'leaflet';
import { Point } from '../../services/map-state.service';

@Component({
  selector: 'app-coordinates',
  template: `
    <td>{{ point.id }}</td>
    <td>{{ point.lat }}</td>
    <td>{{ point.lng }}</td>
    <td>{{ { lat: point.lat, lng: point.lng } | coordinates:map }}</td>
  `
})
export class CoordinatesComponent {
  @Input() point!: Point;
  @Input() map!: L.Map;
} 