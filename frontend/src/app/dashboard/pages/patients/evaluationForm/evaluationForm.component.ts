import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <div class="container animate__animated animate__fadeIn">
      <div class="header">
        <h1>Ficha de Evaluación</h1>
        <p>Complete los campos para el seguimiento del paciente y sincronización con SISTRAT.</p>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="form" class="evaluation-form">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Patrón de Consumo</mat-label>
                <mat-select formControlName="patronConsumo">
                  <mat-option value="">Seleccione</mat-option>
                  <mat-option value="1">Con Avances</mat-option>
                  <mat-option value="2">Sin Avances</mat-option>
                  <mat-option value="3">Con Retroceso</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Situación Familiar</mat-label>
                <mat-select formControlName="situacionFamiliar">
                  <mat-option value="">Seleccione</mat-option>
                  <mat-option value="1">Con Avances</mat-option>
                  <mat-option value="2">Sin Avances</mat-option>
                  <mat-option value="3">Con Retroceso</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Relaciones Interpersonales</mat-label>
                <mat-select formControlName="relacionesInterpersonales">
                  <mat-option value="">Seleccione</mat-option>
                  <mat-option value="1">Con Avances</mat-option>
                  <mat-option value="2">Sin Avances</mat-option>
                  <mat-option value="3">Con Retroceso</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Situación Ocupacional</mat-label>
                <mat-select formControlName="situacionOcupacional">
                  <mat-option value="">Seleccione</mat-option>
                  <mat-option value="1">Con Avances</mat-option>
                  <mat-option value="2">Sin Avances</mat-option>
                  <mat-option value="3">Con Retroceso</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Trasgresión de la Norma Social</mat-label>
                <mat-select formControlName="trasgresionSocial">
                  <mat-option value="">Seleccione</mat-option>
                  <mat-option value="1">Con Avances</mat-option>
                  <mat-option value="2">Sin Avances</mat-option>
                  <mat-option value="3">Con Retroceso</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado de Salud Mental</mat-label>
                <mat-select formControlName="saludMental">
                  <mat-option value="">Seleccione</mat-option>
                  <mat-option value="1">Con Avances</mat-option>
                  <mat-option value="2">Sin Avances</mat-option>
                  <mat-option value="3">Con Retroceso</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado de Salud Física</mat-label>
                <mat-select formControlName="saludFisica">
                  <mat-option value="">Seleccione</mat-option>
                  <mat-option value="1">Con Avances</mat-option>
                  <mat-option value="2">Sin Avances</mat-option>
                  <mat-option value="3">Con Retroceso</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </form>
        </mat-card-content>
        <mat-card-actions align="end" class="actions-group">
          <button mat-stroked-button color="warn" (click)="goBack()">Cancelar</button>
          <button mat-flat-button color="primary" [disabled]="loading" (click)="save()">
            <mat-icon>save</mat-icon> Guardar en FicLin
          </button>
          <button *ngIf="isSaved" mat-flat-button class="sync-button" [disabled]="syncing" (click)="syncSistrat()">
            <mat-icon>{{ syncing ? 'sync' : 'cloud_upload' }}</mat-icon>
            {{ syncing ? 'Sincronizando...' : 'Enviar a SISTRAT' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 32px; max-width: 900px; margin: 0 auto; }
    .header { margin-bottom: 24px; }
    .header h1 { color: #1a3c6e; font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; }
    .header p { color: #666; font-size: 1.1rem; }
    .form-card { border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px 0; }
    .actions-group { padding: 24px; gap: 12px; border-top: 1px solid #eee; }
    .sync-button { background-color: #2e7d32 !important; color: white !important; }
    .sync-button mat-icon { margin-right: 4px; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export default class EvaluationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  patientId!: string;
  form: FormGroup;
  loading = false;
  syncing = false;
  isSaved = false;

  constructor() {
    this.form = this.fb.group({
      patronConsumo: ['', Validators.required],
      situacionFamiliar: ['', Validators.required],
      relacionesInterpersonales: ['', Validators.required],
      situacionOcupacional: ['', Validators.required],
      trasgresionSocial: ['', Validators.required],
      saludMental: ['', Validators.required],
      saludFisica: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.patientId = this.route.snapshot.params['id'];
    this.loadData();
  }

  loadData() {
    this.patientService.getEvaluationForm(this.patientId).subscribe(data => {
      if (data) {
        this.form.patchValue(data);
        this.isSaved = true;
      }
    });
  }

  save() {
    if (this.form.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.patientService.saveEvaluationForm(this.patientId, this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.isSaved = true;
        this.snackBar.open('Ficha guardada correctamente en FicLin', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al guardar la ficha', 'Cerrar', { duration: 3000 });
      }
    });
  }

  syncSistrat() {
    this.syncing = true;
    this.patientService.syncEvaluationFormSistrat(this.patientId).subscribe({
      next: () => {
        this.syncing = false;
        this.snackBar.open('Sincronización con SISTRAT iniciada', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.syncing = false;
        this.snackBar.open('Error al sincronizar con SISTRAT', 'Cerrar', { duration: 3000 });
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/patients']);
  }
}
