import { Types } from "mongoose";

export interface MedicalRecord {
  center: string;
  date: string;
  entryType: string;
  group: string;
  intervention: string;
  patient: Types.ObjectId;
  program: string;
  relevantElements: string;
  sigla: string;
  time: string;
}
