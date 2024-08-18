import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  model,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../../angular-material/material.module';
import {
  Parameter,
  ParameterValue,
} from '../../interfaces/parameter.interface';
import { ParametersService } from '../../parameters.service';
import { ProfesionalServiceService } from '../../services/profesionalService.service';
import { Service } from '../../services/interface/service.interface';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  private profesionalRoleService= inject(ProfesionalRoleService);
  private fb = inject(FormBuilder);
  private snackBar= inject(MatSnackBar);
  private changeDetectorRef = inject(ChangeDetectorRef);

  private dialogRef = inject(MatDialogRef<NewProfesionalRole>);
  public services: Service[];
  public services$: Observable<any>;
  public checkedServices: string[] = [];

  readonly announcer = inject(LiveAnnouncer);

  ngOnInit() {
    this.services$ = this.profesionalServiceService.getProfesionalServices();
  }

  public serviceForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    services: this.fb.array([]),
  });

  onPermissionChange(serviceChecked: Parameter, event: any) {
    const newValue = event.checked;
    if(!newValue){
      this.checkedServices = this.checkedServices.filter(service => service != serviceChecked._id);
    }else{
      this.checkedServices.push(serviceChecked._id);
    }    
  }

  onSave() {

    if(this.checkedServices.length == 0){
      this.snackBar.open('Debe seleccionar al menos una prestación','', {duration: 3000} )
      return;
    }

    if (this.serviceForm.valid) {
      this.profesionalRoleService
        .add(this.serviceForm.get('name')!.value, this.checkedServices)
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
