import { Pipe, PipeTransform } from '@angular/core';
import * as L from 'leaflet';

@Pipe({
  name: 'coordinates'
})
export class CoordinatesPipe implements PipeTransform {
  transform(value: { lat: number, lng: number }, map: L.Map | undefined): { x: number, y: number } {
    if (!map) return { x: 0, y: 0 };
    
    const point = map.latLngToLayerPoint(L.latLng(value.lat, value.lng));
    return {
      x: point.x,
      y: point.y
    };
  }
} 