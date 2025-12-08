import nodemailer from "nodemailer";
import { BulkMonthlyProcessSummary } from "../interfaces/bulkMonthlyRecord.interface";

const resolveRecipients = (): string[] => {
  const rawList = process.env.BULK_MONTHLY_REPORT_RECIPIENTS || "";
  return rawList
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = (process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Configuración SMTP incompleta. Revise SMTP_HOST, SMTP_USER y SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

const buildHtmlSummary = (summary: BulkMonthlyProcessSummary) => {
  const rows = summary.results
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 8px">${item.patientId}</td>
          <td style="padding:4px 8px;text-transform:capitalize">${item.status}</td>
          <td style="padding:4px 8px">${item.reason || "-"}</td>
        </tr>`
    )
    .join("");

  return `
    <div>
      <p>Resumen del proceso masivo de fichas médicas.</p>
      <ul>
        <li><strong>Mes/Año:</strong> ${summary.month}/${summary.year}</li>
        <li><strong>Inicio:</strong> ${summary.startedAt}</li>
        <li><strong>Fin:</strong> ${summary.finishedAt}</li>
        <li><strong>Pacientes con fichas:</strong> ${summary.totalPatientsWithRecords}</li>
        <li><strong>Registrados:</strong> ${summary.registered}</li>
        <li><strong>Sin movimiento:</strong> ${summary.skipped}</li>
        <li><strong>Errores:</strong> ${summary.errors}</li>
        ${summary.logPath ? `<li><strong>Log:</strong> ${summary.logPath}</li>` : ""}
      </ul>
      <table style="border-collapse:collapse;font-size:12px;width:100%;">
        <thead>
          <tr>
            <th style="text-align:left;border-bottom:1px solid #ccc;padding:4px 8px">Paciente</th>
            <th style="text-align:left;border-bottom:1px solid #ccc;padding:4px 8px">Estado</th>
            <th style="text-align:left;border-bottom:1px solid #ccc;padding:4px 8px">Detalle</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

const buildTextSummary = (summary: BulkMonthlyProcessSummary) => {
  const lines = [
    `Mes/Año: ${summary.month}/${summary.year}`,
    `Inicio: ${summary.startedAt}`,
    `Fin: ${summary.finishedAt}`,
    `Pacientes con fichas: ${summary.totalPatientsWithRecords}`,
    `Registrados: ${summary.registered}`,
    `Sin movimiento: ${summary.skipped}`,
    `Errores: ${summary.errors}`,
  ];

  if (summary.logPath) {
    lines.push(`Log: ${summary.logPath}`);
  }

  summary.results.forEach((item) => {
    lines.push(`- ${item.patientId} => ${item.status}${item.reason ? ` (${item.reason})` : ""}`);
  });

  return lines.join("\n");
};

const sendMonthlyBulkSummaryEmail = async (summary: BulkMonthlyProcessSummary): Promise<string[]> => {
  const recipients = resolveRecipients();

  if (!recipients.length) {
    throw new Error("Configure al menos un destinatario en BULK_MONTHLY_REPORT_RECIPIENTS.");
  }

  const transporter = buildTransporter();
  const subject = `Resumen fichas mensuales ${summary.month}/${summary.year}`;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!from) {
    throw new Error("Defina SMTP_FROM o SMTP_USER para el remitente del correo.");
  }

  const [html, text] = [buildHtmlSummary(summary), buildTextSummary(summary)];

  await transporter.sendMail({
    from,
    to: recipients,
    subject,
    text,
    html,
  });

  return recipients;
};

interface SendTestEmailOptions {
  recipient?: string;
  month?: number;
  year?: number;
}

const sendTestMonthlyBulkEmail = async (options: SendTestEmailOptions = {}): Promise<string[]> => {
  const now = new Date();
  const summaryMonth = Number.isFinite(options.month) ? Number(options.month) : now.getMonth() + 1;
  const summaryYear = Number.isFinite(options.year) ? Number(options.year) : now.getFullYear();
  const startedAt = now.toISOString();
  const finishedAt = new Date(now.getTime() + 1000).toISOString();

  const summary: BulkMonthlyProcessSummary = {
    month: summaryMonth,
    year: summaryYear,
    totalPatientsWithRecords: 3,
    registered: 1,
    skipped: 1,
    errors: 1,
    startedAt,
    finishedAt,
    logPath: "logs/fichas-mensuales-test.log",
    results: [
      { patientId: "TEST-001", status: "registered" },
      { patientId: "TEST-002", status: "skipped", reason: "Sin fichas en el mes" },
      { patientId: "TEST-003", status: "error", reason: "Credenciales inválidas en Sistrat" },
    ],
  };

  const recipients = options.recipient?.trim()
    ? [options.recipient.trim()]
    : resolveRecipients();

  if (!recipients.length) {
    throw new Error("Proporcione un destinatario de prueba o configure BULK_MONTHLY_REPORT_RECIPIENTS.");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error("Defina SMTP_FROM o SMTP_USER para el remitente del correo.");
  }

  const transporter = buildTransporter();
  const subject = `[TEST] Resumen fichas mensuales ${summary.month}/${summary.year}`;
  const [html, text] = [buildHtmlSummary(summary), buildTextSummary(summary)];

  await transporter.sendMail({
    from,
    to: recipients,
    subject,
    text,
    html,
  });

  return recipients;
};

export { sendMonthlyBulkSummaryEmail, sendTestMonthlyBulkEmail };
