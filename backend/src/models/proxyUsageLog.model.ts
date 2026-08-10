import { Schema, model } from "mongoose";
import { ProxyUsageLog } from "../interfaces/proxyUsageLog.interface";

const ProxyUsageLogSchema = new Schema<ProxyUsageLog>(
  {
    userId: {
      type: String,
      default: null,
    },
    userEmail: {
      type: String,
      default: "sistema",
    },
    userName: {
      type: String,
      default: "Sistema / Tarea Automática",
    },
    activity: {
      type: String,
      required: true,
      index: true,
    },
    sistratCenter: {
      type: String,
      default: null,
      index: true,
    },
    patientId: {
      type: String,
      default: null,
    },
    bytesDownloaded: {
      type: Number,
      required: true,
      default: 0,
    },
    megabytes: {
      type: Number,
      required: true,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Índice compuesto para consultas rápidas por rango de fecha
ProxyUsageLogSchema.index({ timestamp: 1, activity: 1, userEmail: 1 });

const ProxyUsageLogModel = model("proxy_usage_logs", ProxyUsageLogSchema);
export default ProxyUsageLogModel;
