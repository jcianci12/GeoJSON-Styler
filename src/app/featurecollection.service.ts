import { Injectable } from '@angular/core';
import { Feature, FeatureCollection } from 'geojson';
import { BehaviorSubject, Subject } from 'rxjs';
import { FeatureCollectionLayer } from './featureCollection';
import { stylerule } from './data/data.component';
import { LatLngColumnMapping } from './data/latlng-column/latlng-column-mapping';
import { CSVtoJSONPipe } from './csvtojsonpipe';

@Injectable({
  providedIn: 'root',
})
export class FeaturecollectionService {
  FeatureCollectionLayerObservable: BehaviorSubject<FeatureCollectionLayer[]> = new BehaviorSubject<FeatureCollectionLayer[]>([]);
  FeatureCollectionLayers: FeatureCollectionLayer[] | undefined;

  constructor() {
    this.FeatureCollectionLayerObservable.subscribe((i) => (this.FeatureCollectionLayers = i));
  }

  updateActive(event: any, index: number) {
    if (this.FeatureCollectionLayers) {
      this.FeatureCollectionLayers[index].active = event.checked;
      this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers);
    }
  }

  onLayerTypeChange(index: number) {
    if (this.FeatureCollectionLayers) {
      const layer = this.FeatureCollectionLayers[index];
      if (layer.layerType === 'csv') {
        // Initialize CSV-specific properties
        layer.styledata = [];
        layer.features = [];
        layer.stylerules = [];
      }
      this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers);
    }
  }

  removeLayer(index: number) {
    if (this.FeatureCollectionLayers) {
      this.FeatureCollectionLayers.splice(index, 1);
      this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers);
    }
  }

  addLayer() {
    let l = new FeatureCollectionLayer(
      [],
      {
        terms: [],
        triggerval: 0,
      },
      [],
      { GEOColumn: "qld_loca_2", GEOJSON: "suburb" },
      []
    );

    if (this.FeatureCollectionLayers) {
      this.FeatureCollectionLayers.push(l);
      this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers);
    }
  }

  addLayerFromGeoJSON(features: Feature[]) {
    let l = new FeatureCollectionLayer(
      features,
      {
        terms: [],
        triggerval: 0,
      },
      [],
      { GEOColumn: "qld_loca_2", GEOJSON: "suburb" },
      []
    );

    if (this.FeatureCollectionLayers) {
      this.FeatureCollectionLayers.push(l);
      this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers);
    }
  }

  onLatLngColumnsSelected(index: number, mapping: LatLngColumnMapping) {
    if (this.FeatureCollectionLayers) {
      const layer = this.FeatureCollectionLayers[index];
      if (layer.layerType === 'csv') {
        // Update the layer with the new column mapping
        layer.geocolumn = {
          GEOColumn: mapping.lngColumn,
          GEOJSON: mapping.latColumn
        };
        this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers);
      }
    }
  }

  //loop through all the feature collection layers and returns a geo json object with all the features and styling rules added.
  getGeoJsonForAllLayers(): FeatureCollection {
    if (!this.FeatureCollectionLayers || this.FeatureCollectionLayers.length === 0) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    const allFeatures: Feature[] = [];
    
    // Loop through all layers and collect their features
    this.FeatureCollectionLayers.forEach((layer, index) => {
      if (layer.active) { // Only include active layers
        const layerGeoJson = this.getGeoJsonForLayer(index);
        allFeatures.push(...layerGeoJson.features);
      }
    });

    return {
      type: 'FeatureCollection',
      features: allFeatures
    };
  }

  //returns the geojson for the feature collection layer. uses the styling rules to add styling to the geojson.
  getGeoJsonForLayer(layerIndex: number): FeatureCollection {
    if (!this.FeatureCollectionLayers || this.FeatureCollectionLayers.length === 0) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    const layer = this.FeatureCollectionLayers[layerIndex];
    if (!layer) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    // Apply styling rules to all features
    const styledFeatures = layer.features.map((feature) => {
      const styledFeature = { ...feature };
      
      // Apply styling rules to the feature properties
      layer.stylerules.forEach((rule) => {
        if (styledFeature.properties) {
          // Check if this is a dynamic rule (looks up values from styledata)
          console.log(`[DEBUG] Processing rule: ${rule.ruletype.rulename}, dynamic: ${rule.ruletype.dynamic}, column: ${rule.column}`);
          console.log(`[DEBUG] Available feature properties:`, Object.keys(styledFeature.properties || {}));
          console.log(`[DEBUG] Feature properties values:`, styledFeature.properties);
          
          if (rule.ruletype.dynamic && layer.styledata) {
            console.log(`[DEBUG] Dynamic rule detected - looking up value from styledata`);
            // For dynamic rules, we need to look up the value from styledata
            // The rule.column contains the column name to match against
            // We need to find the matching row in styledata and get the value
            const styledataRows = new CSVtoJSONPipe().csvJSON(layer.styledata as any);
            console.log(`[DEBUG] Styledata headers:`, styledataRows[0]);
            const matchColumnIndex = styledataRows[0].indexOf(rule.column);
            
            console.log(`[DEBUG] Match column index: ${matchColumnIndex}, styledata rows: ${styledataRows.length}`);
            
            if (matchColumnIndex !== -1) {
              
              const featureValue = styledFeature.properties[layer.geocolumn.GEOJSON];
              // Lookup the value from the csv data, csvdata[matchinrowindex]
              const matchingstyledata = styledataRows.find((row: string[]) => {
                let match = row[matchColumnIndex] === featureValue;
                console.log("row",row,"matchColumnIndex",matchColumnIndex,"featureValue",featureValue,"match",match);
                return match;
              });

              //get the row index of the feature value
              // console.log("styledataRows",styledataRows,"matchColumnIndex",matchColumnIndex,"matchingStyledataRowIndex",matchingstyledata);
              //log the selected style type and data column
              console.log("rule",rule);
              console.log("matchingstyledata",matchingstyledata);
              // matchingstyledata Array(5) [ "Crystal Cove", "#9B59B6", "0.8", "high", "medium" ]
              //what is t

            }
          } else {
            // Static rule - apply the styling directly
            console.log(`[DEBUG] Static rule detected - applying styling directly`);
            if (rule.ruletype.rulename === 'opacity') {
              const opacityValue = (rule.ruletype as any).opacityvalue;
              styledFeature.properties['opacity'] = opacityValue;
              console.log(`[DEBUG] Applied static opacity: ${opacityValue}`);
            } else if (rule.ruletype.rulename === 'colour') {
              const colourValue = (rule.ruletype as any).colour;
              styledFeature.properties['colour'] = colourValue;
              console.log(`[DEBUG] Applied static colour: ${colourValue}`);
            } else if (rule.ruletype.rulename === 'text') {
              const textValue = (rule.ruletype as any).textvalue;
              styledFeature.properties['text'] = textValue;
              console.log(`[DEBUG] Applied static text: ${textValue}`);
            }
          }
        }
      });
      
      return styledFeature;
    });

    return {
      type: 'FeatureCollection',
      features: styledFeatures
    };
  }
}
