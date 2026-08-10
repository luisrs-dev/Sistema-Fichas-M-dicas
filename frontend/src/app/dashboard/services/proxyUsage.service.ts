import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProxyUsageSummary {
  totalMB: number;
  totalCount: number;
  avgMBPerRequest: number;
  topUser: string;
  topActivity: string;
}

export interface ProxyUsageGroupedItem {
  userEmail?: string;
  userName?: string;
  activity?: string;
  totalMB: number;
  count: number;
}

export interface ProxyUsageLogItem {
  _id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  activity: string;
  sistratCenter?: string;
  patientId?: string;
  bytesDownloaded: number;
  megabytes: number;
  timestamp: string;
}

export interface ProxyReportResponse {
  summary: ProxyUsageSummary;
  byUser: ProxyUsageGroupedItem[];
  byActivity: ProxyUsageGroupedItem[];
  logs: ProxyUsageLogItem[];
  pagination: {
    page: number;
    limit: number;
    totalLogs: number;
    totalPages: number;
  };
}

export interface ProxyReportFilterParams {
  startDate?: string;
  endDate?: string;
  userEmail?: string;
  activity?: string;
  sistratCenter?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProxyUsageService {
  private apiUrl = `${environment.baseUrl}/proxy-usage/report`;

  constructor(private http: HttpClient) { }

  getReport(filters: ProxyReportFilterParams): Observable<ProxyReportResponse> {
    let params = new HttpParams();

    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.userEmail) params = params.set('userEmail', filters.userEmail);
    if (filters.activity) params = params.set('activity', filters.activity);
    if (filters.sistratCenter) params = params.set('sistratCenter', filters.sistratCenter);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ProxyReportResponse>(this.apiUrl, { params });
  }
}
