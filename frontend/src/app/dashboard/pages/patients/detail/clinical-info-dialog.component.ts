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
  template: `
    <h2 mat-dialog-title>Información clínica</h2>
    <mat-dialog-content>
      <div class="info-grid">
        <div>
          <p class="label">Paciente</p>
          <p class="value">
            {{ data.patient?.name }} {{ data.patient?.surname }} {{ data.patient?.secondSurname }}
          </p>
          <p class="muted">
            Programa: {{ data.patient?.program?.name || '-' }}
          </p>
          <p class="muted">Fecha ingreso: {{ data.patient?.admissionDate || '-' }}</p>
        </div>
        <div>
          <p class="label">Tiempo en tratamiento</p>
          <p class="value">{{ data.treatmentTime || 'Sin datos' }}</p>
        </div>
      </div>

      <div class="card">
        <p class="label">Último diagnóstico</p>
        <p class="value" *ngIf="data.latestRecord?.diagnostic; else noDiag">
          {{ getDiagnosticText(data.latestRecord?.diagnostic) }}
        </p>
        <ng-template #noDiag>
          <p class="placeholder">Sin registro anterior</p>
        </ng-template>
        <p class="muted" *ngIf="data.latestRecord?.date as recordDate">
          Actualizado {{ recordDate | date: 'dd-MM-yyyy' }}
        </p>
      </div>

      <div class="card">
        <p class="label">Esquema farmacológico</p>
        <p class="value" *ngIf="data.latestRecord?.pharmacologicalScheme; else noScheme">
          {{ data.latestRecord?.pharmacologicalScheme }}
        </p>
        <ng-template #noScheme>
          <p class="placeholder">Sin registro anterior</p>
        </ng-template>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }
      .card {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      .label {
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 11px;
        color: #6b7280;
        margin-bottom: 4px;
      }
      .value {
        font-weight: 600;
        margin: 0;
        color: #111827;
      }
      .muted {
        font-size: 13px;
        color: #6b7280;
        margin: 2px 0 0;
      }
      .placeholder {
        color: #9ca3af;
        font-style: italic;
      }
    `,
  ],
})
export class ClinicalInfoDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ClinicalDialogData) {}

  getDiagnosticText(code: string | null | undefined): string {
    if (!code) return '-';
    return diagnosticMap[code] || 'Valor desconocido';
  }
}
