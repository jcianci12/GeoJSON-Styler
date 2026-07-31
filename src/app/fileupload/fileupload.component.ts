import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-fileupload',
  templateUrl: './fileupload.component.html',
  styleUrls: ['./fileupload.component.css'],
})
export class FileuploadComponent implements OnInit {
  fileList: FileList | null;
  @Input() fileextension: string | null = null; // comma-separated: "csv,xlsx"
  @Output() fileadded: EventEmitter<FileList> = new EventEmitter();

  constructor(private snack: MatSnackBar) {
    this.fileList = null;
  }

  get acceptStr(): string {
    if (!this.fileextension) return '';
    return this.fileextension.split(',').map(ext => '.' + ext.trim()).join(',');
  }

  ngOnInit(): void {}

  handleFileInput(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    this.fileList = (event.target as HTMLInputElement).files;

    const fileName = this.fileList?.item(0)?.name?.toLowerCase() || '';
    const ext = this.getFileExtension(fileName);
    const allowed = this.fileextension?.split(',').map(e => e.trim()) || [];

    if (this.fileList && allowed.includes(ext)) {
      this.fileadded.emit(this.fileList);
      this.snack.open('Added');
      fileInput.value = '';
    } else {
      this.snack.open('There was an issue with the file. Not added.');
    }
  }

  getFileExtension(filename: string): string {
    var ext = /^.+\.([^.]+)$/.exec(filename);
    return ext == null ? '' : ext[1];
  }
}
