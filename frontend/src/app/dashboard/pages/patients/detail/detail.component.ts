import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import Notiflix from 'notiflix';
import { MaterialModule } from '../../../../angular-material/material.module';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { MedicalRecordService } from '../../medicalRecord/medicalRecord.service';
import { PatientService } from '../patient.service';
import { diagnosticMap } from './diagnosticMap.constant';
import { MatSelectModule } from '@angular/material/select';

interface State {
  patient: Patient | null;
  medicalRecords: MedicalRecord[];
  filteredMedicalRecords: MedicalRecord[];
  loading: boolean;
}

export interface MedicalRecordGrouped {
  service: string;
  days: number[];
}

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [MaterialModule, MatExpansionModule, CommonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, DatePipe, MatSelectModule],
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

  selectedMonth = signal<number>(9);

  registeredRecordsPerMonth = signal<boolean>(false);
  screenshotPath = signal<string | null>(null);

  screenshotImage = computed( () => this.screenshotPath() )


  patientId = signal<string | null>(null);

  showTable = signal(false);
  medicalRecordsGrouped = signal<MedicalRecordGrouped[]>([]);
  daysInMonth = Array.from({ length: 31 }); // días 1-31
  displayedColumns = ['service', ...this.daysInMonth.map((_, i) => i.toString())];
  #state = signal<State>({
    loading: true,
    patient: null,
    filteredMedicalRecords: [],
    medicalRecords: [],
  });

  state = this.#state; // acceso público para el template
  patient = computed(() => this.state().patient);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.patientId.set(id);
        this.loadPatientData(id);
      }
    });
  }

  private loadPatientData(id: string) {
    this.#state.update((s) => ({ ...s, loading: true }));
    this.patientService.getPatientById(id).subscribe((response) => {
      
      // safe sort asc (no muta el array original)
      const medicalRecordsOrdered = [...(response.medicalRecords ?? [])].sort((a, b) => {
        const ta = Date.parse(a.date) || 0;
        const tb = Date.parse(b.date) || 0;
        return ta - tb; // ascendente
      });

      //const medicalRecordAgosto = medicalRecordsOrdered.filter((record) => {
      //  const recordDate = new Date(record.date);
      //  return recordDate.getMonth() + 1 === this.selectedMonth() && recordDate.getFullYear() === 2025;
      //});

      //console.log('medicalRecordAgosto', medicalRecordAgosto);
      
      this.#state.set({
        loading: false,
        patient: response.patient,
        medicalRecords: medicalRecordsOrdered,
        filteredMedicalRecords: medicalRecordsOrdered,
      });

      console.log('setstate', this.#state());
      
    });
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
    this.router.navigate(['dashboard/patient', this.patientId(), 'ficha-clinica', 'nueva']);
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

  buildDataMonth(month: number = this.selectedMonth(), year: number = 2025) {
    // Inicializamos un objeto para agrupar
    let grouped: Record<string, number[]> = {};
    const records = this.state().medicalRecords;

    console.log('records', records);
    
    records.forEach((record) => {
      const date = new Date(record.date);

      console.log('date.getMonth() + 1', date.getMonth() + 1);
      console.log('month', month);
      
      

      // Solo del mes y año que nos interesa
      if (date.getMonth() + 1 !== month || date.getFullYear() !== year) return;

      const day = date.getDate(); // día 1-31
      const service = record.service.description;

      // Si no existe la fila para este servicio, creamos array con 31 posiciones
      if (!grouped[service]) {
        grouped[service] = Array(31).fill(0);
      }

      // Sumamos 1 a la posición correspondiente al día (day-1 porque array inicia en 0)
      grouped[service][day - 1] += 1;
    });

    // Convertimos el objeto en un array de objetos
    const groupedArray = Object.keys(grouped).map((serviceName) => ({
      service: serviceName,
      days: grouped[serviceName],
    }));

    console.log('Grouped Array:', groupedArray);

    this.medicalRecordsGrouped.set(groupedArray); // ahora es array
    this.showTable.set(true);
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
        this.medicalRecordService.monthRecords(patientId, this.selectedMonth(), 2025, this.medicalRecordsGrouped()).subscribe({
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
  this.selectedMonth.set(event);
  console.log(this.selectedMonth());
  
  const state = this.#state();
  // Usamos todos los registros del paciente
  const allRecords = state.medicalRecords ?? [];
  console.log('allRecords', allRecords);
  


  // Filtramos los del mes seleccionado
    const filteredRecords = allRecords.filter((record) => {
    const recordDate = new Date(record.date);
    return (
      (recordDate.getMonth() + 1) === Number(event) &&
      recordDate.getFullYear() === 2025
    );
  });


  // Actualizamos el state con los registros filtrados
  this.#state.set({
    ...state,
    filteredMedicalRecords: filteredRecords
  });

  console.log('state', this.#state());
  

  // Recalculamos la tabla agrupada
  //this.buildDataMonth(event); 
}

}
