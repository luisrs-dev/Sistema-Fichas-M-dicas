import ProxyUsageLogModel from "../models/proxyUsageLog.model";
import UserModel from "../models/user.model";

export interface LogProxyUsageParams {
  bytesDownloaded: number;
  activity: string;
  userEmail?: string;
  userId?: string;
  userName?: string;
  sistratCenter?: string;
  patientId?: string;
}

export interface ProxyReportFilters {
  startDate?: string;
  endDate?: string;
  userEmail?: string;
  activity?: string;
  sistratCenter?: string;
  page?: number;
  limit?: number;
}

export const recordProxyUsage = async (params: LogProxyUsageParams) => {
  try {
    const bytes = Math.max(params.bytesDownloaded || 0, 0);
    const megabytes = parseFloat((bytes / (1024 * 1024)).toFixed(4));

    let userEmail = params.userEmail || "sistema";
    let userName = params.userName || "Sistema / Tarea Automática";
    let userId = params.userId || null;

    // Si viene solo el email, buscar el nombre del usuario
    if (userEmail && userEmail !== "sistema" && (!userName || userName.includes("Sistema"))) {
      const user = await UserModel.findOne({ email: userEmail.toLowerCase().trim() });
      if (user) {
        userName = user.name;
        userId = user._id.toString();
      }
    }

    const logEntry = await ProxyUsageLogModel.create({
      userId,
      userEmail,
      userName,
      activity: params.activity,
      sistratCenter: params.sistratCenter || null,
      patientId: params.patientId || null,
      bytesDownloaded: bytes,
      megabytes,
      timestamp: new Date(),
    });

    console.log(`[ProxyUsageLog] Registrado: ${params.activity} | ${userEmail} | ${megabytes} MB`);
    return logEntry;
  } catch (error) {
    console.error("[ProxyUsageLog] Error al registrar consumo de proxy:", error);
    return null;
  }
};

export const getProxyUsageReport = async (filters: ProxyReportFilters) => {
  try {
    const query: Record<string, any> = {};

    // Filtrar por rango de fechas
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        // Inicio del día en UTC/Local
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        query.timestamp.$gte = start;
      }
      if (filters.endDate) {
        // Fin del día (23:59:59.999)
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    if (filters.userEmail) {
      query.userEmail = filters.userEmail.toLowerCase().trim();
    }

    if (filters.activity) {
      query.activity = filters.activity;
    }

    if (filters.sistratCenter) {
      query.sistratCenter = filters.sistratCenter;
    }

    // 1. Métricas Totales
    const totalStats = await ProxyUsageLogModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalBytes: { $sum: "$bytesDownloaded" },
          totalMB: { $sum: "$megabytes" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalMB = totalStats.length > 0 ? parseFloat(totalStats[0].totalMB.toFixed(2)) : 0;
    const totalCount = totalStats.length > 0 ? totalStats[0].count : 0;
    const avgMBPerRequest = totalCount > 0 ? parseFloat((totalMB / totalCount).toFixed(3)) : 0;

    // 2. Desglose por Usuario
    const byUser = await ProxyUsageLogModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: { email: "$userEmail", name: "$userName" },
          totalMB: { $sum: "$megabytes" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalMB: -1 } },
      {
        $project: {
          _id: 0,
          userEmail: "$_id.email",
          userName: "$_id.name",
          totalMB: { $round: ["$totalMB", 2] },
          count: "$count",
        },
      },
    ]);

    // 3. Desglose por Actividad
    const byActivity = await ProxyUsageLogModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$activity",
          totalMB: { $sum: "$megabytes" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalMB: -1 } },
      {
        $project: {
          _id: 0,
          activity: "$_id",
          totalMB: { $round: ["$totalMB", 2] },
          count: "$count",
        },
      },
    ]);

    // 4. Paginación de Registros Detallados
    const page = Math.max(filters.page || 1, 1);
    const limit = Math.max(filters.limit || 50, 1);
    const skip = (page - 1) * limit;

    const logs = await ProxyUsageLogModel.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      summary: {
        totalMB,
        totalCount,
        avgMBPerRequest,
        topUser: byUser.length > 0 ? byUser[0].userName : "N/A",
        topActivity: byActivity.length > 0 ? byActivity[0].activity : "N/A",
      },
      byUser,
      byActivity,
      logs,
      pagination: {
        page,
        limit,
        totalLogs: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  } catch (error) {
    console.error("[ProxyUsageLog] Error al generar reporte de consumo:", error);
    throw error;
  }
};
