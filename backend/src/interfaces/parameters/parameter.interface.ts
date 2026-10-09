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

export const VISIBLE_ALERT_TYPES = ["cie10", "consentimiento", "integracionSocial", "evaluacion", "egreso", "diagnosticoSocial"] as const;
export type VisibleAlertType = typeof VISIBLE_ALERT_TYPES[number];

export interface ProfesionalRole {
  name: string;
  services: Schema.Types.ObjectId[];
  visibleAlerts?: VisibleAlertType[];
}

export type EnvironmentConfigType = "boolean" | "string" | "number";

export interface EnvironmentConfiguration {
  key: string;
  label: string;
  type: EnvironmentConfigType;
  value: boolean | string | number;
  description?: string;
}
