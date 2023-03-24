import { Component, Input, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { LatLng, Layer } from 'leaflet';
import { point } from '../map/map.component';

@Component({
  selector: 'app-mapdata',
  templateUrl: './mapdata.component.html',
  styleUrls: ['./mapdata.component.css'],
})
export class MapdataComponent implements OnInit {
  @Input() public points: point[] | undefined;
  @Input() public map!:L.Map|undefined
   constructor() {}

  ngOnInit(): void {}

  distance(point1: L.Point, point2: L.Point) {
    if (point1 && point2) {
      return point1.distanceTo(point2);
    } else {
      return 0;
    }
  }



  get maxx() {
    let d = this.points?.map((m) => m.x).reduce((max, num) => (num! > max! ? num : max), Number.NEGATIVE_INFINITY);
    if (d) {
      return d;
    } else {
      return 0;
    }
  }
  get minx() {
    let d = this.points?.map((m) => m.x).reduce((max, num) => (num! < max! ? num : max), Number.POSITIVE_INFINITY);
    if (d) {
      return d;
    } else {
      return 0;
    }
  }
  get maxy() {
    let d = this.points?.map((m) => m.y).reduce((max, num) => (num! > max! ? num : max), Number.NEGATIVE_INFINITY);
    if (d) {
      return d;
    } else {
      return 0;
    }
  }
  get miny() {
    let d = this.points?.map((m) => m.y).reduce((max, num) => (num! < max! ? num : max), Number.POSITIVE_INFINITY);
    if (d) {
      return d;
    } else {
      return 0;
    }
  }
}
