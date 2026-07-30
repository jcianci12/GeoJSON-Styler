import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { config, distinctUntilChanged, of } from 'rxjs';
import { FeatureCollectionLayer } from 'src/app/featureCollection';
import { FeaturecollectionService } from 'src/app/featurecollection.service';
import { JsontocsvPipe } from 'src/app/jsontocsv.pipe';
import { terms } from '../../featurefilter/featurefilter.component';
import { openDB } from 'idb';
import { parseJSONInWorker } from 'src/app/services/json-parse-worker';

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
    console.log('[INIT] loadsavebutton ngOnInit START', performance.now().toFixed(1), 'ms');
    this.fcs.FeatureCollectionLayerObservable.pipe().subscribe(i => {
      this.featureCollection = i;
      this.saveCookieState();
    });
    // Defer loadCookieState to avoid blocking app boot with 38MB demo data
    // Called via loadSavedState() when user opens the menu
    console.log('[INIT] loadsavebutton ngOnInit DONE (loadCookieState deferred)', performance.now().toFixed(1), 'ms');
  }

  loadSavedState() {
    console.log('[INIT] loadsavebutton loadSavedState (user triggered)', performance.now().toFixed(1), 'ms');
    this.loadCookieState();
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
    if (!file) return;

    this.matsnack.open('Loading map state...', 'Okay', { duration: 1000 });

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      try {
        const jsonData = await parseJSONInWorker(fileReader.result as string);
        this.fcs.FeatureCollectionLayerObservable.next(jsonData);
        this.matsnack.open('Successfully loaded map state', 'Okay', { duration: 2000 });
        event.target.value = '';
      } catch (e) {
        console.error('Error parsing JSON:', e);
        this.matsnack.open('File doesnt appear to be valid JSON', 'Okay', { duration: 2000 });
        event.target.value = '';
      }
    };
    fileReader.onerror = () => {
      this.matsnack.open('Error reading file', 'Okay', { duration: 2000 });
    };
    fileReader.readAsText(file, 'UTF-8');
  }
  async saveCookieState() {
    if (this.featureCollection[0]?.features.length) {
      console.log('[INIT] loadsavebutton saveCookieState START - features:', this.featureCollection[0].features.length, performance.now().toFixed(1), 'ms');
      let data = JSON.stringify(this.featureCollection);
      console.log('[INIT] loadsavebutton JSON.stringify done, size:', data.length, performance.now().toFixed(1), 'ms');
      // Open an IndexedDB database
      let db = await openDB('myDatabase', 1, {
        upgrade(db) {
          // Create an object store to store the data
          db.createObjectStore('myData');
        }
      });
      console.log('[INIT] loadsavebutton IndexedDB opened', performance.now().toFixed(1), 'ms');
      // Save the data in the IndexedDB database
      await db.put('myData', data, 'key');
      console.log('[INIT] loadsavebutton IndexedDB saved', performance.now().toFixed(1), 'ms');
    }
  }


  async loadCookieState() {
    console.log('[INIT] loadsavebutton loadCookieState START', performance.now().toFixed(1), 'ms');
    this.matsnack.open('Loading saved state...', '', { duration: 3000 });
    // Open an IndexedDB database
    let db = await openDB('myDatabase', 1, {
      upgrade(db) {
        // Create an object store to store the data
        db.createObjectStore('myData');
      }
    });
    console.log('[INIT] loadsavebutton loadCookieState - IndexedDB opened', performance.now().toFixed(1), 'ms');
    // Get the data from the IndexedDB database
    let data = await db.get('myData', 'key');
    if (data) {
      console.log('[INIT] loadsavebutton loadCookieState - found IndexedDB data, size:', data.length, performance.now().toFixed(1), 'ms');
      console.log('[INIT] loadsavebutton loadCookieState - parsing JSON in worker...');
      try {
        const parsed = await parseJSONInWorker(data);
        console.log('[INIT] loadsavebutton loadCookieState - worker parsed, size:', data.length, performance.now().toFixed(1), 'ms');
        this.fcs.FeatureCollectionLayerObservable.next(parsed);
        console.log('[INIT] loadsavebutton loadCookieState - emitted', performance.now().toFixed(1), 'ms');
        this.matsnack.open('Map state loaded', 'Okay', { duration: 2000 });
      } catch (e) {
        console.error('[INIT] loadsavebutton loadCookieState - parse error:', e);
        this.matsnack.open('Failed to load saved state', 'Okay', { duration: 2000 });
      }
    } else {
      console.log('[INIT] loadsavebutton loadCookieState - no IndexedDB data, fetching demomapstate.json', performance.now().toFixed(1), 'ms');
      this.http.get('assets/demomapstate.json').subscribe(data => {
        console.log('[INIT] loadsavebutton HTTP demomapstate.json loaded, size:', JSON.stringify(data).length, performance.now().toFixed(1), 'ms');
        this.fcs.FeatureCollectionLayerObservable.next(data as FeatureCollectionLayer[]);
        console.log('[INIT] loadsavebutton HTTP demomapstate.json emitted to observable', performance.now().toFixed(1), 'ms');
      });
    }
    console.log('[INIT] loadsavebutton loadCookieState DONE', performance.now().toFixed(1), 'ms');
  }

}
