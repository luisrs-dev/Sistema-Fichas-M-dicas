import { load } from 'cheerio';
import Sistrat from './sistrat/sistrat.class';

export const normalizeHistoricalCode = (code: string) => code.replace(/\u00a0/g, ' ').trim().toUpperCase();

export function extractHistoricalCodes(html: string): string[] {
  const $ = load(html);
  const table = $('#table_pacientes_historicos');
  if (!table.length) throw new Error('No se encontró la tabla de pacientes históricos');
  const codes: string[] = [];
  table.find('tbody tr').each((_, row) => {
    const cells = $(row).children('th,td');
    if (cells.length === 1 && /sin|no .*registro|no .*dato|no .*paciente/i.test(cells.text())) return;
    if (cells.length < 3) throw new Error('Fila histórica con estructura desconocida');
    const code = normalizeHistoricalCode(cells.eq(2).text());
    if (!code) throw new Error('Paciente histórico sin código de identificación');
    codes.push(code);
  });
  return [...new Set(codes)];
}

export async function fetchHistoricalCodes(center: string, report: (step: string, progress: number) => Promise<void>) {
  const sistrat = new Sistrat();
  try {
    await report('Conectando con SISTRAT', 10);
    const page = await sistrat.login(center);
    await page.waitForSelector('#flyout', { visible: true });
    await page.click('#flyout');
    const link = 'a[href="php/consultar_paciente_historicos.php"]';
    await page.waitForSelector(link, { visible: true });
    await report('Abriendo el filtro de pacientes históricos', 20);
    await page.click(link);
    // SISTRAT puede actualizar el contenido sin navegar el documento principal.
    // Esperar el control que necesitamos, no un evento de navegación obligatorio.
    await page.waitForSelector('#filtrar', { visible: true, timeout: 60000 });
    await report('Consultando usuarios históricos', 25);
    await page.evaluate(() => {
      const previous = document.querySelector('#table_pacientes_historicos');
      if (!previous) return;
      // Si ya había una tabla, esperar su sustitución o actualización por el filtro.
      previous.setAttribute('data-ficlin-awaiting-filter', 'true');
      const observer = new MutationObserver(() => {
        previous.removeAttribute('data-ficlin-awaiting-filter');
        observer.disconnect();
      });
      observer.observe(previous, { childList: true, subtree: true, characterData: true });
    });
    await page.click('#filtrar');
    await report('Esperando el resultado del filtro', 30);
    await page.waitForSelector('#table_pacientes_historicos:not([data-ficlin-awaiting-filter])', { visible: true, timeout: 60000 });
    const html = await page.evaluate(() => {
      const table = document.querySelector('#table_pacientes_historicos') as HTMLTableElement;
      const jq = (window as any).jQuery;
      // DataTables puede mantener filas de otras páginas fuera del DOM visible.
      if (jq?.fn?.dataTable?.isDataTable?.(table)) {
        const api = jq(table).DataTable();
        if (api.settings()[0].oFeatures.bServerSide) throw new Error('Paginación remota no soportada: no se actualizará un listado incompleto');
        const copy = table.cloneNode(false) as HTMLTableElement;
        const body = copy.createTBody();
        api.rows({ search: 'none', page: 'all' }).nodes().toArray().forEach((row: Element) => body.appendChild(row.cloneNode(true)));
        return copy.outerHTML;
      }
      if (document.querySelector('.dataTables_paginate, .pagination, .pager, a[rel="next"], #table_pacientes_historicos_next')) {
        throw new Error('Se detectó paginación no reconocida. No se actualizará un listado incompleto');
      }
      return table.outerHTML;
    });
    const codes = extractHistoricalCodes(html);
    await report(`Listado leído: ${codes.length} códigos únicos`, 40);
    return codes;
  } finally {
    await sistrat.scrapper.closeBrowser();
  }
}
