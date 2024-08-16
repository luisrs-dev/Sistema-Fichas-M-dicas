export interface User {
  _id?: string;
  createdAt?: string;
  name: string;
  email: string;
  password: string;
  updatedAt: string;
}

export enum Profile {
  Patient = "patient",
  Admin = "admin",
}
