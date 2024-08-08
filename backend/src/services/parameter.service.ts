import { Permission, Program } from "../interfaces/parameters/parameter.interface";
import PermissionModel from "../models/parameters/permission.model";
import ProgramModel from "../models/parameters/program.model";

const inerPermission = async (permission: Permission) => {
  const responseInsert = await PermissionModel.create(permission);
  return responseInsert;
};

const inerProgram = async (program: Program) => {
  const responseInsert = await ProgramModel.create(program);
  return responseInsert;
};

const allPermissions = async () => {
  const responseAll = await PermissionModel.find({});
  return responseAll;
};

const allProgram = async () => {
  const responseAll = await ProgramModel.find({});
  return responseAll;
};



export {
  allPermissions,
  allProgram,
  inerPermission,
  inerProgram
};

