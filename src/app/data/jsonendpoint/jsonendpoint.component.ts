import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GeoDataEndpointClient } from 'src/api/api';

@Component({
  selector: 'app-jsonendpoint',
  templateUrl: './jsonendpoint.component.html',
  styleUrls: ['./jsonendpoint.component.css'],
})
export class JsonendpointComponent implements OnInit {
  private _endpointurl: string = '';
  @Input() set endpointurl(val: string) {
    this._endpointurl = val;
  }
  get endpointurl() {
    return this._endpointurl;
  }

  @Output() dataChange = new EventEmitter<string>();
  constructor(private api: GeoDataEndpointClient, private http: HttpClient) {}

  ngOnInit(): void {}

  ConvertToCSV(objArray:Object[], headerList:string[]) {
    let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = 'S.No,';
    for (let index in headerList) {
     row += headerList[index] + ',';
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    for (let i = 0; i < array.length; i++) {
     let line = (i+1)+'';
     for (let index in headerList) {
      let head = headerList[index];
      line += ',' + array[i][head];
     }
     str += line + '\r\n';
    }
    return str;
   }
}
