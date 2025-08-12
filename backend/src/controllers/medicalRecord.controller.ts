import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { allMedicalRecords, insertMedicalRecord, allMedicalRecordsUser, getRecordsByMonthAndYear, deleteRecord } from "../services/medicalRecord.service";
import { allServices } from "../services/service.service";
import ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { findPatient } from "../services/patient.service";

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

export { postMedicalRecord, getMedicalRecords, getAllMedicalRecordsByUser, medicalRecordsByMonth, getPdfMedicalRecordsByPatient, deleteMedicalRecords };
