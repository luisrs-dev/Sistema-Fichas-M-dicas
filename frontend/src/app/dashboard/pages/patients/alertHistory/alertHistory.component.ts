import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../angular-material/material.module';
import { PatientService } from '../patient.service';

interface AlertRecord {
  tipo: string;
  fecha: string | Date | null;
  observacion: string;
  profesional: string;
}

interface AlertGroup {
  tipo: string;
  color: string;
  icon: string;
  registros: AlertRecord[];
}

interface PatientInfo {
  _id: string;
  name: string;
  surname: string;
  secondSurname: string;
  program?: { name: string };
}

@Component({
  selector: 'app-alert-history',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './alertHistory.component.html',
  styleUrl: './alertHistory.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AlertHistoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientService = inject(PatientService);

  loading = signal(true);
  patient = signal<PatientInfo | null>(null);
  alertGroups = signal<AlertGroup[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadAlertHistory(id);
      }
    });
  }

  private loadAlertHistory(patientId: string): void {
    this.loading.set(true);
    this.patientService.getAlertHistory(patientId).subscribe({
      next: (response: { patient: PatientInfo; alertGroups: AlertGroup[] }) => {
        this.patient.set(response.patient);
        this.alertGroups.set(response.alertGroups);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/patients']);
  }

  getCardClass(tipo: string): string {
    const classMap: Record<string, string> = {
      'CIE10': 'cie10',
      'TOP': 'top',
      'Evaluación': 'evaluacion',
      'Integración Social': 'integracion',
      'Diagnóstico Social': 'diagnostico',
      'Ficha Mensual': 'mensual',
    };
    return classMap[tipo] || '';
  }

  getGroupIcon(tipo: string): string {
    const iconMap: Record<string, string> = {
      'CIE10': 'medical_information',
      'TOP': 'assignment',
      'Evaluación': 'fact_check',
      'Integración Social': 'groups',
      'Diagnóstico Social': 'psychology',
      'Ficha Mensual': 'description',
    };
    return iconMap[tipo] || 'circle';
  }

  formatDate(fecha: string | Date | null): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return String(fecha);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
