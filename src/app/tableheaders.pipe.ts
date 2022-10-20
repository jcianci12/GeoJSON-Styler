import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tableheaders',
})
export class TableheadersPipe implements PipeTransform {
  transform(value: string[][]): Select[] {
    let r:Select[] = []
    if (value[0]) {
     let r = value[0].map(m=>{return <Select> {value:m,viewValue:m}});
     return r
    }

    return r;
  }
}
export interface Select {
  value: string;
  viewValue: string;
}
