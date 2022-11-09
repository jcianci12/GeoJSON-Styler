import { Component, OnInit,Input, Output, EventEmitter } from '@angular/core';
import { FeatureCollectionLayer } from 'src/app/featureCollection';
import { terms } from 'src/app/suburbfilter/suburbfilter.component';
import { Select } from 'src/app/tableheaders.pipe';

@Component({
  selector: 'app-geocolumn',
  templateUrl: './geocolumn.component.html',
  styleUrls: ['./geocolumn.component.css']
})
export class GeocolumnComponent implements OnInit {
  @Input() featureCollectionLayer:FeatureCollectionLayer =new FeatureCollectionLayer([],new terms(),[],{GEOColumn:"suburb",GEOJSON:"qld_loca_2"})

@Input()  tableheaders:Select[] = []
  _geocolumn: GeoColumnMapping ={GEOColumn: "suburb",GEOJSON:"qld_loca_2"};
@Input() set geocolumn(val:GeoColumnMapping){
this._geocolumn = val
this.geocolumnChange.emit()
}
get geocolumn(){
  return this._geocolumn
}
@Output() geocolumnChange = new EventEmitter<GeoColumnMapping>()
  constructor() { }
  ngOnInit(): void {
  }
}
export interface GeoColumnMapping{
  GEOJSON:string
  GEOColumn:string
}
