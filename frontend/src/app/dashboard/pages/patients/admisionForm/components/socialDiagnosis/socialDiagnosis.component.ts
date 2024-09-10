import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'social-diagnosis-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, MatDatepickerModule],
  templateUrl: './socialDiagnosis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialDiagnosisComponent {
  private fb = inject(FormBuilder);
  public formComplete: boolean = false;

  public socialDiagnosisForm: FormGroup = this.fb.group({
    sel_diagnostico_1: ['', [Validators.required]],
    sel_diagnostico_2: ['', [Validators.required]],
    sel_diagnostico_3: ['', [Validators.required]],
    sel_diagnostico_4: ['', [Validators.required]],
  });

  isValidField(field: string): boolean {
    return Boolean(this.socialDiagnosisForm.controls[field].errors) && this.socialDiagnosisForm.controls[field].touched;
  }

  getFormData() {
    return this.socialDiagnosisForm.value;
  }

  invalidFields(): boolean {
    return Object.values(this.socialDiagnosisForm.controls).some(control => control.invalid);
  }
}
