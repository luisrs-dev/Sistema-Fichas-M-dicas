import fs from 'fs';
import path from 'path';

import { Types } from "mongoose";
import { MedicalRecord } from "../interfaces/medicalRecord.interface";
import MedicalRecordModel from "../models/medicalRecord.model";

const insertMedicalRecord = async (medicalRecord: MedicalRecord) => {

  const responseInsert = await MedicalRecordModel.create(medicalRecord);
  return responseInsert;
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

const allMedicalRecordsUser = async (userId: string): Promise<any> => {
  try {
    const medicalRecords = await MedicalRecordModel.find({ patient: new Types.ObjectId(userId) })
    .populate('service')
    .populate('patient')
    .populate('registeredBy')
    .lean();

    // Modificar firmas si existen
    for (const record of medicalRecords) {
      const registeredBy = record.registeredBy as { signature?: string };

      if (registeredBy && registeredBy.signature) {
        let signatureRelativePath = registeredBy.signature;
      
        // Si la ruta comienza con "/uploads", quita esa parte
        if (signatureRelativePath.startsWith("/uploads")) {
          signatureRelativePath = signatureRelativePath.replace("/uploads/", "");
        }
        const signaturePath = path.join(__dirname, "../../uploads", signatureRelativePath);
        console.log('data signaturePath', signaturePath);
        
      
        if (fs.existsSync(signaturePath)) {
          const signatureBase64 = fs.readFileSync(signaturePath, { encoding: "base64" });
          registeredBy.signature = `data:image/png;base64,${signatureBase64}`;
        } else {
          console.warn("Firma no encontrada en:", signaturePath);
        }
      }
      
    }


    return medicalRecords;
  } catch (error) {
    console.error("Error al recuperar las fichas médicas del usuario:", error);
    throw error;
  }
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

export { allMedicalRecords, insertMedicalRecord, allMedicalRecordsUser, getRecordsByMonthAndYear };

