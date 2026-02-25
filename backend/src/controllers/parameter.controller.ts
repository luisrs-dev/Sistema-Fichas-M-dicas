import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allEnvironmentConfigs,
  allPermissions,
  allProgram,
  inerPermission,
  inerProgram,
  upsertEnvironmentConfig
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

const getEnvironmentConfigs = async (req: Request, res: Response) => {
  try {
    const responseItems = await allEnvironmentConfigs();
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

const postEnvironmentConfig = async ({ body }: Request, res: Response) => {
  try {
    const response = await upsertEnvironmentConfig(body);
    res.send(response);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

export {
  getEnvironmentConfigs,
  getPermissions,
  getPrograms,
  postEnvironmentConfig,
  postPermission,
  postProgram
};