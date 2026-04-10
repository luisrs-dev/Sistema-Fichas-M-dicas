import { AdmissionForm } from './../../../../../interfaces/admissionForm.interface';
import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  public fieldLabels: { [key: string]: string } = {
    name: 'Nombres',
    surname: 'Apellido Paterno',
    secondSurname: 'Apellido Materno',
    sex: 'Sexo',
    birthDate: 'Fecha de nacimiento',
    selorigen_ingreso: 'Origen de ingreso',
    identidad_genero: 'Identidad de Género',
    orientacion_sexual: 'Orientación sexual',
    discapacidad: 'Discapacidad',
    opcion_discapacidad: 'Opciones Discapacidad',
    centerOrigin: 'Centro de Origen'
  };

  constructor() {
    super(); // Llamada al constructor de la clase base
  }

  ngOnInit(): void {
    // Inicialización del formulario
    this.form = this.fb.group({
      name: ['', [Validators.minLength(3)]],
      surname: ['', [Validators.minLength(3)]],
      secondSurname: ['', [Validators.minLength(3)]],
      sex: ['', []],
      birthDate: [new Date(), []],
      region: ['', []],
      selorigen_ingreso: ['', []],
      identidad_genero: ['', []],
      orientacion_sexual: ['', []],
      discapacidad: ['', []],
      opcion_discapacidad: ['', []],
      centerOrigin: ['', [Validators.minLength(3)]],
    });

    // Si existe el paciente, se cargan los valores en el formulario
    if (this.patient) {
      console.log('this.patient', this.patient);

      let parsedDate: Date | null = null;
      if (this.patient.birthDate) {
        if (typeof this.patient.birthDate === 'string' && this.patient.birthDate.includes('/')) {
          const [day, month, year] = this.patient.birthDate.split('/');
          parsedDate = new Date(+year, +month - 1, +day);
        } else {
          parsedDate = new Date(this.patient.birthDate);
        }
      }

      this.form.patchValue({
        name: this.patient.name,
        surname: this.patient.surname,
        secondSurname: this.patient.secondSurname,
        birthDate: parsedDate,
        sex: this.patient.sex,
        region: this.patient.region,
        phone: this.patient.phone,
        phoneFamily: this.patient.phoneFamily,
        centerOrigin: this.patient.centerOrigin,
        opcion_discapacidad: this.patient.opcion_discapacidad,
      });
    }

    // Método de componente base
    this.fillFormWithAdmissionData();
  }

  get mostrarCampoExtra() {
    return this.form.get('discapacidad')?.value === '1';
  }
}
