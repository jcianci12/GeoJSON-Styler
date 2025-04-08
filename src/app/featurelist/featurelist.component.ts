import { Component, Input, OnInit } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { FeatureCollectionLayer } from '../featureCollection';
import { FeaturecollectionService } from '../featurecollection.service';
import { terms } from '../featurefilter/featurefilter.component';
import { FirstfeaturePipe } from '../firstfeature.pipe';
import { FeaturefilterPipe } from '../featurefilter.pipe';
import { SlicePipe } from '../slice.pipe';

@Component({
  selector: 'app-featurelist',
  templateUrl: './featurelist.component.html',
  styleUrls: ['./featurelist.component.css'],
})
export class FeaturelistComponent implements OnInit {
  featureCollection!: FeatureCollectionLayer;
  @Input() layerIndex!: number;
  constructor(private fcs: FeaturecollectionService) {}

  ngOnInit(): void {
    this.fcs.FeatureCollectionLayerObservable.subscribe((i) => {
      this.featureCollection = new FeatureCollectionLayer([],new terms(),[],{GEOColumn:'',GEOJSON:''},[])
      this.featureCollection = i[this.layerIndex];
    });
  }
} 