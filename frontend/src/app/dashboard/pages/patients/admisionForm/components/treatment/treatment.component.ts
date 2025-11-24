import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormBaseComponent } from '../form-base.component';

@Component({
  selector: 'treatment-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, MatDatepickerModule],
  templateUrl: './treatment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreatmentComponent extends FormBaseComponent {
  private fb = inject(FormBuilder);

  @Input() rut: string;
  
  ngOnInit() {
    this.form = this.fb.group({
      txtfecha_ingreso_tratamiento: [new Date()],
      selconvenio_conace: ['', []],
      txtfecha_ingreso_conace: [new Date()],
      seltipo_programa: ['', []],
      seltipo_plan: ['', []],
      selprograma_tribunales: ['', []],
      txtrut: ['', []],
      selconcentimiento_informado: ['', []],
    });

    // Método de componente base
    this.fillFormWithAdmissionData();
    this.form.get('txtrut')?.setValue(this.rut || this.admissionForm?.txtrut);
    this.form.get('txtrut')?.disable();

  }
}
