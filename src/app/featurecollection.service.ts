import { Injectable } from '@angular/core';
import { Feature, FeatureCollection } from 'geojson';
import { BehaviorSubject, Subject } from 'rxjs';
import { FeatureCollectionLayer } from './featureCollection';
import { stylerule } from './data/data.component';
import { LatLngColumnMapping } from './data/latlng-column/latlng-column-mapping';
import { CSVtoJSONPipe } from './csvtojsonpipe';
import { StyleruleStateService } from './data/stylerule/stylerule-state.service';

@Injectable({
  providedIn: 'root',
})
export class FeaturecollectionService {
  FeatureCollectionLayerObservable: BehaviorSubject<FeatureCollectionLayer[]> = new BehaviorSubject<FeatureCollectionLayer[]>([]);
  FeatureCollectionLayers: FeatureCollectionLayer[] | undefined;
  constructor(private styleruleStateService: StyleruleStateService) {
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

  updateStyleRules(index: number, styleRules: stylerule[]) {
    if (this.FeatureCollectionLayers && this.FeatureCollectionLayers[index]) {
      this.FeatureCollectionLayers[index].stylerules = styleRules;
      this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers);
    }
  }

  //loop through all the feature collection layers and returns a geo json object with all the features and styling rules added.
  getGeoJsonForAllLayers(maxFeatures?: number): FeatureCollection {
    if (!this.FeatureCollectionLayers || this.FeatureCollectionLayers.length === 0) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    const allFeatures: Feature[] = [];
    let totalProcessed = 0;
    const limit = maxFeatures || 100; // Default to 100 if not specified

    // Loop through all layers and collect their features
    for (let index = 0; index < this.FeatureCollectionLayers.length; index++) {
      const layer = this.FeatureCollectionLayers[index];
      if (layer.active) { // Only include active layers
        const layerGeoJson = this.getGeoJsonForLayer(index, limit - totalProcessed);
        allFeatures.push(...layerGeoJson.features);
        totalProcessed += layerGeoJson.features.length;

        // Stop processing if we've reached the limit
        if (totalProcessed >= limit) {
          console.log(`[PERFORMANCE] Limited processing to ${totalProcessed} features (max: ${limit})`);
          break;
        }
      }
    }

    return {
      type: 'FeatureCollection',
      features: allFeatures
    };
  }

  // Get total feature count from all layers (active and inactive)
  getTotalFeatureCount(): number {
    if (!this.FeatureCollectionLayers || this.FeatureCollectionLayers.length === 0) {
      return 0;
    }

    return this.FeatureCollectionLayers.reduce((total, layer) => {
      return total + (layer.features?.length || 0);
    }, 0);
  }

  // Get feature count from active layers only
  getActiveFeatureCount(): number {
    if (!this.FeatureCollectionLayers || this.FeatureCollectionLayers.length === 0) {
      return 0;
    }

    return this.FeatureCollectionLayers.reduce((total, layer) => {
      return total + (layer.active ? (layer.features?.length || 0) : 0);
    }, 0);
  }

  // Get filtered feature count (features that would actually be rendered after CSV matching)
  getFilteredFeatureCount(): number {
    if (!this.FeatureCollectionLayers || this.FeatureCollectionLayers.length === 0) {
      return 0;
    }

    let totalFiltered = 0;

    for (let index = 0; index < this.FeatureCollectionLayers.length; index++) {
      const layer = this.FeatureCollectionLayers[index];
      if (!layer.active) continue;

      // Check if we have CSV filtering configured
      const styleDataRaw = layer.styledata as any;
      const styleTable: string[][] = Array.isArray(styleDataRaw)
        ? styleDataRaw
        : (typeof styleDataRaw === 'string' && styleDataRaw.length
            ? new CSVtoJSONPipe().csvJSON(styleDataRaw)
            : []);

      const headers = styleTable.length ? styleTable[0] : [];
      const csvJoinColumn = layer.geocolumn?.GEOColumn;
      const csvJoinIndex = headers.length ? headers.indexOf(csvJoinColumn) : -1;

      if (csvJoinIndex >= 0) {
        // We have CSV filtering - count only matching features
        const rows: string[][] = styleTable.length > 1 ? styleTable.slice(1) : [];
        const csvKeys = new Set(rows.map(row => row[csvJoinIndex]?.toString().toLowerCase()).filter(k => k));

        const geojsonJoinProperty = layer.geocolumn?.GEOJSON;
        const matchingFeatures = layer.features.filter(feature => {
          const featureKey = geojsonJoinProperty ? (feature.properties as any)?.[geojsonJoinProperty] : undefined;
          return featureKey !== undefined && csvKeys.has(featureKey.toString().toLowerCase());
        });

        totalFiltered += matchingFeatures.length;
      } else {
        // No CSV filtering - count all features
        totalFiltered += layer.features?.length || 0;
      }
    }

    return totalFiltered;
  }

  // Performance optimization: Cache for CSV lookups to avoid repeated parsing
  private csvLookupCache = new Map<string, Map<string, string[]>>();

  //returns the geojson for the feature collection layer. uses the styling rules to add styling to the geojson.
  getGeoJsonForLayer(layerIndex: number, maxFeatures?: number): FeatureCollection {
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

    const limit = maxFeatures || 100; // Default to 100 if not specified
    console.log(`[PERFORMANCE] Processing layer ${layerIndex} with limit: ${limit}`);

    // Compute concrete visual properties from current layer stylerules
    const rules = layer.stylerules || [];

    // Prepare style CSV lookup structures with caching
    const styleDataRaw = layer.styledata as any;
    const cacheKey = `layer_${layerIndex}_${JSON.stringify(styleDataRaw).substring(0, 100)}`;

    let csvLookupMap: Map<string, string[]> | undefined = this.csvLookupCache.get(cacheKey);
    let headers: string[] = [];
    let csvJoinIndex = -1;

    if (!csvLookupMap) {
      const styleTable: string[][] = Array.isArray(styleDataRaw)
        ? styleDataRaw
        : (typeof styleDataRaw === 'string' && styleDataRaw.length
            ? new CSVtoJSONPipe().csvJSON(styleDataRaw)
            : []);
      headers = styleTable.length ? styleTable[0] : [];
      const rows: string[][] = styleTable.length > 1 ? styleTable.slice(1) : [];

      const csvJoinColumn = layer.geocolumn?.GEOColumn;
      csvJoinIndex = headers.length ? headers.indexOf(csvJoinColumn) : -1;

      // Build lookup map for O(1) CSV row access
      csvLookupMap = new Map<string, string[]>();
      if (csvJoinIndex >= 0) {
        rows.forEach(row => {
          if (row[csvJoinIndex] != null) {
            const key = row[csvJoinIndex].toString().toLowerCase();
            csvLookupMap!.set(key, row);
          }
        });
      }

      // Cache the lookup map
      this.csvLookupCache.set(cacheKey, csvLookupMap);
      console.log(`[PERFORMANCE] Built CSV lookup cache for layer ${layerIndex} with ${csvLookupMap.size} entries`);
    } else {
      // Retrieve cached values
      const styleTable: string[][] = Array.isArray(styleDataRaw)
        ? styleDataRaw
        : (typeof styleDataRaw === 'string' && styleDataRaw.length
            ? new CSVtoJSONPipe().csvJSON(styleDataRaw)
            : []);
      headers = styleTable.length ? styleTable[0] : [];
      const csvJoinColumn = layer.geocolumn?.GEOColumn;
      csvJoinIndex = headers.length ? headers.indexOf(csvJoinColumn) : -1;
      console.log(`[PERFORMANCE] Using cached CSV lookup for layer ${layerIndex}`);
    }

    const geojsonJoinProperty = layer.geocolumn?.GEOJSON;
    let processedCount = 0;

    const styledFeatures = layer.features
      .map((feature) => {
        // Early termination if we've reached the limit
        if (processedCount >= limit) {
          return null;
        }

        feature.properties = feature.properties || {};
        const style: any = (feature.properties as any).style || {};

        // Find the matching style row using cached lookup
        let matchedRow: string[] | undefined = undefined;
        const featureKey = geojsonJoinProperty ? (feature.properties as any)[geojsonJoinProperty] : undefined;
        if (csvJoinIndex >= 0 && featureKey !== undefined && csvLookupMap && csvLookupMap.size > 0) {
          matchedRow = csvLookupMap.get(featureKey.toString().toLowerCase());
        }

        // Note: We now pre-filter features, so this check is less necessary
        // But we keep it as a safety net for edge cases where pre-filtering wasn't applied
        if (csvJoinIndex >= 0 && !matchedRow) {
          return null;
        }

        processedCount++;

        rules.forEach((r) => {
          const name = r.ruletype?.rulename;
          const isDynamic = (r.ruletype as any)?.dynamic === true;

          // Determine the value source: CSV dynamic or static from rule config
          const columnName = r.column;
          const columnIndex = headers.length ? headers.indexOf(columnName) : -1;
          const csvValue = (isDynamic && matchedRow && columnIndex >= 0) ? matchedRow[columnIndex] : undefined;

          if (name === 'opacity') {
            const staticOpacity = (r.ruletype as any).opacityvalue;
            const parsed = csvValue != null ? parseFloat(csvValue) : undefined;
            const value = (isFinite(parsed as number) ? parsed : undefined) ?? staticOpacity;
            if (value !== undefined) {
              style.opacity = value;
              style.fillOpacity = value; // Also set fillOpacity for consistency with polygon rendering
            }
          }
          if (name === 'colour') {
            const staticColour = (r.ruletype as any).colour;
            const value = (csvValue && csvValue.length ? csvValue : undefined) ?? staticColour;
            if (value !== undefined) {
              style.color = value;
              style.fillColor = value; // Also set fillColor for consistency with polygon rendering
            }
          }
          if (name === 'text') {
            const t = r.ruletype as any;
            const staticText = t.textvalue;
            const value = (csvValue && csvValue.length ? csvValue : undefined) ?? staticText;
            if (value !== undefined) style.labelText = value;
            if (t.latoffset !== undefined) style.labelLatOffset = t.latoffset;
            if (t.lngoffset !== undefined) style.labelLngOffset = t.lngoffset;
            if (t.cssstyle !== undefined) style.labelCss = t.cssstyle;
          }
        });

        (feature.properties as any).style = style;
        return feature;
      })
      .filter((feature): feature is any => feature !== null); // Remove null features

    console.log(`[PERFORMANCE] Processed ${processedCount} matching features out of ${layer.features.length} total features`);

    return {
      type: 'FeatureCollection',
      features: styledFeatures
    };
  }

  // Method to clear CSV lookup cache when needed
  clearCsvLookupCache(): void {
    this.csvLookupCache.clear();
    console.log('[PERFORMANCE] Cleared CSV lookup cache');
  }

}
