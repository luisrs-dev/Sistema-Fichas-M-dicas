export interface Parameter{
    _id: string,
    name: string;
    value: string;
  }
  
  export enum ParameterValue{
    Permission = "permission",
    Program = "program",
    ProfesionalRole = "profesional-role",
    Services = "service",
    Environment = "environment",

  }

  export type EnvironmentConfigType = 'boolean' | 'string' | 'number';

  export interface EnvironmentConfig {
    _id?: string;
    key: string;
    label: string;
    type: EnvironmentConfigType;
    value: boolean | string | number;
    description?: string;
  }