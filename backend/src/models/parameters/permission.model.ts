import { Schema, model } from "mongoose";
import { Permission } from "../../interfaces/parameters/parameter.interface";

const PermissionSchema = new Schema<Permission>(
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

const PermissionModel = model("permission", PermissionSchema);
export default PermissionModel;
