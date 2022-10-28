import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FeaturecollectionService } from 'src/app/featurecollection.service';
import { Select } from 'src/app/tableheaders.pipe';
import { colour, opacity, ruletype, stylerule, text } from '../data.component';

@Component({
  selector: 'app-stylerule',
  templateUrl: './stylerule.component.html',
  styleUrls: ['./stylerule.component.css'],
})
export class StyleruleComponent implements OnInit {
  constructor(private fcs: FeaturecollectionService) {}
  styleruleOptions: ruletype[] = [
    new opacity(),

    new colour(),new text()
  ];
  @Input() tableheaders: Select[] = [];
  _stylerules: stylerule[] = [];
  @Input() featureCollectionIndex: number = 0;
  @Input() set stylerules(val: stylerule[]) {
    this._stylerules = val;
    let _temp = this.fcs.FeatureCollectionLayerObservable.value;
    if (_temp) {
      _temp[this.featureCollectionIndex].stylerules = this.stylerules;
    }
    this.fcs.FeatureCollectionLayerObservable.next(_temp);
  }
  get stylerules() {
    return this._stylerules;
  }

  @Output() stylerulesChange: EventEmitter<stylerule[]> = new EventEmitter<
    stylerule[]
  >();
  ngOnInit(): void {}

  addrule() {
    let _temp = this.stylerules;
    _temp.push({ column: '', ruletype: new opacity() });
    this.stylerules = _temp;
  }

  removeRule(index: number) {
    this.stylerules.splice(index, 1);
    this.stylerules = this.stylerules
  }
  updateRule(index:number ) {
    this.stylerules =this.stylerules
  }

}
