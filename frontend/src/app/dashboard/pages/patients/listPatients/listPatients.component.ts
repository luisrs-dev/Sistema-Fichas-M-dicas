import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject, DestroyRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom, Subject, switchMap, startWith, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaterialModule } from '../../../../angular-material/material.module';
import { Patient, CareStatus } from '../../../interfaces/patient.interface';
import { PatientService } from '../patient.service';
import { AuthService } from '../../../../auth/auth.service';
import { User } from '../../../../auth/interfaces/login-response.interface';
import { Parameter } from '../../parameters/interfaces/parameter.interface';
import { MatDialog } from '@angular/material/dialog';
import { FormCie10Component } from './components/formCie10/formCie10.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DataExportComponent } from './components/data-export/data-export.component';
import { ExportProgressDialogComponent } from './components/export-progress-dialog/export-progress-dialog.component';
import Notiflix from 'notiflix';
import { canViewAlert, AlertType } from '../../../utils/alert-visibility';
import { UserService } from '../../users/user.service';

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
  private userService = inject(UserService);
  public authService = inject(AuthService);
  public dialog = inject(MatDialog);
  public bottomSheet = inject(MatBottomSheet);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private refresh = new Subject<void>();
  public careStatus: CareStatus = 'active';
  public listTitle = 'Pacientes activos';
  public loading = true;
  public loadError = false;

  reloadPatients(): void { this.refresh.next(); }



  public patients: Patient[];
  public canCreateUser: boolean = false;
  public isAdmin: boolean = false;
  public user: User;
  public programsIds: string[];
  public programs: Parameter[] = [];
  public selectedOptionToExport: string | null = null;
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
      this.displayedColumns = ['codigoSistrat', 'name', 'program', 'phone', 'fonasa', 'alertas', 'actions'];
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

      const matchAlerts = searchTerms.alerts ? !!(
        (data.alertCie10 && this.canViewAzul(data)) ||
        (data.alertConsentimiento && this.canViewNegra(data)) ||
        (data.alertIntegracionSocial && this.canViewAlertType('integracionSocial')) ||
        (data.alertEvaluacion && this.canViewVerde(data)) ||
        (data.alertEgreso && this.canViewRoja()) ||
        (data.alertDiagnosticoSocial && this.canViewAlertType('diagnosticoSocial'))
      ) : true;

      return matchSearch && matchProgram && matchAlerts;
    };

    this.dataSource.filter = JSON.stringify(this.filters);

    this.canCreateUser = this.authService.canCreateUser();
    this.isAdmin = this.authService.isAdmin();
    this.user = this.authService.getUser();
    this.programsIds = this.user.programs.map((program) => program._id);

    this.route.data.pipe(
      switchMap(data => {
        this.careStatus = data['careStatus'] as CareStatus;
        this.listTitle = this.careStatus === 'waiting' ? 'Lista de espera' :
          this.careStatus === 'discharged' ? 'Pacientes históricos' : 'Pacientes activos';
        return this.refresh.pipe(startWith(undefined), switchMap(() => {
          this.loading = true;
          this.loadError = false;
          this.dataSource.data = [];
          this.cdr.markForCheck();
          return this.userService.getUserById(this.user._id).pipe(
            switchMap(user => {
              if (!user || typeof user !== 'object' || !user._id) throw new Error('Profesional no encontrado');
              this.user = user;
              this.authService.setUser(user);
              this.isAdmin = this.authService.isAdmin();
              this.programsIds = user.programs.map((program: Parameter) => program._id);
              this.canCreateUser = this.authService.canCreateUser();
              this.dataSource.filter = JSON.stringify(this.filters);
              return this.patientService.getPatients(this.programsIds, { careStatus: this.careStatus });
            }),
            catchError(() => {
              this.loadError = true;
              Notiflix.Notify.failure('No se pudo cargar la lista de pacientes');
              return of([] as Patient[]);
            })
          );
        }));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(patients => {
      this.patients = this.sortPatients(patients);
      this.dataSource.data = this.patients;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.paginator?.firstPage();
      this.loading = false;
      this.cdr.markForCheck();
    });

    // Reconexión automática: si hay un job activo guardado en localStorage (ej: tras un refresh)
    this.checkAndResumeExportJob();
  }

  /**
   * Verifica si hay un job de exportación activo en localStorage.
   * Si existe, reabre el diálogo de progreso automáticamente para que el usuario
   * pueda ver el estado y descargar el archivo cuando esté listo.
   */
  private checkAndResumeExportJob(): void {
    const savedJob = ExportProgressDialogComponent.getSavedJob();
    if (!savedJob) return;

    // Verificar si el job sigue siendo válido en el servidor
    fetch(`${(this.patientService as any).backend}/generate-pdf/export/progress/${savedJob.jobId}`, {
      headers: { 'Accept': 'text/event-stream' },
    }).then(res => {
      if (res.ok) {
        res.body?.cancel(); // cerrar el stream de la verificación
        // Job válido: reabrir el diálogo
        this.dialog.open(ExportProgressDialogComponent, {
          data: savedJob,
          width: '480px',
          disableClose: false,
        });
      } else {
        // Job expiró o no existe: limpiar localStorage
        ExportProgressDialogComponent.clearSavedJob();
      }
    }).catch(() => {
      // No se pudo verificar (servidor caído), limpiar para no molestar
      ExportProgressDialogComponent.clearSavedJob();
    });
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
        this.reloadPatients();
      },
      error: () => {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure('Error actualizando alerta');
      }
    });
  }

  canViewAlertType(alert: AlertType, element?: Patient): boolean {
    return canViewAlert(alert, this.user?.profile, this.isAdmin, element?.program?.name);
  }

  canViewNegra(element: Patient): boolean { return this.canViewAlertType('consentimiento', element); }
  canViewVerde(element: Patient): boolean { return this.canViewAlertType('evaluacion', element); }
  canViewRoja(): boolean { return this.canViewAlertType('egreso'); }
  canViewAzul(element: Patient): boolean { return this.canViewAlertType('cie10', element); }

  hasRegisteredForm(element: Patient): boolean {
    return !!(
      element.hasTopForm ||
      element.hasSocialForm ||
      element.hasEvaluationForm ||
      element.hasSocialDiagnosisForm
    );
  }

  hasBlockingAlert(element: Patient): boolean {
    console.log('user',this.user);
    
    if (this.isAdmin) return false;
    const profileName = this.user?.profile?.name?.toLowerCase() || '';

    // Rule 1: VERDE (alertEvaluacion) -> Terapia ocupacional
    const isTerapeuta = profileName.includes('terapeuta') || profileName.includes('ocupacional');
    if (element.alertEvaluacion && isTerapeuta) {
      return true;
    }

    // Rule 2: AMARILLA (alertIntegracionSocial) -> Trabajador social
    const isTrabajadorSocial = profileName.includes('trabajador') || profileName.includes('social');
    if (element.alertIntegracionSocial && isTrabajadorSocial) {
      return true;
    }

    // Rule 3: NEGRA (alertConsentimiento) -> Psicólogo
    const isPsicologo = profileName.includes('psicólog') || profileName.includes('psicolog');
    if (element.alertConsentimiento && isPsicologo) {
      return true;
    }

    // Rule 4: AZUL (alertCie10) -> Médico
    const isMedico = profileName.includes('médico') || profileName.includes('medico');
    if (element.alertCie10 && isMedico) {
      return true;
    }

    return false;
  }

  getBlockingAlertMessage(element: Patient): string {
    const profileName = this.user?.profile?.name?.toLowerCase() || '';

    const isTerapeuta = profileName.includes('terapeuta') || profileName.includes('ocupacional');
    if (element.alertEvaluacion && isTerapeuta) {
      return 'Debe ingresar la alerta de Evaluación (Verde) para poder registrar atenciones';
    }

    const isTrabajadorSocial = profileName.includes('trabajador') || profileName.includes('social');
    if (element.alertIntegracionSocial && isTrabajadorSocial) {
      return 'Debe ingresar la alerta de Integración Social (Amarilla) para poder registrar atenciones';
    }

    const isPsicologo = profileName.includes('psicólog') || profileName.includes('psicolog');
    if (element.alertConsentimiento && isPsicologo) {
      return 'Debe ingresar la alerta de TOP (Negra) para poder registrar atenciones';
    }

    const isMedico = profileName.includes('médico') || profileName.includes('medico');
    if (element.alertCie10 && isMedico) {
      return 'Debe confirmar si existe Diagnóstico de Trastorno Psiquiátrico CIE10 (Azul) para poder registrar atenciones';
    }

    return '';
  }

  showBlockingAlertMessage(element: Patient): void {
    const message = this.getBlockingAlertMessage(element);
    Notiflix.Report.warning(
      'Atenciones Bloqueadas',
      `${message}. Por favor ingrese el formulario correspondiente antes de registrar nuevas atenciones.`,
      'Entendido'
    );
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
        this.reloadPatients();
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

  private sortPatients(patients: Patient[]): Patient[] {
    return [...patients].sort((firstPatient, secondPatient) => {
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
        const { startDate, endDate, centerName } = result;

        // 1. Iniciar el job de exportación en background
        this.patientService.startExportJob(startDate, endDate, centerName).subscribe({
          next: ({ jobId }) => {
            // 2. Abrir el diálogo de progreso SSE (se conecta automáticamente al stream)
            this.dialog.open(ExportProgressDialogComponent, {
              data: { jobId, downloadFilename: `historiales_${startDate}_${endDate}.zip` },
              width: '480px',
              disableClose: false,
            });
          },
          error: (error) => {
            const message = error?.error?.message || 'Error al iniciar la exportación';
            Notiflix.Notify.failure(message);
          }
        });
      }
    });
  }



}