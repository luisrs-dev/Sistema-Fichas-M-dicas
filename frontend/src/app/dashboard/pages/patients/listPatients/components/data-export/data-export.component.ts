import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheetRef, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-child-bottom-sheet',
  templateUrl: './data-export.component.html',
  styleUrl: './data-export.component.scss',
  standalone: true,
  imports: [MatBottomSheetModule, MatButtonModule, MatListModule, MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule,
ReactiveFormsModule

  ],
})
export class DataExportComponent {

  private fb = inject(FormBuilder);
  public exportForm: FormGroup;


  public meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  public años = [2024, 2025, 2026];
  constructor(private bottomSheetRef: MatBottomSheetRef<DataExportComponent>) {

  const today = new Date();
  const currentMonth = ((today.getMonth() + 1) - 1).toString(); // meses en JS van de 0-11
  const currentYear = today.getFullYear().toString();

    this.exportForm = this.fb.group({
      mes: [currentMonth, Validators.required],
      anio: [currentYear, Validators.required],
    });
  }

  exportPdf(): void {
    const data = this.exportForm.value;
      console.log('Exportando con:', data);
      this.bottomSheetRef.dismiss(data); // Devuelve mes y año al padre
  }
}
