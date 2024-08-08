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
  private parametersService = inject(ParametersService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  public isEditable: boolean = false;
  public fichaDemanda: boolean = true;
  public registroSistrat: boolean = true;
  public disableTabSistrat: boolean = true;
  private changeDetectorRef = inject(ChangeDetectorRef);
  public searchResults$: Observable<any>;
  public programs: Parameter[];



  public userForm: FormGroup = this.fb.group({
    admissionDate: [new Date(), [Validators.required]],
    program: ['PG', [Validators.required]],
    rut: ['17184793-2', [Validators.required, Validators.minLength(3)]],
    name: ['2Luis', [Validators.required, Validators.minLength(3)]],
    surname: ['2Reyes', [Validators.required, Validators.minLength(3)]],
    secondSurname: ['2Silva', [Validators.required, Validators.minLength(3)]],
    birthDate: [new Date(), [Validators.required]],
    sex: ['2Masculino', [Validators.required]],
    region: ['27', [Validators.required]],
    phone: ['2969186636', [Validators.required, Validators.minLength(6)]],
    phoneFamily: ['2969186636', [Validators.required, Validators.minLength(3)]],
    centerOrigin: [
      'Carlos Trup',
      [Validators.required, Validators.minLength(3)],
    ],
  });

  public sistratForm: FormGroup = this.fb.group({
    mainSubstance: ['1', [Validators.required]],
    previousTreatments: ['2', [Validators.required]],
    atentionRequestDate: [new Date()],
    typeContact: ['1', [Validators.required]],
    whoRequest: ['1', [Validators.required]],
    whoDerives: ['3', [Validators.required]],
    careOfferedDate: [new Date()],
    estimatedMonth: [new Date(), [Validators.required]],
    demandIsNotAccepted: ['2', [Validators.required]],
    firstAtentionDate: [new Date()],
    atentionResolutiveDate: [new Date()],
    interventionAB: ['1', [Validators.required]],
    observations: [
      'Observacion para registrar',
      [Validators.required, Validators.minLength(3)],
    ],
  });

  ngOnInit(){

    const userId = localStorage.getItem('user');
    this.userService.getUserById(userId!).subscribe(response => {
      console.log(response.user);
      this.programs = response.user.programs;
    })
  }

  async onSave() {
    Notiflix.Loading.circle('Registrando nuevo paciente...');
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      Notiflix.Loading.remove();
      return;
    }

    this.patientService
      .addPatient(this.userForm.value)
      .subscribe(async (response: any) => {
        await this.delay(2000);
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
    const userId = localStorage.getItem('user') || '';

    this.patientService
      .addFichaDemanda(userId, this.sistratForm.value)
      .subscribe(async (response: any) => {
        await this.delay(2000);
        this.disableTabSistrat = false;
        this.changeDetectorRef.detectChanges();

        Notiflix.Loading.remove();
      });
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
}
