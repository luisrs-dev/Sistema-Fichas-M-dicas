import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Notiflix from 'notiflix';
import { MaterialModule } from '../../../angular-material/material.module';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../auth/interfaces/login-response.interface';
import { SystemStatusService } from './system-status.service';
import { SystemStatus } from './system-status.interface';

@Component({
    selector: 'app-health-check',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MaterialModule,
        DatePipe,
    ],
    templateUrl: './healthCheck.component.html',
    styleUrl: './healthCheck.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HealthCheckComponent implements OnInit {
    private readonly systemStatusService = inject(SystemStatusService);
    private readonly authService = inject(AuthService);

    readonly loading = signal(true);
    readonly saving = signal(false);
    readonly systemStatus = signal<SystemStatus | null>(null);
    readonly history = signal<SystemStatus[]>([]);
    readonly selectedState = signal(true);
    readonly note = signal('');

    ngOnInit() {
        this.loadStatus();
    }

    onStateChange(isOpen: boolean) {
        this.selectedState.set(isOpen);
    }

    onNoteChange(note: string) {
        this.note.set(note);
    }

    saveStatus() {
        if (this.saving()) {
            return;
        }

        const user: User = this.authService.getUser();
        this.saving.set(true);

        this.systemStatusService
            .updateStatus({
                isOpen: this.selectedState(),
                note: this.note().trim(),
                updatedByName: user?.name || user?.email || 'Administrador',
                updatedByUserId: user?._id,
            })
            .subscribe({
                next: (status) => {
                    this.saving.set(false);
                    this.applyStatus(status);
                    this.loadHistory();
                    Notiflix.Notify.success(
                        status.isOpen ? 'El sistema quedó abierto' : 'El sistema quedó cerrado'
                    );
                },
                error: () => {
                    this.saving.set(false);
                    Notiflix.Notify.failure('No se pudo actualizar el estado del sistema');
                },
            });
    }

    private loadStatus() {
        this.loading.set(true);
        this.systemStatusService.getStatus().subscribe({
            next: (status) => {
                this.applyStatus(status);
                this.loadHistory();
            },
            error: () => {
                this.loading.set(false);
                Notiflix.Notify.failure('No se pudo cargar el estado del sistema');
            },
        });
    }

    private loadHistory() {
        this.systemStatusService.getHistory().subscribe({
            next: (history) => {
                this.history.set(history);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                Notiflix.Notify.failure('No se pudo cargar el historial del sistema');
            },
        });
    }

    private applyStatus(status: SystemStatus) {
        this.systemStatus.set(status);
        this.selectedState.set(status.isOpen);
        this.note.set(status.note || '');
    }
}
