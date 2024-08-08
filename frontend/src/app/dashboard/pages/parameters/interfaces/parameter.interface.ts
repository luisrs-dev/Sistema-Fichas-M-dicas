export interface Parameter{
    _id: string,
    name: string;
    value: string
  }
  
  export enum ParameterValue{
    Permission = "permission",
    Program = "program",
    ProfesionalRole = "profesional-role",
    Services = "service",

  }