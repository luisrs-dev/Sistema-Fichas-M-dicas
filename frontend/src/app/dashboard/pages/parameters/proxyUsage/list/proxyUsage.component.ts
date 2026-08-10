import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../angular-material/material.module';
import {
  ProxyReportResponse,
  ProxyUsageLogItem,
  ProxyUsageService
} from '../../../../services/proxyUsage.service';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-proxy-usage',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './proxyUsage.component.html',
  styleUrl: './proxyUsage.component.css',
})
export default class ProxyUsageComponent implements OnInit {
  private proxyUsageService = inject(ProxyUsageService);
  private cdr = inject(ChangeDetectorRef);

  public isLoading: boolean = false;
  public reportData: ProxyReportResponse | null = null;

  // Filtros
  public startDate: string = '';
  public endDate: string = '';
  public selectedUser: string = '';
  public selectedActivity: string = '';
  public selectedCenter: string = '';
  public page: number = 1;
  public limit: number = 20;

  // Columnas para tablas
  public userColumns: string[] = ['userName', 'userEmail', 'totalMB', 'count'];
  public activityColumns: string[] = ['activity', 'totalMB', 'count'];
  public logColumns: string[] = ['timestamp', 'userName', 'activity', 'sistratCenter', 'megabytes'];

  ngOnInit(): void {
    this.setPresetRange(15); // Por defecto: últimos 15 días
    this.loadReport();
  }

  setPresetRange(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];
    this.page = 1;
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading = true;
    this.proxyUsageService
      .getReport({
        startDate: this.startDate || undefined,
        endDate: this.endDate || undefined,
        userEmail: this.selectedUser || undefined,
        activity: this.selectedActivity || undefined,
        sistratCenter: this.selectedCenter || undefined,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (data) => {
          this.reportData = data;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          Notiflix.Notify.failure('Error al cargar reporte de consumo proxy');
          console.error(err);
          this.cdr.detectChanges();
        },
      });
  }

  onFilter(): void {
    this.page = 1;
    this.loadReport();
  }

  onResetFilters(): void {
    this.selectedUser = '';
    this.selectedActivity = '';
    this.selectedCenter = '';
    this.setPresetRange(15);
  }

  nextPage(): void {
    if (this.reportData && this.page < this.reportData.pagination.totalPages) {
      this.page++;
      this.loadReport();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadReport();
    }
  }

  formatMB(mb: number): string {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  }
}
