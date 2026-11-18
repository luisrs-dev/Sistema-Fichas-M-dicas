import jsPDF from 'jspdf';

export interface ProfessionalReport {
  records: { _id: string; date: string; patientId?: string; patientName: string; rut?: string; service?: string; serviceCode?: string; duration?: string }[];
  summary: { total: number; patients: number };
  services: { _id: string; description?: string; code?: string; total: number }[];
}

export function createProfessionalReportPdf(report: ProfessionalReport, filters: { professional: string; period: string; search: string; order: string }) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const margin = 14, width = 269, bottom = 190;
  let y = 0;
  const text = (value: unknown) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim() || '-';
  function header() {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(23, 103, 84);
    doc.text('Prestaciones por profesional', margin, 17);
    doc.setTextColor(35); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    y = 24;
    for (const line of [`Profesional: ${text(filters.professional)}`, `Período: ${filters.period} | Orden: ${filters.order === 'asc' ? 'Más antiguas primero' : 'Más recientes primero'}`, `Paciente o RUT: ${filters.search || 'Todos'}`]) {
      const lines = doc.splitTextToSize(line, width); doc.text(lines, margin, y); y += lines.length * 5;
    }
    y += 4;
  }
  function newPage() { doc.addPage(); header(); }
  function section(title: string) {
    if (y + 15 > bottom) newPage();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(title, margin, y); y += 8;
  }
  function table(headers: string[], rows: string[][], widths: number[]) {
    const drawHeader = () => {
      doc.setFillColor(23, 103, 84); doc.rect(margin, y, width, 9, 'F');
      doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      let x = margin;
      headers.forEach((value, i) => { doc.text(value, x + 2, y + 6); x += widths[i]; });
      y += 9; doc.setTextColor(35); doc.setFont('helvetica', 'normal');
    };
    if (y + 22 > bottom) newPage();
    drawHeader();
    rows.forEach((row, index) => {
      const cells: string[][] = row.map((value, i) => doc.splitTextToSize(text(value), widths[i] - 4));
      let offset = 0;
      const lineCount = Math.max(...cells.map(c => c.length));
      while (offset < lineCount) {
        if (y + 9 > bottom) { newPage(); drawHeader(); }
        const count = Math.min(lineCount - offset, Math.max(1, Math.floor((bottom - y - 4) / 4.5)));
        const height = count * 4.5 + 4;
        if (index % 2 === 0) { doc.setFillColor(241, 247, 245); doc.rect(margin, y, width, height, 'F'); }
        let x = margin;
        cells.forEach((lines, i) => { const slice = lines.slice(offset, offset + count); if (slice.length) doc.text(slice, x + 2, y + 5); x += widths[i]; });
        y += height; offset += count;
        if (offset < lineCount) { newPage(); drawHeader(); }
      }
    });
    y += 10;
  }
  header();
  doc.setFontSize(11);
  doc.text(`Prestaciones: ${report.summary.total}    Pacientes distintos: ${report.summary.patients}`, margin, y); y += 9;
  doc.setFontSize(9); doc.text('Atenciones atribuidas al profesional que las registró. Cada registro por paciente cuenta como una prestación.', margin, y); y += 12;
  section('Resumen por prestación');
  table(['Prestación', 'Cantidad'], report.services.map(s => [s.description || s.code || 'Prestación no disponible', String(s.total)]), [239, 30]);
  section('Detalle completo de atenciones');
  table(['Fecha', 'Paciente', 'RUT', 'Prestación', 'Duración'], report.records.map(r => [r.date, r.patientName || 'Paciente no disponible', r.rut || '-', r.service || r.serviceCode || 'Prestación no disponible', r.duration ? `${r.duration} min` : '-']), [25, 78, 32, 109, 25]);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(90);
    doc.text(`Ficlin | Página ${page} de ${pages}`, margin, 201);
  }
  return doc;
}
