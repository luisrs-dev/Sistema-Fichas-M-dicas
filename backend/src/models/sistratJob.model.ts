import { Schema, model } from "mongoose";
import { SistratJob } from "../interfaces/sistratJob.interface";

const SistratJobSchema = new Schema<SistratJob>(
  {
    demandAttemptKey: { type: String, unique: true, sparse: true },
    activeDemand: { type: Boolean },
    leaseUntil: { type: Date },
    history: { type: [{ step: String, progress: Number, at: Date }], default: [] },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "patient",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["ficha-ingreso", "demanda", "top", "social", "evaluacion", "diagnostico-social"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "PENDING",
      required: true,
      index: true,
    },
    step: {
      type: String,
      default: "Tarea iniciada",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    result: {
      type: Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

SistratJobSchema.index({ patientId: 1, type: 1, status: 1 });
SistratJobSchema.index({ patientId: 1, type: 1, createdAt: -1, _id: -1 });

SistratJobSchema.index({ patientId: 1, type: 1, activeDemand: 1 }, {
  unique: true, partialFilterExpression: { activeDemand: true }, name: "unique_active_demand"
});

const SistratJobModel = model<SistratJob>("sistrat_jobs", SistratJobSchema);

export default SistratJobModel;
