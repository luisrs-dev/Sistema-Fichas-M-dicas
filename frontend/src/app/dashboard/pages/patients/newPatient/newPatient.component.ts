import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Notiflix, { Report } from 'notiflix';
import { Observable } from 'rxjs';
import { ParametersService } from '../../parameters/parameters.service';
import { Parameter, ParameterValue } from '../../parameters/interfaces/parameter.interface';
import { UserService } from '../../users/user.service';
import { AuthService } from '../../../../auth/auth.service';
import moment from 'moment';
import { Patient } from '../../../interfaces/patient.interface';
import { MONDAY_FIRST_DATE_PROVIDERS } from '../../../../shared/date/monday-first-date-adapter';
import { SistratCenter, SistratCenterService } from '../../../services/sistratCenter.service';
import { MatStepper } from '@angular/material/stepper';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-new-patient',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, RouterModule],
  providers: [...MONDAY_FIRST_DATE_PROVIDERS],
  templateUrl: './newPatient.component.html',
  styleUrl: './newPatient.component.css',
})
export default class NewPatientComponent {
  @ViewChild('stepper') private stepper: MatStepper;

  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private router = inject(Router);
  private sistratCenterService = inject(SistratCenterService);
  
  public comunasMaule = [
    { value: '140', name: 'CURICO' },
    { value: '141', name: 'ROMERAL' },
    { value: '142', name: 'TENO' },
    { value: '143', name: 'RAUCO' },
    { value: '144', name: 'HUALAÑE' },
    { value: '145', name: 'LICANTEN' },
    { value: '146', name: 'VICHUQUEN' },
    { value: '147', name: 'MOLINA' },
    { value: '148', name: 'SAGRADA FAMILIA' },
    { value: '149', name: 'RIO CLARO' },
    { value: '150', name: 'TALCA' },
    { value: '151', name: 'SAN CLEMENTE' },
    { value: '152', name: 'PELARCO' },
    { value: '153', name: 'PENCAHUE' },
    { value: '154', name: 'MAULE' },
    { value: '155', name: 'CUREPTO' },
    { value: '156', name: 'SAN JAVIER' },
    { value: '157', name: 'CONSTITUCION' },
    { value: '158', name: 'EMPEDRADO' },
    { value: '159', name: 'LINARES' },
    { value: '160', name: 'YERBAS BUENAS' },
    { value: '161', name: 'COLBUN' },
    { value: '162', name: 'LONGAVI' },
    { value: '163', name: 'VILLA ALEGRE' },
    { value: '164', name: 'PARRAL' },
    { value: '165', name: 'RETIRO' },
    { value: '166', name: 'CAUQUENES' },
    { value: '167', name: 'CHANCO' },
    { value: '320', 'name': 'PELLUHUE' },
    { value: '341', 'name': 'SAN RAFAEL' },
  ];

  public comunasBioBio = [
    { value: "177", name: "SAN GREGORIO DE ÑIQUEN" },
    { value: "188", name: "CONCEPCION" },
    { value: "189", name: "TALCAHUANO" },
    { value: "190", name: "TOME" },
    { value: "191", name: "PENCO" },
    { value: "192", name: "HUALQUI" },
    { value: "193", name: "FLORIDA" },
    { value: "194", name: "CORONEL" },
    { value: "195", name: "LOTA" },
    { value: "196", name: "SANTA JUANA" },
    { value: "197", name: "CURANILAHUE" },
    { value: "198", name: "ARAUCO" },
    { value: "199", name: "LEBU" },
    { value: "200", name: "LOS ALAMOS" },
    { value: "201", name: "CAÑETE" },
    { value: "202", name: "CONTULMO" },
    { value: "203", name: "TIRUA" },
    { value: "204", name: "LOS ANGELES" },
    { value: "205", name: "SANTA BARBARA" },
    { value: "206", name: "QUILLECO" },
    { value: "207", name: "YUMBEL" },
    { value: "208", name: "CABRERO" },
    { value: "209", name: "TUCAPEL" },
    { value: "210", name: "LAJA" },
    { value: "211", name: "SAN ROSENDO" },
    { value: "212", name: "NACIMIENTO" },
    { value: "213", name: "NEGRETE" },
    { value: "214", name: "MULCHEN" },
    { value: "215", name: "QUILACO" },
    { value: "303", name: "ANTUCO" },
    { value: "343", name: "SAN PEDRO DE LA PAZ" },
    { value: "344", name: "CHIGUAYANTE" },
    { value: "347", name: "HUALPEN" }
  ];

  public get filteredComunas() {
    const region = this.userForm.get('region')?.value;
    if (region === '7') return this.comunasMaule;
    if (region === '8') return this.comunasBioBio;
    return [];
  }

  public isEditable: boolean = false;
  public registered: boolean = false;
  public registroSistrat: boolean = true;
  public demandRegistered: boolean = false;
  public fetchedFromSistrat = signal<boolean>(false);
  public searchResults$: Observable<any>;
  public programs: Parameter[];
  public patient: Patient;

  public registeredOnFiclin = signal<boolean>(false);
  public sistratCenters = signal<SistratCenter[]>([]);

  public userForm: FormGroup = this.fb.group({
    //admissionDate: ['', [Validators.required]],
    program: ['', [Validators.required]],
    sistratCenter: ['', [Validators.required]],
    codigoSistrat: [''],
    rut: ['', [Validators.required, Validators.minLength(3)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    surname: ['', [Validators.required, Validators.minLength(3)]],
    secondSurname: ['', [Validators.required, Validators.minLength(3)]],
    birthDate: ['', [Validators.required]],
    sex: ['', [Validators.required]],
    region: ['7', [Validators.required]],
    comuna: [''],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    phoneFamily: ['', [Validators.required, Validators.minLength(3)]],
    centerOrigin: ['', [Validators.required, Validators.minLength(3)]],
    mainSubstance: ['', [Validators.required]],
    previousTreatments: ['', [Validators.required]],
    atentionRequestDate: [''],
    typeContact: ['', [Validators.required]],
    whoRequest: ['', [Validators.required]],
    whoDerives: ['', [Validators.required]],
    careOfferedDate: [''],
    estimatedMonth: ['', []],
    demandIsNotAccepted: ['', []],
    firstAtentionDate: ['', [Validators.required]],
    atentionResolutiveDate: [''],
    interventionAB: ['', []],
    observations: ['', []],
  });

  get isFetched(): boolean {
    return this.fetchedFromSistrat() || this.isEditable;
  }

  ngOnInit() {
    const user = this.authService.getUser();
    if (!user) {
      Notiflix.Notify.failure('Usuario no autenticado. Por favor, inicie sesión.');
      this.router.navigate(['/login']);
      return;
    }

    this.userService.getUserById(user._id).subscribe((response) => {
      this.programs = response.user.programs;
      this.changeDetectorRef.detectChanges();
    });

    this.sistratCenterService.getActiveCenters().subscribe((centers: SistratCenter[]) => {
      this.sistratCenters.set(centers);
      this.changeDetectorRef.detectChanges();
    });

    // Solo deshabilitar campos que vienen de SISTRAT, mantener RUT y Centro habilitados para la búsqueda
    this.disableNamesFields();

  
    // Leer id desde la URL (si existe)
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.loadPatient(id); // Función para cargar datos en modo edición
      this.isEditable = true; // Puedes usar esta flag para controlar lógica de edición si es necesario
      this.fetchedFromSistrat.set(true);
      this.enableIdentityFields(); // Permitir carga de datos en edición
    }


  }

  onRegionChange() {
    this.userForm.get('comuna')?.setValue('');
  }

  formatDateStringToDate(dateString: string): Date | string {
    if(!dateString) return '';
    console.log('formatDateStringToDate dateString', dateString);
    
    const [day, month, year] = dateString.split("/").map(Number);
    // Ojo: en JS los meses empiezan en 0
    const fechaDate = new Date(year, month - 1, day);
    return fechaDate;
  }

  private loadPatient(id: string): void {
    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        console.log('Cargando paciente:', response);
        
        this.patient = response.patient;
        this.registeredOnFiclin.set(this.patient.registeredOnFiclin!);
        // Patch para evitar borrar las fechas y mantener formato
        this.userForm.patchValue({
          //admissionDate: new Date(this.patient.admissionDate),
          program: this.patient.program._id,
          codigoSistrat: this.patient.codigoSistrat,
          sistratCenter: this.patient.sistratCenter,
          rut: this.patient.rut,
          name: this.patient.name,
          surname: this.patient.surname,
          secondSurname: this.patient.secondSurname,
          birthDate: this.formatDateStringToDate(this.patient.birthDate),
          sex: this.patient.sex,
          region: this.patient.region,
          comuna: this.patient.comuna,
          phone: this.patient.phone,
          phoneFamily: this.patient.phoneFamily,
          centerOrigin: this.patient.centerOrigin,
          mainSubstance: this.patient.mainSubstance,
          previousTreatments: this.patient.previousTreatments,
          atentionRequestDate: this.formatDateStringToDate(this.patient.atentionRequestDate),
          typeContact: this.patient.typeContact,
          whoRequest: this.patient.whoRequest,
          whoDerives: this.patient.whoDerives,
          careOfferedDate: this.formatDateStringToDate(this.patient.careOfferedDate),
          estimatedMonth: this.formatDateStringToDate(this.patient.estimatedMonth),
          demandIsNotAccepted: this.patient.demandIsNotAccepted,
          firstAtentionDate: this.formatDateStringToDate(this.patient.firstAtentionDate),
          atentionResolutiveDate: this.formatDateStringToDate(this.patient.atentionResolutiveDate),
          interventionAB: this.patient.interventionAB,
          observations: this.patient.observations,
        });

        this.fetchedFromSistrat.set(true);
        this.disableIdentityFields();
        
        // Si estamos editando, saltamos directo al paso 3 (formulario completo)
        setTimeout(() => {
          if (this.stepper) {
            this.stepper.selectedIndex = 2;
          }
        }, 500);

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
    if (this.userForm.invalid) {
      const controls = this.userForm.controls;
      this.userForm.markAllAsTouched();
      Notiflix.Loading.remove();
      return;
    }

    Notiflix.Loading.circle('Registrando nueva demanda en Ficlin...');


    const dataUser = this.formatFormDates(this.userForm.getRawValue());
    console.log('[Data User]', dataUser);

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
      alert('Formulario inválido. Por favor, revisa los campos requeridos.');
      const controls = this.userForm.controls;
      this.userForm.markAllAsTouched();
      Notiflix.Loading.remove();
      return;
    }

    if (this.patient._id === undefined) return;

    const dataUser = this.formatFormDates(this.userForm.getRawValue());
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

  onRutInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;

    const allowedRutValue = target.value.replaceAll(/[^0-9kK]+/g, '').toUpperCase();
    if (allowedRutValue === target.value) {
      return;
    }

    target.value = allowedRutValue;
    this.userForm.get('rut')?.setValue(allowedRutValue, { emitEvent: false });
  }

  onFetchDataWithRut(): void {
    const rut = this.userForm.get('rut')?.value?.trim();
    // Para recuperar el nombre basta con loguearnos en cualquier centro activo
    const centers = this.sistratCenters();
    const center = centers.length > 0 ? centers[0].name : null;

    if (!rut) {
      Notiflix.Notify.warning('Debes ingresar un RUT antes de buscar.');
      return;
    }

    if (!center) {
      Notiflix.Notify.warning('No hay centros SISTRAT activos para realizar la búsqueda.');
      return;
    }

    Notiflix.Loading.circle('Recuperando nombre desde SISTRAT...');

    this.patientService.getDataWithRut(rut, center).subscribe({
      next: (response) => {
        const data = response?.data;
        if (!data || (!data.name && !data.surname)) {
          Notiflix.Notify.failure('No se encontró información para este RUT en SISTRAT.');
          Notiflix.Loading.remove();
          return;
        }

        // Rellenamos los campos de identidad
        this.userForm.patchValue({
          name: data.name,
          surname: data.surname,
          secondSurname: data.secondSurname,
          birthDate: this.formatDateStringToDate(data.birthDate),
          sex: data.sex,
        });

        this.fetchedFromSistrat.set(true);
        this.disableNamesFields();
        this.userForm.get('rut')?.disable();

        this.changeDetectorRef.detectChanges();
        
        // Avanzar al paso 2 (Selección de Centro)
        setTimeout(() => {
          if (this.stepper) this.stepper.next();
        }, 600);

        Notiflix.Notify.success('Nombre recuperado con éxito.');
        Notiflix.Loading.remove();
      },
      error: (err) => {
        console.error('Error al recuperar datos:', err);
        Notiflix.Notify.failure('No se pudo establecer conexión con SISTRAT.');
        Notiflix.Loading.remove();
      }
    });
  }

  onCenterSelected(): void {
    // Ya no avanzamos automáticamente para permitir al usuario decidir 
    // si quiere usar el botón de "Actualizar solo Centro" o "Completar Ficha"
  }

  private disableNamesFields(): void {
    if (this.authService.isAdmin()) return; // Los admins pueden editar todo
    
    const fields = ['name', 'surname', 'secondSurname', 'birthDate', 'sex'];
    fields.forEach(field => this.userForm.get(field)?.disable());
  }

  private disableIdentityFields(): void {
    if (this.authService.isAdmin()) return; // Los admins pueden editar todo
    
    const fields = ['name', 'surname', 'secondSurname', 'birthDate', 'sex', 'rut'];
    fields.forEach(field => this.userForm.get(field)?.disable());
  }

  private enableIdentityFields(): void {
    const fields = ['name', 'surname', 'secondSurname', 'birthDate', 'sex', 'sistratCenter', 'rut'];
    fields.forEach(field => this.userForm.get(field)?.enable());
  }

  resetFetch(): void {
    if (this.isEditable) return;
    this.fetchedFromSistrat.set(false);
    this.enableIdentityFields();
    this.userForm.patchValue({
      rut: '',
      name: '',
      surname: '',
      secondSurname: '',
      birthDate: '',
      sex: '',
    });
  }
}
