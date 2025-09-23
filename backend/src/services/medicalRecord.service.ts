
import { Types } from "mongoose";
import { MedicalRecord } from "../interfaces/medicalRecord.interface";
import MedicalRecordModel from "../models/medicalRecord.model";
import Sistrat from './sistrat/sistrat.class';
import PatientModel from '../models/patient.model';
import { getBase64Image } from "../utils/base64Image";

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

const postMedicalRecordsPerMonthOnSistrat = async (patientId: string, month: number, year: number,medicalRecord: any) => {
  
  console.log('postMedicalRecordsPerMonthOnSistrat');
    const sistratPlatform = new Sistrat();
    const patient = await PatientModel.findOne({ _id: patientId });
    console.log('patient postMedicalRecordsPerMonthOnSistrat', patient);
    
    console.log('month year', month, year);
    
    if (!patient) {
      throw new Error("Paciente no encontrado");
    }

      const statusAdmissionFormCreated = await sistratPlatform.registrarMedicalRecordsByMonth(patient,  month, year, medicalRecord);

    console.log({ patientId, medicalRecord });
    return;
    
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

const allMedicalRecordsUser = async (userId: string) => {
  const medicalRecords = await MedicalRecordModel.find({ patient: userId })
    .populate('service')
    .populate('patient')
    .populate('registeredBy')
    .lean();

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

export { allMedicalRecords, postMedicalRecordsPerMonthOnSistrat, insertMedicalRecord, allMedicalRecordsUser, getRecordsByMonthAndYear, deleteRecord };

