import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import { MaterialModule } from '../../../../angular-material/material.module';
import { RouterModule } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MedicalRecordService } from '../medicalRecord.service';
import { MatTableDataSource } from '@angular/material/table';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { DateFormatPipe } from '../../../dashboard/pipes/DateFormat.pipe';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule, DateFormatPipe],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListComponent {
  displayedColumns: string[] = [
    'center',
    'date',
    'entryType',
    'group',
    'intervention',
    'patient',
    'program',
    'sigla',
    'time',
    'actions',
  ];
  dataSource = new MatTableDataSource<MedicalRecord>([]);

  public medicalRecords: MedicalRecord[];

  private medicalRecordService = inject(MedicalRecordService);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit(): void {
    this.medicalRecordService.getMedialRecords().subscribe((medicalRecords) => {
      this.medicalRecords = medicalRecords;

      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.data = this.medicalRecords;

      this.paginator.pageSize = 10; // Define el número de elementos por página
      console.log(this.medicalRecords);
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
