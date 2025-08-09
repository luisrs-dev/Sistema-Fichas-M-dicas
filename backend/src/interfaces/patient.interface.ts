import { Types } from "mongoose";
import { Auth } from "./auth.interface";

export interface Patient extends Auth {
  _id?: string;
  //admissionDate: string;
  program: Types.ObjectId;
  codigoSistrat: string;
  sistratCenter: string;
  rut: string;
  name: string;
  surname: string;
  secondSurname: string;
  birthDate: string;
  sex: string;
  region: string;
  comuna: string;
  phone: string;
  phoneFamily: string;
  centerOrigin: string;
  registeredDemand: Boolean;
  registeredOnFiclin: Boolean;
  registeredAdmissionForm: Boolean;
  fonasa: Boolean;
  alertCie10: Boolean;
  alertConsentimiento: Boolean;
  alertTreatment?: Boolean;
  mainSubstance: string;
  previousTreatments: string;
  atentionRequestDate: string;
  typeContact: string;
  whoRequest: string;
  whoDerives: string;
  careOfferedDate: string;
  estimatedMonth: string;
  demandIsNotAccepted: string;
  firstAtentionDate: string;
  atentionResolutiveDate: string;
  interventionAB: string;
  observations: string;
}

