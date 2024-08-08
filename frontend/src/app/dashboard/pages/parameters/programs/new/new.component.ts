import { ParametersService } from '../../parameters.service';
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

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
})
export class NewProgram {
  private parametersService = inject(ParametersService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<NewProgram>);


  public programForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    value: ['', [Validators.required]],
  });

  onSave() {
    if (this.programForm.valid) {
      this.parametersService
        .addParameter(ParameterValue.Program, this.programForm.value)
        .subscribe((response) => {
          console.log(response);
          this.dialogRef.close(response); 
        });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
