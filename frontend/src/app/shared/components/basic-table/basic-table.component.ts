import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../angular-material/material.module';

@Component({
    selector: 'basic-table',
    standalone: true,
    imports: [
        CommonModule, MaterialModule
    ],
    templateUrl: './basic-table.component.html',
    styleUrl: './basic-table.component.css',
})
export class BasicTableComponent {

    @Input() data: any[] = [];
    @Input() columns: string[] = [];
  
    dataSource: MatTableDataSource<any> | null = null;
    displayedColumns: string[] = [];
  
    ngOnChanges(changes: SimpleChanges): void {
      if (changes['data'] || changes['columns']) {
        this.dataSource = new MatTableDataSource(this.data);
        this.displayedColumns = this.columns;
      }
    }
 }
