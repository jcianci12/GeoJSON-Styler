import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as geojson from 'geojson';
import * as L from 'leaflet';
import { Bounds, FeatureGroup, geoJSON, latLng, Layer, LayerGroup as LeafletLayerGroup, Map, MapOptions, tileLayer, ZoomAnimEvent } from 'leaflet';
import 'leaflet.fullscreen';
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

  constructor(
    private snackbar: MatSnackBar,
    private mapState: MapStateService,
    private featurecollectionService: FeaturecollectionService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('[INIT] MapComponent constructor', performance.now().toFixed(1), 'ms');
  }

  ngOnInit() {
    console.log('[INIT] ngOnInit START', performance.now().toFixed(1), 'ms');
    this.subscriptions.push(
      this.mapState.layers$.subscribe(layers => {
        console.log('[INIT] layers$ subscription fired, layers:', layers.length, performance.now().toFixed(1), 'ms');
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
        console.log('[INIT] FeatureCollectionLayerObservable fired, layers:', layers.length, performance.now().toFixed(1), 'ms');
        // Use setTimeout to defer the render to the next change detection cycle
        setTimeout(() => {
          this.renderFeaturecollectionLayers();
        }, 0);
      })
    );

    console.log('[INIT] calling initializeMap', performance.now().toFixed(1), 'ms');
    this.initializeMap();
    console.log('[INIT] ngOnInit DONE', performance.now().toFixed(1), 'ms');
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
    console.log('[INIT] ngAfterViewInit', performance.now().toFixed(1), 'ms');
    this.initMap();
  }

  initMap() {
    console.log('[INIT] initMap START', performance.now().toFixed(1), 'ms');
    this.map = L.map('map', this.options);
    console.log('[INIT] L.map created', performance.now().toFixed(1), 'ms');
    this.map.on('zoomend', (e: L.LeafletEvent) => this.onMapZoomEnd(e));
    this.map.on('moveend', () => this.onMapMoveEnd());
    let tileCount = 0;
    this.map.on('tileloadstart', () => { tileCount++; });
    this.map.on('tileload', () => { 
      console.log('[INIT] tile loaded, count:', tileCount, performance.now().toFixed(1), 'ms');
    });
    this.map.on('tileerror', () => { console.log('[INIT] TILE ERROR', performance.now().toFixed(1), 'ms'); });
    this.map.on('load', () => { console.log('[INIT] map load event fired', performance.now().toFixed(1), 'ms'); });
    this.onMapReady(this.map);
    console.log('[INIT] initMap DONE', performance.now().toFixed(1), 'ms');
  }

  ngOnDestroy() {
    this.map?.clearAllEventListeners;
    this.map?.remove();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onMapReady(map: Map) {
    console.log('[INIT] onMapReady START', performance.now().toFixed(1), 'ms');
    this.map = map;
    this.cdr.detectChanges();
    console.log('[INIT] cdr.detectChanges done', performance.now().toFixed(1), 'ms');
    this.map$.emit(map);
    this.mapState.setMap(map);
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);
    console.log('[INIT] map emitted, zoom:', this.zoom, performance.now().toFixed(1), 'ms');
    
    // Use setTimeout to defer these updates to the next change detection cycle
    setTimeout(() => {
      console.log('[INIT] setTimeout(0) firing', performance.now().toFixed(1), 'ms');
      this.updateFeatureCollection();
      this.renderFeaturecollectionLayers();
      console.log('[INIT] setTimeout(0) DONE', performance.now().toFixed(1), 'ms');
    }, 0);
    
    setTimeout(() => {
      console.log('[INIT] setTimeout(1000) loadBounds', performance.now().toFixed(1), 'ms');
      this.loadBounds();
    }, 1000);

    console.log('[INIT] onMapReady DONE', performance.now().toFixed(1), 'ms');
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
    console.log('[INIT] loadBounds START', performance.now().toFixed(1), 'ms');
    let savedBounds = localStorage.getItem('bounds') as string;
    if (savedBounds !== null) {
      console.log('[INIT] loadBounds - found saved bounds', performance.now().toFixed(1), 'ms');
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
    console.log('[INIT] loadBounds DONE', performance.now().toFixed(1), 'ms');
  }

  updateFeatureCollection(featureCollection?: FeatureCollectionLayer[] | null) {
    console.log('[INIT] updateFeatureCollection called, has data:', !!featureCollection, performance.now().toFixed(1), 'ms');
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
    console.log('[INIT] renderFeaturecollectionLayers START', performance.now().toFixed(1), 'ms');
    if (!this.map) {
      console.log('[INIT] renderFeaturecollectionLayers - no map, returning');
      return;
    }

    const fc = this.featurecollectionService.getGeoJsonForAllLayers();
    console.log('[INIT] renderFeaturecollectionLayers - features:', fc.features.length, performance.now().toFixed(1), 'ms');
    
    // Use setTimeout to defer the update to the next change detection cycle
    setTimeout(() => {
      this.currentFeatureCollection = fc as any;
      this.cdr.detectChanges();
    }, 0);

    const featureGroup = new FeatureGroup();

    fc.features.forEach(feature => {
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

        // Optional popup from properties
        if (feature.properties) {
          const popupContent = Object.entries(feature.properties)
            .filter(([k]) => k !== 'style')
            .map(([key, value]) => `${key}: ${value}`)
            .join('<br>');
          if (popupContent) marker.bindPopup(popupContent);
        }

        featureGroup.addLayer(marker);
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
        featureGroup.addLayer(gj);
      }
    });

    // Replace previous group if present
    const existingFeatureGroup = this.mapState.featureGroup;
    if (existingFeatureGroup) {
      this.map.removeLayer(existingFeatureGroup);
    }
    this.map.addLayer(featureGroup);
    this.mapState.setFeatureGroup(featureGroup);

    this.fitBounds();

    this.snackbar.open(`Rendered ${fc.features.length} features`, 'OK', { duration: 3000 });
    console.log('[INIT] renderFeaturecollectionLayers DONE', performance.now().toFixed(1), 'ms');
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
}
