import { Request, Response } from "express";
import {
  createOrUpdateEvaluationForm,
  getEvaluationFormByPatient,
  getEvaluationFormHistory,
  syncEvaluationToSistratService,
  saveAndSyncEvaluationForm,
} from "../services/evaluationForm.service";

const saveEvaluationForm = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const data = req.body;
    const response = await createOrUpdateEvaluationForm(patientId, data);
    res.send(response);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

const getEvaluationForm = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const response = await getEvaluationFormByPatient(patientId);
    res.send(response);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

const getEvaluationHistory = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const response = await getEvaluationFormHistory(patientId);
    res.send(response);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

const syncEvaluationToSistrat = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const response = await syncEvaluationToSistratService(patientId);
    res.send(response);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

const saveAndSyncEvaluation = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const data = req.body;
    const response = await saveAndSyncEvaluationForm(patientId, data);
    res.send(response);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

export { saveEvaluationForm, getEvaluationForm, getEvaluationHistory, syncEvaluationToSistrat, saveAndSyncEvaluation };

