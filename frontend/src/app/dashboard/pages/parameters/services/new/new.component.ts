import { ParametersService } from './../../parameters.service';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MaterialModule } from '../../../../../angular-material/material.module';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ParameterValue } from '../../interfaces/parameter.interface';
import { ProfesionalServiceService } from '../profesionalService.service';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
})
export class NewService {
  private profesionalServiceService = inject(ProfesionalServiceService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<NewService>);


  public permissionForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    code: ['', [Validators.required]],
  });

  onSave() {
    if (this.permissionForm.valid) {
      this.profesionalServiceService
        .addService(this.permissionForm.value)
        .subscribe((response) => {
          this.dialogRef.close(response); 
        });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
