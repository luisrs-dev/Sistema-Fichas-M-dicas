import EvaluationFormModel from "../models/evaluationForm.model";
import { EvaluationForm } from "../interfaces/evaluationForm.interface";
import { Types } from "mongoose";
import Sistrat from "./sistrat/sistrat.class";
import PatientModel from "../models/patient.model";

export const createOrUpdateEvaluationForm = async (patientId: string, data: Partial<EvaluationForm>) => {
  const patientObjectId = new Types.ObjectId(patientId);
  const existingDraft = await EvaluationFormModel.findOne({ patientId: patientObjectId, status: "borrador" });

  if (existingDraft) {
    const updated = await EvaluationFormModel.findByIdAndUpdate(
      existingDraft._id,
      { ...data, status: "borrador" },
      { new: true }
    );
    return { evaluationForm: updated, updated: true };
  }

  const evaluationForm = new EvaluationFormModel({
    ...data,
    patientId: patientObjectId,
    status: "borrador",
    fechaRegistro: new Date(),
  });
  await evaluationForm.save();
  return { evaluationForm, updated: false };
};

export const getEvaluationFormByPatient = async (patientId: string) => {
  // Retorna solo el borrador activo (si existe)
  const evaluationForm = await EvaluationFormModel.findOne({
    patientId: new Types.ObjectId(patientId),
    status: "borrador",
  });
  return evaluationForm;
};

export const getEvaluationFormHistory = async (patientId: string) => {
  // Retorna todas las evaluaciones históricas completadas/enviadas
  const history = await EvaluationFormModel.find({
    patientId: new Types.ObjectId(patientId),
    status: { $ne: "borrador" },
  }).sort({ createdAt: -1 });

  return { history };
};

export const syncEvaluationToSistratService = async (patientId: string) => {
  const patient = await PatientModel.findById(patientId);
  if (!patient) throw new Error("Paciente no encontrado");

  let evaluationForm = await getEvaluationFormByPatient(patientId);
  if (!evaluationForm) {
    evaluationForm = await EvaluationFormModel.findOne({ patientId: new Types.ObjectId(patientId) }).sort({ createdAt: -1 });
  }
  if (!evaluationForm) throw new Error("Ficha de Evaluación no encontrada para el paciente");

  const sistrat = new Sistrat();
  await sistrat.syncEvaluationForm(patient, evaluationForm as any);

  evaluationForm.status = "enviado_sistrat";
  evaluationForm.syncedAt = new Date();
  await evaluationForm.save();

  return { success: true, evaluationForm };
};

export const saveAndSyncEvaluationForm = async (patientId: string, data: Partial<EvaluationForm>) => {
  // 1. Guardar o actualizar en FicLin como borrador
  const saveResult = await createOrUpdateEvaluationForm(patientId, data);

  // 2. Sincronizar con SISTRAT
  const patient = await PatientModel.findById(patientId);
  if (!patient) throw new Error("Paciente no encontrado");

  const sistrat = new Sistrat();
  await sistrat.syncEvaluationForm(patient, saveResult.evaluationForm as any);

  // 3. Marcar como enviado_sistrat
  const finalForm = await EvaluationFormModel.findByIdAndUpdate(
    saveResult.evaluationForm._id,
    { status: "enviado_sistrat", syncedAt: new Date() },
    { new: true }
  );

  return { success: true, updated: saveResult.updated, evaluationForm: finalForm };
};

