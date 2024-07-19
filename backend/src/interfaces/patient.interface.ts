import { Auth } from "./auth.interface";

export interface Patient extends Auth {
  admissionDate: string;
  program: string;
  rut: string;
  name: string;
  surname: string;
  secondSurname: string;
  birthDate: string;
  sex: string;
  region: string;
  phone: string;
  phoneFamily: string;
  // Data Sistrat, se registra en un segundo paso
  mainSubstance?: string;
  previousTreatments?: string;
  atentionRequestDate?: string;
  typeContact?: string;
  whoRequest?: string;
  whoDerives?: string;
  careOfferedDate?: string;
  estimatedMonth?: string;
  demandIsNotAccepted?: string;
  firstAtentionDate?: string;
  atentionResolutiveDate?: string;
  interventionAB?: string;
  observations?: string;
}
