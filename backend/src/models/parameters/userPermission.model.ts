import { Schema, model } from "mongoose";

const UserPermissionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Asegúrate de que 'User' sea el nombre correcto del modelo de usuario
    required: true
  },
  permissions: {
    type: Map,
    of: Boolean,
    required: true
  }
}, { timestamps: true, versionKey: false });

const UserPermissionModel = model("UserPermission", UserPermissionSchema);
export default UserPermissionModel;