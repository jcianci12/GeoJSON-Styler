import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { FeatureCollectionLayer } from 'src/app/featureCollection';
import { FeaturecollectionService } from 'src/app/featurecollection.service';
import { terms } from 'src/app/suburbfilter/suburbfilter.component';
import { Select } from 'src/app/tableheaders.pipe';

@Component({
  selector: 'app-geocolumn',
  templateUrl: './geocolumn.component.html',
  styleUrls: ['./geocolumn.component.css'],
})
export class GeocolumnComponent implements OnInit {
 featureCollectionLayers!: FeatureCollectionLayer [];

  @Input() featureCollectionIndex!: number;
  @Input() tableheaders: Select[] = [];
  _geocolumn: GeoColumnMapping = { GEOColumn: '', GEOJSON: '' };
  // @Input() set geocolumn(val: GeoColumnMapping) {
  //   this._geocolumn = val;
  //   // this.fcs.UpdateLayer(this.featureCollectionLayer,this.featureCollectionIndex)
  //   this.geocolumnChange.emit(this.geocolumn);
  // }
  // get geocolumn() {
  //   return this._geocolumn;
  // }
  geocolumn:GeoColumnMapping= {GEOColumn:'',GEOJSON:''}
  @Output() geocolumnChange = new EventEmitter<GeoColumnMapping>();
  constructor(private fcs: FeaturecollectionService) {}
  ngOnInit(): void {

    //this one does
    this.fcs.FeatureCollectionLayerObservable.subscribe((i) => {
// this.featureCollectionLayers =i
//       this.featureCollectionLayers[this.featureCollectionIndex] = new FeatureCollectionLayer(i[this.featureCollectionIndex].features, new terms(), [], { GEOColumn: '', GEOJSON: '' },[]);
this.featureCollectionLayers = [];
      this.featureCollectionLayers = i;
    });
  }

  geoSelectChanged(event:MatSelectChange){
  // this.geocolumn = { GEOColumn:event.,GEOJSON:''}
  }
}

export interface GeoColumnMapping {
  GEOJSON: string;
  GEOColumn: string;
}
