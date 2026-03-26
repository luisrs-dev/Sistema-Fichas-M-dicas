import { Schema, model } from "mongoose";
import { IntegracionSocialForm } from "../interfaces/socialForm.interface";

const SocialFormSchema = new Schema<IntegracionSocialForm>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    orientacionSociolaboral: { type: String, default: "" },
    requiereVais: { type: String, default: "" },
    nivelacionEstudios: { type: String, default: "" },
    formacion: { type: String, default: "" },
    capacitacion: [{ type: String }],
    empleo: [{ type: String }],
    habitabilidad: [{ type: String }],
    judicial: [{ type: String }],
    salud: [{ type: String }],
    apoyoSocial: [{ type: String }],
    proteccionSocial: [{ type: String }],
    usoTiempoLibre: [{ type: String }],
    observacion1: { type: String, default: "" },
    observacion2: { type: String, default: "" },
    observacion3: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

const SocialFormModel = model("SocialForm", SocialFormSchema);
export default SocialFormModel;
