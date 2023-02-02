import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { config, of } from 'rxjs';
import { FeatureCollectionLayer } from 'src/app/featureCollection';

@Component({
  selector: 'app-loadsavebutton',
  templateUrl: './loadsavebutton.component.html',
  styleUrls: ['./loadsavebutton.component.css']
})
export class LoadsavebuttonComponent {
@Input() featureCollection:FeatureCollectionLayer[] = []
  constructor(private matsnack:MatSnackBar) { }
  private setting = {
    element: {
      dynamicDownload: null as unknown as HTMLElement
    }
  }
  fakeValidateUserData() {
    return of(this.featureCollection);
  }
  dynamicDownloadJson() {
    this.matsnack.open("Downloading map and style state","Okay", {duration:2000})
    this.fakeValidateUserData().subscribe((res: any) => {
      this.dyanmicDownloadByHtmlTag({
        fileName: 'My Report.json',
        text: JSON.stringify(res)
      });
    });
  }

  private dyanmicDownloadByHtmlTag(arg: {
    fileName: string,
    text: string
  }) {
    if (!this.setting.element.dynamicDownload) {
      this.setting.element.dynamicDownload = document.createElement('a');
    }
    const element = this.setting.element.dynamicDownload;
    const fileType = arg.fileName.indexOf('.json') > -1 ? 'text/json' : 'text/plain';
    element.setAttribute('href', `data:${fileType};charset=utf-8,${encodeURIComponent(arg.text)}`);
    element.setAttribute('download', arg.fileName);

    var event = new MouseEvent("click");
    element.dispatchEvent(event);
  }
}
