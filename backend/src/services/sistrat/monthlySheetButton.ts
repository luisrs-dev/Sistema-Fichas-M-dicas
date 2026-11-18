export const MONTHLY_SHEET_BLOCKED_MESSAGE = 'Ficha mensual bloqueada en SISTRAT: el botón «Ingresar atenciones» está deshabilitado para este paciente. No se enviaron atenciones. Revisa el bloqueo en SISTRAT antes de reintentar.';

// Se ejecuta dentro de page.evaluate: no debe depender de variables externas.
export function openMonthlySheetButton(normalizedTarget: string, patientCode: string | null): 'OPENED' | 'BLOCKED' | 'BUTTON_NOT_FOUND' | 'NOT_FOUND' {
  const normalize = (value?: string) => (value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase();
  const table = document.getElementById('table_pacientes') as HTMLTableElement | null;
  if (!table) return 'NOT_FOUND';
  for (let i = 1; i < table.rows.length; i++) {
    const cells = table.rows.item(i)?.cells;
    if (!cells) continue;
    const name = cells.item(1)?.innerText || '';
    const code = cells.item(2)?.innerText?.trim() || '';
    if (normalize(name) !== normalize(normalizedTarget) && !(patientCode && code === patientCode)) continue;

    // SISTRAT repite id=fmensual en todas las filas. Buscar solo en la fila encontrada.
    const button = cells.item(5)?.querySelector("span[name='fmensual']") as HTMLElement | null;
    if (!button) return 'BUTTON_NOT_FOUND';
    const disabled = button.classList.contains('ui-icon-cancel')
      || !!button.closest('.ui-state-disabled, [aria-disabled="true"], [disabled]');
    // En el listado de SISTRAT los botones habilitados tienen un onclick inline.
    const hasAction = !!button.getAttribute('onclick')?.trim() || typeof button.onclick === 'function';
    if (disabled || !hasAction) return 'BLOCKED';
    button.click();
    return 'OPENED';
  }
  return 'NOT_FOUND';
}
