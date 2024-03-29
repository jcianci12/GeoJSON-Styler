import { ThisReceiver } from '@angular/compiler';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GeoDataEndpointClient } from 'src/api/api';
import { FeatureCollectionLayer } from '../featureCollection';
import { FeaturecollectionService } from '../featurecollection.service';
import { CSVtoJSONPipe } from '../csvtojsonpipe';
import { GeocolumnComponent, GeoColumnMapping } from './geocolumn/geocolumn.component';
import { JsontocsvPipe } from '../jsontocsv.pipe';
import { distinctUntilChanged } from 'rxjs';

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
    //fetch the data from the endpoint
  }
  get endpointurl() {
    return this._endpointurl;
  }


  @Input() feature!: number;


  @Input() featurecollectionlayerindex!: number;
  @Input() featureCollectionLayers!: FeatureCollectionLayer[];

  // get geoColumn(): GeoColumnMapping {
  //   return this._geoColumn;
  // }
  // set geoColumn(val: GeoColumnMapping) {
  //   if (val && val.GEOColumn && val.GEOJSON) {
  //     this._geoColumn = val;
  //     //this.updateDable();
  //   }
  // }


  constructor(private fcs: FeaturecollectionService, private api: GeoDataEndpointClient) {}

  ngOnInit(): void {
    this.fcs.FeatureCollectionLayerObservable.pipe(distinctUntilChanged()).subscribe((i) => {
      this.featureCollectionLayers = i;
      this.updateData();
    });
  }

  updateStyleRules(val: stylerule[]) {
    this.featureCollectionLayers[this.featurecollectionlayerindex].stylerules = val
    this.updateData();
  }

  updateData() {
    if (this.featureCollectionLayers) {
      let _temp = this.featureCollectionLayers[this.featurecollectionlayerindex];
      //for some reason, in update data im trying to pass a string to this function
      this.d = _temp.styledata;
      _temp.stylerules = _temp.stylerules;
      this.featureCollectionLayers[this.featurecollectionlayerindex] = _temp;
      this.fcs.FeatureCollectionLayerObservable.next(this.featureCollectionLayers);
    }
  }
  addData(data: FileList) {
    let filereader = new FileReader();
    filereader.onload = (e) => {
      //this works setting the value from the csv file data.
      this.d = filereader.result;
      this.d = this.d.replace(/"/g,"")
      this.featureCollectionLayers[this.featurecollectionlayerindex].styledata = this.d;
      this.updateData();
    };
    filereader.readAsText(data[0]);
  }
  addJSONData(data: string) {
    //console.log(data);
    this.d = data;
    this.updateData();
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
