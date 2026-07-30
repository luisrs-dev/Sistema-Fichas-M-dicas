import SistratJobModel from "../models/sistratJob.model";
import { SistratJob, SistratJobType } from "../interfaces/sistratJob.interface";

export const createSistratJob = async (patientId: string, type: SistratJobType): Promise<SistratJob> => {
  // Si ya existe un trabajo activo (PENDING o IN_PROGRESS) para este paciente y tipo, se retorna ese
  const activeJob = await findActiveSistratJob(patientId, type);
  if (activeJob) {
    return activeJob;
  }

  const newJob = await SistratJobModel.create({
    patientId,
    type,
    status: "PENDING",
    step: "Tarea iniciada",
    progress: 5,
    startedAt: new Date(),
  });

  return newJob;
};

export const findActiveSistratJob = async (patientId: string, type: SistratJobType): Promise<SistratJob | null> => {
  return SistratJobModel.findOne({
    patientId,
    type,
    status: { $in: ["PENDING", "IN_PROGRESS"] },
  });
};

const activeJobCancelHandlers = new Map<string, () => Promise<void>>();

export const registerJobCancelHandler = (jobId: string, handler: () => Promise<void>): void => {
  activeJobCancelHandlers.set(jobId, handler);
};

export const unregisterJobCancelHandler = (jobId: string): void => {
  activeJobCancelHandlers.delete(jobId);
};

export const cancelSistratJob = async (jobId: string): Promise<SistratJob | null> => {
  const handler = activeJobCancelHandlers.get(jobId);
  if (handler) {
    try {
      console.log(`[cancelSistratJob] Ejecutando handler de cancelación para jobId: ${jobId}`);
      await handler();
    } catch (e) {
      console.error(`[cancelSistratJob] Error ejecutando handler de cancelación para ${jobId}:`, e);
    }
    activeJobCancelHandlers.delete(jobId);
  }

  return failSistratJob(jobId, "Proceso cancelado por el usuario");
};

export const updateSistratJobStep = async (jobId: string, step: string, progress?: number): Promise<SistratJob | null> => {
  // Verificar si la tarea fue cancelada por el usuario
  const currentJob = await SistratJobModel.findById(jobId);
  if (currentJob && currentJob.status === "FAILED" && currentJob.error?.includes("cancelado")) {
    throw new Error("JOB_CANCELLED_BY_USER");
  }

  const updateData: Record<string, any> = {
    status: "IN_PROGRESS",
    step,
  };

  if (typeof progress === "number") {
    updateData.progress = Math.min(Math.max(progress, 0), 100);
  }

  return SistratJobModel.findByIdAndUpdate(jobId, { $set: updateData }, { new: true });
};

export const completeSistratJob = async (jobId: string, result: Record<string, any> = {}): Promise<SistratJob | null> => {
  return SistratJobModel.findByIdAndUpdate(
    jobId,
    {
      $set: {
        status: "COMPLETED",
        step: "Proceso completado exitosamente",
        progress: 100,
        result,
        completedAt: new Date(),
      },
    },
    { new: true }
  );
};

export const failSistratJob = async (jobId: string, errorMessage: string): Promise<SistratJob | null> => {
  return SistratJobModel.findByIdAndUpdate(
    jobId,
    {
      $set: {
        status: "FAILED",
        step: `Error: ${errorMessage}`,
        error: errorMessage,
        completedAt: new Date(),
      },
    },
    { new: true }
  );
};

export const getSistratJobById = async (jobId: string): Promise<SistratJob | null> => {
  return SistratJobModel.findById(jobId);
};
