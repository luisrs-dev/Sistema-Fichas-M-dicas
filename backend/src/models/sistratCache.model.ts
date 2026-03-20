import { Schema, model, Document } from "mongoose";

export interface ISistratCache extends Document {
  center: string;
  patients: any[];
  lastUpdated: Date;
}

const SistratCacheSchema = new Schema<ISistratCache>(
  {
    center: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patients: {
      type: [],
      default: [],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SistratCacheModel = model<ISistratCache>("SistratCache", SistratCacheSchema);

export default SistratCacheModel;
