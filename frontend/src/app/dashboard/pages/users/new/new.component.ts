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
import { Router, RouterModule } from '@angular/router';
import { ParametersService } from '../../parameters/parameters.service';
import { Observable } from 'rxjs';
import { Parameter, ParameterValue } from '../../parameters/interfaces/parameter.interface';
import { ProfesionalRoleService } from '../../parameters/profesionalRole/profesionalRole.service';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule  ],
  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NewComponent {
  private userService = inject(UserService);
  private parametersService = inject(ParametersService);
  private profesionalRoleService = inject(ProfesionalRoleService);
  public permissions$: Observable<any>;
  public programs$: Observable<any>;
  public checkedPermissions: string[] = [];
  public checkedPrograms: string[] = [];
  public profesionalRoles: any;


  private fb = inject(FormBuilder);
  private router = inject(Router);

  public userForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(3)]],
    profile: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(){
    this.permissions$ = this.parametersService.getParameters(ParameterValue.Permission);
    this.programs$ = this.parametersService.getParameters(ParameterValue.Program);
    this.profesionalRoleService.getProfesionalRoles().subscribe( profesionalRoles => {
      console.log({profesionalRoles});
      this.profesionalRoles = profesionalRoles;

    });

  }


  onSave() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
      this.userService.addUser(this.userForm.value, this.checkedPermissions, this.checkedPrograms).subscribe((response: any) => {
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
  
  
  onPermissionChange(permission: Parameter, event: any) {
    const newValue = event.checked;
    this.checkedPermissions.push(permission._id);
    console.log({checkedPermissions: this.checkedPermissions});
    
    console.log(`Permission: ${permission.name}, Value: ${permission.value}, New Toggle State: ${newValue}`);
  }

  onProgramChange(program: Parameter, event: any) {
    const newValue = event.checked;
    this.checkedPrograms.push(program._id);
    console.log({checkedprograms: this.checkedPrograms});
    
    console.log(`program: ${program.name}, Value: ${program.value}, New Toggle State: ${newValue}`);
  }
}
