import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom, Subscription, timer, exhaustMap, takeWhile, catchError, of } from 'rxjs';
import { AttentionBatchJob } from '../../../interfaces/attention-batch-job.interface';
import { HistoricalSyncJob } from '../../../interfaces/historical-sync.interface';
import Notiflix from 'notiflix';
import { Patient } from '../../../interfaces/patient.interface';
import { MedicalRecordService } from '../medicalRecord.service';
import { PatientService } from '../../patients/patient.service';
import { SistratCenter, SistratCenterService } from '../../../services/sistratCenter.service';

@Component({
  selector: 'app-attentions',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './attentions.component.html',
  styleUrl: './attentions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AttentionsComponent {
  readonly action: 'atenciones' | 'alertas' | 'historicos' = inject(ActivatedRoute).snapshot.data['bulkAction'] || 'atenciones';
  readonly pageTitle = { atenciones: 'Atenciones', alertas: 'Alertas', historicos: 'Históricos' }[this.action];
  readonly pageDescription = {
    atenciones: 'Registra las atenciones mensuales de los pacientes seleccionados en SISTRAT.',
    alertas: 'Actualiza las alertas de los pacientes seleccionados desde SISTRAT.',
    historicos: 'Sincroniza los pacientes históricos del centro desde SISTRAT hacia Ficlin.',
  }[this.action];
  private readonly patientService = inject(PatientService);
  private readonly medicalRecordService = inject(MedicalRecordService);
  private readonly sistratCenterService = inject(SistratCenterService);

  patientsLoading = signal(false);
  patientsLoaded = signal(false);
  patientsLoadError = signal(false);
  patientsSource = signal<'cache' | 'sistrat' | null>(null);
  patientsUpdatedAt = signal<string | null>(null);
  operationBusy = computed(() => this.patientsLoading() || this.historicalBusy() || this.bulkLoading() || this.isUpdatingAlerts() || !!this.historicalJob()?.active);

  historicalJob = signal<HistoricalSyncJob | null>(null);
  historicalBusy = signal(false);
  historicalConnectionError = signal(false);
  private historicalSubscription?: Subscription;
  private attentionSubscription?: Subscription;
  attentionJob = signal<AttentionBatchJob | null>(null);
  attentionConnectionError = signal(false);
  private destroyed = false;

  ngOnDestroy() {
    this.destroyed = true;
    this.attentionSubscription?.unsubscribe();
    this.historicalSubscription?.unsubscribe();
  }

  async resumeHistoricalSync(center: string) {
    this.historicalSubscription?.unsubscribe();
    this.historicalJob.set(null);
    this.historicalConnectionError.set(false);
    this.historicalBusy.set(true);
    try {
      const response = await firstValueFrom(this.patientService.latestHistoricalSync(center));
      if (this.destroyed || this.selectedCenter() !== center) return;
      this.historicalJob.set(response.job);
      this.historicalBusy.set(!!response.job?.active);
      if (response.job?.active) this.watchHistoricalSync(response.job);
    } catch {
      if (this.destroyed || this.selectedCenter() !== center) return;
      this.historicalBusy.set(false);
      this.historicalConnectionError.set(true);
    }
  }

  async syncHistoricalPatients() {
    const center = this.selectedCenter();
    if (!center || this.operationBusy()) return;
    this.historicalBusy.set(true);
    this.historicalConnectionError.set(false);
    try {
      const response = await firstValueFrom(this.patientService.startHistoricalSync(center));
      if (this.destroyed) return;
      this.historicalJob.set(response.job);
      this.watchHistoricalSync(response.job);
    } catch (error: any) {
      this.historicalBusy.set(false);
      Notiflix.Notify.failure(error?.error?.message || 'No se pudo iniciar la sincronización');
    }
  }

  private watchHistoricalSync(job: HistoricalSyncJob) {
    this.historicalSubscription?.unsubscribe();
    this.historicalSubscription = timer(0, 2000).pipe(
      exhaustMap(() => this.patientService.getHistoricalSync(job._id)),
      takeWhile(response => response.job.active, true)
    ).subscribe({
      next: ({ job: updated }) => {
        this.historicalJob.set(updated);
        this.historicalBusy.set(updated.active);
        if (!updated.active) {
          const codes = new Set([...(updated.result?.updated || []), ...(updated.result?.alreadyHistorical || [])]);
          this.centerPatients.update(patients => patients.filter(p => !codes.has((p.codigoSistrat || '').trim().toUpperCase())));
          const selected = { ...this.selectedPatients() };
          const remaining = new Set(this.centerPatients().map(p => p._id));
          Object.keys(selected).forEach(id => { if (!remaining.has(id)) delete selected[id]; });
          this.selectedPatients.set(selected);
        }
      },
      error: () => {
        this.historicalConnectionError.set(true);
        this.historicalBusy.set(false);
      }
    });
  }

  private readonly currentYear = new Date().getFullYear();
  private readonly firstAvailableYear = 2023;

  sistratCenters = signal<SistratCenter[]>([]);

  selectedCenter = signal<string>('');
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(this.currentYear);

  centerPatients = signal<Patient[]>([]);
  selectedPatients = signal<Record<string, boolean>>({});
  registrationStatus = signal<Record<string, 'queued' | 'pending' | 'success' | 'error' | 'warning'>>({});
  registrationMessages = signal<Record<string, string>>({});
  bulkLoading = signal<boolean>(false);
  isUpdatingAlerts = signal<boolean>(false);

  readonly months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];
  readonly years = this.buildYearOptions();

  selectedCount = computed(() =>
    Object.values(this.selectedPatients()).filter(Boolean).length
  );
  isAllSelected = computed(() => {
    const patients = this.centerPatients().filter(patient => patient._id && patient.codigoSistrat);
    if (!patients.length) {
      return false;
    }
    const selections = this.selectedPatients();
    return patients.every((patient) => !patient._id || selections[patient._id]);
  });

  ngOnInit() {
    this.sistratCenterService.getActiveCenters().subscribe((centers: SistratCenter[]) => {
      this.sistratCenters.set(centers);
    });
  }

  onCenterChange(center: string) {
    this.attentionSubscription?.unsubscribe();
    this.attentionJob.set(null);
    this.attentionConnectionError.set(false);
    this.bulkLoading.set(false);
    this.historicalSubscription?.unsubscribe();
    this.historicalJob.set(null);
    this.historicalConnectionError.set(false);
    this.historicalBusy.set(false);
    this.selectedCenter.set(center);
    this.centerPatients.set([]);
    this.selectedPatients.set({});
    this.registrationStatus.set({});
    this.registrationMessages.set({});
    this.patientsLoaded.set(false);
    this.patientsLoadError.set(false);
    this.patientsSource.set(null);
    this.patientsUpdatedAt.set(null);
    if (center && this.action === 'atenciones') void this.resumeAttentionBatch(center);
    if (center && this.action === 'historicos') void this.resumeHistoricalSync(center);
  }

  togglePatientSelection(patientId: string, checked: boolean) {
    const current = { ...this.selectedPatients() };
    current[patientId] = checked;
    this.selectedPatients.set(current);
  }

  toggleSelectAllPatients() {
    const shouldSelectAll = !this.isAllSelected();
    const updatedSelections = { ...this.selectedPatients() };
    this.centerPatients().forEach((patient) => {
      if (patient._id && patient.codigoSistrat) {
        updatedSelections[patient._id] = shouldSelectAll;
      }
    });
    this.selectedPatients.set(updatedSelections);
  }

  async resumeAttentionBatch(center: string) {
    this.attentionSubscription?.unsubscribe();
    this.bulkLoading.set(true);
    this.attentionConnectionError.set(false);
    try {
      const { job } = await firstValueFrom(this.medicalRecordService.latestAttentionBatchJob(center));
      if (this.destroyed || this.selectedCenter() !== center) return;
      this.attentionJob.set(job);
      this.bulkLoading.set(!!job?.active);
      if (job) {
        this.applyAttentionBatch(job);
        if (job.active) this.watchAttentionBatch(job);
      }
    } catch {
      if (this.destroyed || this.selectedCenter() !== center) return;
      // No permitir reenviar si no se pudo verificar el estado del proceso anterior.
      this.attentionConnectionError.set(true);
    }
  }

  private applyAttentionBatch(job: AttentionBatchJob) {
    this.attentionJob.set(job);
    this.bulkLoading.set(job.active);
    const statuses = { ...this.registrationStatus() };
    const messages = { ...this.registrationMessages() };
    for (const id of job.patientIds) {
      statuses[id] = job.active ? 'queued' : 'warning';
      messages[id] = job.active ? 'Esperando procesamiento' : 'Sin resultado confirmado. Verifica SISTRAT antes de reenviar.';
    }
    if (job.active && job.currentBatch > 0) {
      const offset = (job.currentBatch - 1) * job.batchSize;
      for (const id of job.patientIds.slice(offset, offset + job.batchSize)) {
        statuses[id] = 'pending';
        messages[id] = 'Procesando lote actual';
      }
    }
    for (const result of job.results) {
      statuses[result.patientId] = result.status;
      messages[result.patientId] = result.message || '';
    }
    this.registrationStatus.set(statuses);
    this.registrationMessages.set(messages);
    if (job.active) {
      this.selectedMonth.set(job.month);
      this.selectedYear.set(job.year);
    }
  }

  private watchAttentionBatch(job: AttentionBatchJob) {
    this.attentionSubscription?.unsubscribe();
    this.attentionSubscription = timer(0, 3000).pipe(
      exhaustMap(() => this.medicalRecordService.attentionBatchJob(job._id).pipe(
        catchError(() => { this.attentionConnectionError.set(true); return of(null); })
      )),
      takeWhile(response => !response || response.job.active, true)
    ).subscribe(response => {
      if (!response || this.destroyed || this.selectedCenter() !== job.center) return;
      this.attentionConnectionError.set(false);
      this.applyAttentionBatch(response.job);
      if (!response.job.active) {
        if (response.job.status === 'COMPLETED') Notiflix.Notify.success('Registro de atenciones finalizado');
        else Notiflix.Notify.warning('Registro finalizado con incidencias. Revisa los resultados antes de reenviar.');
      }
    });
  }

  async onBulkSistratRecord() {
    if (this.operationBusy() || !this.patientsLoaded()) return;
    const center = this.selectedCenter();
    const ids = Object.entries(this.selectedPatients()).filter(([, checked]) => checked).map(([id]) => id);
    if (!center || !ids.length) {
      Notiflix.Notify.failure('Selecciona un centro y al menos un paciente');
      return;
    }
    this.bulkLoading.set(true);
    this.attentionConnectionError.set(false);
    try {
      const { job } = await firstValueFrom(this.medicalRecordService.monthRecordsBulkCenter(
        center, this.selectedMonth(), this.selectedYear(), ids
      ));
      if (this.destroyed) return;
      this.applyAttentionBatch(job);
      this.watchAttentionBatch(job);
      Notiflix.Notify.info('Registro iniciado. Puedes salir de esta pantalla y volver a consultar el avance.');
    } catch (error: any) {
      Notiflix.Notify.failure(error?.error?.message || 'No se pudo confirmar el inicio. Consultando el estado.');
      // Una respuesta perdida no prueba que el backend haya rechazado el envío.
      await this.resumeAttentionBatch(center);
    }
  }

  async onBulkUpdateAlerts() {
    if (this.operationBusy() || !this.patientsLoaded()) return;
    const center = this.selectedCenter();
    if (!center) {
      Notiflix.Notify.failure('Selecciona un centro');
      return;
    }

    const selectedIds = Object.entries(this.selectedPatients())
      .filter(([, checked]) => checked)
      .map(([id]) => id);

    if (!selectedIds.length) {
      Notiflix.Notify.failure('Selecciona al menos un paciente para actualizar sus alertas');
      return;
    }

    this.isUpdatingAlerts.set(true);
    Notiflix.Notify.info(`Sincronizando de una sola vez alertas para ${selectedIds.length} pacientes...`);

    const statuses: Record<string, 'queued' | 'pending' | 'success' | 'error' | 'warning'> = {
      ...this.registrationStatus(),
    };
    const messages = { ...this.registrationMessages() };

    selectedIds.forEach((id) => {
      statuses[id] = 'pending';
      messages[id] = 'Extrayendo diccionario Sistrat en Background...';
    });
    this.registrationStatus.set(statuses);
    this.registrationMessages.set(messages);

    try {
      const response = await firstValueFrom(this.patientService.bulkUpdateAlertSistrat(center, selectedIds));
      
      const updatedStatuses = { ...this.registrationStatus() };
      const updatedMessages = { ...this.registrationMessages() };
      
      selectedIds.forEach((id) => {
        updatedStatuses[id] = 'success';
        updatedMessages[id] = 'Actualizado correctamente (Proceso Masivo O[1])';
      });

      this.registrationStatus.set(updatedStatuses);
      this.registrationMessages.set(updatedMessages);
      
      Notiflix.Notify.success(`Actualización masiva completada exitosamente. Total cruzados: ${response.updated}`);
    } catch (error: any) {
      console.error('Error enviando sincronización O(1) masiva de SISTRAT:', error);

      let errorMessage = 'Error al descargar el diccionario global desde Plataforma';
      if (typeof error === 'string') errorMessage = error;
      else if (error?.error?.message) errorMessage = error.error.message;
      else if (error?.message) errorMessage = error.message;

      const updatedStatuses = { ...this.registrationStatus() };
      const updatedMessages = { ...this.registrationMessages() };
      selectedIds.forEach((id) => {
        updatedStatuses[id] = 'error';
        updatedMessages[id] = errorMessage;
      });

      this.registrationStatus.set(updatedStatuses);
      this.registrationMessages.set(updatedMessages);
      Notiflix.Notify.failure(errorMessage);
    } finally {
      this.isUpdatingAlerts.set(false);
    }
  }

  recoverPatients() {
    const center = this.selectedCenter();
    if (center && !this.operationBusy()) void this.loadPatientsForCenter(center);
  }

  forceLoadPatientsForCenter() {
    const center = this.selectedCenter();
    if (center && !this.operationBusy()) {
      this.loadPatientsForCenter(center, true);
    }
  }

  private async loadPatientsForCenter(center: string, forceRefresh: boolean = false) {
    if (!center) {
      this.centerPatients.set([]);
      this.selectedPatients.set({});
      this.registrationStatus.set({});
      this.registrationMessages.set({});
      return;
    }

    this.patientsLoading.set(true);
    this.patientsLoadError.set(false);
    this.patientsLoaded.set(false);
    this.patientsSource.set(null);
    this.patientsUpdatedAt.set(null);
    this.centerPatients.set([]);
    this.selectedPatients.set({});

    try {
      const response = await firstValueFrom(this.patientService.getActiveSistratPatients(center, forceRefresh));
      if (this.destroyed || this.selectedCenter() !== center) return;
      const historical = this.historicalJob();
      const removedCodes = new Set([...(historical?.result?.updated || []), ...(historical?.result?.alreadyHistorical || [])]);
      const patientsFromSistrat = (response.data || []).filter(p => !removedCodes.has((p.codigoSistrat || '').trim().toUpperCase()));

      const filtered = patientsFromSistrat.sort((a, b) => {
        const aName = a.name.trim();
        const bName = b.name.trim();
        return aName.localeCompare(bName, 'es', { sensitivity: 'base' });
      }).map((p: any) => ({
        _id: p.mongoId || undefined,
        name: p.name,
        surname: '',
        secondSurname: '',
        codigoSistrat: p.codigoSistrat,
        sistratCenter: center
      } as Patient));

      this.centerPatients.set(filtered);
      this.patientsLoaded.set(true);
      this.patientsSource.set(response.source);
      this.patientsUpdatedAt.set(response.lastUpdated);
      const selected: Record<string, boolean> = {};
      filtered.forEach((p) => {
        if (p._id) {
          selected[p._id] = false;
        }
      });
      this.selectedPatients.set(selected);
      this.registrationStatus.set({});
      this.registrationMessages.set({});
      const job = this.attentionJob();
      if (job && this.action === 'atenciones') this.applyAttentionBatch(job);
    } catch (error) {
      if (this.destroyed || this.selectedCenter() !== center) return;
      this.patientsLoadError.set(true);
      console.error('Error cargando pacientes desde SISTRAT:', error);
      Notiflix.Notify.failure('Fallo al obtener pacientes de SISTRAT');
      this.centerPatients.set([]);
      this.selectedPatients.set({});
      this.registrationStatus.set({});
      this.registrationMessages.set({});
    } finally {
      this.patientsLoading.set(false);
    }
  }

  private buildYearOptions(): number[] {
    const startYear = this.firstAvailableYear;
    const endYear = this.currentYear;
    const totalYears = Math.max(1, endYear - startYear + 1);
    return Array.from({ length: totalYears }, (_, index) => startYear + index);
  }
}
