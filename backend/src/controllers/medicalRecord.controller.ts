import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allMedicalRecords,
  insertMedicalRecord,
  allMedicalRecordsUser
} from "../services/medicalRecord.service";

// const getItem = async ({ params }: Request, res: Response) => {
//   try {
//     const { id } = params;
//     const responseItem = await findItem(id);
//     console.log({ responseItem });

//     const dataResponse = responseItem.length > 0 ? responseItem : "NOT_FOUND";
//     res.send(dataResponse);
//   } catch (error) {
//     handleHttp(res, "ERROR_GET_ITEM", error);
//   }
// };

const getAllMedicalRecordsByUser = async (
  { params }: Request,
  res: Response
) => {
  try {
    const { _id } = params;
    console.log({id: _id });
    
    const responseItems = await allMedicalRecordsUser(_id);
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const getMedicalRecords = async (req: Request, res: Response) => {
  try {
    const responseItems = await allMedicalRecords();
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
const postMedicalRecord = async ({ body }: Request, res: Response) => {
  try {
    const responseUser = await insertMedicalRecord(body);

    res.send(responseUser);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

export { postMedicalRecord, getMedicalRecords, getAllMedicalRecordsByUser };
// export { getItem, getItems, updateItem, postItem, deleteItem };
