import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { createTopForm, getTopFormByPatient, parseVoiceWithGemini } from "../services/topForm.service";

const getTopForm = async ({ params }: Request, res: Response) => {
  const { patientId } = params;
  try {
    const result = await getTopFormByPatient(patientId);
    res.status(200).json({ status: true, ...result });
  } catch (error) {
    handleHttp(res, "ERROR_GET_TOP_FORM", error);
  }
};

const postTopForm = async ({ params, body }: Request, res: Response) => {
  const { patientId } = params;
  try {
    const result = await createTopForm(patientId, body);
    res.status(200).json({
      status: true,
      message: result.updated ? "Formulario TOP actualizado" : "Formulario TOP guardado",
      ...result,
    });
  } catch (error) {
    handleHttp(res, "ERROR_POST_TOP_FORM", error);
  }
};

const postParseVoice = async ({ body }: Request, res: Response) => {
  const { text, section } = body;

  if (!text || !section) {
    return res.status(400).json({ status: false, message: "Se requieren los campos 'text' y 'section'" });
  }

  if (!["section1", "section2", "section3"].includes(section)) {
    return res.status(400).json({ status: false, message: "Sección inválida. Usar: section1, section2, section3" });
  }

  try {
    const result = await parseVoiceWithGemini(text, section);
    res.status(200).json({ status: true, ...result });
  } catch (error) {
    handleHttp(res, "ERROR_PARSE_VOICE_GEMINI", error);
  }
};

import { syncTopFormToSistrat } from "../services/topForm.service";

const syncSistratTop = async ({ params }: Request, res: Response) => {
  const { patientId } = params;
  try {
    const result = await syncTopFormToSistrat(patientId);
    res.status(200).json({ status: true, message: "Sincronización de TOP iniciada y completada sin submit." });
  } catch (error) {
    handleHttp(res, "ERROR_SYNC_TOP_SISTRAT", error);
  }
};

export { getTopForm, postTopForm, postParseVoice, syncSistratTop };
