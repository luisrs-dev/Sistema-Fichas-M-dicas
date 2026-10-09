import { isValidObjectId } from 'mongoose';
import Job from '../models/historicalSyncJob.model';
import Patient from '../models/patient.model';
import Cache from '../models/sistratCache.model';
import { getCenterByName } from './sistratCenter.service';
import { fetchHistoricalCodes, normalizeHistoricalCode } from './historicalPatients.scraper';

const lease = () => new Date(Date.now() + 120000);
async function expire(center: string) {
  await Job.updateMany({ center, active: true, leaseUntil: { $lt: new Date() } }, { $set: {
    active: false, status: 'FAILED', error: 'Proceso interrumpido; puede repetir la sincronización.', completedAt: new Date(),
  } });
}
export async function latestHistoricalSync(center: string) {
  await expire(center);
  return Job.findOne({ center }).sort({ createdAt: -1, _id: -1 });
}
export async function getHistoricalSync(id: string) {
  if (!isValidObjectId(id)) throw new Error('Proceso inválido');
  const job = await Job.findById(id);
  if (!job) throw new Error('Proceso no encontrado');
  await expire(job.center);
  return Job.findById(id);
}
export async function startHistoricalSync(center: string, requestedBy: string) {
  const config = await getCenterByName(center);
  if (!config?.active) throw new Error('Centro inexistente o inactivo');
  center = config.name;
  await Job.init();
  await expire(center);
  const current = await Job.findOne({ center, active: true });
  if (current) return current;
  let job;
  try { job = await Job.create({ center, requestedBy, leaseUntil: lease() }); }
  catch (error: any) {
    if (error.code !== 11000) throw error;
    return Job.findOne({ center, active: true });
  }
  void executeHistoricalSync(String(job._id), center).catch(error => console.error('Error al finalizar sincronización histórica', error));
  return job;
}

export async function executeHistoricalSync(jobId: string, center: string) {
  const result = { total: 0, updated: [] as string[], alreadyHistorical: [] as string[], notFound: [] as string[], ambiguous: [] as string[], errors: [] as string[] };
  const heartbeat = setInterval(() => {
    void Job.updateOne({ _id: jobId, active: true }, { $set: { leaseUntil: lease() } }).catch(() => {});
  }, 15000);
  const report = async (step: string, progress: number) => {
    const saved = await Job.updateOne({ _id: jobId, active: true }, { $set: { step, progress, status: 'IN_PROGRESS', leaseUntil: lease(), result } });
    if (!saved.matchedCount) throw new Error('La tarea ya no está activa');
  };
  try {
    const codes = await fetchHistoricalCodes(center, report);
    result.total = codes.length;
    const patients = await Patient.find({ sistratCenter: center }).select('_id codigoSistrat careStatus').lean();
    const byCode = new Map<string, typeof patients>();
    for (const patient of patients) {
      const code = normalizeHistoricalCode(patient.codigoSistrat || '');
      if (code) byCode.set(code, [...(byCode.get(code) || []), patient]);
    }
    for (const [index, code] of codes.entries()) {
      await report(`Comparando paciente ${index + 1} de ${codes.length}`, 40 + Math.floor(55 * index / codes.length));
      const matches = byCode.get(code) || [];
      if (!matches.length) result.notFound.push(code);
      else if (matches.length > 1) result.ambiguous.push(code);
      else if (matches[0].careStatus === 'discharged') result.alreadyHistorical.push(code);
      else {
        try {
          const updated = await Patient.updateOne({ _id: matches[0]._id, sistratCenter: center, codigoSistrat: matches[0].codigoSistrat, careStatus: { $ne: 'discharged' } }, { $set: {
            careStatus: 'discharged', historicalSync: { source: 'sistrat', syncedAt: new Date(), jobId },
          } });
          if (updated.modifiedCount) result.updated.push(code);
          else result.errors.push(code);
        } catch { result.errors.push(code); }
      }
    }
    await report('Actualizando caché de pacientes', 97);
    await Cache.deleteOne({ center });
    await Job.updateOne({ _id: jobId, active: true }, { $set: { active: false, status: 'COMPLETED', step: 'Sincronización finalizada', progress: 100, result, completedAt: new Date() } });
  } catch (error: any) {
    await Job.updateOne({ _id: jobId, active: true }, { $set: { active: false, status: 'FAILED', step: 'Sincronización incompleta', error: error.message || 'No se pudo completar la sincronización', result, completedAt: new Date() } });
  } finally { clearInterval(heartbeat); }
}
