import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { VoiceService } from '../../../../../shared/services/voice.service';
import { PatientService } from '../../patient.service';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-top-section1',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <div class="section-container">
      <div class="section-header">
        <h3>Sección 1: Uso de Sustancias</h3>
        <p class="section-desc">Registrar la cantidad promedio de uso de sustancias consumidas en las últimas 4 semanas.</p>

      </div>

      <form [formGroup]="form">
        <div class="table-responsive">
          <table class="top-table">
            <thead>
              <tr>
                <th>Sustancia</th>
                <th>Todos Ceros</th>
                <th>Promedio</th>
                <th>Últ. Semana</th>
                <th>Semana 3</th>
                <th>Semana 2</th>
                <th>Semana 1</th>
                <th>Total</th>
                <th>N/R</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of sustancias" [formGroupName]="s.key">
                <td class="sustancia-label">{{ s.label }}</td>
                <td><mat-checkbox formControlName="todosLosCeros" (change)="onTodosCerosChange(s.key, $any($event).checked)"></mat-checkbox></td>
                <td>
                  <div class="flex align-items-center justify-content-center gap-1">
                    <input type="number" formControlName="promedio" min="0" max="7" class="num-input">
                    <span class="unit-label">{{ s.unit }}</span>
                  </div>
                </td>
                <td><input type="number" formControlName="ultimaSemana" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana3" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana2" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana1" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="total" min="0" max="28" class="num-input"></td>
                <td><mat-checkbox formControlName="noResponde" (change)="onNoRespondeChange(s.key, $any($event).checked)"></mat-checkbox></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Campos de detalle para la otra sustancia -->
        <div class="detail-section p-3 mt-3 border-round border-1 border-200 bg-gray-50" formGroupName="otraSustancia">
          <div class="flex align-items-center mb-3">
            <mat-icon class="text-primary mr-2">info</mat-icon>
            <span class="font-bold">Detalle de "Otra Sustancia Problema"</span>
          </div>
          <div class="grid">
            <div class="col-6">
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>¿Cuál es el nombre de esta sustancia?</mat-label>
                <input matInput formControlName="nombre" placeholder="Ej: Benzodiacepina, Inhalantes...">
              </mat-form-field>
            </div>
            <div class="col-6">
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>¿Cual es la unidad de medida?</mat-label>
                <input matInput formControlName="unidadMedida" placeholder="Ej: Miligramos, Dosis, Gotas...">
              </mat-form-field>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .section-container { padding: 16px 0; }
    .section-header h3 { margin: 0 0 4px; font-size: 1.1rem; color: #1a1a2e; }
    .section-desc { margin: 0 0 12px; color: #666; font-size: 0.85rem; }
    .voice-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .voice-hint { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: #555; font-style: italic; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .table-responsive { overflow-x: auto; }
    .top-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .top-table th { background: #1a3c6e; color: white; padding: 8px; text-align: center; font-weight: 500; white-space: nowrap; }
    .top-table td { padding: 6px 8px; border-bottom: 1px solid #e0e0e0; text-align: center; }
    .top-table tr:nth-child(even) td { background: #f5f8ff; }
    .sustancia-label { text-align: left; font-weight: 500; white-space: nowrap; }
    .num-input { width: 50px; border: 1px solid #ccc; border-radius: 4px; padding: 4px; text-align: center; font-size: 0.85rem; }
    .unit-label { font-size: 0.75rem; color: #888; font-style: italic; white-space: nowrap; }
  `]
})
export class TopSection1Component implements OnInit {
  private fb = inject(FormBuilder);
  private voiceService = inject(VoiceService);
  private patientService = inject(PatientService);

  isListening = signal(false);
  lastTranscript = signal('');

  sustancias = [
    { key: 'alcohol', label: 'a. Alcohol', unit: 'Tragos' },
    { key: 'marihuana', label: 'b. Marihuana', unit: 'Pitos' },
    { key: 'pastaBase', label: 'c. Pasta Base', unit: 'Papelillos' },
    { key: 'cocaina', label: 'd. Cocaína', unit: 'Gramos' },
    { key: 'sedantes', label: 'e. Sedantes / Tranquilizantes', unit: 'Comp.' },
    { key: 'otraSustancia', label: 'f. Otra sustancia problema', unit: 'Medida/día' },
  ];

  private sustanciaGroup = () => this.fb.group({
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
    alcohol: this.sustanciaGroup(),
    marihuana: this.sustanciaGroup(),
    pastaBase: this.sustanciaGroup(),
    cocaina: this.sustanciaGroup(),
    sedantes: this.sustanciaGroup(),
    otraSustancia: this.fb.group({
      nombre: [null],
      unidadMedida: [null],
      todosLosCeros: [null],
      promedio: [null],
      ultimaSemana: [null],
      semana3: [null],
      semana2: [null],
      semana1: [null],
      total: [null],
      noResponde: [null],
    }),
  });

  ngOnInit() {
    this.sustancias.forEach(s => this.setupTotalListener(s.key));
    this.setupTotalListener('otraSustancia');
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
    const valueInput = checked ? 0 : '';
    const group = this.form.get(groupKey);
    if (group) {
      group.patchValue({
        promedio: valueInput,
        ultimaSemana: valueInput,
        semana3: valueInput,
        semana2: valueInput,
        semana1: valueInput,
        total: valueInput,
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
        Notiflix.Loading.change('Procesando con IA...');
        this.patientService.parseVoiceForTop(transcript, 'section1').subscribe({
          next: (response) => {
            Notiflix.Loading.remove();
            if (response.parsedData) {
              this.form.patchValue(response.parsedData);
              Notiflix.Notify.success('Sección 1 completada con dictado de voz');
            }
          },
          error: () => {
            Notiflix.Loading.remove();
            Notiflix.Notify.failure('Error al procesar el dictado con IA');
          }
        });
      },
      error: (err) => {
        Notiflix.Loading.remove();
        this.isListening.set(false);
        Notiflix.Notify.failure(err);
      },
      complete: () => this.isListening.set(false)
    });
  }

  getFormData() {
    return this.form.value;
  }

  patchData(data: any) {
    if (data) this.form.patchValue(data);
  }
}
