import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import Notiflix from 'notiflix';
import { Patient } from '../../../interfaces/patient.interface';
import { MedicalRecordService } from '../medicalRecord.service';
import { PatientService } from '../../patients/patient.service';

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
  private readonly patientService = inject(PatientService);
  private readonly medicalRecordService = inject(MedicalRecordService);

  private readonly currentYear = new Date().getFullYear();
  private readonly firstAvailableYear = 2023;

  readonly sistratCenters = [
    { value: 'hombres', label: 'CEADT Hombres' },
    { value: 'mujeres', label: 'CEADT Mujeres' },
    { value: 'alameda', label: 'CEADT PAI PG Alameda' },
  ];

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
    const patients = this.centerPatients();
    if (!patients.length) {
      return false;
    }
    const selections = this.selectedPatients();
    return patients.every((patient) => !patient._id || selections[patient._id]);
  });

  onCenterChange(center: string) {
    this.selectedCenter.set(center);
    this.loadPatientsForCenter(center);
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
      if (patient._id) {
        updatedSelections[patient._id] = shouldSelectAll;
      }
    });
    this.selectedPatients.set(updatedSelections);
  }

  async onBulkSistratRecord() {
    const center = this.selectedCenter();
    if (!center) {
      Notiflix.Notify.failure('Selecciona un centro');
      return;
    }

    const month = this.selectedMonth();
    const year = this.selectedYear();
    const selectedIds = Object.entries(this.selectedPatients())
      .filter(([, checked]) => checked)
      .map(([id]) => id);

    if (!selectedIds.length) {
      Notiflix.Notify.failure('Selecciona al menos un paciente para enviar atenciones masivas');
      return;
    }

    this.bulkLoading.set(true);
    Notiflix.Notify.info(`Enviando registro de atenciones mensuales para ${selectedIds.length} pacientes...`);

    const statuses: Record<string, 'queued' | 'pending' | 'success' | 'error' | 'warning'> = {
      ...this.registrationStatus(),
    };
    const messages = { ...this.registrationMessages() };

    selectedIds.forEach((id) => {
      statuses[id] = 'pending';
      messages[id] = 'Registro masivo O(1) en background...';
    });
    this.registrationStatus.set(statuses);
    this.registrationMessages.set(messages);

    try {
      const response = await firstValueFrom(
        this.medicalRecordService.monthRecordsBulkCenter(center, month, year, selectedIds)
      );

      const bulkResults = response.results || [];
      const updatedStatuses = { ...this.registrationStatus() };
      const updatedMessages = { ...this.registrationMessages() };

      // Si no devolvió nada extra, todos a error por defecto o validamos los results:
      selectedIds.forEach((id) => {
        const resItem = bulkResults.find((r: any) => String(r.patientId) === String(id));
        if (resItem) {
          updatedStatuses[id] = resItem.status; // success, error, warning
          updatedMessages[id] = resItem.message || '';
        } else {
          updatedStatuses[id] = 'warning';
          updatedMessages[id] = 'No procesado (Revisar logs del servidor)';
        }
      });

      this.registrationStatus.set(updatedStatuses);
      this.registrationMessages.set(updatedMessages);

      Notiflix.Notify.success('Operación masiva de registro en SISTRAT finalizada');
    } catch (error: any) {
      console.error('Error registrando atenciones mensuales masivas SISTRAT:', error);

      let errorMessage = 'Ocurrió un error en el registro masivo';
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
      this.bulkLoading.set(false);
    }
  }

  async onBulkUpdateAlerts() {
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

  forceLoadPatientsForCenter() {
    const center = this.selectedCenter();
    if (center) {
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

    Notiflix.Loading.standard('Cargando pacientes desde SISTRAT...');

    try {
      const response = await firstValueFrom(this.patientService.getActiveSistratPatients(center, forceRefresh));
      const patientsFromSistrat = response.data || [];

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
      const selected: Record<string, boolean> = {};
      filtered.forEach((p) => {
        if (p._id) {
          selected[p._id] = false;
        }
      });
      this.selectedPatients.set(selected);
      this.registrationStatus.set({});
      this.registrationMessages.set({});
    } catch (error) {
      console.error('Error cargando pacientes desde SISTRAT:', error);
      Notiflix.Notify.failure('Fallo al obtener pacientes de SISTRAT');
      this.centerPatients.set([]);
      this.selectedPatients.set({});
      this.registrationStatus.set({});
      this.registrationMessages.set({});
    } finally {
      Notiflix.Loading.remove();
    }
  }

  private buildYearOptions(): number[] {
    const startYear = this.firstAvailableYear;
    const endYear = this.currentYear;
    const totalYears = Math.max(1, endYear - startYear + 1);
    return Array.from({ length: totalYears }, (_, index) => startYear + index);
  }
}
