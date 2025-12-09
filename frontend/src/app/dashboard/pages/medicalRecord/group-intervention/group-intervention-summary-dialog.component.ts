import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Patient } from '../../../interfaces/patient.interface';

export interface GroupInterventionFormValueSnapshot {
  date: Date | string | null;
  service: string | null;
  interventionObjective: string | null;
  relevantElements: string | null;
  diagnostic: string | null;
  pharmacologicalScheme: string | null;
}

export interface GroupInterventionSummaryDialogData {
  patients: Patient[];
  formValues: GroupInterventionFormValueSnapshot;
}

@Component({
  selector: 'app-group-intervention-summary-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Intervención registrada</h2>
    <div mat-dialog-content>
      <div class="status-chip">
        <span class="status-icon">&#10003;</span>
        <span>Registro exitoso</span>
      </div>
      <p>La intervención grupal se registró correctamente. Revisa el detalle antes de continuar.</p>

      <section class="dialog-section">
        <h3>Pacientes</h3>
        <ng-container *ngIf="data.patients.length; else noPatients">
          <ul>
            <li *ngFor="let patient of data.patients">
              {{ buildPatientName(patient) }}
            </li>
          </ul>
        </ng-container>
        <ng-template #noPatients>
          <p class="muted">No se asociaron pacientes.</p>
        </ng-template>
      </section>

      <section class="dialog-section">
        <h3>Detalles registrados</h3>
        <dl class="details-grid">
          <div>
            <dt>Fecha</dt>
            <dd>{{ data.formValues.date ? (data.formValues.date | date: 'dd/MM/yyyy') : '-' }}</dd>
          </div>
          <div>
            <dt>Prestación</dt>
            <dd>{{ data.formValues.service || '-' }}</dd>
          </div>
          <div>
            <dt>Objetivo</dt>
            <dd>{{ data.formValues.interventionObjective || '-' }}</dd>
          </div>
          <div>
            <dt>Elementos relevantes</dt>
            <dd>{{ data.formValues.relevantElements || '-' }}</dd>
          </div>
          <div>
            <dt>Diagnóstico</dt>
            <dd>{{ data.formValues.diagnostic || '-' }}</dd>
          </div>
          <div>
            <dt>Esquema farmacológico</dt>
            <dd>{{ data.formValues.pharmacologicalScheme || '-' }}</dd>
          </div>
        </dl>
      </section>
    </div>
    <div mat-dialog-actions>
      <button type="button" (click)="onConfirm()">OK</button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 480px;
      }

      h3 {
        margin: 16px 0 8px;
        font-size: 15px;
      }

      ul {
        margin: 0;
        padding-left: 20px;
      }

      .details-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin: 0;
        padding: 0;
      }

      .details-grid div {
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 8px;
      }

      .details-grid div:last-child {
        border-bottom: none;
      }

      dt {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #7d7d7d;
        margin-bottom: 4px;
      }

      dd {
        margin: 0;
        font-weight: 600;
        color: #212121;
        word-break: break-word;
      }

      .muted {
        color: #777;
        font-style: italic;
      }

      [mat-dialog-actions] {
        margin-top: 8px;
        display: flex;
        justify-content: flex-end;
      }

      button {
        padding: 6px 16px;
        border: none;
        background-color: #1976d2;
        color: #fff;
        border-radius: 4px;
        cursor: pointer;
      }

      button:hover {
        background-color: #115293;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background-color: #e8f5e9;
        color: #256029;
        border-radius: 999px;
        padding: 6px 14px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      .status-icon {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #2e7d32;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }
    `,
  ],
})
export class GroupInterventionSummaryDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<GroupInterventionSummaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupInterventionSummaryDialogData
  ) {}

  buildPatientName(patient: Patient): string {
    return [patient.name, patient.surname, patient.secondSurname].filter(Boolean).join(' ');
  }

  onConfirm(): void {
    this.dialogRef.close();
  }
}
