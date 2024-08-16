import { Schema, model } from "mongoose";
import { Patient } from "../interfaces/patient.interface";

const PatientSchema = new Schema<Patient>(
  {
    admissionDate: {
      type: String,
      required: true,
    },
    program: {
      type: Schema.Types.ObjectId,
      ref: 'program'
    },
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    secondSurname: {
      type: String,
      required: true,
    },
    birthDate: {
      type: String,
      required: true,
    },
    sex: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    phoneFamily: {
      type: String,
      required: true,
    },
    centerOrigin: {
      type: String,
      required: true,
    }
  },
  { timestamps: true, versionKey: false }
);

const PatientModel = model("Patients", PatientSchema);
export default PatientModel;
