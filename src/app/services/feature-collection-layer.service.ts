import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FeatureCollectionLayer } from '../featureCollection';

@Injectable({
  providedIn: 'root'
})
export class FeatureCollectionLayerService {
  private featureCollectionLayerSubject = new BehaviorSubject<FeatureCollectionLayer | null>(null);
  FeatureCollectionLayerObservable: Observable<FeatureCollectionLayer | null> = this.featureCollectionLayerSubject.asObservable();

  updateFeatureCollectionLayer(featureCollectionLayer: FeatureCollectionLayer) {
    this.featureCollectionLayerSubject.next(featureCollectionLayer);
  }
} 