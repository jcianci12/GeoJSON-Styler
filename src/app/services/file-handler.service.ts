import { Injectable } from '@angular/core';
import { CSVtoJSONPipe } from '../csvtojsonpipe';
import { TableheadersPipe } from '../tableheaders.pipe';
import { Select } from '../tableheaders.pipe';
import { FeatureCollectionLayer } from '../featureCollection';

@Injectable({
  providedIn: 'root'
})
export class FileHandlerService {
  private csvToJson = new CSVtoJSONPipe();
  private tableHeaders = new TableheadersPipe();

  constructor() {}

  processCSVFile(file: File): Promise<{
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
            // Process headers using TableheadersPipe
            const headers = this.tableHeaders.transform([csvRows[0]]);
            
            resolve({
              headers,
              csvData,
              csvRows,
              rowCount: csvRows.length - 1
            });
          } else {
            reject(new Error('No data found in CSV file'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
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
} 