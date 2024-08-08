import { Types } from "mongoose";

export interface Demand {
  patientId: Types.ObjectId;
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