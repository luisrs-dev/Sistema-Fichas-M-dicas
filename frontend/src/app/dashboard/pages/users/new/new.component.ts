import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, type OnInit } from '@angular/core';
import { MaterialModule } from '../../../../angular-material/material.module';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParametersService } from '../../parameters/parameters.service';
import { Observable } from 'rxjs';
import { Parameter, ParameterValue } from '../../parameters/interfaces/parameter.interface';
import { ProfesionalRoleService } from '../../parameters/profesionalRole/profesionalRole.service';
import { AuthService } from '../../../../auth/auth.service';
import Notiflix from 'notiflix';
import { error } from 'highcharts';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NewComponent {
  private userService = inject(UserService);
  private parametersService = inject(ParametersService);
  private profesionalRoleService = inject(ProfesionalRoleService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private changeDetectorRef = inject(ChangeDetectorRef);

  public permissions$: Observable<any>;
  public programs$: Observable<any>;

  public checkedPermissions: string[] = [];
  public checkedPrograms: string[] = [];

  public permissionUser: string[];
  public programsUser: string[];

  public profesionalRoles: any;
  public selectedImage: string | ArrayBuffer | null = null; // Almacena la URL de la vista previa de la imagen
  public imageFile: File | null = null; // Almacena el archivo seleccionado
  public imagePath: string | null = null;

  public patientId: string;
  public edit: boolean = false;

  public userForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', this.edit ? [] : [Validators.required, Validators.minLength(3)]],
    profile: ['', [Validators.required, Validators.minLength(3)]],
    image: [null, []], // Campo de firma agregado
  });

  ngOnInit() {
    this.patientId = this.route.snapshot.paramMap.get('id')!;
    if (this.patientId) {
      // Se actualiza form para que password no sea requerido
      // Cambio de clave debe hacerse en otro lugar
      this.userForm.get('password')?.setValidators([]);
      this.edit = true;
      this.userService.getUserById(this.patientId).subscribe((response) => {
        this.userForm.patchValue({
          name: response.user.name || '', // Si el campo está vacío, se usa un string vacío como fallback
          email: response.user.email || '',
          profile: response.user.profile._id || '',
        });

        if (response.user.signature) {
          this.imagePath = `http://localhost:3002${response.user.signature}`;
        }

        this.permissionUser = response.user.permissions.map((permission: Parameter) => permission._id);
        this.programsUser = response.user.programs.map((program: Parameter) => program._id);

        this.checkedPermissions = [...this.permissionUser];
        this.checkedPrograms = [...this.programsUser];
      });
    }

    this.permissions$ = this.parametersService.getParameters(ParameterValue.Permission);
    this.programs$ = this.parametersService.getParameters(ParameterValue.Program);
    this.profesionalRoleService.getProfesionalRoles().subscribe((profesionalRoles) => {
      this.profesionalRoles = profesionalRoles;
    });
  }

  onSave() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      console.log('form invalido');
      return;
    }

    const formData = new FormData();

    Object.entries(this.userForm.value).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value); // Si es un archivo, lo añade como Blob
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString()); // Convierte otros valores a string
      }
    });

    this.checkedPermissions.forEach((permission) => {
      formData.append('permissions', permission); // 'permissions' será el nombre de campo para estos datos
    });

    this.checkedPrograms.forEach((program) => {
      formData.append('programs', program); // 'programs' será el nombre de campo para estos datos
    });

    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    if (this.edit) {
      formData.append('patientId', this.patientId); // 'programs' será el nombre de campo para estos datos

      this.userService.updateUser(formData).subscribe((response: any) => {
        this.router.navigateByUrl('/dashboard/users');
      });
    } else {
      this.userService.createUser(formData).subscribe((response: any) => {
        console.log(response);
        this.router.navigateByUrl('/dashboard/users');
      });
    }
  }

  isValidField(field: string): boolean {
    return Boolean(this.userForm.controls[field].errors) && this.userForm.controls[field].touched;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.userForm.patchValue({
        image: file,
      });
    }
  }

  onToggleChange(itemChecked: Parameter, event: any, checkedList: string[]) {
    const newValue = event.checked;
    if (!newValue) {
      // Filtra el item de la lista si no está marcado
      const index = checkedList.indexOf(itemChecked._id);
      if (index !== -1) {
        checkedList.splice(index, 1);
      }
    } else {
      // Agrega el item a la lista si está marcado
      checkedList.push(itemChecked._id);
    }
    console.log({ checkedList });
  }

  // Funcion onToggleChange pero con filter
  onItemChange(itemChecked: Parameter, event: any, checkedList: string[]) {
    const newValue = event.checked;
    if (!newValue) {
      checkedList = checkedList.filter((id) => id !== itemChecked._id);
    } else {
      checkedList.push(itemChecked._id);
    }
    console.log({ checkedList });
  }

  // En modo editar Se verifica valor para marcar mat-slide-toogle
  isParameterSelected(id: string, itemsUser: string[]) {
    if (itemsUser?.length > 0) {
      return this.edit ? itemsUser.includes(id) : false;
    }
    return false;
  }

  updatePassword(password: string) {
    const body = {
      id: this.patientId, // reemplaza por el email real
      password,
    };
    this.userService.updatePassword(body).subscribe({
      next: (response) =>{
        console.log(response);
        Notiflix.Notify.success('Contraseña actualizada con éxito');
      },
      error: (error) => {
        console.error('Error actualizando contraseña:', error);
      }
    });
  }
}
