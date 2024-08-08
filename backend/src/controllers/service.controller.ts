import { Request, Response } from "express";
import {
  allServices,
  insertService
} from "../services/service.service";
import { handleHttp } from "../utils/error.handle";

const getServices = async (req: Request, res: Response) => {
  try {
    const responseServices = await allServices();
    res.send(responseServices);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const postService = async ({ body }: Request, res: Response) => {
  try {
    const responseService = await insertService(body);
    res.send(responseService);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

export {
  getServices,
  postService
};
