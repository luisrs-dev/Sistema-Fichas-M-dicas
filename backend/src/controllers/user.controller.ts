import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allUsers,
  inerUser,
  usersByProfile,
  findUser
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



// const updateItem = async ({ params, body }: Request, res: Response) => {
//   try {
//     const { id } = params;
//     const responseItem = await updateCar(id, body);

//     res.send(responseItem);
//   } catch (error) {
//     handleHttp(res, "");
//   }
// };

// const deleteItem = async ({ params }: Request, res: Response) => {
//   try {
//     const { id } = params;
//     const responseItem = await deleteCar(id);
//     res.send(responseItem);
//   } catch (error) {
//     handleHttp(res, "");
//   }
// };
const postUser = async ({ body }: Request, res: Response) => {
  try {
    const responseUser = await inerUser(body);

    res.send(responseUser);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

export { postUser, getUsers, getUsersByProfile, getUsersById };
// export { getItem, getItems, updateItem, postItem, deleteItem };
