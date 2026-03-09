import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  getSystemStatus,
  getSystemStatusHistory,
  updateSystemStatus,
} from "../services/systemStatus.service";

const getSystemStatusController = async (_req: Request, res: Response) => {
  try {
    const response = await getSystemStatus();
    res.send(response);
  } catch (error) {
    handleHttp(res, "ERROR_GET_SYSTEM_STATUS", error);
  }
};

const updateSystemStatusController = async ({ body }: Request, res: Response) => {
  try {
    const response = await updateSystemStatus(body);
    res.send(response);
  } catch (error) {
    console.log('[updateSystemStatusController] Error', error);
    handleHttp(res, "ERROR_UPDATE_SYSTEM_STATUS", error);
  }
};

const getSystemStatusHistoryController = async (_req: Request, res: Response) => {
  try {
    const response = await getSystemStatusHistory();
    res.send(response);
  } catch (error) {
    handleHttp(res, "ERROR_GET_SYSTEM_STATUS_HISTORY", error);
  }
};

export {
  getSystemStatusController,
  getSystemStatusHistoryController,
  updateSystemStatusController,
};