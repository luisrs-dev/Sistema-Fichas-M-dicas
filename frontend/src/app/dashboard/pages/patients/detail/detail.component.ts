import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PdfService } from '../../../../shared/services/Pdf.service';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import NewMedicalRecord from '../../medicalRecord/new/new.component';
import { PatientService } from '../patient.service';
import { Report } from 'notiflix';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [MaterialModule, MatExpansionModule, CommonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, DatePipe],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css',
})
export default class DetailComponent {
  public dialog = inject(MatDialog);
  private activatedRoute = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private pdfService = inject(PdfService);
  private datePipe = inject(DatePipe);
  private snackBar = inject(MatSnackBar);

  public patient: Patient;
  public medicalRecords: MedicalRecord[] = [];
  public patientId: string;
  public medicalRecords$: Observable<{ patient: Patient; medicalRecords: MedicalRecord[] }>; // Observable que contendrá las fichas médicas

  ngOnInit(): void {
    this.patientId = this.activatedRoute.snapshot.paramMap.get('id') || '';
    this.patientService.patient.subscribe((response) => {
      if (response) {
        console.log('suscripcion');
        console.log(response);

        this.patient = response?.patient;
        this.medicalRecords = response?.medicalRecords;
      }
    });
    this.loadMedicalRecords();
  }

  loadMedicalRecords(): void {
    this.patientService.getPatientById(this.patientId).subscribe((response) => {
      if (response) {
        this.patient = response.patient;
        this.medicalRecords = response.medicalRecords;
      }
    });
  }

  newMedicalRecord() {
    this.medicalRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestMedicalRecordWithScheme = this.medicalRecords.find((record) => record.pharmacologicalScheme);

    const dialogRef = this.dialog.open(NewMedicalRecord, {
      width: '80%',
      height: '95%',
      data: { patient: this.patient, latestMedicalRecordWithScheme },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMedicalRecords();
      } else {
      Report.failure('Error', 'El registro no se pudo completar', 'Entendido');        
      }
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
