import { Schema } from "mongoose";

export interface Permission {
  name: string;
  value: string;
}

export interface Program {
  name: string;
  value: string;
}

export interface Service {
  code: string;
  description: string;
}

export interface ProfesionalRole {
  name: string;
  services: Schema.Types.ObjectId[];
}
