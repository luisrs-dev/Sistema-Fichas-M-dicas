import { Request, Response } from "express";
import { getAlertHistoryByPatient } from "../services/alertHistory.service";

const getAlertHistory = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const response = await getAlertHistoryByPatient(patientId);
    res.send(response);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

export { getAlertHistory };
