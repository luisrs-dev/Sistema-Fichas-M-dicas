import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Notiflix, { Report } from 'notiflix';
import { Observable } from 'rxjs';
import { ParametersService } from '../../parameters/parameters.service';
import { Parameter, ParameterValue } from '../../parameters/interfaces/parameter.interface';
import { UserService } from '../../users/user.service';
import { AuthService } from '../../../../auth/auth.service';
import moment from 'moment';
import { Patient } from '../../../interfaces/patient.interface';

@Component({
  selector: 'app-new-patient',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, RouterModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './newPatient.component.html',
  styleUrl: './newPatient.component.css',
})
export default class NewPatientComponent {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  public isEditable: boolean = false;
  public registered: boolean = false;
  public registroSistrat: boolean = true;
  public demandRegistered: boolean = false;
  public searchResults$: Observable<any>;
  public programs: Parameter[];
  public patient: Patient;

  public registeredOnFiclin = signal<boolean>(false);

  public userForm: FormGroup = this.fb.group({
    admissionDate: [new Date(), [Validators.required]],
    program: ['', [Validators.required]],
    sistratCenter: ['', [Validators.required]],
    rut: ['', [Validators.required, Validators.minLength(3)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    surname: ['', [Validators.required, Validators.minLength(3)]],
    secondSurname: ['', [Validators.required, Validators.minLength(3)]],
    birthDate: [new Date(), [Validators.required]],
    sex: ['', [Validators.required]],
    region: ['7', [Validators.required]],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    phoneFamily: ['', [Validators.required, Validators.minLength(3)]],
    centerOrigin: ['', [Validators.required, Validators.minLength(3)]],
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

  ngOnInit() {
    const user = this.authService.getUser();
    this.programs = user.programs;

    // Leer id desde la URL (si existe)
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.loadPatient(id); // Función para cargar datos en modo edición
      this.isEditable = true; // Puedes usar esta flag para controlar lógica de edición si es necesario
    }
  }

  private loadPatient(id: string): void {
    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        this.patient = response.patient;
        this.registeredOnFiclin.set(this.patient.registeredOnFiclin!);
        // Patch para evitar borrar las fechas y mantener formato
        this.userForm.patchValue({
          admissionDate: new Date(this.patient.admissionDate),
          program: this.patient.program,
          sistratCenter: this.patient.sistratCenter,
          rut: this.patient.rut,
          name: this.patient.name,
          surname: this.patient.surname,
          secondSurname: this.patient.secondSurname,
          birthDate: new Date(this.patient.birthDate),
          sex: this.patient.sex,
          region: this.patient.region,
          phone: this.patient.phone,
          phoneFamily: this.patient.phoneFamily,
          centerOrigin: this.patient.centerOrigin,
          mainSubstance: this.patient.mainSubstance,
          previousTreatments: this.patient.previousTreatments,
          atentionRequestDate: new Date(this.patient.atentionRequestDate),
          typeContact: this.patient.typeContact,
          whoRequest: this.patient.whoRequest,
          whoDerives: this.patient.whoDerives,
          careOfferedDate: new Date(this.patient.careOfferedDate),
          estimatedMonth: new Date(this.patient.estimatedMonth),
          demandIsNotAccepted: this.patient.demandIsNotAccepted,
          firstAtentionDate: new Date(this.patient.firstAtentionDate),
          atentionResolutiveDate: new Date(this.patient.atentionResolutiveDate),
          interventionAB: this.patient.interventionAB,
          observations: this.patient.observations,
        });

        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar paciente:', err);
        Notiflix.Notify.failure('No se pudo cargar el paciente');
      },
    });
  }

  onSubmit() {
    if (this.registeredOnFiclin()) {
      this.onUpdate();
    } else {
      this.onSave();
    }
  }

  async onSave() {
    Notiflix.Loading.circle('Registrando nueva demanda en Ficlin...');
    if (this.userForm.invalid) {
      const controls = this.userForm.controls;
      this.userForm.markAllAsTouched();
      Notiflix.Loading.remove();
      return;
    }

    const dataUser = this.formatFormDates(this.userForm.value);
    this.patientService.addPatient(dataUser).subscribe((patient) => {
      this.registeredOnFiclin.set(patient.registeredOnFiclin!);
      this.patient = patient;
      this.changeDetectorRef.detectChanges();
      Notiflix.Loading.remove();
      Report.success('Registro exitoso', 'Ahora es posible registrar su ficha demanda', 'Entendido');
      //this.router.navigate(['dashboard/patient/demand', this.patient._id]);
    });
  }

  async onUpdate() {
    Notiflix.Loading.circle('Actualizando Demanda en Ficlin...');
    if (this.userForm.invalid) {
      const controls = this.userForm.controls;
      this.userForm.markAllAsTouched();
      Notiflix.Loading.remove();
      return;
    }

    if (this.patient._id === undefined) return;

    const dataUser = this.formatFormDates(this.userForm.value);
    this.patientService.updatePatient(this.patient._id, dataUser).subscribe((response) => {
      console.log('patient onSave response', response);
      this.changeDetectorRef.detectChanges();
      Notiflix.Loading.remove();
      Report.success('Actualizado con exitoso', '', 'Entendido');
    });
  }

  onSaveDemandOnSistrat() {
    Notiflix.Loading.circle('Registrando Demanda en SISTRAT');

    this.patientService.addFichaDemandaToSistrat(this.patient._id!).subscribe({
      next: (response) => {
        if (response.message === 'Demanda registrada correctamente.') {
          Notiflix.Notify.success('Demanda registrada exitosamente.');
        }
        Notiflix.Loading.remove();
      },
      error: (error) => {
        console.error('Error registrando en SISTRAT:', error);

        Notiflix.Loading.remove();
        Notiflix.Notify.failure('Error registrando demanda en SISTRAT');
      },
    });
  }

  isValidField(field: string): boolean {
    return Boolean(this.userForm.controls[field].errors) && this.userForm.controls[field].touched;
  }

  // Método para convertir todas las fechas a 'DD-MM-YYYY'
  formatFormDates(data: any): any {
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

  get title(): string {
    return this.registeredOnFiclin() ? 'Demanda Registrada' : 'Nueva Demanda';
  }

  get textButtonRegister(): string {
    return this.registeredOnFiclin() ? 'Actualizar' : 'Registrar';
  }
}
