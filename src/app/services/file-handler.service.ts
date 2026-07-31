import { Injectable } from '@angular/core';
import { CSVtoJSONPipe } from '../csvtojsonpipe';
import { TableheadersPipe } from '../tableheaders.pipe';
import { Select } from '../tableheaders.pipe';
import { FeatureCollectionLayer } from '../featureCollection';
import { xlsxFileToCsvString } from './xlsx-to-csv';

@Injectable({
  providedIn: 'root'
})
export class FileHandlerService {
  private csvToJson = new CSVtoJSONPipe();
  private tableHeaders = new TableheadersPipe();

  constructor() {}

  /**
   * Process a CSV or XLSX file. Returns parsed headers, data, and rows.
   */
  processFile(file: File): Promise<{
    headers: Select[];
    csvData: string;
    csvRows: string[][];
    rowCount: number;
  }> {
    const ext = this.getFileExtension(file.name);
    if (ext === 'xlsx' || ext === 'xls') {
      return this.processXLSX(file);
    }
    return this.processCSV(file);
  }

  /** @deprecated Use processFile() instead */
  processCSVFile(file: File): Promise<{
    headers: Select[];
    csvData: string;
    csvRows: string[][];
    rowCount: number;
  }> {
    return this.processFile(file);
  }

  private processCSV(file: File): Promise<{
    headers: Select[];
    csvData: string;
    csvRows: string[][];
    rowCount: number;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvData = e.target?.result as string;
          const csvRows = this.csvToJson.csvJSON(csvData);
          
          if (csvRows && csvRows.length > 0) {
            const headers = this.tableHeaders.transform([csvRows[0]]);
            resolve({ headers, csvData, csvRows, rowCount: csvRows.length - 1 });
          } else {
            reject(new Error('No data found in file'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  private processXLSX(file: File): Promise<{
    headers: Select[];
    csvData: string;
    csvRows: string[][];
    rowCount: number;
  }> {
    return xlsxFileToCsvString(file).then(csvData => {
      const csvRows = this.csvToJson.csvJSON(csvData);
      if (csvRows && csvRows.length > 0) {
        const headers = this.tableHeaders.transform([csvRows[0]]);
        return { headers, csvData, csvRows, rowCount: csvRows.length - 1 };
      }
      throw new Error('No data found in XLSX file');
    });
  }

  updateFeatureCollectionLayer(
    featureCollectionLayers: FeatureCollectionLayer[],
    layerIndex: number,
    csvRows: string[][]
  ): FeatureCollectionLayer[] {
    const updatedLayers = [...featureCollectionLayers];
    updatedLayers[layerIndex].styledata = csvRows;
    return updatedLayers;
  }

  private getFileExtension(filename: string): string {
    const match = /^.+\.([^.]+)$/.exec(filename.toLowerCase());
    return match ? match[1] : '';
  }
}
