import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../angular-material/material.module';

@Component({
  selector: 'app-social-section2',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="social-section">
      <div class="checkbox-container">
        <h3>Necesidades de Empleo</h3>
        <div class="checkbox-grid">
          <mat-checkbox *ngFor="let item of empleoOptions" 
                        [checked]="isItemSelected('empleo', item.value)"
                        [disabled]="isItemDisabled('empleo', item.value)"
                        (change)="onCheckboxChange('empleo', item.value, $event.checked)">
            {{ item.label }}
          </mat-checkbox>
        </div>
      </div>

      <div class="checkbox-container">
        <h3>Necesidades de Habitabilidad</h3>
        <div class="checkbox-grid">
          <mat-checkbox *ngFor="let item of habitabilidadOptions" 
                        [checked]="isItemSelected('habitabilidad', item.value)"
                        [disabled]="isItemDisabled('habitabilidad', item.value)"
                        (change)="onCheckboxChange('habitabilidad', item.value, $event.checked)">
            {{ item.label }}
          </mat-checkbox>
        </div>
      </div>

      <div class="checkbox-container">
        <h3>Necesidades del Ámbito Judicial</h3>
        <div class="checkbox-grid">
          <mat-checkbox *ngFor="let item of judicialOptions" 
                        [checked]="isItemSelected('judicial', item.value)"
                        [disabled]="isItemDisabled('judicial', item.value)"
                        (change)="onCheckboxChange('judicial', item.value, $event.checked)">
            {{ item.label }}
          </mat-checkbox>
        </div>
      </div>

      <div class="checkbox-grid-col2">
        <div class="checkbox-container">
          <h3>Ámbito Salud</h3>
          <div class="checkbox-grid single-col">
            <mat-checkbox *ngFor="let item of saludOptions" 
                          [checked]="isItemSelected('salud', item.value)"
                          [disabled]="isItemDisabled('salud', item.value)"
                          (change)="onCheckboxChange('salud', item.value, $event.checked)">
              {{ item.label }}
            </mat-checkbox>
          </div>
        </div>

        <div class="checkbox-container">
          <h3>Apoyo Social</h3>
          <div class="checkbox-grid single-col">
            <mat-checkbox *ngFor="let item of apoyoSocialOptions" 
                          [checked]="isItemSelected('apoyoSocial', item.value)"
                          [disabled]="isItemDisabled('apoyoSocial', item.value)"
                          (change)="onCheckboxChange('apoyoSocial', item.value, $event.checked)">
              {{ item.label }}
            </mat-checkbox>
          </div>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .social-section { display: flex; flex-direction: column; gap: 32px; }
    .checkbox-container h3 { margin-bottom: 16px; color: #1a3c6e; font-weight: 600; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .checkbox-grid-col2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .single-col { grid-template-columns: 1fr; }
  `]
})
export class SocialSection2Component {
  @Input() form!: FormGroup;

  empleoOptions = [
    { value: '46', label: 'Sin necesidades' },
    { value: '47', label: 'Referencia a OMIL' },
    { value: '49', label: 'Intermediación Laboral' },
    { value: '50', label: 'Colocación Laboral' },
    { value: '89', label: 'No Observado' },
  ];

  habitabilidadOptions = [
    { value: '51', label: 'Sin necesidades' },
    { value: '52', label: 'Subsidios habitacionales' },
    { value: '53', label: 'Búsqueda lugar seguro' },
    { value: '54', label: 'Dispositivos situación calle' },
    { value: '57', label: 'Residencia protegida' },
    { value: '101', label: 'Vivienda protegida SERNAMEG' },
    { value: '102', label: 'Ayudas sociales para arriendo' },
    { value: '90', label: 'No Observado' },
  ];

  judicialOptions = [
    { value: '58', label: 'Sin necesidades' },
    { value: '59', label: 'Derecho de familia' },
    { value: '60', label: 'Denuncias y VIF' },
    { value: '61', label: 'Asesoría Antecedentes' },
    { value: '62', label: 'Derecho Laboral' },
    { value: '63', label: 'Derecho penal' },
    { value: '91', label: 'No Observado' },
  ];

  saludOptions = [
    { value: '64', label: 'Sin necesidades' },
    { value: '65', label: 'Credencial salud' },
    { value: '66', label: 'Inscripción APS' },
    { value: '67', label: 'RND Discapacidad' },
    { value: '103', label: 'Salud bucal' },
    { value: '104', label: 'Orientación GES' },
    { value: '105', label: 'Continuidad Salud Mental' },
    { value: '92', label: 'No Observado' },
  ];

  apoyoSocialOptions = [
    { value: '68', label: 'Sin necesidades' },
    { value: '69', label: 'Autoayuda' },
    { value: '70', label: 'Grupos sociocomunitarios' },
    { value: '93', label: 'No Observado' },
  ];

  isItemSelected(field: string, value: string): boolean {
    const currentValues = this.form.get(field)?.value as string[];
    return currentValues ? currentValues.includes(value) : false;
  }

  isSpecial(field: string, value: string): boolean {
    const specials: Record<string, string[]> = {
      empleo: ['46', '89'],
      habitabilidad: ['51', '90'],
      judicial: ['58', '91'],
      salud: ['64', '92'],
      apoyoSocial: ['68', '93']
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
