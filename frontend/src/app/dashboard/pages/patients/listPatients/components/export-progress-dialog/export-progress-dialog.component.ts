import { Component, Inject, NgZone, OnDestroy } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../../../environments/environment';

export interface ExportProgressData {
  jobId: string;
  downloadFilename: string;
}

interface SseProgressEvent {
  type: 'progress' | 'done' | 'error';
  current?: number;
  total?: number;
  patientName?: string;
  message?: string;
}

@Component({
  selector: 'app-export-progress-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressBarModule, MatIconModule],
  templateUrl: './export-progress-dialog.component.html',
  styleUrl: './export-progress-dialog.component.scss',
})
export class ExportProgressDialogComponent implements OnDestroy {
  private backendUrl = environment.baseUrl;
  private eventSource: EventSource | null = null;

  status: 'connecting' | 'processing' | 'done' | 'error' = 'connecting';
  current = 0;
  total = 0;
  patientName = 'Iniciando...';
  errorMessage = '';
  progressMode: 'indeterminate' | 'determinate' = 'indeterminate';

  private static readonly STORAGE_KEY = 'ficlin_export_job';

  get progressPercent(): number {
    if (!this.total || this.total === 0) return 0;
    return Math.round((this.current / this.total) * 100);
  }

  constructor(
    private dialogRef: MatDialogRef<ExportProgressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportProgressData,
    private ngZone: NgZone
  ) {
    // Persistir jobId en localStorage para sobrevivir un refresh
    ExportProgressDialogComponent.saveJob(data.jobId, data.downloadFilename);
    this.connectToSse(data.jobId);
  }

  /** Guarda el job activo en localStorage */
  static saveJob(jobId: string, downloadFilename: string): void {
    localStorage.setItem(
      ExportProgressDialogComponent.STORAGE_KEY,
      JSON.stringify({ jobId, downloadFilename })
    );
  }

  /** Retorna el job guardado en localStorage, si existe */
  static getSavedJob(): ExportProgressData | null {
    try {
      const raw = localStorage.getItem(ExportProgressDialogComponent.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** Limpia el job guardado */
  static clearSavedJob(): void {
    localStorage.removeItem(ExportProgressDialogComponent.STORAGE_KEY);
  }

  private connectToSse(jobId: string) {
    const url = `${this.backendUrl}/generate-pdf/export/progress/${jobId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data: SseProgressEvent = JSON.parse(event.data);
        // Ejecutar en la zona de Angular para actualizar la vista
        this.ngZone.run(() => this.handleSseEvent(data));
      } catch {
        console.warn('[SSE] Failed to parse event:', event.data);
      }
    };

    this.eventSource.onerror = () => {
      this.ngZone.run(() => {
        // Solo marcar como error si no estamos ya en done/error
        if (this.status !== 'done' && this.status !== 'error') {
          this.status = 'error';
          this.errorMessage = 'Se perdió la conexión con el servidor.';
        }
        this.closeEventSource();
      });
    };
  }

  private handleSseEvent(event: SseProgressEvent) {
    if (event.type === 'progress') {
      this.status = 'processing';
      this.current = event.current ?? this.current;
      this.total = event.total ?? this.total;
      this.patientName = event.patientName ?? this.patientName;
      this.progressMode = this.total > 0 ? 'determinate' : 'indeterminate';
    } else if (event.type === 'done') {
      this.status = 'done';
      this.current = this.total;
      ExportProgressDialogComponent.clearSavedJob(); // ✅ limpiar tras descarga exitosa
      this.closeEventSource();
      this.triggerDownload();
    } else if (event.type === 'error') {
      this.status = 'error';
      this.errorMessage = event.message || 'Error desconocido al generar la exportación.';
      ExportProgressDialogComponent.clearSavedJob(); // ✅ limpiar en error
      this.closeEventSource();
    }
  }

  private triggerDownload() {
    const url = `${this.backendUrl}/generate-pdf/export/download/${this.data.jobId}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = this.data.downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  close() {
    this.closeEventSource();
    // Solo limpiar localStorage si ya terminó (done/error), no si el usuario cierra manualmente en progreso
    if (this.status === 'done' || this.status === 'error') {
      ExportProgressDialogComponent.clearSavedJob();
    }
    this.dialogRef.close();
  }

  private closeEventSource() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  ngOnDestroy() {
    this.closeEventSource();
  }
}
