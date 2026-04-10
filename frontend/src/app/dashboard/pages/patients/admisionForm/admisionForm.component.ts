import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../angular-material/material.module';
import { Patient } from '../../../interfaces/patient.interface';
import { PatientService } from '../patient.service';
import { ClinicalDiagnosisComponent } from './components/clinicalDiagnosis/clinicalDiagnosis.component';
import { ConsumerPatternComponent } from './components/consumerPattern/consumerPattern.component';
import { SocialDiagnosisComponent } from './components/socialDiagnosis/socialDiagnosis.component';
import { SocioDemographicComponent } from './components/socioDemographic/socioDemographic.component';
import { TreatmentComponent } from './components/treatment/treatment.component';
import { UserIdentificationComponent } from './components/userIdentification/userIdentification.component';
import { MatDialog } from '@angular/material/dialog';
import { InvalidFormsDialogComponent } from './components/invalidFormsDialog/invalidFormsDialog.component';
import Notiflix from 'notiflix';
import { AdmissionForm } from '../../../interfaces/admissionForm.interface';
import { MONDAY_FIRST_DATE_PROVIDERS } from '../../../../shared/date/monday-first-date-adapter';

@Component({
  selector: 'app-admision-form',
  standalone: true,
  providers: [...MONDAY_FIRST_DATE_PROVIDERS],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    UserIdentificationComponent,
    SocioDemographicComponent,
    ConsumerPatternComponent,
    ClinicalDiagnosisComponent,
    TreatmentComponent,
    SocialDiagnosisComponent,
    InvalidFormsDialogComponent,
  ],
  templateUrl: './admisionForm.component.html',
  styleUrl: './admisionForm.component.css',
})
export default class AdmisionFormComponent {
  private activatedRoute = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private dialog = inject(MatDialog);
  private changeDetectorRef = inject(ChangeDetectorRef);
  public loading = signal<boolean>(true);

  private patientId: string;
  public patient: Patient | null = null;
  public admissionForm: AdmissionForm | null = null;
  public admissionFormRegistered: boolean = false;
  public editMode: boolean = false;

  @ViewChild(UserIdentificationComponent) userIdentificationComponent!: UserIdentificationComponent;
  @ViewChild(SocioDemographicComponent) socioDemographicComponent!: SocioDemographicComponent;
  @ViewChild(ConsumerPatternComponent) consumerPatternComponent!: ConsumerPatternComponent;
  @ViewChild(ClinicalDiagnosisComponent) clinicalDiagnosisComponent!: ClinicalDiagnosisComponent;
  @ViewChild(TreatmentComponent) treatmentComponent!: TreatmentComponent;
  @ViewChild(SocialDiagnosisComponent) socialDiagnosisComponent!: SocialDiagnosisComponent;

  ngOnInit(): void {
    
    this.patientId = this.activatedRoute.snapshot.paramMap.get('id') || '';
    console.log({patientId:this.patientId});

    // En el caso que paciente tenga ficha de ingreso registrada en ficlin,
    // se obtiene el registro para rellenar los formularios para luego registrar en SISTRAT
    this.patientService.getFichaIngreso(this.patientId).subscribe((response) => {
      console.log('getFichaIngreso response', response);

      this.patient = response.data.patient;
      console.log('patient', this.patient);
      
      this.admissionForm = response.data.admissionForm;
      console.log('admissionForm', this.admissionForm);
      // if(this.patient && this.admissionForm)
      
      if (this.patient && this.patient.registeredAdmissionForm) {
        this.editMode = true;
      }
      this.loading.set(false);
    });
  }

  onSave() {
    const invalidForms: any[] = [];

    // Validación de cada formulario y si no es válido, se agrega a la lista con sus campos
    if (!this.userIdentificationComponent.isValidForm()) {
      invalidForms.push({
        title: 'Identificación del Usuario',
        fields: this.userIdentificationComponent.getInvalidFieldsWithLabels(this.userIdentificationComponent.fieldLabels)
      });
    }
    if (!this.socioDemographicComponent.isValidForm()) {
      invalidForms.push({
        title: 'Caracterización Sociodemográfica',
        fields: this.socioDemographicComponent.getInvalidFieldsWithLabels(this.socioDemographicComponent.fieldLabels)
      });
    }
    if (!this.consumerPatternComponent.isValidForm()) {
      invalidForms.push({
        title: 'Patrón de Consumo',
        fields: this.consumerPatternComponent.getInvalidFieldsWithLabels(this.consumerPatternComponent.fieldLabels)
      });
    }
    if (!this.clinicalDiagnosisComponent.isValidForm()) {
      invalidForms.push({
        title: 'Diagnóstico Clínico',
        fields: this.clinicalDiagnosisComponent.getInvalidFieldsWithLabels(this.clinicalDiagnosisComponent.fieldLabels)
      });
    }
    if (!this.treatmentComponent.isValidForm()) {
      invalidForms.push({
        title: 'Tratamiento',
        fields: this.treatmentComponent.getInvalidFieldsWithLabels(this.treatmentComponent.fieldLabels)
      });
    }
    if (!this.socialDiagnosisComponent.isValidForm()) {
      invalidForms.push({
        title: 'Diagnóstico Social',
        fields: this.socialDiagnosisComponent.getInvalidFieldsWithLabels(this.socialDiagnosisComponent.fieldLabels)
      });
    }

    // Si la lista tiene formularios inválidos, los mostramos
    if (invalidForms.length > 0) {
      console.log('Los siguientes formularios son inválidos:', invalidForms);

      this.dialog.open(InvalidFormsDialogComponent, {
        data: { invalidForms }, // Pasar la lista detallada al diálogo
        width: '500px'
      });
      return; // Detenemos la ejecución si hay errores
    } else {
      console.log('Todos los formularios son válidos');
    }

    const userIdentificacionForm = this.userIdentificationComponent.getFormData();
    const sociodemographicForm = this.socioDemographicComponent.getFormData();
    const consumerPatternForm = this.consumerPatternComponent.getFormData();
    const clinicalDiagnosisForm = this.clinicalDiagnosisComponent.getFormData();
    const treatmentForm = this.treatmentComponent.getFormData();
    const socialDiagnosisForm = this.socialDiagnosisComponent.getFormData();

    const dataAdmidssonForm = {
      ...userIdentificacionForm,
      ...sociodemographicForm,
      ...consumerPatternForm,
      ...clinicalDiagnosisForm,
      ...treatmentForm,
      ...socialDiagnosisForm,
    };

    console.log('Datos combinados de todos los formularios:', dataAdmidssonForm);
    console.log(Object.keys(dataAdmidssonForm).length);

    if (this.editMode) {
      
      this.patientService.updateFichaIngreso(this.patient!._id!, dataAdmidssonForm).subscribe((response) => {
        Notiflix.Notify.success('Ficha de ingreso actualizda');
      });
    }

    if (!this.editMode) {
      this.patientService.addFichaIngreso(this.patient!._id!, dataAdmidssonForm).subscribe((response) => {
        if (response.patient.registeredAdmissionForm) {
          Notiflix.Notify.success('Ficha de ingreso registrada');

          this.admissionFormRegistered = true;
          this.editMode = true;
          this.changeDetectorRef.detectChanges();
        }
      });
    }
  }

  onSaveSistrat() {
    Notiflix.Confirm.show(
      '¿Está seguro?',
      'Esta acción es irreversible y no podrá modificar la información.',
      'Si',
      'No',
      () => {
        // Success
        Notiflix.Loading.circle('Registrando Ficha de ingreso en SISTRAT');

        this.patientService.addFichaIngresoToSistrat(this.patient!._id!).subscribe({
          next: (response) => {
            console.log(response);
            if (response.success) {
              this.admissionFormRegistered = true;
              Notiflix.Notify.success('Ficha de ingreso registrada en SISTRAT');
            } else {
              Notiflix.Report.warning(
                'Atención',
                response.message || 'No fue posible registrar en SISTRAT',
                'Cerrar'
              );
            }
            Notiflix.Loading.remove();
          },
          error: (err) => {
            console.error('Error al agregar ficha de ingreso a Sistrat:', err);
            Notiflix.Loading.remove();
            
            const errorMessage = typeof err === 'string' ? err : (err.error?.message || err.message || 'Ocurrió un error al registrar en SISTRAT. Por favor, intenta nuevamente.');

            // Si el error indica que faltan campos (detectado por el backend)
            if (errorMessage.includes('SISTRAT_VALIDATION_ERROR:')) {
              const fieldsString = errorMessage.split('SISTRAT_VALIDATION_ERROR:')[1];
              const fields = fieldsString.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);

              this.dialog.open(InvalidFormsDialogComponent, {
                data: {
                  invalidForms: [{
                    title: 'Validación SISTRAT (Campos requeridos)',
                    fields: fields
                  }]
                },
                width: '500px'
              });
            } else {
              Notiflix.Report.failure(
                'Error',
                errorMessage,
                'Cerrar'
              );
            }
          }
        });
        console.log('Registrar en SISTRAT');
      },
      () => {
        // Cancel
        console.log('Cancelado registro en SISTRAT');
      }
    );

    return;
  }

  // Eliminado: el backend ahora se encarga de parsear el popup de SISTRAT
}
