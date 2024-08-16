import { Schema, model } from "mongoose";
import { MedicalRecord } from "../interfaces/medicalRecord.interface";

const MedicalRecordSchema = new Schema<MedicalRecord>(
  {
    
    date: {
      type: String,
    },
    entryType: {
      type: String,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    relevantElements: {
      type: String,
    },
    diagnostic: {
      type: String,
    },
    pharmacologicalScheme: {
      type: String
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patients',
      required: true,
    },
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

  },
  { timestamps: true, versionKey: false }
);

const MedicalRecordModel = model("medicalRecords", MedicalRecordSchema);
export default MedicalRecordModel;
