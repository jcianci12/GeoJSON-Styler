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
  lat: number;
  lng: number;
  x: number;
  y: number;
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
    return this.pointsSubject.value;
  }

  // Setters
  setMap(map: L.Map): void {
    this.mapSubject.next(map);
  }

  setFeatureGroup(featureGroup: L.FeatureGroup): void {
    this.featureGroupSubject.next(featureGroup);
  }

  // Layer management
  private updateLayers(updater: (layers: LayerInfo[]) => LayerInfo[]): void {
    const currentLayers = this.layers;
    const updatedLayers = updater(currentLayers);
    this.layersSubject.next(updatedLayers);
  }

  addLayer(layer: LayerInfo): void {
    this.updateLayers(layers => {
      if (!layers.find(l => l.id === layer.id)) {
        return [...layers, layer];
      }
      return layers;
    });
  }

  removeLayer(layerId: string): void {
    this.updateLayers(layers => layers.filter(layer => layer.id !== layerId));
  }

  updateLayerFeatures(layerId: string, features: geojson.Feature[]): void {
    this.updateLayers(layers => 
      layers.map(layer => 
        layer.id === layerId ? { ...layer, features } : layer
      )
    );
  }

  toggleLayerVisibility(layerId: string): void {
    this.updateLayers(layers => 
      layers.map(layer => 
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
    this.layerVisibilitySubject.next(this.layers);
  }

  // Feature group management
  private withFeatureGroup(action: (group: L.FeatureGroup) => void): void {
    if (this.featureGroup) {
      action(this.featureGroup);
    }
  }

  addLayerToFeatureGroup(layer: L.Layer): void {
    this.withFeatureGroup(group => group.addLayer(layer));
  }

  removeLayerFromFeatureGroup(layer: L.Layer): void {
    this.withFeatureGroup(group => group.removeLayer(layer));
  }

  clearFeatureGroup(): void {
    this.withFeatureGroup(group => group.clearLayers());
  }

  // Points management
  updatePoints(points: Point[]): void {
    this.pointsSubject.next(points);
  }
} 