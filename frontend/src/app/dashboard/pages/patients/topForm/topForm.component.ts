import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../auth/auth.service';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { Patient } from '../../../interfaces/patient.interface';
import { TopSection1Component } from './components/top-section1.component';
import { TopSection2Component } from './components/top-section2.component';
import { TopSection3Component } from './components/top-section3.component';
import moment from 'moment';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-top-form',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TopSection1Component,
    TopSection2Component,
    TopSection3Component,
  ],
  template: `
    <div class="top-form-page">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1 class="page-title">Perfil de Resultados de Tratamiento (TOP)</h1>
          <span class="page-subtitle" *ngIf="patient">
            {{ patient.name }} {{ patient.surname }} {{ patient.secondSurname }}
          </span>
        </div>
        <div class="header-badge">TOP En Tratamiento</div>
      </div>

      <!-- Banner de Historial -->
      <div class="history-banner" *ngIf="!loading() && history().length > 0">
        <div class="history-banner-info">
          <mat-icon class="history-banner-icon">history</mat-icon>
          <div>
            <div class="history-banner-title">Historial disponible</div>
            <div class="history-banner-subtitle">
              Este paciente registra <strong>{{ history().length }} evaluación(es) TOP</strong> previa(s). 
              Última evaluación: <strong>{{ history()[0].fechaEntrevista || (history()[0].createdAt | date:'dd/MM/yyyy') }}</strong>
            </div>
          </div>
        </div>
        <button mat-flat-button color="primary" class="view-history-btn" (click)="selectedTabIndex.set(3)">
          <mat-icon>visibility</mat-icon>
          Ver Historial ({{ history().length }})
        </button>
      </div>

      <!-- Banner de Borrador Pendiente -->
      <div class="draft-banner" *ngIf="!loading() && topFormSaved()">
        <div class="draft-banner-info">
          <mat-icon class="draft-banner-icon">edit_note</mat-icon>
          <div>
            <div class="draft-banner-title">Borrador guardado en FicLin</div>
            <div class="draft-banner-subtitle">
              Tienes una evaluación TOP guardada localmente como borrador pendiente. Puedes seguir modificándola o enviarla a SISTRAT cuando lo desees.
            </div>
          </div>
        </div>
      </div>

      <!-- Meta del formulario -->
      <mat-card class="meta-card" *ngIf="!loading()">
        <form [formGroup]="metaForm" class="meta-form">
          <mat-form-field appearance="outline">
            <mat-label>Fecha de Entrevista</mat-label>
            <input matInput [matDatepicker]="pickerFechaEntrevista" formControlName="fechaEntrevista">
            <mat-datepicker-toggle matIconSuffix [for]="pickerFechaEntrevista"></mat-datepicker-toggle>
            <mat-datepicker #pickerFechaEntrevista></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nombre Entrevistador</mat-label>
            <input matInput formControlName="nombreEntrevistador">
          </mat-form-field>
        </form>
      </mat-card>

      <!-- Secciones TOP via Tabs -->
      <mat-card class="sections-card" *ngIf="!loading()">
        <mat-tab-group animationDuration="200ms" class="sections-tabs" [selectedIndex]="selectedTabIndex()" (selectedIndexChange)="selectedTabIndex.set($event)">
          <mat-tab label="Sección 1 — Sustancias">
            <div class="tab-content">
              <app-top-section1 #section1></app-top-section1>
            </div>
          </mat-tab>

          <mat-tab label="Sección 2 — Transgresión">
            <div class="tab-content">
              <app-top-section2 #section2></app-top-section2>
            </div>
          </mat-tab>

          <mat-tab label="Sección 3 — Salud">
            <div class="tab-content">
              <app-top-section3 #section3></app-top-section3>
            </div>
          </mat-tab>

          <mat-tab [label]="'Historial de Evaluaciones (' + history().length + ')'">
            <div class="tab-content history-tab">
              <div *ngIf="loadingHistory()" class="loading-container">
                <mat-spinner diameter="36"></mat-spinner>
                <p>Cargando historial de evaluaciones TOP...</p>
              </div>

              <div *ngIf="!loadingHistory() && history().length === 0" class="empty-history">
                <mat-icon class="empty-icon">history</mat-icon>
                <p>No hay evaluaciones TOP enviadas previamente a SISTRAT para este paciente.</p>
              </div>

              <div *ngIf="!loadingHistory() && history().length > 0">
                <div class="history-intro">
                  <mat-icon class="text-primary mr-2">info</mat-icon>
                  <span>Mostrando <strong>{{ history().length }}</strong> evaluación(es) TOP guardada(s) / enviadas a SISTRAT.</span>
                </div>

                <mat-accordion class="history-accordion" multi="false">
                  <mat-expansion-panel *ngFor="let item of history(); let i = index">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <span class="history-title font-bold">Evaluación TOP #{{ history().length - i }}</span>
                      </mat-panel-title>
                      <mat-panel-description class="flex justify-content-between align-items-center w-full">
                        <span class="history-meta">
                          Entrevista: <strong>{{ item.fechaEntrevista || 'Sin fecha' }}</strong> | 
                          Entrevistador: <strong>{{ item.nombreEntrevistador || 'No registrado' }}</strong>
                        </span>
                        <span class="synced-badge">
                          <mat-icon inline>check_circle</mat-icon> Guardado / SISTRAT
                        </span>
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    <div class="history-details-container">
                      <div class="history-detail-header">
                        <div *ngIf="item.createdAt"><strong>Fecha de Registro:</strong> {{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                        <div *ngIf="item.syncedAt"><strong>Sincronizado con SISTRAT:</strong> {{ item.syncedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                      </div>

                      <!-- Resumen de sustancias -->
                      <div class="detail-block mt-3">
                        <h5>Sección 1 — Sustancias Registradas:</h5>
                        <div class="flex flex-wrap gap-2 mt-1">
                          <span *ngIf="item.alcohol?.total > 0" class="chip">Alcohol: {{ item.alcohol.total }} tragos</span>
                          <span *ngIf="item.marihuana?.total > 0" class="chip">Marihuana: {{ item.marihuana.total }} pitos</span>
                          <span *ngIf="item.pastaBase?.total > 0" class="chip">Pasta Base: {{ item.pastaBase.total }} papelillos</span>
                          <span *ngIf="item.cocaina?.total > 0" class="chip">Cocaína: {{ item.cocaina.total }} gramos</span>
                          <span *ngIf="item.sedantes?.total > 0" class="chip">Sedantes: {{ item.sedantes.total }} comp.</span>
                          <span *ngIf="item.otraSustancia?.nombre" class="chip">{{ item.otraSustancia.nombre }}: {{ item.otraSustancia.total }} {{ item.otraSustancia.unidadMedida || '' }}</span>
                          <span *ngIf="!item.alcohol?.total && !item.marihuana?.total && !item.pastaBase?.total && !item.cocaina?.total && !item.sedantes?.total && !item.otraSustancia?.nombre" class="chip-empty">Sin consumo reportado / Todos ceros</span>
                        </div>
                      </div>

                      <!-- Resumen de transgresiones -->
                      <div class="detail-block mt-3">
                        <h5>Sección 2 — Transgresión a la Norma:</h5>
                        <div class="flex flex-wrap gap-2 mt-1">
                          <span *ngIf="item.hurto?.si" class="chip-alert">Hurto: Sí</span>
                          <span *ngIf="item.robo?.si" class="chip-alert">Robo: Sí</span>
                          <span *ngIf="item.ventaDrogas?.si" class="chip-alert">Venta Drogas: Sí</span>
                          <span *ngIf="item.rina?.si" class="chip-alert">Riña: Sí</span>
                          <span *ngIf="item.violenciaIntrafamiliar?.total > 0" class="chip-alert">Violencia Intrafamiliar: {{ item.violenciaIntrafamiliar.total }} días</span>
                          <span *ngIf="!item.hurto?.si && !item.robo?.si && !item.ventaDrogas?.si && !item.rina?.si && !item.violenciaIntrafamiliar?.total" class="chip-empty">Sin infracciones reportadas</span>
                        </div>
                      </div>

                      <!-- Resumen de Salud -->
                      <div class="detail-block mt-3">
                        <h5>Sección 3 — Salud y Calidad de Vida:</h5>
                        <div class="flex flex-wrap gap-2 mt-1">
                          <span *ngIf="item.saludPsicologica !== null" class="chip">Salud Psicológica: {{ item.saludPsicologica }}/20</span>
                          <span *ngIf="item.saludFisica !== null" class="chip">Salud Física: {{ item.saludFisica }}/20</span>
                          <span *ngIf="item.calidadVida !== null" class="chip">Calidad de Vida: {{ item.calidadVida }}/20</span>
                          <span *ngIf="item.tieneLugarVivir" class="chip">Lugar de Vivir: {{ item.tieneLugarVivir | uppercase }}</span>
                        </div>
                      </div>

                      <!-- Observaciones -->
                      <div class="detail-block mt-3" *ngIf="item.observaciones || item.noDeseaCompletar">
                        <h5>Observaciones / Comentarios:</h5>
                        <p class="text-sm text-gray-700 bg-gray-50 p-2 border-round">{{ item.observaciones || 'Sin observaciones adicionales' }}</p>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </mat-accordion>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- Loading spinner -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando formulario TOP...</p>
      </div>

      <!-- Acciones -->
      <div class="actions-bar" *ngIf="!loading() && selectedTabIndex() < 3">
        <button mat-stroked-button (click)="goBack()">Volver</button>
        <div class="actions-right">
          <!-- <button mat-stroked-button color="primary" (click)="onSave()" [disabled]="saving()">
            <mat-icon>save</mat-icon>
            Guardar Borrador en FicLin
          </button> -->
          <button mat-raised-button class="sistrat-btn" (click)="onSaveAndSync()" [disabled]="saving()">
            <mat-icon>cloud_upload</mat-icon>
            {{ saving() ? 'Procesando...' : 'Guardar y Enviar a SISTRAT' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .top-form-page { max-width: 1100px; margin: 0 auto; padding: 16px; }

    .page-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 16px;
      background: linear-gradient(135deg, #1a3c6e 0%, #2563ab 100%);
      color: white; border-radius: 12px; padding: 16px 20px;
    }
    .back-btn { color: white; }
    .header-info { flex: 1; }
    .page-title { margin: 0; font-size: 1.2rem; font-weight: 700; }
    .page-subtitle { font-size: 0.9rem; opacity: 0.85; }
    .header-badge {
      background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4);
      border-radius: 20px; padding: 4px 14px; font-size: 0.8rem; font-weight: 500;
    }

    .draft-banner {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      background: #fff8e1; border: 1px solid #ffe082; border-radius: 12px;
      padding: 12px 16px; margin-bottom: 16px;
    }
    .draft-banner-info { display: flex; align-items: center; gap: 12px; }
    .draft-banner-icon { color: #f59e0b; font-size: 28px; width: 28px; height: 28px; }
    .draft-banner-title { font-weight: 700; color: #92400e; font-size: 0.95rem; }
    .draft-banner-subtitle { font-size: 0.85rem; color: #78350f; }

    .history-banner {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px;
      padding: 12px 16px; margin-bottom: 16px;
    }
    .history-banner-info { display: flex; align-items: center; gap: 12px; }
    .history-banner-icon { color: #3b82f6; font-size: 28px; width: 28px; height: 28px; }
    .history-banner-title { font-weight: 700; color: #1e3a8a; font-size: 0.95rem; }
    .history-banner-subtitle { font-size: 0.85rem; color: #374151; }

    .meta-card { margin-bottom: 16px; padding: 20px; border-radius: 12px; }
    .meta-form { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-form mat-form-field { flex: 1; min-width: 180px; }

    .sections-card { border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
    .sections-tabs ::ng-deep .mat-mdc-tab-header { background: #f8f9ff; }
    .tab-content { padding: 20px 16px; }

    .loading-container { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 16px; color: #666; }

    .actions-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 0; border-top: 1px solid #e0e0e0; gap: 12px;
    }
    .actions-right { display: flex; gap: 12px; }
    .sistrat-btn { background: #2e7d32; color: white; }

    .history-tab { padding: 16px 8px; }
    .history-intro { display: flex; align-items: center; margin-bottom: 16px; font-size: 0.9rem; color: #555; background: #f0f4f9; padding: 10px 14px; border-radius: 8px; }
    .synced-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: #e8f5e9; color: #2e7d32; font-weight: 600;
      padding: 2px 10px; border-radius: 12px; font-size: 0.75rem;
    }
    .history-accordion { margin-top: 12px; }
    .history-details-container { padding: 12px 0; }
    .history-detail-header { display: flex; gap: 24px; font-size: 0.85rem; color: #555; flex-wrap: wrap; }
    .detail-block h5 { margin: 12px 0 4px; font-size: 0.85rem; color: #1a3c6e; font-weight: 600; }
    .chip { background: #eef2ff; color: #1e40af; padding: 4px 12px; border-radius: 16px; font-size: 0.8rem; font-weight: 500; }
    .chip-alert { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; padding: 4px 12px; border-radius: 16px; font-size: 0.8rem; font-weight: 600; }
    .chip-empty { background: #f3f4f6; color: #6b7280; padding: 4px 12px; border-radius: 16px; font-size: 0.8rem; }
    .empty-history { text-align: center; padding: 48px 16px; color: #777; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; color: #ccc; margin-bottom: 8px; }
  `]
})
export default class TopFormComponent {
  private activatedRoute = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  topFormSaved = signal(false);
  selectedTabIndex = signal(0);

  history = signal<any[]>([]);
  loadingHistory = signal(false);

  patient: Patient | null = null;
  private patientId: string = '';

  @ViewChild('section1') section1!: TopSection1Component;
  @ViewChild('section2') section2!: TopSection2Component;
  @ViewChild('section3') section3!: TopSection3Component;

  metaForm: FormGroup = this.fb.group({
    fechaEntrevista: [new Date()],
    nombreEntrevistador: [{ value: '' }],
  });

  get isFormInvalid(): boolean {
    return this.metaForm.invalid || 
           (this.section1?.form.invalid ?? false) || 
           (this.section2?.form.invalid ?? false) || 
           (this.section3?.form.invalid ?? false);
  }

  ngOnInit(): void {
    this.patientId = this.activatedRoute.snapshot.paramMap.get('id') || '';

    this.patientService.getPatientById(this.patientId).subscribe((response) => {
      this.patient = response.patient;

      // Cargar historial de TOP enviados previamente
      this.loadHistory();

      // Cargar borrador TOP activo si existe
      this.patientService.getTopForm(this.patientId).subscribe((res) => {
        if (res.topForm) {
          this.topFormSaved.set(true);
          const dataToPatch = { ...res.topForm };
          if (dataToPatch.fechaEntrevista) {
            dataToPatch.fechaEntrevista = this.formatDateStringToDate(dataToPatch.fechaEntrevista);
          }
          this.metaForm.patchValue(dataToPatch);
          // Parchar secciones después de que el view esté inicializado
          setTimeout(() => {
            this.section1?.patchData(res.topForm);
            this.section2?.patchData(res.topForm);
            this.section3?.patchData(res.topForm);
          }, 200);
        } else {
          // Si no hay borrador previo, pre-cargar nombre del entrevistador logueado
          const user = this.authService.getUser();
          if (user) {
            this.metaForm.patchValue({ nombreEntrevistador: user.name });
          }
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      });
    });
  }

  loadHistory(): void {
    this.loadingHistory.set(true);
    this.patientService.getTopFormHistory(this.patientId).subscribe({
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

  resetForm(): void {
    const user = this.authService.getUser();
    this.metaForm.reset({
      fechaEntrevista: new Date(),
      nombreEntrevistador: user ? user.name : '',
    });

    if (this.section1?.form) this.section1.form.reset();
    if (this.section2?.form) this.section2.form.reset();
    if (this.section3?.form) this.section3.form.reset();
    this.topFormSaved.set(false);
  }

  private formatDateStringToDate(dateString: string): Date | string {
    if (!dateString) return '';
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateString);
  }

  private getValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.metaForm.get('nombreEntrevistador')?.value) {
      errors.push('Nombre del Entrevistador');
    }
    if (!this.metaForm.get('fechaEntrevista')?.value) {
      errors.push('Fecha de Entrevista');
    }

    const noDeseaCompletar = this.section3?.form.get('noDeseaCompletar')?.value;

    if (noDeseaCompletar) {
      const emptyS3 = this.section3?.validate() || [];
      errors.push(...emptyS3);
    } else {
      const emptyS1 = this.section1?.validate() || [];
      const emptyS2 = this.section2?.validate() || [];
      const emptyS3 = this.section3?.validate() || [];
      errors.push(...emptyS1, ...emptyS2, ...emptyS3);
    }

    if (this.metaForm.invalid) errors.push('Formulario principal: Revise errores');
    if (!noDeseaCompletar) {
      if (this.section1?.form.invalid) errors.push('Sección 1: Revise errores en los campos');
      if (this.section2?.form.invalid) errors.push('Sección 2: Revise errores en los campos');
    }
    if (this.section3?.form.invalid) {
      if (this.section3.form.get('observaciones')?.hasError('maxlength')) {
        errors.push('Observaciones (excede el límite de 150 caracteres)');
      } else {
        errors.push('Sección 3: Revise errores en los campos');
      }
    }

    return errors;
  }

  onSave(): void {
    const noDeseaCompletar = this.section3?.form.get('noDeseaCompletar')?.value;
    const observaciones = this.section3?.form.get('observaciones')?.value;
    if (noDeseaCompletar && (!observaciones || observaciones.trim() === '')) {
      Notiflix.Notify.failure('Debe ingresar una observación si marca "No desea completar formulario"');
      return;
    }

    const errors = this.getValidationErrors();
    if (errors.length > 0) {
      const list = errors.map(f => `<li>${f}</li>`).join('');
      Notiflix.Report.warning(
        'Campos Obligatorios Pendientes',
        `Para llevar un registro exitoso, complete los siguientes campos obligatorios antes de guardar:<br/><br/><ul style="text-align: left; max-height: 200px; overflow-y: auto;">${list}</ul>`,
        'Entendido'
      );
      return;
    }

    this.saving.set(true);
    const data = this.buildFormData();

    this.patientService.saveTopForm(this.patientId, data).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.topFormSaved.set(true);
        Notiflix.Notify.success(res.message || 'Borrador de formulario TOP guardado');
      },
      error: () => {
        this.saving.set(false);
        Notiflix.Notify.failure('Error al guardar el borrador del formulario TOP');
      }
    });
  }

  onSaveAndSync(): void {
    if (this.saving()) return;

    const noDeseaCompletar = this.section3?.form.get('noDeseaCompletar')?.value;
    const observaciones = this.section3?.form.get('observaciones')?.value;
    if (noDeseaCompletar && (!observaciones || observaciones.trim() === '')) {
      Notiflix.Notify.failure('Debe ingresar una observación si marca "No desea completar formulario"');
      return;
    }

    const errors = this.getValidationErrors();
    if (errors.length > 0) {
      const list = errors.map(f => `<li>${f}</li>`).join('');
      Notiflix.Report.warning(
        'Campos Obligatorios Pendientes',
        `Complete los siguientes campos antes de guardar y sincronizar:<br/><br/><ul style="text-align: left; max-height: 200px; overflow-y: auto;">${list}</ul>`,
        'Entendido'
      );
      return;
    }

    Notiflix.Confirm.show(
      '¿Guardar y Enviar a SISTRAT?',
      'Se guardará la evaluación TOP en FicLin, se enviará a SISTRAT y quedará archivada en el historial de este paciente.',
      'Sí, guardar y enviar',
      'Cancelar',
      () => {
        this.saving.set(true);
        Notiflix.Loading.circle('Guardando y sincronizando con SISTRAT...');

        const data = this.buildFormData();

        this.patientService.saveAndSyncTopForm(this.patientId, data).subscribe({
          next: () => {
            Notiflix.Loading.remove();
            this.saving.set(false);

            Notiflix.Report.success(
              '¡Guardado y Sincronizado!',
              'El formulario TOP se ha guardado en FicLin, se ha enviado a SISTRAT y se ha registrado en el Historial del paciente. El formulario ahora está limpio para futuras evaluaciones.',
              'Entendido'
            );

            // Actualizar historial de evaluaciones
            this.loadHistory();
            // Limpiar el formulario para nuevo registro
            this.resetForm();
          },
          error: (error) => {
            Notiflix.Loading.remove();
            this.saving.set(false);
            console.error('Error en guardado y sincronización SISTRAT:', error);

            let errorMessage = 'Error al ejecutar el bot';
            if (error && (error.status === 0 || error.status === 504 || error.status === 502)) {
              errorMessage = 'La sincronización sigue procesándose en el servidor (SISTRAT es lento), pero el navegador cerró la conexión por límite de tiempo. El formulario ya fue guardado en FicLin. Verifique en SISTRAT en unos minutos.';
            } else {
              errorMessage = typeof error === 'string' ? error : (error?.error?.message || error?.message || errorMessage);
            }

            Notiflix.Report.warning(
              'Sincronización Incompleta',
              `El formulario se guardó en FicLin, pero ocurrió un problema al sincronizar con SISTRAT: ${errorMessage}`,
              'Cerrar'
            );
          }
        });
      }
    );
  }

  private buildFormData(): any {
    const metaValues = { ...this.metaForm.getRawValue() };
    if (metaValues.fechaEntrevista instanceof Date) {
      metaValues.fechaEntrevista = moment(metaValues.fechaEntrevista).format('DD/MM/YYYY');
    }
    return {
      ...metaValues,
      ...this.section1?.getFormData(),
      ...this.section2?.getFormData(),
      ...this.section3?.getFormData(),
    };
  }

  goBack(): void {
    window.history.back();
  }
}
