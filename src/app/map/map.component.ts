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

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  @Output() map$: EventEmitter<Map> = new EventEmitter();
  @Output() zoom$: EventEmitter<number> = new EventEmitter();
  bounds: Bounds = new Bounds();
  @Input() options: MapOptions = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        opacity: 0.7,
        maxZoom: 19,
        detectRetina: true,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
    ],
    zoom: 1,
    center: latLng(0, 0),
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: 'topleft',
      title: 'Vollbild-Anzeige',
      titleCancel: 'Vollbild-Anzeige verlassen',
      forcePseudoFullscreen: true, // limit fullscreen to window of map
    },
  };
  private _featureCollection!: FeatureCollectionLayer[];
  private featureGroup = new FeatureGroup();
  sub: any;

  get FeatureCollection() {
    return this._featureCollection;
  }
  public map: Map | undefined;
  public zoom: number | undefined;

  constructor(private fcs: FeaturecollectionService, private snackbar: MatSnackBar) {}

  ngOnInit() {
    this.sub = this.fcs.FeatureCollectionLayerObservable.subscribe((f) => {
      console.log('received data', f);
      this.updateFeatureCollection(f);
    });
  }

  ngOnDestroy() {
    this.map?.clearAllEventListeners;
    this.map?.remove();
  }

  onMapReady(map: Map) {
    this.map = map;
    this.map$.emit(map);
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);
    this.updateFeatureCollection();
  }

  onMapZoomEnd(e: ZoomAnimEvent | any) {
    this.zoom = e.target.getZoom();
    this.zoom$.emit(this.zoom);
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
      this._featureCollection
        ?.filter((f) => f.active)
        .forEach((f, i) => {
          let ffp = new FeaturefilterPipe().transform(f, this._featureCollection[i].terms?.triggerval);
          let styledata = new CSVtoJSONPipe().csvJSON(this._featureCollection[i].styledata as any);
          let stylerules = this._featureCollection[i].stylerules;
          ffp.features.forEach((feature) => {
            //add the layer to the group
            let _fc = this._featureCollection[i];

            //is there a geo column?
            let geocolumn = _fc.geocolumn?.GEOJSON.toString(); //"qld_loca_2"
            let csvgeocolumn = _fc.geocolumn?.GEOColumn.toString();

            if (geocolumn) {
              //get the index of the geo column
              if (styledata.length) {
                let geocolumnindex = styledata[0]?.findIndex((col) => col.toLowerCase() == csvgeocolumn.toLowerCase());
                let propertytomatch = feature.properties?.[geocolumn];

                styledata.forEach((stylerow) => {
                  //use the geocolumn index
                  let _suburb = stylerow[geocolumnindex];

                  if (propertytomatch && _suburb && propertytomatch.toLowerCase() == _suburb.toLowerCase()) {
                    stylerules.forEach((s) => {
                      // console.log(typeof feature)
                      if (feature.geometry.type == 'MultiPolygon') {
                        let geo = this.handlePolygon(s, feature, stylerow, i, _fc);
                        let l = geo.addTo(this.featureGroup);
                        this.featureGroup.addLayer(l);

                      }
                      if (feature.geometry.type == 'Point') {
                        let geo = this.handlePoint(feature as unknown as geojson.Feature<geojson.Point>,s, stylerow, i, _fc);
                        let l = geo.addTo(this.featureGroup);
                        this.featureGroup.addLayer(l);
                      }

                    });
                  }
                });
              }
            }
          });
          this.featureGroup.addTo(this.map!);

          this.snackbar.open(this.featureGroup.getLayers().length + " features added.")

          let b = this.featureGroup.getBounds();
          if (this.featureGroup.getLayers().length > 0) {
            this.map!.fitBounds(b);
          }
        });
    }
  }

  handlePoint(feature: geojson.Feature<geojson.Point>, s: stylerule, stylerow: string[], i: number, _fc: FeatureCollectionLayer): L.Marker {
    let styledata = new CSVtoJSONPipe().csvJSON(this._featureCollection[i].styledata as any);
    let styledatacolumnindex = styledata[0].indexOf(s.column);
    let value = stylerow[styledatacolumnindex];
    var geo = L.marker([feature.geometry.coordinates[1],feature.geometry.coordinates[0]]);
let text = ''
let opacity = 1
let colour = ''
    switch (s.ruletype.rulename) {
      case 'opacity': {
        let a = s.ruletype as opacity;

        //geo.setOpacity(Number.parseFloat(value));
        opacity = a.opacityvalue
        break;
      }
      case 'colour': {
        let a = s.ruletype as colour;

        //if the style has been set globally, use that value
        if (a.colour) {
          colour = a.colour;
        }

        break;
      }
      case 'text': {
        let a = s.ruletype as text;
          text =  a.textvalue==''?value:a.textvalue

        break;
      }
    }
    geo.setIcon(this.geticon(colour,opacity,text))
    return geo;
  }
  geticon(colour:string,opacity:number,text:string):L.DivIcon{
    let markerHtmlStyles = `
    background-color: `+(colour??'grey')+`;
    width: 1rem;
    opacity: `+opacity+`;
    height: 1rem;
    display: block;
    left: -1.5rem;
    top: -1.5rem;
    position: relative;
    border-radius: 1rem 1rem 0;

    border: 1px solid #FFFFFF`;
      let icon = L.divIcon({
        className: 'my-custom-pin',
        iconAnchor: [0, 24],
        tooltipAnchor: [-6, 0],
        popupAnchor: [0, -36],
        html: `<div><span style="${markerHtmlStyles}"/>`+text+`</div>`,
      });
      return icon
  }

  handlePolygon(s: stylerule, feature: geojson.Feature<geojson.Geometry, geojson.GeoJsonProperties>, stylerow: string[], i: number, _fc: FeatureCollectionLayer): L.GeoJSON<any> {
    let geo = geoJSON(feature);
    let styledata = new CSVtoJSONPipe().csvJSON(this._featureCollection[i].styledata as any);
    let styledatacolumnindex = styledata[0].indexOf(s.column);
    let value = stylerow[styledatacolumnindex];

    switch (s.ruletype.rulename) {
      case 'opacity': {
        geo.setStyle({
          fillOpacity: Number.parseFloat(value),
        });
        break;
      }
      case 'colour': {
        let a = s.ruletype as colour;

        //if the style has been set globally, use that value
        if (a.colour) {
          value = a.colour;
        }

        geo.setStyle({
          fillColor: value,
          color: value,
        });
        break;
      }
      case 'text': {
        if (true) {
          let lat = (s.ruletype as text).latoffset + geo.getBounds().getCenter().lat;
          let lng = (s.ruletype as text).lngoffset + geo.getBounds().getCenter().lng;

          let label = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'text-labels', // Set class for CSS styling
              html: '<div style="' + (s.ruletype as text).cssstyle + '">' + value + '</div>',
            }),
            zIndexOffset: 1000, // Make appear above other map features
          });
          //apply the offset

          label.addTo(geo);
        }
        break;
      }
    }
    return geo;
  }
}
