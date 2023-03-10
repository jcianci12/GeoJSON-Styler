import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { config, of } from 'rxjs';
import { FeatureCollectionLayer } from 'src/app/featureCollection';
import { FeaturecollectionService } from 'src/app/featurecollection.service';
import { terms } from 'src/app/suburbfilter/suburbfilter.component';

@Component({
  selector: 'app-loadsavebutton',
  templateUrl: './loadsavebutton.component.html',
  styleUrls: ['./loadsavebutton.component.css'],
})
export class LoadsavebuttonComponent {
  @Input() featureCollection: FeatureCollectionLayer[] = [];
  @Output() featureCollectionChange = new EventEmitter<FeatureCollectionLayer[]>();
  constructor(private matsnack: MatSnackBar, private fcs: FeaturecollectionService) {}
  private setting = {
    element: {
      dynamicDownload: null as unknown as HTMLElement,
    },
  };
  fakeValidateUserData() {
    return of(this.featureCollection);
  }
  dynamicDownloadJson() {
    this.matsnack.open('Downloading map and style state', 'Okay', { duration: 2000 });
    this.fakeValidateUserData().subscribe((res: any) => {
      this.dyanmicDownloadByHtmlTag({
        fileName: 'mapstate.json',
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
        //console.log(jsonData);
        //this.fcs.FeatureCollectionLayerObservable.next(jsonData);
        this.fcs.FeatureCollectionLayerObservable.next([new FeatureCollectionLayer([],new terms(),[],{GEOColumn:"",GEOJSON:""})]);
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
}
