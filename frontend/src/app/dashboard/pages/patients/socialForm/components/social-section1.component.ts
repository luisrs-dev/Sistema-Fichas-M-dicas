import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../angular-material/material.module';

@Component({
  selector: 'app-social-section1',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="social-section">
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Requiere ingresar a Orientación Sociolaboral</mat-label>
          <mat-select formControlName="orientacionSociolaboral">
            <mat-option value="">Seleccione</mat-option>
            <mat-option value="Si">Si</mat-option>
            <mat-option value="No">No</mat-option>
            <mat-option value="No Observado">No Observado</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Requiere ingresar a VAIS</mat-label>
          <mat-select formControlName="requiereVais">
            <mat-option value="">Seleccione</mat-option>
            <mat-option value="Si">Si</mat-option>
            <mat-option value="No">No</mat-option>
            <mat-option value="No Observado">No Observado</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Necesidades de Nivelación de Estudios</mat-label>
          <mat-select formControlName="nivelacionEstudios">
            <mat-option value="">Seleccione</mat-option>
            <mat-option value="13">Sin necesidades</mat-option>
            <mat-option value="14">Programa de Alfabetización</mat-option>
            <mat-option value="15">2° Nivel Básica (5°y 6°)</mat-option>
            <mat-option value="16">3° Nivel Básica (7° y 8°)</mat-option>
            <mat-option value="17">1° Nivel Media (1° y 2°)</mat-option>
            <mat-option value="18">2° Nivel Media (3° y 4°)</mat-option>
            <mat-option value="86">No Observado</mat-option>
            <mat-option value="96">Educación Especial</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Necesidades de Formación</mat-label>
          <mat-select formControlName="formacion">
            <mat-option value="">Seleccione</mat-option>
            <mat-option value="19">Sin necesidades</mat-option>
            <mat-option value="20">Centro de Formación Técnica</mat-option>
            <mat-option value="21">Instituto Profesional</mat-option>
            <mat-option value="80">Universidad</mat-option>
            <mat-option value="87">No Observado</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="checkbox-section">
        <h3>Necesidades de Capacitación</h3>
        <div class="checkbox-grid">
          <mat-checkbox *ngFor="let item of capacitacionOptions" 
                        [checked]="isItemSelected('capacitacion', item.value)"
                        [disabled]="isItemDisabled('capacitacion', item.value)"
                        (change)="onCheckboxChange('capacitacion', item.value, $event.checked)">
            {{ item.label }}
          </mat-checkbox>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .social-section { display: flex; flex-direction: column; gap: 24px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .checkbox-section h3 { margin-bottom: 16px; color: #1a3c6e; font-weight: 600; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
  `]
})
export class SocialSection1Component {
  @Input() form!: FormGroup;

  capacitacionOptions = [
    { value: '22', label: 'Sin necesidades' },
    { value: '23', label: 'Administración' },
    { value: '24', label: 'Agricultura' },
    { value: '25', label: 'Agropecuario' },
    { value: '26', label: 'Alimentación, gastronomía y turismo' },
    { value: '27', label: 'Artes, artesanías y gráfica' },
    { value: '28', label: 'Ciencias y técnicas aplicadas' },
    { value: '29', label: 'Comercio y servicios financieros' },
    { value: '30', label: 'Computación e informática' },
    { value: '31', label: 'Construcción' },
    { value: '32', label: 'Ecología' },
    { value: '33', label: 'Educación y capacitación' },
    { value: '34', label: 'Electricidad y electrónica' },
    { value: '35', label: 'Especies acuáticas' },
    { value: '36', label: 'Forestal' },
    { value: '37', label: 'Idiomas y comunicación' },
    { value: '38', label: 'Mecánica automotriz' },
    { value: '39', label: 'Mecánica industrial' },
    { value: '40', label: 'Minería' },
    { value: '41', label: 'Procesos industriales' },
    { value: '42', label: 'Salud, nutrición y dietética' },
    { value: '43', label: 'Servicio a personas' },
    { value: '44', label: 'Transporte y telecomunicaciones' },
    { value: '45', label: 'Energía nuclear' },
    { value: '88', label: 'No Observado' },
  ];

  isItemSelected(field: string, value: string): boolean {
    const currentValues = this.form.get(field)?.value as string[];
    return currentValues ? currentValues.includes(value) : false;
  }

  isSpecial(field: string, value: string): boolean {
    const specials: Record<string, string[]> = {
      capacitacion: ['22', '88']
    };
    return specials[field]?.includes(value) || false;
  }

  isItemDisabled(field: string, value: string): boolean {
    const currentValues = this.form.get(field)?.value as string[] || [];
    if (currentValues.includes(value)) return false;

    const hasSpecial = currentValues.some(v => this.isSpecial(field, v));
    const isSpecialValue = this.isSpecial(field, value);

    if (hasSpecial) return true;
    if (isSpecialValue && currentValues.length > 0) return true;
    if (currentValues.length >= 2) return true;

    return false;
  }

  onCheckboxChange(field: string, value: string, checked: boolean): void {
    let currentValues = [...(this.form.get(field)?.value || [])];

    if (checked) {
      if (this.isSpecial(field, value)) {
        currentValues = [value];
      } else {
        if (!currentValues.includes(value) && currentValues.length < 2) {
          currentValues.push(value);
        }
      }
    } else {
      const index = currentValues.indexOf(value);
      if (index >= 0) currentValues.splice(index, 1);
    }
    this.form.get(field)?.setValue(currentValues);
  }
}
