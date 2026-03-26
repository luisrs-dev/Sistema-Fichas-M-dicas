import { Types } from "mongoose";

export interface TopFormSustancia {
  todosLosCeros: boolean | null;
  promedio: number | null;
  ultimaSemana: number | null;
  semana3: number | null;
  semana2: number | null;
  semana1: number | null;
  total: number | null;
  noResponde: boolean | null;
}

export interface TopFormTransgresionItem {
  si: boolean | null;
  no: boolean | null;
  nr: boolean | null;
}

export interface TopFormViolenciaIntrafamiliar {
  todosLosCeros: boolean | null;
  ultimaSemana: number | null;
  semana3: number | null;
  semana2: number | null;
  semana1: number | null;
  total: number | null;
  noResponde: boolean | null;
}

export interface TopForm {
  patientId: Types.ObjectId;
  fechaEntrevista: string;
  etapaTratamiento: "ingreso" | "egreso" | "seguimiento" | null;
  nombreEntrevistador: string;

  // Sección 1 — Uso de Sustancias
  alcohol: TopFormSustancia;
  marihuana: TopFormSustancia;
  pastaBase: TopFormSustancia;
  cocaina: TopFormSustancia;
  sedantes: TopFormSustancia;
  otraSustancia: TopFormSustancia & { nombre: string | null; unidadMedida: string | null };

  // Sección 2 — Transgresión a la Norma Social
  hurto: TopFormTransgresionItem;
  robo: TopFormTransgresionItem;
  ventaDrogas: TopFormTransgresionItem;
  rina: TopFormTransgresionItem;
  violenciaIntrafamiliar: TopFormViolenciaIntrafamiliar;
  otraAccion: TopFormTransgresionItem;

  // Sección 3 — Salud y Funcionamiento Social
  saludPsicologica: number | null;        // 0-20
  diasTrabajados: TopFormSustancia;
  diasEducacion: TopFormSustancia;
  saludFisica: number | null;             // 0-20
  tieneLugarVivir: "si" | "no" | "nr" | null;
  viviendasCondicionesBasicas: "si" | "no" | "nr" | null;
  calidadVida: number | null;             // 0-20
  noDeseaCompletar: boolean | null;
  observaciones: string | null;
}
