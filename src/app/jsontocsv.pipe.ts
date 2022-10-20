import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jsontocsv',
})
export class JsontocsvPipe implements PipeTransform {
  transform(value: string, ...args: unknown[]):string[][] {
    return this.csvJSON(value);
  }
  public csvJSON(csv: string) {
    var result = [];

    if (csv) {
      var lines = csv.split('\r\n');

      // NOTE: If your columns contain commas in their values, you'll need
      // to deal with those before doing the next step
      // (you might convert them to &&& or something, then covert them back later)
      // jsfiddle showing the issue https://jsfiddle.net/

      //var headers = lines[0].split(',');

      for (var i = 0; i < lines.length; i++) {
        //var obj: any = {};
        console.log(i);
        var currentline = lines[i].split(',');
        result.push(currentline);
        // for (var j = 0; j < headers.length; j++) {
        //   //obj[headers[j]] = currentline[j];
        // }

        //result.push(obj);
      }
    }

    //return result; //JavaScript object
    return result; //JSON
  }
}
