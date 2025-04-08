import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class CoordinateService {
  private map: L.Map | null = null;

  setMap(map: L.Map) {
    this.map = map;
  }

  latLngToPoint(lat: number, lng: number): L.Point {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    return this.map.latLngToLayerPoint(L.latLng(lat, lng));
  }

  pointToLatLng(point: L.Point): L.LatLng {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    return this.map.layerPointToLatLng(point);
  }
} 