import { isValidObjectId } from 'mongoose';
import { hostname } from 'os';
import Job from '../models/attentionBatchJob.model';
import Patient from '../models/patient.model';
import { getCenterByName } from './sistratCenter.service';
import { postMedicalRecordsBulkSistrat } from './medicalRecord.service';
import { getEnvironmentConfigValue } from './environmentConfig.service';

async function recoverInterrupted() {
  const active = await Job.findOne({ active: true });
  if (!active || active.ownerHost !== hostname()) return;
  // No recuperar por timeout: un lote lento puede seguir guardando en SISTRAT.
  try { process.kill(active.ownerPid, 0); return; }
  catch (error: any) { if (error.code !== 'ESRCH') return; }
  await Job.updateOne({ _id: active._id, active: true }, { $set: {
    active: false, status: 'FAILED', completedAt: new Date(),
    error: 'Proceso interrumpido. Verifica los registros en SISTRAT antes de iniciar otro envío.',
    step: 'Proceso interrumpido',
  } });
}

export async function latestAttentionBatch(center: string) {
  await recoverInterrupted();
  return Job.findOne({ center }).sort({ createdAt: -1, _id: -1 });
}
export async function getAttentionBatch(id: string) {
  if (!isValidObjectId(id)) throw new Error('Proceso inválido');
  await recoverInterrupted();
  const job = await Job.findById(id);
  if (!job) throw new Error('Proceso no encontrado');
  return job;
}
export async function startAttentionBatch(center: string, ids: string[], month: number, year: number, batchSize = 10, pauseSeconds = 5) {
  if (!Array.isArray(ids) || !ids.length || ids.some(id => typeof id !== 'string' || !isValidObjectId(id)))
    throw new Error('Selecciona pacientes válidos');
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 9999)
    throw new Error('Período inválido');
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100 || !Number.isFinite(pauseSeconds) || pauseSeconds < 0 || pauseSeconds > 300)
    throw new Error('Configuración de lotes inválida');
  const config = await getCenterByName(center);
  if (!config?.active) throw new Error('Centro inexistente o inactivo');
  if (!config.usuario || !config.password) throw new Error('El centro no tiene credenciales SISTRAT');
  if (await getEnvironmentConfigValue('sistrat-direct-record-massive') !== true)
    throw new Error('Habilita el guardado automático de atenciones antes de iniciar');
  const patientIds = [...new Set(ids)];
  const count = await Patient.countDocuments({ _id: { $in: patientIds }, sistratCenter: center });
  if (count !== patientIds.length) throw new Error('Hay pacientes inexistentes o de otro centro');
  await Job.init();
  // La exclusión debe funcionar también si autoIndex está deshabilitado.
  await Job.collection.createIndex({ slot: 1 }, { unique: true, partialFilterExpression: { active: true } });
  await recoverInterrupted();
  let job;
  try {
    job = await Job.create({ center, patientIds, month, year, batchSize, pauseSeconds,
      ownerHost: hostname(), ownerPid: process.pid, heartbeatAt: new Date() });
  } catch (error: any) {
    if (error.code !== 11000) throw error;
    const busy: any = new Error('Ya hay un registro masivo activo en el VPS. Espera a que termine.');
    busy.statusCode = 409;
    throw busy;
  }
  void execute(job).catch(error => console.error('No se pudo finalizar el registro masivo:', error.message));
  return job;
}

async function execute(job: any) {
  const heartbeat = setInterval(() => {
    void Job.updateOne({ _id: job._id, active: true }, { $set: { heartbeatAt: new Date() } }).catch(() => {});
  }, 15000);
  const results: any[] = [];
  try {
    await postMedicalRecordsBulkSistrat(job.center, job.patientIds, job.month, job.year, {
      batchSize: job.batchSize, pauseSeconds: job.pauseSeconds,
      beforeBatch: async (batch, total) => {
        if (await getEnvironmentConfigValue('sistrat-direct-record-massive') !== true)
          throw new Error('Se deshabilitó el guardado automático; proceso detenido');
        await Job.updateOne({ _id: job._id }, { $set: { status: 'IN_PROGRESS', currentBatch: batch,
          step: `Procesando lote ${batch} de ${total}`, heartbeatAt: new Date() } });
      },
      onBatch: async batchResults => {
        results.push(...batchResults);
        await Job.updateOne({ _id: job._id }, { $set: { results, processed: results.length } });
      },
    });
    const hasErrors = results.some(r => r.status === 'error');
    await Job.updateOne({ _id: job._id }, { $set: { active: false,
      status: hasErrors ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED', step: 'Registro finalizado', completedAt: new Date() } });
  } catch (error: any) {
    await Job.updateOne({ _id: job._id }, { $set: { active: false, status: 'FAILED',
      step: 'Registro incompleto', error: error.message, completedAt: new Date() } });
  } finally { clearInterval(heartbeat); }
}
