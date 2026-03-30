import SocialDiagnosisFormModel from "../models/socialDiagnosisForm.model";
import { SocialDiagnosisForm } from "../interfaces/socialDiagnosisForm.interface";
import { Types } from "mongoose";
import Sistrat from "./sistrat/sistrat.class";
import PatientModel from "../models/patient.model";

export const createOrUpdateSocialDiagnosisForm = async (patientId: string, data: Partial<SocialDiagnosisForm>) => {
  const patientObjectId = new Types.ObjectId(patientId);
  const existing = await SocialDiagnosisFormModel.findOne({ patientId: patientObjectId });

  if (existing) {
    const updated = await SocialDiagnosisFormModel.findByIdAndUpdate(existing._id, data, { new: true });
    return { socialDiagnosisForm: updated, updated: true };
  }

  const socialDiagnosisForm = new SocialDiagnosisFormModel({ ...data, patientId: patientObjectId });
  await socialDiagnosisForm.save();
  return { socialDiagnosisForm, updated: false };
};

export const getSocialDiagnosisFormByPatient = async (patientId: string) => {
  const socialDiagnosisForm = await SocialDiagnosisFormModel.findOne({ patientId: new Types.ObjectId(patientId) });
  return socialDiagnosisForm;
};

export const syncSocialDiagnosisToSistratService = async (patientId: string) => {
  const patient = await PatientModel.findById(patientId);
  if (!patient) throw new Error("Paciente no encontrado");
  
  const socialDiagnosisForm = await getSocialDiagnosisFormByPatient(patientId);
  if (!socialDiagnosisForm) throw new Error("Formulario de Diagnóstico de Integración Social no encontrado");

  const sistrat = new Sistrat();
  await sistrat.syncSocialDiagnosisForm(patient, socialDiagnosisForm);
  
  // Refrescar alertas automáticamente (Comentado para evitar que abra navegador redundante)
  // await sistrat.updateAlerts(patient);
  
  return { success: true };
};
