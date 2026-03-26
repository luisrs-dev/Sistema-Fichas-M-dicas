export interface IntegracionSocialForm {
  _id?: string;
  patientId: string;
  orientacionSociolaboral: string;
  requiereVais: string;
  nivelacionEstudios: string;
  formacion: string;
  capacitacion: string[];
  empleo: string[];
  habitabilidad: string[];
  judicial: string[];
  salud: string[];
  apoyoSocial: string[];
  proteccionSocial: string[];
  usoTiempoLibre: string[];
  observacion1: string;
  observacion2: string;
  observacion3: string;
  createdAt?: Date;
  updatedAt?: Date;
}
