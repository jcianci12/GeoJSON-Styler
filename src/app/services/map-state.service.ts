import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { point } from '../data/data.component';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapStateService {
  private pointsSubject = new BehaviorSubject<point[]>([]);
  private mapSubject = new BehaviorSubject<L.Map | null>(null);
  private featureGroupSubject = new BehaviorSubject<L.FeatureGroup | null>(null);

  // Observable streams
  points$ = this.pointsSubject.asObservable();
  map$ = this.mapSubject.asObservable();
  featureGroup$ = this.featureGroupSubject.asObservable();

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
} 