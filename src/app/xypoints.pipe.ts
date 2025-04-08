import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'xypoints'
})
export class XypointsPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '';
    
    // If value is an object with x and y properties
    if (typeof value === 'object' && value.x !== undefined && value.y !== undefined) {
      return `${value.x}, ${value.y}`;
    }
    
    // If value is an array with x and y coordinates
    if (Array.isArray(value) && value.length === 2) {
      return `${value[0]}, ${value[1]}`;
    }
    
    // If value is already a string, return it as is
    if (typeof value === 'string') {
      return value;
    }
    
    // Default case
    return '';
  }
}
