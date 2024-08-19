import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  type OnInit,
} from '@angular/core';
import { MaterialModule } from '../../../../angular-material/material.module';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../user.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParametersService } from '../../parameters/parameters.service';
import { Observable } from 'rxjs';
import {
  Parameter,
  ParameterValue,
} from '../../parameters/interfaces/parameter.interface';
import { ProfesionalRoleService } from '../../parameters/profesionalRole/profesionalRole.service';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
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


  public permissions$: Observable<any>;
  public programs$: Observable<any>;

  public checkedPermissions: string[] = [];
  public checkedPrograms: string[] = [];

  public permissionUser: string[];
  public programsUser: string[];

  public profesionalRoles: any;
  public patientId: string;
  public edit: boolean = false;

  public userForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(3)]],
    profile: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit() {

    this.patientId = this.route.snapshot.paramMap.get('id')!;
    if(this.patientId){  
      this.edit = true;    
      this.userService.getUserById(this.patientId).subscribe( response => {
        
        this.userForm.patchValue({
          name: response.user.name || '', // Si el campo está vacío, se usa un string vacío como fallback
          email: response.user.email || '',
          profile: response.user.profile._id || '', 
        });      
        
        this.permissionUser = response.user.permissions.map((permission: Parameter) => permission._id);
        this.programsUser = response.user.programs.map((program: Parameter) => program._id);

      })
    }   

    this.permissions$ = this.parametersService.getParameters(
      ParameterValue.Permission
    );
    this.programs$ = this.parametersService.getParameters(
      ParameterValue.Program
    );
    this.profesionalRoleService
      .getProfesionalRoles()
      .subscribe((profesionalRoles) => {
        console.log({ profesionalRoles });
        this.profesionalRoles = profesionalRoles;
      });
  }

  onSave() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.userService
      .addUser(
        this.userForm.value,
        this.checkedPermissions,
        this.checkedPrograms
      )
      .subscribe((response: any) => {
        console.log(response);
        this.router.navigateByUrl('/dashboard/users');
      });
  }

  isValidField(field: string): boolean {
    return (
      Boolean(this.userForm.controls[field].errors) &&
      this.userForm.controls[field].touched
    );
  }

  onPermissionChange(permissionChecked: Parameter, event: any) {
    const newValue = event.checked;
    if (!newValue) {
      this.checkedPermissions = this.checkedPermissions.filter(
        (permission) => permission != permissionChecked._id
      );
    } else {
      this.checkedPermissions.push(permissionChecked._id);
    }
    console.log({ checkedPermissions: this.checkedPermissions });
  }

  onProgramChange(programChecked: Parameter, event: any) {
    const newValue = event.checked;
    if (!newValue) {
      this.checkedPrograms = this.checkedPrograms.filter(
        (prorgram) => prorgram != programChecked._id
      );
    } else {
      this.checkedPrograms.push(programChecked._id);
    }
    console.log({ checkedPrograms: this.checkedPrograms });
  }

  isPermissionSelected(id: string){
    return this.edit ? this.permissionUser.includes(id): false;
  }
  
  isProgramSelected(id: string){
    return this.edit ? this.programsUser.includes(id) : false;
  }
}
