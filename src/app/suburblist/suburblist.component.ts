import { Component, Input, OnInit } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { FeatureCollectionLayer } from '../featureCollection';
import { FeaturecollectionService } from '../featurecollection.service';
import { terms } from '../suburbfilter/suburbfilter.component';

@Component({
  selector: 'app-suburblist',
  templateUrl: './suburblist.component.html',
  styleUrls: ['./suburblist.component.css'],
})
export class SuburblistComponent implements OnInit {
  featureCollection!: FeatureCollectionLayer
@Input() layerIndex!:number
  constructor(private fcs:FeaturecollectionService) {}

  ngOnInit(): void {
    this.fcs.FeatureCollectionLayerObservable.subscribe(i=>this.featureCollection = i[this.layerIndex])
  }
}
