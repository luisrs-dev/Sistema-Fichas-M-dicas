import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MedicalRecordService,
  MonthlyLogContentResponse,
  MonthlyLogListResponse,
  MonthlyLogSummary,
} from '../medicalRecord.service';

interface PanelState {
  loading: boolean;
  content?: string;
  error?: string;
}

@Component({
  selector: 'app-monthly-logs',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './monthly-logs.component.html',
  styleUrl: './monthly-logs.component.css',
})
export default class MonthlyLogsComponent implements OnInit {
  private medicalRecordService = inject(MedicalRecordService);

  logs: MonthlyLogSummary[] = [];
  loading = true;
  error: string | null = null;
  panelState: Record<string, PanelState> = {};

  ngOnInit(): void {
    this.loadLogs();
  }

  refresh(): void {
    this.loading = true;
    this.error = null;
    this.logs = [];
    this.panelState = {};
    this.loadLogs();
  }

  onPanelOpened(fileName: string): void {
    const currentState = this.panelState[fileName];
    if (currentState?.loading || currentState?.content) {
      return;
    }

    this.panelState[fileName] = { loading: true };
    this.medicalRecordService.getMonthlyLogContent(fileName).subscribe({
      next: (response: MonthlyLogContentResponse) => {
        this.panelState[fileName] = {
          loading: false,
          content: response.content,
        };
      },
      error: (err) => {
        this.panelState[fileName] = {
          loading: false,
          error: err?.error?.message || 'No fue posible cargar el contenido.',
        };
      },
    });
  }

  trackByFileName(_index: number, log: MonthlyLogSummary): string {
    return log.fileName;
  }

  formatSize(size: number): string {
    if (!size) {
      return '0 KB';
    }

    const kb = size / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  private loadLogs(): void {
    this.medicalRecordService.getMonthlyLogs().subscribe({
      next: (response: MonthlyLogListResponse) => {
        this.logs = response.logs || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No fue posible recuperar los registros.';
      },
    });
  }
}
