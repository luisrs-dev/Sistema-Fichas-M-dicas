import { Types } from "mongoose";
import MedicalRecordModel from "../models/medicalRecord.model";

const DAYS_IN_MONTH = 31;

export interface MedicalRecordGroupedByDay {
  service: string;
  days: number[];
  total: number;
}

export const getGroupedRecordsByPatientAndMonth = async (patientId: string, month: number, year: number): Promise<MedicalRecordGroupedByDay[]> => {
  if (!Types.ObjectId.isValid(patientId)) {
    throw new Error("Identificador de paciente inválido");
  }

  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Ampliar rango +- 24 hrs para no perder fechas por zona horaria
  const searchStart = new Date(startOfMonth.getTime() - 24 * 60 * 60 * 1000);
  const searchEnd = new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000);

  const records = await MedicalRecordModel.find({
    patient: new Types.ObjectId(patientId),
    date: {
      $gte: searchStart.toISOString(),
      $lte: searchEnd.toISOString(),
    },
  })
    .populate({ path: "service", select: "description name" })
    .lean();

  const grouped: Record<string, number[]> = {};

  const getChileDateParts = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return null;

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    const parts = formatter.formatToParts(d);
    const day = Number(parts.find((p) => p.type === "day")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const year = Number(parts.find((p) => p.type === "year")?.value);

    return { day, month, year };
  };

  for (const record of records) {
    const serviceInfo = record.service as any;
    const serviceName = serviceInfo?.description || serviceInfo?.name || "Servicio sin nombre";

    const dateParts = getChileDateParts(record.date);
    if (!dateParts) continue;

    if (dateParts.month !== month || dateParts.year !== year) continue;

    const day = dateParts.day;
    if (day < 1 || day > DAYS_IN_MONTH) continue;

    if (!grouped[serviceName]) {
      grouped[serviceName] = Array(DAYS_IN_MONTH).fill(0);
    }

    grouped[serviceName][day - 1] += 1;
  }

  const mappedOutput = Object.entries(grouped).map(([service, days]) => ({
    service,
    days,
    total: days.reduce((a, b) => a + b, 0)
  }));

  const priorityOrder = [
    "consulta de salud mental",
    "intervención psicosocial de grupo",
    "consulta médica",
    "consulta psicológica",
    "consulta psiquiátrica",
    "psicoterapia individual",
    "psicoterapia grupal",
    "psiocodiagnóstico",
    "psicodiagnóstico",
    "consultoría de salud mental",
    "intervención familiar"
  ];

  mappedOutput.sort((a, b) => {
    const nameA = a.service.trim().toLowerCase();
    const nameB = b.service.trim().toLowerCase();

    const indexA = priorityOrder.findIndex((val) => val === nameA);
    const indexB = priorityOrder.findIndex((val) => val === nameB);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB; // Ambos existen
    }
    if (indexA !== -1) return -1; // A existe
    if (indexB !== -1) return 1;  // B existe

    return nameA.localeCompare(nameB);
  });

  return mappedOutput;
};
