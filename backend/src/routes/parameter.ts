import { Request, Response, Router } from "express";
import {
  getPermissions,
  getPrograms,
  postPermission,
  postProgram
} from "../controllers/parameter.controller";
const router = Router();

router.get("/permission", getPermissions);
router.post("/permission", postPermission);
router.get("/program", getPrograms);
router.post("/program", postProgram);
export { router };
