//Servicio o prestación
import { Schema, model } from "mongoose";
import { ProfesionalRole } from "../../interfaces/parameters/parameter.interface";

const ProfesionalRoleSchema = new Schema<ProfesionalRole>({
  name: { type: String, required: true },
  services: [{ type: Schema.Types.ObjectId, ref: 'Service' }]
});

const ProfesionalRoleModel = model("profesionalRole", ProfesionalRoleSchema);
export default ProfesionalRoleModel;
