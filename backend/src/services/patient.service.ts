import { Types } from "mongoose";
import { Patient } from "../interfaces/patient.interface";
import MedicalRecordModel from "../models/medicalRecord.model";
import PatientModel from "../models/patient.model";
import { Demand } from "../interfaces/demand.interface";
import DemandModel from "../models/demand.model";
import Sistrat from "./sistrat/sistrat.class";
import AdmissionFormModel from "../models/admissionForm.model";
import mongoose from 'mongoose';
import UserModel from "../models/user.model";
import { encrypt } from "../utils/bcrypt.handle";


const inerPatient = async (Patient: Patient) => {
  const responseInsert = await PatientModel.create({...Patient, registeredOnFiclin: true});
  console.log("Paciente registrado");
  console.log({ responseInsert });
  return responseInsert;
};

const saveAdmissionForm = async (patientId: string, admissionFormData: any) => {
  try {
    const patient = await PatientModel.findOne({ _id: patientId });

    if (!patient) {
      throw new Error("Usuario no encontrado");
    }

    const admissionForm = { patientId, ...admissionFormData };
    const responseInsert = await AdmissionFormModel.create(admissionForm);
    if (!responseInsert) {
      throw new Error("No fue posible registrar ficha de ingreso");
    }

    patient.registeredAdmissionForm = true;
    patient.save();

    return patient;
  } catch (error) {
    throw new Error(`error admissionForm registrado: ${error}`);
  }
};



const update = async (id: string, patient: Patient) => {
  const updatedPatient = await PatientModel.findByIdAndUpdate(
    id,
    {
      ...patient,
      registeredOnFiclin: true,
    },
    { new: true } // Devuelve el documento actualizado
  );

  if (!updatedPatient) {
    throw new Error("Paciente no encontrado");
  }

  console.log("Paciente actualizado");
  console.log({ updatedPatient });

  return updatedPatient;
};

const updateUserPassword = async (email: string, newPassword: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    return 'USER_NOT_FOUND';
  }

  const passHash = await encrypt(newPassword);
  user.password = passHash;
  await user.save();

  return 'PASSWORD_UPDATED';
};



const admisionFormmByPatient = async (patientId: string) => {

  try {
    const patient = await PatientModel.findOne({ _id: patientId });
    const admissionForm = await AdmissionFormModel.findOne({ patientId });
   
    return {patient, admissionForm};
  } catch (error) {
    
  }
};

const demandByPatient = async (patientId: string) => {

  try {
    const patient = await PatientModel.findOne({ _id: patientId });
    const demand = await DemandModel.findOne({ patientId });
   
    return {patient, demand};
  } catch (error) {
    console.log(`No hay registro de demanda para paciente con id ${patientId}`);
        
  }
};

const dataPatientByRut = async (rut: string) => {
  try {
    const sistratPlatform = new Sistrat();
    const dataFromDemand = await sistratPlatform.dataPatientFromDemand(rut); // Esta rutina realiza login, lista demandas y carga el formulario

    return dataFromDemand;
  } catch (error) {
    console.error(`No hay registro de demanda para paciente con rut ${rut}`, error);
    throw error;
  }
};



const updateAF = async (patientId: string, admissionFormData: any) => {
   
  console.log('admissionFormData', admissionFormData);
  
  try {
    const patient = await PatientModel.findOne({ _id: patientId });
    console.log(patient?.name);
    console.log(patient?._id);
    console.log('recibido');
    console.log({patientId});
    
    
    const patientObjectId = new mongoose.Types.ObjectId(patientId);


    if (!patient) {
      throw new Error("Usuario no encontrado");
    }

    const admissionForm = await AdmissionFormModel.findOne({ patientId });
    console.log({admissionForm});
  
    const updatedAdmissionForm = await AdmissionFormModel.updateOne({ _id: admissionForm!._id }, admissionFormData);

    if (!updatedAdmissionForm) {
      throw new Error("Formulario de admisión no encontrado");
    }

    patient.registeredAdmissionForm = true;
    patient.save();

    // Retorna el formulario actualizado
    return patient;
  } catch (error) {
    throw new Error(`Error al actualizar ficha de ingreso: ${error}`);
  }
};



const saveAdmissionFormToSistrat = async (patientId: string) => {
  try {
    const sistratPlatform = new Sistrat();

    const admissionForm = await AdmissionFormModel.findOne({ patientId });
    const patient = await PatientModel.findOne({ _id: patientId });

    if (patient && admissionForm) {
      const statusAdmissionFormCreated = await sistratPlatform.registrarFichaIngreso(patient, admissionForm);
      return statusAdmissionFormCreated;
    } else {
      throw new Error("Falta información del paciente para registrar su ficha de ingreso");
    }
  } catch (error) {
    throw new Error(`error admissionForm registrado: ${error}`);
  }
};

const inerDemand = async (patientId: string, dataSistrat: Demand) => {
  try {
    const patient = await PatientModel.findOne({ _id: patientId });
    if (!patient) {
      throw new Error(`Error al registrar demanda: usuario no existe`);
    }

    const responseInsert = await DemandModel.create({ ...dataSistrat, patientId });
    patient.registeredDemand = true;
    await patient.save();

    return patient;
  } catch (error) {
    throw new Error(`Error al registrar demanda: ${error}`);
  }
};

// TODO: definir interfaz dataSistrar
const updatePatientSistrat = async (patientId: string, demanda: Demand) => {
  try {
    const responseUpdate = await PatientModel.findByIdAndUpdate(
      patientId,
      { $set: demanda },
      { new: true, runValidators: true }
    );
    return responseUpdate;
  } catch (error) {
    console.error("Error al actualizar el paciente", error);
    throw error;
  }
};

const recordDemandToSistrat = async (patientId: string): Promise<{success:boolean}> => {
  try {
    const patient = await PatientModel.findOne({ _id: patientId });
    const demand = await DemandModel.findOne({ patientId });

    if (!patient) {
      throw new Error(`Paciente con ID ${patientId} no encontrado.`);
    }

    const sistratPlatform = new Sistrat();
    const createdDemand = await sistratPlatform.crearDemanda(patient);
    if(createdDemand){
      return {success: true} 
    }else{
      throw new Error("Error al registrar demanda en SISTRAT");
    }

  } catch (error) {
    console.error("Error al registrar demanda en SISTRAT", error);
    throw error;
  }
};


const getAllPatients = async () => {
  const responsePatients = await PatientModel.find().populate("program");
  return responsePatients;
};



const allPatients = async (programs: string[], active?: string) => {
  const programArray = programs
    .flatMap((program) => (program ? program.split(",") : []))
    .filter(Boolean);

  const filters: Record<string, unknown> = {};

  if (programArray.length) {
    filters.program = { $in: programArray };
  }

  if (typeof active === 'string') {
    if (active === 'true') {
      filters.$or = [{ active: true }, { active: { $exists: false } }];
    } else if (active === 'false') {
      filters.active = false;
    }
  }

  const responsePatients = await PatientModel.find(filters).populate("program");
  return responsePatients;
};

const updateActiveStatus = async (id: string, active: boolean) => {
  const updatedPatient = await PatientModel.findByIdAndUpdate(
    id,
    { active },
    { new: true }
  );

  if (!updatedPatient) {
    throw new Error("Paciente no encontrado");
  }

  return updatedPatient;
};

const PatientsByProfile = async (profile: string) => {
  const responsePatients = await PatientModel.find({ profile });
  return responsePatients;
};

const findPatient = async (id: string) => {
  const responsePatient = await PatientModel.findOne({ _id: id }).populate("program");
  const medicalRecords = await MedicalRecordModel.find({
    patient: new Types.ObjectId(id),
  }).populate([
    { path: "service" },
    {
      path: "patient",
      select: "name surname secondSurname profile",
      populate: {
        path: "program",
      },
    },
    {
      path: "registeredBy",
      select: "name profile signature",
      populate: {
        path: "profile",
        select: "name",
      },
    },
  ]);
  return { patient: responsePatient, medicalRecords };
};

const updateAlertsFromSistrat = async (patientId: string) => {
  try {
    const patient = await PatientModel.findOne({ _id: patientId });
    if (patient) {
      const sistratPlatform = new Sistrat();

      const responseUserWithAlerts = await sistratPlatform.updateAlerts(patient);

      return responseUserWithAlerts;
    } else {
      throw new Error("Paciente no registrado");
    }
  } catch (error) {}
};

const updateFormCie10 = async (patientId: string, optionSelected: string) => {
  try {
    const patient = await PatientModel.findOne({ _id: patientId });
    if (patient) {
      const sistratPlatform = new Sistrat();

      const responseUserWithAlerts = await sistratPlatform.updateFormCie10(patient, optionSelected);

      return responseUserWithAlerts;
    } else {
      throw new Error("Paciente no registrado");
    }
  } catch (error) {}
};

;

export {
  inerPatient,
  inerDemand,
  update,
  updatePatientSistrat,
  updateUserPassword,
  recordDemandToSistrat,
  allPatients,
  PatientsByProfile,
  findPatient,
  admisionFormmByPatient,
  demandByPatient,
  saveAdmissionForm,
  saveAdmissionFormToSistrat,
  updateAlertsFromSistrat,
  updateFormCie10,
  updateAF,
  getAllPatients,
  dataPatientByRut,
  updateActiveStatus
};
