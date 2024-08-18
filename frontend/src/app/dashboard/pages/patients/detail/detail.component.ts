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
import { map, Observable, switchMap } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PdfService } from '../../../../shared/services/Pdf.service';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import NewMedicalRecord from '../../medicalRecord/new/new.component';
import { PatientService } from '../patient.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  styleUrl: './detail.component.css'
})
export default class DetailComponent {
  public dialog = inject(MatDialog);
  private activatedRoute = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private pdfService = inject(PdfService);
  private datePipe = inject(DatePipe);
  private snackBar = inject(MatSnackBar);

  public patient: Patient;
  public medicalRecords: MedicalRecord[] = [];  
  public patientId: string;
  public medicalRecords$: Observable<MedicalRecord[]>; // Observable que contendrá las fichas médicas

  ngOnInit(): void {
    this.patientId = this.activatedRoute.snapshot.paramMap.get('id') || '';
    this.loadMedicalRecords();
  }

    loadMedicalRecords() {
      this.medicalRecords$ = this.patientService.getPatientById(this.patientId).pipe(
        map(({patient, medicalRecords}) => {
          this.patient = patient;
          this.medicalRecords = medicalRecords;
          return medicalRecords;
        })
      );
    }

  newMedicalRecord() {
    this.medicalRecords.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestMedicalRecordWithScheme = this.medicalRecords.find(
      (record) => record.pharmacologicalScheme
    );
  
    const dialogRef = this.dialog.open(NewMedicalRecord, {
      width: '80%',
      height: '95%',
      data: { patient: this.patient, latestMedicalRecordWithScheme },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Muestra un mensaje de éxito cuando se cierra el diálogo con éxito
        this.snackBar.open('Registro exitoso', 'Cerrar', {
          duration: 3000, // Duración en milisegundos
        });

        this.loadMedicalRecords();
        //this.changeDetectorRef.detectChanges();


        // Realiza otras acciones necesarias, como actualizar la lista de registros médicos, etc.
      } else {
        // Manejar el caso de fallo o cierre sin éxito si es necesario
        this.snackBar.open('El registro no se pudo completar', 'Cerrar', {
          duration: 3000,
        });
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
