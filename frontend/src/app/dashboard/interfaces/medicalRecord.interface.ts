export interface MedicalRecord {
  date: string;
  entryType: string;
  service: Service;
  relevantElements: string;
  diagnostic: string;
  pharmacologicalScheme: string;
  patient: string;
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
}

export interface Profile{
    _id: string;
    name: string;
}