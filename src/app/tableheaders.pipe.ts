import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tableheaders',
})
export class TableheadersPipe implements PipeTransform {
  transform(value: string[][]): Select[] {
    let r:Select[] = []
    if (value[0]) {
     let r = value[0].map((m, index) => {return <Select> {value:m, viewValue:`[${index}] ${m}`}});
     return r
    }

    return r;
  }
}
export interface Select {
  value: string;
  viewValue: string;
}
