import { Schema, model } from "mongoose";
import { Program } from "../../interfaces/parameters/parameter.interface";

const ProgramSchema = new Schema<Program>(
  {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    }
  },
  { timestamps: true, versionKey: false }
);

const ProgramModel = model("program", ProgramSchema);
export default ProgramModel;
