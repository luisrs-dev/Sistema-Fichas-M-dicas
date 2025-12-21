import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { AdmissionForm } from '../../../../../interfaces/admissionForm.interface';
import { FormBaseComponent } from '../form-base.component';
import { optionsNacionality } from './optionsNationality';

@Component({
  selector: 'socio-demographic-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './socioDemographic.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocioDemographicComponent extends FormBaseComponent {
  private fb = inject(FormBuilder);

  public optionsNacionality: { name: string; value: string }[] = optionsNacionality;

  ngOnInit() {
    this.form = this.fb.group({
      txtnacionalidad: ['', []],
      seletnia: ['', []],
      documentacion_regularizada: ['', []],
      selestado_civil: ['', []],
      int_numero_hijos: ['', []],
      selnumero_hijos_ingreso: ['', []],
      selescolaridad: ['', []],
      escolaridad_opc: ['1', []],
      selmujer_embarazada: ['No', []],
      tiene_menores_a_cargo: ['no', []],
      selestado_ocupacional: ['', []],
      laboral_ingresos: ['', []],
      laboral_detalle: ['', []],
      selrubro_trabajo: ['', []],
      selcon_quien_vive: ['', []],
      selparentesco: ['', []],
      seldonde_vive: ['', []],
      perso_dormitorio_vivienda: ['', []],
      precariedad_vivienda: ['', []],
      ss_basicos_vivienda: ['', []],
      seltenencia_vivienda: ['', []],
      selnumero_tratamientos_anteriores: ['', []],
      selfecha_ult_trata: ['', []],
    });

    // Método de componente base
    this.fillFormWithAdmissionData()
  }
}
