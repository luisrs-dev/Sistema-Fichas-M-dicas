import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, finalize } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../auth/auth.service';
import { Patient } from '../../../interfaces/patient.interface';
import Notiflix from 'notiflix';

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
          <h1 class="page-title">Ficha de Evaluación Informativa (Alerta Verde)</h1>
          <span class="page-subtitle" *ngIf="patient">
            {{ patient.name }} {{ patient.surname }} {{ patient.secondSurname }}
          </span>
        </div>
        <div class="header-badge">Sincronización SISTRAT</div>
      </div>

      <!-- Banner de Historial Disponible -->
      <div class="history-banner" *ngIf="!loading && history().length > 0">
        <div class="history-banner-info">
          <mat-icon class="history-banner-icon">history</mat-icon>
          <div>
            <div class="history-banner-title">Historial de Evaluaciones Verdes</div>
            <div class="history-banner-subtitle">
              Este paciente registra <strong>{{ history().length }} evaluación(es)</strong> previa(s). 
              Última evaluación: <strong>{{ (history()[0].syncedAt || history()[0].createdAt) | date:'dd/MM/yyyy HH:mm' }}</strong>
            </div>
          </div>
        </div>
        <button mat-flat-button color="primary" class="view-history-btn" (click)="selectedTabIndex.set(1)">
          <mat-icon>visibility</mat-icon>
          Ver Historial ({{ history().length }})
        </button>
      </div>

      <!-- Formulario y Tabs -->
      <mat-card class="form-card" *ngIf="!loading">
        <mat-tab-group animationDuration="200ms" [selectedIndex]="selectedTabIndex()" (selectedIndexChange)="selectedTabIndex.set($event)">
          <!-- Tab 1: Formulario Activo -->
          <mat-tab label="Nueva Evaluación">
            <mat-card-content class="pt-3">
              <!-- Banner de Borrador local -->
              <div class="draft-banner" *ngIf="isSaved">
                <mat-icon class="draft-banner-icon">edit_note</mat-icon>
                <div>
                  <strong>Borrador local guardado:</strong> Tienes datos ingresados en borrador. Puedes modificarlos o enviarlos directamente a SISTRAT.
                </div>
              </div>

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
              <button mat-stroked-button color="warn" (click)="goBack()">Volver</button>
              <button mat-stroked-button color="primary" [disabled]="loading" (click)="saveDraft()">
                <mat-icon>save</mat-icon> {{ loading ? 'Guardando...' : 'Guardar Borrador en FicLin' }}
              </button>

              <button *ngIf="authService.canSyncEvaluation()" mat-flat-button class="sync-button" [disabled]="syncing" (click)="saveAndSync()">
                <mat-icon>{{ syncing ? 'sync' : 'cloud_upload' }}</mat-icon>
                {{ syncing ? 'Guardando y Sincronizando...' : 'Guardar y Enviar a SISTRAT' }}
              </button>
            </mat-card-actions>
          </mat-tab>

          <!-- Tab 2: Historial -->
          <mat-tab [label]="'Historial (' + history().length + ')'">
            <div class="tab-content history-tab p-4">
              <div *ngIf="loadingHistory()" class="loading-container">
                <mat-spinner diameter="36"></mat-spinner>
                <p>Cargando historial de evaluaciones...</p>
              </div>

              <div *ngIf="!loadingHistory() && history().length === 0" class="empty-history text-center py-5">
                <mat-icon class="empty-icon">history</mat-icon>
                <p class="text-gray-600">No hay evaluaciones registradas previamente para este paciente.</p>
              </div>

              <div *ngIf="!loadingHistory() && history().length > 0">
                <div class="history-intro mb-3 p-2 bg-green-50 border-round flex align-items-center">
                  <mat-icon class="text-green-700 mr-2">check_circle</mat-icon>
                  <span class="text-green-900 font-medium">Mostrando {{ history().length }} evaluación(es) informativa(s) registrada(s) en SISTRAT.</span>
                </div>

                <mat-accordion class="history-accordion" multi="false">
                  <mat-expansion-panel *ngFor="let item of history(); let i = index">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <span class="history-title font-bold">Evaluación Verde #{{ history().length - i }}</span>
                      </mat-panel-title>
                      <mat-panel-description class="flex justify-content-between align-items-center w-full">
                        <span class="history-meta">
                          Registro: <strong>{{ (item.syncedAt || item.createdAt) | date:'dd/MM/yyyy HH:mm' }}</strong>
                        </span>
                        <span class="synced-badge">
                          <mat-icon inline>check_circle</mat-icon> Enviado a SISTRAT
                        </span>
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    <div class="history-details-grid p-3">
                      <div class="detail-item">
                        <span class="detail-label">Patrón de Consumo:</span>
                        <span class="detail-value" [ngClass]="getBadgeClass(item.patronConsumo)">{{ getOptionText(item.patronConsumo) }}</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">Situación Familiar:</span>
                        <span class="detail-value" [ngClass]="getBadgeClass(item.situacionFamiliar)">{{ getOptionText(item.situacionFamiliar) }}</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">Relaciones Interpersonales:</span>
                        <span class="detail-value" [ngClass]="getBadgeClass(item.relacionesInterpersonales)">{{ getOptionText(item.relacionesInterpersonales) }}</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">Situación Ocupacional:</span>
                        <span class="detail-value" [ngClass]="getBadgeClass(item.situacionOcupacional)">{{ getOptionText(item.situacionOcupacional) }}</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">Trasgresión de la Norma:</span>
                        <span class="detail-value" [ngClass]="getBadgeClass(item.trasgresionSocial)">{{ getOptionText(item.trasgresionSocial) }}</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">Estado Salud Mental:</span>
                        <span class="detail-value" [ngClass]="getBadgeClass(item.saludMental)">{{ getOptionText(item.saludMental) }}</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">Estado Salud Física:</span>
                        <span class="detail-value" [ngClass]="getBadgeClass(item.saludFisica)">{{ getOptionText(item.saludFisica) }}</span>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </mat-accordion>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <div class="loading-container text-center py-10" *ngIf="loading">
        <mat-spinner diameter="40" class="mx-auto"></mat-spinner>
        <p class="mt-4">Procesando información...</p>
      </div>
    </div>
  `,
  styles: [`
    .evaluation-form-page { max-width: 950px; margin: 0 auto; padding: 16px; }
    .page-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 16px;
      background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
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

    .history-banner {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;
      padding: 12px 16px; margin-bottom: 16px;
    }
    .history-banner-info { display: flex; align-items: center; gap: 12px; }
    .history-banner-icon { color: #16a34a; font-size: 28px; width: 28px; height: 28px; }
    .history-banner-title { font-weight: 700; color: #14532d; font-size: 0.95rem; }
    .history-banner-subtitle { font-size: 0.85rem; color: #166534; }

    .draft-banner {
      display: flex; align-items: center; gap: 12px; background: #fff8e1;
      border: 1px solid #ffe082; border-radius: 8px; padding: 10px 14px;
      margin: 16px; color: #78350f; font-size: 0.85rem;
    }
    .draft-banner-icon { color: #f59e0b; }

    .form-card { border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .actions-group { padding: 24px; gap: 12px; border-top: 1px solid #eee; background: #fafafa; }
    .sync-button { background-color: #2e7d32 !important; color: white !important; }
    .sync-button mat-icon { margin-right: 4px; }

    .synced-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: #e8f5e9; color: #2e7d32; font-weight: 600;
      padding: 2px 10px; border-radius: 12px; font-size: 0.75rem;
    }
    .history-details-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px; background: #f9fafb; border-radius: 8px;
    }
    .detail-item { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
    .detail-label { font-weight: 600; color: #4b5563; }
    .badge-avances { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-weight: 600; width: fit-content; }
    .badge-sin-avances { background: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 4px; font-weight: 600; width: fit-content; }
    .badge-retroceso { background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 4px; font-weight: 600; width: fit-content; }

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
  selectedTabIndex = signal(0);

  history = signal<any[]>([]);
  loadingHistory = signal(false);

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
      if (this.patientId) {
        this.loadData();
      } else {
        this.loading = false;
        this.snackBar.open('ID de paciente no encontrado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  loadData() {
    this.loading = true;
    this.cdr.detectChanges();

    this.loadHistory();

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
        if (patientRes) {
          this.patient = patientRes.patient;
        }

        if (evaluationData) {
          this.form.patchValue(evaluationData);
          this.isSaved = true;
        } else {
          this.form.reset({
            patronConsumo: '',
            situacionFamiliar: '',
            relacionesInterpersonales: '',
            situacionOcupacional: '',
            trasgresionSocial: '',
            saludMental: '',
            saludFisica: ''
          });
          this.isSaved = false;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[loadData][forkJoin-error]', err);
        this.loading = false;
        this.snackBar.open('Error crítico al cargar el formulario', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  loadHistory() {
    this.loadingHistory.set(true);
    this.patientService.getEvaluationFormHistory(this.patientId).subscribe({
      next: (res) => {
        this.history.set(res.history || []);
        this.loadingHistory.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingHistory.set(false);
      }
    });
  }

  saveDraft() {
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
          this.isSaved = true;
          Notiflix.Notify.success('Borrador de evaluación guardado correctamente en FicLin');
        },
        error: (err) => {
          console.error('[saveDraft] Error al guardar', err);
          this.snackBar.open('Error al guardar el borrador: ' + (err || 'Error desconocido'), 'Cerrar', { duration: 3000 });
        }
      });
  }

  saveAndSync() {
    if (this.form.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos antes de enviar a SISTRAT', 'Cerrar', { duration: 3000 });
      return;
    }

    Notiflix.Confirm.show(
      '¿Guardar y Enviar a SISTRAT?',
      'Se guardará la evaluación informativa en FicLin, se enviará a SISTRAT y quedará archivada en el historial del paciente.',
      'Sí, guardar y enviar',
      'Cancelar',
      () => {
        this.syncing = true;
        this.cdr.detectChanges();
        Notiflix.Loading.circle('Guardando y sincronizando evaluación con SISTRAT...');

        this.patientService.saveAndSyncEvaluationForm(this.patientId, this.form.value)
          .pipe(
            finalize(() => {
              this.syncing = false;
              Notiflix.Loading.remove();
              this.cdr.detectChanges();
            })
          )
          .subscribe({
            next: () => {
              Notiflix.Report.success(
                '¡Evaluación Sincronizada!',
                'La Ficha de Evaluación (Verde) se ha guardado en FicLin, se ha enviado a SISTRAT y se ha registrado en el Historial.',
                'Entendido'
              );

              // Cargar historial actualizado y resetear formulario para nueva evaluación
              this.loadHistory();
              this.form.reset({
                patronConsumo: '',
                situacionFamiliar: '',
                relacionesInterpersonales: '',
                situacionOcupacional: '',
                trasgresionSocial: '',
                saludMental: '',
                saludFisica: ''
              });
              this.isSaved = false;
            },
            error: (err) => {
              console.error('[saveAndSync][error]', err);
              Notiflix.Report.warning(
                'Sincronización Incompleta',
                `Ocurrió un problema al sincronizar con SISTRAT: ${err || 'Error desconocido'}`,
                'Cerrar'
              );
            }
          });
      }
    );
  }

  getOptionText(val: string): string {
    const map: Record<string, string> = {
      '1': 'Con Avances',
      '2': 'Sin Avances',
      '3': 'Con Retroceso',
    };
    return map[val] || val || 'No evaluado';
  }

  getBadgeClass(val: string): string {
    if (val === '1') return 'badge-avances';
    if (val === '2') return 'badge-sin-avances';
    if (val === '3') return 'badge-retroceso';
    return '';
  }

  goBack() {
    this.router.navigate(['/dashboard/patients']);
  }
}
