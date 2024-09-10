import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MaterialModule } from '../../../../../../angular-material/material.module';
import { Patient } from '../../../../../interfaces/patient.interface';

@Component({
  selector: 'user-identification',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './userIdentification.component.html',
})
export class UserIdentificationComponent {
  @Input() patient: Patient;
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    if (this.patient) {
      this.userIdentificationForm.patchValue({
        name: this.patient.name,
        surname: this.patient.surname,
        secondSurname: this.patient.secondSurname,
        birthDate: new Date(this.patient.birthDate),
        sex: this.patient.sex,
        region: this.patient.region,
        phone: this.patient.phone,
        phoneFamily: this.patient.phoneFamily,
        centerOrigin: this.patient.centerOrigin,
      });
    }
  }

  public userIdentificationForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    surname: ['', [Validators.required, Validators.minLength(3)]],
    secondSurname: ['', [Validators.required, Validators.minLength(3)]],
    birthDate: [new Date(), [Validators.required]],
    sex: ['', [Validators.required]],
    region: ['', [Validators.required]],
    selorigen_ingreso: ['', [Validators.required]],
    identidad_genero: ['', [Validators.required]],
    orientacion_sexual: ['', [Validators.required]],
    discapacidad: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    phoneFamily: ['', [Validators.required, Validators.minLength(3)]],
    centerOrigin: ['', [Validators.required, Validators.minLength(3)]],
  });

  isValidField(field: string): boolean {
    return (
      Boolean(this.userIdentificationForm.controls[field].errors) &&
      this.userIdentificationForm.controls[field].touched
    );
  }

  getFormData() {
    return this.userIdentificationForm.value;
  }
}
