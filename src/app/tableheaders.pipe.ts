import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tableheaders',
})
export class TableheadersPipe implements PipeTransform {
  transform(value: string[][] | undefined | null): Select[] {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return [];
    }

    return value[0].map((m, index) => ({
      value: m,
      viewValue: `[${index}] ${m}`
    }));
  }
}

export interface Select {
  value: string;
  viewValue: string;
}
