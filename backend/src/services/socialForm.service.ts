import SocialFormModel from "../models/socialForm.model";
import { IntegracionSocialForm } from "../interfaces/socialForm.interface";
import { Types } from "mongoose";
import Sistrat from "./sistrat/sistrat.class";
import PatientModel from "../models/patient.model";

export const createOrUpdateSocialForm = async (patientId: string, data: Partial<IntegracionSocialForm>) => {
  const patientObjectId = new Types.ObjectId(patientId);
  const existing = await SocialFormModel.findOne({ patientId: patientObjectId });

  if (existing) {
    const updated = await SocialFormModel.findByIdAndUpdate(existing._id, data, { new: true });
    return { socialForm: updated, updated: true };
  }

  const socialForm = new SocialFormModel({ ...data, patientId: patientObjectId });
  await socialForm.save();
  return { socialForm, updated: false };
};

export const getSocialFormByPatient = async (patientId: string) => {
  const socialForm = await SocialFormModel.findOne({ patientId: new Types.ObjectId(patientId) });
  return socialForm;
};

export const syncSocialToSistratService = async (patientId: string) => {
  const patient = await PatientModel.findById(patientId);
  if (!patient) throw new Error("Paciente no encontrado");

  const socialForm = await getSocialFormByPatient(patientId);
  if (!socialForm) throw new Error("Formulario de Integración Social no encontrado");

  const sistrat = new Sistrat();
  await sistrat.syncSocialForm(patient, socialForm as any);
  // Refrescar alertas automáticamente
  await sistrat.updateAlerts(patient);
  return { success: true };
};
