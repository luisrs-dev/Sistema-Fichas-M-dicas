import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'treatment-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, MatDatepickerModule],
  templateUrl: './treatment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreatmentComponent {
  private fb = inject(FormBuilder);

  public treatmentForm: FormGroup = this.fb.group({
    txtfecha_ingreso_tratamiento: ['', [Validators.required]],
    txtfecha_ingreso_conace: ['', [Validators.required]],
    seltipo_programa: ['', [Validators.required]],
    seltipo_plan: ['', [Validators.required]],
    txtrut: ['', [Validators.required]],
    selconcentimiento_informado: ['', [Validators.required]],
  });

  isValidField(field: string): boolean {
    return Boolean(this.treatmentForm.controls[field].errors) && this.treatmentForm.controls[field].touched;
  }

  getFormData() {
    return this.treatmentForm.value;
  }
}
