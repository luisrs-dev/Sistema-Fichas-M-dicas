export const ALERT_OPTIONS = [
  { value: 'cie10', label: 'Diagnóstico CIE10 (Azul)' },
  { value: 'consentimiento', label: 'TOP (Negro)' },
  { value: 'integracionSocial', label: 'Integración social (Amarillo)' },
  { value: 'evaluacion', label: 'Evaluación (Verde)' },
  { value: 'egreso', label: 'Egreso / Sin prestaciones (Rojo)' },
  { value: 'diagnosticoSocial', label: 'Diagnóstico de integración social (Naranja)' },
] as const;
export type AlertType = typeof ALERT_OPTIONS[number]['value'];

export function defaultRoleAlerts(name: string): AlertType[] {
  const role = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const alerts: AlertType[] = [];
  if (role.includes('medico')) alerts.push('cie10');
  if (role.includes('psicolog')) alerts.push('consentimiento', 'evaluacion');
  if (role.includes('terapeuta') || role.includes('ocupacional')) alerts.push('evaluacion');
  if (role.includes('trabajador') || role.includes('social')) alerts.push('integracionSocial', 'diagnosticoSocial');
  return [...new Set(alerts)];
}

export function canViewAlert(alert: AlertType, profile: { name?: string; visibleAlerts?: string[] } | null | undefined,
  isAdmin: boolean, programName = ''): boolean {
  if (isAdmin) return true;
  if (!profile) return false;
  if (Array.isArray(profile.visibleAlerts)) return profile.visibleAlerts.includes(alert);
  // Compatibility for cargos that have not yet been configured.
  if (defaultRoleAlerts(profile.name || '').includes(alert)) return true;
  const program = programName.toUpperCase();
  return (alert === 'consentimiento' && program.includes('PAI')) ||
    (alert === 'evaluacion' && (program.includes('PAI') || program.includes('PR')));
}
