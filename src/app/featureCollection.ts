import {
  Feature,
  Geometry,
  GeoJsonProperties,
  BBox,
  FeatureCollection,
} from 'geojson';
import { stylerule } from './data/data.component';
import { GeoColumnMapping } from './data/geocolumn/geocolumn.component';
import { terms } from './suburbfilter/suburbfilter.component';

//the purpose of this class is so we dont need to work with the feature collection and the search terms in parrallel, we can set both here

export class FeatureCollectionLayer implements GeoJSON.FeatureCollection {
  constructor(features: Feature<Geometry, GeoJsonProperties>[], terms: terms,stylerules:stylerule[],geo:GeoColumnMapping) {
    (this.features = features), (this.type = 'FeatureCollection');
    this.terms = terms;
    this.active = true
    this.stylerules = stylerules
    this.styledata = []
    this.geocolumn = geo
  }
  active:boolean
  type: 'FeatureCollection';
  features: Feature<Geometry, GeoJsonProperties>[];
  bbox?: BBox | undefined;
  terms: terms;
  stylerules:stylerule[]
  styledata:string[][]
  geocolumn:GeoColumnMapping
}
