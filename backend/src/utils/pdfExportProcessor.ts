/**
 * pdfExportProcessor.ts
 *
 * Lógica de exportación de PDFs extraída del controller para ejecutarse en background.
 * Emite progreso al ExportJobStore para que los clientes SSE reciban updates en tiempo real.
 */

import ejs from "ejs";
import puppeteer, { Browser, Page } from "puppeteer";
import path from "path";
import archiver from "archiver";
import { createWriteStream, promises as fs } from "fs";
import { ExportJobStore } from "./exportJobStore";
import { normalizeDateRange } from "./utilities";
import { diagnosticMap } from "../constants/diagnosticMap";
import { getBase64Image } from "./base64Image";
import { getSystemChromePath } from "./chromePath";
import { allMedicalRecordsUser } from "../services/medicalRecord.service";
import PatientModel from "../models/patient.model";
import MedicalRecordModel from "../models/medicalRecord.model";

/** Caché de logo base64 para evitar leer el fichero en cada iteración */
let cachedLogoUrl: string | null = null;
const getLogoUrl = async (): Promise<string> => {
  if (!cachedLogoUrl) {
    cachedLogoUrl = await getBase64Image("imgs/ficlin-logo.jpg", "jpeg");
  }
  return cachedLogoUrl;
};

/**
 * Lanza el proceso de exportación ZIP en background.
 * No bloquea: llama con setImmediate para no bloquear el event loop de Express.
 */
export const startExportJob = (
  jobId: string,
  params: {
    startDate: string;
    endDate: string;
    centerName?: string;
  }
) => {
  setImmediate(() => {
    runExportJob(jobId, params).catch((err) => {
      console.error(`[ExportJob ${jobId}] Fatal error:`, err);
      ExportJobStore.emit(jobId, {
        type: "error",
        message: err?.message || "Error desconocido al generar el archivo.",
      });
    });
  });
};

const runExportJob = async (
  jobId: string,
  params: { startDate: string; endDate: string; centerName?: string }
) => {
  ExportJobStore.update(jobId, { status: "processing" });

  const { startDate, endDate, centerName } = params;
  const { start, end } = normalizeDateRange(startDate, endDate);

  // 1. Obtener pacientes candidatos por centro
  const patientFilters: any = {};
  if (centerName) patientFilters.sistratCenter = centerName;

  const candidatePatients = await PatientModel.find(patientFilters)
    .select("_id")
    .lean();
  const candidatePatientIds = candidatePatients.map((p) => p._id);

  if (candidatePatientIds.length === 0) {
    ExportJobStore.emit(jobId, { type: "error", message: "No hay pacientes registrados en el centro seleccionado." });
    return;
  }

  // 2. Obtener solo los pacientes con fichas en ese rango
  const patientIdsWithRecords = await MedicalRecordModel.distinct("patient", {
    patient: { $in: candidatePatientIds },
    date: { $gte: start, $lte: end },
  });

  if (patientIdsWithRecords.length === 0) {
    ExportJobStore.emit(jobId, { type: "error", message: "No se encontraron fichas clínicas en el rango de fechas." });
    return;
  }

  // 3. Obtener datos completos de esos pacientes
  const patients = await PatientModel.find({ _id: { $in: patientIdsWithRecords } }).populate("program");
  const total = patients.length;

  ExportJobStore.update(jobId, { total, current: 0 });
  ExportJobStore.emit(jobId, { type: "progress", total, current: 0, patientName: "Iniciando..." });

  // 4. Preparar archivo ZIP de destino en directorio temporal
  const tempDir = ExportJobStore.getTempDir();
  await fs.mkdir(tempDir, { recursive: true });
  const zipPath = path.join(tempDir, `export-${jobId}.zip`);
  const output = createWriteStream(zipPath);
  
  // Usar level 1 (velocidad máxima, los PDFs ya están comprimidos internamente)
  const archive = archiver("zip", { zlib: { level: 1 } });
  archive.pipe(output);

  const logoUrl = await getLogoUrl();
  const templatePath = path.join(process.cwd(), "templates-pdf/clinical-records-template.ejs");

  // 5. Lanzar Puppeteer una sola vez para reutilizar
  const executablePath = await getSystemChromePath();
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-background-networking",
        "--disable-client-side-phishing-detection",
        "--disable-sync",
        "--disable-translate",
        "--safebrowsing-disable-auto-update",
        "--no-first-run",
      ],
    });

    page = await browser.newPage();

    // Bloquear assets innecesarios (imágenes externas, fonts, media) para ahorrar ancho de banda
    await page.setRequestInterception(true);
    const BLOCKED_RESOURCE_TYPES = new Set(["image", "font", "media", "texttrack", "eventsource", "websocket", "manifest"]);
    page.on("request", (req) => {
      // Permitir siempre las peticiones de datos (nuestro HTML inline ya tiene base64)
      if (BLOCKED_RESOURCE_TYPES.has(req.resourceType()) && !req.url().startsWith("data:")) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 6. Agrupar por programa para la estructura de carpetas ZIP
    const patientsByProgram = patients.reduce((acc: any, patient: any) => {
      const program = patient.program?.name || "Sin Programa";
      if (!acc[program]) acc[program] = [];
      acc[program].push(patient);
      return acc;
    }, {});

    let current = 0;

    for (const program of Object.keys(patientsByProgram)) {
      for (const patient of patientsByProgram[program]) {
        const fullname = `${patient.name} ${patient.surname} ${patient.secondSurname}`.toUpperCase();
        current++;

        ExportJobStore.emit(jobId, {
          type: "progress",
          total,
          current,
          patientName: `${patient.name} ${patient.surname}`,
        });

        // Obtener fichas del paciente en el rango (firmas ya en parallel/Promise.all)
        const clinicalRecordsPatient = await allMedicalRecordsUser(patient._id.toString(), startDate, endDate);
        const clinicalRecords = (clinicalRecordsPatient || []).sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        if (!clinicalRecords.length) continue;

        // Renderizar EJS y generar PDF
        const html = await ejs.renderFile(templatePath, { patient, clinicalRecords, logoUrl, diagnosticMap });
        await page.setContent(html, { waitUntil: "domcontentloaded" });
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

        const filename = `[${program}]/[${program}] ${fullname}.pdf`;
        archive.append(pdfBuffer as Buffer, { name: filename });
      }
    }

    await archive.finalize();

    // Esperar a que el stream del archivo ZIP se cierre
    await new Promise<void>((resolve, reject) => {
      output.on("close", resolve);
      output.on("error", reject);
    });

    // Guardar ruta y nombre de descarga en el job
    const filename = `historiales_${startDate}_${endDate}.zip`;
    ExportJobStore.update(jobId, { outputPath: zipPath, filename });
    ExportJobStore.emit(jobId, { type: "done", message: filename });

  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
};
