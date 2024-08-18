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
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PdfService } from '../../../../shared/services/Pdf.service';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import NewMedicalRecord from '../../medicalRecord/new/new.component';
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
    DatePipe,
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
  private pdfService = inject(PdfService);
  private datePipe = inject(DatePipe);

  public patient: Patient;
  public medicalRecords: MedicalRecord[] = [];

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(switchMap(({ id }) => this.patientService.getPatientById(id)))
      .subscribe(({ patient, medicalRecords }) => {
        this.patient = patient;
        this.medicalRecords = medicalRecords;
        console.log({ medicalRecords: this.medicalRecords });
        this.changeDetectorRef.detectChanges();
      });
  }

  newMedicalRecord() {
    this.medicalRecords.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestMedicalRecordWithScheme = this.medicalRecords.find(
      (record) => record.pharmacologicalScheme
    );

    this.dialog.open(NewMedicalRecord, {
      width: '80%',
      height: '95%',
      data: { patient: this.patient, latestMedicalRecordWithScheme },
    });
  }

  generatePdf() {
    const medicalRecordsToPdf = this.medicalRecords.map((clinicalRecord) => {
      return {
        ...clinicalRecord,
        date: this.datePipe.transform(clinicalRecord.date, 'dd-MM-yyyy')!,
      };
    });
    this.pdfService.generateClinicalRecordsPdf(medicalRecordsToPdf);
  }
}
