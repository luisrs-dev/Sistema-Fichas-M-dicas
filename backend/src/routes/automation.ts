import { Router } from "express";
import { triggerMassiveRegistration } from "../controllers/automation.controller";
import { checkJwt } from "../middleware/session";
import { authorizeRoles } from "../middleware/authRole";

const router = Router();

// Este endpoint es exclusivo de Administradores
router.post("/run-monthly", checkJwt, authorizeRoles(["admin"]), triggerMassiveRegistration);

export { router };
