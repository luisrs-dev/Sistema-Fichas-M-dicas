import { optionsNacionality } from './optionsNationality';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBaseComponent } from '../form-base.component';

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
      txtnacionalidad: ['', [Validators.required]],
      selestado_civil: ['', [Validators.required]],
      int_numero_hijos: ['', [Validators.required]],
      selnumero_hijos_ingreso: ['', [Validators.required]],
      selescolaridad: ['', [Validators.required]],
      escolaridad_opc: ['1', [Validators.required]],
      selmujer_embarazada: ['No', [Validators.required]],
      tiene_menores_a_cargo: ['no', [Validators.required]],
      selestado_ocupacional: ['', [Validators.required]],
      selcon_quien_vive: ['', [Validators.required]],
      selparentesco: ['', [Validators.required]],
      seldonde_vive: ['', [Validators.required]],
      perso_dormitorio_vivienda: ['', [Validators.required]],
      precariedad_vivienda: ['', [Validators.required]],
      ss_basicos_vivienda: ['', [Validators.required]],
      seltenencia_vivienda: ['', [Validators.required]],
      selnumero_tratamientos_anteriores: ['', [Validators.required]],
      selfecha_ult_trata: ['', [Validators.required]],
    });
  }
}
