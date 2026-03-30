import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
export default class ListPatientsComponent implements OnInit {
  displayedColumns: string[] = ['codigoSistrat', 'name', 'program', 'phone', 'alertas', 'actions'];
  //displayedColumns: string[] = ['codigoSistrat', 'name', 'program', 'phone', 'admissionDate', 'fonasa', 'alertas', 'actions'];
  dataSource = new MatTableDataSource<Patient>([]);
  private patientService = inject(PatientService);
  public authService = inject(AuthService);
  public dialog = inject(MatDialog);
  public bottomSheet = inject(MatBottomSheet);
  private cdr = inject(ChangeDetectorRef);



  public patients: Patient[];
  public canCreateUser: boolean = false;
  public isAdmin: boolean = false;
  public user: User;
  public programsIds: string[];
  public programs: Parameter[] = [];
  public selectedOptionToExport: string | null = null;
  public togglingActive: Record<string, boolean> = {};
  public fetchingCodigo: Record<string, boolean> = {};
  public isUpdatingAlerts: boolean = false;

  public filters = {
    program: '',
    search: '',
    alerts: false
  };

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.displayedColumns = ['active', 'codigoSistrat', 'name', 'program', 'phone', 'fonasa', 'alertas', 'actions'];
    }
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      let searchTerms: any;
      try {
        searchTerms = JSON.parse(filter);
      } catch (e) {
        searchTerms = { search: filter, program: '', alerts: false };
      }

      const lowerCaseSearch = (searchTerms.search || '').trim().toLowerCase();
      
      const fullName = `${data.name || ''} ${data.surname || ''} ${data.secondSurname || ''}`.toLowerCase().replace(/\s+/g, ' ');
      
      const matchSearch = lowerCaseSearch ? (
        fullName.includes(lowerCaseSearch) ||
        (data.codigoSistrat || '').toLowerCase().includes(lowerCaseSearch) ||
        (data.program?.name || '').toLowerCase().includes(lowerCaseSearch)
      ) : true;

      const programSearch = searchTerms.program;
      const matchProgram = programSearch ? (data.program?.name || '').toLowerCase().includes(programSearch) : true;

      const matchAlerts = searchTerms.alerts ? !!(data.alertCie10 || data.alertConsentimiento || data.alertIntegracionSocial || data.alertEvaluacion || data.alertEgreso || data.alertDiagnosticoSocial) : true;

      return matchSearch && matchProgram && matchAlerts;
    };

    this.dataSource.filter = JSON.stringify(this.filters);

    this.canCreateUser = this.authService.canCreateUser();
    this.isAdmin = this.authService.isAdmin();
    this.user = this.authService.getUser();
    this.programsIds = this.user.programs.map((program) => program._id);

    this.patientService.patients.subscribe((patients) => {
      this.patients = this.sortPatients(patients ?? []);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.data = this.patients;
      //this.paginator.pageSize = 10; // Define el número de elementos por página
    });

    this.patientService.updatePatients(this.programsIds);
  }

  filterByProgram(program: any) {
    this.filters.program = program.trim().toLowerCase();
    this.applyCombinedFilters();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filters.search = filterValue.trim().toLowerCase();
    this.applyCombinedFilters();
  }

  toggleAlertsFilter(event: any) {
    this.filters.alerts = event.checked;
    this.applyCombinedFilters();
  }

  applyCombinedFilters() {
    this.dataSource.filter = JSON.stringify(this.filters);
  }

  onUpdateAlerts(patientId: string) {
    Notiflix.Loading.circle('Actualizando...');
    this.patientService.updateAlertSistrat(patientId).subscribe({
      next: () => {
        Notiflix.Loading.remove();
        this.patientService.updatePatients(this.programsIds);
      },
      error: () => {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure('Error actualizando alerta');
      }
    });
  }

  onClickAlert(patientId: string, alertType: string) {
    Notiflix.Notify.info('Abriendo SISTRAT...');
    this.patientService.resolveAlertSistrat(patientId, alertType).subscribe({
      next: () => {
        Notiflix.Loading.remove();
        Notiflix.Notify.success('Alerta abierta en SISTRAT');
      },
      error: (error) => {
        Notiflix.Loading.remove();
        console.error(error);
        Notiflix.Notify.failure('Error abriendo SISTRAT');
      }
    });
  }

  onFetchCodigoSistrat(patient: Patient): void {
    if (!patient._id) {
      return;
    }

    this.fetchingCodigo[patient._id] = true;
    this.cdr.markForCheck();
    Notiflix.Loading.circle('Buscando código SISTRAT');

    this.patientService.fetchCodigoSistrat(patient._id).subscribe({
      next: (response) => {
        const message = response.message ?? 'Código sincronizado correctamente';
        Notiflix.Notify.success(message);
        Notiflix.Loading.remove();
        this.fetchingCodigo[patient._id!] = false;
        this.patientService.updatePatients(this.programsIds);
        this.cdr.markForCheck();
      },
      error: (error) => {
        const message = error?.error?.message ?? 'No fue posible obtener el código';
        Notiflix.Report.failure('Error', message, 'Entendido');
        Notiflix.Loading.remove();
        this.fetchingCodigo[patient._id!] = false;
        this.cdr.markForCheck();
      },
    });
  }

  onDialogAlertCie10(patientId: string) {
    console.log('onDialogAlertCie10');

    const dialogRef = this.dialog.open(FormCie10Component, {
      width: '95%',
      height: '40%',
      data: { patientId },
    });

  }

  onToggleActive(patient: Patient, isActive: boolean): void {
    if (!patient._id) {
      return;
    }

    const previousValue = patient.active !== false;
    this.togglingActive[patient._id] = true;
    patient.active = isActive;
    this.refreshSortedDataSource();
    this.cdr.markForCheck();

    this.patientService.updateActiveStatus(patient._id, isActive).subscribe({
      next: () => {
        this.togglingActive[patient._id!] = false;
        this.refreshSortedDataSource();
        this.cdr.markForCheck();
      },
      error: () => {
        patient.active = previousValue;
        this.togglingActive[patient._id!] = false;
        this.refreshSortedDataSource();
        this.cdr.markForCheck();
        Notiflix.Report.failure('Error', 'No se pudo actualizar el estado del paciente', 'Entendido');
      },
    });
  }

  private sortPatients(patients: Patient[]): Patient[] {
    return [...patients].sort((firstPatient, secondPatient) => {
      const firstActiveWeight = firstPatient.active === false ? 1 : 0;
      const secondActiveWeight = secondPatient.active === false ? 1 : 0;

      if (firstActiveWeight !== secondActiveWeight) {
        return firstActiveWeight - secondActiveWeight;
      }

      const firstCreatedAt = firstPatient.createdAt ? new Date(firstPatient.createdAt).getTime() : 0;
      const secondCreatedAt = secondPatient.createdAt ? new Date(secondPatient.createdAt).getTime() : 0;

      return secondCreatedAt - firstCreatedAt;
    });
  }

  private refreshSortedDataSource(): void {
    this.patients = this.sortPatients(this.dataSource.data);
    this.dataSource.data = this.patients;
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