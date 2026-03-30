import { Types } from "mongoose";

export interface SocialDiagnosisForm {
  patientId: Types.ObjectId;
  global: string; // "1" (Alta), "2" (Media), "3" (Baja)
  capitalHumano: string; // "4", "5", "6"
  capitalFisico: string; // "7", "8", "9"
  capitalSocial: string; // "10", "11", "12"
  createdAt?: Date;
  updatedAt?: Date;
}
