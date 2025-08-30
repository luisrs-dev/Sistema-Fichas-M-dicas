import { Request, Response } from "express";
import {
  allProfesionalRoles,
  insertProfesionalRole,
  getProfesionalRole,
  updateProfesionalRole
} from "../services/profesionalRole.service";
import { handleHttp } from "../utils/error.handle";

const getProfesionalRoles = async (req: Request, res: Response) => {
  try {
    const responseProfesionalRoles = await allProfesionalRoles();
    res.send(responseProfesionalRoles);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const getProfesionalRoleById = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('getServiceById', id);
  
  try {
    const responseServices = await getProfesionalRole(id);
    res.send(responseServices);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const postProfesionalRole = async ({ body }: Request, res: Response) => {
  try {
    const responseProfesionalRole = await insertProfesionalRole(body);
    res.send(responseProfesionalRole);
  } catch (error) {
    handleHttp(res, "ERROR_POST_PROFESIONAL_ROLE", error);
  }
};

const putProfesionalRole = async ({ body }: Request, res: Response) => {
  const { id, services } = body; 
  try {
    const responseProfesionalRole = await updateProfesionalRole(id, services);
    res.send(responseProfesionalRole);
  } catch (error) {
    handleHttp(res, "ERROR_PUT_PROFESIONAL_ROLE", error);
  }
};


export {
  getProfesionalRoles,
  putProfesionalRole,
  postProfesionalRole,
  getProfesionalRoleById
};
