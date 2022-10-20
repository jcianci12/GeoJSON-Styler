import { Component, Input, OnInit } from '@angular/core';
import { Feature } from 'geojson';

@Component({
  selector: 'app-suburbrow',
  templateUrl: './suburbrow.component.html',
  styleUrls: ['./suburbrow.component.css'],
})
export class SuburbrowComponent implements OnInit {
  constructor() {}
  @Input() feature!: Feature;
  ngOnInit(): void {}
}
