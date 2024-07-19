import { Request, Response, Router } from "express";
import {
  getMedicalRecords,
  getAllMedicalRecordsByUser,
  postMedicalRecord
} from "../controllers/medicalRecord.controller";
// import { logMiddleware } from "../middleware/log";
const router = Router();

router.get("/", getMedicalRecords);
// router.get("/", logMiddleware, getItems);
router.get("/:userId", getAllMedicalRecordsByUser );
router.post("/", postMedicalRecord);
// router.delete("/:id", deleteItem);
// router.put("/:id", updateItem);

// router.get("/items", (req: Request, res: Response) => {
//   res.send({ data: "Aqui van los Items" });
// });
export { router };
