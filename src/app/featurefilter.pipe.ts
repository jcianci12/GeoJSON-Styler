import { Pipe, PipeTransform } from '@angular/core';
import { Feature } from 'geojson';
import { featureGroup } from 'leaflet';
import { FeatureCollectionLayer } from './featureCollection';
import { terms } from './suburbfilter/suburbfilter.component';

@Pipe({
  name: 'featurefilter',
  pure:false
})
export class FeaturefilterPipe implements PipeTransform {
  transform(
    FeatureCollection: FeatureCollectionLayer,
    triggerval: number
  ): GeoJSON.FeatureCollection {
    if (FeatureCollection.terms) {
      FeatureCollection.terms = this.cleanTerms(FeatureCollection.terms);
    }
    if (terms) {
      let r = {
        features: this.getMatchingFeatures(
          FeatureCollection.features,
          FeatureCollection.terms
        ),
        type: FeatureCollection?.type,
      };
      return r;
    } else {
      return FeatureCollection;
    }

    //GeoJSON.FeatureCollection r;
    //return {features:[]};
    // return FeatureCollection.features?.filter((i) =>
    //   i.properties!['loc_pid'].toString().startsWith(term)
    // )??[];
  }
  getMatchingFeatures(
    features: Feature[],
    terms: terms | null | undefined
  ): Feature[] {
    //let f: Feature[] = features.reduce((p: Feature[], c) => p, []);
    if (terms) {
      features = features.filter((f) => {
        let matches = terms.terms.filter((t) => {
          return this.match(f, t.key, t.phrase.toLowerCase());
        });

        if (matches.length == terms.terms.length) {
          return true;
        } else {
          return false;
        }
      });
    }

    //loop through all the features

    //do the following on each feature

    //loop through the populated search terms

    //for each search term, check if the feature matches all the terms

    return features;
  }

  match(feature: Feature, term: string, query: string) {
    if (
      feature.properties &&
      feature.properties[term].toString().toLowerCase().startsWith(query)
    ) {
      return true;
    } else {
      return false;
    }
  }

  //removes empty search terms
  cleanTerms(termsval: terms): terms  {
    if (termsval) {
      let t = termsval.terms.filter((term) => term.phrase);
      termsval.terms = t;
      return termsval;
    } else {
      return new terms();
    }
  }
}
