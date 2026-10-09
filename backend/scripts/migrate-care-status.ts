import 'dotenv/config';
import mongoose from 'mongoose';
import PatientModel from '../src/models/patient.model';
import AdmissionFormModel from '../src/models/admissionForm.model';
import DemandModel from '../src/models/demand.model';
import { resolveCareStatus, hasIntegratedDemand } from '../src/utils/careStatus';

// Ejecutar desde backend. Simulación por defecto; --apply persiste sólo casos claros.
async function main() {
  if (!process.env.DB_URI) throw new Error('Falta DB_URI');
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.DB_URI, { autoIndex: false, serverSelectionTimeoutMS: 5000 });
  try {
    const [patients, admissions, demands] = await Promise.all([
      PatientModel.find().select('_id careStatus active registeredAdmissionForm registeredDemand registeredOnFiclin atentionRequestDate mainSubstance previousTreatments typeContact whoRequest whoDerives').lean(),
      AdmissionFormModel.find().select('patientId').lean(),
      DemandModel.find().select('patientId').lean(),
    ]);
    const admissionIds = new Set(admissions.map(f => String(f.patientId)));
    const demandIds = new Set(demands.map(f => String(f.patientId)));
    const counts = { waiting: 0, active: 0, discharged: 0, review: 0, updated: 0 };
    for (const patient of patients) {
      const hasAdmission = admissionIds.has(String(patient._id));
      const integratedDemand = hasIntegratedDemand(patient);
      const hasDemand = demandIds.has(String(patient._id)) || integratedDemand;
      const status = resolveCareStatus(patient.careStatus, hasAdmission, hasDemand);
      const reasons: string[] = [];
      if (!status) reasons.push('Sin documentos suficientes para clasificar');
      if (!!patient.registeredAdmissionForm !== hasAdmission) reasons.push('Indicador de ingreso no coincide con sus documentos');
      if (!integratedDemand && !!patient.registeredDemand !== hasDemand) reasons.push('Indicador de demanda no coincide con sus documentos');
      if (patient.active === false) reasons.push('Inactivo manual: no demuestra egreso');
      if (reasons.length) {
        counts.review++;
        console.log(JSON.stringify({ patientId: patient._id, proposedStatus: status, review: reasons }));
      }
      if (status) counts[status]++;
      if (apply && status && !reasons.length && status !== patient.careStatus) {
        // Evitar sobrescribir una transición realizada después de leer el paciente.
        const result = await PatientModel.updateOne(
          { _id: patient._id, careStatus: patient.careStatus ?? null },
          { $set: { careStatus: status } }
        );
        counts.updated += result.modifiedCount;
      }
    }
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', total: patients.length, counts }));
  } finally {
    await mongoose.disconnect();
  }
}
main().catch(() => {
  console.error('No se pudo completar la migración. Revise la conexión y configuración de MongoDB.');
  process.exitCode = 1;
});
