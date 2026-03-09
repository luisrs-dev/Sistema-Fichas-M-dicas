import { Router } from "express";
import {
  getSystemStatusController,
  getSystemStatusHistoryController,
  updateSystemStatusController,
} from "../controllers/systemStatus.controller";

const router = Router();

router.get("/history", getSystemStatusHistoryController);
router.get("/", getSystemStatusController);
router.put("/", updateSystemStatusController);

export { router };