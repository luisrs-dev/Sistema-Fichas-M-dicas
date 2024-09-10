import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MedicalRecord } from '../../interfaces/medicalRecord.interface';
import { Patient } from '../../interfaces/patient.interface';
import { Demand } from '../../interfaces/demand.interface';
import { AuthService } from '../../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  backend: string = environment.baseUrl;

  getPatients(programs: string[]): Observable<Patient[]> {
    const params = new HttpParams().set('programs', programs.join(','));
    return this.http.get<Patient[]>(`${this.backend}/patient`, { params });
  }
  getPatientById(id: string): Observable<{ patient: Patient; medicalRecords: MedicalRecord[] }> {
    return this.http.get<{ patient: Patient; medicalRecords: MedicalRecord[] }>(`${this.backend}/patient/${id}`);
  }

  getPatientsByProfile(profile: string): Observable<Patient[]> {
    return this.http.get<any>(`${this.backend}/patient/profile/${profile}`);
  }

  addPatient(patient: Patient): Observable<Patient> {
    return this.http.post<any>(`${this.backend}/patient`, patient).pipe(catchError((err) => throwError(() => console.log(err))));
  }

  /*
   TODO: definir interfaz para datos sistrat
  */
  addFichaDemanda(patientId: string, dataSistrat: any): Observable<any> {
    console.log({ dataSistrat });

    return this.http.post<any>(`${this.backend}/patient/demanda`, { patientId, dataSistrat }).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  addFichaDemandaToSistrat(patientId: string): Observable<any> {

    return this.http.post<any>(`${this.backend}/patient/demanda/sistrat`, { patientId }).pipe(catchError((err) => throwError(() => err.error.message)));
  }


  addFichaIngreso(userId: string, dataAdmissionForm: any): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/ficha-ingreso`, { userId, dataAdmissionForm }).pipe(catchError((err) => throwError(() => err.error.message)));
  }


  saveToSistrat(userId: string): Observable<any> {
    return this.http.post<any>(`${this.backend}/patient/sistrat/record`, { userId }).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  constructor() {}
}
