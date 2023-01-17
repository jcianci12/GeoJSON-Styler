import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ruletype, stylerule, text } from '../../data.component';

@Component({
  selector: 'app-styleproperties',
  templateUrl: './styleproperties.component.html',
  styleUrls: ['./styleproperties.component.css'],
})
export class StylepropertiesComponent implements OnInit {
  _ruletype!: ruletype;
  @Input() set ruletype(val: ruletype) {
    this._ruletype = val;
  }
  get ruletype() {
    return this._ruletype;
  }

  @Output() ruletypeChange: EventEmitter<ruletype> =
    new EventEmitter<ruletype>();

  constructor() {}

  ngOnInit(): void {}

  //we need a way to assign a variable to a dynamic type
  setProperty(event: any, property: string) {
    //does the prop exist on the object?
    if (this.ruletype.hasOwnProperty(property)) {
      //check if its a number and handle accordingly
      if (typeof event.target.value =='string') {
        (this.ruletype as any)[property] = event.target.value;
      }
      else{
        (this.ruletype as any)[property] = parseFloat(event.target.value);

      }

      console.log(this.ruletype);
      this.ruletypeChange.emit(this.ruletype);
    }
  }
  getProperty(property: string): string {
    // return new Observable((s)=>{
    if (this.ruletype.hasOwnProperty(property)) {
      return (this.ruletype as any)[property];
    } else {
      return '';
    }
    // })
  }
  gettype(property: string) {
    if (this.ruletype.hasOwnProperty(property)) {
      return typeof (this.ruletype as any)[property];
    } else {
      return '';
    }
  }
  get propertylist(): string[] {
    //only show the props that are static
    return Object.keys(this.ruletype);
    // .filter(
    //   (i) => i == 'latoffset' || i == 'lngoffset'
    // );
  }
}
