import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FeaturecollectionService } from 'src/app/featurecollection.service';
import { Select } from 'src/app/tableheaders.pipe';
import {
  colour,
  opacity,
  ruletype,
  stylerule,
  stylerules,
  text,
} from '../data.component';

@Component({
  selector: 'app-stylerule',
  templateUrl: './stylerule.component.html',
  styleUrls: ['./stylerule.component.css'],
})
export class StyleruleComponent implements OnInit {
  constructor(private fcs: FeaturecollectionService) {}
  styleruleOptions: string[] = [new opacity(), new colour(), new text()].map(
    (i) => i.rulename
  );
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
  ngOnInit(): void {
    this.addrule();
  }

  addrule() {
    let _temp = this.stylerules;
    _temp.push({ column: 'demoint', ruletype: new text() });
    this.stylerules = _temp;
  }

  removeRule(index: number) {
    this.stylerules.splice(index, 1);
    this.stylerules = this.stylerules;
  }
  updateRule(index: number, stylerule: stylerule) {
    // let t = stylerules;

    //get the matching class
    let matchingrule = [new opacity(), new colour(), new text()].find(
      (i) => i.rulename == stylerule.ruletype.rulename
    );
    Object.keys(matchingrule!).forEach((key: string, ind: number) => {
      //matchingrule[key]= stylerule[key]
      if ((stylerule.ruletype as any)[key]) {
        (matchingrule as any)[key] = (stylerule.ruletype as any)[key];
      }
      //console.log("matching rule",matchingrule,"key",key,"index",ind,"stylerule",stylerule)
    });

    //save the data for use later
    let _temp = this.stylerules;
    // _temp[index] = { column: stylerule.column, ruletype: selected! };
    this.stylerules = [];
    this.stylerules = _temp;
    this.stylerules[index] = {
      column: stylerule.column,
      ruletype: matchingrule!,
    };
    this.stylerulesChange.emit(this.stylerules);
  }
}
