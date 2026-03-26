import { Types } from "mongoose";

export interface IntegracionSocialForm {
  patientId: Types.ObjectId;
  orientacionSociolaboral: string; // Si, No, No Observado
  requiereVais: string; // Si, No, No Observado
  nivelacionEstudios: string; // value from select
  formacion: string; // value from select
  capacitacion: string[]; // values of selected checkboxes (p7-*)
  empleo: string[]; // p8-*
  habitabilidad: string[]; // p9-*
  judicial: string[]; // p10-*
  salud: string[]; // p11-*
  apoyoSocial: string[]; // p12-*
  proteccionSocial: string[]; // p13-*
  usoTiempoLibre: string[]; // p14-*
  observacion1: string;
  observacion2: string;
  observacion3: string;
  createdAt?: Date;
  updatedAt?: Date;
}
