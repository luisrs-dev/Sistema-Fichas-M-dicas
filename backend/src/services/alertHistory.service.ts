import { Types } from "mongoose";
import PatientModel from "../models/patient.model";
import TopFormModel from "../models/topForm.model";
import EvaluationFormModel from "../models/evaluationForm.model";
import SocialFormModel from "../models/socialForm.model";
import SocialDiagnosisFormModel from "../models/socialDiagnosisForm.model";
import MedicalRecordModel from "../models/medicalRecord.model";

interface AlertRecord {
  tipo: string;
  fecha: string | Date | null;
  observacion: string;
  profesional: string;
}

interface AlertGroup {
  tipo: string;
  color: string;
  icon: string;
  registros: AlertRecord[];
}

export const getAlertHistoryByPatient = async (patientId: string) => {
  const patientObjectId = new Types.ObjectId(patientId);

  // Obtener datos del paciente
  const patient = await PatientModel.findById(patientObjectId)
    .populate("program")
    .select("name surname secondSurname program codigoSistrat alertCie10 alertConsentimiento alertEvaluacion alertIntegracionSocial alertEgreso alertDiagnosticoSocial")
    .lean();

  if (!patient) {
    throw new Error("Paciente no encontrado");
  }

  // Queries en paralelo a las 4 colecciones de formularios + fichas clínicas
  const [topForms, evaluationForms, socialForms, socialDiagnosisForms, medicalRecords] = await Promise.all([
    TopFormModel.find({ patientId: patientObjectId, syncStatus: "sincronizado" }).sort({ createdAt: -1 }).lean(),
    EvaluationFormModel.find({ patientId: patientObjectId, syncStatus: "sincronizado" }).sort({ createdAt: -1 }).lean(),
    SocialFormModel.find({ patientId: patientObjectId, syncStatus: "sincronizado" }).sort({ createdAt: -1 }).lean(),
    SocialDiagnosisFormModel.find({ patientId: patientObjectId, syncStatus: "sincronizado" }).sort({ createdAt: -1 }).lean(),
    MedicalRecordModel.find({ patient: patientObjectId })
      .populate({
        path: "registeredBy",
        select: "name",
      })
      .populate({
        path: "service",
        select: "description",
      })
      .sort({ date: -1 })
      .limit(50)
      .lean(),
  ]);

  // Construir grupos de alertas
  const alertGroups: AlertGroup[] = [
    {
      tipo: "CIE10",
      color: "#1e8ecd",
      icon: "circle",
      registros: buildCie10Records(patient),
    },
    {
      tipo: "TOP",
      color: "#000000",
      icon: "circle",
      registros: buildTopRecords(topForms),
    },
    {
      tipo: "Evaluación",
      color: "#28a745",
      icon: "circle",
      registros: buildEvaluationRecords(evaluationForms),
    },
    {
      tipo: "Integración Social",
      color: "#FFD700",
      icon: "circle",
      registros: buildSocialRecords(socialForms),
    },
    {
      tipo: "Diagnóstico Social",
      color: "#fd7e14",
      icon: "circle",
      registros: buildSocialDiagnosisRecords(socialDiagnosisForms),
    },
    {
      tipo: "Ficha Mensual",
      color: "#1e8ecd",
      icon: "circle",
      registros: buildMedicalRecords(medicalRecords),
    },
  ];

  return { patient, alertGroups };
};

// ─── Builders para cada tipo de alerta ──────────────────────────────────────

function buildCie10Records(patient: any): AlertRecord[] {
  // CIE10 no tiene colección propia — solo indicamos si la alerta está activa
  if (!patient.alertCie10) return [];

  return [
    {
      tipo: "CIE10",
      fecha: null,
      observacion: "Alerta activa: Han transcurrido 2 meses, corresponde confirmar si existe Diagnóstico de Trastorno Psiquiátrico CIE10",
      profesional: "—",
    },
  ];
}

function buildTopRecords(topForms: any[]): AlertRecord[] {
  if (!topForms || topForms.length === 0) return [];

  return topForms.map(topForm => ({
    tipo: "TOP",
    fecha: topForm.fechaEntrevista || topForm.createdAt,
    observacion: topForm.observaciones || "Formulario TOP registrado",
    profesional: topForm.nombreEntrevistador || "—",
  }));
}

function buildEvaluationRecords(evaluationForms: any[]): AlertRecord[] {
  if (!evaluationForms || evaluationForms.length === 0) return [];

  return evaluationForms.map(evaluationForm => {
    const resumen: string[] = [];
    if (evaluationForm.patronConsumo) resumen.push(`Patrón de consumo: ${evaluationForm.patronConsumo}`);
    if (evaluationForm.situacionFamiliar) resumen.push(`Situación familiar: ${evaluationForm.situacionFamiliar}`);
    if (evaluationForm.saludMental) resumen.push(`Salud mental: ${evaluationForm.saludMental}`);
    if (evaluationForm.saludFisica) resumen.push(`Salud física: ${evaluationForm.saludFisica}`);

    return {
      tipo: "Evaluación",
      fecha: evaluationForm.createdAt,
      observacion: resumen.length > 0 ? resumen.join(" | ") : "Ficha de evaluación registrada",
      profesional: "—",
    };
  });
}

function buildSocialRecords(socialForms: any[]): AlertRecord[] {
  if (!socialForms || socialForms.length === 0) return [];

  return socialForms.map(socialForm => {
    const observaciones: string[] = [];
    if (socialForm.observacion1) observaciones.push(socialForm.observacion1);
    if (socialForm.observacion2) observaciones.push(socialForm.observacion2);
    if (socialForm.observacion3) observaciones.push(socialForm.observacion3);

    return {
      tipo: "Integración Social",
      fecha: socialForm.createdAt,
      observacion: observaciones.length > 0 ? observaciones.join(" | ") : "Ficha de integración social registrada",
      profesional: "—",
    };
  });
}

function buildSocialDiagnosisRecords(socialDiagnosisForms: any[]): AlertRecord[] {
  if (!socialDiagnosisForms || socialDiagnosisForms.length === 0) return [];

  const globalLabels: Record<string, string> = { "1": "Alta", "2": "Media", "3": "Baja" };

  return socialDiagnosisForms.map(socialDiagnosisForm => {
    const globalLabel = globalLabels[socialDiagnosisForm.global] || socialDiagnosisForm.global;
    return {
      tipo: "Diagnóstico Social",
      fecha: socialDiagnosisForm.createdAt,
      observacion: `Vulnerabilidad global: ${globalLabel}`,
      profesional: "—",
    };
  });
}

function buildMedicalRecords(medicalRecords: any[]): AlertRecord[] {
  if (!medicalRecords || medicalRecords.length === 0) return [];

  return medicalRecords.map((record) => ({
    tipo: "Ficha Mensual",
    fecha: record.date || record.createdAt,
    observacion: record.relevantElements || record.interventionObjective || "Registro clínico",
    profesional: record.registeredBy?.name || "—",
  }));
}
