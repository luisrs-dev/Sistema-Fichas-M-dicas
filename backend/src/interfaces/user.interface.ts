import { Types } from "mongoose";
import { Auth } from "./auth.interface";

export interface User extends Auth {
  name: string;
  phone: string;
  profile: Types.ObjectId;
  permissions: string[];
  programs: string[];
}
