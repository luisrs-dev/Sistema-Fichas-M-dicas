import { Router } from "express";
import { getTopForm, postTopForm, postParseVoice, syncSistratTop, saveAndSyncSistratTop } from "../controllers/topForm.controller";

const router = Router();

// POST /api/topForm/parse-voice → parsear texto de voz con Gemini (ANTES de la ruta dinámica)
router.post("/parse-voice", postParseVoice);

// GET  /api/topForm/:patientId  → obtener formulario TOP del paciente
router.get("/:patientId", getTopForm);

// POST /api/topForm/:patientId  → guardar / actualizar formulario TOP
router.post("/:patientId", postTopForm);

// POST /api/topForm/:patientId/sistrat → envia el form TOP a SISTRAT usando puppeteer
router.post("/:patientId/sistrat", syncSistratTop);

// POST /api/topForm/:patientId/save-and-sync → guarda en FicLin Y envía a SISTRAT en una sola llamada
router.post("/:patientId/save-and-sync", saveAndSyncSistratTop);

export { router };
