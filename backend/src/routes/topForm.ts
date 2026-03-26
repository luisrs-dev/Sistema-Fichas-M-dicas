import { Router } from "express";
import { getTopForm, postTopForm, postParseVoice, syncSistratTop } from "../controllers/topForm.controller";

const router = Router();

// POST /api/topForm/parse-voice → parsear texto de voz con Gemini (ANTES de la ruta dinámica)
router.post("/parse-voice", postParseVoice);

// GET  /api/topForm/:patientId  → obtener formulario TOP del paciente
router.get("/:patientId", getTopForm);

// POST /api/topForm/:patientId  → guardar / actualizar formulario TOP
router.post("/:patientId", postTopForm);

// POST /api/topForm/:patientId/sistrat → envia el form TOP a SISTRAT usando puppeteer
router.post("/:patientId/sistrat", syncSistratTop);

export { router };
