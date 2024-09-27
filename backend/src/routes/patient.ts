import { Router } from "express";
import {
  getPatients,
  getPatientsById,
  getPatientsByProfile,
  postDemand,
  postDemandToSistrat,
  postPatient,
  postPatientSistrat,
  //recordPatientSistrat,
  postAdmissionForm,
  postAdmissionFormSistrat,
  updateAlerts,
  formCie10
} from "../controllers/patient.controller";
// import { logMiddleware } from "../middleware/log";
const router = Router();

router.get("/", getPatients);
router.get("/profile/:profile", getPatientsByProfile);
router.get("/:id", getPatientsById);
router.post("/", postPatient);
router.post("/demanda", postDemand);
router.post("/demanda/sistrat", postDemandToSistrat);
router.post("/ficha-ingreso", postAdmissionForm);
router.post("/ficha-ingreso/sistrat", postAdmissionFormSistrat);
router.post("/sistrat", postPatientSistrat);
router.post("/sistrat/alerts", updateAlerts);
router.post("/sistrat/formCie10", formCie10);


//router.post("/sistrat/record", recordPatientSistrat);

export { router };

