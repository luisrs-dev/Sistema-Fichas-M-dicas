import { Types } from "mongoose";

export interface MedicalRecord {
  date: string;
  entryType: string;
  service: Types.ObjectId;
  relevantElements: string;
  diagnostic: string;
  pharmacologicalScheme: string;
  patient: Types.ObjectId;
  registeredBy: Types.ObjectId;
}
