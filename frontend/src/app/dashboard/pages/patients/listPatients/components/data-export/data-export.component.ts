import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheetRef, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MONDAY_FIRST_DATE_PROVIDERS } from '../../../../../../shared/date/monday-first-date-adapter';

@Component({
  selector: 'app-child-bottom-sheet',
  templateUrl: './data-export.component.html',
  styleUrl: './data-export.component.scss',
  standalone: true,
  providers: [...MONDAY_FIRST_DATE_PROVIDERS],
  imports: [MatBottomSheetModule, MatButtonModule, MatListModule, MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule, ReactiveFormsModule, MatDatepickerModule],
})
export class DataExportComponent {
  private fb = inject(FormBuilder);
  public exportForm: FormGroup;

  constructor(private bottomSheetRef: MatBottomSheetRef<DataExportComponent>) {
    this.exportForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  exportPdf(): void {
    if (this.exportForm.invalid) return;

    const startDate: Date = this.exportForm.value.startDate;
    const endDate: Date = this.exportForm.value.endDate;

    // Convertir a formato YYYY-MM-DD
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);

    console.log('Fecha Inicio:', startStr);
    console.log('Fecha Hasta:', endStr);

    // const data = this.exportForm.value;
    // console.log('Exportando con:', data);

    const data = {startDate: startStr, endDate: endStr}
    this.bottomSheetRef.dismiss(data); // Devuelve mes y año al padre
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}
