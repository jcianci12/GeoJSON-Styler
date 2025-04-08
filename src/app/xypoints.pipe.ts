import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'xypoints'
})
export class XypointsPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
