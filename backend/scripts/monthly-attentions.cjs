#!/usr/bin/env node
'use strict';

// Ejecutar mediante run-monthly-attentions.sh para adquirir el bloqueo del VPS.
const fs = require('node:fs');
const path = require('node:path');
const backend = path.resolve(__dirname, '..');

function parseArgs(args, now = new Date()) {
  const dateIndex = args.indexOf('--date');
  if (dateIndex !== -1) {
    const date = args[dateIndex + 1];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('--date requiere YYYY-MM-DD.');
    // Mediodía en Chile, evitando que UTC cambie el día de la fecha simulada.
    now = new Date(`${date}T15:00:00Z`);
    if (Number.isNaN(now.getTime()) || now.toISOString().slice(0, 10) !== date)
      throw new Error('Fecha simulada inválida.');
    if (!args.includes('--show-period') || args.includes('--execute'))
      throw new Error('--date solo se permite con --show-period y sin --execute.');
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago', day: 'numeric', month: 'numeric', year: 'numeric',
  }).formatToParts(now);
  const day = Number(parts.find(p => p.type === 'day').value);
  let month = Number(parts.find(p => p.type === 'month').value);
  let year = Number(parts.find(p => p.type === 'year').value);
  if (day === 1) {
    month--;
    if (month === 0) { month = 12; year--; }
  }
  const options = {
    execute: false, centers: [], batchSize: 10, pauseSeconds: 5,
    month, year, periodSource: day === 1 ? 'previous-month-day-1' : 'current-month',
  };
  let monthSet = false;
  let yearSet = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--execute') options.execute = true;
    else if (arg === '--show-period') options.showPeriod = true;
    else if (arg === '--date') { i++; }
    else if (arg === '--help') options.help = true;
    else if (['--center', '--month', '--year', '--batch-size', '--pause-seconds'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Falta valor para ${arg}`);
      if (arg === '--center') options.centers.push(value);
      if (arg === '--month') { options.month = Number(value); monthSet = true; }
      if (arg === '--year') { options.year = Number(value); yearSet = true; }
      if (arg === '--batch-size') options.batchSize = Number(value);
      if (arg === '--pause-seconds') options.pauseSeconds = Number(value);
    } else throw new Error(`Opción desconocida: ${arg}`);
  }
  if (monthSet !== yearSet) throw new Error('Indica --month y --year juntos.');
  if (monthSet) options.periodSource = 'explicit';
  if (options.showPeriod && options.execute) throw new Error('--show-period no permite --execute.');
  if (!Number.isInteger(options.month) || options.month < 1 || options.month > 12)
    throw new Error('El mes debe estar entre 1 y 12.');
  if (!Number.isInteger(options.year) || options.year < 2000 || options.year > 9999)
    throw new Error('Año inválido.');
  if (!Number.isInteger(options.batchSize) || options.batchSize < 1 || options.batchSize > 100)
    throw new Error('--batch-size debe ser un entero entre 1 y 100.');
  if (!Number.isFinite(options.pauseSeconds) || options.pauseSeconds < 0 || options.pauseSeconds > 300)
    throw new Error('--pause-seconds debe estar entre 0 y 300.');
  options.centers = [...new Set(options.centers)];
  return options;
}

async function processCenters(centers, options, deps, save) {
  const summary = { startedAt: new Date().toISOString(), mode: options.execute ? 'execute' : 'dry-run',
    month: options.month, year: options.year, periodSource: options.periodSource,
    batchSize: options.batchSize, pauseSeconds: options.pauseSeconds, centers: [], failed: false };
  await save(summary);
  for (const center of centers) {
    const entry = { center: center.name, startedAt: new Date().toISOString(), patients: 0, eligible: 0, batchesCompleted: 0, results: [] };
    summary.centers.push(entry);
    try {
      const patients = await deps.getPatients(center.name);
      entry.patients = patients.length;
      if (options.execute && deps.submitCenter && patients.length) {
        entry.results = await deps.submitCenter(center.name, patients.map(p => String(p._id)), options.month, options.year, async job => {
          entry.jobId = String(job._id);
          entry.results = job.results;
          entry.eligible = job.results.filter(result => result.status !== 'warning').length;
          entry.batchesCompleted = Math.ceil(job.processed / options.batchSize);
          await save(summary);
        });
      } else {
        for (let offset = 0; offset < patients.length; offset += options.batchSize) {
          const ids = patients.slice(offset, offset + options.batchSize).map(patient => String(patient._id));
          console.log(`[${center.name}] Lote ${entry.batchesCompleted + 1}: ${ids.length} pacientes`);
          if (options.execute) {
            // El servicio consulta y agrupa una sola vez, solo para este lote.
            // Cierra el navegador al terminar; el siguiente lote empieza con uno nuevo.
            const results = await deps.submit(center.name, ids, options.month, options.year);
            entry.results.push(...results);
            entry.eligible += results.filter(result => result.status !== 'warning').length;
            if (results.some(result => result.status !== 'success' && result.status !== 'warning'))
              summary.failed = true;
          } else {
            // Revisión sin abrir navegador ni enviar; consultas secuenciales.
            for (const id of ids) {
              const records = await deps.getRecords(id, options.month, options.year);
              if (records.length) entry.eligible++;
            }
          }
          entry.batchesCompleted++;
          await save(summary);
          if (offset + options.batchSize < patients.length && options.pauseSeconds > 0)
            await (deps.sleep || (ms => new Promise(resolve => setTimeout(resolve, ms))))(options.pauseSeconds * 1000);
        }
      }
      if (entry.results.some(result => result.status !== 'success' && result.status !== 'warning')) summary.failed = true;
      console.log(`[${center.name}] Activos: ${entry.patients}; con atenciones procesadas: ${entry.eligible}`);
      entry.status = entry.results.some(result => result.status !== 'success' && result.status !== 'warning')
        ? 'errors' : (options.execute ? 'completed' : 'reviewed');
    } catch (error) {
      entry.status = 'failed';
      entry.error = error.message;
      summary.failed = true;
      console.error(`[${center.name}] Falló el centro; se continuará con el siguiente.`);
    }
    entry.finishedAt = new Date().toISOString();
    await save(summary);
  }
  summary.finishedAt = new Date().toISOString();
  await save(summary);
  return summary;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Uso: bash scripts/run-monthly-attentions.sh [--execute] [--center NOMBRE] [--month 11 --year 2026]\nSin --execute: solo consulta MongoDB. --center se puede repetir. Día 1 en Chile: mes anterior; desde el 2: actual.\nValidar sin conexiones: node scripts/monthly-attentions.cjs --show-period [--date YYYY-MM-DD]');
    console.log('Carga: --batch-size 10 --pause-seconds 5 (valores por defecto; pacientes y centros secuenciales).');
    return;
  }
  if (options.showPeriod) {
    console.log(JSON.stringify({ month: options.month, year: options.year, rule: options.periodSource, timeZone: 'America/Santiago' }, null, 2));
    return;
  }
  if (process.env.FICLIN_BULK_LOCKED !== '1')
    throw new Error('Usa bash scripts/run-monthly-attentions.sh para ejecutar con bloqueo.');
  process.chdir(backend);
  require('dotenv').config({ path: path.join(backend, '.env') });
  if (!process.env.DB_URI) throw new Error('Falta DB_URI en backend/.env o en el entorno.');
  const compiled = path.join(backend, 'dist/src');
  if (!fs.existsSync(path.join(compiled, 'services/medicalRecord.service.js')))
    throw new Error('Falta el backend compilado (dist/src). Compila o despliega el backend primero.');
  const mongoose = require('mongoose');
  const Patient = require(path.join(compiled, 'models/patient.model')).default;
  const Center = require(path.join(compiled, 'models/sistratCenter.model')).default;
  // Express normalmente registra este modelo a través de las rutas; el CLI debe hacerlo explícitamente.
  require(path.join(compiled, 'models/parameters/service.model'));
  const { getEnvironmentConfigValue } = require(path.join(compiled, 'services/environmentConfig.service'));
  const { getGroupedRecordsByPatientAndMonth } =
    require(path.join(compiled, 'services/medicalRecord.service'));
  const { startAttentionBatch, getAttentionBatch } = require(path.join(compiled, 'services/attentionBatchJob.service'));
  try {
    await mongoose.connect(process.env.DB_URI, { serverSelectionTimeoutMS: 15000 });
    const centers = await Center.find({ active: true }).select('name usuario password').sort({ name: 1 }).lean();
    const selected = options.centers.length ? centers.filter(c => options.centers.includes(c.name)) : centers;
    for (const name of options.centers) {
      if (!selected.some(c => c.name === name)) throw new Error(`Centro inexistente o inactivo: ${name}`);
    }
    if (!selected.length) throw new Error('No hay centros activos para procesar.');
    if (options.execute) {
      if (await getEnvironmentConfigValue('sistrat-direct-record-massive') !== true)
        throw new Error('Se requiere sistrat-direct-record-massive con valor booleano true.');
      if (selected.some(c => !c.usuario || !c.password)) throw new Error('Hay centros seleccionados sin credenciales SISTRAT.');
    }
    const logDir = path.join(backend, 'logs');
    fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });
    const report = path.join(logDir, `weekly-attentions-${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}.json`);
    const save = async summary => {
      fs.writeFileSync(`${report}.tmp`, JSON.stringify(summary, null, 2), { mode: 0o600 });
      fs.renameSync(`${report}.tmp`, report);
    };
    console.log(`Modo: ${options.execute ? 'ENVÍO' : 'REVISIÓN'} | período: ${options.month}/${options.year} | regla: ${options.periodSource} | resumen: ${report}`);
    const summary = await processCenters(selected, options, {
      getPatients: name => Patient.find({ active: true, sistratCenter: name }).select('_id').sort({ _id: 1 }).lean(),
      getRecords: getGroupedRecordsByPatientAndMonth,
      submitCenter: async (center, ids, month, year, progress) => {
        const started = await startAttentionBatch(center, ids, month, year, options.batchSize, options.pauseSeconds);
        console.log(`[${center}] Proceso compartido con la web: ${started._id}`);
        let job = started;
        await progress(job);
        while (job.active) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          job = await getAttentionBatch(String(started._id));
          await progress(job);
        }
        if (job.status === 'FAILED') throw new Error(job.error || 'Registro incompleto. Revisa SISTRAT antes de reenviar.');
        return job.results;
      },
    }, save);
    if (summary.failed) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = { parseArgs, processCenters };
if (require.main === module) main().catch(error => {
  // No imprimir la URI de MongoDB ni objetos de conexión con credenciales.
  console.error(`Registro semanal fallido: ${String(error.message).replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[URI oculta]')}`);
  process.exitCode = 1;
});
