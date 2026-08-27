import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import Notiflix from 'notiflix';
import { MaterialModule } from '../../../../angular-material/material.module';
import { SistratCenter, SistratCenterService } from '../../../services/sistratCenter.service';
import { Parameter, ParameterValue } from '../../parameters/interfaces/parameter.interface';
import { ParametersService } from '../../parameters/parameters.service';
import { PatientService } from '../patient.service';

@Component({
  selector: 'app-patient-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './patient-report.component.html',
  styleUrl: './patient-report.component.css',
})
export default class PatientReportComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly parametersService = inject(ParametersService);
  private readonly centersService = inject(SistratCenterService);

  readonly loadingOptions = signal(true);
  readonly generating = signal(false);
  readonly programs = signal<Parameter[]>([]);
  readonly centers = signal<SistratCenter[]>([]);

  readonly reportForm = this.fb.nonNullable.group({
    programs: [[] as string[]],
    active: ['true' as 'true' | 'false' | 'all'],
    sistratCenter: [''],
    includeWithoutCode: [true],
  });

  ngOnInit(): void {
    let completed = 0;
    const finish = () => {
      completed += 1;
      if (completed === 2) this.loadingOptions.set(false);
    };

    this.parametersService.getParameters(ParameterValue.Program).subscribe({
      next: (programs) => this.programs.set(programs),
      error: () => {
        Notiflix.Notify.failure('No se pudieron cargar los programas');
        finish();
      },
      complete: finish,
    });
    this.centersService.getActiveCenters().subscribe({
      next: (centers) => this.centers.set(centers),
      error: () => {
        Notiflix.Notify.failure('No se pudieron cargar los centros SISTRAT');
        finish();
      },
      complete: finish,
    });
  }

  generateReport(): void {
    if (this.generating()) return;
    this.generating.set(true);

    this.patientService.downloadPatientReport(this.reportForm.getRawValue()).subscribe({
      next: (response) => {
        if (!response.body) {
          Notiflix.Notify.failure('El backend no devolvió el archivo');
          return;
        }

        const disposition = response.headers.get('Content-Disposition') || '';
        const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
        const filename = filenameMatch?.[1] || 'informe_pacientes.xlsx';
        const url = URL.createObjectURL(response.body);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        const total = response.headers.get('X-Total-Records');
        Notiflix.Notify.success(total
          ? `Informe generado con ${total} pacientes`
          : 'Informe generado correctamente');
      },
      error: (error) => {
        const message = error?.status === 403
          ? 'Esta sección es exclusiva para administradores'
          : 'No se pudo generar el informe de pacientes';
        Notiflix.Notify.failure(message);
      },
      complete: () => this.generating.set(false),
    });
  }
}
