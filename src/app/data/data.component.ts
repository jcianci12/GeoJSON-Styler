import { ThisReceiver } from '@angular/compiler';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GeoDataEndpointClient } from 'src/api/api';
import { FeatureCollectionLayer } from '../featureCollection';
import { FeaturecollectionService } from '../featurecollection.service';
import { JsontocsvPipe } from '../jsontocsv.pipe';
import {
  GeocolumnComponent,
  GeoColumnMapping,
} from './geocolumn/geocolumn.component';

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.css'],
  providers: [GeoDataEndpointClient],
})
export class DataComponent implements OnInit {
  d: string | any =
    'qld_loca_2,opacity,colour\r\nBeenleigh,0.5,blue\r\nSunnybank,0.7,red\r\n';
  _geoColumn: GeoColumnMapping = { GEOJSON: 'qld_loca_2', GEOColumn: 'suburb' };
  private _endpointurl: string =
    'http://localhost:54933/GetSuburbRegistrantCountsForRound?runnumber=11';
  set endpointurl(val: string) {
    this._endpointurl = val;
    //fetch the data from the endpoint
  }
  get endpointurl() {
    return this._endpointurl;
  }

  get stylerules() {
    return this._stylerules;
  }
  @Input() feature!: number;
  @Input() set stylerules(val: stylerule[]) {
    this._stylerules = val;
    //this.stylerulesChange.emit(this._stylerules);
    this.updateData(this.d);
  }
  _stylerules: stylerule[] = [];

  @Input() featurecollectionlayerindex!: number;
  @Input() featureCollectionLayers!: FeatureCollectionLayer[];

  get geoColumn(): GeoColumnMapping {
    return this._geoColumn;
  }
  set geoColumn(val: GeoColumnMapping) {
    if (val &&val.GEOColumn && val.GEOJSON) {
      this._geoColumn = val;
      this.updateData(this.d);
    }
  }
  // @Output() stylerulesChange = new EventEmitter<stylerule[]>();
  // @Output() geoColumnChange = new EventEmitter<string>();
  // @Output() geoDataChange = new EventEmitter<string[][]>();

  constructor(
    private fcs: FeaturecollectionService,
    private api: GeoDataEndpointClient
  ) {}

  ngOnInit(): void {
    this.updateData(this.d);
  }

  updateStyleRules(val: stylerule[]) {
    this.stylerules = val;
    this.updateData(this.d);
  }

  updateData(d: any) {
    if (this.featureCollectionLayers) {
      let _temp =
        this.featureCollectionLayers[this.featurecollectionlayerindex];
      _temp.styledata = new JsontocsvPipe().csvJSON(d);

      _temp.geocolumn = this.geoColumn;
      _temp.stylerules = this.stylerules;
      this.featureCollectionLayers[this.featurecollectionlayerindex] = _temp;
      this.fcs.FeatureCollectionLayerObservable.next(
        this.featureCollectionLayers
      );
    }
  }
  addData(data: FileList) {
    console.log(data);
    let filereader = new FileReader();
    filereader.onload = (e) => {
      console.log(filereader.result);
      this.d = filereader.result;
      this.updateData(this.d);
    };
    filereader.readAsText(data[0]);
  }
  addJSONData(data: string) {
    console.log(data);
    this.d = data;
    this.updateData(this.d);
  }
}
export interface stylerule {
  column: string;
  ruletype: ruletype;
}

export type ruletype = opacity | colour | text;

export class opacity {
  constructor() {
    this.opacityvalue = 1;
    this.rulename = 'opacity';
  }
  opacityvalue: number;
  rulename: string;
}
export class colour {
  constructor() {
    this.colour = 'grey';
    this.rulename = 'colour';
  }
  colour: string;
  rulename: string;
}
export class text {
  constructor() {
    this.textvalue = '';
    this.rulename = 'text';
  }
  textvalue: string;
  rulename: string;
}
