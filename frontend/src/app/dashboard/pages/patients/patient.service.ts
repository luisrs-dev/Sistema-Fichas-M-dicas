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
  private _patient: BehaviorSubject<{patient:Patient, medicalRecords: MedicalRecord[]} | null>;

  constructor(){
    this.patientsSubject = new BehaviorSubject<Patient[]>([]);
    this._patient = new BehaviorSubject<{patient:Patient, medicalRecords: MedicalRecord[]} | null>(null);
  }

  get patients(){
    return this.patientsSubject.asObservable();
  }

  get patient(){
    return this._patient.asObservable();
  }


  getPatientById(id: string): Observable<{ patient: Patient; medicalRecords: MedicalRecord[] }> {
    return this.http.get<{ patient: Patient; medicalRecords: MedicalRecord[] }>(`${this.backend}/patient/${id}`
    );
  }

  getPdfByProgram(startDate: string, endDate: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/generate-pdf/medical-records/`, {startDate, endDate},
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
    return this.http.post<any>(`${this.backend}/patient/demanda`, { patientId, dataSistrat }).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  getDemandaByPatientId(patientId: string): Observable<DemandResponse> {
    return this.http.get<DemandResponse>(`${this.backend}/patient/demanda/${patientId}`).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  addFichaDemandaToSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/demanda/sistrat`, { patientId }).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  addFichaIngreso(patientId: string, dataAdmissionForm: any): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/ficha-ingreso`, { patientId, dataAdmissionForm }).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  getFichaIngreso(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.backend}/patient/ficha-ingreso/${patientId}`).pipe(catchError((err) => throwError(() => err.error.message)));
  }


  updateFichaIngreso(patientId: string, dataAdmissionForm: any): Observable<any> {
    return this.http.put<any>(`${this.backend}/patient/ficha-ingreso`, { patientId, dataAdmissionForm }).pipe(catchError((err) => throwError(() => err.error.message)));
  }



  addFichaIngresoToSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/ficha-ingreso/sistrat`, { patientId }).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  saveToSistrat(userId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/sistrat/record`, { userId }).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  updateAlertSistrat(patientId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/sistrat/alerts`, { patientId }).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  getPatients(programsIds: string[]): Observable<Patient[]> {
    let params = new HttpParams();

    if (programsIds.length > 0) {
      params = params.set('programs', programsIds.join(',')); // Convertimos el array a string separado por comas
    }

    return this.http.get<Patient[]>(`${this.backend}/patient`, { params }).pipe(
      tap(patients => {
        this.patientsSubject.next(patients) // Actualizamos el BehaviorSubject
      })
    );
  }

  updatePatients(programsIds: string[]): void {
    this.getPatients(programsIds).subscribe(); // Actualiza automáticamente el BehaviorSubject
  }

  setFormCie10(patientId: string, optionSelected: any){
    console.log({optionSelected});

    return this.http.post<any>(`${this.backend}/patient/sistrat/formCie10`, { patientId, optionSelected }).pipe(catchError((err) => throwError(() => err.error.message)));
  }
}
