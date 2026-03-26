import { Router } from "express";
import { getSocialForm, saveSocialForm, syncSocialToSistrat } from "../controllers/socialForm.controller";

const router = Router();

router.get("/:patientId", getSocialForm);
router.post("/:patientId", saveSocialForm);
router.post("/sync/:patientId", syncSocialToSistrat);

export { router };
