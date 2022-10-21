import { style } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as geojson from 'geojson';
import * as L from 'leaflet';
import {
  Bounds,
  FeatureGroup,
  geoJSON,
  latLng,
  Layer,
  LayerGroup,
  Map,
  MapOptions,
  tileLayer,
  ZoomAnimEvent,
} from 'leaflet';
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
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
    ],
    zoom: 1,
    center: latLng(0, 0),
  };
  private _featureCollection!: FeatureCollectionLayer[];
  private featureGroup = new FeatureGroup();
  sub: any;

  get FeatureCollection() {
    return this._featureCollection;
  }
  public map: Map | undefined;
  public zoom: number | undefined;

  constructor(private fcs: FeaturecollectionService) {}

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
          let ffp = new FeaturefilterPipe().transform(
            f,
            this._featureCollection[i].terms?.triggerval
          );
          ffp.features.forEach((feature) => {
            //add the layer to the group

            //is there a geo column?
            let geocolumn = this._featureCollection[i].geocolumn
              .toString()
              .toLowerCase(); //"qld_loca_2"

            if (geocolumn) {
              let styledata = this._featureCollection[i].styledata;
              let stylerules = this._featureCollection[i].stylerules;
              //get the index of the geo column
              let geocolumnindex = styledata[0].indexOf(geocolumn);
              let propertytomatch = feature.properties?.[geocolumn];
              styledata.forEach((stylerow) => {
                //use the geocolumn index
                let suburb = stylerow[geocolumnindex];
                if (
                  propertytomatch && suburb &&
                  propertytomatch.toLowerCase() == suburb.toLowerCase()
                ) {
                  let geo = geoJSON(feature);
                  stylerules.forEach((s) => {
                    let styledatacolumnindex = styledata[0].indexOf(s.column);
                    let value = stylerow[styledatacolumnindex];

                    switch (s.ruletype) {
                      case 'opacity': {
                        //get the index of the data column
                        geo.setStyle({
                          fillOpacity: Number.parseFloat(value),
                        });
                        break;
                      }
                      case 'colour': {
                        //get the index of the data column
                        geo.setStyle({
                          fillColor: value,
                        });
                        break;
                      }
                      case 'text': {
                        let label = L.marker(geo.getBounds().getCenter(), {
                          icon: L.divIcon({
                            className: 'text-labels', // Set class for CSS styling
                            html: value,
                          }),
                          zIndexOffset: 1000, // Make appear above other map features
                        });
                        label.addTo(this.featureGroup);
                        break;
                      }
                      default: {
                        geo.setStyle({
                          fillColor: 'grey',
                          color: 'grey',
                          fillOpacity: 0.1,
                        });
                      }
                    }

                    let l = geo.addTo(this.featureGroup);
                    this.featureGroup.addLayer(l);
                  });
                }
              });
            }
          });
          this.featureGroup.addTo(this.map!);

          let b = this.featureGroup.getBounds();
          if (this.featureGroup.getLayers().length > 0) {
            this.map!.fitBounds(b);
          }
        });
    }
  }
}
