import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { VoiceService } from '../../../../../shared/services/voice.service';
import { PatientService } from '../../patient.service';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-top-section3',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <div class="section-container">
      <div class="section-header">
        <h3>Sección 3: Salud y Funcionamiento Social</h3>
        <div class="voice-bar">
          <button mat-raised-button [color]="isListening() ? 'warn' : 'primary'" (click)="toggleVoice()" type="button">
            <mat-icon>{{ isListening() ? 'stop' : 'mic' }}</mat-icon>
            {{ isListening() ? 'Escuchando...' : 'Dictar Sección 3' }}
          </button>
          <span class="voice-hint" *ngIf="lastTranscript()">
            <mat-icon>record_voice_over</mat-icon> "{{ lastTranscript() }}"
          </span>
        </div>
      </div>

      <form [formGroup]="form">
        <!-- a. Salud psicológica -->
        <div class="scale-section">
          <p><strong>a.</strong> Calificar el estado de salud psicológica (ansiedad, depresión y/o problemas emocionales)</p>
          <div class="scale-row">
            <div class="scale-radios-container">
              <div class="scale-labels"><span>Mala</span><span>Buena</span></div>
              <div class="scale-radios">
                <label *ngFor="let v of scale20" class="scale-opt">
                  <input type="radio" formControlName="saludPsicologica" [value]="v">
                  <span>{{ v }}</span>
                </label>
              </div>
            </div>
            <div class="scale-inputs">
              <input type="number" formControlName="saludPsicologica" min="0" max="20" class="num-input-lg" placeholder="0-20">
              <mat-checkbox [checked]="form.get('saludPsicologica')?.value === null || form.get('saludPsicologica')?.value === ''" (change)="clearScale('saludPsicologica')">N/R</mat-checkbox>
            </div>
          </div>
        </div>

        <!-- b/c. Días trabajados y educación -->
        <div class="table-responsive">
          <h4 class="sub-title">b/c. Días trabajados / asistidos a educación</h4>
          <table class="top-table">
            <thead>
              <tr>
                <th>Ítem</th>
                <th>Todos Ceros</th>
                <th>Últ. Semana</th>
                <th>Semana 3</th>
                <th>Semana 2</th>
                <th>Semana 1</th>
                <th>Total</th>
                <th>N/R</th>
              </tr>
            </thead>
            <tbody>
              <tr formGroupName="diasTrabajados">
                <td class="item-label">b. Días trabajados remunerado</td>
                <td><mat-checkbox formControlName="todosLosCeros" (change)="onTodosCerosChange('diasTrabajados', $any($event).checked)"></mat-checkbox></td>
                <td><input type="number" formControlName="ultimaSemana" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana3" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana2" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana1" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="total" min="0" max="28" class="num-input"></td>
                <td><mat-checkbox formControlName="noResponde" (change)="onNoRespondeChange('diasTrabajados', $any($event).checked)"></mat-checkbox></td>
              </tr>
              <tr formGroupName="diasEducacion">
                <td class="item-label">c. Días asistidos a Colegio / Universidad</td>
                <td><mat-checkbox formControlName="todosLosCeros" (change)="onTodosCerosChange('diasEducacion', $any($event).checked)"></mat-checkbox></td>
                <td><input type="number" formControlName="ultimaSemana" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana3" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana2" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana1" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="total" min="0" max="28" class="num-input"></td>
                <td><mat-checkbox formControlName="noResponde" (change)="onNoRespondeChange('diasEducacion', $any($event).checked)"></mat-checkbox></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- d. Salud física -->
        <div class="scale-section">
          <p><strong>d.</strong> Calificación del estado de salud física (grado de síntomas físicos o molestias por enfermedad)</p>
          <div class="scale-row">
            <div class="scale-radios-container">
              <div class="scale-labels"><span>Mala</span><span>Buena</span></div>
              <div class="scale-radios">
                <label *ngFor="let v of scale20" class="scale-opt">
                  <input type="radio" formControlName="saludFisica" [value]="v">
                  <span>{{ v }}</span>
                </label>
              </div>
            </div>
            <div class="scale-inputs">
              <input type="number" formControlName="saludFisica" min="0" max="20" class="num-input-lg" placeholder="0-20">
              <mat-checkbox [checked]="form.get('saludFisica')?.value === null || form.get('saludFisica')?.value === ''" (change)="clearScale('saludFisica')">N/R</mat-checkbox>
            </div>
          </div>
        </div>

        <!-- Vivienda -->
        <div class="radio-row">
          <label><strong>a.</strong> ¿Tiene un lugar para vivir?</label>
          <mat-radio-group formControlName="tieneLugarVivir" class="radio-group">
            <mat-radio-button value="si">Sí</mat-radio-button>
            <mat-radio-button value="no">No</mat-radio-button>
            <mat-radio-button value="nr">N/R</mat-radio-button>
          </mat-radio-group>
        </div>

        <div class="radio-row">
          <label><strong>b.</strong> ¿Habita en una vivienda que cumple con las condiciones básicas?</label>
          <mat-radio-group formControlName="viviendasCondicionesBasicas" class="radio-group">
            <mat-radio-button value="si">Sí</mat-radio-button>
            <mat-radio-button value="no">No</mat-radio-button>
            <mat-radio-button value="nr">N/R</mat-radio-button>
          </mat-radio-group>
        </div>

        <!-- g. Calidad de vida -->
        <div class="scale-section">
          <p><strong>g.</strong> Calificación global de calidad de vida (Ej: Es capaz de disfrutar de la vida, conseguir estar bien con su familia y el entorno)</p>
          <div class="scale-row">
            <div class="scale-radios-container">
              <div class="scale-labels"><span>Mala</span><span>Buena</span></div>
              <div class="scale-radios">
                <label *ngFor="let v of scale20" class="scale-opt">
                  <input type="radio" formControlName="calidadVida" [value]="v">
                  <span>{{ v }}</span>
                </label>
              </div>
            </div>
            <div class="scale-inputs">
              <input type="number" formControlName="calidadVida" min="0" max="20" class="num-input-lg" placeholder="0-20">
              <mat-checkbox [checked]="form.get('calidadVida')?.value === null || form.get('calidadVida')?.value === ''" (change)="clearScale('calidadVida')">N/R</mat-checkbox>
            </div>
          </div>
        </div>

        <!-- No desea completar -->
        <div class="no-complete-row">
          <mat-checkbox formControlName="noDeseaCompletar">No desea completar formulario</mat-checkbox>
        </div>

        <mat-form-field class="obs-field" appearance="outline">
          <mat-label>Observaciones</mat-label>
          <textarea matInput formControlName="observaciones" rows="3"></textarea>
        </mat-form-field>
      </form>
    </div>
  `,
  styles: [`
    .section-container { padding: 16px 0; }
    .section-header h3 { margin: 0 0 4px; font-size: 1.1rem; color: #1a1a2e; }
    .voice-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .voice-hint { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: #555; font-style: italic; }
    .scale-section { margin-bottom: 24px; }
    .scale-section p { margin: 0 0 8px; font-size: 0.9rem; }
    .scale-row { display: flex; align-items: flex-end; gap: 24px; flex-wrap: wrap; }
    .scale-radios-container { flex: 1; min-width: 320px; }
    .scale-labels { display: flex; justify-content: space-between; font-size: 0.85rem; color: #888; font-weight: 500; margin-bottom: 8px; padding: 0 6px; }
    .scale-radios { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px; }
    .scale-opt { display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.75rem; cursor: pointer; color: #333; }
    .scale-opt input { margin: 0 0 4px; cursor: pointer; transform: scale(1.1); }
    .scale-inputs { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 80px; }
    .num-input-lg { width: 80px; border: 1px solid #ccc; border-radius: 4px; padding: 6px; font-size: 1rem; text-align: center; }
    .sub-title { margin: 0 0 8px; color: #1a3c6e; font-size: 0.95rem; }
    .table-responsive { overflow-x: auto; margin-bottom: 24px; }
    .top-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .top-table th { background: #1a3c6e; color: white; padding: 8px; text-align: center; }
    .top-table td { padding: 6px 8px; border-bottom: 1px solid #e0e0e0; text-align: center; }
    .item-label { text-align: left; font-weight: 500; white-space: nowrap; }
    .num-input { width: 50px; border: 1px solid #ccc; border-radius: 4px; padding: 4px; text-align: center; }
    .radio-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .radio-row label { font-size: 0.9rem; flex: 1; min-width: 200px; }
    .radio-group { display: flex; gap: 16px; }
    .no-complete-row { margin-bottom: 16px; }
    .obs-field { width: 100%; }
  `]
})
export class TopSection3Component implements OnInit {
  private fb = inject(FormBuilder);
  private voiceService = inject(VoiceService);
  private patientService = inject(PatientService);

  isListening = signal(false);
  lastTranscript = signal('');
  scale20 = Array.from({ length: 21 }, (_, i) => i);

  private diasGroup = () => this.fb.group({
    todosLosCeros: [null],
    promedio: [null],
    ultimaSemana: [null],
    semana3: [null],
    semana2: [null],
    semana1: [null],
    total: [null],
    noResponde: [null],
  });

  form: FormGroup = this.fb.group({
    saludPsicologica: [null],
    diasTrabajados: this.diasGroup(),
    diasEducacion: this.diasGroup(),
    saludFisica: [null],
    tieneLugarVivir: [null],
    viviendasCondicionesBasicas: [null],
    calidadVida: [null],
    noDeseaCompletar: [null],
    observaciones: [null],
  });

  ngOnInit() {
    this.setupTotalListener('diasTrabajados');
    this.setupTotalListener('diasEducacion');
  }

  setupTotalListener(groupKey: string) {
    const group = this.form.get(groupKey);
    if (!group) return;

    group.valueChanges.subscribe(val => {
      if (val.noResponde) return;

      const s1 = Number(val.ultimaSemana) || 0;
      const s2 = Number(val.semana3) || 0;
      const s3 = Number(val.semana2) || 0;
      const s4 = Number(val.semana1) || 0;
      const total = s1 + s2 + s3 + s4;

      if (val.total !== total) {
        group.patchValue({ total }, { emitEvent: false });
      }
    });
  }

  onTodosCerosChange(groupKey: string, checked: boolean): void {
    if (!checked) return;
    const group = this.form.get(groupKey);
    if (group) {
      group.patchValue({
        promedio: 0,
        ultimaSemana: 0,
        semana3: 0,
        semana2: 0,
        semana1: 0,
        total: 0,
        noResponde: false
      });
    }
  }

  onNoRespondeChange(groupKey: string, checked: boolean): void {
    if (!checked) return;
    const group = this.form.get(groupKey);
    if (group) {
      group.patchValue({
        todosLosCeros: false,
        promedio: null,
        ultimaSemana: null,
        semana3: null,
        semana2: null,
        semana1: null,
        total: null
      });
    }
  }

  clearScale(controlName: string) {
    const ctrl = this.form.get(controlName);
    if (ctrl) {
      ctrl.setValue(null);
    }
  }

  toggleVoice(): void {
    if (this.isListening()) {
      this.voiceService.stopListening();
      this.isListening.set(false);
      return;
    }

    if (!this.voiceService.isSupported()) {
      Notiflix.Notify.warning('El dictado por voz requiere Google Chrome.');
      return;
    }

    this.isListening.set(true);
    Notiflix.Loading.circle('Escuchando... Habla ahora');

    this.voiceService.startListening().subscribe({
      next: (transcript) => {
        this.lastTranscript.set(transcript);
        this.processVoiceWithGemini(transcript);
      },
      error: (err) => {
        Notiflix.Loading.remove();
        this.isListening.set(false);
        Notiflix.Notify.failure(err);
      },
      complete: () => {
        this.isListening.set(false);
      }
    });
  }

  private processVoiceWithGemini(text: string) {
    Notiflix.Loading.change('Procesando dictado con IA...');
    this.patientService.parseVoiceForTop(text, 'section3').subscribe({
      next: (response) => {
        Notiflix.Loading.remove();
        if (response.parsedData) {
          this.form.patchValue(response.parsedData);
          Notiflix.Notify.success('Sección 3 completada con dictado de voz');
        }
      },
      error: () => {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure('Error al procesar el dictado con IA');
      }
    });
  }

  getFormData() { return this.form.value; }
  patchData(data: any) { if (data) this.form.patchValue(data); }
}
