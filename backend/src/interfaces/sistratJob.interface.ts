import { Types } from "mongoose";

export type SistratJobType = "ficha-ingreso" | "demanda" | "top" | "social" | "evaluacion" | "diagnostico-social";
export type SistratJobStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface SistratJob {
  _id?: Types.ObjectId | string;
  patientId: Types.ObjectId | string;
  type: SistratJobType;
  status: SistratJobStatus;
  step: string;
  progress: number;
  result?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
