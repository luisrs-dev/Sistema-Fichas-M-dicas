import { Schema, model } from "mongoose";
import { User } from "../interfaces/user.interface";

const UserSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      // default: "Soy la descripción",
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: 'profesionalRole'
    },
    permissions: [{
      type: Schema.Types.ObjectId,
      ref: 'permission'
    }],
    programs: [{
      type: Schema.Types.ObjectId,
      ref: 'program'
    }]
  },
  { timestamps: true, versionKey: false }
);

const UserModel = model("users", UserSchema);
export default UserModel;
