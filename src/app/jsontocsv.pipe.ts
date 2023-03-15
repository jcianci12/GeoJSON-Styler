import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jsontocsv',
})
export class JsontocsvPipe implements PipeTransform {
  transform(jsonData: any[]): string {
    const csvString = this.convertJsonToCsv(jsonData);
    return csvString;
  }

  convertJsonToCsv(data: any[]): string {
    if(data.length){
      const keys = Object.keys(data[0]);
    const header = data[0].join(',') + '\r\n';
    const rows = data
      .map((row, index) => {
        if (index === 0) {
          return '';
        } else {
          return keys
            .map((key) => {
              return row[key];
            })
            .join(',');
        }
      })
      .join('\r\n');
    return header + rows;
    }
    return ''
  }
}

// convertJsonToCsv(jsonData: any[]): string {
//   if (jsonData.length) {
//     const keys = jsonData[0]; // get the property names as CSV headers
//     const csvHeaders = keys.join(',') + '\r\n'; // create CSV header row

//     const csvRows = jsonData
//       .map((row) => {
//         return keys
//           .map((key) => {
//             let cell = row[key] === null || row[key] === undefined ? '' : row[key];
//             cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
//             cell = cell.replace(/"/g, '""'); // escape double quotes
//             return '"' + cell + '"';
//           })
//           .join(',') + '\r\n'; // add newline character after each row
//       })
//       .join('');

//     return csvHeaders + csvRows; // combine headers and rows to create CSV string
//   } else {
//     return '';
//   }
// }
