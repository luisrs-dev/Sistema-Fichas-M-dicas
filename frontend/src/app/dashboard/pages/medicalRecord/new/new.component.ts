import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Notiflix, { Report } from 'notiflix';
import { Observable, switchMap, tap } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { AuthService } from '../../../../auth/auth.service';
import { User } from '../../../../auth/interfaces/login-response.interface';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { diagnosticMap } from '../../patients/detail/diagnosticMap.constant';
import { PatientService } from '../../patients/patient.service';
import { UserService } from '../../users/user.service';
import { MedicalRecordService } from '../medicalRecord.service';

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
    MatDialogModule,
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
  private dialogRef = inject(MatDialogRef<NewMedicalRecord>, { optional: true });
  private dialogData = inject<{ patientId: string | null }>(MAT_DIALOG_DATA, { optional: true });

  public patient: Patient;
  public latestMedicalRecordWithScheme: MedicalRecord | null;
  public user: User;
  public services: any[];
  public hideServiceSelect: boolean = false;
  public isSubmitting = false;
  private entryTypeWatcherBound = false;
  private serviceWatcherBound = false;
  public requiresRescueAction = false;
  public readonly isDialogInstance = Boolean(this.dialogRef);
  // public data: { patient: Patient; latestMedicalRecordWithScheme: MedicalRecord | null };

  response$: Observable<{ patient: Patient; medicalRecords: MedicalRecord[] }>;
  readonly panelOpenState = signal(false);

  patientId = signal<string | null>(null);

  ngOnInit(): void {
    const groupIntervention = this.route.snapshot.paramMap.get('groupIntervention');
    console.log('groupIntervention', groupIntervention);

    const dialogPatientId = this.dialogData?.patientId;

    if (dialogPatientId) {
      this.initializePatientContext(dialogPatientId);
    } else {
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        console.log('id', id);

        if (id) {
          this.initializePatientContext(id);
        }
      });
    }

    this.user = this.authService.getUser();
    this.bindServiceWatcher();

    this.userService
      .getUserById(this.user._id)
      .pipe(switchMap((response) => this.userService.getServicesByProfile(response.user.profile._id)))
      .subscribe((services) => {
        this.services = services;
        const selectedServiceId = this.medicalRecordForm.get('service')?.value;
        if (selectedServiceId) {
          this.updateRescueActionRequirement(selectedServiceId);
        }
      });
  }

  private initializePatientContext(id: string): void {
    this.patientId.set(id);
    this.bindEntryTypeWatcher();

    this.response$ = this.patientService.getPatientById(id).pipe(
      tap((response) => {
        this.patient = response.patient;
        this.latestMedicalRecordWithScheme = this.medicalRecordService.getLastPharmacologicalScheme(response.medicalRecords);
      })
    );
  }

  private bindEntryTypeWatcher(): void {
    if (this.entryTypeWatcherBound) {
      return;
    }

    const entryTypeControl = this.medicalRecordForm.get('entryType');
    if (entryTypeControl) {
      entryTypeControl.valueChanges.subscribe((value) => {
        this.hideServiceSelect = value === 'Informacion';
        if (this.hideServiceSelect) {
          this.medicalRecordForm.get('service')?.reset();
          this.updateRescueActionRequirement(null);
        }
      });
    }

    this.entryTypeWatcherBound = true;
  }

  private bindServiceWatcher(): void {
    if (this.serviceWatcherBound) {
      return;
    }

    const serviceControl = this.medicalRecordForm.get('service');
    if (serviceControl) {
      serviceControl.valueChanges.subscribe((value) => this.updateRescueActionRequirement(value));
      this.serviceWatcherBound = true;
    }
  }

  private updateRescueActionRequirement(serviceId: string | null): void {
    const rescueControl = this.medicalRecordForm.get('rescueAction');
    if (!rescueControl) {
      return;
    }

    const normalizedTarget = 'no se presenta';
    const selectedService = this.services?.find((service) => service._id === serviceId);
    const requiresRescue = selectedService?.description?.toLowerCase().trim() === normalizedTarget;

    this.requiresRescueAction = Boolean(requiresRescue);

    if (this.requiresRescueAction) {
      rescueControl.addValidators(Validators.required);
    } else {
      rescueControl.clearValidators();
      rescueControl.reset();
    }

    rescueControl.updateValueAndValidity();
  }

  public medicalRecordForm: FormGroup = this.fb.group({
    date: [new Date(), [Validators.minLength(3), Validators.required]],
    // entryType: [this.setValueEntryType(), [Validators.required]],
    service: ['', [Validators.minLength(3), Validators.required]],
    //typeContact: ['presencial', [Validators.minLength(3), Validators.required]],
    interventionObjective: ['', []],
    relevantElements: ['', []],
    diagnosticMedic: [''],
    diagnostic: [''],
    pharmacologicalScheme: [''],
    rescueAction: [''],
  });

  // setValueEntryType(){
  //   const valueEntryType = this.data.patient.program.name.includes('PAI') ? ValueEntryType.Distancia : null;
  //   return valueEntryType;
  // }

  onSave() {
    if (this.isSubmitting) {
      return;
    }

    if (this.medicalRecordForm.invalid) {
      this.medicalRecordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    Notiflix.Loading.circle('Registrando atención');

    this.medicalRecordService
      .addMedicalRecord({
        ...this.medicalRecordForm.value,
        patient: this.patientId(),
        registeredBy: this.user._id,
      })
      .subscribe({
        next: (user) => {
          console.log({ user });
          Notiflix.Loading.remove();
          Report.success('Registro exitoso', 'Ficha clínica registrada con éxito', 'Entendido');
          if (this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.router.navigate(['dashboard/patient', this.patientId()]);
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error al registrar ficha clínica', error);
          Report.failure('Error', 'No pudimos registrar la ficha, inténtalo nuevamente', 'Entendido');
          Notiflix.Loading.remove();
          this.isSubmitting = false;
        },
      });
  }

  onCancel() {
    if (this.dialogRef) {
      this.dialogRef.close(false);
      return;
    }

    const targetId = this.patientId();
    if (targetId) {
      this.router.navigate(['dashboard/patient', targetId]);
    }
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
