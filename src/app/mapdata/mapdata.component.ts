import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { LatLng, Layer } from 'leaflet';
import { point } from '../data/data.component';
import { MapStateService, LayerInfo, Point } from '../services/map-state.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-mapdata',
  templateUrl: './mapdata.component.html',
  styleUrls: ['./mapdata.component.css'],
})
export class MapdataComponent implements OnInit, OnChanges {
  @Input() map: L.Map | undefined;
  checked: boolean = true;
  points$: Observable<Point[]>;
  mapState: MapStateService;
  points: Point[] = [];

  constructor(mapState: MapStateService) {
    this.mapState = mapState;
    this.points$ = this.mapState.points$;
  }

  ngOnInit(): void {
    this.points$.subscribe((points: Point[]) => {
      this.points = points;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['map'] && this.map) {
      this.getxypoint(this.map);
    }
  }

  onLayerVisibilityChange(layerId: string) {
    this.mapState.toggleLayerVisibility(layerId);
  }

  getxypoint(map: L.Map | undefined) {
    if (!map) return;
    
    const points = this.mapState.points.map(p => ({
      ...p,
      x: 0,
      y: 0
    }));
    
    this.mapState.updatePoints(points);
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

  get minx(): number {
    return this.mapState.points.reduce((min: number, p: Point) => 
      Math.min(min, p.x), Infinity);
  }

  get maxx(): number {
    return this.mapState.points.reduce((max: number, p: Point) => 
      Math.max(max, p.x), -Infinity);
  }

  get miny(): number {
    return this.mapState.points.reduce((min: number, p: Point) => 
      Math.min(min, p.y), Infinity);
  }

  get maxy(): number {
    return this.mapState.points.reduce((max: number, p: Point) => 
      Math.max(max, p.y), -Infinity);
  }
}
