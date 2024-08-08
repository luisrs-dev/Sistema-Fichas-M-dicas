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
      type: String,
      required: true,
    },
    demandIsNotAccepted: {
      type: String,
      required: true,
    },
    firstAtentionDate: {
      type: String,
      required: true,
    },
    atentionResolutiveDate: {
      type: String,
      required: true,
    },
    interventionAB: {
      type: String,
      required: true,
    },
    observations: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const DemandModel = model("Demand", DemandSchema);
export default DemandModel;
