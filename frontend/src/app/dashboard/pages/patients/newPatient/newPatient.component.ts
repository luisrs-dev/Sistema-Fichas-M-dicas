import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import Notiflix from 'notiflix';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NewPatientComponent {
  private patientService = inject(PatientService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  public isEditable: boolean = false;
  public disableTabSistrat: boolean = true;

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
    phone: ['2969186636', [Validators.required, Validators.minLength(3)]],
    phoneFamily: ['2969186636', [Validators.required, Validators.minLength(3)]],
  });

  public sistratForm: FormGroup = this.fb.group({
    mainSubstance: ['1', [Validators.required]],
    previousTreatments: ['2', [Validators.required]],
    atentionRequestDate: [new Date(), [Validators.required]],
    typeContact: ['1', [Validators.required]],
    whoRequest: ['1', [Validators.required]],
    whoDerives: ['3', [Validators.required]],
    careOfferedDate: [new Date(), [Validators.required]],
    estimatedMonth: [new Date(), [Validators.required]],
    demandIsNotAccepted: ['2', [Validators.required]],
    firstAtentionDate: [new Date(), [Validators.required]],
    atentionResolutiveDate: [new Date(), [Validators.required]],
    interventionAB: ['1', [Validators.required]],
    observations: [
      'Observacion para registrar',
      [Validators.required, Validators.minLength(3)],
    ],
  });

  async onSave() {
    Notiflix.Loading.circle();
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      Notiflix.Loading.remove();
      return;
    }

    this.patientService
      .addPatient(this.userForm.value)
      .subscribe(async (response: any) => {
        console.log(response);
        await this.delay(2000);
        this.disableTabSistrat = false;
        Notiflix.Loading.remove();
        // this.router.navigateByUrl('/dashboard/patients');
      });
  }

  onSaveSISTRAT() {
    Notiflix.Loading.circle();
    if (this.sistratForm.invalid) {
      this.sistratForm.markAllAsTouched();
      Notiflix.Loading.remove();
      return;
    }


    this.formatAllDates();

    console.log(this.sistratForm.value);

    Notiflix.Loading.remove();

    const userId = localStorage.getItem('user') || '';

    this.patientService
      .addSistrat(userId, this.sistratForm.value)
      .subscribe(async (response: any) => {
        console.log(response);
        await this.delay(2000);
        this.disableTabSistrat = false;
        Notiflix.Loading.remove();
        // this.router.navigateByUrl('/dashboard/patients');
      });
  }

  onRegisterToSistrat(){
    const userId = localStorage.getItem('user')!;
    console.log({userId});

    this.patientService
    .saveToSistrat(userId)
    .subscribe(async (response: any) => {
      console.log(response);
      await this.delay(2000);
      this.disableTabSistrat = false;
      Notiflix.Loading.remove();
      // this.router.navigateByUrl('/dashboard/patients');
    });
    


  }

  formatAllDates() {
    const dateFields = [
      'atentionRequestDate',
      'careOfferedDate',
      'estimatedMonth',
      'firstAtentionDate',
      'atentionResolutiveDate',
    ];

    dateFields.forEach((field) => {
      const dateValue = this.sistratForm.get(field)?.value;
      if (dateValue) {
        const formattedDate = formatDate(dateValue, 'dd-MM-yyyy', 'en-US');
        this.sistratForm
          .get(field)
          ?.setValue(formattedDate, { emitEvent: false });
      }
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
