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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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
import { ValueEntryType } from '../../../interfaces/entryType.interface';

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

  private dialogRef= inject(MatDialogRef<NewMedicalRecord>); // Inyecta MatDialogRef para poder cerrar el diálogo


  public patient: Patient;
  public latestMedicalRecordWithScheme: MedicalRecord;
  public user: User;
  public services: any[];
  public hideServiceSelect: boolean = false;
  public selectedEntryType: string | null = '';

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { patient: Patient; latestMedicalRecordWithScheme: MedicalRecord | null }
  ) {}

  ngOnInit() {
    
    this.user = this.authService.getUser();
    
    this.userService.getServicesByProfile(this.user.profile._id).subscribe( services => {
      this.services = services;
    })

    this.patient = this.data.patient;
    this.latestMedicalRecordWithScheme = { ...this.data.latestMedicalRecordWithScheme! };
    
    if(this.data.patient.program.name.includes('PAI')){
      this.selectedEntryType=ValueEntryType.Distancia;      
    }

    // Escucha los cambios en el campo entryType
    this.medicalRecordForm.get('entryType')?.valueChanges.subscribe((value) => {
      this.hideServiceSelect = value === 'Informacion';
      if (this.hideServiceSelect) {
        this.medicalRecordForm.get('service')?.reset();  // Resetea el campo service si se oculta
      }
    });


  }

  public medicalRecordForm: FormGroup = this.fb.group({
    date: [new Date(), [Validators.minLength(3),Validators.required]],
    entryType: [this.setValueEntryType(), [Validators.required]],
    service: ['', [Validators.minLength(3), Validators.required]],
    relevantElements: ['',[Validators.required]],
    diagnostic: [''],
    pharmacologicalScheme: [''],  
  });
  
  setValueEntryType(){
    const valueEntryType = this.data.patient.program.name.includes('PAI') ? ValueEntryType.Distancia : null;
    return valueEntryType;
  }

  onSave() {
    if (this.medicalRecordForm.invalid) {
      this.medicalRecordForm.markAllAsTouched();
      return;
    }
    this.medicalRecordService
      .addMedicalRecord({
        ...this.medicalRecordForm.value,
        patient: this.data.patient._id,
        registeredBy: this.user._id 
      })
      .subscribe((user) => {
        console.log({ user });
        this.dialogRef.close(true);
      });
  }

  isValidField(field: string): boolean {
    return (
      Boolean(this.medicalRecordForm.controls[field].errors) &&
      this.medicalRecordForm.controls[field].touched
    );
  }
}
