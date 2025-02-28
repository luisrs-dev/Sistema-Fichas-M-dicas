import { ChangeDetectorRef, Directive, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AdmissionForm } from '../../../../interfaces/admissionForm.interface';

@Directive()
export abstract class FormBaseComponent {
  form: FormGroup;
  private changeDetectorRef = inject(ChangeDetectorRef);
  @Input() admissionForm: AdmissionForm | null;


  // Método para verificar si el formulario es válido
  isValidForm(): boolean {
    this.form.markAllAsTouched();
    this.changeDetectorRef.detectChanges();

    return this.form?.valid ?? false;
  }

  // Método para obtener los datos del formulario
  getFormData(): any {
    return this.form?.value ?? {};
  }

  isValidField(field: string): boolean {
    return (
      Boolean(this.form.controls[field].errors) &&
      this.form.controls[field].touched
    );
  }

  fillFormWithAdmissionData() {
    if (!this.admissionForm || !this.form) return;

    Object.keys(this.form.controls).forEach((field) => {
      // Verifica si el campo existe en `admissionForm`
      if (this.admissionForm && field in this.admissionForm) {
        // Usa el casting para evitar el error de tipos
        const value = (this.admissionForm as any)[field];
        if (value !== undefined) {
          this.form.get(field)?.setValue(value);
        }
      }
    });
  }
}
