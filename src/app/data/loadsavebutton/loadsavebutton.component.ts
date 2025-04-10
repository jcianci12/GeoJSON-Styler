import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { config, distinctUntilChanged, of } from 'rxjs';
import { FeatureCollectionLayer } from 'src/app/featureCollection';
import { FeaturecollectionService } from 'src/app/featurecollection.service';
import { JsontocsvPipe } from 'src/app/jsontocsv.pipe';
import { terms } from '../../featurefilter/featurefilter.component';
import { openDB } from 'idb';

@Component({
  selector: 'app-loadsavebutton',
  templateUrl: './loadsavebutton.component.html',
  styleUrls: ['./loadsavebutton.component.css'],
  providers: [HttpClient]

})
export class LoadsavebuttonComponent implements OnInit {

  selectedFile: any = null;



  @Input() featureCollection: FeatureCollectionLayer[] = [];
  @Output() featureCollectionChange = new EventEmitter<FeatureCollectionLayer[]>();
  constructor(private http: HttpClient, private matsnack: MatSnackBar, private fcs: FeaturecollectionService) { }
  private setting = {
    element: {
      dynamicDownload: null as unknown as HTMLElement,
    },
  };

  ngOnInit() {
    this.fcs.FeatureCollectionLayerObservable.pipe().subscribe(i => {
      this.featureCollection = i
      this.saveCookieState()
    }
    )
    this.loadCookieState()

  }
  fakeValidateUserData() {
    return of(this.featureCollection);
  }
  dynamicDownloadJson() {
    this.matsnack.open('Downloading map and style state', 'Okay', { duration: 2000 });
    this.fakeValidateUserData().subscribe((res: FeatureCollectionLayer[]) => {
      // res.forEach(l=>{
      //   l.styledata = new JsontocsvPipe().convertJsonToCsv(l.styledata)as unknown  as string [][]
      // })
      this.dyanmicDownloadByHtmlTag({
        fileName: 'mapstate ' + new Date().toString() + '.json',
        text: JSON.stringify(res),
      });
    });
  }

  private dyanmicDownloadByHtmlTag(arg: { fileName: string; text: string }) {
    if (!this.setting.element.dynamicDownload) {
      this.setting.element.dynamicDownload = document.createElement('a');
    }
    const element = this.setting.element.dynamicDownload;
    const fileType = arg.fileName.indexOf('.json') > -1 ? 'text/json' : 'text/plain';
    element.setAttribute('href', `data:${fileType};charset=utf-8,${encodeURIComponent(arg.text)}`);
    element.setAttribute('download', arg.fileName);

    var event = new MouseEvent('click');
    element.dispatchEvent(event);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        const jsonData = JSON.parse(fileReader.result as string);
        this.fcs.FeatureCollectionLayerObservable.next(jsonData);

        this.matsnack.open('Successfully loaded map state', 'Okay', { duration: 2000 });

        // do something with the parsed JSON data
      } catch (e) {
        console.error('Error parsing JSON:', e);
        this.matsnack.open('File doesnt appear to be valid JSON', 'Okay', { duration: 2000 });

        // handle the error, e.g. show an error message to the user
      }
    };
    fileReader.readAsText(file, 'UTF-8');
  }
  async saveCookieState() {
    if (this.featureCollection[0]?.features.length) {
      let data = JSON.stringify(this.featureCollection);
      // Open an IndexedDB database
      let db = await openDB('myDatabase', 1, {
        upgrade(db) {
          // Create an object store to store the data
          db.createObjectStore('myData');
        }
      });
      // Save the data in the IndexedDB database
      await db.put('myData', data, 'key');
    }
  }


  async loadCookieState() {
    // Open an IndexedDB database
    let db = await openDB('myDatabase', 1, {
      upgrade(db) {
        // Create an object store to store the data
        db.createObjectStore('myData');
      }
    });
    // Get the data from the IndexedDB database
    let data = await db.get('myData', 'key');
    if (data) {
      this.fcs.FeatureCollectionLayerObservable.next(JSON.parse(data));
    } else {
      this.http.get('assets/demomapstate.json').subscribe(data => {
        this.fcs.FeatureCollectionLayerObservable.next(data as FeatureCollectionLayer[]);
      });
    }
  }

}
