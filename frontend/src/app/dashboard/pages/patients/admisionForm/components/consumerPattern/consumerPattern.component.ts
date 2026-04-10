import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBaseComponent } from '../form-base.component';
import { AdmissionForm } from '../../../../../interfaces/admissionForm.interface';

@Component({
  selector: 'consumer-pattern-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './consumerPattern.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsumerPatternComponent extends FormBaseComponent {
  private fb = inject(FormBuilder);
  public fieldLabels: { [key: string]: string } = {
    selsustancia_princial: 'Sustancia Principal',
    selotra_sustancia_1: 'Otra Sustancia 1',
    selotra_sustancia_2: 'Otra Sustancia 2',
    selotra_sustancia_3: 'Otra Sustancia 3',
    selfrecuencia_consumo: 'Frecuencia de Consumo',
    txtedad_inicio_consumo: 'Edad Inicio Consumo',
    selvia_administracion: 'Vía de Administración',
    selsustancia_inicio: 'Sustancia de Inicio',
    txtedad_inicio_consumo_inicial: 'Edad Inicio Consumo Inicial'
  };

  ngOnInit() {
    this.form = this.fb.group({
      selsustancia_princial: ['', []],
      selotra_sustancia_1: ['', []],
      selotra_sustancia_2: ['', []],
      selotra_sustancia_3: ['', []],
      selfrecuencia_consumo: [''],
      txtedad_inicio_consumo: [''],
      selvia_administracion: [''],
      selsustancia_inicio: [''],
      txtedad_inicio_consumo_inicial: [''],
    });
    // Método de componente base
    this.fillFormWithAdmissionData();
  }
}
