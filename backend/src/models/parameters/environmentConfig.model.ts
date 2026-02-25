import { Schema, model } from "mongoose";
import { EnvironmentConfiguration } from "../../interfaces/parameters/parameter.interface";

const EnvironmentConfigSchema = new Schema<EnvironmentConfiguration>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["boolean", "string", "number"],
      required: true,
      default: "string",
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const EnvironmentConfigModel = model("environment_config", EnvironmentConfigSchema);
export default EnvironmentConfigModel;
