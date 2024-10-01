import { Request, Response, Router } from "express";
import {
  getUsers,
  postUser,
  putUser,
  getUsersByProfile,
  getUsersById,
  getServicesByProfile
} from "../controllers/user.controller";
// import { logMiddleware } from "../middleware/log";
const router = Router();

router.get("/", getUsers);
router.get("/profile/:profile", getUsersByProfile);
router.get("/:id", getUsersById);
router.get("/services/:id", getServicesByProfile);
// router.get("/", logMiddleware, getItems);
// router.get("/:id", getItem);
router.put("/", putUser);
router.post("/", postUser);

export { router };
