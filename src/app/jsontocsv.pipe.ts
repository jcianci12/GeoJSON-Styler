import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jsontocsv'
})
export class JsontocsvPipe implements PipeTransform {

  transform(jsonData: any[]): string {
    const csvString = this.convertJsonToCsv(jsonData);
    return csvString;
  }
  convertJsonToCsv(jsonData: any[]): string {
    const keys = Object.keys(jsonData[0]); // get the property names as CSV headers
    const csvHeaders = keys.join(',') + '\n'; // create CSV header row

    const csvRows = jsonData.map((row) => {
      return keys.map((key) => {
        return row[key]; // get the property value for each key
      }).join(',');
    }).join('\n'); // create CSV row for each object in the array

    return csvHeaders + csvRows; // combine headers and rows to create CSV string
  }

}


