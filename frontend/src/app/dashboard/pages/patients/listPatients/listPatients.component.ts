import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../../../../angular-material/material.module';
import { Patient } from '../../../interfaces/patient.interface';
import { Profile, User } from '../../../interfaces/user.interface';
import { UserService } from '../../users/user.service';
import { PatientService } from '../patient.service';

@Component({
  selector: 'app-list-patients',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterLink],
  templateUrl: './listPatients.component.html',
  styleUrl: './listPatients.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListPatientsComponent {
  displayedColumns: string[] = ['name','program','phone','admissionDate',  'actions'];
  dataSource = new MatTableDataSource<Patient>([]);

  public patients: Patient[];
  private patientService = inject(PatientService);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit(): void {
    this.patientService.getPatients().subscribe((patients) => {
      this.patients = patients;

      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.data = this.patients;

      this.paginator.pageSize = 10; // Define el número de elementos por página
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
