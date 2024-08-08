import { Schema, model } from "mongoose";
import { Patient } from "../interfaces/patient.interface";

const PatientSchema = new Schema<Patient>(
  {
    admissionDate: {
      type: String,
      required: true,
    },
    program: {
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
    // mainSubstance: {
    //   type: String
    // },
    // previousTreatments: {
    //   type: String
    // },
    // atentionRequestDate: {
    //   type: String
    // },
    // typeContact: {
    //   type: String
    // },
    // whoRequest: {
    //   type: String
    // },
    // whoDerives: {
    //   type: String
    // },
    // careOfferedDate: {
    //   type: String
    // },
    // estimatedMonth: {
    //   type: String
    // },
    // demandIsNotAccepted: {
    //   type: String
    // },
    // firstAtentionDate: {
    //   type: String,
    // },
    // interventionAB: {
    //   type: String,
    // },
  },
  { timestamps: true, versionKey: false }
);

const PatientModel = model("Patients", PatientSchema);
export default PatientModel;
