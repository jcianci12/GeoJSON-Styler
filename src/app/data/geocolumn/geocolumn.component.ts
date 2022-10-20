import { Component, OnInit,Input, Output, EventEmitter } from '@angular/core';
import { Select } from 'src/app/tableheaders.pipe';

@Component({
  selector: 'app-geocolumn',
  templateUrl: './geocolumn.component.html',
  styleUrls: ['./geocolumn.component.css']
})
export class GeocolumnComponent implements OnInit {
@Input()  tableheaders:Select[] = []
  _geocolumn: string ="";
@Input() set geocolumn(val:string){
this._geocolumn = val
this.geocolumnChange.emit(this._geocolumn)
}
get geocolumn(){
  return this._geocolumn
}
@Output() geocolumnChange = new EventEmitter<string>()
  constructor() { }

  ngOnInit(): void {

  }

}
