import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
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
  registrationStatus = signal<Record<string, 'pending' | 'success' | 'error'>>({});
  bulkLoading = signal<boolean>(false);

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
      Notiflix.Notify.failure('Selecciona al menos un paciente');
      return;
    }

    this.bulkLoading.set(true);
    Notiflix.Loading.standard('Registrando...');

    const statuses: Record<string, 'pending' | 'success' | 'error'> = {
      ...this.registrationStatus(),
    };
    selectedIds.forEach((id) => {
      statuses[id] = 'pending';
    });
    this.registrationStatus.set(statuses);

    for (const patientId of selectedIds) {
      try {
        await firstValueFrom(
          this.medicalRecordService.monthRecords(patientId, month, year, [])
        );
        this.registrationStatus.set({
          ...this.registrationStatus(),
          [patientId]: 'success',
        });
      } catch (error) {
        console.error('Error registrando en SISTRAT:', error);
        this.registrationStatus.set({
          ...this.registrationStatus(),
          [patientId]: 'error',
        });
      }
    }

    this.bulkLoading.set(false);
    Notiflix.Loading.remove();
    Notiflix.Notify.success('Registro masivo finalizado');
  }

  private loadPatientsForCenter(center: string) {
    if (!center) {
      this.centerPatients.set([]);
      this.selectedPatients.set({});
      this.registrationStatus.set({});
      return;
    }

    this.patientService.getPatients([], { active: true }).subscribe((patients) => {
      const filtered = (patients || [])
        .filter((p) => p.sistratCenter === center)
        .sort((a, b) => {
          const aName = `${a.name || ''} ${a.surname || ''} ${a.secondSurname || ''}`.trim();
          const bName = `${b.name || ''} ${b.surname || ''} ${b.secondSurname || ''}`.trim();
          return aName.localeCompare(bName, 'es', { sensitivity: 'base' });
        });
      this.centerPatients.set(filtered);
      const selected: Record<string, boolean> = {};
      filtered.forEach((p) => {
        if (p._id) {
          selected[p._id] = false;
        }
      });
      this.selectedPatients.set(selected);
      this.registrationStatus.set({});
    });
  }

  private buildYearOptions(): number[] {
    const startYear = this.firstAvailableYear;
    const endYear = this.currentYear;
    const totalYears = Math.max(1, endYear - startYear + 1);
    return Array.from({ length: totalYears }, (_, index) => startYear + index);
  }
}
