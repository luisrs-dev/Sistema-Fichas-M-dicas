import { ViewChild } from '@angular/core';
import { DemandProgressComponent } from '../components/demand-progress/demand-progress.component';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { MaterialModule } from '../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Notiflix, { Report } from 'notiflix';
import { PatientService } from '../patient.service';
import { Patient } from '../../../interfaces/patient.interface';
import { ActivatedRoute } from '@angular/router';
import moment from 'moment';
import { catchError, map, of, switchMap } from 'rxjs';
import { Demand } from '../../../interfaces/demand.interface';
import { MONDAY_FIRST_DATE_PROVIDERS } from '../../../../shared/date/monday-first-date-adapter';

@Component({
  selector: 'app-demand',
  standalone: true,
  imports: [DemandProgressComponent, CommonModule, MaterialModule, ReactiveFormsModule, FormsModule],
  providers: [...MONDAY_FIRST_DATE_PROVIDERS],

  templateUrl: './demand.component.html',
  //changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemandComponent {
  @ViewChild(DemandProgressComponent) demandProgress?: DemandProgressComponent;
  public demandSyncBusy = false;
  refreshAfterDemand() {
    if (!this.patient?._id) return;
    this.patientService.getPatientById(this.patient._id).subscribe(response => {
      this.patient = response.patient;
      this.changeDetectorRef.detectChanges();
    });
  }
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private activatedRoute = inject(ActivatedRoute);
  private changeDetectorRef = inject(ChangeDetectorRef);

  public patientId: string;
  public patient: Patient;
  public registeredDemand: boolean = false;
  public demand: Demand;

  public demandForm: FormGroup = this.fb.group({
    mainSubstance: ['', [Validators.required]],
    previousTreatments: ['', [Validators.required]],
    atentionRequestDate: [new Date()],
    typeContact: ['', [Validators.required]],
    whoRequest: ['', [Validators.required]],
    whoDerives: ['', [Validators.required]],
    careOfferedDate: [new Date()],
    estimatedMonth: [new Date(), []],
    demandIsNotAccepted: ['', []],
    firstAtentionDate: [new Date()],
    atentionResolutiveDate: [new Date()],
    interventionAB: ['', []],
    observations: ['', []],
  });

  ngOnInit(): void {

    this.patientId = this.activatedRoute.snapshot.paramMap.get('id') || '';
    console.log({patientId:this.patientId});

    // En el caso que paciente tenga demanda registrada en ficlin,
    // se obtiene el registro para rellenar los formularios para luego registrar en SISTRAT
    this.patientService.getDemandaByPatientId(this.patientId).subscribe((response) => {
      console.log('demanda response', response);
      this.patient = response.data.patient;
      if(response.data.demand){
        this.demand = response.data.demand;
        this.fillFormWithAdmissionData();
      }
      this.changeDetectorRef.detectChanges();
    });
  }

  onSaveDemand() {
    if (this.demandForm.invalid) {
      this.demandForm.markAllAsTouched();
      return;
    }

    Notiflix.Loading.circle('Registrando ficha demanda...');

    const formDataFormated = this.formatFormDates(this.demandForm.value); // Convertir fechas

    this.patientService.addFichaDemanda(this.patient?._id!, formDataFormated).subscribe({
      next: (response) => {
        Notiflix.Loading.remove();
        Report.success('Registro exitoso', 'Ahora es posible registrar la demanda en SISTRAT', 'Entendido');
        this.registeredDemand = true;

        console.log({registeredDemand:this.registeredDemand});


      },
      error: (error) => {
        Notiflix.Loading.remove();
        Notiflix.Report.failure('Error',`Error registrando demanda. Error: ${error}`, 'Entendido');
        //Notiflix.Notify.failure(`Error registrando demanda. Error: ${error}`);
      }

    })


    //});
  }

  onSaveDemandOnSistrat() {
    this.demandProgress?.start();
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Método para convertir todas las fechas a 'DD-MM-YYYY'
  private formatFormDates(data: any): any {
    const formValues = { ...data }; // Clonar los valores del formulario

    // Iterar sobre cada control del formulario
    for (const key in formValues) {
      if (formValues.hasOwnProperty(key) && formValues[key] instanceof Date) {
        // Formatear las fechas usando moment.js
        formValues[key] = moment(formValues[key]).format('DD/MM/YYYY');
      }
    }

    return formValues;
  }

  fillFormWithAdmissionData() {
    if (!this.demand || !this.demandForm) return;

    Object.keys(this.demandForm.controls).forEach((field) => {
      // Verifica si el campo existe en `demand`
      if (this.demand && field in this.demand) {
        // Usa el casting para evitar el error de tipos
        let value = (this.demand as any)[field];

        // Verificar si el campo es una fecha y convertirlo
        if (this.isDateField(field) && value) {
          value = this.convertToDate(value);
        }

        if (value !== undefined) {
          this.demandForm.get(field)?.setValue(value);
        }
      }
    });
  }

  // Detecta qué campos son de tipo fecha
  private isDateField(field: string): boolean {
    return [
      'atentionRequestDate',
      'careOfferedDate',
      'estimatedMonth',
      'firstAtentionDate',
      'atentionResolutiveDate',
    ].includes(field);
  }

  // Convierte "dd/MM/yyyy" o formato ISO a objeto Date
  private convertToDate(value: string): Date {
    // Si ya es una fecha válida en formato ISO
    if (!isNaN(Date.parse(value))) {
      return new Date(value);
    }

    // Si el formato es dd/MM/yyyy
    const dateParts = value.split('/');
    if (dateParts.length === 3) {
      const [day, month, year] = dateParts.map(Number);
      return new Date(year, month - 1, day); // Mes empieza en 0 (Enero = 0)
    }

    throw new Error(`Formato de fecha no reconocido: ${value}`);
  }
}
