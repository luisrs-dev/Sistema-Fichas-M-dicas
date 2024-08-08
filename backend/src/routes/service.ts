import { Request, Response, Router } from "express";
import {
  getServices,
  postService
} from "../controllers/service.controller";
const router = Router();

router.get("", getServices);
router.post("/", postService);
export { router };
