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
  featureCollectionLayers: FeatureCollectionLayer[] = [];
  style: stylerule[] = [];
  reader = new FileReader();
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

  csvData: string = '';
  headers: Select[] = [];

  constructor(private http: HttpClient, private fcs: FeaturecollectionService) {
    this.addlistener();
  }

  ngOnInit(): void {
    this.fcs.FeatureCollectionLayerObservable.subscribe((i) => {
      this.featureCollectionLayers = i;
    });
  }

  updateActive(event: any, index: number) {
    this.featureCollectionLayers[index].active = event.checked;
    this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
  }

  onLayerTypeChange(index: number) {
    const layer = this.featureCollectionLayers[index];
    if (layer.layerType === 'csv') {
      // Initialize CSV-specific properties
      layer.styledata = [];
      layer.features = [];
      layer.stylerules = [];
    }
    this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
  }

  removeLayer(index: number) {
    this.featureCollectionLayers.splice(index, 1);
    this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
  }

  addLayer() {
    let l = new FeatureCollectionLayer(
      [],
      {
        terms: [],
        triggerval: 0,
      },
      this.style,
      { GEOColumn: "qld_loca_2", GEOJSON: "suburb" },
      []
    );

    this.featureCollectionLayers.push(l);
    this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
  }

  addlistener() {
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
        this.style,
        { GEOColumn: "qld_loca_2", GEOJSON: "suburb" },
        []
      );

      this.featureCollectionLayers.push(l);
      this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
    };
  }

  onLatLngColumnsSelected(index: number, mapping: LatLngColumnMapping) {
    const layer = this.featureCollectionLayers[index];
    if (layer.layerType === 'csv') {
      // Update the layer with the new column mapping
      layer.geocolumn = {
        GEOColumn: mapping.lngColumn,
        GEOJSON: mapping.latColumn
      };
      this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
    }
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
