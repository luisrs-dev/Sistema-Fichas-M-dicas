import { Request, Response } from "express";
import { createOrUpdateSocialForm, getSocialFormByPatient, syncSocialToSistratService } from "../services/socialForm.service";

const saveSocialForm = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const data = req.body;
    const response = await createOrUpdateSocialForm(patientId, data);
    res.send(response);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

const getSocialForm = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const response = await getSocialFormByPatient(patientId);
    res.send(response);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

const syncSocialToSistrat = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const response = await syncSocialToSistratService(patientId);
    res.send(response);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

export { saveSocialForm, getSocialForm, syncSocialToSistrat };
