import { Request, Response } from "express";
import { runMonthlyMassiveRegistration } from "../services/automation.service";
import { handleHttp } from "../utils/error.handle";

export const triggerMassiveRegistration = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.body;
    
    // Ejecutar en background (no esperamos a iterar todo para responder ok inicial)
    // Pero si quieren esperar, podemos usar await. Dado que es masivo y lento, 
    // lo enviamos a ejecutarse de forma paralela.
    
    runMonthlyMassiveRegistration(Number(month), Number(year))
      .then(result => console.log("[Automation Endpoint] Disparo manual finalizado.", result))
      .catch(err => console.error("[Automation Endpoint] Error en disparo manual:", err));

    res.status(200).json({ 
      success: true, 
      message: "El proceso de registro masivo ha sido inicializado en segundo plano exitosamente." 
    });

  } catch (error) {
    handleHttp(res, "ERROR_TRIGGER_AUTOMATION", error);
  }
};
