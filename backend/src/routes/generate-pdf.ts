import { Request, Response, Router } from "express";
import { 
    getPdfMedicalRecordsByPatient,
    getPdfMedicalRecords
    } from "../controllers/medicalRecord.controller";

const router = Router();

router.get("/medical-records/:patientId", getPdfMedicalRecordsByPatient);
router.post("/medical-records/", getPdfMedicalRecords);
export { router };
