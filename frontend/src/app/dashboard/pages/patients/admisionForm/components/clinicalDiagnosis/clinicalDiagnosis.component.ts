import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBaseComponent } from '../form-base.component';

@Component({
  selector: 'clinical-diagnosis-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clinicalDiagnosis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicalDiagnosisComponent extends FormBaseComponent {
  private fb = inject(FormBuilder);

  ngOnInit() {
    this.form = this.fb.group({
      seldiagn_consumo_sustancia: ['', []],
      selintox_aguda: ['', []],
      selsindrome_abstinencia: ['', []],
      seldiagn_psiquiatrico_cie: ['', []],
      //cie1: ['', []],
      seldiagn_psiquiatrico_cie2: ['', []],
      seldiagn_psiquiatrico_cie3: ['', []],
      seldiagn_fiscico: ['', []],
      selotro_problema_atencion: ['', []],
      selotro_problema_atencion2: ['', []],
      selcompromiso_biopsicosocial: ['', []],
    });

    // Método de componente base
    this.fillFormWithAdmissionData();
  }
}
