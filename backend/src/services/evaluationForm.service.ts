import EvaluationFormModel from "../models/evaluationForm.model";
import { EvaluationForm } from "../interfaces/evaluationForm.interface";
import { Types } from "mongoose";
import Sistrat from "./sistrat/sistrat.class";
import PatientModel from "../models/patient.model";

export const createOrUpdateEvaluationForm = async (patientId: string, data: Partial<EvaluationForm>) => {
  const patientObjectId = new Types.ObjectId(patientId);
  const existingPending = await EvaluationFormModel.findOne({ 
    patientId: patientObjectId, 
    syncStatus: "pendiente" 
  }).sort({ createdAt: -1 });

  if (existingPending) {
    const updated = await EvaluationFormModel.findByIdAndUpdate(existingPending._id, data, { new: true });
    return { evaluationForm: updated, updated: true };
  }

  const evaluationForm = new EvaluationFormModel({ 
    ...data, 
    patientId: patientObjectId, 
    syncStatus: "pendiente" 
  });
  await evaluationForm.save();
  return { evaluationForm, updated: false };
};

export const getEvaluationFormByPatient = async (patientId: string) => {
  const evaluationForm = await EvaluationFormModel.findOne({ patientId: new Types.ObjectId(patientId) })
    .sort({ createdAt: -1 });
  return evaluationForm;
};

export const syncEvaluationToSistratService = async (patientId: string) => {
  const patient = await PatientModel.findById(patientId);
  if (!patient) throw new Error("Paciente no encontrado");
  
  const evaluationForm = await getEvaluationFormByPatient(patientId);
  if (!evaluationForm) throw new Error("Ficha de Evaluación no encontrada para el paciente");

  const sistrat = new Sistrat();
  await sistrat.syncEvaluationForm(patient, evaluationForm as any);
  
  // Actualizar syncStatus a "sincronizado" tras sincronización exitosa
  await EvaluationFormModel.findByIdAndUpdate(evaluationForm._id, { syncStatus: "sincronizado" });
  
  // Refrescar alertas automáticamente (Comentado para evitar que abra un segundo navegador al terminar)
  // await sistrat.updateAlerts(patient);
  return { success: true };
};
