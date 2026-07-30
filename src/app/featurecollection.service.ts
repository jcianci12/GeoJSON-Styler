import { Injectable, NgZone } from '@angular/core';
import { Feature, FeatureCollection } from 'geojson';
import { BehaviorSubject, Subject } from 'rxjs';
import { FeatureCollectionLayer } from './featureCollection';
import { stylerule } from './data/data.component';
import { LatLngColumnMapping } from './data/latlng-column/latlng-column-mapping';
import { CSVtoJSONPipe } from './csvtojsonpipe';
import { StyleruleStateService } from './data/stylerule/stylerule-state.service';

export interface ChunkProgress {
  loaded: number;
  total: number;
  phase: 'reading' | 'parsing' | 'processing' | 'done';
}

/** Duty cycle config: process for WORK_MS, then idle for YIELD_MS */
const WORK_MS = 16;   // one frame
const YIELD_MS = 16;  // one frame = 50% duty cycle

@Injectable({
  providedIn: 'root',
})
export class FeaturecollectionService {
  FeatureCollectionLayerObservable: BehaviorSubject<FeatureCollectionLayer[]> = new BehaviorSubject<FeatureCollectionLayer[]>([]);
  FeatureCollectionLayers: FeatureCollectionLayer[] | undefined;
  constructor(
    private styleruleStateService: StyleruleStateService,
    private ngZone: NgZone
  ) {
    console.log('[INIT] FeaturecollectionService constructor', performance.now().toFixed(1), 'ms');
    this.FeatureCollectionLayerObservable.subscribe((i) => {
      console.log('[INIT] FeaturecollectionService internal subscription - layers:', i.length, 'features:', i[0]?.features?.length || 0, performance.now().toFixed(1), 'ms');
      this.FeatureCollectionLayers = i;
    });
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
    console.log('[INIT] FeaturecollectionService.addLayerFromGeoJSON - features:', features.length, performance.now().toFixed(1), 'ms');
    console.trace('[INIT] addLayerFromGeoJSON call stack');
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

  /**
   * Add GeoJSON features in chunks with 50% duty cycle (16ms work / 16ms idle).
   * Runs bulk processing outside Angular zone so change detection stays idle.
   * Only ticks the zone for progress updates and final Observable emission.
   * @returns index of the new layer
   */
  async addLayerFromGeoJSONChunked(
    features: Feature[],
    onProgress?: (progress: ChunkProgress) => void,
    chunkSize: number = 500
  ): Promise<number> {
    const total = features.length;

    // Create empty layer placeholder (inside zone so UI sees it)
    const l = new FeatureCollectionLayer(
      [],
      { terms: [], triggerval: 0 },
      [],
      { GEOColumn: "qld_loca_2", GEOJSON: "suburb" },
      []
    );
    l.layerType = 'geojson';

    if (!this.FeatureCollectionLayers) {
      this.FeatureCollectionLayers = [];
    }
    const layerIndex = this.FeatureCollectionLayers.length;
    this.FeatureCollectionLayers.push(l);
    this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers);

    // Run the heavy work outside Angular zone
    return this.ngZone.runOutsideAngular(async () => {
      let offset = 0;

      while (offset < total) {
        const deadline = performance.now() + WORK_MS;

        // Process as many chunks as fit in one frame budget
        while (offset < total && performance.now() < deadline) {
          const end = Math.min(offset + chunkSize, total);
          const chunk = features.slice(offset, end);
          l.features.push(...chunk);
          offset = end;
        }

        // Tick zone just for progress bar update
        if (onProgress) {
          this.ngZone.run(() =>
            onProgress({ loaded: Math.min(offset, total), total, phase: 'processing' })
          );
        }

        // Yield for a full frame (50% duty cycle)
        if (offset < total) {
          await new Promise<void>(resolve => setTimeout(resolve, YIELD_MS));
        }
      }

      // Back inside zone for final emission
      this.ngZone.run(() => {
        onProgress?.({ loaded: total, total, phase: 'done' });
        this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers!);
      });

      return layerIndex;
    });
  }

  /**
   * Replace features on an existing layer, chunked with 50% duty cycle.
   * Preserves layer's stylerules, styledata, geocolumn etc.
   * Runs bulk processing outside Angular zone.
   */
  async replaceLayerFeaturesChunked(
    layerIndex: number,
    features: Feature[],
    onProgress?: (progress: ChunkProgress) => void,
    chunkSize: number = 500
  ): Promise<void> {
    const total = features.length;
    const layer = this.FeatureCollectionLayers?.[layerIndex];
    if (!layer) {
      console.warn(`replaceLayerFeaturesChunked: layer ${layerIndex} not found`);
      return;
    }

    // Run bulk work outside Angular zone
    return this.ngZone.runOutsideAngular(async () => {
      // Clear existing features
      layer.features = [];
      let offset = 0;

      while (offset < total) {
        const deadline = performance.now() + WORK_MS;

        // Fill the frame budget
        while (offset < total && performance.now() < deadline) {
          const end = Math.min(offset + chunkSize, total);
          const chunk = features.slice(offset, end);
          layer.features.push(...chunk);
          offset = end;
        }

        // Tick zone just for progress bar
        if (onProgress) {
          this.ngZone.run(() =>
            onProgress({ loaded: Math.min(offset, total), total, phase: 'processing' })
          );
        }

        // Yield a full frame
        if (offset < total) {
          await new Promise<void>(resolve => setTimeout(resolve, YIELD_MS));
        }
      }

      // Back inside zone for final emission
      this.ngZone.run(() => {
        onProgress?.({ loaded: total, total, phase: 'done' });
        this.FeatureCollectionLayerObservable.next(this.FeatureCollectionLayers!);
      });
    });
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

    // Compute concrete visual properties from current layer stylerules
    const rules = layer.stylerules || [];
    // Prepare style CSV lookup structures
    const styleDataRaw = layer.styledata as any;
    const styleTable: string[][] = Array.isArray(styleDataRaw)
      ? styleDataRaw
      : (typeof styleDataRaw === 'string' && styleDataRaw.length
          ? new CSVtoJSONPipe().csvJSON(styleDataRaw)
          : []);
    const headers: string[] = styleTable.length ? styleTable[0] : [];
    const rows: string[][] = styleTable.length > 1 ? styleTable.slice(1) : [];

    const csvJoinColumn = layer.geocolumn?.GEOColumn;
    const geojsonJoinProperty = layer.geocolumn?.GEOJSON;
    const csvJoinIndex = headers.length ? headers.indexOf(csvJoinColumn) : -1;

    const styledFeatures = layer.features.map((feature) => {
      feature.properties = feature.properties || {};
      const style: any = (feature.properties as any).style || {};

      // Find the matching style row for this feature if possible
      let matchedRow: string[] | undefined = undefined;
      const featureKey = geojsonJoinProperty ? (feature.properties as any)[geojsonJoinProperty] : undefined;
      if (csvJoinIndex >= 0 && featureKey !== undefined && rows.length) {
        matchedRow = rows.find(r => r[csvJoinIndex] != null && r[csvJoinIndex].toString() === featureKey.toString());
      }

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
          if (value !== undefined) style.opacity = value;
        }
        if (name === 'colour') {
          const staticColour = (r.ruletype as any).colour;
          const value = (csvValue && csvValue.length ? csvValue : undefined) ?? staticColour;
          if (value !== undefined) style.color = value;
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
    });

    return {
      type: 'FeatureCollection',
      features: styledFeatures
    };
  }
}
