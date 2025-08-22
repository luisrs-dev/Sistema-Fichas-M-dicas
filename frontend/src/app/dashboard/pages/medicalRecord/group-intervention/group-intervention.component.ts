
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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Report } from 'notiflix';
import { Observable } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { AuthService } from '../../../../auth/auth.service';
import { User } from '../../../../auth/interfaces/login-response.interface';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
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
    MatExpansionModule
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
  public patientsList  = new FormControl('');
  public patientsListNames: string[]  = [];


  readonly panelOpenState = signal(false);

  patientId = signal<string | null>(null);

  programsIds: string[] = [];

  ngOnInit(): void {
    


    this.user = this.authService.getUser();
    this.programsIds = this.user.programs.map((program) => program._id);
    console.log('programsIDs', this.programsIds);
       this.patientService.getPatients(this.programsIds).subscribe((patients) => {
        console.log('patients', patients);
        this.patients.set(patients);
        this.patientsListNames = this.patients().map( patient => patient.name);
      });
    

    //this.user = this.authService.getUser();
    //console.log('this.user', this.user);

    //this.userService.getServicesByProfile(this.user.profile._id).subscribe((services) => {
    //  this.services = services;
    //  console.log('services', services);
    //});
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

  // setValueEntryType(){
  //   const valueEntryType = this.data.patient.program.name.includes('PAI') ? ValueEntryType.Distancia : null;
  //   return valueEntryType;
  // }

  onSave() {
    if (this.groupInterventionForm.invalid) {
      this.groupInterventionForm.markAllAsTouched();
      return;
    }
    this.medicalRecordService
      .addMedicalRecord({
        ...this.groupInterventionForm.value,
        patient: this.patientId(),
        registeredBy: this.user._id
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
    return Boolean(this.groupInterventionForm.controls[field].errors) && this.groupInterventionForm.controls[field].touched;
  }

  get fullName(): string{
    return  `${this.patient.name} ${this.patient.secondSurname}`;
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

  removePatient(patient: any){
    console.log('remove patient: ',patient);
    
  }

}
