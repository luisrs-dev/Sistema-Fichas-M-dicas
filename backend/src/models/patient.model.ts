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
    codigoSistrat: {
      type: String
    },
    rut: {
      type: String,
      required: true,
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
    },
    registeredDemand: {
      type: Boolean,
      default: false
    },
    registeredAdmissionForm: {
      type: Boolean,
      default: false
    },
    fonasa: {
      type: Boolean,
      default: false
    },
    alertCie10: {
      type: Boolean,
      default: false
    },
    alertConsentimiento: {
      type: Boolean,
      default: false
    },
    alertTreatment: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true, versionKey: false }
);

const PatientModel = model("Patients", PatientSchema);
export default PatientModel;
