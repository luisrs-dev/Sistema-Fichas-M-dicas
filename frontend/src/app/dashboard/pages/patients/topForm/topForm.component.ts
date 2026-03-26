import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { Patient } from '../../../interfaces/patient.interface';
import { TopSection1Component } from './components/top-section1.component';
import { TopSection2Component } from './components/top-section2.component';
import { TopSection3Component } from './components/top-section3.component';
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

      <!-- Meta del formulario -->
      <mat-card class="meta-card" *ngIf="!loading()">
        <form [formGroup]="metaForm" class="meta-form">
          <mat-form-field appearance="outline">
            <mat-label>Fecha de Entrevista</mat-label>
            <input matInput type="date" formControlName="fechaEntrevista">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Etapa del Tratamiento</mat-label>
            <mat-select formControlName="etapaTratamiento">
              <mat-option value="ingreso">Ingreso</mat-option>
              <mat-option value="egreso">Egreso</mat-option>
              <mat-option value="seguimiento">Seguimiento</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nombre Entrevistador</mat-label>
            <input matInput formControlName="nombreEntrevistador">
          </mat-form-field>
        </form>
      </mat-card>

      <!-- Secciones TOP via Tabs -->
      <mat-card class="sections-card" *ngIf="!loading()">
        <mat-tab-group animationDuration="200ms" class="sections-tabs">
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
        </mat-tab-group>
      </mat-card>

      <!-- Loading spinner -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando formulario TOP...</p>
      </div>

      <!-- Acciones -->
      <div class="actions-bar" *ngIf="!loading()">
        <button mat-stroked-button (click)="goBack()">Volver</button>
        <div class="actions-right">
          <button mat-raised-button color="primary" (click)="onSave()" [disabled]="saving()">
            <mat-icon>save</mat-icon>
            {{ saving() ? 'Guardando...' : 'Guardar en FicLin' }}
          </button>
          <button mat-raised-button class="sistrat-btn" (click)="onSendToSistrat()" *ngIf="topFormSaved()">
            <mat-icon>upload</mat-icon>
            Enviar a SISTRAT
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .top-form-page { max-width: 1100px; margin: 0 auto; padding: 16px; }

    .page-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
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
  `]
})
export default class TopFormComponent {
  private activatedRoute = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  topFormSaved = signal(false);

  patient: Patient | null = null;
  private patientId: string = '';

  @ViewChild('section1') section1!: TopSection1Component;
  @ViewChild('section2') section2!: TopSection2Component;
  @ViewChild('section3') section3!: TopSection3Component;

  metaForm: FormGroup = this.fb.group({
    fechaEntrevista: [new Date().toISOString().split('T')[0]],
    etapaTratamiento: [null],
    nombreEntrevistador: [''],
  });

  ngOnInit(): void {
    this.patientId = this.activatedRoute.snapshot.paramMap.get('id') || '';

    this.patientService.getPatientById(this.patientId).subscribe((response) => {
      this.patient = response.patient;

      // Cargar formulario TOP existente si ya fue guardado
      this.patientService.getTopForm(this.patientId).subscribe((res) => {
        if (res.topForm) {
          this.topFormSaved.set(true);
          this.metaForm.patchValue(res.topForm);
          // Parchar secciones después de que el view esté inicializado
          setTimeout(() => {
            this.section1?.patchData(res.topForm);
            this.section2?.patchData(res.topForm);
            this.section3?.patchData(res.topForm);
          }, 200);
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      });
    });
  }

  onSave(): void {
    this.saving.set(true);

    const data = {
      ...this.metaForm.value,
      ...this.section1?.getFormData(),
      ...this.section2?.getFormData(),
      ...this.section3?.getFormData(),
    };

    this.patientService.saveTopForm(this.patientId, data).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.topFormSaved.set(true);
        Notiflix.Notify.success(res.message || 'Formulario TOP guardado');
      },
      error: () => {
        this.saving.set(false);
        Notiflix.Notify.failure('Error al guardar el formulario TOP');
      }
    });
  }

  onSendToSistrat(): void {
    Notiflix.Confirm.show(
      '¿Enviar a SISTRAT?',
      'Se completará el formulario TOP en SISTRAT con los datos guardados en FicLin. Esta es una automatización de prueba, NO se enviará el formulario definitivamente.',
      'Sí, enviar',
      'Cancelar',
      () => {
        Notiflix.Notify.info('Sincronizando formulario TOP a SISTRAT (Prueba)...');
        this.patientService.syncTopFormSistrat(this.patientId).subscribe({
          next: (res) => {
            // Notiflix.Loading.remove();
            Notiflix.Report.success('¡Sincronización Terminada!', 'El bot ha llenado los campos correctamente para revisión. En esta versión de prueba no se hace click en Enviar.', 'OK');
          },
          error: (err) => {
            Notiflix.Loading.remove();
            Notiflix.Report.failure('Error en Sincronización', err || 'Hubo un error al ejecutar el bot SISTRAT', 'Cerrar');
          }
        });
      }
    );
  }

  goBack(): void {
    window.history.back();
  }
}
