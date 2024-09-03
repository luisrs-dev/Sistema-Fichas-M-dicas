import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../../angular-material/material.module';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PatientService } from '../patient.service';
import { Patient } from '../../../interfaces/patient.interface';
import { UserIdentificationComponent } from './components/userIdentification/userIdentification.component';

@Component({
  selector: 'app-admision-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, UserIdentificationComponent],
  templateUrl: './admisionForm.component.html',
  styleUrl: './admisionForm.component.css',
})
export default class AdmisionFormComponent {
  private activatedRoute = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private fb = inject(FormBuilder);
  
  private patientId: string;
  public patient: Patient;

  @ViewChild(UserIdentificationComponent) userIdentificationComponent!: UserIdentificationComponent;


  ngOnInit(): void {
    this.patientId = this.activatedRoute.snapshot.paramMap.get('id') || '';
    console.log(this.patientId);
    this.patientService.getPatientById(this.patientId).subscribe( response => {
      console.log(response);
      this.patient = response.patient;
      //this.setValuesToForm();

    })
  }
  
  onSave(){
    console.log('save');
  }

  //setValuesToForm(){
  //  if(!this.patient) return;
  //    this.userForm.patchValue({
  //      name: this.patient.name,
  //      surname: this.patient.surname,
  //      secondSurname: this.patient.secondSurname,
  //      birthDate: new Date(this.patient.birthDate),
  //      sex: this.patient.sex,
  //      region: this.patient.region,
  //      phone: this.patient.phone,
  //      phoneFamily: this.patient.phoneFamily,
  //      centerOrigin: this.patient.centerOrigin,
  //      // Otros campos que coincidan con los del formulario
  //    });
  //}

}
