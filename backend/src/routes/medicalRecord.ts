import { Request, Response, Router } from "express";
import * as attentionBatches from '../controllers/attentionBatchJob.controller';
import { checkAdmin } from '../middleware/checkJwt';
import {
  getMedicalRecords,
  getAllMedicalRecordsByUser,
  postMedicalRecord,
  postMedicalRecordPerMonth,
  medicalRecordsByMonth,
  deleteMedicalRecords,
  updateMedicalRecords,
  groupedMedicalRecordsByPatient,
  postMedicalRecordPerMonthBulk,
  getMonthlyLogs,
  getMonthlyLogContent,
  testBulkEmail,
} from "../controllers/medicalRecord.controller";
// import { logMiddleware } from "../middleware/log";
const router = Router();

router.get("/", getMedicalRecords);
router.put("/:id", updateMedicalRecords);
router.delete("/:id", deleteMedicalRecords);
router.get("/grouped/:patientId/:year/:month", groupedMedicalRecordsByPatient);
router.get("/:userId", getAllMedicalRecordsByUser);
router.post("/", postMedicalRecord);
router.post("/ monthRecords/bulk/test-email", testBulkEmail);
router.post("/monthRecords/bulk-center", checkAdmin, attentionBatches.start);
router.get('/monthRecords/bulk-jobs/center/:center', checkAdmin, attentionBatches.latest);
router.get('/monthRecords/bulk-jobs/:id', checkAdmin, attentionBatches.status);
router.post("/monthRecords/bulk", postMedicalRecordPerMonthBulk);
router.post("/monthRecords/:patientId", postMedicalRecordPerMonth);
router.get("/monthRecords/logs", getMonthlyLogs);
router.get("/monthRecords/logs/:fileName", getMonthlyLogContent);
router.get("/:year/:month", medicalRecordsByMonth);
// router.delete("/:id", deleteItem);
// router.put("/:id", updateItem);

// router.get("/items", (req: Request, res: Response) => {
//   res.send({ data: "Aqui van los Items" });
// });
export { router };
