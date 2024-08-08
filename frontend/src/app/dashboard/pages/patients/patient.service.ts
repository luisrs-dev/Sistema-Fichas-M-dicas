import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MedicalRecord } from '../../interfaces/medicalRecord.interface';
import { Patient } from '../../interfaces/patient.interface';
import { Demand } from '../../interfaces/demand.interface';

@Injectable({
  providedIn: 'root'
})
export class PatientService {


  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  getPatients(): Observable<Patient[]> {
    return this.http.get<any>(`${this.backend}/patient`);
  }
  getPatientById(id: string):Observable<{patient: Patient, medicalRecords: MedicalRecord[]}>{
    console.log({id});
    
    return this.http.get<{patient: Patient, medicalRecords: MedicalRecord[]}>(`${this.backend}/patient/${id}`);
  }

  getPatientsByProfile(profile:string): Observable<Patient[]> {
    return this.http.get<any>(`${this.backend}/patient/profile/${profile}`);
  }

  addPatient(Patient: Patient): Observable<any>{
    return this.http.post<any>(`${this.backend}/patient`, Patient)
      .pipe(
        tap( (user) => {
          localStorage.setItem('user', user._id)
        }
          // this._currentUser.set( user);
          // this._authStatus.set(AuthStatus.authenticated);
          // this.isAuthenticated = true;
          // console.log({ user, token});
        ),
        catchError( err => throwError( () => console.log(err)
        )) 
        // catchError( err => throwError( () => err.error.message)) 
      )
  }

  /*
   TODO: definir interfaz para datos sistrat
  */
   addFichaDemanda(userId: string, dataSistrat: any): Observable<any>{
    console.log({dataSistrat});
    
    return this.http.post<any>(`${this.backend}/patient/demanda`, {userId, dataSistrat})
      .pipe(
        catchError( err => throwError( () => err.error.message)) 
      )
  }

  saveToSistrat(userId: string): Observable<any>{
    return this.http.post<any>(`${this.backend}/patient/sistrat/record`, {userId})
      .pipe(
        catchError( err => throwError( () => err.error.message)) 
      )
  }

  

  constructor() { }

}
