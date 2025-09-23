import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allMedicalRecords,
  insertMedicalRecord,
  allMedicalRecordsUser,
  getRecordsByMonthAndYear,
  deleteRecord,
  postMedicalRecordsPerMonthOnSistrat,
} from "../services/medicalRecord.service";
import { allServices } from "../services/service.service";
import ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import archiver from "archiver"; // para comprimir en zip

import { findPatient, getAllPatients } from "../services/patient.service";
import { getBase64Image } from "../utils/base64Image";
import { diagnosticMap } from "../constants/diagnosticMap";

const getAllMedicalRecordsByUser = async ({ params }: Request, res: Response) => {
  try {
    const { _id } = params;
    console.log({ id: _id });

    const responseItems = await allMedicalRecordsUser(_id);
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const getMedicalRecords = async (req: Request, res: Response) => {
  try {
    const responseItems = await allMedicalRecords();
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const postMedicalRecord = async ({ body }: Request, res: Response) => {
  try {
    const responseUser = await insertMedicalRecord(body);

    res.send(responseUser);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

const postMedicalRecordPerMonth = async ({ params, body }: Request, res: Response) => {
  const { patientId } = params;
  const { medicalRecordsGrouped, month, year } = body;
  console.log("patientId", patientId);
  console.log("body", body);

  try {
    const responseUser = await postMedicalRecordsPerMonthOnSistrat(patientId, month, year, medicalRecordsGrouped);

    res.send(responseUser);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

const medicalRecordsByMonth = async ({ params }: Request, res: Response) => {
  const { month, year } = params;
  try {
    const medicalRecords = await getRecordsByMonthAndYear(Number(month), Number(year));
    res.status(200).json({
      status: true,
      message: "Fichas clínicas recuperadas",
      medicalRecords,
    }); // Respuesta exitosa
  } catch (error) {
    handleHttp(res, "Error fetching medical records by month", error);
  }
};

const getPdfMedicalRecordsByPatient = async ({ params }: Request, res: Response) => {
  console.log("ENTRAAANDOOOOOO");

  try {
    const { patientId } = params;

    const { patient } = await findPatient(patientId);
    console.log("patient", patient);

    const clinicalRecords = await allMedicalRecordsUser(patientId);

    if (!clinicalRecords || clinicalRecords.length === 0) {
      return res.status(404).send("No hay fichas para este paciente.");
    }

    const logoPath = path.join(__dirname, "../../uploads/imgs/ficlin-logo.jpg");
    const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
    const logoUrl = `data:image/jpeg;base64,${logoBase64}`;

    // 2. Renderizar HTML con EJS
    const html = await ejs.renderFile(path.join(__dirname, "../../templates-pdf/clinical-records-template.ejs"), { patient, clinicalRecords, logoUrl });
    console.log("data html ", path.join(__dirname, "../../templates-pdf/clinical-records-template.ejs"));

    // 3. Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      //slowMo: 300, sirve para darle tiempe a cada operacion
      // userDataDir: userDataDir, // Establecer la carpeta de caché
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--use-gl=egl", "--blink-settings=imagesEnabled=false,cssEnabled=false"],
      timeout: 0,
      protocolTimeout: 300000,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    // 4. Enviar el PDF como descarga
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="historial_clinico_${patientId}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).send("Error generando el PDF.");
  }
};

// Función de utilidad para formatear fecha
const matchMonthYear = (date: Date, month: number, year: number) => {
  const d = new Date(date);
  return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
};

const getPdfMedicalRecords = async ({ body }: Request, res: Response) => {
  try {
    const { startDate, endDate } = body;

    const patients = await getAllPatients();
    if (!patients || patients.length === 0) {
      return res.status(404).send("No hay pacientes para generar PDFs.");
    }

    // Logo en Base64
    const logoUrl = getBase64Image("imgs/ficlin-logo.jpg", "jpeg");

    // Preparar ZIP
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="historiales_${startDate}_${endDate}.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    // Agrupar pacientes por programa
    const patientsByProgram = patients.reduce((acc: any, patient: any) => {
      const program = patient.program?.name || "Sin Programa";
      if (!acc[program]) acc[program] = [];
      acc[program].push(patient);
      return acc;
    }, {});

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
      // args: ["--no-sandbox", "--disable-setuid-sandbox", "--use-gl=egl", "--blink-settings=imagesEnabled=false,cssEnabled=false", "--disable-dev-shm-usage"],
    });

    for (const program of Object.keys(patientsByProgram)) {
      for (const patient of patientsByProgram[program]) {
        // Obtener fichas del paciente
        const clinicalRecordsPatient = await allMedicalRecordsUser(patient._id, startDate, endDate);



        const clinicalRecords = (clinicalRecordsPatient || []).sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        if (!clinicalRecords.length) continue;

        // Convertir firmas a Base64
        for (const record of clinicalRecords) {
          const registeredBy = record.registeredBy as any;
          if (registeredBy?.signature) {
            // Quitar "/uploads/" si está en la ruta
            const relativePath = registeredBy.signature.replace(/^\/uploads\//, "");
            const signatureBase64 = getBase64Image(relativePath, "png");
            if (signatureBase64) registeredBy.signature = signatureBase64;
          }
        }

        // Renderizar EJS
        const html = await ejs.renderFile(
          path.join(__dirname, "../../templates-pdf/clinical-records-template.ejs"),
          { patient, clinicalRecords, logoUrl, diagnosticMap}
        );

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0", timeout: 0 });

        // await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 }); // 60 segundos

        // await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await page.close();

        const fullname = `${patient.name} ${patient.surname} ${patient.secondSurname}`.toUpperCase();

        const filename = `[${program}]/[${program}] ${fullname}.pdf`;
        archive.append(pdfBuffer, { name: filename });
      }
    }

    await browser.close();
    await archive.finalize();
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).send("Error generando el PDF.");
  }
};

const deleteMedicalRecords = async ({ params }: Request, res: Response) => {
  const { id } = params;
  try {
    const status = await deleteRecord(id);
    res.status(200).json({
      status: true,
      message: "Ficha clínica eliminada",
    }); // Respuesta exitosa
  } catch (error) {
    handleHttp(res, "No fue posible eliminar ficha clínica", error);
  }
};

export {
  postMedicalRecord,
  postMedicalRecordPerMonth,
  getMedicalRecords,
  getAllMedicalRecordsByUser,
  medicalRecordsByMonth,
  getPdfMedicalRecordsByPatient,
  getPdfMedicalRecords,
  deleteMedicalRecords,
};
