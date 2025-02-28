import { Patient } from "./patient.interface";

export interface Demand {
    patientId: string;
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

  export interface DemandResponse {
  success: boolean;
  message: string;
  data:    Data;
}

export interface Data {
  patient: Patient;
  demand:  Demand;
}
