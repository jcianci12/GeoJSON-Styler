import { Component, Input, OnInit } from '@angular/core';
import { Feature } from 'geojson';

@Component({
  selector: 'app-featurerow',
  templateUrl: './featurerow.component.html',
  styleUrls: ['./featurerow.component.css'],
})
export class FeaturerowComponent implements OnInit {
  constructor() {}
  @Input() feature!: Feature;
  ngOnInit(): void {}
} 