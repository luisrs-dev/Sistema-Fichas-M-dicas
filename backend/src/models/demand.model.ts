import { Schema, model } from "mongoose";
import { Demand } from "../interfaces/demand.interface";

const DemandSchema = new Schema<Demand>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    mainSubstance: {
      type: String,
      required: true,
    },
    previousTreatments: {
      type: String,
      required: true,
    },
    atentionRequestDate: {
      type: String,
      required: true,
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
      type: String,
      required: true,
    },
    estimatedMonth: {
      type: String
    },
    demandIsNotAccepted: {
      type: String
    },
    firstAtentionDate: {
      type: String,
      required: true,
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

const DemandModel = model("Demand", DemandSchema);
export default DemandModel;
