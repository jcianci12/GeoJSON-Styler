import {
  Feature,
  Geometry,
  GeoJsonProperties,
  BBox,
  FeatureCollection,
} from 'geojson';
import { stylerule } from './data/data.component';
import { GeoColumnMapping } from './data/geocolumn/geocolumn.component';
import { terms } from './featurefilter/featurefilter.component';
import * as geojson from 'geojson';

//the purpose of this class is so we dont need to work with the feature collection and the search terms in parrallel, we can set both here

export type LayerType = 'geojson' | 'csv';

export interface geocolumn {
  GEOColumn: string;
  GEOJSON: string;
}

export interface FeatureCollectionLayer {
  featureCollection: geojson.FeatureCollection;
  active: boolean;
  features: geojson.Feature[];
  stylerules: stylerule[];
  styledata: string[][];
  terms: terms;
  geocolumn: GeoColumnMapping;
  layerType: LayerType;
}

export class FeatureCollectionLayer implements GeoJSON.FeatureCollection {
  constructor(features: Feature<Geometry, GeoJsonProperties>[], terms: terms, stylerules: stylerule[], geo: GeoColumnMapping, styledata: string[][]) {
    this.features = features;
    this.type = 'FeatureCollection';
    this.terms = terms;
    this.active = true;
    this.stylerules = stylerules;
    this.styledata = styledata;
    this.geocolumn = geo;
    this.layerType = 'csv';
  }
  
  active: boolean;
  type: 'FeatureCollection';
  features: Feature<Geometry, GeoJsonProperties>[];
  bbox?: BBox | undefined;
  terms: terms;
  stylerules: stylerule[];
  styledata: string[][];
  geocolumn: GeoColumnMapping;
  layerType: LayerType;
}
