import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allPatients,
  inerPatient,
  updatePatientSistrat,
  recordToSistrat,
  PatientsByProfile,
  findPatient
} from "../services/patient.service";

const getPatientsById = async ({ params }: Request, res: Response) => {
  try {
    const { id } = params;
    const responseItem = await findPatient(id);
    console.log({ responseItem });

    const dataResponse = responseItem ?? "NOT_FOUND";
    res.send(dataResponse);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEM", error);
  }
};

const getPatients = async (req: Request, res: Response) => {
  try {
    const responseItems = await allPatients();
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const getPatientsByProfile = async (req: Request, res: Response) => {
  try {
    const responseItems = await PatientsByProfile(req.params.profile);
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
const postPatient = async ({ body }: Request, res: Response) => {
  try {
    const responsePatient = await inerPatient(body);
    res.send(responsePatient);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};



const postPatientSistrat = async (req: Request, res: Response) => {
  try {
    const {userId, dataSistrat} = req.body;
    const responsePatient = await updatePatientSistrat(userId, dataSistrat);
    res.send(responsePatient);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};


const recordPatientSistrat = async (req: Request, res: Response) => {
  try {
    const {userId} = req.body;
    const responsePatient = await recordToSistrat(userId);
    res.send(responsePatient);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};



export { postPatient, postPatientSistrat, recordPatientSistrat, getPatients, getPatientsByProfile, getPatientsById };
// export { getItem, getItems, updateItem, postItem, deleteItem };
