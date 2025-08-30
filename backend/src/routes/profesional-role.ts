import { Request, Response, Router } from "express";
import {
  getProfesionalRoles,
  postProfesionalRole,
  getProfesionalRoleById,
  putProfesionalRole
} from "../controllers/profesionalRole.controller";
const router = Router();

router.get("", getProfesionalRoles);
router.get("/:id", getProfesionalRoleById);
router.post("/", postProfesionalRole);
router.put("/", putProfesionalRole);
export { router };
