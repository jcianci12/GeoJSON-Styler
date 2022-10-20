import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FeatureCollectionLayer } from '../featureCollection';
import { FeaturecollectionService } from '../featurecollection.service';
import { JsontocsvPipe } from '../jsontocsv.pipe';

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.css'],
})
export class DataComponent implements OnInit {
  d: string | any =
    'qld_loca_2,opacity,colour\r\nBeenleigh,0.5,blue\r\nSunnybank,0.7,red\r\n';
  _geoColumn: string = 'qld_loca_2';

  get stylerules() {
    return this._stylerules;
  }
  @Input() feature!:number
  @Input() set stylerules(val: stylerule[]) {
    this._stylerules = val;
    //this.stylerulesChange.emit(this._stylerules);
    this.updateData()
  }
  _stylerules: stylerule[] = [];

  @Input() featurecollectionlayerindex!: number;
  @Input() featureCollectionLayers!:FeatureCollectionLayer[]

  get geoColumn() {
    return this._geoColumn;
  }
  set geoColumn(val: string) {
    this._geoColumn = val;
    this.updateData()
  }
  // @Output() stylerulesChange = new EventEmitter<stylerule[]>();
  // @Output() geoColumnChange = new EventEmitter<string>();
  // @Output() geoDataChange = new EventEmitter<string[][]>();

  constructor(private fcs: FeaturecollectionService) {}

  ngOnInit(): void {
    this.updateData();
  }

  updateStyleRules(val: stylerule[]) {
    this.stylerules = val;
    this.updateData()
  }

  updateData() {
    if (this.featureCollectionLayers) {
      let _temp = this.featureCollectionLayers[
        this.featurecollectionlayerindex
      ]
      _temp.styledata = new JsontocsvPipe().csvJSON(this.d);
      _temp.geocolumn = this.geoColumn
      _temp.stylerules = this.stylerules
      this.featureCollectionLayers[
        this.featurecollectionlayerindex
      ]=_temp;
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
      this.updateData();
    };
    filereader.readAsText(data[0]);
  }
}
export interface stylerule {
  column: string;
  ruletype: ruletype;
}

export type ruletype = 'shading colour/opacity' | 'opacity' | 'colour'|'text';
