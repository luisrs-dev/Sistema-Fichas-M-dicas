import { Types } from "mongoose";
import { Auth } from "./auth.interface";

export interface Patient extends Auth {
  admissionDate: string;
  program: Types.ObjectId;
  rut: string;
  name: string;
  surname: string;
  secondSurname: string;
  birthDate: string;
  sex: string;
  region: string;
  phone: string;
  phoneFamily: string;
  centerOrigin: string;
}

