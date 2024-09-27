import { ChangeDetectorRef, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';

export abstract class FormBaseComponent {
  form: FormGroup;
  private changeDetectorRef = inject(ChangeDetectorRef);
  
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
}
