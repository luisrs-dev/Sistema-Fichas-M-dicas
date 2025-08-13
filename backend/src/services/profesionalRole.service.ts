import ProfesionalRoleModel from "../models/parameters/profesionalRole.model";
import { ProfesionalRole } from './../interfaces/parameters/parameter.interface';

const insertProfesionalRole = async (profesionalRole: ProfesionalRole) => {
  const responseInsert = await ProfesionalRoleModel.create(profesionalRole);
  return responseInsert;
};

const getProfesionalRole = async (id: string) => {

  try {
    const service = await ProfesionalRoleModel.findOne({ _id: id }).populate(["services"]);;
    return service;
  } catch (error) {
    console.log(`No fue posible obtener la prestacion: ${id}`);
    return 'PROFESIONAL_ROLE_NOT_FOUND';
  }

};


const allProfesionalRoles = async () => {
  const responseAll = await ProfesionalRoleModel.find({}).populate('services');
  return responseAll;
};
export {
  allProfesionalRoles,
  insertProfesionalRole,
  getProfesionalRole
};

