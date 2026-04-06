import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheetRef, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MONDAY_FIRST_DATE_PROVIDERS } from '../../../../../../shared/date/monday-first-date-adapter';
import { SistratCenter, SistratCenterService } from '../../../../../services/sistratCenter.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-child-bottom-sheet',
  templateUrl: './data-export.component.html',
  styleUrl: './data-export.component.scss',
  standalone: true,
  providers: [...MONDAY_FIRST_DATE_PROVIDERS],
  imports: [CommonModule, MatBottomSheetModule, MatButtonModule, MatListModule, MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule, ReactiveFormsModule, MatDatepickerModule, MatIconModule],
})
export class DataExportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sistratCenterService = inject(SistratCenterService);
  public exportForm: FormGroup;
  public centers: SistratCenter[] = [];

  constructor(private bottomSheetRef: MatBottomSheetRef<DataExportComponent>) {
    this.exportForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      centerName: [''], // Filtrar por nombre del centro (SistratCenter)
    });
  }

  ngOnInit(): void {
    this.sistratCenterService.getActiveCenters().subscribe((centers: SistratCenter[]) => {
      this.centers = centers || [];
    });
  }

  exportPdf(): void {
    if (this.exportForm.invalid) return;

    const { startDate, endDate, centerName } = this.exportForm.value;

    // Convertir a formato YYYY-MM-DD
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);

    const data = { startDate: startStr, endDate: endStr, centerName };
    this.bottomSheetRef.dismiss(data);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}
