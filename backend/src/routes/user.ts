import { Request, Response, Router } from "express";
import {
  getUsers,
  postUser,
  getUsersByProfile,
  getUsersById
} from "../controllers/user.controller";
// import { logMiddleware } from "../middleware/log";
const router = Router();

router.get("/", getUsers);
router.get("/profile/:profile", getUsersByProfile);
router.get("/:id", getUsersById);
// router.get("/", logMiddleware, getItems);
// router.get("/:id", getItem);
router.post("/", postUser);
// router.delete("/:id", deleteItem);
// router.put("/:id", updateItem);

// router.get("/items", (req: Request, res: Response) => {
//   res.send({ data: "Aqui van los Items" });
// });
export { router };
