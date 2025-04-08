import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'csvtojson',
})
export class CSVtoJSONPipe implements PipeTransform {
  transform(value: string | undefined | null): string[][] {
    if (!value) {
      return [];
    }
    return this.csvJSON(value);
  }

  public csvJSON(csv: string): string[][] {
    if (!csv || typeof csv !== 'string') {
      return [];
    }

    const result = [];
    const lines = csv.split(/[\r\n]+/).filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      return [];
    }

    // Get headers from first line
    const headers = lines[0].split(',').map(header => header.trim());
    result.push(headers);

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',').map(cell => cell.trim());
      result.push(currentLine);
    }

    return result;
  }
}
