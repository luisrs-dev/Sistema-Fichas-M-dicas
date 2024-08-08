import ProfesionalRoleModel from "../models/parameters/profesionalRole.model";
import { ProfesionalRole } from './../interfaces/parameters/parameter.interface';

const insertProfesionalRole = async (profesionalRole: ProfesionalRole) => {
  const responseInsert = await ProfesionalRoleModel.create(profesionalRole);
  return responseInsert;
};

const allProfesionalRoles = async () => {
  const responseAll = await ProfesionalRoleModel.find({}).populate('services');
  return responseAll;
};
export {
  allProfesionalRoles,
  insertProfesionalRole
};

