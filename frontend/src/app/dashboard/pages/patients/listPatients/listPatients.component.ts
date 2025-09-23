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
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DataExportComponent } from './components/data-export/data-export.component';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-list-patients',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterLink, MatMenuModule, MatIconModule],
  templateUrl: './listPatients.component.html',
  styleUrl: './listPatients.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListPatientsComponent {
  displayedColumns: string[] = ['codigoSistrat', 'name', 'program', 'phone', 'alertas', 'actions'];
  //displayedColumns: string[] = ['codigoSistrat', 'name', 'program', 'phone', 'admissionDate', 'fonasa', 'alertas', 'actions'];
  dataSource = new MatTableDataSource<Patient>([]);
  private patientService = inject(PatientService);
  public authService = inject(AuthService);
  public dialog = inject(MatDialog);
  public bottomSheet = inject(MatBottomSheet);



  public patients: Patient[];
  public canCreateUser: boolean = false;
  public isAdmin: boolean = false;
  public user: User;
  public programsIds: string[];
  public programs: Parameter[] = [];
  public selectedOptionToExport: string | null = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit(): void {    
    if(this.authService.isAdmin()){
      this.displayedColumns = ['codigoSistrat', 'name', 'program', 'phone', 'fonasa', 'alertas', 'actions'];
    }
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

exportData(): void {
  const ref = this.bottomSheet.open(DataExportComponent);
  ref.afterDismissed().subscribe((result) => {
    if (result) {
      Notiflix.Loading.circle('Generando Documentos PDFs');
      const { startDate, endDate } = result;

      this.patientService.getPdfByProgram(startDate, endDate).subscribe((blob) => {
        // Crear URL temporal para el ZIP
        const url = window.URL.createObjectURL(blob);

        // Crear enlace de descarga oculto
        const a = document.createElement('a');
        a.href = url;
        a.download = `historiales_${startDate}_${endDate}.zip`; // nombre sugerido
        document.body.appendChild(a);
        a.click();

        // Liberar recursos
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        Notiflix.Loading.remove();
      });
    }
  });
}


  
}