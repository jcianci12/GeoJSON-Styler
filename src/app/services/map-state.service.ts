import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as L from 'leaflet';
import * as geojson from 'geojson';
import { FeatureGroup } from 'leaflet';

export interface LayerInfo {
  id: string;
  name: string;
  type: 'geojson' | 'csv';
  visible: boolean;
  features: geojson.Feature[];
}

export interface Point {
  id: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapStateService {
  private mapSubject = new BehaviorSubject<L.Map | null>(null);
  private featureGroupSubject = new BehaviorSubject<L.FeatureGroup | null>(null);
  private layersSubject = new BehaviorSubject<LayerInfo[]>([]);
  private layerVisibilitySubject = new BehaviorSubject<LayerInfo[]>([]);
  private pointsSubject = new BehaviorSubject<Point[]>([]);
  private _points: Point[] = [];

  // Observable streams
  map$ = this.mapSubject.asObservable();
  featureGroup$ = this.featureGroupSubject.asObservable();
  layers$ = this.layersSubject.asObservable();
  layerVisibility$ = this.layerVisibilitySubject.asObservable();
  points$ = this.pointsSubject.asObservable();

  // Getters
  get map(): L.Map | null {
    return this.mapSubject.value;
  }

  get featureGroup(): L.FeatureGroup | null {
    return this.featureGroupSubject.value;
  }

  get layers(): LayerInfo[] {
    return this.layersSubject.value;
  }

  get points(): Point[] {
    return this._points;
  }

  // Setters
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

  updateLayerFeatures(layerId: string, features: geojson.Feature[]): void {
    const currentLayers = this.layers;
    const updatedLayers = currentLayers.map(layer => 
      layer.id === layerId ? { ...layer, features } : layer
    );
    this.layersSubject.next(updatedLayers);
  }

  toggleLayerVisibility(layerId: string): void {
    const currentLayers = this.layers;
    const updatedLayers = currentLayers.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    this.layersSubject.next(updatedLayers);
    this.layerVisibilitySubject.next(updatedLayers);
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

  updatePoints(points: Point[]): void {
    this._points = points;
    this.pointsSubject.next(points);
  }
} 