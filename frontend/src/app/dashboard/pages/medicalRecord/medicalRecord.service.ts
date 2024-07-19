import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';
import { MedicalRecord } from '../../interfaces/medicalRecord.interface';

@Injectable({
  providedIn: 'root',
})
export class MedicalRecordService {
  constructor() {}

  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  getMedialRecords(): Observable<MedicalRecord[]> {
    return this.http.get<any>(`${this.backend}/medicalRecord`);
  }

  addMedicalRecord(medicalRecord: MedicalRecord): Observable<any> {
    console.log({medicalRecord});
    return this.http
      .post<any>(`${this.backend}/medicalRecord`, medicalRecord)
      .pipe(catchError((err) => throwError(() => err.error.message)));
  }
}
