import { Schema, model } from "mongoose";
import { MedicalRecord } from "../interfaces/medicalRecord.interface";

const MedicalRecordSchema = new Schema<MedicalRecord>(
  {
    
    center: {
      type: String,
      // required: true,
    },
    date: {
      type: String,
      // required: true,
    },
    entryType: {
      type: String,
      // required: true,
    },
    group: {
      type: String,
      // required: true,
    },
    intervention: {
      type: String,
      // required: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    program: {
      type: String,
      // required: true,
    },
    relevantElements: {
      type: String,
      // required: true,
    },
    sigla: {
      type: String,
      // required: true,
    },
    time: {
      type: String,
      // required: true,
    }
  },
  { timestamps: true, versionKey: false }
);

const MedicalRecordModel = model("medicalRecords", MedicalRecordSchema);
export default MedicalRecordModel;
