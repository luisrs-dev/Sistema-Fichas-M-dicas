import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
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
    SocialDiagnosisComponent
  ],
  templateUrl: './admisionForm.component.html',
  styleUrl: './admisionForm.component.css',
})
export default class AdmisionFormComponent {
  private activatedRoute = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private patientId: string;
  public patient: Patient;

  @ViewChild(UserIdentificationComponent) userIdentificationComponent!: UserIdentificationComponent;
  @ViewChild(SocioDemographicComponent) socioDemographicComponent!: SocioDemographicComponent;
  @ViewChild(ConsumerPatternComponent) consumerPatternComponent!: ConsumerPatternComponent;
  @ViewChild(ClinicalDiagnosisComponent) clinicalDiagnosisComponent!: SocialDiagnosisComponent;
  @ViewChild(TreatmentComponent) treatmentComponent!: TreatmentComponent;
  @ViewChild(SocialDiagnosisComponent) socialDiagnosisComponent!: SocialDiagnosisComponent;

  ngOnInit(): void {
    this.patientId = this.activatedRoute.snapshot.paramMap.get('id') || '';
    this.patientService.getPatientById(this.patientId).subscribe((response) => {
      this.patient = response.patient;
      console.log(this.patient);
      
    });
  }
  
  onSave() {
    const userIdentificacionForm = this.userIdentificationComponent.getFormData();
    const sociodemographicForm = this.socioDemographicComponent.getFormData();
    const consumerPatternForm = this.consumerPatternComponent.getFormData();
    const clinicalDiagnosisForm = this.clinicalDiagnosisComponent.getFormData();
    const treatmentForm = this.treatmentComponent.getFormData();
    const socialDiagnosisForm = this.socialDiagnosisComponent.getFormData();

    const allData = {
      ...userIdentificacionForm,
      ...sociodemographicForm,
      ...consumerPatternForm,
      ...clinicalDiagnosisForm,
      ...treatmentForm,
      ...socialDiagnosisForm
    };

    console.log('Datos combinados de todos los formularios:', allData);
    console.log(Object.keys(allData).length);
    
  }
}
