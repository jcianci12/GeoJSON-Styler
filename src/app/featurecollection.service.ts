import { Injectable } from '@angular/core';
import { Feature } from 'geojson';
import { BehaviorSubject, Subject } from 'rxjs';
import { FeatureCollectionLayer } from './featureCollection';

@Injectable({
  providedIn: 'root',
})
export class FeaturecollectionService {
  FeatureCollectionLayerObservable: BehaviorSubject<FeatureCollectionLayer[]> = new BehaviorSubject<FeatureCollectionLayer[]>([]);
  FeatureCollectionLayers: FeatureCollectionLayer[] | undefined;

  constructor() {
    this.FeatureCollectionLayerObservable.subscribe((i) => (this.FeatureCollectionLayers = i));
  }

  public UpdateLayer(featureCollectionLayer: FeatureCollectionLayer, Index: number) {
    if (this.FeatureCollectionLayers) {
      this.FeatureCollectionLayers[Index] = featureCollectionLayer;
      this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers);

    }
  }
}
