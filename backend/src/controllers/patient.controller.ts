import { isCareStatus } from "../utils/careStatus";
import { startDemandJob, getDemandJob } from "../services/demandJob.service";
import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  allPatients,
  inerPatient,
  inerDemand,
  updatePatientSistrat,
  PatientsByProfile,
  findPatient,
  admisionFormmByPatient,
  saveAdmissionForm,
  updateAF,
  saveAdmissionFormToSistrat,
  updateAlertsFromSistrat,
  updateBulkAlertsFromSistrat,
  updateFormCie10,
  demandByPatient,
  update,
  dataPatientByRut,
  updateActiveStatus,
  syncCodigoSistrat,
  activeSistratPatientsByCenter,
  resolveAlertFromSistrat
} from "../services/patient.service";
import { generatePatientReport } from "../services/patientReport.service";

const downloadPatientReport = async (req: Request, res: Response) => {
  try {
    const programs = typeof req.query.programs === "string"
      ? req.query.programs.split(",").map((value) => value.trim()).filter(Boolean)
      : [];
    const active = ["true", "false", "all"].includes(String(req.query.active))
      ? String(req.query.active) as "true" | "false" | "all"
      : "true";
    const sistratCenter = typeof req.query.sistratCenter === "string"
      ? req.query.sistratCenter.trim()
      : "";
    const includeWithoutCode = req.query.includeWithoutCode !== "false";

    const { buffer, total } = await generatePatientReport({
      programs,
      active,
      sistratCenter,
      includeWithoutCode,
    });
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="informe_pacientes_${date}.xlsx"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("X-Total-Records", total.toString());
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, X-Total-Records");
    res.send(buffer);
  } catch (error) {
    handleHttp(res, "ERROR_GENERATE_PATIENT_REPORT", error);
  }
};

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
    const { programs, active, careStatus } = req.query;
    if (careStatus !== undefined && !isCareStatus(careStatus)) {
      return res.status(400).json({ message: "Estado de atención inválido" });
    }

    // Asegúrate de que `programs` sea un array, incluso si se pasa un solo valor
    const programsArray = Array.isArray(programs) ? programs : [programs];
    const validProgramsArray = programsArray.filter((p): p is string => typeof p === "string");

    const activeFilter = typeof active === "string" ? active : undefined;
    const responseItems = await allPatients(validProgramsArray, activeFilter, isCareStatus(careStatus) ? careStatus : undefined);
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
  try {
    const job = await startDemandJob(body.patientId, body.alertsOnly === true, body.verifyOnly === true);
    response.status(202).json({ jobId: job._id, job, message: 'Registro iniciado' });
  } catch (error: any) {
    response.status(400).json({ error: error.message || 'No se pudo iniciar el registro' });
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
    res.status(200).json({ success: true, patient: responseAdmissionForm, message: "Ficha de ingreso actualizada con éxito" });
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
    const { rut, center } = req.params;
    if (!rut || !center) {
      return res.status(400).json({ success: false, message: "Los parámetros rut y center son requeridos" });
    }

    const data = await dataPatientByRut(rut, center);
    if (!data || (!data.name && !data.surname)) {
      return res
        .status(404)
        .json({ success: false, message: "No se encontró demanda asociada al RUT y centro proporcionados" });
    }

    res.status(200).json({ success: true, message: "Demanda recuperada con éxito", data });
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes("SISTRAT_CONNECTION_ERROR")) {
      return res.status(503).json({ success: false, message: errorMsg });
    }
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};




import {
  createSistratJob,
  findActiveSistratJob,
  completeSistratJob,
  failSistratJob,
  getSistratJobById,
  cancelSistratJob,
} from "../services/sistratJob.service";
import { SistratJobType } from "../interfaces/sistratJob.interface";

const postAdmissionFormSistrat = async ({ body }: Request, res: Response) => {
  const { patientId } = body;
  if (!patientId) {
    return res.status(400).json({ success: false, message: "Usuario no existe para registrar ficha de ingreso en SISTRAT" });
  }
  try {
    // 1. Verificar si ya existe una tarea activa en ejecución para este paciente
    const activeJob = await findActiveSistratJob(patientId, "ficha-ingreso");
    if (activeJob) {
      return res.status(200).json({
        success: true,
        jobId: activeJob._id,
        status: activeJob.status,
        step: activeJob.step,
        progress: activeJob.progress,
        message: "Ya hay un registro en proceso para este paciente.",
      });
    }

    // 2. Crear nueva tarea en BD con estado PENDING
    const job = await createSistratJob(patientId, "ficha-ingreso");
    const jobIdStr = String(job._id);

    // 3. Responder de inmediato con HTTP 202 (Accepted)
    res.status(202).json({
      success: true,
      jobId: jobIdStr,
      status: "PENDING",
      message: "Registro iniciado en segundo plano.",
    });

    // 4. Ejecutar el proceso Puppeteer en segundo plano (asíncrono, no bloqueante)
    (async () => {
      try {
        const responseAdmissionForm = await saveAdmissionFormToSistrat(patientId, jobIdStr);
        if (responseAdmissionForm) {
          await completeSistratJob(jobIdStr, { message: "Ficha de ingreso registrada exitosamente en SISTRAT" });
        } else {
          await failSistratJob(jobIdStr, "No fue posible el registro en SISTRAT");
        }
      } catch (error: any) {
        let errorMessage = error.message || "Error desconocido al registrar en SISTRAT";
        const match = errorMessage.match(/Error: (.+)$/);
        if (match) {
          errorMessage = match[1];
        }
        if (errorMessage.includes("SISTRAT_ALERT_ERROR:")) {
          errorMessage = errorMessage.split("SISTRAT_ALERT_ERROR:")[1].trim();
        }
        await failSistratJob(jobIdStr, errorMessage);
      }
    })();

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error interno al iniciar tarea de SISTRAT" });
  }
};

const getSistratJobStatusController = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ success: false, message: "jobId es requerido" });
    }
    let job = await getSistratJobById(jobId);
    if (job?.type === "demanda") { await getDemandJob(String(job.patientId)); job = await getSistratJobById(jobId); }
    if (!job) {
      return res.status(404).json({ success: false, message: "Tarea no encontrada" });
    }
    res.status(200).json({ success: true, job });
  } catch (error: any) {
    handleHttp(res, "ERROR_GET_JOB_STATUS", error);
  }
};

const getActiveSistratJobController = async (req: Request, res: Response) => {
  try {
    const { patientId, type } = req.params;
    if (!patientId || !type) {
      return res.status(400).json({ success: false, message: "patientId y type son requeridos" });
    }
    const job = type === 'demanda' ? await getDemandJob(patientId) : await findActiveSistratJob(patientId, type as SistratJobType);
    res.status(200).json({ success: true, job });
  } catch (error: any) {
    handleHttp(res, "ERROR_GET_ACTIVE_JOB", error);
  }
};

const cancelSistratJobController = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ success: false, message: "jobId es requerido" });
    }
    const existing = await getSistratJobById(jobId);
    if (existing?.type === 'demanda') return res.status(409).json({ message: 'El registro de demanda no puede cancelarse después de iniciado; espere su resultado.' });
    const job = await cancelSistratJob(jobId);
    res.status(200).json({ success: true, message: "Proceso cancelado exitosamente", job });
  } catch (error: any) {
    handleHttp(res, "ERROR_CANCEL_JOB", error);
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

const bulkUpdateAlerts = async (req: Request, res: Response) => {
  try {
    const { center, patientIds } = req.body;
    if (!center || !Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({ success: false, message: "Parámetros center y patientIds (array) son requeridos." });
    }
    
    console.log(`[bulkUpdateAlerts] Procesando ${patientIds.length} pacientes para el centro: ${center}`);
    
    const response = await updateBulkAlertsFromSistrat(center, patientIds);
    res.status(200).json(response);
  } catch (error) {
    handleHttp(res, "ERROR_BULK_UPDATE_ALERTS", error);
  }
};

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

const fetchCodigoSistrat = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patient = await syncCodigoSistrat(id);

    res.status(200).json({
      success: true,
      message: "Código SISTRAT sincronizado correctamente",
      patient,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo sincronizar el código";
    res.status(400).json({ success: false, message });
  }
};

const getActiveSistratPatients = async (req: Request, res: Response) => {
  try {
    const { center } = req.params;
    const forceRefresh = req.query.forceRefresh === "true";
    
    if (!center) {
      return res.status(400).json({ success: false, message: "El parámetro center es requerido" });
    }

    const result = await activeSistratPatientsByCenter(center, forceRefresh);
    res.status(200).json({ success: true, message: "Pacientes recuperados con éxito", ...result });
  } catch (error) {
    handleHttp(res, "ERROR_GET_SISTRAT_PATIENTS", error);
  }
};

const resolveAlertSistrat = async (req: Request, res: Response) => {
  try {
    const { patientId, alertType } = req.body;
    if (!patientId || !alertType) {
      return res.status(400).json({ success: false, message: "patientId y alertType son requeridos" });
    }
    
    const response = await resolveAlertFromSistrat(patientId, alertType);
    res.status(200).json({ success: true, message: "Alerta abierta con éxito" });
  } catch (error) {
    handleHttp(res, "ERROR_RESOLVE_ALERT", error);
  }
};

export {
  downloadPatientReport,
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
  bulkUpdateAlerts,
  formCie10,
  getDemand,
  getDataByRut,
  updatePatientActiveStatus,
  fetchCodigoSistrat,
  getActiveSistratPatients,
  resolveAlertSistrat,
  getSistratJobStatusController,
  getActiveSistratJobController,
  cancelSistratJobController,
};
