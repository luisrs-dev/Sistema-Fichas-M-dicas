import { isValidObjectId } from 'mongoose';
import SistratJobModel from '../models/sistratJob.model';
import PatientModel from '../models/patient.model';
import Sistrat from './sistrat/sistrat.class';

const lease = () => new Date(Date.now() + 90000);

export async function getDemandJob(patientId: string) {
  if (!isValidObjectId(patientId)) throw new Error('Paciente inválido');
  await SistratJobModel.updateMany({ patientId, type: 'demanda', activeDemand: true, leaseUntil: { $lt: new Date() } }, {
    $set: { activeDemand: false, status: 'FAILED', completedAt: new Date(),
      step: 'Proceso interrumpido', error: 'Se interrumpió el proceso. Verifique el registro en SISTRAT antes de volver a enviarlo.' }
  });
  return SistratJobModel.findOne({ patientId, type: 'demanda' }).sort({ createdAt: -1, _id: -1 });
}

export async function startDemandJob(patientId: string, alertsOnly = false, verifyOnly = false) {
  if (!isValidObjectId(patientId)) throw new Error('Paciente inválido');
  const patient = await PatientModel.findById(patientId);
  if (!patient) throw new Error('Paciente no encontrado');
  if (!patient.rut || !patient.sistratCenter) throw new Error('El paciente debe tener RUT y centro SISTRAT');
  // Ensure the unique index exists before accepting concurrent submissions.
  await SistratJobModel.init();
  const previous = await getDemandJob(patientId);
  if (previous?.activeDemand) return previous;
  if (verifyOnly && (!previous?.result?.submitted || previous?.status !== 'FAILED')) throw new Error('No hay un registro pendiente de verificación');
  if (alertsOnly && (previous?.status !== 'FAILED' || !previous?.result?.registered)) throw new Error('Debe verificar primero que la demanda esté registrada');
  if (!alertsOnly && !verifyOnly && (previous?.result?.submitted || previous?.status === 'COMPLETED')) {
    throw new Error('La demanda ya fue enviada. Verifique su estado en SISTRAT; no se reenviará automáticamente.');
  }
  let job;
  try {
    job = await SistratJobModel.create({ patientId, type: 'demanda', activeDemand: true,
      demandAttemptKey: `${patientId}:${previous?._id || 'first'}`,
      status: 'PENDING', step: 'Validando datos del paciente', progress: 0, leaseUntil: lease(),
      result: { submitted: alertsOnly || verifyOnly, registered: alertsOnly },
      history: [{ step: 'Validando datos del paciente', progress: 0, at: new Date() }] });
  } catch (error: any) {
    if (error.code !== 11000) throw error;
    return SistratJobModel.findOne({ patientId, type: 'demanda' }).sort({ createdAt: -1, _id: -1 });
  }
  void executeDemand(String(job._id), patient, alertsOnly, verifyOnly).catch(error => console.error('[DemandJob] No se pudo guardar el resultado', error));
  return job;
}

async function executeDemand(jobId: string, patient: any, alertsOnly: boolean, verifyOnly: boolean) {
  const heartbeat = setInterval(() => {
    void SistratJobModel.updateOne({ _id: jobId, activeDemand: true }, { $set: { leaseUntil: lease() } })
      .catch(error => console.error('[DemandJob] Error actualizando seguimiento', error));
  }, 15000);
  const report = async (step: string, progress: number, result: Record<string, any> = {}) => {
    const fields: Record<string, any> = { step, progress, status: 'IN_PROGRESS', leaseUntil: lease() };
    for (const [key, value] of Object.entries(result)) fields[`result.${key}`] = value;
    const saved = await SistratJobModel.updateOne({ _id: jobId, activeDemand: true }, {
      $set: fields, $push: { history: { step, progress, at: new Date() } }
    });
    if (!saved.matchedCount) throw new Error('La tarea ya no está activa');
  };
  try {
    const sistrat = new Sistrat();
    if (verifyOnly) {
      await sistrat.verifyDemand(patient, report);
    } else if (alertsOnly) {
      await report('Extrayendo y guardando alertas', 75);
      const updated = await sistrat.updateAlerts(patient);
      if (!updated || typeof updated === 'string') throw new Error('No se pudieron obtener las alertas');
      await report('Finalizando', 95);
    } else {
      await sistrat.crearDemanda(patient, report);
    }
    await SistratJobModel.updateOne({ _id: jobId, activeDemand: true }, { $set: {
      activeDemand: false, status: 'COMPLETED', progress: 100, step: 'Registro exitoso', completedAt: new Date(),
      'result.registered': true, 'result.alertsUpdated': true,
      'result.message': 'La demanda fue registrada en SISTRAT y sus alertas fueron actualizadas correctamente.'
    }, $push: { history: { step: 'Registro exitoso', progress: 100, at: new Date() } } });
  } catch (error: any) {
    await SistratJobModel.updateOne({ _id: jobId, activeDemand: true }, { $set: {
      activeDemand: false, status: 'FAILED', step: 'Sincronización incompleta',
      error: error.message || 'No se pudo completar el proceso', completedAt: new Date()
    } });
  } finally { clearInterval(heartbeat); }
}
