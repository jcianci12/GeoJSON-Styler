import { ThisReceiver } from '@angular/compiler';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GeoDataEndpointClient } from 'src/api/api';
import { FeatureCollectionLayer } from '../featureCollection';
import { FeaturecollectionService } from '../featurecollection.service';
import { CSVtoJSONPipe } from '../csvtojsonpipe';
import { GeocolumnComponent, GeoColumnMapping } from './geocolumn/geocolumn.component';
import { JsontocsvPipe } from '../jsontocsv.pipe';
import { distinctUntilChanged } from 'rxjs';
import { LatLngColumnMapping } from './latlng-column/latlng-column-mapping';
import * as geojson from 'geojson';
import * as L from 'leaflet';

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.css'],
  providers: [GeoDataEndpointClient],
})
export class DataComponent implements OnInit {
  d: string | any = 'qld_loca_2,opacity,colour\r\nBeenleigh,0.5,blue\r\nSunnybank,0.7,red\r\n';
  private _endpointurl: string = 'http://localhost:54933/GetSuburbRegistrantCountsForRound?runnumber=11';
  set endpointurl(val: string) {
    this._endpointurl = val;
  }
  get endpointurl() {
    return this._endpointurl;
  }

  @Input() feature!: number;
  @Input() featurecollectionlayerindex!: number;
  @Input() featureCollectionLayers!: FeatureCollectionLayer[];
  @Input() csvData: string = '';
  @Input() headers: string[] = [];

  constructor(private fcs: FeaturecollectionService, private api: GeoDataEndpointClient) {}

  ngOnInit(): void {
    this.fcs.FeatureCollectionLayerObservable.pipe(distinctUntilChanged()).subscribe((i) => {
      this.featureCollectionLayers = i;
      this.updateData();
    });
  }

  updateStyleRules(val: stylerule[]) {
    this.featureCollectionLayers[this.featurecollectionlayerindex].stylerules = val;
    this.updateData();
  }

  updateData() {
    if (this.featureCollectionLayers) {
      let _temp = this.featureCollectionLayers[this.featurecollectionlayerindex];
      this.d = _temp.styledata;
      _temp.stylerules = _temp.stylerules;
      this.featureCollectionLayers[this.featurecollectionlayerindex] = _temp;
      this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
    }
  }

  addData(data: FileList) {
    let filereader = new FileReader();
    filereader.onload = (e) => {
      this.d = filereader.result;
      this.d = this.d.replace(/"/g, "");
      this.featureCollectionLayers[this.featurecollectionlayerindex].styledata = this.d;
      this.updateData();
    };
    filereader.readAsText(data[0]);
  }

  addJSONData(data: string) {
    this.d = data;
    this.updateData();
  }

  onLatLngColumnsSelected(event: Event) {
    const mapping = (event as CustomEvent<LatLngColumnMapping>).detail;
    if (!this.d) return;

    const csvData = new CSVtoJSONPipe().csvJSON(this.d);
    const headers = csvData[0];
    const latIndex = headers.indexOf(mapping.latColumn);
    const lngIndex = headers.indexOf(mapping.lngColumn);

    if (latIndex === -1 || lngIndex === -1) return;

    // Convert CSV rows to GeoJSON points and filter out null values
    const features: geojson.Feature<geojson.Point>[] = csvData.slice(1)
      .map((row: string[]) => {
        const lat = parseFloat(row[latIndex]);
        const lng = parseFloat(row[lngIndex]);

        if (isNaN(lat) || isNaN(lng)) return null;

        const properties: { [key: string]: any } = {};
        headers.forEach((header: string, index: number) => {
          if (index !== latIndex && index !== lngIndex) {
            properties[header] = row[index];
          }
        });

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties
        } as geojson.Feature<geojson.Point>;
      })
      .filter((feature): feature is geojson.Feature<geojson.Point> => feature !== null);

    // Update the feature collection with the new points
    this.featureCollectionLayers[this.featurecollectionlayerindex].features = features;
    this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
  }

  onTestPointsAdded(event: Event) {
    const features = (event as CustomEvent<geojson.Feature<geojson.Point, geojson.GeoJsonProperties>[]>).detail;
    // Handle the features
  }
}

export interface stylerule {
  column: string;
  ruletype: ruletype;
}

export type ruletype = opacity | colour | text;
export type rulename = 'opacity' | 'colour' | 'text';

export class baseStyle {
  rulename: string | undefined;
  dynamic:boolean|undefined;
}
export class opacity extends baseStyle {
  constructor() {
    super();
    this.opacityvalue = 1;
    this.rulename = 'opacity';
  }
  opacityvalue: number;
}
export class colour extends baseStyle {
  constructor() {
    super();
    this.dynamic = false;
    this.colour = 'grey';
    this.rulename = 'colour';

  }
  colour: string;
}

export class text extends baseStyle {
  constructor() {
    super();
    this.textvalue = '';
    this.rulename = 'text';
    this.latoffset = 0;
    this.lngoffset = 0;
    this.cssstyle = 'colour:grey';
  }
  textvalue: string;
  latoffset: number;
  lngoffset: number;
  cssstyle: string;
}

export const stylerules: ruletype[] = [new opacity(), new colour(), new text()];

export class point extends L.Marker {
  id: string | undefined;
  x: number | undefined;
  y: number | undefined;
}

export interface colour {
  colour: string;
}

export interface opacity {
  opacityvalue: number;
}

export interface text {
  textvalue: string;
}

export interface stylerule {
  column: string;
  ruletype: colour | opacity | text;
}
