import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormBaseComponent } from '../form-base.component';

@Component({
  selector: 'social-diagnosis-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, MatDatepickerModule],
  templateUrl: './socialDiagnosis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialDiagnosisComponent extends FormBaseComponent {
  private fb = inject(FormBuilder);
  public fieldLabels: { [key: string]: string } = {
    sel_diagnostico_1: 'Necesidades integración social (Global)',
    sel_diagnostico_2: 'Necesidades integración social (Cap. Humano)',
    sel_diagnostico_3: 'Necesidades integración social (Cap. Físico)',
    sel_diagnostico_4: 'Necesidades integración social (Cap. Social)'
  };
  public formComplete: boolean = false;

  ngOnInit() {
    this.form = this.fb.group({
      sel_diagnostico_1: ['', []],
      sel_diagnostico_2: ['', []],
      sel_diagnostico_3: ['', []],
      sel_diagnostico_4: ['', []],
    });

    // Método de componente base
    this.fillFormWithAdmissionData();
  }
}
