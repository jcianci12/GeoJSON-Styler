import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { point } from '../data/data.component';
import * as L from 'leaflet';

export interface LayerInfo {
  id: string;
  name: string;
  type: 'geojson' | 'csv';
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MapStateService {
  private pointsSubject = new BehaviorSubject<point[]>([]);
  private mapSubject = new BehaviorSubject<L.Map | null>(null);
  private featureGroupSubject = new BehaviorSubject<L.FeatureGroup | null>(null);
  private layersSubject = new BehaviorSubject<LayerInfo[]>([]);

  // Observable streams
  points$ = this.pointsSubject.asObservable();
  map$ = this.mapSubject.asObservable();
  featureGroup$ = this.featureGroupSubject.asObservable();
  layers$ = this.layersSubject.asObservable();
  layerVisibility$ = this.layersSubject.asObservable();

  // Getters
  get points(): point[] {
    return this.pointsSubject.value;
  }

  get map(): L.Map | null {
    return this.mapSubject.value;
  }

  get featureGroup(): L.FeatureGroup | null {
    return this.featureGroupSubject.value;
  }

  get layers(): LayerInfo[] {
    return this.layersSubject.value;
  }

  // Setters
  setPoints(points: point[]): void {
    this.pointsSubject.next(points);
  }

  setMap(map: L.Map): void {
    this.mapSubject.next(map);
  }

  setFeatureGroup(featureGroup: L.FeatureGroup): void {
    this.featureGroupSubject.next(featureGroup);
  }

  addLayer(layer: LayerInfo): void {
    const currentLayers = this.layers;
    if (!currentLayers.find(l => l.id === layer.id)) {
      this.layersSubject.next([...currentLayers, layer]);
    }
  }

  removeLayer(layerId: string): void {
    const currentLayers = this.layers;
    this.layersSubject.next(currentLayers.filter(layer => layer.id !== layerId));
  }

  toggleLayerVisibility(layerId: string): void {
    const currentLayers = this.layers;
    const updatedLayers = currentLayers.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    this.layersSubject.next(updatedLayers);
  }

  // Point management methods
  addPoint(point: point): void {
    const currentPoints = this.points;
    const existingPointIndex = currentPoints.findIndex(p => 
      p.getLatLng().equals(point.getLatLng())
    );

    if (existingPointIndex === -1) {
      this.setPoints([...currentPoints, point]);
    } else {
      const updatedPoints = [...currentPoints];
      updatedPoints[existingPointIndex] = point;
      this.setPoints(updatedPoints);
    }
  }

  removePoint(point: point): void {
    const currentPoints = this.points;
    this.setPoints(currentPoints.filter(p => !p.getLatLng().equals(point.getLatLng())));
  }

  clearPoints(): void {
    this.setPoints([]);
  }

  // Map management methods
  updateMapBounds(bounds: L.LatLngBounds): void {
    if (this.map) {
      this.map.fitBounds(bounds);
    }
  }

  // Feature group management
  addLayerToFeatureGroup(layer: L.Layer): void {
    if (this.featureGroup) {
      this.featureGroup.addLayer(layer);
    }
  }

  removeLayerFromFeatureGroup(layer: L.Layer): void {
    if (this.featureGroup) {
      this.featureGroup.removeLayer(layer);
    }
  }

  clearFeatureGroup(): void {
    if (this.featureGroup) {
      this.featureGroup.clearLayers();
    }
  }

  updateLayerVisibility(id: string, visible: boolean) {
    const currentLayers = this.layers;
    const updatedLayers = currentLayers.map(layer => 
      layer.id === id ? { ...layer, visible } : layer
    );
    this.layersSubject.next(updatedLayers);
  }
} 