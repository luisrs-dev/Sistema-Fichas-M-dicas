import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  public fieldLabels: { [key: string]: string } = {
    txtnacionalidad: 'Nacionalidad',
    seletnia: 'Etnia',
    documentacion_regularizada: 'Documentación Regularizada',
    selestado_civil: 'Estado Civil',
    int_numero_hijos: 'N° Hijos',
    selnumero_hijos_ingreso: 'N° hijos que ingresan',
    selescolaridad: 'Nivel educacional',
    escolaridad_opc: 'Años escolaridad',
    selmujer_embarazada: '¿Mujer embarazada?',
    tiene_menores_a_cargo: 'Tiene a cargo menores',
    selestado_ocupacional: 'Estado ocupacional',
    laboral_ingresos: 'Ingresos laborales',
    laboral_detalle: 'Detalle laboral',
    selrubro_trabajo: 'Rubro trabajo',
    selcon_quien_vive: 'Con quién vive',
    selparentesco: 'Parentesco jefe hogar',
    seldonde_vive: 'Tipo de vivienda',
    perso_dormitorio_vivienda: 'Personas por dormitorio',
    precariedad_vivienda: 'Precariedad habitacional',
    ss_basicos_vivienda: 'Servicios básicos',
    seltenencia_vivienda: 'Tenencia de vivienda',
    selnumero_tratamientos_anteriores: 'N° tratamientos anteriores',
    selfecha_ult_trata: 'Fecha último tratamiento'
  };

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
      selcon_quien_vive: ['', [Validators.required]],
      selparentesco: ['', []],
      seldonde_vive: ['', []],
      perso_dormitorio_vivienda: ['', []],
      precariedad_vivienda: ['', []],
      ss_basicos_vivienda: ['', []],
      seltenencia_vivienda: ['', []],
      selnumero_tratamientos_anteriores: ['', []],
      selfecha_ult_trata: ['', []],
    });

    this.form.get('selnumero_tratamientos_anteriores')?.valueChanges.subscribe(value => {
      const fechaTrataControl = this.form.get('selfecha_ult_trata');
      if (value === '0' || value === '') {
        fechaTrataControl?.setValidators([]);
        fechaTrataControl?.setValue('');
      } else {
        fechaTrataControl?.setValidators([Validators.required]);
      }
      fechaTrataControl?.updateValueAndValidity();
    });

    this.form.get('txtnacionalidad')?.valueChanges.subscribe(value => {
      const etniaControl = this.form.get('seletnia');
      if (value === '46') {
        etniaControl?.setValidators([Validators.required]);
      } else {
        etniaControl?.setValidators([]);
        etniaControl?.setValue('');
      }
      etniaControl?.updateValueAndValidity();
    });

    // Método de componente base
    this.fillFormWithAdmissionData();
  }
}
