import { Request, Response } from "express";
import {
  allProfesionalRoles,
  insertProfesionalRole
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

const postProfesionalRole = async ({ body }: Request, res: Response) => {
  try {
    const responseProfesionalRole = await insertProfesionalRole(body);
    res.send(responseProfesionalRole);
  } catch (error) {
    handleHttp(res, "ERROR_POST_PROFESIONAL_ROLE", error);
  }
};

export {
  getProfesionalRoles,
  postProfesionalRole
};
