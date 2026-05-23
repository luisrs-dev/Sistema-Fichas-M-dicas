import { Router } from "express";
import { getAlertHistory } from "../controllers/alertHistory.controller";

const router = Router();

// GET /api/alertHistory/:patientId → obtener historial de alertas agrupado del paciente
router.get("/:patientId", getAlertHistory);

export { router };
