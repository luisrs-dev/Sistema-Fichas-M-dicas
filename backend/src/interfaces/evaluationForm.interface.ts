import { Types } from "mongoose";

export interface EvaluationForm {
  patientId: Types.ObjectId;
  patronConsumo: string; // 1, 2, 3
  situacionFamiliar: string;
  relacionesInterpersonales: string;
  situacionOcupacional: string;
  trasgresionSocial: string;
  saludMental: string;
  saludFisica: string;
  _id?: string | Types.ObjectId;
  status?: "borrador" | "enviado_sistrat";
  fechaRegistro?: Date | string;
  syncedAt?: Date | string;

  createdAt?: Date;
  updatedAt?: Date;
}

