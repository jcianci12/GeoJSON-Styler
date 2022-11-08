import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-jsonendpoint',
  templateUrl: './jsonendpoint.component.html',
  styleUrls: ['./jsonendpoint.component.css']
})
export class JsonendpointComponent implements OnInit {
@Input() endpointurl:string = ""
@Output() endpointurlChange = new EventEmitter<string>();
  constructor() { }

  ngOnInit(): void {
  }

}
