export interface Patient {
  _id?: string;
  admissionDate: string;
  program: Program ;
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
  createdAt?: string;
  updatedAt?: string;
}

interface Program{
  _id: string;
  name: string;
}