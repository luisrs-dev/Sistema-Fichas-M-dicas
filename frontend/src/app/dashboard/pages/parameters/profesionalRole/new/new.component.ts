import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { Parameter } from '../../interfaces/parameter.interface';
import { ParametersService } from '../../parameters.service';
import { Service } from '../../services/interface/service.interface';
import { ProfesionalServiceService } from '../../services/profesionalService.service';
import { ProfesionalRoleService } from '../profesionalRole.service';
import Notiflix from 'notiflix';
import { ALERT_OPTIONS, AlertType, defaultRoleAlerts } from '../../../../utils/alert-visibility';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
})
export class NewProfesionalRole {
  private parametersService = inject(ParametersService);
  private profesionalServiceService = inject(ProfesionalServiceService);
  private profesionalRoleService = inject(ProfesionalRoleService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private changeDetectorRef = inject(ChangeDetectorRef);

  private dialogRef = inject(MatDialogRef<NewProfesionalRole>);
  public services: Service[];
  public services$: Observable<any>;
  public checkedServices: string[] = [];
  public alertOptions = ALERT_OPTIONS;
  public visibleAlerts: AlertType[] = [];
  public loadingRole = false;
  public saving = false;
  public unconfiguredAlerts = false;

  readonly announcer = inject(LiveAnnouncer);
  editMode = signal(false);
  public idService: string = '';
  public profesionalRolesServices: any[] = [];
  public profesionalRoleUser: string = '';
  constructor(@Inject(MAT_DIALOG_DATA) public data: { id?: string; section?: 'services' | 'alerts' }) {
    if (data?.id) {
      this.editMode.set(true);
      this.idService = data.id;
    }
  }

  ngOnInit() {
    if (this.showServices) this.services$ = this.profesionalServiceService.getProfesionalServices();
    if (this.editMode()) {
      this.loadingRole = true;
      this.profesionalRoleService.getProfesionalRoleById(this.idService).subscribe({ next: (response) => {
        this.loadingRole = false;
        this.unconfiguredAlerts = response.visibleAlerts === undefined;
        this.visibleAlerts = response.visibleAlerts ?? defaultRoleAlerts(response.name);
        this.profesionalRolesServices = response.services;
        console.log('this.profesionalRolesUser', this.profesionalRolesServices);

        this.profesionalRoleUser = response.name;
        if (this.profesionalRoleUser != '') {
          this.serviceForm.patchValue({
            name: this.profesionalRoleUser,
          });
        }
      }, error: () => {
        this.snackBar.open("No se pudo cargar el cargo", "", { duration: 3000 });
      } });
    }
  }

  public serviceForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    services: this.fb.array([]),
  });

  isRoleAssigned(serviceId: string): boolean {
    return this.profesionalRolesServices?.some((r) => r._id === serviceId) ?? false;
  }

  onPermissionChange(newService: Parameter, event: any) {
    const checked = event.checked;

    if (this.editMode()) {
      console.log('EDITANDO');      
       if (checked) {
      // ✅ Agregar si no existe
      if (!this.profesionalRolesServices.some(role => role._id === newService._id)) {
        this.profesionalRolesServices = [...this.profesionalRolesServices, newService];
      }
    } else {
      // ❌ Eliminar si se desmarca
      this.profesionalRolesServices = this.profesionalRolesServices.filter(
        role => role._id !== newService._id
      );
    }
      console.log('profesionalRolesServices', this.profesionalRolesServices);
    } else {
      console.log('GUARDANO');
      // Registro de nuevo profesional role
      const checked = event.checked;
      if (checked) {
        // Agregar si no existe ya
        if (!this.checkedServices.includes(newService._id)) {
          this.checkedServices = [...this.checkedServices, newService._id];
        }
      } else {
        // Eliminar si se desmarca
        this.checkedServices = this.checkedServices.filter((service) => service !== newService._id);
      }
      console.log('checkedfServices', this.checkedServices);
    }
  }

  onAlertChange(alert: AlertType, checked: boolean) {
    this.visibleAlerts = checked ? [...new Set([...this.visibleAlerts, alert])] :
      this.visibleAlerts.filter(value => value !== alert);
  }

  onSave() {
    if (this.loadingRole || this.saving) return;
    if (this.editMode()) {
      this.editProfesionalRole();
    } else {
      this.saveProfesionalRole();
    }
  }

  saveProfesionalRole() {
    if (this.checkedServices.length == 0) {
      this.snackBar.open('Debe seleccionar al menos una prestación', '', { duration: 3000 });
      return;
    }

    if (this.serviceForm.valid) {
      this.saving = true;
      this.profesionalRoleService.add(this.serviceForm.get('name')!.value, this.checkedServices, this.visibleAlerts).subscribe({ next: (response) => {
        console.log(response);
        this.dialogRef.close(response);
      }, error: () => {
        this.saving = false;
        this.snackBar.open("No se pudo guardar el cargo", "", { duration: 3000 });
      } });
    }
  }

  get showServices(): boolean {
    return !this.editMode() || this.data.section !== 'alerts';
  }

  get showAlerts(): boolean {
    return !this.editMode() || this.data.section === 'alerts';
  }

  editProfesionalRole() {
    if (this.showServices && this.profesionalRolesServices.length === 0) {
      this.snackBar.open('Debe seleccionar al menos una prestación', '', { duration: 3000 });
      return;
    }
    if (!this.serviceForm.valid) return;

    const services = this.showServices ? this.profesionalRolesServices.map(service => service._id) : undefined;
    const alerts = this.showAlerts ? this.visibleAlerts : undefined;
    this.saving = true;
    this.profesionalRoleService.update(this.idService, services, alerts).subscribe({
      next: response => {
        Notiflix.Notify.success(this.showAlerts ? 'Se actualizaron las alertas' : 'Se actualizaron las prestaciones');
        this.dialogRef.close(response);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('No se pudo guardar el cargo', '', { duration: 3000 });
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
