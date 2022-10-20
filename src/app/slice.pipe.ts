import { Pipe, PipeTransform } from '@angular/core';
import { Feature } from 'geojson';

@Pipe({
  name: 'slice'
})
export class SlicePipe implements PipeTransform {

  transform(value: Feature[],skip:number,take:number): Feature[] {

    return value.slice(skip,take);
  }

}
