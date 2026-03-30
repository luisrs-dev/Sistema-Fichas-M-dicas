import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { createOrUpdateSocialDiagnosisForm, getSocialDiagnosisFormByPatient, syncSocialDiagnosisToSistratService } from "../services/socialDiagnosisForm.service";

const getSocialDiagnosisForm = async ({ params }: Request, res: Response) => {
  const { patientId } = params;
  try {
    const result = await getSocialDiagnosisFormByPatient(patientId);
    res.status(200).json({ status: true, socialDiagnosisForm: result });
  } catch (error) {
    handleHttp(res, "ERROR_GET_SOCIAL_DIAGNOSIS_FORM", error);
  }
};

const postSocialDiagnosisForm = async ({ params, body }: Request, res: Response) => {
  const { patientId } = params;
  console.log(`[postSocialDiagnosisForm] patientId: ${patientId}`, body);
  try {
    const result = await createOrUpdateSocialDiagnosisForm(patientId, body);
    console.log(`[postSocialDiagnosisForm] OK result:`, result);
    res.status(200).json({
      status: true,
      message: result.updated ? "Diagnóstico Social actualizado" : "Diagnóstico Social guardado",
      ...result,
    });
  } catch (error) {
    console.error(`[postSocialDiagnosisForm] ERROR:`, error);
    handleHttp(res, "ERROR_POST_SOCIAL_DIAGNOSIS_FORM", error);
  }
};

const syncSistratSocialDiagnosis = async ({ params }: Request, res: Response) => {
  const { patientId } = params;
  try {
    const result = await syncSocialDiagnosisToSistratService(patientId);
    res.status(200).json({ status: true, message: "Sincronización de Diagnóstico Social completada.", ...result });
  } catch (error) {
    handleHttp(res, "ERROR_SYNC_SOCIAL_DIAGNOSIS_SISTRAT", error);
  }
};

export { getSocialDiagnosisForm, postSocialDiagnosisForm, syncSistratSocialDiagnosis };
