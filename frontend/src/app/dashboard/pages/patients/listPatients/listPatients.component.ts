import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { FormCie10Component } from './components/formCie10/formCie10.component';

@Component({
  selector: 'app-list-patients',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterLink, MatMenuModule, MatIconModule],
  templateUrl: './listPatients.component.html',
  styleUrl: './listPatients.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListPatientsComponent {
  displayedColumns: string[] = ['codigoSistrat', 'name', 'program', 'phone',  'fonasa', 'alertas', 'actions'];
  //displayedColumns: string[] = ['codigoSistrat', 'name', 'program', 'phone', 'admissionDate', 'fonasa', 'alertas', 'actions'];
  dataSource = new MatTableDataSource<Patient>([]);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  public dialog = inject(MatDialog);


  public patients: Patient[];
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

    this.patientService.patients.subscribe((patients) => {
      this.patients = [];
      this.patients = patients;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.data = this.patients;
      //this.paginator.pageSize = 10; // Define el número de elementos por página
    });

    this.patientService.updatePatients(this.programsIds);
  }

  filterByProgram(program: any) {
    this.dataSource.filter = program.trim().toLowerCase();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onUpdateAlerts(patientId: string) {
    this.patientService.updateAlertSistrat(patientId).subscribe((response) => {
      this.patientService.updatePatients(this.programsIds);
    });
  }

  onDialogAlertCie10(patientId: string){
    console.log('onDialogAlertCie10');
    
    const dialogRef = this.dialog.open(FormCie10Component, {
      width: '95%',
      height: '40%',
      data: { patientId },
    });

  }
}
