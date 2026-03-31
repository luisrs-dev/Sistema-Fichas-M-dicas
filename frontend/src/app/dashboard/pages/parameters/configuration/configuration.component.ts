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

  readonly keyDemanda = 'sistrat-direct-record-demanda';
  readonly keyAdmission = 'sistrat-direct-record-admission';
  readonly keyAlerts = 'sistrat-direct-record-alerts';
  readonly keyMassive = 'sistrat-direct-record-massive';
  readonly keyWait = 'sistrat-browser-wait-minutes';

  loading = signal(true);
  saving = signal(false);
  
  valDemanda = signal(false);
  valAdmission = signal(false);
  valAlerts = signal(false);
  valMassive = signal(false);
  valWait = signal(5);

  configs = signal<EnvironmentConfig[]>([]);

  ngOnInit() {
    this.fetchConfigurations();
  }

  fetchConfigurations() {
    this.loading.set(true);
    this.parametersService.getEnvironmentConfigs().subscribe({
      next: (configs) => {
        this.configs.set(configs);
        
        const confDemanda = configs.find(c => c.key === this.keyDemanda);
        this.valDemanda.set(confDemanda ? this.normalizeBooleanValue(confDemanda.value) : false);

        const confAdmission = configs.find(c => c.key === this.keyAdmission);
        this.valAdmission.set(confAdmission ? this.normalizeBooleanValue(confAdmission.value) : false);

        const confAlerts = configs.find(c => c.key === this.keyAlerts);
        this.valAlerts.set(confAlerts ? this.normalizeBooleanValue(confAlerts.value) : false);

        const confMassive = configs.find(c => c.key === this.keyMassive);
        this.valMassive.set(confMassive ? this.normalizeBooleanValue(confMassive.value) : false);

        const confWait = configs.find(c => c.key === this.keyWait);

        this.valWait.set(confWait && !isNaN(Number(confWait.value)) ? Number(confWait.value) : 5);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        Notiflix.Notify.failure('No se pudieron cargar las configuraciones');
      },
    });
  }

  onToggleValue(key: string, value: any) {
    if (key === this.keyDemanda) this.valDemanda.set(value);
    if (key === this.keyAdmission) this.valAdmission.set(value);
    if (key === this.keyAlerts) this.valAlerts.set(value);
    if (key === this.keyMassive) this.valMassive.set(value);
  }

  onChangeWait(value: number) {
    this.valWait.set(value);
  }

  onSaveDirectRecord() {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);

    const payloads: EnvironmentConfig[] = [
      { key: this.keyDemanda, label: 'Registro Directo Demanda', type: 'boolean', value: this.valDemanda(), description: 'Enviar automáticamente sección de demanda a SISTRAT' },
      { key: this.keyAdmission, label: 'Registro Directo Ingreso', type: 'boolean', value: this.valAdmission(), description: 'Enviar automáticamente ficha de ingreso a SISTRAT' },
      { key: this.keyAlerts, label: 'Registro Directo Alertas', type: 'boolean', value: this.valAlerts(), description: 'Enviar automáticamente los formularios que originan alertas (TOP, Social, etc) a SISTRAT' },
      { key: this.keyMassive, label: 'Registro Directo Masivo', type: 'boolean', value: this.valMassive(), description: 'Guardar mes a mes registros masivos (asistencia/atención) directamente en SISTRAT sin validación manual' },
      { key: this.keyWait, label: 'Minutos de Navegador Abierto', type: 'string', value: String(this.valWait()), description: 'Minutos que el navegador estará abierto para revisión si no se activa el registro directo' }
    ];

    let savedCount = 0;
    
    payloads.forEach(payload => {
      this.parametersService.upsertEnvironmentConfig(payload).subscribe({
        next: (config) => {
          this.upsertConfigInList(config);
          savedCount++;
          if (savedCount === payloads.length) {
            this.saving.set(false);
            Notiflix.Notify.success('Configuraciones guardadas exitosamente');
          }
        },
        error: () => {
          this.saving.set(false);
          Notiflix.Notify.failure('Error al guardar: ' + payload.label);
        }
      });
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
