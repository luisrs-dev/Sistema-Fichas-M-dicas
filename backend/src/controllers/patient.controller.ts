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
  admisionFormmByPatient,
  saveAdmissionForm,
  updateAF,
  saveAdmissionFormToSistrat,
  updateAlertsFromSistrat,
  updateFormCie10
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
    const validProgramsArray = programsArray.filter((p): p is string => typeof p === "string");

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
  const { patientId, dataSistrat } = body;

  try {
    const patient = await inerDemand(patientId, dataSistrat);
    res.send(patient);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

const postDemandToSistrat = async ({ body }: Request, response: Response) => {
  const { patientId } = body;

  if (!patientId) {
    return response.status(400).json({ error: "patientId es requerido." });
  }
  

  try {
    const status = await recordDemandToSistrat(patientId);
    if(status.success){
      response.status(200).json({ message: "Demanda registrada correctamente." }); // Respuesta exitosa
    }
    else {
      return response.status(500).json({ message: "No se pudo registrar la demanda en Sistrat." });
    }

  } catch (error: any) {
    console.error("Error en postDemandToSistrat:", error);
    response.status(500).json({ error: error.message || "Error interno del servidor." }); // Respuesta de error
  }
};


const updateAdmissionForm = async ({ body }: Request, res: Response) => {
  const { patientId, dataAdmissionForm } = body;
  if (!patientId) {
    res.status(500).json({ success: true, message: "Usuario no existe para actualizar ficha de ingreso" });
  }
  try {
    const responseAdmissionForm = await updateAF(patientId, dataAdmissionForm);
    res.status(200).json({ success: true, message: "Ficha de ingreso actualizada con éxito" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};



const postAdmissionForm = async ({ body }: Request, res: Response) => {
  const { patientId, dataAdmissionForm } = body;
  if (!patientId) {
    res.status(500).json({ success: true, message: "Usuario no existe para registrar ficha de ingreso" });
  }
  try {
    const patient = await saveAdmissionForm(patientId, dataAdmissionForm);
    res.status(201).json({ success: true, message: "Ficha de ingreso creada con éxito", patient });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAdmissionForm = async (req: Request, res: Response) => {
  try {

    console.log('req.params.patientId');
    console.log(req.params.patientId);
    
    const data = await admisionFormmByPatient(req.params.patientId);
    res.status(200).json({ success: true, message: "Ficha de ingreso recuperada con éxito", data: data });
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};




const postAdmissionFormSistrat = async ({ body }: Request, res: Response) => {
  const { patientId } = body;
  if (!patientId) {
    res.status(500).json({ success: true, message: "Usuario no existe para registrar ficha de ingreso en SISTRAT" });
  }
  try {
    const responseAdmissionForm = await saveAdmissionFormToSistrat(patientId);
    res.status(201).json({ success: true, message: "Ficha de ingreso creada con éxito" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
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

const updateAlerts = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;
    console.log(`Paciente id desde update alert controllers: ${patientId}`);
    
    const responseUserWithAlerts = await updateAlertsFromSistrat(patientId);
    res.send(responseUserWithAlerts);
    

  } catch (error) {
    handleHttp(res, "ERROR_UPDATE_ALERTS", error);
    
  }
}

const formCie10 = async (req: Request, res: Response) => {
  try {
    const { patientId, optionSelected } = req.body;
    console.log(`controller: ${optionSelected}`);
    
    
    const responseFormCie10 = await updateFormCie10(patientId, optionSelected);
    res.send(responseFormCie10);
  
  } catch (error) {
    handleHttp(res, "ERROR_UPDATE_ALERTS", error);
    
  }
}

export {
  postPatient,
  postDemand,
  postDemandToSistrat,
  postPatientSistrat,
  getPatients,
  getPatientsByProfile,
  getPatientsById,
  updateAdmissionForm,
  getAdmissionForm,
  postAdmissionForm,
  postAdmissionFormSistrat,
  updateAlerts,
  formCie10
};
