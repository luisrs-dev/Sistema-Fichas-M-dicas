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
  updateFormCie10,
  demandByPatient,
  update,
  dataPatientByRut,
  updateActiveStatus
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
    const { programs, active } = req.query;

    // Asegúrate de que `programs` sea un array, incluso si se pasa un solo valor
    const programsArray = Array.isArray(programs) ? programs : [programs];
    const validProgramsArray = programsArray.filter((p): p is string => typeof p === "string");

    const activeFilter = typeof active === "string" ? active : undefined;
    const responseItems = await allPatients(validProgramsArray, activeFilter);
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const updatePatientActiveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body as { active?: unknown };

    if (typeof active !== "boolean") {
      return res.status(400).json({ success: false, message: "El estado activo es requerido" });
    }

    const patient = await updateActiveStatus(id, active);
    res.status(200).json({ success: true, patient });
  } catch (error) {
    handleHttp(res, "ERROR_UPDATE_PATIENT_ACTIVE", error);
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

const updatePatient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const patientData = req.body;

  console.log(`updatePatient id: ${id}`);
  console.log(`updatePatient patientData: ${JSON.stringify(patientData)}`);
  
  
  try {
    const updatedPatient = await update(id, patientData);
    res.send(updatedPatient);
  } catch (error) {
    handleHttp(res, "ERROR_UPDATE_PATIENT", error);
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
  console.log(`updateAdmissionForm patientId: ${patientId}`);
  console.log(`updateAdmissionForm dataAdmissionForm: ${JSON.stringify(dataAdmissionForm)}`);
  
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

const getDemand = async (req: Request, res: Response) => {
  try {    
    const data = await demandByPatient(req.params.patientId);
    res.status(200).json({ success: true, message: "Demanda recuperada con éxito", data: data });
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const getDataByRut = async (req: Request, res: Response) => {
  try {
    const { rut } = req.params;
    if (!rut) {
      return res.status(400).json({ success: false, message: "El parámetro rut es requerido" });
    }

    const data = await dataPatientByRut(rut);
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "No se encontró demanda asociada al RUT proporcionado" });
    }

    res.status(200).json({ success: true, message: "Demanda recuperada con éxito", data });
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
    if(responseAdmissionForm){
      res.status(201).json({ success: true, message: "Ficha de ingreso creada con éxito" });
    }else{
      res.status(400).json({ success: false, message: "No fue posible el registro en SISTRAT" });
    }
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
  updatePatient,
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
  formCie10,
  getDemand,
  getDataByRut,
  updatePatientActiveStatus
};
