import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MedicalRecord } from '../../interfaces/medicalRecord.interface';
import { Patient } from '../../interfaces/patient.interface';
import { Demand, DemandResponse } from '../../interfaces/demand.interface';
import { AuthService } from '../../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  private patientsSubject: BehaviorSubject<Patient[]>;
  private _patient: BehaviorSubject<{ patient: Patient, medicalRecords: MedicalRecord[] } | null>;

  constructor() {
    this.patientsSubject = new BehaviorSubject<Patient[]>([]);
    this._patient = new BehaviorSubject<{ patient: Patient, medicalRecords: MedicalRecord[] } | null>(null);
  }

  get patients() {
    return this.patientsSubject.asObservable();
  }

  get patient() {
    return this._patient.asObservable();
  }


  getPatientById(id: string): Observable<{ patient: Patient; medicalRecords: MedicalRecord[] }> {
    return this.http.get<{ patient: Patient; medicalRecords: MedicalRecord[] }>(`${this.backend}/patient/${id}`
    );
  }

  getPdfByProgram(startDate: string, endDate: string, centerName?: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/generate-pdf/medical-records/`, { startDate, endDate, centerName },
      {
        responseType: 'blob' as 'json' // clave para evitar el error
      }
    );
  }

  getPdfByPatientId(id: string): Observable<any> {
    // getPdfByPatientId(id: string): Observable<{ patient: Patient; medicalRecords: MedicalRecord[] }> {
    return this.http.get<any>(`${this.backend}/generate-pdf/medical-records/${id}`,
      {
        responseType: 'blob' as 'json' // 👈 clave para evitar el error
      }
    );
    // return this.http.get<{ patient: Patient; medicalRecords: MedicalRecord[] }>(`${this.backend}/medial-records/${id}`);
  }


  getPatientsByProfile(profile: string): Observable<Patient[]> {
    return this.http.get<any>(`${this.backend}/patient/profile/${profile}`);
  }

  addPatient(patient: Patient): Observable<Patient> {
    return this.http.post<any>(`${this.backend}/patient`, patient).pipe(catchError((err) => throwError(() => console.log(err))));
  }

  updatePatient(id: string, patient: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${this.backend}/patient/${id}`, patient)
      .pipe(
        catchError((err) => {
          console.error(err);
          return throwError(() => err);
        })
      );
  }

  /*
   TODO: definir interfaz para datos sistrat
  */
  addFichaDemanda(patientId: string, dataSistrat: any): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/demanda`, { patientId, dataSistrat }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al agregar ficha demanda')));
  }

  getDemandaByPatientId(patientId: string): Observable<DemandResponse> {
    return this.http.get<DemandResponse>(`${this.backend}/patient/demanda/${patientId}`).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al obtener ficha demanda')));
  }

  addFichaDemandaToSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/demanda/sistrat`, { patientId }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al agregar ficha demanda a SISTRAT')));
  }

  getDataWithRut(rut: string, center: string): Observable<any> {
    return this.http.get<any>(`${this.backend}/patient/rut/${rut}/${center}`).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al obtener datos con RUT')));
  }

  addFichaIngreso(patientId: string, dataAdmissionForm: any): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/ficha-ingreso`, { patientId, dataAdmissionForm }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al agregar ficha ingreso')));
  }

  getFichaIngreso(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.backend}/patient/ficha-ingreso/${patientId}`).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al obtener ficha ingreso')));
  }


  updateFichaIngreso(patientId: string, dataAdmissionForm: any): Observable<any> {
    return this.http.put<any>(`${this.backend}/patient/ficha-ingreso`, { patientId, dataAdmissionForm }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al actualizar ficha ingreso')));
  }



  addFichaIngresoToSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/ficha-ingreso/sistrat`, { patientId }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al agregar ficha ingreso a SISTRAT')));
  }

  saveToSistrat(userId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/sistrat/record`, { userId }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al guardar en SISTRAT')));
  }

  updateAlertSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/sistrat/alerts`, { patientId }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al actualizar alertas de SISTRAT')));
  }

  getPatients(programsIds: string[], options?: { active?: boolean }): Observable<Patient[]> {
    let params = new HttpParams();

    if (programsIds.length > 0) {
      params = params.set('programs', programsIds.join(',')); // Convertimos el array a string separado por comas
    }

    if (options?.active !== undefined) {
      params = params.set('active', String(options.active));
    }

    return this.http.get<Patient[]>(`${this.backend}/patient`, { params }).pipe(
      tap(patients => {
        this.patientsSubject.next(patients) // Actualizamos el BehaviorSubject
      })
    );
  }

  updatePatients(programsIds: string[], options?: { active?: boolean }): void {
    this.getPatients(programsIds, options).subscribe(); // Actualiza automáticamente el BehaviorSubject
  }

  updateActiveStatus(patientId: string, active: boolean): Observable<Patient> {
    return this.http.patch<Patient>(`${this.backend}/patient/${patientId}/active`, { active });
  }

  bulkUpdateAlertSistrat(center: string, patientIds: string[]): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/sistrat/bulk-alerts`, { center, patientIds });
  }

  getActiveSistratPatients(center: string, forceRefresh: boolean = false): Observable<{ success: boolean; data: any[]; message?: string }> {
    return this.http.get<{ success: boolean; data: any[]; message?: string }>(
      `${this.backend}/patient/sistrat/patients/${center}?forceRefresh=${forceRefresh}`
    );
  }

  fetchCodigoSistrat(patientId: string): Observable<{ success: boolean; patient: Patient; message?: string }> {
    return this.http.post<{ success: boolean; patient: Patient; message?: string }>(
      `${this.backend}/patient/${patientId}/sistrat-code`,
      {}
    );
  }

  setFormCie10(patientId: string, optionSelected: any) {
    console.log({ optionSelected });

    return this.http.post<any>(`${this.backend}/patient/sistrat/formCie10`, { patientId, optionSelected }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al setear form CIE10')));
  }

  resolveAlertSistrat(patientId: string, alertType: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/sistrat/resolve-alert`, { patientId, alertType }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al resolver alerta')));
  }

  // ─── TOP Form ────────────────────────────────────────────────────────────────

  getTopForm(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.backend}/topForm/${patientId}`).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al obtener TOP Form')));
  }

  saveTopForm(patientId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.backend}/topForm/${patientId}`, data).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al guardar TOP Form')));
  }

  syncTopFormSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/topForm/${patientId}/sistrat`, {}).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al sincronizar TOP con SISTRAT')));
  }

  parseVoiceForTop(text: string, section: 'section1' | 'section2' | 'section3'): Observable<any> {
    return this.http.post<any>(`${this.backend}/topForm/parse-voice`, { text, section }).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al procesar voz')));
  }

  // ─── Social Form ────────────────────────────────────────────────────────────────

  getSocialForm(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.backend}/socialForm/${patientId}`).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al obtener Social Form')));
  }

  saveSocialForm(patientId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.backend}/socialForm/${patientId}`, data).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al guardar Social Form')));
  }

  syncSocialFormSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/socialForm/sync/${patientId}`, {}).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al sincronizar con SISTRAT')));
  }

  // ─── Evaluation Form ──────────────────────────────────────────────────────────

  getEvaluationForm(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.backend}/evaluationForm/${patientId}`).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al obtener Evaluation Form')));
  }

  saveEvaluationForm(patientId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.backend}/evaluationForm/${patientId}`, data).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al guardar Evaluation Form')));
  }

  syncEvaluationFormSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/evaluationForm/sync/${patientId}`, {}).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al sincronizar evaluación con SISTRAT')));
  }

  // ─── Social Diagnosis Form (Orange Alert) ───────────────────────────────────

  getSocialDiagnosisForm(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.backend}/socialDiagnosisForm/${patientId}`).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al obtener Social Diagnosis Form')));
  }

  saveSocialDiagnosisForm(patientId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.backend}/socialDiagnosisForm/${patientId}`, data).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al guardar Social Diagnosis Form')));
  }

  syncSocialDiagnosisFormSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/socialDiagnosisForm/sync/${patientId}`, {}).pipe(catchError((err) => throwError(() => err.error?.error || err.error?.message || 'Error al sincronizar diagnóstico social con SISTRAT')));
  }
}
