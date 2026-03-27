import { Schema, model } from "mongoose";
import { SistratCenter } from "../interfaces/sistratCenter.interface";

const SistratCenterSchema = new Schema<SistratCenter>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    usuario: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const SistratCenterModel = model("SistratCenters", SistratCenterSchema);
export default SistratCenterModel;
