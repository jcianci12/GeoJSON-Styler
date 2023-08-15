import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Feature } from 'geojson';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { FeatureCollectionLayer } from '../featureCollection';
import { FeaturecollectionService } from '../featurecollection.service';

@Component({
  selector: 'app-suburbfilter',
  templateUrl: './suburbfilter.component.html',
  styleUrls: ['./suburbfilter.component.css'],
})
export class SuburbfilterComponent implements OnInit {
 @Input() featureCollectionLayer:FeatureCollectionLayer =new FeatureCollectionLayer([],new terms(),[],{GEOColumn:"suburb",GEOJSON:"qld_loca_2"},[])
  @Input() feature: Feature | null | undefined;
  @Output() termChange = new EventEmitter<terms>();
  @Input() layerIndex!:number
  changeSubject = new Subject<{ key: string; phrase: Event }>();

  constructor(private fcs:FeaturecollectionService) {
    this.changeSubject
    .pipe(debounceTime(300))
    .subscribe(({ key, phrase }) => this.change(key, phrase));
  }
  ngOnInit(): void {
    this.fcs.FeatureCollectionLayerObservable.pipe().subscribe(i=>{
      this.featureCollectionLayer = i[this.layerIndex]
    })
  }

  change(key: string, phrase: Event) {
    let val = (phrase.target as HTMLInputElement).value;
    let findIndex = this.featureCollectionLayer.terms?.terms.findIndex((i) => i.key == key);
    if (findIndex == -1) {
      this.featureCollectionLayer.terms?.terms.push({ key: key, phrase: val });
    } else {
      this.featureCollectionLayer.terms!.terms[findIndex!].phrase = val;
    }

    //this.term[(key as any). toString()] = (val.target as HTMLInputElement ).value
    if(this.featureCollectionLayer.terms&& this.featureCollectionLayer.terms.terms){
      var lastval = this.fcs.FeatureCollectionLayerObservable.getValue()
      lastval[this.layerIndex]= this.featureCollectionLayer
          //this.termChange.emit(this.featureCollectionLayer.terms);
          this.fcs.FeatureCollectionLayerObservable.next(lastval)

    }
  }

    // Use this function to trigger change events
    triggerChange(key: string, phrase: Event) {
      this.changeSubject.next({ key, phrase });
    }

getTermValue(key:string){

  let findIndex = this.featureCollectionLayer.terms?.terms.findIndex(t=>t.key==key)
//set the value of the property based on the value of the term


return  findIndex!=-1? this.featureCollectionLayer.terms?.terms[findIndex!].phrase:""



}

}

type term = { key: string; phrase: string };
export class terms {
  constructor() {
    this.terms = [];
    this.triggerval = 0
  }
  terms:Array<term>;
  triggerval:number
}
