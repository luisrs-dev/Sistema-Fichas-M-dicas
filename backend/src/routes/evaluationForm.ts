import { Router } from "express";
import {
  getEvaluationForm,
  getEvaluationHistory,
  saveEvaluationForm,
  syncEvaluationToSistrat,
  saveAndSyncEvaluation,
} from "../controllers/evaluationForm.controller";

const router = Router();

router.get("/:patientId/history", getEvaluationHistory);
router.get("/:patientId", getEvaluationForm);
router.post("/:patientId", saveEvaluationForm);
router.post("/sync/:patientId", syncEvaluationToSistrat);
router.post("/save-and-sync/:patientId", saveAndSyncEvaluation);

export { router };

