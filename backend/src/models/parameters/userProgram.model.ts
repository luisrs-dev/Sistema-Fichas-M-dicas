import { Schema, model } from "mongoose";

const UserProgramSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Asegúrate de que 'User' sea el nombre correcto del modelo de usuario
    required: true
  },
  programs: {
    type: Map,
    of: Boolean,
    required: true
  }
}, { timestamps: true, versionKey: false });

const UserProgramModel = model("UserProgram", UserProgramSchema);
export default UserProgramModel;