import TopFormModel from "../models/topForm.model";
import { TopForm } from "../interfaces/topForm.interface";
import { Types } from "mongoose";
import https from "https";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";

// ─── Prompts por sección ────────────────────────────────────────────────────

const SECTION_PROMPTS: Record<string, string> = {
  section1: `
Eres un asistente clínico. Extrae datos del formulario TOP Sección 1 (Uso de Sustancias) del siguiente texto en español chileno.
Las sustancias son: alcohol, marihuana, pastaBase, cocaina, sedantes, otraSustancia.
Cada sustancia tiene los campos: todosLosCeros (boolean), promedio (número 0-7), ultimaSemana (0-7), semana3 (0-7), semana2 (0-7), semana1 (0-7), total (0-28), noResponde (boolean).
Si no se menciona un valor, usa null. Devuelve SOLO un JSON válido sin markdown, con el siguiente schema exacto:
{
  "alcohol": { "todosLosCeros": null, "promedio": null, "ultimaSemana": null, "semana3": null, "semana2": null, "semana1": null, "total": null, "noResponde": null },
  "marihuana": { ... },
  "pastaBase": { ... },
  "cocaina": { ... },
  "sedantes": { ... },
  "otraSustancia": { "nombre": null, "unidadMedida": null, "todosLosCeros": null, "promedio": null, "ultimaSemana": null, "semana3": null, "semana2": null, "semana1": null, "total": null, "noResponde": null }
}`,

  section2: `
Eres un asistente clínico. Extrae datos del formulario TOP Sección 2 (Transgresión a la Norma Social) del siguiente texto en español chileno.
Los ítems son: hurto, robo, ventaDrogas, rina, otraAccion.
Cada ítem tiene: si (boolean), no (boolean), nr (boolean). Solo uno puede ser true.
violenciaIntrafamiliar tiene: todosLosCeros, ultimaSemana (0-7), semana3 (0-7), semana2 (0-7), semana1 (0-7), total (0-28), noResponde.
Si no se menciona, usa null. Devuelve SOLO JSON válido sin markdown con este schema:
{
  "hurto": { "si": null, "no": null, "nr": null },
  "robo": { "si": null, "no": null, "nr": null },
  "ventaDrogas": { "si": null, "no": null, "nr": null },
  "rina": { "si": null, "no": null, "nr": null },
  "violenciaIntrafamiliar": { "todosLosCeros": null, "ultimaSemana": null, "semana3": null, "semana2": null, "semana1": null, "total": null, "noResponde": null },
  "otraAccion": { "si": null, "no": null, "nr": null }
}`,

  section3: `
Eres un asistente clínico. Extrae datos del formulario TOP Sección 3 (Salud y Funcionamiento Social) del siguiente texto en español chileno.
Los campos son:
- saludPsicologica: número entre 0 y 20 (escala Mala=0 a Buena=20)
- diasTrabajados: { todosLosCeros, promedio, ultimaSemana, semana3, semana2, semana1, total (0-28), noResponde }
- diasEducacion: { todosLosCeros, promedio, ultimaSemana, semana3, semana2, semana1, total (0-28), noResponde }
- saludFisica: número entre 0 y 20
- tieneLugarVivir: "si", "no" o "nr"
- viviendasCondicionesBasicas: "si", "no" o "nr"
- calidadVida: número entre 0 y 20
Si no se menciona, usa null. Devuelve SOLO JSON válido sin markdown con este schema exacto:
{
  "saludPsicologica": null,
  "diasTrabajados": { "todosLosCeros": null, "promedio": null, "ultimaSemana": null, "semana3": null, "semana2": null, "semana1": null, "total": null, "noResponde": null },
  "diasEducacion": { "todosLosCeros": null, "promedio": null, "ultimaSemana": null, "semana3": null, "semana2": null, "semana1": null, "total": null, "noResponde": null },
  "saludFisica": null,
  "tieneLugarVivir": null,
  "viviendasCondicionesBasicas": null,
  "calidadVida": null
}`,
};

// ─── Llamada a Gemini via HTTPS nativo ──────────────────────────────────────

function callGeminiApi(prompt: string, userText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullPrompt = `${prompt}\n\nTexto del psicólogo:\n"${userText}"`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.error) {
            reject(new Error(`API Gemini Error: ${parsed.error.message}`));
            return;
          }

          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          // Limpiar posibles bloques markdown ```json ... ```
          const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          resolve(clean);
        } catch (e) {
          reject(new Error("Error parseando respuesta de Gemini: " + data));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── Métodos del servicio ────────────────────────────────────────────────────

export const createTopForm = async (patientId: string, data: Partial<TopForm>) => {
  const existing = await TopFormModel.findOne({ patientId: new Types.ObjectId(patientId) });

  if (existing) {
    const updated = await TopFormModel.findByIdAndUpdate(existing._id, data, { new: true });
    return { topForm: updated, updated: true };
  }

  const topForm = new TopFormModel({ patientId: new Types.ObjectId(patientId), ...data });
  await topForm.save();
  return { topForm, updated: false };
};

export const getTopFormByPatient = async (patientId: string) => {
  const topForm = await TopFormModel.findOne({ patientId: new Types.ObjectId(patientId) });
  return { topForm };
};

export const parseVoiceWithGemini = async (text: string, section: "section1" | "section2" | "section3") => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno");
  }

  const prompt = SECTION_PROMPTS[section];
  if (!prompt) {
    throw new Error(`Sección no válida: ${section}. Usar: section1, section2, section3`);
  }

  const rawJson = await callGeminiApi(prompt, text);

  let parsedData: any;
  try {
    parsedData = JSON.parse(rawJson);
  } catch {
    throw new Error("Gemini no devolvió un JSON válido: " + rawJson);
  }

  return { section, parsedData };
};

import Sistrat from "./sistrat/sistrat.class";
import PatientModel from "../models/patient.model";

export const syncTopFormToSistrat = async (patientId: string) => {
  const patient = await PatientModel.findById(patientId);
  if (!patient) throw new Error("Paciente no encontrado");
  
  const { topForm } = await getTopFormByPatient(patientId);
  if (!topForm) throw new Error("Formulario TOP no encontrado para el paciente");

  const sistrat = new Sistrat();
  await sistrat.syncTopForm(patient, topForm);
  return { success: true };
};
