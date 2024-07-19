import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {FormBuilder, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MaterialModule } from '../../../../angular-material/material.module';


@Component({
    selector: 'app-test-stepds',
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ],
    templateUrl: './testStepds.component.html',
    styleUrl: './testStepds.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TestStepdsComponent {
    firstFormGroup = this._formBuilder.group({
        firstCtrl: ['', Validators.required],
      });
      secondFormGroup = this._formBuilder.group({
        secondCtrl: '',
      });
      isOptional = false;
    
      constructor(private _formBuilder: FormBuilder) {}

 }
