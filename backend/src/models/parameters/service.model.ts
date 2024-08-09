import { Schema, model } from "mongoose";

const ServiceSchema = new Schema({
  code: { type: String, required: true },
  description: { type: String }
});

const ServiceModel = model("Service", ServiceSchema);
export default ServiceModel;