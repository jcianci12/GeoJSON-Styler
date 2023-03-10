import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
  featureCollectionLayer: FeatureCollectionLayer = new FeatureCollectionLayer([], new terms(), [], { GEOColumn: 'suburb', GEOJSON: 'qld_loca_2' });
  @Input() featureCollectionIndex!: number;
  @Input() tableheaders: Select[] = [];
  _geocolumn: GeoColumnMapping = { GEOColumn: 'suburb', GEOJSON: 'qld_loca_2' };
  @Input() set geocolumn(val: GeoColumnMapping) {
    this._geocolumn = val;
    this.geocolumnChange.emit();
  }
  get geocolumn() {
    return this._geocolumn;
  }
  @Output() geocolumnChange = new EventEmitter<GeoColumnMapping>();
  constructor(private fcs: FeaturecollectionService) {}
  ngOnInit(): void {
    //this one doesnt work
    this.fcs.FeatureCollectionLayerObservable.subscribe((i) => {

      this.featureCollectionLayer = i[this.featureCollectionIndex];
    });
    //this one does
    this.fcs.FeatureCollectionLayerObservable.subscribe((i) => {

      this.featureCollectionLayer = new FeatureCollectionLayer(i[this.featureCollectionIndex].features, new terms(), [], { GEOColumn: 'suburb', GEOJSON: 'qld_loca_2' });
    });
  }
}
export interface GeoColumnMapping {
  GEOJSON: string;
  GEOColumn: string;
}
