import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Notiflix from 'notiflix';
import { MaterialModule } from '../../../../angular-material/material.module';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { MedicalRecordService } from '../../medicalRecord/medicalRecord.service';
import { PatientService } from '../patient.service';
import { diagnosticMap } from './diagnosticMap.constant';
import { MatSelectModule } from '@angular/material/select';
import { ClinicalInfoDialogComponent } from './clinical-info-dialog.component';
import NewMedicalRecord from '../../medicalRecord/new/new.component';
import { NonEmptyPipe } from '../../../../shared/pipes/non-empty.pipe';

interface State {
  patient: Patient | null;
  medicalRecords: MedicalRecord[];
  filteredMedicalRecords: MedicalRecord[];
  loading: boolean;
}

export interface MedicalRecordGrouped {
  service: string;
  days: number[];
  total: number;
}

export interface MedicalRecordProfessionalRow {
  service: string;
  label: string;
  isServiceRow: boolean;
  days: number[];
  total: number;
}

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [
    MaterialModule,
    MatExpansionModule,
    CommonModule,
    RouterModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    DatePipe,
    MatSelectModule,
    NonEmptyPipe,
  ],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DetailComponent {
  private dialog = inject(MatDialog);
  private patientService = inject(PatientService);
  private medicalRecordService = inject(MedicalRecordService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private readonly currentYear = new Date().getFullYear();
  private readonly firstAvailableYear = 2023;

  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(this.currentYear);
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

  registeredRecordsPerMonth = signal<boolean>(false);
  screenshotPath = signal<string | null>(null);
  public latestMedicalRecordWithScheme: MedicalRecord | null;
  readonly panelOpenState = signal(false);



  screenshotImage = computed( () => this.screenshotPath() )


  patientId = signal<string | null>(null);

  showTable = signal(false);
  medicalRecordsGrouped = signal<MedicalRecordGrouped[]>([]);
  daysInMonth = Array.from({ length: 31 }); // días 1-31
  displayedColumns = ['service', ...this.daysInMonth.map((_, i) => i.toString()), 'total'];
  #state = signal<State>({
    loading: true,
    patient: null,
    filteredMedicalRecords: [],
    medicalRecords: [],
  });

  showProfessionalTable = signal(false);
  medicalRecordsProfessionalGrouped = signal<MedicalRecordProfessionalRow[]>([]);

  state = this.#state; // acceso público para el template
  patient = computed(() => this.state().patient);

  ngOnInit(): void {

    if (this.showProfessionalTable()) {
      this.buildProfessionalDataMonth(this.selectedMonth(), this.selectedYear());
    }
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.patientId.set(id);
        this.loadPatientData(id);
      }
    });
  }


      //   this.patientService.getPatientById(id!).subscribe((response) => {
      //   console.log('response', response);
      //   this.patient = response.patient;

      //   this.latestMedicalRecordWithScheme = this.medicalRecordService.getLastPharmacologicalScheme(response.medicalRecords);
      //   console.log('latestMedicalRecordWithScheme', this.latestMedicalRecordWithScheme);

      //   this.medicalRecordForm.get('entryType')?.valueChanges.subscribe((value) => {
      //     this.hideServiceSelect = value === 'Informacion';
      //     if (this.hideServiceSelect) {
      //       this.medicalRecordForm.get('service')?.reset(); // Resetea el campo service si se oculta
      //     }
      //   });
      // });

  

  private loadPatientData(id: string) {
    this.#state.update((s) => ({ ...s, loading: true }));
    this.patientService.getPatientById(id).subscribe((response) => {
      
      // safe sort asc (no muta el array original)
      const medicalRecordsOrdered = [...(response.medicalRecords ?? [])].sort((a, b) => {
        const ta = Date.parse(a.date) || 0;
        const tb = Date.parse(b.date) || 0;
        return ta - tb; // ascendente
      });
      
      const month = this.selectedMonth();
      const year = this.selectedYear();
      const filteredRecords = this.filterRecordsByMonth(medicalRecordsOrdered, month, year);

      this.#state.set({
        loading: false,
        patient: response.patient,
        medicalRecords: medicalRecordsOrdered,
        filteredMedicalRecords: filteredRecords,
      });

      if (this.showTable()) {
        this.buildDataMonth(month, year);
      }

      if (this.showProfessionalTable()) {
        this.buildProfessionalDataMonth(month, year);
      }

      this.latestMedicalRecordWithScheme = this.medicalRecordService.getLastPharmacologicalScheme(response.medicalRecords);
      console.log('latestMedicalRecordWithScheme', this.latestMedicalRecordWithScheme);

      console.log('setstate', this.#state());
      
    });
  }

  openClinicalInfo() {
    const patient = this.state().patient;
    this.dialog.open(ClinicalInfoDialogComponent, {
      data: {
        patient,
        latestRecord: this.latestMedicalRecordWithScheme,
        treatmentTime: this.treatmentTime,
      },
      panelClass: 'clinical-info-dialog',
      width: '900px'
    });
  }

    getLastPharmacologicalScheme(medicalRecords: MedicalRecord[]): MedicalRecord | null{
    const medicalRecordSorted = medicalRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestMedicalRecordWithScheme = medicalRecordSorted.find((record) => record.pharmacologicalScheme);
    return latestMedicalRecordWithScheme || null;
  }

  onDeleteMedicalRecord(id: string) {
    Notiflix.Confirm.show(
      '¿Está seguro?',
      'Se eliminará la ficha clínica.',
      'Confirmar',
      'Cancelar',
      () => {
        // Success
        this.medicalRecordService.deleteMedicalRecord(id).subscribe({
          next: () => {
            this.#state.update((state) => ({
              ...state,
              medicalRecords: state.medicalRecords.filter((record) => record._id !== id),
            }));
            Notiflix.Notify.success('Ficha Clínica Eliminada');
          },
          error: (err) => {
            console.error('Error al eliminar la ficha médica:', err);
          },
        });
      },
      () => {
        // Cancel
        console.log('Cancelado registro en SISTRAT');
      }
    );
  }

  generatePdf() {
    if (!this.patientId()) return;
    this.patientService.getPdfByPatientId(this.patientId()!).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historial-${this.patientId()!}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onNewMedicalRecord() {
    const patientId = this.patientId();
    if (!patientId) {
      return;
    }

    const dialogRef = this.dialog.open(NewMedicalRecord, {
      width: '1080px',
      height: '90vh',
      panelClass: 'medical-record-dialog',
      data: { patientId },
    });

    dialogRef.afterClosed().subscribe((created) => {
      if (created) {
        this.loadPatientData(patientId);
      }
    });
  }

  getDiagnosticText(code: string | null | undefined): string {
    if (!code) return '-';
    return diagnosticMap[code] || 'Valor desconocido';
  }

  onMonthRegisters() {
    if (!this.showTable()) {
      this.buildDataMonth();
    } else {
      this.showTable.set(false);
    }
  }

  onProfessionalRegisters() {
    if (!this.showProfessionalTable()) {
      this.showTable.set(false);
      this.buildProfessionalDataMonth();
    } else {
      this.showProfessionalTable.set(false);
    }
  }

  buildDataMonth(monthSelected: number = this.selectedMonth(), year: number = this.selectedYear()) {
    // Inicializamos un objeto para agrupar
    let grouped: Record<string, number[]> = {};
    const records = this.state().medicalRecords ?? [];

    console.log('records', records);
    
    records.forEach((record) => {
      const dateMedicalRecord = new Date(record.date);
      const yearMedicalRecord = Number(new Date(record.date).getFullYear());
      const monthMedicalRecord = Number(dateMedicalRecord.getMonth() + 1);

      
      // Solo del mes y año que nos interesa
      if (monthMedicalRecord !== Number(monthSelected) || yearMedicalRecord !== year) return;

      
      const day = dateMedicalRecord.getDate(); // día 1-31      
      const service = record.service.description;

      // Si no existe la fila para este servicio, creamos array con 31 posiciones
      if (!grouped[service]) {
        grouped[service] = Array(31).fill(0);
      }

      // Sumamos 1 a la posición correspondiente al día (day-1 porque array inicia en 0)
      grouped[service][day - 1] += 1;
    });

    // Convertimos el objeto en un array de objetos
    const groupedArray = Object.keys(grouped).map((serviceName) => {
      const days = grouped[serviceName];
      const total = days.reduce((acc, value) => acc + value, 0);
      return { service: serviceName, days, total };
    });

    console.log('Grouped Array:', groupedArray);

    this.medicalRecordsGrouped.set(groupedArray); // ahora es array
    this.showTable.set(true);
  }

  private buildProfessionalDataMonth(monthSelected: number = this.selectedMonth(), year: number = this.selectedYear()) {
    const records = this.state().medicalRecords ?? [];
    const groupedRows: MedicalRecordProfessionalRow[] = [];
    const recordsByService: Record<string, MedicalRecord[]> = {};

    records.forEach((record) => {
      const recordDate = new Date(record.date);
      const recordYear = recordDate.getFullYear();
      const recordMonth = recordDate.getMonth() + 1;

      if (recordMonth !== monthSelected || recordYear !== year) {
        return;
      }

      const serviceName = record.service.description;
      if (!recordsByService[serviceName]) {
        recordsByService[serviceName] = [];
      }

      recordsByService[serviceName].push(record);
    });

    Object.entries(recordsByService).forEach(([serviceName, serviceRecords]) => {
      const serviceDays = Array(31).fill(0);
      serviceRecords.forEach((record) => {
        const day = new Date(record.date).getDate();
        serviceDays[day - 1] += 1;
      });

      groupedRows.push({
        service: serviceName,
        label: serviceName,
        isServiceRow: true,
        days: serviceDays,
        total: serviceDays.reduce((acc, value) => acc + value, 0),
      });

      const recordsByProfessional: Record<string, MedicalRecord[]> = {};
      serviceRecords.forEach((record) => {
        const professionalName = record.registeredBy?.name ?? 'Profesional no identificado';
        if (!recordsByProfessional[professionalName]) {
          recordsByProfessional[professionalName] = [];
        }

        recordsByProfessional[professionalName].push(record);
      });

      Object.entries(recordsByProfessional).forEach(([professionalName, professionalRecords]) => {
        const professionalDays = Array(31).fill(0);
        professionalRecords.forEach((record) => {
          const day = new Date(record.date).getDate();
          professionalDays[day - 1] += 1;
        });

        groupedRows.push({
          service: serviceName,
          label: `— ${professionalName}`,
          isServiceRow: false,
          days: professionalDays,
          total: professionalDays.reduce((acc, value) => acc + value, 0),
        });
      });
    });

    this.medicalRecordsProfessionalGrouped.set(groupedRows);
    this.showProfessionalTable.set(true);
  }


  onSistratRecord() {
    const patientId = this.#state().patient?._id;
    Notiflix.Confirm.show(
      '¿Está seguro?',
      'Se hara registro de ficha mensual en SISTRAT',
      'Confirmar',
      'Cancelar',
      () => {
        console.log('this.medicalRecordsGrouped()', this.medicalRecordsGrouped());
        
        // Success
        if(patientId === undefined) return;
        this.medicalRecordService.monthRecords(patientId, this.selectedMonth(), this.selectedYear(), this.medicalRecordsGrouped()).subscribe({
          next: () => {
            //this.#state.update((state) => ({
            //  ...state,
            //  medicalRecords: state.medicalRecords.filter((record) => record._id !== id),
            //}));
            Notiflix.Notify.success('Registrado en SISTRAT');
            this.registeredRecordsPerMonth.set(true);
            this.screenshotPath.set(`http://ficlin.cl/uploads/screenshots/septiembre2025/${this.patient()?.name.replace(/\s+/g, '_').toLowerCase()}_mes_septiembre.png`);
            //this.imagePath = `http://localhost:3002${response.user.signature}`;

          },
          error: (err: any) => {
            console.error('Error al eliminar la ficha médica:', err);
          },
        });
      },
      () => {
        // Cancel
        console.log('Cancelado registro en SISTRAT');
      }
    );
  }

  onMonthChange(event: number) {
    const month = Number(event);
    console.log('[month]', month);
    const year = this.selectedYear();
    this.selectedMonth.set(month);
    this.applyDateFilter(month, year);

    if (this.showTable()) {
      this.buildDataMonth(month, year);
    }

    if (this.showProfessionalTable()) {
      this.buildProfessionalDataMonth(month, year);
    }
  }

  onYearChange(year: number) {
    const month = this.selectedMonth();
    this.selectedYear.set(year);
    this.applyDateFilter(month, year);

    if (this.showTable()) {
      this.buildDataMonth(month, year);
    }

    if (this.showProfessionalTable()) {
      this.buildProfessionalDataMonth(month, year);
    }
  }

  private applyDateFilter(month: number, year: number) {
    const state = this.#state();
    const filteredRecords = this.filterRecordsByMonth(state.medicalRecords, month, year);

    this.#state.set({
      ...state,
      filteredMedicalRecords: filteredRecords,
    });
  }

  private filterRecordsByMonth(records: MedicalRecord[], month: number, year: number): MedicalRecord[] {
    if (!records) {
      return [];
    }

    return records.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() + 1 === month && recordDate.getFullYear() === year;
    });
  }

  private buildYearOptions(): number[] {
    const startYear = this.firstAvailableYear;
    const endYear = this.currentYear;
    const totalYears = Math.max(1, endYear - startYear + 1);
    return Array.from({ length: totalYears }, (_, index) => startYear + index);
  }

  get treatmentTime(): string {
    if (!this.state().patient?.admissionDate) {
      return '';
    }

    const [day, month, year] = this.state().patient!.admissionDate.split('/').map(Number);
    const admission = new Date(year, month - 1, day);
    const today = new Date();

    if (admission > today) {
      return 'Fecha futura';
    }

    let years = today.getFullYear() - admission.getFullYear();
    let months = today.getMonth() - admission.getMonth();
    let days = today.getDate() - admission.getDate();

    if (days < 0) {
      months--;
      // Obtener los días del mes anterior
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const parts: string[] = [];
    if (years > 0) {
      parts.push(`${years} año${years > 1 ? 's' : ''}`);
    }
    if (months > 0) {
      parts.push(`${months} mes${months > 1 ? 'es' : ''}`);
    }
    if (days > 0) {
      parts.push(`${days} día${days > 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(' ') : '0 días';
  }

}
