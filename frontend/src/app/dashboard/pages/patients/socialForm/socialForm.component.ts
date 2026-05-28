import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../auth/auth.service';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { Patient } from '../../../interfaces/patient.interface';
import { SocialSection1Component } from './components/social-section1.component';
import { SocialSection2Component } from './components/social-section2.component';
import { SocialSection3Component } from './components/social-section3.component';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-social-form',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SocialSection1Component,
    SocialSection2Component,
    SocialSection3Component,
  ],
  template: `
    <div class="social-form-page">
      <div class="page-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1 class="page-title">Descripción de Necesidades de Integración Social</h1>
          <span class="page-subtitle" *ngIf="patient">
            {{ patient.name }} {{ patient.surname }} {{ patient.secondSurname }}
          </span>
        </div>
        <div class="header-badge">Integración Social</div>
      </div>

      <div class="actions-bar" *ngIf="!loading()">
        <button mat-stroked-button (click)="goBack()">
          <mat-icon class="mr-1">arrow_back</mat-icon>
          Volver
        </button>
        <div class="actions-right">
          <button mat-raised-button color="primary" (click)="onSave()" [disabled]="saving()">
            <mat-icon class="mr-1">save</mat-icon>
            {{ saving() ? 'Guardando y Sincronizando...' : 'Guardar en FicLin y Sincronizar SISTRAT' }}
          </button>
        </div>
      </div>

      <mat-card class="sections-card" *ngIf="!loading()">
        <mat-tab-group animationDuration="200ms" class="sections-tabs">
          <mat-tab label="Parte 1 — Educación y Formación">
            <div class="tab-content">
              <app-social-section1 [form]="socialForm"></app-social-section1>
            </div>
          </mat-tab>

          <mat-tab label="Parte 2 — Empleo, Vivienda y Salud">
            <div class="tab-content">
              <app-social-section2 [form]="socialForm"></app-social-section2>
            </div>
          </mat-tab>

          <mat-tab label="Parte 3 — Protección y Otros">
            <div class="tab-content">
              <app-social-section3 [form]="socialForm"></app-social-section3>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando información social...</p>
      </div>
    </div>
  `,
  styles: [`
    .social-form-page { max-width: 1100px; margin: 0 auto; padding: 16px; }

    .page-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
      background: linear-gradient(135deg, #fbc02d 0%, #f9a825 100%);
      color: #333; border-radius: 12px; padding: 16px 20px;
    }
    .back-btn { color: #333; }
    .header-info { flex: 1; }
    .page-title { margin: 0; font-size: 1.2rem; font-weight: 700; }
    .page-subtitle { font-size: 0.9rem; font-weight: 500; }
    .header-badge {
      background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1);
      border-radius: 20px; padding: 4px 14px; font-size: 0.8rem; font-weight: 600;
    }

    .sections-card { border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
    .sections-tabs ::ng-deep .mat-mdc-tab-header { background: #fffde7; }
    .tab-content { padding: 24px; min-height: 400px; }

    .loading-container { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 16px; color: #666; }

    .actions-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 16px; border-bottom: 1px solid #e0e0e0; gap: 12px;
      margin-bottom: 20px;
    }
    .actions-right { display: flex; gap: 12px; }
    .sistrat-btn { background: #2e7d32; color: white; }
  `]
})
export default class SocialFormComponent {
  private activatedRoute = inject(ActivatedRoute);
  public authService = inject(AuthService);
  private patientService = inject(PatientService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  syncing = signal(false);
  formSaved = signal(false);

  patient: Patient | null = null;
  private patientId: string = '';

  socialForm: FormGroup = this.fb.group({
    orientacionSociolaboral: [''],
    requiereVais: [''],
    nivelacionEstudios: [''],
    formacion: [''],
    capacitacion: [[]],
    empleo: [[]],
    habitabilidad: [[]],
    judicial: [[]],
    salud: [[]],
    apoyoSocial: [[]],
    proteccionSocial: [[]],
    usoTiempoLibre: [[]],
    observacion1: [''],
    observacion2: [''],
    observacion3: [''],
  });

  ngOnInit(): void {
    this.patientId = this.activatedRoute.snapshot.paramMap.get('id') || '';

    this.patientService.getPatientById(this.patientId).subscribe((response) => {
      this.patient = response.patient;

      this.patientService.getSocialForm(this.patientId).subscribe((form) => {
        if (form) {
          this.formSaved.set(true);
          this.socialForm.patchValue(form);
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      });
    });
  }

  onSave(): void {
    const val = this.socialForm.get('orientacionSociolaboral')?.value;
    if (!val || val.trim() === '') {
      Notiflix.Report.warning(
        'Campo Obligatorio Faltante',
        'El campo "Orientación Sociolaboral" es obligatorio para poder guardar y sincronizar con SISTRAT.',
        'Entendido'
      );
      return;
    }

    this.saving.set(true);
    Notiflix.Loading.circle('Guardando en FicLin...');

    this.patientService.saveSocialForm(this.patientId, this.socialForm.value).subscribe({
      next: () => {
        Notiflix.Loading.remove();
        Notiflix.Notify.success('Guardado en FicLin');
        
        // Iniciar de inmediato la sincronización SISTRAT
        this.syncWithSistrat();
      },
      error: () => {
        Notiflix.Loading.remove();
        this.saving.set(false);
        Notiflix.Notify.failure('Error al guardar el formulario en FicLin');
      }
    });
  }

  private syncWithSistrat(): void {
    this.syncing.set(true);
    Notiflix.Loading.circle('Sincronizando con SISTRAT...');

    this.patientService.syncSocialFormSistrat(this.patientId).subscribe({
      next: () => {
        Notiflix.Loading.remove();
        this.saving.set(false);
        this.syncing.set(false);
        this.formSaved.set(true);
        Notiflix.Report.success(
          '¡Guardado y Sincronizado!',
          'El formulario se ha guardado en FicLin y se ha sincronizado correctamente con SISTRAT.',
          'Entendido'
        );
      },
      error: (error) => {
        Notiflix.Loading.remove();
        this.saving.set(false);
        this.syncing.set(false);
        console.error('Error en sincronización SISTRAT:', error);
        
        const errorMessage = typeof error === 'string' ? error : (error?.error?.message || error?.message || 'Error al ejecutar el bot');
        Notiflix.Report.warning(
          'Sincronización Incompleta',
          `El formulario se guardó en FicLin, pero ocurrió un problema al sincronizar con SISTRAT: ${errorMessage}`,
          'Cerrar'
        );
      }
    });
  }

  goBack(): void {
    window.history.back();
  }
}
