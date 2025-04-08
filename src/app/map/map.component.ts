import { style } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as geojson from 'geojson';
import * as L from 'leaflet';
import { Bounds, FeatureGroup, geoJSON, latLng, Layer, LayerGroup, Map, MapOptions, tileLayer, ZoomAnimEvent } from 'leaflet';
import 'leaflet.fullscreen';
import { CSVtoJSONPipe } from '../csvtojsonpipe';

import { colour, opacity, stylerule, text } from '../data/data.component';
import { FeatureCollectionLayer } from '../featureCollection';
import { FeaturecollectionService } from '../featurecollection.service';
import { FeaturefilterPipe } from '../featurefilter.pipe';
import { terms } from '../suburbfilter/suburbfilter.component';
import { MapStateService } from '../services/map-state.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  @Output() map$: EventEmitter<Map> = new EventEmitter();
  @Output() zoom$: EventEmitter<number> = new EventEmitter();
  bounds: Bounds = new Bounds();
  tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    opacity: 0.7,
    maxZoom: 19,
    detectRetina: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });
  // add a button to the map to toggle the tile layer
  @Input() options: MapOptions = {
    layers: [this.tileLayer],
    zoom: 1,
    center: latLng(0, 0),
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: 'topleft',
      title: 'Full screen',
      titleCancel: 'Full screen cancel',
      forcePseudoFullscreen: true, // limit fullscreen to window of map
    },
  };

  // to toggle the tile layer on and off, you can call the following function
  toggleTileLayer() {
    if (this.map?.hasLayer(this.tileLayer)) {
      this.map.removeLayer(this.tileLayer);
    } else {
      this.map?.addLayer(this.tileLayer);
    }
  }

  private _featureCollection!: FeatureCollectionLayer[];
  private featureGroup = new FeatureGroup();
  sub: any;

  get FeatureCollection() {
    return this._featureCollection;
  }

  public map: Map | undefined;
  public tempmap: point[] = [];

  public zoom: number | undefined;
  //easybutton = L.easyButton('fa-map', this.toggleTileLayer).addTo(this.map);

  constructor(
    private fcs: FeaturecollectionService,
    private snackbar: MatSnackBar,
    private mapState: MapStateService
  ) {}

  ngOnInit() {
    this.sub = this.fcs.FeatureCollectionLayerObservable.subscribe((f) => {
      console.log('received data', f);
      this.updateFeatureCollection(f);
    });

    let button = L.Control.extend({
      onAdd: function () {}
    });
    let control = new L.Control({ position: 'topright' });
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
  }

  onMapReady(map: Map) {
    this.map = map;
    this.map$.emit(map);
    this.mapState.setMap(map);
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);
    this.updateFeatureCollection();
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
    // When the page loads, check if there is a saved zoom level and set it on the map
    if (savedBounds !== null) {
      let parsed = JSON.parse(savedBounds) as any;

      let bounds = L.latLngBounds(parsed._northEast, parsed._southWest);

      this.map?.flyToBounds(bounds);
    } else {
      let b = this.featureGroup.getBounds();
      if (this.featureGroup.getLayers().length > 0) {
        this.map!.fitBounds(b);
      }
    }
  }

  updateFeatureCollection(featureCollection?: FeatureCollectionLayer[] | null) {
    if (featureCollection) {
      this._featureCollection = featureCollection;
    }
    if (this.map) {
      this.featureGroup.eachLayer((i) => {
        this.map?.removeLayer(i);
      });
      this.featureGroup = new FeatureGroup();
      this.mapState.setFeatureGroup(this.featureGroup);
      this._featureCollection
        ?.filter((f) => f.active)
        .forEach((f, i) => {
          // Handle direct point features (from CSV)
          if (f.features.length > 0 && f.features[0].geometry.type === 'Point') {
            f.features.forEach(feature => {
              if (feature.geometry.type === 'Point') {
                const pointFeature = feature as geojson.Feature<geojson.Point>;
                const marker = this.handlePoint(pointFeature, f.stylerules[0], [], i, f);
                this.featureGroup.addLayer(marker);
              }
            });
          } else {
            // Handle polygon features with styling data
            let ffp = new FeaturefilterPipe().transform(f, this._featureCollection[i].terms?.triggerval);
            let styledata = new CSVtoJSONPipe().csvJSON(this._featureCollection[i].styledata as any);
            let stylerules = this._featureCollection[i].stylerules;
            ffp.features.forEach((feature) => {
              let _fc = this._featureCollection[i];
              let geocolumn = _fc.geocolumn?.GEOJSON.toString();
              let csvgeocolumn = _fc.geocolumn?.GEOColumn.toString();

              if (geocolumn) {
                if (styledata.length) {
                  let geocolumnindex = styledata[0]?.findIndex((col) => col.toLowerCase() == csvgeocolumn.toLowerCase());
                  let propertytomatch = feature.properties?.[geocolumn];

                  styledata.forEach((stylerow) => {
                    let _suburb = stylerow[geocolumnindex];

                    if (propertytomatch?.toLowerCase() == _suburb?.toLowerCase()) {
                      if (feature.geometry.type == 'MultiPolygon') {
                        let geo = this.handlePolygon(stylerules, feature, stylerow, i, _fc);
                        let l = geo.addTo(this.featureGroup);
                        this.featureGroup.addLayer(l);
                      }
                      if (feature.geometry.type == 'Polygon') {
                        let geo = this.handlePolygon(stylerules, feature, stylerow, i, _fc);
                        let l = geo.addTo(this.featureGroup);
                        this.featureGroup.addLayer(l);
                      }
                    }
                  });
                }
              }
            });
          }
          this.featureGroup.addTo(this.map!);
          this.snackbar.open(this.featureGroup.getLayers().length + ' features added.');
        });
    }
  }

  handlePoint(feature: geojson.Feature<geojson.Point>, s: stylerule, stylerow: string[], i: number, _fc: FeatureCollectionLayer): L.Marker {
    let styledata = new CSVtoJSONPipe().csvJSON(this._featureCollection[i].styledata as any);
    let styledatacolumnindex = styledata[0]?.indexOf(s.column);
    let value = stylerow[styledatacolumnindex];
    
    // Create marker at the point's coordinates
    var geo = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
    
    let text = '';
    let opacity = 1;
    let colour = 'blue'; // Default color for points

    // Apply styling rules if available
    if (s) {
      switch (s.ruletype.rulename) {
        case 'opacity': {
          let a = s.ruletype as opacity;
          opacity = a.opacityvalue;
          break;
        }
        case 'colour': {
          let a = s.ruletype as colour;
          if (a.colour) {
            colour = value || a.colour;
          }
          break;
        }
        case 'text': {
          let a = s.ruletype as text;
          text = a.textvalue || value || '';
          break;
        }
      }
    }

    // Add properties as popup content
    if (feature.properties) {
      const popupContent = Object.entries(feature.properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join('<br>');
      geo.bindPopup(popupContent);
    }

    geo.setIcon(this.geticon(colour, opacity, text));
    
    // Add point to map state
    let p = new point([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
    p.id = text || 'Point ' + (this.mapState.points.length + 1);
    p.x = this.latLngToXY(feature.geometry.coordinates[1], feature.geometry.coordinates[0])[0];
    p.y = this.latLngToXY(feature.geometry.coordinates[1], feature.geometry.coordinates[0])[1];
    this.mapState.addPoint(p);
    
    return geo;
  }
  getxypoint(map: L.Map | undefined) {
    this.tempmap = []
    // Create an array to hold all the points

    // Loop through all the layers on the map
    map?.eachLayer((layer: L.Layer) => {
      // Check if the layer is a marker, circle, or polygon
      if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polygon) {
        //  console.log(layer)
        let d = new point([1,1]);
        //layer._icon.innerText
        d.id = (layer as any)?._icon.innerText;
        const crs = L.CRS.EPSG3857;
        // let latlng = crs.latLngToPoint((layer as L.Marker).getLatLng(),this.map?.getZoom()??1);
        let latlng = (layer as L.Marker).getLatLng();

        d.setLatLng(latlng);
        d.x = this.latLngToXY(latlng.lat,latlng.lng)[0]
        d.y = this.latLngToXY(latlng.lat,latlng.lng)[1]

        this.tempmap.push(d);

      }
    });

    // The `points` array now contains all the points on the map
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

  handlePolygon(stylerules: stylerule[], feature: geojson.Feature<geojson.Geometry, geojson.GeoJsonProperties>, stylerow: string[], i: number, _fc: FeatureCollectionLayer): L.GeoJSON<any> {
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
}
export class point extends L.Marker {
  id: string | undefined;
  x:number |undefined
  y:number |undefined
}
