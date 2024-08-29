import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../../../../angular-material/material.module';
import { Patient } from '../../../interfaces/patient.interface';
import { PatientService } from '../patient.service';
import { AuthService } from '../../../../auth/auth.service';
import { User } from '../../../../auth/interfaces/login-response.interface';
import { Parameter } from '../../parameters/interfaces/parameter.interface';

@Component({
  selector: 'app-list-patients',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    RouterLink,
    MatMenuModule,
    MatIconModule,
  ],
  templateUrl: './listPatients.component.html',
  styleUrl: './listPatients.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListPatientsComponent {
  displayedColumns: string[] = [
    'name',
    'program',
    'phone',
    'admissionDate',
    'fonasa',
    'actions',
  ];
  dataSource = new MatTableDataSource<Patient>([]);

  public patients: Patient[];
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  public canCreateUser: boolean = false;
  public isAdmin: boolean = false;
  public user: User;
  public programsIds: string[];
  public programs: Parameter[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      // Convertir el filtro a minúsculas para una comparación sin distinción de mayúsculas y minúsculas
      const lowerCaseFilter = filter.trim().toLowerCase();

      // Comparar los campos relevantes, incluyendo el nombre del programa
      return (
        data.name.toLowerCase().includes(lowerCaseFilter) ||
        data.surname.toLowerCase().includes(lowerCaseFilter) ||
        data.secondSurname.toLowerCase().includes(lowerCaseFilter) ||
        data.program.name.toLowerCase().includes(lowerCaseFilter)
      );
    };

    this.canCreateUser = this.authService.canCreateUser();
    this.isAdmin = this.authService.isAdmin();
    this.user = this.authService.getUser();
    this.programsIds = this.user.programs.map((program) => program._id);

    this.patientService.getPatients(this.programsIds).subscribe((patients) => {
      this.patients = patients;

      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.data = this.patients;

      this.paginator.pageSize = 10; // Define el número de elementos por página
    });
  }

  filterByProgram(program: any) {
    this.dataSource.filter = program.trim().toLowerCase();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
