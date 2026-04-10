import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '../../../../../../angular-material/material.module';

export interface InvalidFormInfo {
    title: string;
    fields: string[];
}

@Component({
    selector: 'app-invalid-forms-dialog',
    standalone: true,
    imports: [
        CommonModule, MaterialModule
    ],
    templateUrl: './invalidFormsDialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvalidFormsDialogComponent { 
    constructor(@Inject(MAT_DIALOG_DATA) public data: { invalidForms: InvalidFormInfo[] }) {}
}
