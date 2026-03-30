import { Router } from "express";
import { getSocialDiagnosisForm, postSocialDiagnosisForm, syncSistratSocialDiagnosis } from "../controllers/socialDiagnosisForm.controller";

const router = Router();

router.get("/:patientId", getSocialDiagnosisForm);
router.post("/:patientId", postSocialDiagnosisForm);
router.post("/sync/:patientId", syncSistratSocialDiagnosis);

export { router };
