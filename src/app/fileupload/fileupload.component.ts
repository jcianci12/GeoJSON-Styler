import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-fileupload',
  templateUrl: './fileupload.component.html',
  styleUrls: ['./fileupload.component.css'],
})
export class FileuploadComponent implements OnInit {
  fileList: FileList | null;
  @Input() fileextension:string |null = null
    @Output() fileadded: EventEmitter<FileList> = new EventEmitter();

  constructor(private snack: MatSnackBar) {
    this.fileList = null;
  }

  ngOnInit(): void {}

  handleFileInput(event: Event) {
    const fileInput = event.target as HTMLInputElement;

    let file: File | null | undefined = (
      event.target as HTMLInputElement
    ).files?.item(0);

    let reader = new FileReader();

    this.fileList = (event.target as HTMLInputElement).files;
    if (this.fileList && this.getFileExtension(  this.fileList.item(0)?.name.toLowerCase()) == this.fileextension) {
      this.fileadded.emit(this.fileList);

      this.snack.open('Added');

      // Clear the input value to force change event on the same file
      fileInput.value = '';

      //this.fileadded.emit(this.fileList)
    } else {
      this.snack.open('There was an issue with the file. Not added.');
    }
  }
  getFileExtension(filename: any) {
    var ext = /^.+\.([^.]+)$/.exec(filename);
    return ext == null ? '' : ext[1];
  }
}
