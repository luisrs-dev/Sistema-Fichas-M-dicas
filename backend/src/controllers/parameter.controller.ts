import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allPermissions,
  allProgram,
  inerPermission,
  inerProgram
} from "../services/parameter.service";

const getPermissions = async (req: Request, res: Response) => {
  try {
    const responseItems = await allPermissions();
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const getPrograms = async (req: Request, res: Response) => {
  try {
    const responseItems = await allProgram();
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const postPermission = async ({ body }: Request, res: Response) => {
  try {
    const responsePatient = await inerPermission(body);
    res.send(responsePatient);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

const postProgram = async ({ body }: Request, res: Response) => {
  try {
    const responsePatient = await inerProgram(body);
    res.send(responsePatient);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

export {
  getPermissions,
  getPrograms,
  postPermission,
  postProgram
};