import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable, catchError, retry, throwError } from 'rxjs';
import { Service } from '../parameters/services/profesionalService.service';
import { MedicalRecord } from '../../interfaces/medicalRecord.interface';
import { MedicalRecordGrouped } from '../patients/detail/detail.component';

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

  /**
   * @param month
   * @param year
   * @returns
   */
  getMedialRecordsByMonthAndYear(month: number, year: number): Observable<ResponseMedicalRecordsByMonth> {
    return this.http.get<any>(`${this.backend}/medicalRecord/${year}/${month}`);
  }

  addMedicalRecord(medicalRecord: MedicalRecord): Observable<any> {
    console.log({ medicalRecord });
    return this.http.post<any>(`${this.backend}/medicalRecord`, medicalRecord).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  getLastPharmacologicalScheme(medicalRecords: MedicalRecord[]): MedicalRecord | null{
    const medicalRecordSorted = medicalRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestMedicalRecordWithScheme = medicalRecordSorted.find((record) => record.pharmacologicalScheme);
    return latestMedicalRecordWithScheme || null;
  }

  deleteMedicalRecord(id: string): Observable<any> {
    return this.http.delete<any>(`${this.backend}/medicalRecord/${id}`).pipe(catchError((err) => throwError(() => err.error.message)));
  }

  monthRecords(id: string, month: number, year: number = 2025, medicalRecordsGrouped: MedicalRecordGrouped[]): Observable<any> {
    return this.http.post<any>(`${this.backend}/medicalRecord/monthRecords/${id}`, { medicalRecordsGrouped, month, year })
    .pipe(
      retry(3),
      catchError((err) => throwError(() => err.error.message)));
  }

  getMonthlyLogs(): Observable<MonthlyLogListResponse> {
    return this.http.get<MonthlyLogListResponse>(`${this.backend}/medicalRecord/monthRecords/logs`);
  }

  getMonthlyLogContent(fileName: string): Observable<MonthlyLogContentResponse> {
    const encodedFileName = encodeURIComponent(fileName);
    return this.http.get<MonthlyLogContentResponse>(`${this.backend}/medicalRecord/monthRecords/logs/${encodedFileName}`);
  }
}


export interface ResponseMedicalRecordsByMonth {
  status:         boolean;
  message:        string;
  medicalRecords: MedicalRecord[];
}


export interface RegisteredBy {
  _id:         string;
  name:        string;
  email:       string;
  password:    string;
  signature:   null | string;
  profile:     string;
  permissions: string[];
  createdAt:   Date;
  updatedAt:   Date;
}

export interface MonthlyLogSummary {
  fileName: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyLogListResponse {
  status: boolean;
  logs: MonthlyLogSummary[];
}

export interface MonthlyLogContentResponse {
  status: boolean;
  fileName: string;
  content: string;
}
