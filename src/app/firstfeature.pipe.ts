import { Pipe, PipeTransform } from '@angular/core';
import { Feature, FeatureCollection } from 'geojson';

@Pipe({
  name: 'firstfeature'
})
export class FirstfeaturePipe implements PipeTransform {

  transform(value: FeatureCollection): Feature|null {
    if(value?.features){
    return value.features[0];
    }
    else{
      return null
    }
  }

}
