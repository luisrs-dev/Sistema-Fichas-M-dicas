import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../../../angular-material/material.module';

@Component({
  selector: 'clinical-diagnosis-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clinicalDiagnosis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicalDiagnosisComponent {
  private fb = inject(FormBuilder);

  public clinicalDiagnosisForm: FormGroup = this.fb.group({
    seldiagn_consumo_sustancia: ['', [Validators.required]],
    selintox_aguda: ['', [Validators.required]],
    selsindrome_abstinencia: ['', [Validators.required]],
    seldiagn_psiquiatrico_cie: ['', [Validators.required]], 
    cie1: ['', [Validators.required]],
    seldiagn_psiquiatrico_cie2: ['', [Validators.required]],
    seldiagn_psiquiatrico_cie3: ['', [Validators.required]],
    seldiagn_fiscico: ['', [Validators.required]],
    selotro_problema_atencion: ['', [Validators.required]],
    selotro_problema_atencion2: ['', [Validators.required]],
    selcompromiso_biopsicosocial: ['', [Validators.required]]
  });

  isValidField(field: string): boolean {
    return (
      Boolean(this.clinicalDiagnosisForm.controls[field].errors) && this.clinicalDiagnosisForm.controls[field].touched
    );
  }

  getFormData() {
    return this.clinicalDiagnosisForm.value;
  }
}
