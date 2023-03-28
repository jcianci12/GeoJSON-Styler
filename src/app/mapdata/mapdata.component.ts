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
  @Input() public map!: L.Map | undefined;
  checked:boolean = true
  constructor() {}

  ngOnInit(): void {}

  geoDistance(point1: point, point2: point): number {
    if (point1 && point2) {
      return point1.getLatLng().distanceTo(point2.getLatLng());
    } else {
      return 0;
    }
  }
  xyDistance(point1:point,point2:point):number{
    var dx = point1?.x! - point2?.x!;
    var dy = point1?.y! - point2?.y!;
    return Math.sqrt(dx * dx + dy * dy);
  }


  // latlngtoXY(latlng1: LatLng):number[] {
  //   let d = this.latlngtoXY(latlng1)
  //   return d
  // }



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
