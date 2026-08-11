import { Request, Response, Router } from "express";
import { 
    getPdfMedicalRecordsByPatient,
    getPdfMedicalRecords,
    startExport,
    getExportProgress,
    downloadExport,
    } from "../controllers/medicalRecord.controller";

const router = Router();

router.get("/medical-records/:patientId", getPdfMedicalRecordsByPatient);
router.post("/medical-records/", getPdfMedicalRecords);

// Exportación asíncrona con progreso SSE
router.post("/export/start", startExport);
router.get("/export/progress/:jobId", getExportProgress);
router.get("/export/download/:jobId", downloadExport);

export { router };
