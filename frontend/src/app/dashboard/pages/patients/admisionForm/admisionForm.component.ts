import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
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

@Component({
  selector: 'app-admision-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
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
  @ViewChild(ClinicalDiagnosisComponent) clinicalDiagnosisComponent!: SocialDiagnosisComponent;
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
    // Inicializamos un array para guardar los nombres de los formularios inválidos
    const invalidForms: string[] = [];

    // Validación de cada formulario y si no es válido, se agrega a la lista
    if (!this.userIdentificationComponent.isValidForm()) {
      invalidForms.push('Identificación del Usuario');
    }
    if (!this.socioDemographicComponent.isValidForm()) {
      invalidForms.push('Caracterización Sociodemográfica');
    }
    if (!this.consumerPatternComponent.isValidForm()) {
      invalidForms.push('Patrón de Consumo');
    }
    if (!this.clinicalDiagnosisComponent.isValidForm()) {
      invalidForms.push('Diagnóstico Clínico');
    }
    if (!this.treatmentComponent.isValidForm()) {
      invalidForms.push('Tratamiento');
    }
    if (!this.socialDiagnosisComponent.isValidForm()) {
      invalidForms.push('Diagnóstico Social');
    }

    // Si la lista tiene formularios inválidos, los mostramos
    if (invalidForms.length > 0) {
      console.log('Los siguientes formularios son inválidos:', invalidForms);
      // Aquí puedes mostrar un mat-dialog con la lista de formularios inválidos
      //this.openInvalidFormsDialog(invalidForms);

      this.dialog.open(InvalidFormsDialogComponent, {
        data: { invalidForms }, // Pasar la lista de formularios inválidos al diálogo
      });
    } else {
      console.log('Todos los formularios son válidos');
      // Puedes proceder con la acción si todos los formularios son válidos
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
            const errorMessage = typeof err === 'string' ? err : 'Ocurrió un error al registrar en SISTRAT. Por favor, intenta nuevamente.';
            Notiflix.Report.failure(
              'Error',
              errorMessage,
              'Cerrar'
            );
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
}
