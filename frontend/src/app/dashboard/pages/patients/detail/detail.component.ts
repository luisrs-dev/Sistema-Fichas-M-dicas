import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop'; // Convierte Observable a Signal
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PdfService } from '../../../../shared/services/Pdf.service';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { PatientService } from '../patient.service';
import { MedicalRecordService } from '../../medicalRecord/medicalRecord.service';
import Notiflix from 'notiflix';

interface State {
  patient: Patient | null;
  medicalRecords: MedicalRecord[];
  loading: boolean;
}

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [MaterialModule, MatExpansionModule, CommonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, DatePipe, RouterLink],
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

  patientId = signal<string | null>(null);

  #state = signal<State>({
    loading: true,
    patient: null,
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
      this.#state.set({
        loading: false,
        patient: response.patient,
        medicalRecords: response.medicalRecords,
      });
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
}
