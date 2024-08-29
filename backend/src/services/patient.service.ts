import { Types } from "mongoose";
import { Patient } from "../interfaces/patient.interface";
import MedicalRecordModel from "../models/medicalRecord.model";
import PatientModel from "../models/patient.model";
import { addToSistrat } from "./sistratPlatform.service";
import { Demand } from "../interfaces/demand.interface";
import DemandModel from "../models/demand.model";

const inerPatient = async (Patient: Patient) => {
  const responseInsert = await PatientModel.create(Patient);
  console.log("Paciente registrado");
  console.log({ responseInsert });
  return responseInsert;
};


const inerDemand = async (data:{userId:string, dataSistrat:Demand}) => {    
  const responseInsert = await DemandModel.create({...data.dataSistrat, patientId: data.userId});
  return responseInsert;
};

// const inerPatientSistrat = async (dataSistrat: any) => {
//   const responseInsert = await PatientModel.create(dataSistrat);
//   console.log('Paciente registrado');
//   console.log({responseInsert});
//   return responseInsert;
// };

// TODO: definir interfaz dataSistrar
const updatePatientSistrat = async (patientId: string, demanda: Demand) => {
  try {
    console.log({ patientId });
    console.log({ demanda });

    const responseUpdate = await PatientModel.findByIdAndUpdate(
      patientId,
      { $set: demanda },
      { new: true, runValidators: true }
    );
    console.log("Paciente actualizado");
    console.log({ responseUpdate });
    return responseUpdate;
  } catch (error) {
    console.error("Error al actualizar el paciente", error);
    throw error;
  }
};

const recordToSistrat = async (patientId: string) => {
  try {
    console.log({ patientId });

    const patient = await PatientModel.findOne({ _id: patientId });
    console.log({ patient });

    addToSistrat(patient!);
    
    return;
    return patient;
  } catch (error) {
    console.error("Error al actualizar el paciente", error);
    throw error;
  }
};

const allPatients = async (programs: string[]) => {
  //const responsePatients = await PatientModel.find({});
  const programArray = programs[0].split(',');
  const responsePatients = await PatientModel.find({
    program: { $in: programArray }
  }).populate('program');
  return responsePatients;
};

const PatientsByProfile = async (profile: string) => {
  const responsePatients = await PatientModel.find({ profile });
  return responsePatients;
};

const findPatient = async (id: string) => {
  const responsePatient = await PatientModel.findOne({ _id: id }).populate('program');
  const medicalRecords = await MedicalRecordModel.find({
    patient: new Types.ObjectId(id),
  }).populate([
    { path: 'service' },
    { path: 'patient', select: 'name surname secondSurname profile', 
      populate: {
        path: 'program'
      }
     },
    { path: 'registeredBy', select: 'name profile signature',
      populate: { 
        path: 'profile',
        select: 'name'
      }
     }
  ]);
  return { patient: responsePatient, medicalRecords };
};

// const updateCar = async (id: string, data: Car) => {
//   /**
//    ** findOneAndUpdate
//    ** Por defecto retorna el objeto encontrado antes de actualizar
//    ** Con {new: true} devuelve el objeto actualizado
//    */
//   const responseItem = await PatientModel.findOneAndUpdate({ _id: id }, data, {
//     new: true,
//   });
//   return responseItem;
// };

// const deleteCar = async (id: string) => {
//   const responseItem = await PatientModel.deleteOne({ _id: id });
//   return responseItem;
// };

export {
  inerPatient,
  inerDemand,
  updatePatientSistrat,
  recordToSistrat,
  allPatients,
  PatientsByProfile,
  findPatient,
};
