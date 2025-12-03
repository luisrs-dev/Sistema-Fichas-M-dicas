
import { Types } from "mongoose";
import { MedicalRecord } from "../interfaces/medicalRecord.interface";
import MedicalRecordModel from "../models/medicalRecord.model";
import Sistrat from "./sistrat/sistrat.class";
import PatientModel from "../models/patient.model";
import { getBase64Image } from "../utils/base64Image";
import { getGroupedRecordsByPatientAndMonth } from "./medicalRecordGrouping.service";
import ProcessLogger from "../utils/processLogger";
import { promises as fs } from "fs";
import path from "path";

const insertMedicalRecord = async (medicalRecord: MedicalRecord) => {
  
    if (Array.isArray(medicalRecord.patient)) {
      // Caso: varios pacientes → crear un registro por cada uno
      const recordsToInsert = medicalRecord.patient.map((p) => ({
        ...medicalRecord,
        patient: new Types.ObjectId(p), // asegurar que sea ObjectId si viene como string
      }));

       const responseInsert = await MedicalRecordModel.insertMany(recordsToInsert);
      return responseInsert;
      
    } else {
      const responseInsert = await MedicalRecordModel.create(medicalRecord);
      // Aquí TS ya sabe que patient es un ObjectId
      return responseInsert;
    }
    
};

const postMedicalRecordsPerMonthOnSistrat = async (patientId: string, month: number, year: number) => {
  console.log("postMedicalRecordsPerMonthOnSistrat");
  const sistratPlatform = new Sistrat();
  const patient = await PatientModel.findOne({ _id: patientId });
  console.log("patient postMedicalRecordsPerMonthOnSistrat", patient);

  console.log("month year", month, year);

  if (!patient) {
    throw new Error("Paciente no encontrado");
  }

  await sistratPlatform.recordMonthlySheet(patient, month, year);
};

interface BulkMonthlyRecordResult {
  patientId: string;
  status: "registered" | "skipped" | "error";
  reason?: string;
}

const postMedicalRecordsPerMonthForAllPatients = async (month: number, year: number) => {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Mes inválido, debe estar entre 1 y 12");
  }

  if (!Number.isInteger(year) || year < 2000) {
    throw new Error("Año inválido");
  }

  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const patientIds = await MedicalRecordModel.distinct("patient", {
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  });

  const results: BulkMonthlyRecordResult[] = [];
  const bulkLogger = new ProcessLogger("bulk-registro", `fichas-mensuales-${year}-${month}`);
  const executionTimestamp = new Date().toISOString();
  await bulkLogger.log(`Inicio de registro masivo para ${month}/${year} | timestamp=${executionTimestamp}`);

  for (const patientId of patientIds) {
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      results.push({ patientId: String(patientId), status: "error", reason: "Paciente no encontrado" });
      await bulkLogger.log(`ERROR | pacienteId=${patientId} | Paciente no encontrado`);
      continue;
    }

    const sistratPlatform = new Sistrat();

    try {
      const groupedRecords = await getGroupedRecordsByPatientAndMonth(String(patient._id), month, year);

      if (!groupedRecords.length) {
        results.push({ patientId: String(patient._id), status: "skipped", reason: "Sin fichas en el mes solicitado" });
        await sistratPlatform.scrapper.closeBrowser();
        await bulkLogger.log(`SKIPPED | pacienteId=${patient._id} | ${patient.name} ${patient.surname} | Sin fichas en el mes`);
        continue;
      }

      await sistratPlatform.recordMonthlySheet(patient, month, year);
      results.push({ patientId: String(patient._id), status: "registered" });
      await bulkLogger.log(`Registro exitoso | ${patient.name} ${patient.surname}`);
    } catch (error: any) {
      results.push({
        patientId: String(patient._id),
        status: "error",
        reason: error?.message || "Error desconocido al registrar la ficha mensual",
      });
      await bulkLogger.log(`ERROR | ${patient.name} ${patient.surname} | ${error?.message || error}`);
    } finally {
      await sistratPlatform.scrapper.closeBrowser();
    }
  }

  await bulkLogger.log(`Fin de registro masivo. Total pacientes con fichas: ${patientIds.length}`);
  await bulkLogger.close();

  return {
    month,
    year,
    totalPatientsWithRecords: patientIds.length,
    registered: results.filter((result) => result.status === "registered").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    errors: results.filter((result) => result.status === "error").length,
    results,
    logPath: bulkLogger.path,
  };
};

const logsDirectory = path.resolve(__dirname, "..", "..", "logs");

const listMonthlyLogFiles = async () => {
  try {
    const files = await fs.readdir(logsDirectory);
    const monthlyLogs = files.filter((fileName) => fileName.includes("fichas-mensuales") && fileName.endsWith(".log"));

    const stats = await Promise.all(
      monthlyLogs.map(async (fileName) => {
        const filePath = path.join(logsDirectory, fileName);
        const fileStats = await fs.stat(filePath);

        return {
          fileName,
          size: fileStats.size,
          createdAt: fileStats.birthtime.toISOString(),
          updatedAt: fileStats.mtime.toISOString(),
        };
      })
    );

    return stats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    throw new Error(`No fue posible obtener los logs: ${error}`);
  }
};

const readMonthlyLogFile = async (fileName: string) => {
  if (!/^[a-z0-9_.-]+\.log$/i.test(fileName)) {
    throw new Error("Nombre de archivo inválido");
  }

  try {
    const filePath = path.join(logsDirectory, fileName);
    const content = await fs.readFile(filePath, { encoding: "utf8" });
    return { fileName, content };
  } catch (error) {
    throw new Error(`No fue posible leer el log solicitado: ${error}`);
  }
};



const deleteRecord = async (id: string) => {
  try {
    const responseDelete = await MedicalRecordModel.findByIdAndDelete(id);  
    if (!responseDelete) {
      throw new Error("No se encontró la ficha médica para eliminar");
    } 
    console.log("Ficha médica eliminada correctamente");
    return responseDelete;
  } catch (error) {
    console.error("Error al eliminar la ficha médica:", error);
    throw new Error(`Error al eliminar la ficha médica: ${error}`);
  } 
};

const allMedicalRecords = async () => {
  const responseUsers = await MedicalRecordModel.find({}).populate([
    { path: 'service' },
    { path: 'registeredBy', select: 'name profile',
      populate: { 
        path: 'profile',
        select: 'name'
      }
     }
  ]);
  return responseUsers;
};

const allMedicalRecordsUser = async (userId: string, startDate?: string, endDate?: string) => {

let medicalRecords = [];

  if(startDate && endDate){
   medicalRecords = await MedicalRecordModel.find({ 
    patient: userId,
    date: { $gte: startDate, $lte: endDate },
  })
    .populate('service')
    .populate('patient')
    .populate('registeredBy')
    .lean();
  }else{
       medicalRecords = await MedicalRecordModel.find({ 
    patient: userId,
  })
    .populate('service')
    .populate('patient')
    .populate('registeredBy')
    .lean();
  }
    

  for (const record of medicalRecords) {
    const registeredBy = record.registeredBy as any;

    if (registeredBy?.signature) {
      // Quitar "/uploads/" si está en la ruta
      let relativePath = registeredBy.signature.replace(/^\/uploads\//, "");
      const signatureBase64 = getBase64Image(relativePath, "png");
      if (signatureBase64) registeredBy.signature = signatureBase64;
    }
  }

  return medicalRecords;
};



const getRecordsByMonthAndYear = async (month: number, year: number) => {

  try {
    
    const startOfMonth = new Date(year, month - 1, 1); // Primer día del mes
    const endOfMonth = new Date(year, month, 0); // Último día del mes

    const medicalRecords = await MedicalRecordModel.find({
      date: {
        $gte: startOfMonth.toISOString(),  // Fecha de inicio
        $lt: endOfMonth.toISOString()      // Fecha final
      }
    }).populate("service registeredBy patient"); // Puedes usar populate para traer los detalles de `service` y `registeredBy`    

    return medicalRecords;
  } catch (error) {
    throw new Error(`Error to fetch medical records: ${error}`);
    
  }

};

export {
  allMedicalRecords,
  postMedicalRecordsPerMonthOnSistrat,
  insertMedicalRecord,
  allMedicalRecordsUser,
  getRecordsByMonthAndYear,
  deleteRecord,
  getGroupedRecordsByPatientAndMonth,
  postMedicalRecordsPerMonthForAllPatients,
  listMonthlyLogFiles,
  readMonthlyLogFile,
};

