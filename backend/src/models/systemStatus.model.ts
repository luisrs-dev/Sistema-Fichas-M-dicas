import { Schema, model } from "mongoose";
import { SystemStatus } from "../interfaces/systemStatus.interface";

const SystemStatusSchema = new Schema<SystemStatus>(
  {
    action: {
      type: String,
      enum: ["open", "close"],
      required: true,
      default: "open",
    },
    isOpen: {
      type: Boolean,
      required: true,
      default: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    updatedByName: {
      type: String,
      trim: true,
      default: "",
    },
    updatedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
  },
  { timestamps: true, versionKey: false }
);

const SystemStatusModel = model("system_status", SystemStatusSchema);

export default SystemStatusModel;