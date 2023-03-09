import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as geojson from 'geojson';
import { Observable } from 'rxjs';
import { geoJson, Map } from 'leaflet';
import { terms } from './suburbfilter/suburbfilter.component';
import { FeatureCollectionLayer } from './featureCollection';
import { stylerule } from './data/data.component';
import { FeaturecollectionService } from './featurecollection.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { GeoColumnMapping } from './data/geocolumn/geocolumn.component';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [HttpClient],
})
export class AppComponent implements OnInit {
  title = 'GeoJson-Styler';
  public featureCollectionLayers: FeatureCollectionLayer[] = [];
  _triggerval: number = 0;
  get triggerval() {
    return this._triggerval;
  }
  set triggerval(val) {
    this._triggerval = val;
  }
  expanded = new Promise((resolve) => {
    setTimeout(() => {
      console.log('resolving');
      resolve(true);
    }, 1000);
  });

  public reader: FileReader = new FileReader();
  constructor(private http: HttpClient,private fcs:FeaturecollectionService) {}

  ngOnInit(): void {
    this.addlistener()

    this.addLayer()
  }
  updateTerms($event: terms, index: number) {
    this.featureCollectionLayers[index].terms = $event;
    this.featureCollectionLayers[index].terms!.triggerval++;
    this.triggerval++;
    // let t = this.featureCollectionLayers
    // this.featureCollectionLayers = []
    // this.featureCollectionLayers = t
  }
  updatestyles(val: stylerule[], index: number) {
    this.featureCollectionLayers[index].stylerules = val;
    this.featureCollectionLayers[index].terms!.triggerval++;
  }
  updateGeoColumn(val:GeoColumnMapping,index:number){
    this.featureCollectionLayers[index].geocolumn = val;
    this.featureCollectionLayers[index].terms!.triggerval++;
  }
  updateStyleData(val:string[][],index:number){
    this.featureCollectionLayers[index].styledata = val;
  }

  removeLayer(l: number) {

    this.featureCollectionLayers.splice(l, 1);
    this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers)
  }


  public map: Map | undefined;
  private zoom: number | undefined;

  receiveMap(map: Map) {
    this.map = map;
  }

  receiveZoom(zoom: number) {
    this.zoom = zoom;
  }

  updateActive(val:MatCheckboxChange,index:number){
    this.featureCollectionLayers[index].active = val.checked
    this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers)
  }

addlistener(){
  this.reader.onloadend = () => {
    let fc = JSON.parse(
      this.reader.result as string
    ) as geojson.FeatureCollection;
    let l = new FeatureCollectionLayer(
      fc.features,
      {
        terms: [],
        triggerval: 0,
      },
      this.style,{GEOColumn:"qld_loca_2",GEOJSON:"suburb"}
    );

    this.featureCollectionLayers.push(l);
  };
}
addLayer(){

    let l = new FeatureCollectionLayer(
      [],
      {
        terms: [],
        triggerval: 0,
      },
      this.style,{GEOColumn:"qld_loca_2",GEOJSON:"suburb"}
    );

    this.featureCollectionLayers.push(l);
    console.log(this.featureCollectionLayers[0].stylerules);

}

  get style():stylerule[]{
    return [ ]
  }
}
