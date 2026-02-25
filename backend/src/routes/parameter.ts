import { Request, Response, Router } from "express";
import {
  getEnvironmentConfigs,
  getPermissions,
  getPrograms,
  postEnvironmentConfig,
  postPermission,
  postProgram
} from "../controllers/parameter.controller";
const router = Router();

router.get("/permission", getPermissions);
router.post("/permission", postPermission);
router.get("/program", getPrograms);
router.post("/program", postProgram);
router.get("/environment", getEnvironmentConfigs);
router.post("/environment", postEnvironmentConfig);
export { router };
