import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'csvtojson',
})
export class CSVtoJSONPipe implements PipeTransform {
  transform(value: string): string[][] {
    // convert the CSV string to a JSON object array
    return this.csvJSON(value);
  }

  public csvJSON(csv: string): string[][] {
    const result = [];

    if (csv.length) {
      const lines = csv.split('\r\n');

      // loop through each line of the CSV string
      for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i].split(',');
        result.push(currentLine);
      }
    }

    return result; // return the JSON object array
  }
}
