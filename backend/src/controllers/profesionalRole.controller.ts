import { Request, Response } from "express";
import {
  allProfesionalRoles,
  insertProfesionalRole,
  getProfesionalRole,
  updateProfesionalRole
} from "../services/profesionalRole.service";
import { VISIBLE_ALERT_TYPES } from "../interfaces/parameters/parameter.interface";
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

const validVisibleAlerts = (value: unknown): boolean => value === undefined ||
  (Array.isArray(value) && value.every(alert => VISIBLE_ALERT_TYPES.includes(alert)));

const postProfesionalRole = async ({ body }: Request, res: Response) => {
  if (!validVisibleAlerts(body.visibleAlerts)) {
    res.status(400).send({ error: "INVALID_VISIBLE_ALERTS" });
    return;
  }
  try {
    const responseProfesionalRole = await insertProfesionalRole(body);
    res.send(responseProfesionalRole);
  } catch (error) {
    handleHttp(res, "ERROR_POST_PROFESIONAL_ROLE", error);
  }
};

const putProfesionalRole = async ({ body }: Request, res: Response) => {
  const { id, services, visibleAlerts } = body;
  if (!validVisibleAlerts(visibleAlerts)) {
    res.status(400).send({ error: "INVALID_VISIBLE_ALERTS" });
    return;
  }
  try {
    const responseProfesionalRole = await updateProfesionalRole(id, services, visibleAlerts);
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
