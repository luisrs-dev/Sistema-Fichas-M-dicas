import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { VoiceService } from '../../../../../shared/services/voice.service';
import { PatientService } from '../../patient.service';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-top-section2',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <div class="section-container">
      <div class="section-header">
        <h3>Sección 2: Transgresión a la Norma Social</h3>
        <p class="section-desc">Registrar hurtos, robos, violencia intrafamiliar y otras acciones cometidas en las últimas 4 semanas.</p>
      </div>

      <form [formGroup]="form">
        <!-- Ítems simples Si/No/NR -->
        <div class="table-responsive">
          <table class="top-table">
            <thead>
              <tr>
                <th>Acción</th>
                <th>Sí</th>
                <th>No</th>
                <th>N/R</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items" [formGroupName]="item.key">
                <td class="item-label">{{ item.label }}</td>
                <td><mat-radio-button name="{{item.key}}" [checked]="form.get(item.key)?.get('si')?.value === true" (change)="onRadioChange(item.key, 'si')"></mat-radio-button></td>
                <td><mat-radio-button name="{{item.key}}" [checked]="form.get(item.key)?.get('no')?.value === true" (change)="onRadioChange(item.key, 'no')"></mat-radio-button></td>
                <td><mat-radio-button name="{{item.key}}" [checked]="form.get(item.key)?.get('nr')?.value === true" (change)="onRadioChange(item.key, 'nr')"></mat-radio-button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Violencia Intrafamiliar (tabla numérica) -->
        <div class="vi-section" formGroupName="violenciaIntrafamiliar">
          <h4>e. Violencia Intrafamiliar (Maltrato físico o psicológico)</h4>
          <table class="top-table">
            <thead>
              <tr>
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
              <tr>
                <td><mat-checkbox formControlName="todosLosCeros" (change)="onTodosCerosChange('violenciaIntrafamiliar', $any($event).checked)"></mat-checkbox></td>
                <td><input type="number" formControlName="ultimaSemana" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana3" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana2" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="semana1" min="0" max="7" class="num-input"></td>
                <td><input type="number" formControlName="total" min="0" max="28" class="num-input"></td>
                <td><mat-checkbox formControlName="noResponde" (change)="onNoRespondeChange('violenciaIntrafamiliar', $any($event).checked)"></mat-checkbox></td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .section-container { padding: 16px 0; }
    .section-header h3 { margin: 0 0 4px; font-size: 1.1rem; color: #1a1a2e; }
    .section-desc { margin: 0 0 12px; color: #666; font-size: 0.85rem; }
    .voice-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .voice-hint { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: #555; font-style: italic; }
    .table-responsive { overflow-x: auto; margin-bottom: 24px; }
    .top-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .top-table th { background: #1a3c6e; color: white; padding: 8px; text-align: center; }
    .top-table td { padding: 6px 8px; border-bottom: 1px solid #e0e0e0; text-align: center; }
    .item-label { text-align: left; font-weight: 500; }
    .vi-section h4 { margin: 16px 0 8px; color: #1a3c6e; font-size: 0.95rem; }
    .num-input { width: 50px; border: 1px solid #ccc; border-radius: 4px; padding: 4px; text-align: center; }
  `]
})
export class TopSection2Component implements OnInit {
  private fb = inject(FormBuilder);
  private voiceService = inject(VoiceService);
  private patientService = inject(PatientService);

  isListening = signal(false);
  lastTranscript = signal('');

  items = [
    { key: 'hurto', label: 'a. Hurto' },
    { key: 'robo', label: 'b. Robo' },
    { key: 'ventaDrogas', label: 'c. Venta de Droga' },
    { key: 'rina', label: 'd. Riña' },
    { key: 'otraAccion', label: 'f. Otra Acción' },
  ];

  form: FormGroup = this.fb.group({
    hurto: this.fb.group({ si: [null], no: [null], nr: [null] }),
    robo: this.fb.group({ si: [null], no: [null], nr: [null] }),
    ventaDrogas: this.fb.group({ si: [null], no: [null], nr: [null] }),
    rina: this.fb.group({ si: [null], no: [null], nr: [null] }),
    otraAccion: this.fb.group({ si: [null], no: [null], nr: [null] }),
    violenciaIntrafamiliar: this.fb.group({
      todosLosCeros: [null],
      ultimaSemana: [null],
      semana3: [null],
      semana2: [null],
      semana1: [null],
      total: [null],
      noResponde: [null],
    }),
  });

  ngOnInit() {
    this.setupTotalListener('violenciaIntrafamiliar');
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

  onRadioChange(groupKey: string, selected: 'si' | 'no' | 'nr'): void {
    const group = this.form.get(groupKey);
    if (group) {
      group.patchValue({ si: null, no: null, nr: null });
      group.get(selected)?.setValue(true);
    }
  }

  onTodosCerosChange(groupKey: string, checked: boolean): void {
    if (!checked) return;
    const group = this.form.get(groupKey);
    if (group) {
      group.patchValue({
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
        this.patientService.parseVoiceForTop(transcript, 'section2').subscribe({
          next: (response) => {
            Notiflix.Loading.remove();
            if (response.parsedData) {
              this.form.patchValue(response.parsedData);
              Notiflix.Notify.success('Sección 2 completada con dictado de voz');
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

  validate(): string[] {
    const emptyFields: string[] = [];
    const val = this.form.value;

    this.items.forEach(item => {
      const g = val[item.key];
      if (!g.si && !g.no && !g.nr) {
        emptyFields.push(item.label);
      }
    });

    const vi = val.violenciaIntrafamiliar;
    if (!vi.noResponde && !vi.todosLosCeros) {
      if (vi.ultimaSemana === null || vi.semana3 === null || vi.semana2 === null || vi.semana1 === null) {
        emptyFields.push('Violencia Intrafamiliar (alguna semana vacía)');
      }
    }

    return emptyFields;
  }

  getFormData() { return this.form.value; }
  patchData(data: any) { if (data) this.form.patchValue(data); }
}
