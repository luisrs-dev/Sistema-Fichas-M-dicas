import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SistratCenter {
  _id?: string;
  name: string;
  usuario: string;
  password?: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SistratCenterService {
  private apiUrl = `${environment.baseUrl}/sistrat-centers`;

  constructor(private http: HttpClient) { }

  getCenters(): Observable<SistratCenter[]> {
    return this.http.get<SistratCenter[]>(this.apiUrl);
  }

  getActiveCenters(): Observable<SistratCenter[]> {
    return this.http.get<SistratCenter[]>(`${this.apiUrl}/active`);
  }

  createCenter(center: SistratCenter): Observable<SistratCenter> {
    return this.http.post<SistratCenter>(this.apiUrl, center);
  }

  updateCenter(id: string, center: Partial<SistratCenter>): Observable<SistratCenter> {
    return this.http.put<SistratCenter>(`${this.apiUrl}/${id}`, center);
  }

  deleteCenter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
