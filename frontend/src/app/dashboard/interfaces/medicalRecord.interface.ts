import { Patient } from "./patient.interface";

export interface MedicalRecord {
  _id: string;
  date: string;
  entryType: string;
  service: Service;
  relevantElements: string;
  interventionObjective: string;
  diagnostic: string;
  diagnosticMedic?: string;
  pharmacologicalScheme: string;
  rescueAction?: string;
  isRemote?: boolean;
  remoteMethod?: string;
  patient: Patient;
  registeredBy: RegisteredBy;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service{
  _id: string;
  code: string;
  description: string;
}


export interface RegisteredBy{
  _id: string;
  name: string;
  profile: Profile;
  signature: string;
}

export interface Profile{
    _id: string;
    name: string;
}