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
  private fb = inject(FormBuilder);
  private router = inject(Router);

  public userForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.minLength(3)]],
    profile: ['', [Validators.required, Validators.minLength(3)]],
  });

  onSave() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }    
    this.userService.addUser(this.userForm.value)
    .subscribe( (response: any) => {
        console.log(response);
    this.router.navigateByUrl('/dashboard/users');

        
    })
  }

  isValidField(field: string): boolean {
    return (
      Boolean(this.userForm.controls[field].errors) &&
      this.userForm.controls[field].touched
    );
  }
}
