import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormBaseComponent } from '../form-base.component';
import { MONDAY_FIRST_DATE_PROVIDERS } from '../../../../../../shared/date/monday-first-date-adapter';

@Component({
  selector: 'treatment-form',
  standalone: true,
  providers: [...MONDAY_FIRST_DATE_PROVIDERS],
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, MatDatepickerModule],
  templateUrl: './treatment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreatmentComponent extends FormBaseComponent {
  private fb = inject(FormBuilder);

  @Input() rut: string;
  @Input() center: string;

  ngOnInit() {

    console.log('admisionform', this.admissionForm);
    console.log('center: ', this.center);


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
