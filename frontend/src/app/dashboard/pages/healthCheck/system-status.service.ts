import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SystemStatus } from './system-status.interface';

@Injectable({
  providedIn: 'root',
})
export class SystemStatusService {
  private readonly http = inject(HttpClient);
  private readonly backend = environment.baseUrl;

  getStatus(): Observable<SystemStatus> {
    return this.http.get<SystemStatus>(`${this.backend}/system-status`);
  }

  getHistory(): Observable<SystemStatus[]> {
    return this.http.get<SystemStatus[]>(`${this.backend}/system-status/history`);
  }

  updateStatus(payload: Pick<SystemStatus, 'isOpen' | 'note' | 'updatedByName' | 'updatedByUserId'>): Observable<SystemStatus> {
    return this.http.put<SystemStatus>(`${this.backend}/system-status`, payload);
  }
}