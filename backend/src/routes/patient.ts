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
  postAdmissionForm
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
router.post("/sistrat", postPatientSistrat);
//router.post("/sistrat/record", recordPatientSistrat);

export { router };

