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

  readonly announcer = inject(LiveAnnouncer);
  editMode = signal(false);
  public idService: string = '';
  public profesionalRolesServices: any[] = [];
  public profesionalRoleUser: string = '';
  constructor(@Inject(MAT_DIALOG_DATA) public data: { id: string }) {
    console.log('ID recibido:', data.id);
    if (data.id) {
      this.editMode.set(true);
      this.idService = data.id;
    }
  }

  ngOnInit() {
    this.services$ = this.profesionalServiceService.getProfesionalServices();
    if (this.editMode()) {
      this.profesionalRoleService.getProfesionalRoleById(this.idService).subscribe((response) => {
        console.log(response);
        this.profesionalRolesServices = response.services;
        console.log('this.profesionalRolesUser', this.profesionalRolesServices);

        this.profesionalRoleUser = response.name;
        if (this.profesionalRoleUser != '') {
          this.serviceForm.patchValue({
            name: this.profesionalRoleUser,
          });
        }
      });
    }
  }

  isRoleAssigned(serviceId: string): boolean {
    return this.profesionalRolesServices?.some((r) => r._id === serviceId) ?? false;
  }

  public serviceForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    services: this.fb.array([]),
  });

  onPermissionChange(serviceChecked: Parameter, event: any) {
    const newValue = event.checked;
    if (!newValue) {
      this.checkedServices = this.checkedServices.filter((service) => service != serviceChecked._id);
    } else {
      this.checkedServices.push(serviceChecked._id);
    }
  }

  onSave() {
    if (this.checkedServices.length == 0) {
      this.snackBar.open('Debe seleccionar al menos una prestación', '', { duration: 3000 });
      return;
    }

    if (this.serviceForm.valid) {
      this.profesionalRoleService.add(this.serviceForm.get('name')!.value, this.checkedServices).subscribe((response) => {
        console.log(response);
        this.dialogRef.close(response);
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
