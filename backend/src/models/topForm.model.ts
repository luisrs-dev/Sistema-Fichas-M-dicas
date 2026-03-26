import { Schema, model } from "mongoose";
import { TopForm } from "../interfaces/topForm.interface";

const SustanciaSchema = new Schema(
  {
    todosLosCeros: { type: Boolean, default: null },
    promedio: { type: Number, default: null },
    ultimaSemana: { type: Number, default: null },
    semana3: { type: Number, default: null },
    semana2: { type: Number, default: null },
    semana1: { type: Number, default: null },
    total: { type: Number, default: null },
    noResponde: { type: Boolean, default: null },
  },
  { _id: false }
);

const TransgresionItemSchema = new Schema(
  {
    si: { type: Boolean, default: null },
    no: { type: Boolean, default: null },
    nr: { type: Boolean, default: null },
  },
  { _id: false }
);

const ViolenciaIntrafamiliarSchema = new Schema(
  {
    todosLosCeros: { type: Boolean, default: null },
    ultimaSemana: { type: Number, default: null },
    semana3: { type: Number, default: null },
    semana2: { type: Number, default: null },
    semana1: { type: Number, default: null },
    total: { type: Number, default: null },
    noResponde: { type: Boolean, default: null },
  },
  { _id: false }
);

const TopFormSchema = new Schema<TopForm>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    fechaEntrevista: { type: String },
    etapaTratamiento: { type: String, enum: ["ingreso", "egreso", "seguimiento", null], default: null },
    nombreEntrevistador: { type: String },

    // Sección 1
    alcohol: { type: SustanciaSchema, default: () => ({}) },
    marihuana: { type: SustanciaSchema, default: () => ({}) },
    pastaBase: { type: SustanciaSchema, default: () => ({}) },
    cocaina: { type: SustanciaSchema, default: () => ({}) },
    sedantes: { type: SustanciaSchema, default: () => ({}) },
    otraSustancia: {
      type: new Schema(
        {
          ...SustanciaSchema.obj,
          nombre: { type: String, default: null },
          unidadMedida: { type: String, default: null },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // Sección 2
    hurto: { type: TransgresionItemSchema, default: () => ({}) },
    robo: { type: TransgresionItemSchema, default: () => ({}) },
    ventaDrogas: { type: TransgresionItemSchema, default: () => ({}) },
    rina: { type: TransgresionItemSchema, default: () => ({}) },
    violenciaIntrafamiliar: { type: ViolenciaIntrafamiliarSchema, default: () => ({}) },
    otraAccion: { type: TransgresionItemSchema, default: () => ({}) },

    // Sección 3
    saludPsicologica: { type: Number, default: null },
    diasTrabajados: { type: SustanciaSchema, default: () => ({}) },
    diasEducacion: { type: SustanciaSchema, default: () => ({}) },
    saludFisica: { type: Number, default: null },
    tieneLugarVivir: { type: String, enum: ["si", "no", "nr", null], default: null },
    viviendasCondicionesBasicas: { type: String, enum: ["si", "no", "nr", null], default: null },
    calidadVida: { type: Number, default: null },
    noDeseaCompletar: { type: Boolean, default: null },
    observaciones: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

const TopFormModel = model("TopForm", TopFormSchema);
export default TopFormModel;
