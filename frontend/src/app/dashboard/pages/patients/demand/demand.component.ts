import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { MaterialModule } from '../../../../angular-material/material.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Notiflix, { Report } from 'notiflix';
import { PatientService } from '../patient.service';
import { Patient } from '../../../interfaces/patient.interface';
import { ActivatedRoute } from '@angular/router';
import moment from 'moment';
import { provideNativeDateAdapter } from '@angular/material/core';
import { catchError, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-demand',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule],
  providers: [provideNativeDateAdapter()],

  templateUrl: './demand.component.html',
  //changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemandComponent {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private activatedRoute = inject(ActivatedRoute);
  private changeDetectorRef = inject(ChangeDetectorRef);

  public patientId: string;
  public patient: Patient;
  public registeredDemand: boolean = false;

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
    this.activatedRoute.params
      .pipe(
        switchMap(({ id }) =>
          this.patientService.getPatientById(id).pipe(
            map((response) => response?.patient), // Extrae solo el patient
            catchError((error) => {
              console.error(`Error al obtener el paciente: ${error}`);
              return of(null);
            })
          )
        )
      )
      .subscribe((patient) => {
        if (patient) {
          this.patient = patient;
          console.log(this.patient);
          this.changeDetectorRef.detectChanges();
        }
        return;
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
    Notiflix.Loading.circle('Registrando Demanda en SISTRAT');

    this.patientService.addFichaDemandaToSistrat(this.patient._id!).subscribe(
      {
        next: (response) => {
          console.log('response on addFichaDemandaToSistrat');
          console.log({ response });
  
          // Aquí puedes manejar la respuesta como necesites
          if (response.message === "Demanda registrada correctamente.") {
            Notiflix.Notify.success('Demanda registrada exitosamente.');
          }
  
          // Eliminar el loading solo después de manejar la respuesta
          Notiflix.Loading.remove();
        },
        error: (error) => {
          console.error('Error registrando en SISTRAT:', error);
          
          // Eliminar el loading en caso de error
          Notiflix.Loading.remove(); 
          Notiflix.Notify.failure('Error registrando demanda en SISTRAT');
        },
      }

      //  (response) =>
      //  {
      //  console.log('response on addFichaDemandaToSistrat');
      //  Notiflix.Loading.remove();
      //  console.log({ response });
      //}
    );
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
}
