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
      type: String,
      // default: "Soy la descripción",
    },
  },
  { timestamps: true, versionKey: false }
);

const UserModel = model("users", UserSchema);
export default UserModel;
