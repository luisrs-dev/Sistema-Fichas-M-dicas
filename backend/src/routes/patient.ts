import { Request, Response, Router } from "express";
import {
  getPatients,
  postPatient,
  postDemand,
  postPatientSistrat,
  recordPatientSistrat,
  getPatientsByProfile,
  getPatientsById
} from "../controllers/patient.controller";
// import { logMiddleware } from "../middleware/log";
const router = Router();

router.get("/", getPatients);
router.get("/profile/:profile", getPatientsByProfile);
router.get("/:id", getPatientsById);
// router.get("/", logMiddleware, getItems);
// router.get("/:id", getItem);
router.post("/", postPatient);
router.post("/demanda", postDemand);
router.post("/sistrat", postPatientSistrat);
router.post("/sistrat/record", recordPatientSistrat);
// router.delete("/:id", deleteItem);
// router.put("/:id", updateItem);

// router.get("/items", (req: Request, res: Response) => {
//   res.send({ data: "Aqui van los Items" });
// });
export { router };
