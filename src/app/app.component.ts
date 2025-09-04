import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as geojson from 'geojson';
import { Map } from 'leaflet';
import { FeatureCollectionLayer, LayerType } from './featureCollection';
import { stylerule } from './data/data.component';
import { FeaturecollectionService } from './featurecollection.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { LatLngColumnMapping } from './data/latlng-column/latlng-column-mapping';
import { CSVtoJSONPipe } from './csvtojsonpipe';
import { TableheadersPipe } from './tableheaders.pipe';
import { Select } from './tableheaders.pipe';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [HttpClient],
})
export class AppComponent implements OnInit {
  title = 'GeoJson-Styler';
  style: stylerule[] = [];
  reader = new FileReader();
  _triggerval: number = 0;
  get triggerval() {
    return this._triggerval;
  }
  set triggerval(val) {
    this._triggerval = val;
  }
  expanded: boolean = false;

  csvData: string = '';
  headers: Select[] = [];

  constructor(private http: HttpClient, private fcs: FeaturecollectionService) {
    this.addlistener();
  }

  ngOnInit(): void {
    // No need to subscribe here as we'll access through the service
  }

  // Getter to access feature collection layers from service
  get featureCollectionLayers(): FeatureCollectionLayer[] {
    return this.fcs.FeatureCollectionLayers || [];
  }

  // Getter to access the processed GeoJSON for all layers
  get processedGeoJson(): geojson.FeatureCollection {
    return this.fcs.getGeoJsonForAllLayers();
  }

  // Getter to access individual layer GeoJSON
  getLayerGeoJson(index: number): geojson.FeatureCollection {
    return this.fcs.getGeoJsonForLayer(index);
  }

  updateActive(event: any, index: number) {
    this.fcs.updateActive(event, index);
  }

  onLayerTypeChange(index: number) {
    this.fcs.onLayerTypeChange(index);
  }

  removeLayer(index: number) {
    this.fcs.removeLayer(index);
  }

  addLayer() {
    this.fcs.addLayer();
  }

  addlistener() {
    this.reader.onloadend = () => {
      let fc = JSON.parse(
        this.reader.result as string
      ) as geojson.FeatureCollection;
      this.fcs.addLayerFromGeoJSON(fc.features);
    };
  }

  onLatLngColumnsSelected(index: number, mapping: LatLngColumnMapping) {
    this.fcs.onLatLngColumnsSelected(index, mapping);
  }

  onFileAdded(files: FileList) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = reader.result as string;
      this.csvData = csvData;
      const csvRows = new CSVtoJSONPipe().csvJSON(csvData);
      this.headers = new TableheadersPipe().transform([csvRows[0]]);
    };
    reader.readAsText(file);
  }

  onTestPointsAdded(features: geojson.Feature<geojson.Point, geojson.GeoJsonProperties>[]) {
    // Handle the features
  }

  public map: Map | undefined;
  public zoom: number = 0;

  receiveMap(map: Map) {
    this.map = map;
  }

  receiveZoom(zoom: number) {
    this.zoom = zoom;
  }
}
