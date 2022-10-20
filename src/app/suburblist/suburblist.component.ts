import { Component, Input, OnInit } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { FeatureCollectionLayer } from '../featureCollection';
import { terms } from '../suburbfilter/suburbfilter.component';

@Component({
  selector: 'app-suburblist',
  templateUrl: './suburblist.component.html',
  styleUrls: ['./suburblist.component.css'],
})
export class SuburblistComponent implements OnInit {
  @Input() featureCollection!: FeatureCollectionLayer

  constructor() {}

  ngOnInit(): void {}
}
