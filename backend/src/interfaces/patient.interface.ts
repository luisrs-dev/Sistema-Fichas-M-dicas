import { Types } from "mongoose";
import { Auth } from "./auth.interface";

export interface Patient extends Auth {
  _id?: string;
  admissionDate: string;
  program: Types.ObjectId;
  codigoSistrat: string;
  rut: string;
  name: string;
  surname: string;
  secondSurname: string;
  birthDate: string;
  sex: string;
  region: string;
  phone: string;
  phoneFamily: string;
  centerOrigin: string;
  registeredDemand: Boolean;
  registeredAdmissionForm: Boolean;
  fonasa: Boolean;
  alertCie10: Boolean;
  alertConsentimiento: Boolean;
  alertTreatment?: Boolean;
}

