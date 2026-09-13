import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription, catchError, exhaustMap, of, timer } from 'rxjs';
import { MaterialModule } from '../../../../../angular-material/material.module';
import { PatientService } from '../../patient.service';

@Component({
  standalone: true, imports: [MaterialModule],
  template: `<h2 mat-dialog-title>Registro exitoso</h2>
    <mat-dialog-content>La demanda fue registrada en SISTRAT y sus alertas fueron actualizadas correctamente.</mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-flat-button color="primary" (click)="close()">Entendido</button></mat-dialog-actions>`
})
export class DemandSuccessDialog {
  private ref = inject(MatDialogRef<DemandSuccessDialog>);
  close() { this.ref.close(true); }
}

@Component({
  selector: 'app-demand-progress', standalone: true, imports: [CommonModule, MaterialModule],
  template: `
    <section *ngIf="job || busy || connectionError || requestError" class="progress-panel" aria-label="Sincronización SISTRAT">
      <h3>Registro de demanda en SISTRAT</h3>
      <p role="status" aria-live="polite"><strong>{{ job?.step || 'Consultando estado del registro…' }}</strong></p>
      <p *ngIf="busy">Tiempo transcurrido: {{ elapsed }} · Puedes consultar otras secciones y regresar.</p>
      <mat-progress-bar *ngIf="busy" mode="determinate" [value]="job?.progress || 0" aria-label="Avance por etapas"></mat-progress-bar>
      <ol *ngIf="job?.history?.length">
        <li *ngFor="let entry of job.history; let last = last">{{ !last || job.status === 'COMPLETED' ? '✓ ' : '• ' }}{{ entry.step }}</li>
      </ol>
      <p *ngIf="requestError" role="alert">{{ requestError }}</p>
      <p *ngIf="connectionError" role="alert">{{ connectionError }}</p>
      <div *ngIf="job?.status === 'FAILED'" role="alert">
        <p>{{ job.error }}</p>
        <button *ngIf="job.result?.registered" mat-stroked-button color="primary" [disabled]="busy" (click)="start(true)">Reintentar solo las alertas</button>
        <button *ngIf="job.result?.submitted && !job.result?.registered" mat-stroked-button color="primary" [disabled]="busy" (click)="start(false, true)">Verificar registro en SISTRAT</button>
      </div>
    </section>`,
  styles: [`:host { display: block; scroll-margin-top: 20px; } .progress-panel { margin: 16px 0; padding: 20px; border: 1px solid #90caf9; border-radius: 12px; background: #f5faff; } h3 { margin-top: 0; } li { margin: 6px 0; } p { overflow-wrap: anywhere; }`]
})
export class DemandProgressComponent implements OnChanges, OnDestroy {
  @Input() patientId = '';
  @Output() busyChange = new EventEmitter<boolean>();
  @Output() completed = new EventEmitter<void>();
  private service = inject(PatientService);
  private host = inject(ElementRef, { optional: true });
  private dialog = inject(MatDialog);
  private polling?: Subscription;
  private startRequest?: Subscription;
  private successDialog?: MatDialogRef<DemandSuccessDialog>;
  private displayedJob = '';
  job: any;
  busy = false;
  elapsed = '0 s';
  connectionError = '';
  requestError = '';

  get preventResubmit() { return this.busy || !!this.job?.result?.submitted || this.job?.status === 'COMPLETED'; }

  ngOnChanges() {
    this.polling?.unsubscribe();
    this.startRequest?.unsubscribe();
    this.successDialog?.close();
    this.displayedJob = '';
    this.requestError = '';
    this.connectionError = '';
    this.job = null;
    if (this.patientId) {
      this.setBusy(true);
      this.watch();
    }
  }
  private setBusy(value: boolean) { this.busy = value; this.busyChange.emit(value); }
  private watch() {
    this.polling?.unsubscribe();
    this.polling = timer(0, 3000).pipe(exhaustMap(() =>
      this.service.getActiveSistratJob(this.patientId, 'demanda').pipe(catchError(() => {
        this.connectionError = 'No se pudo consultar el avance. Reintentando la conexión…';
        return of(null);
      }))
    )).subscribe(response => {
      if (!response) return;
      this.connectionError = '';
      this.job = response.job;
      const active = !!this.job && ['PENDING', 'IN_PROGRESS'].includes(this.job.status);
      this.setBusy(active);
      if (this.job) {
        const seconds = Math.max(0, Math.floor((Date.now() - new Date(this.job.startedAt || this.job.createdAt).getTime()) / 1000));
        this.elapsed = `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
      }
      if (!active) {
        this.polling?.unsubscribe();
        if (this.job?.status === 'COMPLETED') this.showSuccess();
      }
    });
  }
  start(alertsOnly = false, verifyOnly = false) {
    if (this.busy || !this.patientId) return;
    this.setBusy(true);
    this.host?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.connectionError = '';
    this.requestError = '';
    this.startRequest = this.service.addFichaDemandaToSistrat(this.patientId, alertsOnly, verifyOnly).subscribe({
      next: response => { this.job = response.job; this.watch(); },
      error: error => {
        this.requestError = String(error);
        // A failed HTTP response does not prove the server failed to start the task.
        this.watch();
      }
    });
  }
  private showSuccess() {
    const id = String(this.job._id);
    this.completed.emit();
    if (this.displayedJob === id || this.readAck(id)) return;
    this.displayedJob = id;
    this.successDialog = this.dialog.open(DemandSuccessDialog, { disableClose: true, closeOnNavigation: false, width: '480px' });
    this.successDialog.afterClosed().subscribe(accepted => {
      if (accepted) { try { localStorage.setItem(`demand-ack:${id}`, 'true'); } catch {} }
    });
  }
  private readAck(id: string) { try { return localStorage.getItem(`demand-ack:${id}`) === 'true'; } catch { return false; } }
  ngOnDestroy() { this.polling?.unsubscribe(); this.startRequest?.unsubscribe(); this.successDialog?.close(); }
}
