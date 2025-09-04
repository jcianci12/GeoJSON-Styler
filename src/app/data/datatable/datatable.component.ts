import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.css']
})
export class DatatableComponent {
  @Input() d: any = '';
  @Output() dataChange = new EventEmitter<string>();

  editMode = false;
  editableData: string[][] = [];

  get dataLength(): number {
    if (!this.d) return 0;

    if (typeof this.d === 'string') {
      return this.d.split('\n').length - 1;
    }

    if (Array.isArray(this.d)) {
      return this.d.length;
    }

    return 0;
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.prepareEditableData();
    }
  }

  prepareEditableData() {
    if (typeof this.d === 'string') {
      this.editableData = this.csvToArray(this.d);
    }
  }

  csvToArray(csv: string): string[][] {
    if (!csv || typeof csv !== 'string') {
      return [];
    }

    const result = [];
    const lines = csv.split(/[\r\n]+/).filter(line => line.trim().length > 0);

    if (lines.length === 0) {
      return [];
    }

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i].split(',').map(cell => cell.trim());
      result.push(currentLine);
    }

    return result;
  }

  arrayToCsv(data: string[][]): string {
    return data.map(row => row.join(',')).join('\r\n');
  }

  saveChanges() {
    const csvString = this.arrayToCsv(this.editableData);
    this.d = csvString;
    this.dataChange.emit(csvString);
    this.editMode = false;
  }

  cancelEdit() {
    this.editMode = false;
    this.editableData = [];
  }

  addRow() {
    if (this.editableData.length > 0) {
      const newRow = new Array(this.editableData[0].length).fill('');
      this.editableData.push(newRow);
    }
  }

  removeRow(index: number) {
    if (index > 0) { // Don't allow removing header row
      this.editableData.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
