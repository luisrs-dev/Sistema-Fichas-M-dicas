import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, RouterModule } from '@angular/router';
import Notiflix, { Report } from 'notiflix';
import { Observable } from 'rxjs';
import { ParametersService } from '../../parameters/parameters.service';
import { Parameter, ParameterValue } from '../../parameters/interfaces/parameter.interface';
import { UserService } from '../../users/user.service';
import { AuthService } from '../../../../auth/auth.service';
import moment from 'moment';
import { Patient } from '../../../interfaces/patient.interface';

@Component({
  selector: 'app-new-patient',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, RouterModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './newPatient.component.html',
  styleUrl: './newPatient.component.css',
})
export default class NewPatientComponent {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  public isEditable: boolean = false;
  public registered: boolean = false;
  public registroSistrat: boolean = true;
  public demandRegistered: boolean = false;
  public searchResults$: Observable<any>;
  public programs: Parameter[];
  public patient: Patient;

  public userForm: FormGroup = this.fb.group({
    admissionDate: [new Date(), [Validators.required]],
    program: ['', [Validators.required]],
    rut: ['', [Validators.required, Validators.minLength(3)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    surname: ['', [Validators.required, Validators.minLength(3)]],
    secondSurname: ['', [Validators.required, Validators.minLength(3)]],
    birthDate: [new Date(), [Validators.required]],
    sex: ['', [Validators.required]],
    region: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    phoneFamily: ['', [Validators.required, Validators.minLength(3)]],
    centerOrigin: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit() {
    const user = this.authService.getUser();
    this.programs = user.programs;
  }

  async onSave() {
    Notiflix.Loading.circle('Registrando nuevo paciente...');
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      Notiflix.Loading.remove();
      return;
    }

    const dataUser = this.formatFormDates(this.userForm.value);

    this.patientService.addPatient(dataUser).subscribe((patient) => {
      this.patient = patient;
      this.registered = true;
      this.changeDetectorRef.detectChanges();
      Notiflix.Loading.remove();
      Report.success('Registro exitoso', 'Ahora es posible registrar su ficha demanda', 'Entendido');
      this.router.navigate(['dashboard/patient/demand', this.patient._id]);
    });
  }

  onSaveDemandOnSistrat() {
    this.patientService.addFichaDemandaToSistrat(this.patient._id!).subscribe((response) => {
      console.log('response on addFichaDemandaToSistrat');
      console.log({ response });
    });
  }

  isValidField(field: string): boolean {
    return Boolean(this.userForm.controls[field].errors) && this.userForm.controls[field].touched;
  }

  // Método para convertir todas las fechas a 'DD-MM-YYYY'
  formatFormDates(data: any): any {
    const formValues = { ...data }; // Clonar los valores del formulario

    // Iterar sobre cada control del formulario
    for (const key in formValues) {
      if (formValues.hasOwnProperty(key) && formValues[key] instanceof Date) {
        // Formatear las fechas usando moment.js
        formValues[key] = moment(formValues[key]).format('DD/MM/YYYY');
      }
    }

    return formValues;
  }
}
