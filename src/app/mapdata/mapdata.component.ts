import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { LatLng, Layer } from 'leaflet';
import { point } from '../data/data.component';
import { MapStateService } from '../services/map-state.service';

@Component({
  selector: 'app-mapdata',
  templateUrl: './mapdata.component.html',
  styleUrls: ['./mapdata.component.css'],
})
export class MapdataComponent implements OnInit, OnChanges {
  @Input() map: L.Map | undefined;
  checked: boolean = true;
  points$ = this.mapState.points$;

  constructor(public mapState: MapStateService) {}

  ngOnInit() {
    // Subscribe to points changes
    this.mapState.points$.subscribe(points => {
      points.forEach((p, i) => {
        p.id = p.id || 'Point ' + (i + 1);
      });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['map'] && this.map) {
      this.mapState.setMap(this.map);
    }
  }

  geoDistance(point1: point, point2: point): number {
    return point1.getLatLng().distanceTo(point2.getLatLng());
  }

  xyDistance(point1: point, point2: point): number {
    if (!point1.x || !point1.y || !point2.x || !point2.y) {
      return 0;
    }
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // latlngtoXY(latlng1: LatLng):number[] {
  //   let d = this.latlngtoXY(latlng1)
  //   return d
  // }

  get maxx() {
    return this.mapState.points.reduce((max: number, p: point) => {
      return p.x && p.x > max ? p.x : max;
    }, Number.NEGATIVE_INFINITY);
  }

  get minx() {
    return this.mapState.points.reduce((min: number, p: point) => {
      return p.x && p.x < min ? p.x : min;
    }, Number.POSITIVE_INFINITY);
  }

  get maxy() {
    return this.mapState.points.reduce((max: number, p: point) => {
      return p.y && p.y > max ? p.y : max;
    }, Number.NEGATIVE_INFINITY);
  }

  get miny() {
    return this.mapState.points.reduce((min: number, p: point) => {
      return p.y && p.y < min ? p.y : min;
    }, Number.POSITIVE_INFINITY);
  }
}
