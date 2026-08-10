import { Router } from "express";
import { getProxyUsageReportController } from "../controllers/proxyUsageLog.controller";

const router = Router();

router.get("/report", getProxyUsageReportController);

export { router };
