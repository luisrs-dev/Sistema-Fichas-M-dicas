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
import { FormBaseComponent } from '../form-base.component';

@Component({
  selector: 'user-identification',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './userIdentification.component.html',
})
export class UserIdentificationComponent extends FormBaseComponent {
  @Input() patient: Patient;
  private fb = inject(FormBuilder);

  constructor() {
    super(); // Llamada al constructor de la clase base
  }


  ngOnInit(): void {
   // Inicialización del formulario
   this.form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    surname: ['', [Validators.required, Validators.minLength(3)]],
    secondSurname: ['', [Validators.required, Validators.minLength(3)]],
    sex: ['', [Validators.required]],
    birthDate: [new Date(), [Validators.required]],
    region: ['', [Validators.required]],
    selorigen_ingreso: ['', [Validators.required]],
    identidad_genero: ['', [Validators.required]],
    orientacion_sexual: ['', [Validators.required]],
    discapacidad: ['', [Validators.required]],
    opcion_discapacidad: ['', [Validators.required]],
    centerOrigin: ['', [Validators.required, Validators.minLength(3)]],
  });

  // Si existe el paciente, se cargan los valores en el formulario
  if (this.patient) {
    this.form.patchValue({
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

}
