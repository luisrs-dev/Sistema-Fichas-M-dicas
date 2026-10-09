export type CareStatus = 'waiting' | 'active' | 'discharged';

export function isCareStatus(value: unknown): value is CareStatus {
  return value === 'waiting' || value === 'active' || value === 'discharged';
}

export function isReceptionProgram(program: unknown): boolean {
  if (!program || typeof program !== 'object' || !('name' in program)) return false;
  const name = program.name;
  return typeof name === 'string' && name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().replace(/\s+/g, ' ').toLowerCase() === 'rp - recepcion del paciente';
}

// Los documentos locales permiten clasificar registros anteriores a la migración.
// Un egreso confirmado siempre tiene prioridad sobre una ficha antigua.
export function resolveCareStatus(status: unknown, hasAdmission: boolean, hasDemand: boolean): CareStatus | null {
  if (status === 'discharged') return 'discharged';
  if (hasAdmission) return 'active';
  if (hasDemand || status === 'waiting') return 'waiting';
  return null;
}

// Nuevo Paciente guarda la demanda en el mismo documento, sin crear DemandModel.
// Los registros antiguos requieren evidencia de ese guardado y sus campos mínimos.
export function hasIntegratedDemand(patient: Record<string, unknown>): boolean {
  return patient.registeredOnFiclin === true && [
    'atentionRequestDate', 'mainSubstance', 'previousTreatments', 'typeContact', 'whoRequest', 'whoDerives',
  ].every(key => typeof patient[key] === 'string' && (patient[key] as string).trim().length > 0);
}
