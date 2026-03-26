import { Router } from "express";
import { getEvaluationForm, saveEvaluationForm, syncEvaluationToSistrat } from "../controllers/evaluationForm.controller";

const router = Router();

router.get("/:patientId", getEvaluationForm);
router.post("/:patientId", saveEvaluationForm);
router.post("/sync/:patientId", syncEvaluationToSistrat);

export { router };
