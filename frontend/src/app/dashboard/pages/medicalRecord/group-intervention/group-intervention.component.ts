import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Report } from 'notiflix';
import { switchMap } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { AuthService } from '../../../../auth/auth.service';
import { User } from '../../../../auth/interfaces/login-response.interface';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { PatientService } from '../../patients/patient.service';
import { diagnosticMap } from '../../patients/detail/diagnosticMap.constant';
import { UserService } from '../../users/user.service';
import { MedicalRecordService } from '../medicalRecord.service';
import { GroupInterventionFormValueSnapshot, GroupInterventionSummaryDialogComponent } from './group-intervention-summary-dialog.component';


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
  templateUrl: './group-intervention.component.html',
  styleUrl: './group-intervention.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GroupInterventionComponent {
  private fb = inject(FormBuilder);
  private medicalRecordService = inject(MedicalRecordService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);

  public patient: Patient;
  public latestMedicalRecordWithScheme: MedicalRecord | null;
  public user: User;
  public services: any[];
  public hideServiceSelect: boolean = false;
  // public data: { patient: Patient; latestMedicalRecordWithScheme: MedicalRecord | null };
  public patients = signal<Patient[]>([]);
  public patientsList = new FormControl<Patient[]>([]);

  readonly panelOpenState = signal(false);

  patientId = signal<string | null>(null);

  programsIds: string[] = [];

  ngOnInit(): void {
    this.user = this.authService.getUser();
    const user = this.userService.getUserById(this.user._id).pipe(
      switchMap( (user: any) =>{
        const userFetched = user.user;        
        const programsIds = userFetched.programs.map( (program: any) => program._id);
        
        return this.patientService.getPatients(programsIds)
      })
    ).subscribe(patients => this.patients.set(patients))
  
    this.userService.getServicesByProfile(this.user.profile._id).subscribe((services) => {
      this.services = services;
      console.log('services', services);
    });
  }

  public groupInterventionForm: FormGroup = this.fb.group({
    date: [new Date(), [Validators.minLength(3), Validators.required]],
    // entryType: [this.setValueEntryType(), [Validators.required]],
    service: ['', [Validators.minLength(3), Validators.required]],
    interventionObjective: ['', [Validators.minLength(3), Validators.required]],
    relevantElements: ['', [Validators.required]],
    diagnostic: [''],
    pharmacologicalScheme: [''],
  });

  onPatientSelected() {
    console.log('onPatientSelected');
    console.log(this.patientsList.value);
  }

  onSave() {
    if (this.groupInterventionForm.invalid) {
      this.groupInterventionForm.markAllAsTouched();
      return;
    }
    
    const selectedPatients = this.patientsList.value ?? [];
    const patients = selectedPatients
      .map((patient) => patient._id)
      .filter((id): id is string => Boolean(id));
    
    this.medicalRecordService
      .addMedicalRecord({
        ...this.groupInterventionForm.value,
        patient: patients,
        registeredBy: this.user._id,
      })
      .subscribe({
        next: (user) => {
          console.log({ user });
          const formSnapshot = this.groupInterventionForm.getRawValue() as GroupInterventionFormValueSnapshot;
          console.log('[formSnapshot 1]', formSnapshot);
          const summaryValues: GroupInterventionFormValueSnapshot = {
            ...formSnapshot,
            service: this.resolveServiceName(formSnapshot.service),
            diagnostic: this.resolveDiagnosticLabel(formSnapshot.diagnostic),
          };
          console.log('[formSnapshot 2]', summaryValues);
          const dialogRef = this.dialog.open(GroupInterventionSummaryDialogComponent, {
            data: {
              patients: selectedPatients,
              formValues: summaryValues,
            },
          });

          dialogRef.afterClosed().subscribe(() => {
            this.router.navigate(['dashboard', 'patients']);
          });
        },
        error: (error) => {
          console.error('Error al registrar intervención grupal', error);
          Report.failure('Error', 'No pudimos registrar la ficha, inténtalo nuevamente', 'Entendido');
        },
      });
  }

  isValidField(field: string): boolean {
    return Boolean(this.groupInterventionForm.controls[field].errors) && this.groupInterventionForm.controls[field].touched;
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

  removePatient(patient: Patient) {
    const current = this.patientsList.value ?? [];
    this.patientsList.setValue(current.filter((p) => p._id !== patient._id));
  }

  private resolveServiceName(serviceId: string | null | undefined): string | null {
    if (!serviceId) {
      return null;
    }

    console.log('[resolveServiceName services]', this.services);
    const service = this.services?.find?.((service: any) => service._id === serviceId);
    console.log('[resolveServiceName sevice]', service);
    return service?.description ?? serviceId;
  }

  private resolveDiagnosticLabel(code: string | null | undefined): string | null {
    if (!code) {
      return null;
    }

    return diagnosticMap[code] ?? code;
  }
}
