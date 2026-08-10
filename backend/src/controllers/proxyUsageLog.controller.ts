import { Request, Response } from "express";
import { getProxyUsageReport } from "../services/proxyUsageLog.service";

export const getProxyUsageReportController = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userEmail, activity, sistratCenter, page, limit } = req.query;

    const report = await getProxyUsageReport({
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      userEmail: userEmail ? String(userEmail) : undefined,
      activity: activity ? String(activity) : undefined,
      sistratCenter: sistratCenter ? String(sistratCenter) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 50,
    });

    res.status(200).json(report);
  } catch (error: any) {
    console.error("Error en getProxyUsageReportController:", error);
    res.status(500).json({ error: error.message || "Error al obtener reporte de consumo de proxy" });
  }
};
