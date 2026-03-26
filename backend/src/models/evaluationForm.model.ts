import { Schema, model } from "mongoose";
import { EvaluationForm } from "../interfaces/evaluationForm.interface";

const EvaluationFormSchema = new Schema<EvaluationForm>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    patronConsumo: { type: String, default: "" },
    situacionFamiliar: { type: String, default: "" },
    relacionesInterpersonales: { type: String, default: "" },
    situacionOcupacional: { type: String, default: "" },
    trasgresionSocial: { type: String, default: "" },
    saludMental: { type: String, default: "" },
    saludFisica: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

const EvaluationFormModel = model("EvaluationForm", EvaluationFormSchema);
export default EvaluationFormModel;
