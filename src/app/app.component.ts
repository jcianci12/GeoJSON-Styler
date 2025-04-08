import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as geojson from 'geojson';
import { Map } from 'leaflet';
import { FeatureCollectionLayer, LayerType } from './featureCollection';
import { stylerule } from './data/data.component';
import { FeaturecollectionService } from './featurecollection.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
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

    this.fcs.FeatureCollectionLayerObservable.subscribe(i=>this.featureCollectionLayers = i)
    this.addLayer()


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

  onLayerTypeChange(index: number) {
    // The ngModel binding will handle updating the layerType
    this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
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
      this.style,{GEOColumn:"qld_loca_2",GEOJSON:"suburb"},[]
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
      this.style,{GEOColumn:"qld_loca_2",GEOJSON:"suburb"},[]
    );

    this.featureCollectionLayers.push(l);
    console.log(this.featureCollectionLayers[0].stylerules);

}

  get style():stylerule[]{
    return [ ]
  }
}
