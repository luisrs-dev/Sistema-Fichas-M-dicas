import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { diagnosticMap } from './diagnosticMap.constant';

interface ClinicalDialogData {
  patient: Patient | null;
  latestRecord: MedicalRecord | null;
  treatmentTime: string;
}

@Component({
  selector: 'app-clinical-info-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatChipsModule, DatePipe],
  templateUrl: './clinical-info-dialog.component.html',
  styleUrl: './clinical-info-dialog.component.css'
})
export class ClinicalInfoDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ClinicalDialogData) { }

  getDiagnosticText(code: string | null | undefined): string {
    if (!code) return '-';
    return diagnosticMap[code] || 'Valor desconocido';
  }
}
