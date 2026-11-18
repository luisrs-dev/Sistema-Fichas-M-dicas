import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { MaterialModule } from '../../../../angular-material/material.module';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../auth/auth.service';

import { createProfessionalReportPdf, ProfessionalReport as Report } from './professional-report-pdf';

interface Professional { _id: string; name: string; active?: boolean; }


@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './professional-report.component.html',
  styleUrl: './professional-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfessionalReportComponent implements OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.baseUrl}/professional-report`;
  private request?: Subscription;
  private professionalsRequest?: Subscription;
  private exportRequest?: Subscription;
  exporting = signal(false);
  exportError = signal('');
  professionals = signal<Professional[]>([]);
  loadingProfessionals = signal(false);
  loading = signal(false);
  error = signal('');
  professionalsError = signal('');
  result = signal<Report | null>(null);
  professionalId = '';
  professionalSelection: Professional | string | null = null;
  private today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  year = Number(this.today.find(p => p.type === 'year')!.value);
  month = Number(this.today.find(p => p.type === 'month')!.value);
  search = '';
  order = 'desc';
  page = 0;
  pageSize = 10;
  readonly columns = ['date', 'patient', 'rut', 'service', 'duration', 'actions'];
  readonly months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  ngOnInit() { this.loadProfessionals(); }
  loadProfessionals() {
    this.loadingProfessionals.set(true);
    this.professionalsError.set('');
    this.professionalsRequest?.unsubscribe();
    this.professionalsRequest = this.http.get<{ professionals: Professional[] }>(`${this.base}/professionals`).subscribe({
      next: ({ professionals }) => {
        this.professionals.set(professionals);
        const ownId = this.auth.getUser()?._id;
        this.professionalId = professionals.find(p => p._id === ownId)?._id || professionals[0]?._id || '';
        this.professionalSelection = professionals.find(p => p._id === this.professionalId) || null;
        this.loadingProfessionals.set(false);
      },
      error: () => { this.loadingProfessionals.set(false); this.professionalsError.set('No se pudieron cargar los profesionales.'); }
    });
  }
  readonly displayProfessional = (professional: Professional | string | null): string =>
    typeof professional === 'string' ? professional : professional?.name || '';

  private normalizeName(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  }

  filteredProfessionals() {
    const term = typeof this.professionalSelection === 'string' ? this.normalizeName(this.professionalSelection) : '';
    return this.professionals().filter(p => this.normalizeName(p.name).includes(term));
  }

  onProfessionalChange(value: Professional | string | null) {
    this.professionalSelection = value;
    this.professionalId = value && typeof value !== 'string' ? value._id : '';
    this.invalidate();
  }
  invalidate() {
    this.request?.unsubscribe();
    this.exportRequest?.unsubscribe();
    this.exporting.set(false);
    this.exportError.set('');
    this.loading.set(false);
    this.result.set(null);
    this.error.set('');
    this.page = 0;
  }
  consult(reset = true) {
    if (!this.professionalId || !Number.isInteger(this.year) || this.year < 1900 || this.year > 9999) {
      this.invalidate();
      this.error.set('Selecciona un profesional y un año válido.');
      return;
    }
    if (reset) this.page = 0;
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
    this.request = this.http.get<Report>(this.base, { params: {
      professionalId: this.professionalId, month: this.month, year: this.year,
      page: this.page, pageSize: this.pageSize, search: this.search.trim(), order: this.order
    } }).subscribe({
      next: result => { this.result.set(result); this.loading.set(false); },
      error: error => { this.error.set(error.error?.message || 'No se pudieron consultar las prestaciones. Intenta nuevamente.'); this.loading.set(false); }
    });
  }
  changePage(event: PageEvent) {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.consult(false);
  }
  downloadPdf() {
    if (!this.result()?.summary.total || this.exporting()) return;
    this.exporting.set(true);
    this.exportError.set('');
    const professional = this.professionals().find(p => p._id === this.professionalId)?.name || '';
    const month = this.month, year = this.year;
    const filters = { professional, period: `${this.months[month - 1]} ${year}`, search: this.search.trim(), order: this.order };
    this.exportRequest = this.http.get<Report>(this.base, { params: {
      professionalId: this.professionalId, month, year, search: filters.search, order: filters.order, exportAll: 'true'
    } }).subscribe({
      next: report => {
        try {
          if (report.records.length !== report.summary.total) throw new Error('Detalle incompleto');
          createProfessionalReportPdf(report, filters).save(`prestaciones-${year}-${String(month).padStart(2, '0')}.pdf`);
        } catch {
          this.exportError.set('No se pudo generar el PDF completo. Intenta nuevamente.');
        } finally { this.exporting.set(false); }
      },
      error: () => { this.exporting.set(false); this.exportError.set('No se pudo descargar el detalle completo. Intenta nuevamente.'); }
    });
  }
  ngOnDestroy() { this.request?.unsubscribe(); this.professionalsRequest?.unsubscribe(); this.exportRequest?.unsubscribe(); }
}
