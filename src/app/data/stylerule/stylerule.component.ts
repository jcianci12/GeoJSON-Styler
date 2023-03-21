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
  styleruleOptions: (string|undefined)[] = [new opacity(), new colour(), new text()].map(
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
    //this.addrule();
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
    //get the matching class by the rule name
    let matchingrule = [new opacity(), new colour(), new text()].find(
      (i) => i.rulename == stylerule.ruletype.rulename
    );
    //loop through the keys of the new object and if there
    //is a matching key from the users settings, assign it
    Object.keys(matchingrule!).forEach((key: string) => {
      if ((stylerule.ruletype as any)[key]) {
        (matchingrule as any)[key] = (stylerule.ruletype as any)[key];
      }
      //console.log("matching rule",matchingrule,"key",key,"index",ind,"stylerule",stylerule)
    });

    //This is needed because angular wont update an object when its child properties change.
    //therefore we can clear the object and then reassign it
    let _temp = this.stylerules;
    this.stylerules = [];
    this.stylerules = _temp;
    this.stylerules[index] = {
      column: stylerule.column,
      ruletype: matchingrule!,
    };
    //this is if you want to emit the change up the tree
    this.stylerulesChange.emit(this.stylerules);
  }
}
