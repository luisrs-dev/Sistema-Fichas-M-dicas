import { Router } from "express";
import {
  getPatients,
  getPatientsById,
  getPatientsByProfile,
  postDemand,
  postDemandToSistrat,
  postPatient,
  updatePatient,
  postPatientSistrat,
  getAdmissionForm,
  postAdmissionForm,
  updateAdmissionForm,
  postAdmissionFormSistrat,
  updateAlerts,
  bulkUpdateAlerts,
  formCie10,
  getDemand,
  getDataByRut,
  updatePatientActiveStatus,
  fetchCodigoSistrat,
  getActiveSistratPatients,
  resolveAlertSistrat
} from "../controllers/patient.controller";
const router = Router();

router.get("/profile/:profile", getPatientsByProfile);

router.get("/demanda/:patientId", getDemand);
router.get("/rut/:rut/:center", getDataByRut);
router.post("/demanda", postDemand);
router.post("/demanda/sistrat", postDemandToSistrat);

router.get("/ficha-ingreso/:patientId", getAdmissionForm);
router.post("/ficha-ingreso", postAdmissionForm);
router.put("/ficha-ingreso", updateAdmissionForm);
router.post("/ficha-ingreso/sistrat", postAdmissionFormSistrat);
router.post("/sistrat", postPatientSistrat);
router.post("/sistrat/alerts", updateAlerts);
router.post("/sistrat/bulk-alerts", bulkUpdateAlerts);
router.post("/sistrat/formCie10", formCie10);
router.get("/sistrat/patients/:center", getActiveSistratPatients);
router.post("/sistrat/resolve-alert", resolveAlertSistrat);
router.get("/", getPatients);
router.get("/:id", getPatientsById);
router.post("/", postPatient);
router.patch("/:id/active", updatePatientActiveStatus);
router.put("/:id", updatePatient);

export { router };

