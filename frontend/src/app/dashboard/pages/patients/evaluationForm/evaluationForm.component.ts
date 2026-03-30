import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, finalize } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../auth/auth.service';
import { Patient } from '../../../interfaces/patient.interface';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <div class="evaluation-form-page animate__animated animate__fadeIn">
      <div class="page-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1 class="page-title">Ficha de Evaluación Informativa</h1>
          <span class="page-subtitle" *ngIf="patient">
            {{ patient.name }} {{ patient.surname }} {{ patient.secondSurname }}
          </span>
        </div>
        <div class="header-badge">Sincronización SISTRAT</div>
      </div>

      <mat-card class="form-card" *ngIf="!loading">
        <mat-card-content>
          <form [formGroup]="form" class="evaluation-form p-4">
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
            <mat-icon>save</mat-icon> {{ loading ? 'Guardando...' : 'Guardar en FicLin' }}
          </button>
          <button *ngIf="isSaved && authService.isAdmin()" mat-flat-button class="sync-button" [disabled]="syncing" (click)="syncSistrat()">
            <mat-icon>{{ syncing ? 'sync' : 'cloud_upload' }}</mat-icon>
            {{ syncing ? 'Sincronizando...' : 'Enviar a SISTRAT' }}
          </button>
        </mat-card-actions>
      </mat-card>

      <div class="loading-container text-center py-10" *ngIf="loading">
        <mat-spinner diameter="40" class="mx-auto"></mat-spinner>
        <p class="mt-4">Procesando información...</p>
      </div>
    </div>
  `,
  styles: [`
    .evaluation-form-page { max-width: 900px; margin: 0 auto; padding: 16px; }
    .page-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      color: white; border-radius: 12px; padding: 16px 20px;
    }
    .back-btn { color: white; }
    .header-info { flex: 1; }
    .page-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: white; }
    .page-subtitle { font-size: 0.9rem; font-weight: 500; opacity: 0.9; }
    .header-badge {
      background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
      border-radius: 20px; padding: 4px 14px; font-size: 0.8rem; font-weight: 600;
    }
    .form-card { border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .actions-group { padding: 24px; gap: 12px; border-top: 1px solid #eee; background: #fafafa; }
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
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  patientId!: string;
  patient: Patient | null = null;
  form: FormGroup;
  loading = true;
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
    this.route.paramMap.subscribe(params => {
      this.patientId = params.get('id') || '';
      console.log('[ngOnInit][patientId]', this.patientId);
      if (this.patientId) {
        this.loadData();
      } else {
        this.loading = false;
        this.snackBar.open('ID de paciente no encontrado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  loadData() {
    console.log('[loadData][patientId]', this.patientId);
    this.loading = true;
    this.cdr.detectChanges();
    
    forkJoin({
      patientRes: this.patientService.getPatientById(this.patientId).pipe(
        catchError(err => {
          console.error('[loadData][patientRes-error]', err);
          return of(null);
        })
      ),
      evaluationData: this.patientService.getEvaluationForm(this.patientId).pipe(
        catchError(err => {
          console.error('[loadData][evaluationData-error]', err);
          return of(null);
        })
      )
    }).subscribe({
      next: ({ patientRes, evaluationData }) => {
        console.log('[loadData][success-combined]', { patientRes, evaluationData });
        
        if (patientRes) {
          this.patient = patientRes.patient;
        } else {
          this.snackBar.open('No se pudo cargar la información del paciente', 'Cerrar', { duration: 5000 });
        }
        
        if (evaluationData) {
          console.log('[loadData][patchingForm]', evaluationData);
          this.form.patchValue(evaluationData);
          this.isSaved = true;
        } else {
          console.log('[loadData][no-eval-data]');
        }
        
        this.loading = false;
        console.log('[loadData][loading-set-false]');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[loadData][forkJoin-critical-error]', err);
        this.loading = false;
        this.snackBar.open('Error crítico al cargar el formulario', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  save() {
    if (this.form.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.patientService.saveEvaluationForm(this.patientId, this.form.value)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          console.log('[save] Guardado exitoso');
          this.isSaved = true;
          this.snackBar.open('Ficha guardada correctamente en FicLin', 'OK', { duration: 3000 });
        },
        error: (err) => {
          console.error('[save] Error al guardar', err);
          this.snackBar.open('Error al guardar la ficha: ' + (err || 'Error desconocido'), 'Cerrar', { duration: 3000 });
        }
      });
  }

  syncSistrat() {
    this.syncing = true;
    this.cdr.detectChanges();
    this.snackBar.open('Sincronización con SISTRAT iniciada...', 'Cerrar', { duration: 2000 });

    this.patientService.syncEvaluationFormSistrat(this.patientId)
      .pipe(
        finalize(() => {
          this.syncing = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Sincronización completada con éxito', 'OK', { duration: 4000 });
        },
        error: (err) => {
          console.error('[sync] Error al sincronizar', err);
          this.snackBar.open('Error al sincronizar con SISTRAT', 'Cerrar', { duration: 5000 });
        }
      });
  }

  goBack() {
    this.router.navigate(['/dashboard/patients']);
  }
}
