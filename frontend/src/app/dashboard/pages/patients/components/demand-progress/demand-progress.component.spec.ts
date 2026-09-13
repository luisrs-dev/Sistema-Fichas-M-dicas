import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject, of, throwError } from 'rxjs';
import { PatientService } from '../../patient.service';
import { DemandProgressComponent } from './demand-progress.component';

describe('DemandProgressComponent', () => {
  let service: jasmine.SpyObj<PatientService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let component: DemandProgressComponent;
  let accepted: Subject<boolean>;
  const finished = { _id: 'progress-test', status: 'COMPLETED', result: { submitted: true }, history: [] };
  beforeEach(() => {
    localStorage.removeItem('demand-ack:progress-test');
    service = jasmine.createSpyObj('PatientService', ['getActiveSistratJob', 'addFichaDemandaToSistrat']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    accepted = new Subject<boolean>();
    dialog.open.and.returnValue({ afterClosed: () => accepted, close: () => {} } as any);
    TestBed.configureTestingModule({ providers: [{ provide: PatientService, useValue: service }, { provide: MatDialog, useValue: dialog }] });
    component = TestBed.runInInjectionContext(() => new DemandProgressComponent());
    component.patientId = 'patient';
  });
  afterEach(() => { component.ngOnDestroy(); localStorage.removeItem('demand-ack:progress-test'); });
  it('keeps progress active until completion and requires explicit acknowledgement', fakeAsync(() => {
    service.getActiveSistratJob.and.returnValues(of({ success: true, job: { status: 'IN_PROGRESS', progress: 80, step: 'Alertas' } }), of({ success: true, job: finished }));
    component.ngOnChanges(); tick(0);
    expect(component.busy).toBeTrue(); expect(dialog.open).not.toHaveBeenCalled();
    tick(3000); expect(component.busy).toBeFalse();
    expect(dialog.open.calls.mostRecent().args[1]?.disableClose).toBeTrue();
    expect(localStorage.getItem('demand-ack:progress-test')).toBeNull();
    accepted.next(true);
    expect(localStorage.getItem('demand-ack:progress-test')).toBe('true');
  }));
  it('recovers polling after a temporary connection failure', fakeAsync(() => {
    service.getActiveSistratJob.and.returnValues(throwError(() => Error('offline')), of({ success: true, job: finished }));
    component.ngOnChanges(); tick(0);
    expect(component.connectionError).toContain('Reintentando');
    tick(3000); expect(dialog.open).toHaveBeenCalled(); expect(component.connectionError).toBe('');
  }));
  it('does not show success when only registration succeeded and alerts failed', fakeAsync(() => {
    service.getActiveSistratJob.and.returnValue(of({ success: true, job: { status: 'FAILED', result: { registered: true, submitted: true } } }));
    component.ngOnChanges(); tick(0);
    expect(component.preventResubmit).toBeTrue(); expect(dialog.open).not.toHaveBeenCalled();
    service.addFichaDemandaToSistrat.and.returnValue(of({ job: { status: 'PENDING' } }));
    component.start(true); tick(0);
    expect(service.addFichaDemandaToSistrat).toHaveBeenCalledWith('patient', true, false);
  }));
  it('restores terminal results after reload without showing acknowledged success again', fakeAsync(() => {
    localStorage.setItem('demand-ack:progress-test', 'true');
    service.getActiveSistratJob.and.returnValue(of({ success: true, job: finished }));
    component.ngOnChanges(); tick(0);
    expect(dialog.open).not.toHaveBeenCalled(); expect(component.preventResubmit).toBeTrue();
  }));
  it('does not issue a second POST while the first request is pending', () => {
    service.addFichaDemandaToSistrat.and.returnValue(new Subject<any>());
    component.start(); component.start();
    expect(service.addFichaDemandaToSistrat).toHaveBeenCalledTimes(1);
  });
});
