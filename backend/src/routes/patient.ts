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
  //recordPatientSistrat,
  getAdmissionForm,
  postAdmissionForm,
  updateAdmissionForm,
  postAdmissionFormSistrat,
  updateAlerts,
  formCie10,
  getDemand
} from "../controllers/patient.controller";
// import { logMiddleware } from "../middleware/log";
const router = Router();

router.get("/profile/:profile", getPatientsByProfile);

router.get("/demanda/:patientId", getDemand);
router.post("/demanda", postDemand);
router.post("/demanda/sistrat", postDemandToSistrat);

router.get("/ficha-ingreso/:patientId", getAdmissionForm);
router.post("/ficha-ingreso", postAdmissionForm);
router.put("/ficha-ingreso", updateAdmissionForm);
router.post("/ficha-ingreso/sistrat", postAdmissionFormSistrat);
router.post("/sistrat", postPatientSistrat);
router.post("/sistrat/alerts", updateAlerts);
router.post("/sistrat/formCie10", formCie10);
router.get("/", getPatients);
router.get("/:id", getPatientsById);
router.post("/", postPatient);
router.put("/:id", updatePatient);



//router.post("/sistrat/record", recordPatientSistrat);

export { router };

