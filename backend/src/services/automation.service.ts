import cron from 'node-cron';
import { activeSistratPatientsByCenter } from './patient.service';
import Sistrat from './sistrat/sistrat.class';
import PatientModel from '../models/patient.model';

export const runMonthlyMassiveRegistration = async (month?: number, year?: number) => {
  console.log(`[Automation] Iniciando registro mensual masivo...`);
  try {
    // Si no se proveen meses o años, se asume el mes inmediatamente anterior.
    const now = new Date();
    const targetMonth = month || (now.getMonth() === 0 ? 12 : now.getMonth());
    const targetYear = year || (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());

    console.log(`[Automation] Mes Objetivo: ${targetMonth}, Año Objetivo: ${targetYear}`);

    // Extraer centros Sistrat únicos de todos los pacientes activos
    const centers = await PatientModel.distinct('sistratCenter', { active: { $ne: false }, sistratCenter: { $ne: null } });
    console.log(`[Automation] Centros encontrados a recorrer:`, centers);

    const sistrat = new Sistrat();
    const globalResults = [];

    for (const center of) {
      if (!center) continue;
      console.log(`\n\n---------------------------------------------------------`);
      console.log(`[Automation] Inicializando procesamiento del centro: ${center}`);

      try {
        // Traeremos los pacientes como si usaramos la opción Masiva del dashboard
        const response: any = await activeSistratPatientsByCenter(center);
        const patientsInSistrat = response || [];

        // Nos importan solo los que están registrados en Mongo (en local) y tienen codigo
        const validPatients = patientsInSistrat.filter((p: any) => p.mongoId && p.codigoSistrat);
        console.log(`[Automation] En el centro ${center} existen ${validPatients.length} pacientes locales con código a procesar.`);

        if (validPatients.length > 0) {
          // Ejecutamos el método secuencial interno con una única instancia de browser por centro
          const result = await sistrat.recordMonthlySheetBulk(center, validPatients, targetMonth, targetYear);
          globalResults.push({ center, result });
        } else {
          globalResults.push({ center, result: { message: "Sin pacientes activos emparejados localmente" } });
        }
      } catch (err) {
        console.error(`[Automation] Error en recolecta del centro ${center}:`, err);
        globalResults.push({ center, result: { error: String(err) } });
      }
    }

    console.log(`\n\n[Automation] Resumen Global del Proceso de Registro:`, JSON.stringify(globalResults, null, 2));
    return globalResults;

  } catch (error) {
    console.error(`[Automation] Error crítico corriendo masa automatizada global:`, error);
  }
};

export const initCronJobs = () => {
  // Configuración de Cron: "0 2 1 * *" significa correr el minuto 0 de la hora 2 en el día 1 de cada mes.
  // Es decir, al primer día del nuevo mes a las 02:00 AM, registrará todas las atenciones del mes que acaba de cerrar.
  cron.schedule('0 2 1 * *', async () => {
    console.log(`[CronJob] Disparador automático intermensual activado (0 2 1 * *).`);
    await runMonthlyMassiveRegistration();
  }, {
    timezone: "America/Santiago"
  });
  console.log(`[CronJob] Tarea mensual masiva de Sistrat programada correctamente (día 1 de cada mes a las 02:00 AM).`);
};
