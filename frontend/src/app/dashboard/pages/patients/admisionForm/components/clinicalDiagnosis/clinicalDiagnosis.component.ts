import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { FormBaseComponent } from '../form-base.component';
import { RadioButtonSelectorComponent } from '../../../../../../shared/components/radio-buttons/radio-buttons.component';
import { optionsListCie } from './optionsLists.constant';

@Component({
  selector: 'clinical-diagnosis-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, RadioButtonSelectorComponent],
  styleUrl: './clinicalDiagnosis.component.scss',
  templateUrl: './clinicalDiagnosis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicalDiagnosisComponent extends FormBaseComponent {
  private fb = inject(FormBuilder);
  public selectedDiagnostico_1: number | null = null;
  public selectedDiagnostico_2: number | null = null;
  public selectedDiagnostico_3: number | null = null;

  ngOnInit() {
    this.form = this.fb.group({
      seldiagn_consumo_sustancia: ['', []],
      selintox_aguda: ['', []],
      selsindrome_abstinencia: ['', []],
      seldiagn_psiquiatrico_cie: ['', []],
      cie1: ['', []],
      cie2: ['', []],
      cie3: ['', []],
      seldiagn_psiquiatrico_cie2: ['', []],
      seldiagn_psiquiatrico_cie3: ['', []],
      seldiagn_fiscico: ['', []],
      selotro_problema_atencion: ['', []],
      selotro_problema_atencion2: ['', []],
      selcompromiso_biopsicosocial: ['', []],
    });
    // Método de componente base
    // Si existe una ficha de ingreso registrada, este método rellena los campos con esa información
    this.fillFormWithAdmissionData();
  }

  // Método para obtener las opciones para el diagnóstico según el valor seleccionado: cat1, cat2, cat3
  getOptionsForSelectedDiagnostico(diagnosticoKey: string) {
    const selectedDiagnosticoValue = this.form.get(diagnosticoKey)?.value; // Obtiene el valor seleccionado del campo

    // Filtra las opciones según el valor seleccionado en el mat-select
    const selectedGroup = optionsListCie.find(group => group.value == selectedDiagnosticoValue);
    return selectedGroup ? selectedGroup.optionList : [];
  }

  // Método para capturar el valor de cat1, cat2 y cat3 y asignarlo al formulario
  onRadioValueSelected(event: { groupName: string, value: any }) {
    // Dependiendo del groupName, actualiza el valor en el formulario
    if (event.groupName === 'cie1') {
      this.form.get('cie1')?.setValue(event.value);
    } else if (event.groupName === 'cie2') {
      this.form.get('cie2')?.setValue(event.value);
    } else if (event.groupName === 'cie3') {
      this.form.get('cie3')?.setValue(event.value);
    }

    console.log(this.form.value);

  }

}
