import { Request, Response, Router } from "express";
import {
  getProfesionalRoles,
  postProfesionalRole
} from "../controllers/profesionalRole.controller";
const router = Router();

router.get("", getProfesionalRoles);
router.post("/", postProfesionalRole);
export { router };
