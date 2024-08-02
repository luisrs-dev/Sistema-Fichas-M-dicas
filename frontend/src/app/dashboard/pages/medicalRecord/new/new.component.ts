import { catchError } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject,
} from '@angular/core';
import { MaterialModule } from '../../../../angular-material/material.module';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MedicalRecordService } from '../medicalRecord.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '../../../interfaces/user.interface';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { DatePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

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
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  public patient: Patient;
  public medicalRecord: MedicalRecord;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { patient: Patient; latestMedicalRecord: MedicalRecord }
  ) {}

  ngOnInit() {
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
