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
      
      // Get headers from first line
      const headers = lines[0].split(',').map(header => header.trim());
      result.push(headers);

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) { // Skip empty lines
          const currentLine = lines[i].split(',').map(cell => cell.trim());
          result.push(currentLine);
        }
      }
    }

    return result;
  }
}
