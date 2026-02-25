import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import Notiflix from 'notiflix';
import { MaterialModule } from '../../../../angular-material/material.module';
import { EnvironmentConfig } from '../interfaces/parameter.interface';
import { ParametersService } from '../parameters.service';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
})
export default class ConfigurationComponent {
  private readonly parametersService = inject(ParametersService);

  readonly directRecordKey = 'sistrat-direct-record';
  readonly directRecordLabel = 'Registro directo en SISTRAT';

  loading = signal(true);
  saving = signal(false);
  directRecordValue = signal(true);
  configs = signal<EnvironmentConfig[]>([]);

  ngOnInit() {
    this.fetchConfigurations();
  }

  fetchConfigurations() {
    this.loading.set(true);
    this.parametersService.getEnvironmentConfigs().subscribe({
      next: (configs) => {
        this.configs.set(configs);
        const directConfig = configs.find((config) => config.key === this.directRecordKey);
        this.directRecordValue.set(this.normalizeBooleanValue(directConfig?.value));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        Notiflix.Notify.failure('No se pudieron cargar las configuraciones');
      },
    });
  }

  onToggleDirectRecord(checked: boolean) {
    this.directRecordValue.set(checked);
  }

  onSaveDirectRecord() {
    if (this.saving()) {
      return;
    }

    const payload: EnvironmentConfig = {
      key: this.directRecordKey,
      label: this.directRecordLabel,
      type: 'boolean',
      value: this.directRecordValue(),
      description:
        'Define si los registros masivos se envían directo a SISTRAT o solo se prueban.',
    };

    this.saving.set(true);
    this.parametersService.upsertEnvironmentConfig(payload).subscribe({
      next: (config) => {
        this.saving.set(false);
        this.upsertConfigInList(config);
        Notiflix.Notify.success('Configuración actualizada');
      },
      error: () => {
        this.saving.set(false);
        Notiflix.Notify.failure('No se pudo guardar la configuración');
      },
    });
  }

  private normalizeBooleanValue(value: EnvironmentConfig['value'] | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value === 'true';
    }

    return true;
  }

  private upsertConfigInList(config: EnvironmentConfig) {
    const filtered = this.configs().filter((item) => item.key !== config.key);
    this.configs.set([...filtered, config]);
  }
}
