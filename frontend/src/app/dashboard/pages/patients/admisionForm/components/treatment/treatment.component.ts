import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  ngOnInit() {
    this.form = this.fb.group({
      txtfecha_ingreso_tratamiento: ['', [Validators.required]],
      selconvenio_conace: ['', [Validators.required]],
      txtfecha_ingreso_conace: ['', [Validators.required]],
      seltipo_programa: ['', [Validators.required]],
      seltipo_plan: ['', [Validators.required]],
      selprograma_tribunales: ['', [Validators.required]],
      txtrut: ['', [Validators.required]],
      selconcentimiento_informado: ['', [Validators.required]],
    });
  }
}
