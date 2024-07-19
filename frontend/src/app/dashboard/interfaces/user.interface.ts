export interface User {
  _id?: string;
  createdAt?: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  updatedAt: string;
}

export enum Profile {
  Patient = "patient",
  Admin = "admin",
}
