import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, startWith, switchMap, pipe, map } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PdfService } from '../../../../shared/services/Pdf.service';
import { MedicalRecord } from '../../../interfaces/medicalRecord.interface';
import { Patient } from '../../../interfaces/patient.interface';
import NewMedicalRecord from '../../medicalRecord/new/new.component';
import { PatientService } from '../patient.service';
import { Report } from 'notiflix';
import { toSignal } from '@angular/core/rxjs-interop'; // Convierte Observable a Signal

interface State {
  patient: Patient | null;
  medicalRecords: MedicalRecord[];
  loading: boolean;
}

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [MaterialModule, MatExpansionModule, CommonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, DatePipe, RouterLink],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // 👈 Muy importante
})
export default class DetailComponent {
  public dialog = inject(MatDialog);
  private patientService = inject(PatientService);
  private pdfService = inject(PdfService);
  private datePipe = inject(DatePipe);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);


  patientId = signal<string | null>(null);
  private route = inject(ActivatedRoute);

  #state = signal<State>({
    loading: true,
    patient: null,
    medicalRecords: [],
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.patientId.set(id);
    });
  }

  // Signal principal que obtiene toda la respuesta (paciente + fichas médicas)
  responseGetPatientById = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) => this.patientService.getPatientById(id!))
    ),
    { initialValue: null }
  );

  // Signals derivados con computed()
  patient = computed(() => this.responseGetPatientById()?.patient ?? null);
  medicalRecords = computed(() => this.responseGetPatientById()?.medicalRecords ?? []);

  newMedicalRecord() {
    console.log('newMedicalRecord');

    // this.medicalRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    // const latestMedicalRecordWithScheme = this.medicalRecords.find((record) => record.pharmacologicalScheme);

    // const dialogRef = this.dialog.open(NewMedicalRecord, {
    //   width: '80%',
    //   height: '95%',
    //   data: { patient: this.patient, latestMedicalRecordWithScheme },
    // });

    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result) {
    //     this.loadMedicalRecords();
    //   } else {
    //   Report.failure('Error', 'El registro no se pudo completar', 'Entendido');
    //   }
    // });
  }

  generatePdf() {
    console.log('generatePdf');
    console.log(this.medicalRecords());

    console.log('this.patientId()!', this.patientId()!);

    this.patientService.getPdfByPatientId(this.patientId()!).subscribe((blob) => {
      console.log(blob);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historial-${this.patientId()!}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // const medicalRecordsToPdf = this.medicalRecords().map((medicalRecord) => {
    //     return {
    //       ...medicalRecord,
    //       date: this.datePipe.transform(medicalRecord.date, 'dd-MM-yyyy')!,
    //     };
    //   });
    //   this.pdfService.generateClinicalRecordsPdf(medicalRecordsToPdf);
  }

  onNewMedicalRecord(){
    console.log('redirigiendo a  nueva ficha');
    this.router.navigate(['dashboard/patient', this.patientId(), 'ficha-clinica', 'nueva']);
  }
}
