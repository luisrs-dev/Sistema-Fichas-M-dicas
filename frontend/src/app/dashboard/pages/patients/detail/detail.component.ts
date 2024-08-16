import { UserService } from './../../users/user.service';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MaterialModule } from '../../../../angular-material/material.module';
import { User } from '../../../interfaces/user.interface';
import NewMedicalRecord from '../../medicalRecord/new/new.component';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { PatientService } from '../patient.service';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [
    MaterialModule,
    MatExpansionModule,
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    DatePipe
  ],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DetailComponent {
  public dialog = inject(MatDialog);
  private activatedRoute = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  public patient: Patient;
  public medicalRecords: MedicalRecord[] = [];

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(switchMap(({ id }) => this.patientService.getPatientById(id)))
      .subscribe(({ patient, medicalRecords }) => {
        this.patient = patient;
        this.medicalRecords = medicalRecords;
        console.log({medicalRecords: this.medicalRecords});
        this.changeDetectorRef.detectChanges();
      });
  }
  
  newMedicalRecord() {
    let latestMedicalRecord: MedicalRecord|null = null;
    //if(this.medicalRecords.length > 0){
    //  latestMedicalRecord = this.medicalRecords.reduce(
    //    (latest, current) => {
    //      return new Date(latest.createdAt) > new Date(current.createdAt)
    //        ? latest
    //        : current;
    //    }
    //  );
    //}   

    this.medicalRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    // Capturar el más reciente que tenga el campo pharmacologicalScheme registrado
    const latestMedicalRecordWithScheme = this.medicalRecords.find(record => record.pharmacologicalScheme);


    this.dialog.open(NewMedicalRecord, {
      width: '80%',
      height: '95%',
      data: { patient: this.patient, latestMedicalRecordWithScheme},
    });
  }
}
