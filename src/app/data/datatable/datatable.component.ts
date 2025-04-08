import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.css']
})
export class DatatableComponent {
  @Input() d: any = '';
  
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
}
