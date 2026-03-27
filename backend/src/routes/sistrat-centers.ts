import { Router } from "express";
import {
  createCenter,
  getCenters,
  getActiveCenters,
  updateCenter,
  deleteCenter,
} from "../controllers/sistratCenter.controller";

const router = Router();

router.post("/", createCenter);
router.get("/", getCenters);
router.get("/active", getActiveCenters);
router.put("/:id", updateCenter);
router.delete("/:id", deleteCenter);

export { router };
