import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allUsers,
  inerUser,
  usersByProfile,
  findUser,
  findServicesByProfile,
  updateUser,
  updateActiveStatus,
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

const updateUserActiveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body as { active?: unknown };

    if (typeof active !== "boolean") {
      return res.status(400).json({ success: false, message: "El estado activo es requerido" });
    }

    const user = await updateActiveStatus(id, active);
    res.status(200).json({ success: true, user });
  } catch (error) {
    handleHttp(res, "ERROR_UPDATE_USER_ACTIVE", error);
  }
};

export { postUser, putUser, getUsers, getUsersByProfile, getUsersById, getServicesByProfile, updateUserActiveStatus };
// export { getItem, getItems, updateItem, postItem, deleteItem };
