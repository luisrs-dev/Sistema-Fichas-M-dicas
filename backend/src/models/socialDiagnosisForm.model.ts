import { Schema, model } from "mongoose";
import { SocialDiagnosisForm } from "../interfaces/socialDiagnosisForm.interface";

const socialDiagnosisFormSchema = new Schema<SocialDiagnosisForm>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    global: { type: String, required: true },
    capitalHumano: { type: String, required: true },
    capitalFisico: { type: String, required: true },
    capitalSocial: { type: String, required: true },
    syncStatus: { type: String, enum: ["pendiente", "sincronizado"], default: "pendiente" },
  },
  {
    timestamps: true,
  }
);

const SocialDiagnosisFormModel = model<SocialDiagnosisForm>("SocialDiagnosisForm", socialDiagnosisFormSchema);

export default SocialDiagnosisFormModel;
