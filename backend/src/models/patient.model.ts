import { Schema, model } from "mongoose";
import { Patient } from "../interfaces/patient.interface";

const PatientSchema = new Schema<Patient>(
  {
    //admissionDate: {
    //  type: String,
    //  required: true,
    //},
    program: {
      type: Schema.Types.ObjectId,
      ref: 'program'
    },
    codigoSistrat: {
      type: String
    },
    sistratCenter: {
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
    comuna: {
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
    registeredOnFiclin: {
      type: Boolean,
      default: false
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
    },
    mainSubstance: {
      type: String,
      required: true,
    },
    previousTreatments: {
      type: String,
      required: true,
    },
    atentionRequestDate: {
      type: String
    },
    typeContact: {
      type: String,
      required: true,
    },
    whoRequest: {
      type: String,
      required: true,
    },
    whoDerives: {
      type: String,
      required: true,
    },
    careOfferedDate: {
      type: String
    },
    estimatedMonth: {
      type: String
    },
    demandIsNotAccepted: {
      type: String
    },
    firstAtentionDate: {
      type: String
    },
    atentionResolutiveDate: {
      type: String
    },
    interventionAB: {
      type: String
        },
    observations: {
      type: String
    },

  },
  { timestamps: true, versionKey: false }
);

const PatientModel = model("Patients", PatientSchema);
export default PatientModel;
