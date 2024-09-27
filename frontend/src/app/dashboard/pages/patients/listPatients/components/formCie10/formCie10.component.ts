import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SpinnerComponent } from '../../../../../../shared/components/spinner/spinner.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PatientService } from '../../../patient.service';

@Component({
  selector: 'app-form-cie10',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, SpinnerComponent],

  templateUrl: './formCie10.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCie10Component {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { patientId: string }) {}

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  public loading: boolean = false;
  public form: FormGroup = this.fb.group({
    seldiagn_psiquiatrico_cie: ['', [Validators.required]],
  });

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    console.log(this.data.patientId);
    const optionSelected =  this.form.value.seldiagn_psiquiatrico_cie;
    this.patientService.setFormCie10(this.data.patientId, optionSelected).subscribe( response => {
        console.log({response});
        
    })
    
  }

  isValidField(field: string): boolean {
    return Boolean(this.form.controls[field].errors) && this.form.controls[field].touched;
  }
}
