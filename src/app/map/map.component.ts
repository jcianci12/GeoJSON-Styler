import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
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
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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
        // Debounce: wait 200ms after last emission before rendering
        // Prevents 4+ re-renders when layer setup fires multiple emissions
        if (this._renderDebounce) clearTimeout(this._renderDebounce);
        this._renderDebounce = setTimeout(() => {
          this.renderFeaturecollectionLayers();
        }, 200);
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

  private addFitBoundsButton() {
    if (!this.map) return;
    const FitBoundsControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: () => {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
        btn.innerHTML = '⊡';
        btn.title = 'Fit to features';
        btn.style.fontSize = '18px';
        btn.style.cursor = 'pointer';
        btn.style.width = '34px';
        btn.style.height = '34px';
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, 'click', () => {
          // Fit to all features in the feature group
          if (this.featureGroup) {
            try {
              const bounds = this.featureGroup.getBounds();
              if (bounds.isValid()) {
                this.map!.fitBounds(bounds);
              }
            } catch {}
          }
        });
        return btn;
      }
    });
    new FitBoundsControl().addTo(this.map);
  }

  ngAfterViewInit() {
    console.log('[INIT] ngAfterViewInit', performance.now().toFixed(1), 'ms');
    this.initMap();
  }

  private featureGroup: L.FeatureGroup | null = null;
  private _renderDebounce: any = null;
  private _hasInitialRender = false;
  private _fitBtnAdded = false;

  initMap() {
    console.log('[INIT] initMap START', performance.now().toFixed(1), 'ms');
    this.map = L.map('map', this.options);
    console.log('[INIT] L.map created', performance.now().toFixed(1), 'ms');
    
    // Run ALL map events outside Angular zone — prevents change detection
    // on every mouse move during pan/zoom (zone.js patches DOM events)
    this.ngZone.runOutsideAngular(() => {
      // Hide overlay during pan to prevent expensive canvas redraws
      this.map!.on('movestart', () => {
        console.log('[MAP] movestart — hiding overlay', performance.now().toFixed(1), 'ms');
        if (this.featureGroup && this.map?.hasLayer(this.featureGroup)) {
          this.map.removeLayer(this.featureGroup);
        }
      });
      
      this.map!.on('moveend', () => {
        const c = this.map!.getCenter();
        console.log('[MAP] moveend — center:', c.lat.toFixed(4), c.lng.toFixed(4), 'zoom:', this.map!.getZoom(), '— showing overlay', performance.now().toFixed(1), 'ms');
        // Re-enter zone for render so Angular detects changes
        this.ngZone.run(() => {
          this.renderFeaturecollectionLayers();
        });
      });

      this.map!.on('zoomstart', () => {
        console.log('[MAP] zoomstart', performance.now().toFixed(1), 'ms');
        if (this.featureGroup && this.map?.hasLayer(this.featureGroup)) {
          this.map.removeLayer(this.featureGroup);
        }
      });

      this.map!.on('zoomend', () => {
        console.log('[MAP] zoomend — zoom:', this.map!.getZoom(), performance.now().toFixed(1), 'ms');
        this.ngZone.run(() => {
          this.renderFeaturecollectionLayers();
        });
      });

      this.map!.on('zoomend', (e: L.LeafletEvent) => this.onMapZoomEnd(e));
      this.map!.on('moveend', () => this.onMapMoveEnd());
    });
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

  // Add text labels at polygon centroids for features with labelText style
  private addTextLabels(features: any[], group: L.FeatureGroup): number {
    let count = 0;
    const seenLabels = new Set<string>(); // deduplicate: only one label per unique text
    features.forEach((feature: any) => {
      const style = feature?.properties?.style;
      const labelText = style?.labelText;
      if (!labelText) return;

      // Skip duplicate labels
      const key = labelText.toString().trim();
      if (seenLabels.has(key)) return;
      seenLabels.add(key);

      const center = this.getFeatureCenter(feature);
      if (!center) return;

      // Apply offset (degrees) from style rule
      const latOff = Number(style.labelLatOffset) || 0;
      const lngOff = Number(style.labelLngOffset) || 0;
      if (count === 0) {
        console.log('[TEXT] First label offset — latOff:', latOff, 'lngOff:', lngOff, 'center:', center.lat.toFixed(4), center.lng.toFixed(4), 'labelText:', labelText);
      }
      const pos = L.latLng(center.lat + latOff, center.lng + lngOff);

      const css = (style.labelCss || 'color:#333;font-size:11px;font-weight:bold;text-shadow:0 0 3px #fff').replace(/colour/g, 'color');
      const icon = L.divIcon({
        className: 'map-text-label',
        html: '<span style="' + css + ';white-space:nowrap;pointer-events:none;">' + labelText + '</span>',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
      const marker = L.marker(pos, { icon, interactive: true, draggable: true });
      group.addLayer(marker);
      count++;
    });
    return count;
  }

  // Compute approximate center of a GeoJSON feature from its coordinates
  private getFeatureCenter(feature: any): L.LatLng | null {
    try {
      const geom = feature.geometry;
      if (!geom) return null;
      let coords = geom.coordinates;
      // MultiPolygon: use first polygon's outer ring
      if (geom.type === 'MultiPolygon' && Array.isArray(coords) && coords.length > 0) {
        coords = coords[0];
      }
      if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
        const ring = coords[0];
        let sumLat = 0, sumLng = 0;
        ring.forEach((c: number[]) => { sumLng += c[0]; sumLat += c[1]; });
        return L.latLng(sumLat / ring.length, sumLng / ring.length);
      }
    } catch {}
    return null;
  }

  // Render layers using the FeaturecollectionService computed styles
  private renderFeaturecollectionLayers() {
    const t0 = performance.now();
    console.log('[RENDER] START', t0.toFixed(1), 'ms');
    
    if (!this.map) {
      console.log('[RENDER] no map, returning');
      return;
    }

    const fc = this.featurecollectionService.getGeoJsonForAllLayers();
    const t1 = performance.now();
    console.log('[RENDER] getGeoJsonForAllLayers done —', fc.features.length, 'features,', (t1 - t0).toFixed(1), 'ms');
    
    setTimeout(() => {
      this.currentFeatureCollection = fc as any;
      this.cdr.detectChanges();
    }, 0);

    // Split features by geometry type
    const polyFeatures: any[] = [];
    const pointFeatures: any[] = [];
    fc.features.forEach(f => {
      const t = f.geometry.type;
      if (t === 'Polygon' || t === 'MultiPolygon' || t === 'LineString' || t === 'MultiLineString') {
        polyFeatures.push(f);
      } else if (t === 'Point') {
        pointFeatures.push(f);
      }
    });
    const t2 = performance.now();
    console.log('[RENDER] Feature split — polys:', polyFeatures.length, 'points:', pointFeatures.length, (t2 - t1).toFixed(1), 'ms');

    const featureGroup = new FeatureGroup();

    // Count total vertices for complexity analysis
    let totalVertices = 0;
    let canvasCreateMs = 0;
    if (polyFeatures.length > 0) {
      polyFeatures.forEach((f: any) => {
        const coords = f.geometry?.coordinates;
        if (coords && Array.isArray(coords)) {
          totalVertices += JSON.stringify(coords).match(/\[/g)?.length || 0;
        }
      });
      
      const t3 = performance.now();
      const polyFC: any = { type: 'FeatureCollection', features: polyFeatures };
      const canvasLayer = L.geoJSON(polyFC, {
        renderer: L.canvas(),
        style: (feature: any) => {
          const s = feature?.properties?.style || {};
          return {
            color: s.color || '#3388ff',
            fillColor: s.fillColor || s.color || '#3388ff',
            fillOpacity: s.fillOpacity != null ? s.fillOpacity : (s.opacity != null ? s.opacity : 0.5),
            opacity: s.opacity != null ? s.opacity : 1,
            weight: s.weight != null ? s.weight : 2
          };
        }
      } as any);
      featureGroup.addLayer(canvasLayer);
      canvasCreateMs = performance.now() - t3;
      console.log('[RENDER] Canvas layer — ~' + totalVertices + ' vertices, ' + canvasCreateMs.toFixed(1) + 'ms');

      // Add text labels for polygon features with labelText style
      const textMarkerCount = this.addTextLabels(polyFeatures, featureGroup);
      if (textMarkerCount > 0) {
        console.log('[RENDER] Text labels — ' + textMarkerCount + ' markers');
      }
    }

    // Points: individual markers (usually far fewer than polygons)
    pointFeatures.forEach(feature => {
      const props: any = feature.properties || {};
      const style: any = props.style || {};
      const coords = (feature.geometry as any).coordinates;
      const lat = coords[1];
      const lng = coords[0];

      const icon = this.geticon(
        style.color || style.fillColor || '#3388ff',
        style.opacity != null ? style.opacity : 1,
        style.labelText != null ? String(style.labelText) : ''
      );
      const marker = L.marker([lat, lng], { icon });

      if (feature.properties) {
        const popupContent = Object.entries(feature.properties)
          .filter(([k]) => k !== 'style')
          .map(([key, value]) => `${key}: ${value}`)
          .join('<br>');
        if (popupContent) marker.bindPopup(popupContent);
      }
      featureGroup.addLayer(marker);
    });

    // Replace previous group if present
    const t5 = performance.now();
    const existingFeatureGroup = this.mapState.featureGroup;
    if (existingFeatureGroup) {
      this.map.removeLayer(existingFeatureGroup);
    }
    this.map.addLayer(featureGroup);
    this.mapState.setFeatureGroup(featureGroup);
    this.featureGroup = featureGroup;
    const t6 = performance.now();
    console.log('[RENDER] Map addLayer + cleanup —', (t6 - t5).toFixed(1), 'ms');

    const t7 = performance.now();
    // Only fit bounds on first render — subsequent renders keep current view
    if (!this._hasInitialRender) {
      this.fitBounds();
      this._hasInitialRender = true;
    }

    // Add fit-to-features button if not already added
    if (!this._fitBtnAdded) {
      this.addFitBoundsButton();
      this._fitBtnAdded = true;
    }
    this.snackbar.open(`Rendered ${fc.features.length} features`, 'OK', { duration: 3000 });
    console.log('[RENDER] DONE — total:', (t7 - t0).toFixed(1), 'ms', '| geoJson:', (t1-t0).toFixed(1), 'ms', '| split:', (t2-t1).toFixed(1), 'ms', '| canvas:', canvasCreateMs.toFixed(1), 'ms', '| addLayer:', (t6-t5).toFixed(1), 'ms', '| vertices:~' + totalVertices);
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
