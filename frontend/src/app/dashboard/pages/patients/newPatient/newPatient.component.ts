import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, RouterModule } from '@angular/router';
import Notiflix from 'notiflix';
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
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './newPatient.component.html',
  styleUrl: './newPatient.component.css',
})
export default class NewPatientComponent {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  public isEditable: boolean = false;
  public fichaDemanda: boolean = true;
  public registroSistrat: boolean = true;
  public demandRegistered: boolean = false;
  private changeDetectorRef = inject(ChangeDetectorRef);
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

  public sistratForm: FormGroup = this.fb.group({
    mainSubstance: ['', [Validators.required]],
    previousTreatments: ['', [Validators.required]],
    atentionRequestDate: [new Date()],
    typeContact: ['', [Validators.required]],
    whoRequest: ['', [Validators.required]],
    whoDerives: ['', [Validators.required]],
    careOfferedDate: [new Date()],
    estimatedMonth: [new Date(), [Validators.required]],
    demandIsNotAccepted: ['', [Validators.required]],
    firstAtentionDate: [new Date()],
    atentionResolutiveDate: [new Date()],
    interventionAB: ['', [Validators.required]],
    observations: [
      '',
      [Validators.required, Validators.minLength(3)],
    ],
  });

  ngOnInit(){

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

    this.patientService
      .addPatient(dataUser)
      .subscribe( (patient) => {

        this.patient = patient;

        //await this.delay(2000);
        this.fichaDemanda = false;
        this.changeDetectorRef.detectChanges();
        Notiflix.Loading.remove();
      });
  }

  onSaveFichaDemanda() {
    if (this.sistratForm.invalid) {
      this.sistratForm.markAllAsTouched();
      return;
    }

    Notiflix.Loading.circle('Registrando ficha demanda...');
    const dataUser = localStorage.getItem('user') || '';
    const user = JSON.parse(dataUser); 
    
    const formDataFormated = this.formatFormDates(this.sistratForm.value); // Convertir fechas   

    this.patientService
      .addFichaDemanda(this.patient._id!, formDataFormated)
      .subscribe(async (response: any) => {
        await this.delay(2000);
        this.demandRegistered = true;
        this.changeDetectorRef.detectChanges();
        Notiflix.Loading.remove();
      });
  }

  onSaveDemandOnSistrat(){

    this.patientService.addFichaDemandaToSistrat(this.patient._id!)
      .subscribe( (response) => {
        console.log('response on addFichaDemandaToSistrat');
        console.log({response});
        
      })
  }

  back() {
    console.log('volver');
  }

  isValidField(field: string): boolean {
    return (
      Boolean(this.userForm.controls[field].errors) &&
      this.userForm.controls[field].touched
    );
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
