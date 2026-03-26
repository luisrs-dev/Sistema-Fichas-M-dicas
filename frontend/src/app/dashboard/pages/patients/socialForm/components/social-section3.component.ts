import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../angular-material/material.module';

@Component({
  selector: 'app-social-section3',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="social-section">
      <div class="checkbox-container">
        <h3>Protección Social</h3>
        <div class="checkbox-grid">
          <mat-checkbox *ngFor="let item of proteccionOptions" 
                        [checked]="isItemSelected('proteccionSocial', item.value)"
                        [disabled]="isItemDisabled('proteccionSocial', item.value)"
                        (change)="onCheckboxChange('proteccionSocial', item.value, $event.checked)">
            {{ item.label }}
          </mat-checkbox>
        </div>
      </div>

      <div class="checkbox-container">
        <h3>Uso del Tiempo Libre</h3>
        <div class="checkbox-grid">
          <mat-checkbox *ngFor="let item of tiempoLibreOptions" 
                        [checked]="isItemSelected('usoTiempoLibre', item.value)"
                        [disabled]="isItemDisabled('usoTiempoLibre', item.value)"
                        (change)="onCheckboxChange('usoTiempoLibre', item.value, $event.checked)">
            {{ item.label }}
          </mat-checkbox>
        </div>
      </div>

      <div class="observations-section">
        <h3>Otras necesidades y Observaciones</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observaciones 1</mat-label>
          <textarea matInput rows="3" formControlName="observacion1"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observaciones 2</mat-label>
          <textarea matInput rows="3" formControlName="observacion2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observaciones 3</mat-label>
          <textarea matInput rows="3" formControlName="observacion3"></textarea>
        </mat-form-field>
      </div>
    </form>
  `,
  styles: [`
    .social-section { display: flex; flex-direction: column; gap: 32px; }
    .checkbox-container h3 { margin-bottom: 16px; color: #1a3c6e; font-weight: 600; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .observations-section { display: flex; flex-direction: column; gap: 16px; }
    .observations-section h3 { margin-bottom: 8px; color: #1a3c6e; font-weight: 600; }
    .full-width { width: 100%; }
  `]
})
export class SocialSection3Component {
  @Input() form!: FormGroup;

  proteccionOptions = [
    { value: '71', label: 'Sin necesidades' },
    { value: '72', label: 'RSH' },
    { value: '73', label: 'Ingreso Ético Familiar' },
    { value: '74', label: 'Calle' },
    { value: '75', label: 'Chile Crece Contigo' },
    { value: '106', label: 'Protección infancia' },
    { value: '107', label: 'Reparación VCM' },
    { value: '94', label: 'No Observado' },
  ];

  tiempoLibreOptions = [
    { value: '76', label: 'Sin necesidades' },
    { value: '77', label: 'Culturales' },
    { value: '78', label: 'Deportivas' },
    { value: '79', label: 'Recreativas' },
    { value: '81', label: 'Espirituales' },
    { value: '95', label: 'No Observado' },
  ];

  isItemSelected(field: string, value: string): boolean {
    const currentValues = this.form.get(field)?.value as string[];
    return currentValues ? currentValues.includes(value) : false;
  }

  isSpecial(field: string, value: string): boolean {
    const specials: Record<string, string[]> = {
      proteccionSocial: ['71', '94'],
      usoTiempoLibre: ['76', '95'],
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
