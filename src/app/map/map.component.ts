import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as geojson from 'geojson';
import * as L from 'leaflet';
import { Bounds, FeatureGroup, geoJSON, latLng, Layer, LayerGroup as LeafletLayerGroup, Map, MapOptions, tileLayer, ZoomAnimEvent } from 'leaflet';
import 'leaflet.fullscreen';
import 'leaflet-draw';
import * as LeafletDraw from 'leaflet-draw';
import { CSVtoJSONPipe } from '../csvtojsonpipe';
import { Subscription } from 'rxjs';

import { colour, opacity, stylerule, text } from '../data/data.component';
import { FeatureCollectionLayer } from '../featureCollection';
import { FeaturecollectionService } from '../featurecollection.service';
import { FeaturefilterPipe } from '../featurefilter.pipe';
import { terms } from '../featurefilter/featurefilter.component';
import { MapStateService, LayerInfo } from '../services/map-state.service';

interface FeatureGroupInfo {
  id: string;
  group: L.FeatureGroup;
}

class MapPoint extends L.Marker {
  id: string = '';
  x: number = 0;
  y: number = 0;

  constructor(latlng: L.LatLngExpression, options?: L.MarkerOptions) {
    super(latlng, options);
  }
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, OnDestroy {
  @Output() map$: EventEmitter<Map> = new EventEmitter();
  @Output() zoom$: EventEmitter<number> = new EventEmitter();

  bounds: Bounds = new Bounds();
  tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    opacity: 0.7,
    maxZoom: 19,
    detectRetina: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });

  @Input() options: MapOptions = {
    layers: [this.tileLayer],
    zoom: 1,
    center: latLng(0, 0),
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: 'topleft',
      title: 'Full screen',
      titleCancel: 'Full screen cancel',
      forcePseudoFullscreen: true,
    },
  };

  private subscriptions: Subscription[] = [];
  public map: Map | undefined;
  public zoom: number | undefined;
  public currentFeatureCollection: geojson.FeatureCollection = {
    type: 'FeatureCollection',
    features: []
  };
  private tempmap: MapPoint[] = [];
  private _featureCollection: FeatureCollectionLayer[] = [];

  // Progressive loading properties
  private readonly BATCH_SIZE = 25; // Reduced from 100 to 25 for better performance
  private readonly LOAD_DELAY = 50; // Reduced delay for faster loading
  private loadingQueue: geojson.Feature[] = [];
  private isLoading = false;
  private currentBatchIndex = 0;
  private loadedFeatures: L.Layer[] = [];
  private mainFeatureGroup: L.FeatureGroup | undefined;

  // DEBUG: Feature limit to prevent browser freezing
  private readonly MAX_FEATURES_TO_RENDER = 100;

  // Icon cache to avoid recreating identical icons
  private iconCacheMap: {[key: string]: L.DivIcon} = {};

  // Performance monitoring
  private batchCount = 0;
  private totalLoadTime = 0;

  // Render control properties
  public shouldAutoRender = true;
  public pendingFeatureCount = 0;
  public isRendering = false;

  // Drawing properties
  private drawControl: L.Control.Draw | undefined;
  private drawnItems: L.FeatureGroup | undefined;
  private editControl: L.Control.Draw | undefined;
  public isDrawingMode = false;
  public isEditMode = false;
  public selectedPolygon: L.Polygon | undefined;
  private originalPolygonData: any = null;

  constructor(
    private snackbar: MatSnackBar,
    private mapState: MapStateService,
    public featurecollectionService: FeaturecollectionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.mapState.layers$.subscribe(layers => {
        this.updateLayers(layers);
      })
    );

    this.subscriptions.push(
      this.mapState.layerVisibility$.subscribe(layers => {
        this.updateLayerVisibility(layers);
      })
    );

    // Subscribe to feature collection layers to render styled data from FeaturecollectionService
    this.subscriptions.push(
      this.featurecollectionService.FeatureCollectionLayerObservable.subscribe(layers => {
        // Use setTimeout to defer the render to the next change detection cycle
        setTimeout(() => {
          this.renderFeaturecollectionLayers();
        }, 0);
      })
    );

    this.initializeMap();
  }

  private updateLayers(layers: LayerInfo[]) {
    if (!this.map) return;

    // Create a new feature group
    const featureGroup = new FeatureGroup();

    layers.forEach(layer => {
      if (!layer.visible) return;

      // Handle point features
      if (layer.type === 'csv') {
        layer.features.forEach(feature => {
          if (feature.geometry.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
            const marker = L.marker([
              feature.geometry.coordinates[1],
              feature.geometry.coordinates[0]
            ]);

            if (feature.properties) {
              const popupContent = Object.entries(feature.properties)
                .map(([key, value]) => `${key}: ${value}`)
                .join('<br>');
              marker.bindPopup(popupContent);
            }

            featureGroup.addLayer(marker);
          }
        });
      } else {
        // Handle polygon features
        layer.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            const geo = L.geoJSON(feature);
            featureGroup.addLayer(geo);
          }
        });
      }
    });

    // Remove existing feature group from map if it exists
    const existingFeatureGroup = this.mapState.featureGroup;
    if (existingFeatureGroup) {
      this.map.removeLayer(existingFeatureGroup);
    }

    // Add new feature group to map and update state
    this.map.addLayer(featureGroup);
    this.mapState.setFeatureGroup(featureGroup);

    // Update feature count
    const totalFeatures = layers.reduce((sum, layer) => sum + layer.features.length, 0);

    // Use setTimeout to defer the update to the next change detection cycle
    setTimeout(() => {
      this.currentFeatureCollection = {
        type: 'FeatureCollection',
        features: layers.flatMap(layer => layer.features)
      };
      this.cdr.detectChanges();
    }, 0);

    // Fit bounds to show all features
    this.fitBounds();

    this.snackbar.open(`Updated ${totalFeatures} features`, 'OK', { duration: 3000 });
  }

  private updateLayerVisibility(layers: LayerInfo[]) {
    if (!this.map) return;

    layers.forEach(layer => {
      const featureGroup = this.mapState.featureGroup;
      if (featureGroup && this.map) {
        if (layer.visible) {
          this.map.addLayer(featureGroup);
        } else {
          this.map.removeLayer(featureGroup);
        }
      }
    });
  }

  private fitBounds() {
    if (!this.map) return;

    const visibleLayers = this.mapState.layers.filter(l => l.visible);
    if (visibleLayers.length === 0) return;

    const firstVisibleLayer = visibleLayers[0];
    if (firstVisibleLayer.features.length > 0) {
      const bounds = L.latLngBounds(
        firstVisibleLayer.features
          .filter(f => f.geometry.type === 'Point' && 'coordinates' in f.geometry)
          .map(f => {
            const point = f.geometry as geojson.Point;
            return [point.coordinates[1], point.coordinates[0]] as L.LatLngTuple;
          })
      );
      this.map.fitBounds(bounds);
    }
  }

  ngAfterViewInit() {
    this.initMap();
  }

  initMap() {
    this.map = L.map('map', this.options);
    this.map.on('zoomend', (e: L.LeafletEvent) => this.onMapZoomEnd(e));
    this.map.on('moveend', () => this.onMapMoveEnd());
    this.onMapReady(this.map);
  }

  ngOnDestroy() {
    this.map?.clearAllEventListeners;
    this.map?.remove();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onMapReady(map: Map) {
    this.map = map;
    this.map$.emit(map);
    this.mapState.setMap(map);
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);

    // Initialize drawing functionality
    this.initializeDrawing();

    // Use setTimeout to defer these updates to the next change detection cycle
    setTimeout(() => {
      this.updateFeatureCollection();
      // Initial render from FeaturecollectionService (if any layers exist already)
      this.renderFeaturecollectionLayers();
    }, 0);

    setTimeout(() => {
      this.loadBounds();
    }, 1000);
  }

  onMapZoomEnd(e: L.LeafletEvent) {
    let bounds = this.map?.getBounds();
    localStorage.setItem('bounds', JSON.stringify(bounds));
  }

  onMapMoveEnd() {
    let bounds = this.map?.getBounds();
    localStorage.setItem('bounds', JSON.stringify(bounds));
  }

  loadBounds() {
    let savedBounds = localStorage.getItem('bounds') as string;
    if (savedBounds !== null) {
      let parsed = JSON.parse(savedBounds) as any;
      let bounds = L.latLngBounds(parsed._northEast, parsed._southWest);
      this.map?.flyToBounds(bounds);
    } else {
      const firstVisibleGroup = this.mapState.layers.find(l => l.visible);
      if (firstVisibleGroup && firstVisibleGroup.features.length > 0) {
        const bounds = firstVisibleGroup.features
          .filter(f => f.geometry.type === 'Point' && 'coordinates' in f.geometry)
          .map(f => {
            const point = f.geometry as geojson.Point;
            return L.latLng(point.coordinates[1], point.coordinates[0]);
          });
        if (bounds.length > 0) {
          this.map?.fitBounds(L.latLngBounds(bounds));
        }
      }
    }
  }

  updateFeatureCollection(featureCollection?: FeatureCollectionLayer[] | null) {
    if (!featureCollection) return;

    // Use setTimeout to defer the update to the next change detection cycle
    setTimeout(() => {
      this.currentFeatureCollection = {
        type: 'FeatureCollection',
        features: featureCollection.flatMap(layer => layer.features)
      };
      this.cdr.detectChanges();
    }, 0);
  }

  getxypoint(map: L.Map | undefined) {
    this.tempmap = [];
    map?.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polygon) {
        let d = new MapPoint([1,1]);
        d.id = (layer as any)?._icon?.innerText || '';
        let latlng = (layer as L.Marker).getLatLng();
        d.setLatLng(latlng);
        d.x = this.latLngToXY(latlng.lat, latlng.lng)[0];
        d.y = this.latLngToXY(latlng.lat, latlng.lng)[1];
        this.tempmap.push(d);
      }
    });
  }

  latLngToXY(lat:number, lng:number) {
    var R = 6378137;
    var x = R * lng * Math.PI / 180;
    var y = R * Math.log(Math.tan((90 + lat) * Math.PI / 360));
    return [x, y];
  }

  geticon(colour: string, opacity: number, text: string): L.DivIcon {
    let markerHtmlStyles =
      `
    width: 1rem;
    opacity: ` +
      opacity +
      `;
    height: 1rem;
    display: block;
    left: -1.5rem;
    top: -1.5rem;
    position: relative;
    border-radius: 1rem 1rem 0;
    border: 1px solid `+colour +``;

    let icon = L.divIcon({
      className: 'my-custom-pin',
      iconAnchor: [0, 24],
      tooltipAnchor: [-6, 0],
      popupAnchor: [0, -36],
      html: `<div><span style="${markerHtmlStyles}"/>` + text + `</div>`,
    });
    return icon;
  }

  // Render layers using the FeaturecollectionService computed styles
  private renderFeaturecollectionLayers() {
    if (!this.map) return;

    const fc = this.featurecollectionService.getGeoJsonForAllLayers();
    const activeFeatureCount = fc.features.length;
    const totalFeatureCount = this.featurecollectionService.getTotalFeatureCount();

    // DEBUG: Limit to first 100 features to prevent browser freezing
    const maxFeaturesToRender = this.MAX_FEATURES_TO_RENDER;
    const featuresToRender = fc.features.slice(0, maxFeaturesToRender);
    const limitedFeatureCount = featuresToRender.length;

    console.log(`[DEBUG] MapComponent: Manual render - Total features available: ${fc.features.length}, limiting to: ${limitedFeatureCount}`);

    this.isRendering = true;

    // Use setTimeout to defer the update to the next change detection cycle
    setTimeout(() => {
      this.currentFeatureCollection = {
        type: 'FeatureCollection',
        features: featuresToRender
      } as any;
      this.cdr.detectChanges();
    }, 0);

    // Check if we should auto-render or require manual render
    // Use total feature count to determine if manual render is needed
    if (totalFeatureCount > 100 && !this.shouldAutoRender) {
      this.pendingFeatureCount = totalFeatureCount;
      this.snackbar.open(`${totalFeatureCount} features ready to render. Click "Render Features" to start.`, 'OK', { duration: 4000 });
      return;
    }

    // Only render if there are active features
    if (limitedFeatureCount > 0) {
      // Clear existing features and start progressive loading
      this.clearExistingFeatures();
      this.startProgressiveLoading(featuresToRender);

      if (activeFeatureCount > maxFeaturesToRender) {
        this.snackbar.open(`DEBUG: Rendering first ${limitedFeatureCount} of ${activeFeatureCount} features to prevent freezing`, 'OK', { duration: 4000 });
      } else {
        this.snackbar.open(`Starting progressive load of ${limitedFeatureCount} features`, 'OK', { duration: 2000 });
      }
    }
  }

  handlePolygon(stylerules: stylerule[], feature: geojson.Feature<geojson.Geometry, geojson.GeoJsonProperties>, stylerow: string[], i: number, _fc: FeatureCollectionLayer): L.GeoJSON<any> {
    if (!this._featureCollection[i]?.styledata) {
      return L.geoJSON(feature);
    }

    let styledata = new CSVtoJSONPipe().csvJSON(this._featureCollection[i].styledata as any);
    let styledatacolumnindex = styledata[0].indexOf(stylerules[0].column);
    let value = stylerow[styledatacolumnindex];
    let geo = L.geoJSON(feature);
    let opacity = 1;
    let colour = '';

    stylerules.forEach((s) => {
      switch (s.ruletype.rulename) {
        case 'opacity': {
          let a = s.ruletype as opacity;
          opacity = a.opacityvalue;
          break;
        }
        case 'colour': {
          let a = s.ruletype as colour;
          if (a.colour) {
            colour = value;
          }
          break;
        }
      }
    });

    geo.setStyle({
      fillOpacity: opacity,
      fillColor: colour,
      color: colour,
    });
    return geo;
  }

  private initializeMap() {
    // ... existing map initialization code ...
  }

  // Clear existing features from the map
  private clearExistingFeatures() {
    if (this.mainFeatureGroup) {
      this.map?.removeLayer(this.mainFeatureGroup);
    }

    this.loadedFeatures = [];
    this.currentBatchIndex = 0;
    this.isLoading = false;

    // Create new feature group
    this.mainFeatureGroup = new FeatureGroup();
    this.map?.addLayer(this.mainFeatureGroup);
    this.mapState.setFeatureGroup(this.mainFeatureGroup);

    // Clear icon cache periodically to prevent memory leaks
    if (Object.keys(this.iconCacheMap).length > 1000) {
      this.iconCacheMap = {};
      console.log('[DEBUG] MapComponent: Cleared icon cache to prevent memory leaks');
    }
  }

  // Start progressive loading of features
  private startProgressiveLoading(features: geojson.Feature[]) {
    if (this.isLoading) {
      console.log('[DEBUG] MapComponent: Cancelling previous loading operation');
      this.isLoading = false;
    }

    this.loadingQueue = [...features];
    this.isLoading = true;
    this.currentBatchIndex = 0;
    this.batchCount = 0;
    this.totalLoadTime = 0;

    console.log(`[DEBUG] MapComponent: Starting progressive loading of ${features.length} features`);
    console.log(`[DEBUG] MapComponent: Using batch size: ${this.BATCH_SIZE}, load delay: ${this.LOAD_DELAY}ms`);

    // Start loading the first batch
    this.loadNextBatch();
  }

  // Load the next batch of features
  private loadNextBatch() {
    if (!this.isLoading || !this.mainFeatureGroup || this.currentBatchIndex >= this.loadingQueue.length) {
      this.isLoading = false;
      this.onLoadingComplete();
      return;
    }

    const startIndex = this.currentBatchIndex;
    const endIndex = Math.min(startIndex + this.BATCH_SIZE, this.loadingQueue.length);
    const batch = this.loadingQueue.slice(startIndex, endIndex);

    console.log(`[DEBUG] MapComponent: Loading batch ${Math.floor(startIndex / this.BATCH_SIZE) + 1}/${Math.ceil(this.loadingQueue.length / this.BATCH_SIZE)} (features ${startIndex + 1}-${endIndex})`);

    // Track batch processing time
    const batchStartTime = performance.now();
    this.batchCount++;

    // Process this batch with error handling
    let successCount = 0;
    batch.forEach(feature => {
      try {
        const layer = this.createFeatureLayer(feature);
        if (layer) {
          this.mainFeatureGroup?.addLayer(layer);
          this.loadedFeatures.push(layer);
          successCount++;
        }
      } catch (error) {
        console.warn(`[DEBUG] MapComponent: Failed to create layer for feature:`, error, feature);
      }
    });

    const batchProcessTime = performance.now() - batchStartTime;
    this.totalLoadTime += batchProcessTime;
    const avgBatchTime = this.totalLoadTime / this.batchCount;

    console.log(`[DEBUG] MapComponent: Successfully loaded ${successCount}/${batch.length} features in batch (${batchProcessTime.toFixed(2)}ms, avg: ${avgBatchTime.toFixed(2)}ms)`);

    this.currentBatchIndex = endIndex;

    // Adaptive delay based on batch processing time to prevent freezing
    let adaptiveDelay = this.LOAD_DELAY;
    if (batchProcessTime > 100) {
      adaptiveDelay = Math.min(this.LOAD_DELAY * 2, 200); // Increase delay if batch takes too long
      console.log(`[DEBUG] MapComponent: Batch took ${batchProcessTime.toFixed(2)}ms, increasing delay to ${adaptiveDelay}ms`);
    }

    // Use requestAnimationFrame for better performance instead of setTimeout
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.loadNextBatch();
      }, adaptiveDelay);
    });
  }

  // Create a single feature layer
  private createFeatureLayer(feature: geojson.Feature): L.Layer | null {
    const geometry = feature.geometry;
    const props: any = feature.properties || {};
    const style: any = props.style || {};

    if (geometry.type === 'Point' && Array.isArray((geometry as any).coordinates)) {
      const coords = (geometry as geojson.Point).coordinates;
      const lat = coords[1];
      const lng = coords[0];

      const icon = this.geticon(
        style.color || style.fillColor || '#3388ff',
        style.opacity != null ? style.opacity : 1,
        style.labelText != null ? String(style.labelText) : ''
      );
      const marker = L.marker([lat, lng], { icon });

      // Optimize popup creation - only create if there are non-style properties
      if (feature.properties) {
        const nonStyleProps = Object.entries(feature.properties)
          .filter(([k]) => k !== 'style');

        if (nonStyleProps.length > 0) {
          const popupContent = nonStyleProps
            .map(([key, value]) => `${key}: ${value}`)
            .join('<br>');
          marker.bindPopup(popupContent);
        }
      }

      return marker;
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon' || geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
      const gj = L.geoJSON(feature as any, {
        style: () => ({
          color: style.color || '#3388ff',
          fillColor: style.fillColor || style.color || '#3388ff',
          fillOpacity: style.fillOpacity != null ? style.fillOpacity : (style.opacity != null ? style.opacity : 0.2),
          opacity: style.opacity != null ? style.opacity : 1,
          weight: style.weight != null ? style.weight : 2
        })
      });
      return gj;
    }

    return null;
  }

  // Method to stop progressive loading
  public stopProgressiveLoading() {
    if (this.isLoading) {
      this.isLoading = false;
      console.log('[DEBUG] MapComponent: Progressive loading stopped by user');
      this.snackbar.open(`Loading stopped. ${this.loadedFeatures.length} features loaded so far.`, 'OK', { duration: 3000 });
    }
  }

  // Called when progressive loading is complete
  private onLoadingComplete() {
    const avgBatchTime = this.batchCount > 0 ? this.totalLoadTime / this.batchCount : 0;
    console.log(`[DEBUG] MapComponent: Progressive loading complete. Loaded ${this.loadedFeatures.length} features in ${this.batchCount} batches (avg: ${avgBatchTime.toFixed(2)}ms per batch)`);

    this.isRendering = false;

    if (this.mainFeatureGroup) {
      this.fitBounds();
      this.snackbar.open(`Progressive loading complete: ${this.loadedFeatures.length} features loaded`, 'OK', { duration: 3000 });
    }
  }

  // Manual render trigger
  public startManualRender() {
    if (this.isRendering) {
      this.snackbar.open('Rendering already in progress...', 'OK', { duration: 2000 });
      return;
    }

    const fc = this.featurecollectionService.getGeoJsonForAllLayers();
    const totalFeatureCount = this.featurecollectionService.getTotalFeatureCount();

    if (totalFeatureCount === 0) {
      this.snackbar.open('No features to render', 'OK', { duration: 2000 });
      return;
    }

    // DEBUG: Limit to first 100 features to prevent browser freezing
    const maxFeaturesToRender = this.MAX_FEATURES_TO_RENDER;
    const featuresToRender = fc.features.slice(0, maxFeaturesToRender);
    const limitedFeatureCount = featuresToRender.length;

    this.isRendering = true;
    this.pendingFeatureCount = 0;

    // Clear existing features and start progressive loading
    this.clearExistingFeatures();
    this.startProgressiveLoading(featuresToRender);

    if (fc.features.length > maxFeaturesToRender) {
      this.snackbar.open(`DEBUG: Manual render of first ${limitedFeatureCount} of ${fc.features.length} features to prevent freezing`, 'OK', { duration: 4000 });
    } else {
      this.snackbar.open(`Starting manual render of ${limitedFeatureCount} active features`, 'OK', { duration: 2000 });
    }
  }

  // Toggle auto-render setting
  public toggleAutoRender() {
    this.shouldAutoRender = !this.shouldAutoRender;
    const status = this.shouldAutoRender ? 'enabled' : 'disabled';
    this.snackbar.open(`Auto-render ${status}`, 'OK', { duration: 2000 });
  }

  // Initialize drawing functionality
  private initializeDrawing() {
    if (!this.map) return;

    // Create a feature group to store editable layers
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // Initialize draw control
    this.drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        marker: false,
        circle: false,
        circlemarker: false,
        rectangle: {
          shapeOptions: {
            color: '#3388ff',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2
          }
        },
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Shape edges cannot cross!'
          },
          shapeOptions: {
            color: '#3388ff',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2
          }
        },
        polyline: {
          shapeOptions: {
            color: '#3388ff',
            weight: 3,
            opacity: 0.8
          }
        }
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true
      }
    });

    // Add draw control to map
    this.map.addControl(this.drawControl);

    // Bind draw events
    this.map.on('draw:created', (e: any) => this.onDrawCreated(e));
    this.map.on('draw:edited', (e: any) => this.onDrawEdited(e));
    this.map.on('draw:deleted', (e: any) => this.onDrawDeleted(e));

    // Bind click events for polygon selection
    this.map.on('click', (e: any) => this.onMapClick(e));
  }

  // Handle draw creation events
  private onDrawCreated(e: any) {
    const layer = e.layer;
    const type = e.layerType;

    if (type === 'polygon') {
      // Add the drawn polygon to the feature group
      this.drawnItems?.addLayer(layer);

      // Convert to GeoJSON and add to feature collection service
      const geoJsonFeature = layer.toGeoJSON();
      this.addDrawnPolygonToService(geoJsonFeature);

      this.snackbar.open('Polygon drawn successfully!', 'OK', { duration: 2000 });
    }
  }

  // Handle draw edit events
  private onDrawEdited(e: any) {
    const layers = e.layers;
    let editedCount = 0;

    layers.eachLayer((layer: any) => {
      if (layer instanceof L.Polygon) {
        const geoJsonFeature = layer.toGeoJSON();
        this.updatePolygonInService(geoJsonFeature);
        editedCount++;
      }
    });

    if (editedCount > 0) {
      this.snackbar.open(`${editedCount} polygon(s) updated!`, 'OK', { duration: 2000 });
    }
  }

  // Handle draw deletion events
  private onDrawDeleted(e: any) {
    const layers = e.layers;
    let deletedCount = 0;

    layers.eachLayer((layer: any) => {
      if (layer instanceof L.Polygon) {
        this.removePolygonFromService(layer);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      this.snackbar.open(`${deletedCount} polygon(s) deleted!`, 'OK', { duration: 2000 });
    }
  }

  // Handle map clicks for polygon selection
  private onMapClick(e: any) {
    if (this.isEditMode && this.selectedPolygon) {
      // Deselect current polygon
      this.deselectPolygon();
    }
  }

  // Add drawn polygon to feature collection service
  private addDrawnPolygonToService(geoJsonFeature: any) {
    const feature: geojson.Feature = {
      type: 'Feature',
      geometry: geoJsonFeature.geometry,
      properties: {
        id: `drawn_${Date.now()}`,
        name: `Drawn Polygon ${Date.now()}`,
        style: {
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          opacity: 0.8,
          weight: 2
        }
      }
    };

    // Add to a new layer in the feature collection service
    this.featurecollectionService.addDrawnPolygon(feature);
  }

  // Update polygon in feature collection service
  private updatePolygonInService(geoJsonFeature: any) {
    // Find and update the polygon in the service
    this.featurecollectionService.updateDrawnPolygon(geoJsonFeature);
  }

  // Remove polygon from feature collection service
  private removePolygonFromService(layer: L.Polygon) {
    // Find and remove the polygon from the service
    this.featurecollectionService.removeDrawnPolygon(layer);
  }

  // Select a polygon for editing
  public selectPolygonForEditing(polygon: L.Polygon) {
    if (this.selectedPolygon) {
      this.deselectPolygon();
    }

    this.selectedPolygon = polygon;
    this.originalPolygonData = polygon.toGeoJSON();

    // Highlight the selected polygon
    polygon.setStyle({
      color: '#ff4444',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.3
    });

    this.isEditMode = true;
    this.snackbar.open('Polygon selected for editing. Use the edit tools to modify.', 'OK', { duration: 3000 });
  }

  // Deselect current polygon
  private deselectPolygon() {
    if (this.selectedPolygon) {
      // Restore original style
      this.selectedPolygon.setStyle({
        color: '#3388ff',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.2
      });
      this.selectedPolygon = undefined;
      this.originalPolygonData = null;
    }
    this.isEditMode = false;
  }

  // Duplicate selected polygon
  public duplicateSelectedPolygon() {
    if (!this.selectedPolygon) {
      this.snackbar.open('No polygon selected for duplication', 'OK', { duration: 2000 });
      return;
    }

    const originalGeoJson = this.selectedPolygon.toGeoJSON();
    const duplicatedFeature: geojson.Feature = {
      type: 'Feature',
      geometry: originalGeoJson.geometry,
      properties: {
        ...originalGeoJson.properties,
        id: `duplicated_${Date.now()}`,
        name: `${originalGeoJson.properties?.name || 'Polygon'} (Copy)`,
        style: {
          color: '#ff8800',
          fillColor: '#ff8800',
          fillOpacity: 0.2,
          opacity: 0.8,
          weight: 2
        }
      }
    };

    // Add duplicated polygon to service
    this.featurecollectionService.addDrawnPolygon(duplicatedFeature);

    // Create visual duplicate on map
    const duplicatedLayer = L.geoJSON(duplicatedFeature as any, {
      style: () => ({
        color: '#ff8800',
        fillColor: '#ff8800',
        fillOpacity: 0.2,
        opacity: 0.8,
        weight: 2
      })
    });

    this.drawnItems?.addLayer(duplicatedLayer);
    this.snackbar.open('Polygon duplicated successfully!', 'OK', { duration: 2000 });
  }

  // Toggle drawing mode
  public toggleDrawingMode() {
    this.isDrawingMode = !this.isDrawingMode;

    if (this.isDrawingMode) {
      // Enable drawing by showing the draw control
      if (this.drawControl) {
        this.map?.addControl(this.drawControl);
      }
      this.snackbar.open('Drawing mode enabled. Click and drag to draw polygons.', 'OK', { duration: 3000 });
    } else {
      // Disable drawing by removing the draw control
      if (this.drawControl) {
        this.map?.removeControl(this.drawControl);
      }
      this.snackbar.open('Drawing mode disabled.', 'OK', { duration: 2000 });
    }
  }

  // Clear all drawn items
  public clearDrawnItems() {
    if (this.drawnItems) {
      this.drawnItems.clearLayers();
      this.featurecollectionService.clearDrawnPolygons();
      this.snackbar.open('All drawn items cleared!', 'OK', { duration: 2000 });
    }
  }
}
