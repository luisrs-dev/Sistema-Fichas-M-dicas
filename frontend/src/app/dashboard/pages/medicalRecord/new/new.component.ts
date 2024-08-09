import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../angular-material/material.module';
import { AuthService } from '../../../../auth/auth.service';
import { User } from '../../../../auth/interfaces/login-response.interface';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
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
  ],

  providers: [provideNativeDateAdapter(), DatePipe],

  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NewMedicalRecord {
  private fb = inject(FormBuilder);
  private medicalRecordService = inject(MedicalRecordService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  public patient: Patient;
  public medicalRecord: MedicalRecord;
  public user: User;
  public services: any[];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { patient: Patient; latestMedicalRecord: MedicalRecord }
  ) {}

  ngOnInit() {
    console.log('NewMedicalRecord');
    
    this.user = this.authService.getUser();
    console.log(this.user);
    
    this.userService.getServicesByProfile(this.user.profile._id).subscribe( services => {
      console.log({services});
      this.services = services;
      
    })

    this.patient = this.data.patient;
    this.medicalRecord = { ...this.data.latestMedicalRecord };
  }

  public medicalRecordForm: FormGroup = this.fb.group({
    date: ['', [Validators.minLength(3)]],
    entryType: ['', []],
    intervention: ['', [Validators.minLength(3)]],
    relevantElements: [''],
  });

  onSave() {
    console.log('onsave');

    if (this.medicalRecordForm.invalid) {
      this.medicalRecordForm.markAllAsTouched();
      return;
    }
    this.medicalRecordService
      .addMedicalRecord({
        ...this.medicalRecordForm.value,
        patient: this.data.patient._id,
      })
      .subscribe((user) => {
        console.log({ user });
        this.router.navigate(['/dashboard/patient', this.data.patient._id]);
      });
  }

  isValidField(field: string): boolean {
    return (
      Boolean(this.medicalRecordForm.controls[field].errors) &&
      this.medicalRecordForm.controls[field].touched
    );
  }
}
