import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allUsers,
  inerUser,
  usersByProfile,
  findUser,
  findServicesByProfile,
  updateUser,
} from "../services/user.service";

const getUsersById = async ({ params }: Request, res: Response) => {
  try {
    const { id } = params;
    const responseItem = await findUser(id);
    console.log({ responseItem });

    const dataResponse = responseItem ?? "NOT_FOUND";
    res.send(dataResponse);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEM", error);
  }
};

const getServicesByProfile = async ({ params }: Request, res: Response) => {
  try {
    const { id } = params;
    const responseItem = await findServicesByProfile(id);
    console.log({ responseItem });

    const dataResponse = responseItem ?? "NOT_FOUND";
    res.send(dataResponse);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEM", error);
  }
};

const getUsers = async (req: Request, res: Response) => {
  try {
    const responseItems = await allUsers();
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const getUsersByProfile = async (req: Request, res: Response) => {
  try {
    const responseItems = await usersByProfile(req.params.profile);
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const postUser = async (req: Request, res: Response) => {
  try {

    console.log(req);
    

    //const imagePath = file ? file.path : null; // Obtiene la ruta del archivo subido

    //const responseUser = await inerUser(body, imagePath);

    res.send('responseUser');
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

const putUser = async ({ body }: Request, res: Response) => {
  try {
    const responseUser = await updateUser(body);
    res.send(responseUser);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

export { postUser, putUser, getUsers, getUsersByProfile, getUsersById, getServicesByProfile };
// export { getItem, getItems, updateItem, postItem, deleteItem };
