import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allPatients,
  inerPatient,
  inerDemand,
  updatePatientSistrat,
  recordDemandToSistrat,
  PatientsByProfile,
  findPatient,
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

    const { programs } = req.query;

    // Asegúrate de que `programs` sea un array, incluso si se pasa un solo valor
    const programsArray = Array.isArray(programs) ? programs : [programs];
    const validProgramsArray = programsArray.filter((p): p is string => typeof p === 'string');

    const responseItems = await allPatients(validProgramsArray);
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

const postPatient = async ({ body }: Request, res: Response) => {
  try {
    const responsePatient = await inerPatient(body);
    res.send(responsePatient);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

const postDemand = async ({ body }: Request, res: Response) => {
  const { patientId, dataSistrat} = body;

  try {
    const responseDemand = await inerDemand(patientId, dataSistrat);
    res.send(responseDemand);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

const postDemandToSistrat = async ({body}: Request, response: Response) => {
  const {patientId } = body;
  try {
    const responseDemandToSistrat = await recordDemandToSistrat(patientId);

  } catch (error) {
    
  }
}


const postAdmissionForm = async ({ body }: Request, res: Response) => {
  
  const {userId, dataAdmissionForm} = body;
  if(!userId){

  }
  try {
    const responseAdmissionForm =' await saveAdmissionForm(userId, dataAdmissionForm)';
    res.send(responseAdmissionForm);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

const postPatientSistrat = async (req: Request, res: Response) => {
  try {
    const { userId, dataSistrat } = req.body;
    const responsePatient = await updatePatientSistrat(userId, dataSistrat);
    res.send(responsePatient);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

//const recordPatientSistrat = async (req: Request, res: Response) => {
//  try {
//    const { userId } = req.body;
//    const responsePatient = await recordToSistrat(userId);
//    res.send(responsePatient);
//  } catch (error) {
//    handleHttp(res, "ERROR_POST_ITEM", error);
//  }
//};

export {
  postPatient,
  postDemand,
  postDemandToSistrat,
  postPatientSistrat,
  //recordPatientSistrat,
  getPatients,
  getPatientsByProfile,
  getPatientsById,
  postAdmissionForm
};