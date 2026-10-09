//Servicio o prestación
import { Schema, model } from "mongoose";
import { ProfesionalRole, VISIBLE_ALERT_TYPES } from "../../interfaces/parameters/parameter.interface";

const ProfesionalRoleSchema = new Schema<ProfesionalRole>({
  name: { type: String, required: true },
  services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  visibleAlerts: { type: [{ type: String, enum: VISIBLE_ALERT_TYPES }], default: undefined }
});

const ProfesionalRoleModel = model("profesionalRole", ProfesionalRoleSchema);
export default ProfesionalRoleModel;
