import { Request, Response, Router } from "express";
import { 
    getPdfMedicalRecordsByPatient 
    } from "../controllers/medicalRecord.controller";

const router = Router();

router.get("/medical-records/:patientId", getPdfMedicalRecordsByPatient);
export { router };
