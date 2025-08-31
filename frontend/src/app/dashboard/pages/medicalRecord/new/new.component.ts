import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Inject, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../angular-material/material.module';
import { AuthService } from '../../../../auth/auth.service';
import { User } from '../../../../auth/interfaces/login-response.interface';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { UserService } from '../../users/user.service';
import { MedicalRecordService } from '../medicalRecord.service';
import { ValueEntryType } from '../../../interfaces/entryType.interface';
import { Report } from 'notiflix';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'highcharts';
import { Observable, switchMap } from 'rxjs';
import { PatientService } from '../../patients/patient.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { diagnosticMap } from '../../patients/detail/diagnosticMap.constant';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatChipsModule,
    MatExpansionModule,
  ],

  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './new.component.html',
  styleUrl: './new.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NewMedicalRecord {
  private fb = inject(FormBuilder);
  private medicalRecordService = inject(MedicalRecordService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);

  public patient: Patient;
  public latestMedicalRecordWithScheme: MedicalRecord | null;
  public user: User;
  public services: any[];
  public hideServiceSelect: boolean = false;
  // public data: { patient: Patient; latestMedicalRecordWithScheme: MedicalRecord | null };

  response$: Observable<{ patient: Patient; medicalRecords: MedicalRecord[] }>;
  readonly panelOpenState = signal(false);

  patientId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const groupIntervention = this.route.snapshot.paramMap.get('groupIntervention');
    console.log('groupIntervention', groupIntervention);

    if (id) {
      this.response$ = this.patientService.getPatientById(id);
    }
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      console.log('id', id);

      if (id) this.patientId.set(id);

      this.patientService.getPatientById(id!).subscribe((response) => {
        console.log('response', response);
        this.patient = response.patient;

        this.latestMedicalRecordWithScheme = this.medicalRecordService.getLastPharmacologicalScheme(response.medicalRecords);
        console.log('latestMedicalRecordWithScheme', this.latestMedicalRecordWithScheme);

        this.medicalRecordForm.get('entryType')?.valueChanges.subscribe((value) => {
          this.hideServiceSelect = value === 'Informacion';
          if (this.hideServiceSelect) {
            this.medicalRecordForm.get('service')?.reset(); // Resetea el campo service si se oculta
          }
        });
      });
    });

    this.user = this.authService.getUser();

    this.userService.getUserById(this.user._id).pipe(
      switchMap( (response) =>
        this.userService.getServicesByProfile(response.user.profile._id)
      )
    ).subscribe( services => {
      this.services = services;
    })

  }

  public medicalRecordForm: FormGroup = this.fb.group({
    date: [new Date(), [Validators.minLength(3), Validators.required]],
    // entryType: [this.setValueEntryType(), [Validators.required]],
    service: ['', [Validators.minLength(3), Validators.required]],
    //typeContact: ['presencial', [Validators.minLength(3), Validators.required]],
    interventionObjective: ['', [Validators.minLength(3), Validators.required]],
    relevantElements: ['', [Validators.required]],
    diagnosticMedic: [''],
    diagnostic: [''],
    pharmacologicalScheme: [''],
  });

  // setValueEntryType(){
  //   const valueEntryType = this.data.patient.program.name.includes('PAI') ? ValueEntryType.Distancia : null;
  //   return valueEntryType;
  // }

  onSave() {
    if (this.medicalRecordForm.invalid) {
      this.medicalRecordForm.markAllAsTouched();
      return;
    }
    this.medicalRecordService
      .addMedicalRecord({
        ...this.medicalRecordForm.value,
        patient: this.patientId(),
        registeredBy: this.user._id,
      })
      .subscribe((user) => {
        console.log({ user });
        // this.dialogRef.close(true);

        // console.log('redirigiendo a  nueva ficha');
        this.router.navigate(['dashboard/patient', this.patientId()]);
        Report.success('Registro exitoso', 'Ficha clínica registrada con éxito', 'Entendido');
      });
  }

  isValidField(field: string): boolean {
    return Boolean(this.medicalRecordForm.controls[field].errors) && this.medicalRecordForm.controls[field].touched;
  }

  get fullName(): string {
    return `${this.patient.name} ${this.patient.secondSurname}`;
  }

  get treatmentTime(): string {
    if (!this.patient?.admissionDate) {
      return '';
    }

    const [day, month, year] = this.patient.admissionDate.split('/').map(Number);
    const admission = new Date(year, month - 1, day);
    const today = new Date();

    if (admission > today) {
      return 'Fecha futura';
    }

    let years = today.getFullYear() - admission.getFullYear();
    let months = today.getMonth() - admission.getMonth();
    let days = today.getDate() - admission.getDate();

    if (days < 0) {
      months--;
      // Obtener los días del mes anterior
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const parts: string[] = [];
    if (years > 0) {
      parts.push(`${years} año${years > 1 ? 's' : ''}`);
    }
    if (months > 0) {
      parts.push(`${months} mes${months > 1 ? 'es' : ''}`);
    }
    if (days > 0) {
      parts.push(`${days} día${days > 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(' ') : '0 días';
  }

    getDiagnosticText(code: string | null | undefined): string {
      if (!code) return "-";
      return diagnosticMap[code] || "Valor desconocido";
    }
}
