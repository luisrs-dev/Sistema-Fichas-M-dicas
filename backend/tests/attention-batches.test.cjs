const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(file, dependencies) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports,
    require: name => dependencies[name] || (name === 'path' ? path : {}), console, process, Date, setTimeout, setInterval, clearInterval });
  return module.exports;
}
const id = n => String(n).padStart(24, '0');

test('servicio procesa 23 pacientes en 10/10/3 sin recuperar todas las atenciones antes de enviar', async () => {
  const events = [], batches = [], progress = [];
  const service = load('services/medicalRecord.service.ts', {
    '../models/patient.model': { findById: async patientId => ({ _id: patientId, active: true, sistratCenter: 'a' }) },
    './medicalRecordGrouping.service': { getGroupedRecordsByPatientAndMonth: async patientId => {
      events.push(`read:${patientId}`); return [{}];
    } },
    './sistrat/sistrat.class': class {
      async bulkRecordMonthlySheets(data) {
        batches.push(data.length); events.push('submit');
        return data.map(item => ({ patientId: item.patient._id, status: 'success' }));
      }
    },
  });
  const results = await service.postMedicalRecordsBulkSistrat('a', Array.from({ length: 23 }, (_, n) => id(n)), 11, 2026, {
    pauseSeconds: 0, onBatch: async results => progress.push(results.length),
  });
  assert.deepEqual(batches, [10, 10, 3]);
  assert.deepEqual(progress, [10, 10, 3]);
  assert.equal(events.indexOf('submit'), 10);
  assert.equal(events.filter(event => event.startsWith('read:')).length, 23);
  assert.equal(results.length, 23);
});

test('servicio conserva omitidos y rechaza pacientes de otro centro', async () => {
  const service = load('services/medicalRecord.service.ts', {
    '../models/patient.model': { findById: async patientId => ({ _id: patientId, active: patientId !== id(1), sistratCenter: patientId === id(3) ? 'otro' : 'a' }) },
    './medicalRecordGrouping.service': { getGroupedRecordsByPatientAndMonth: async () => [] },
    './sistrat/sistrat.class': class { async bulkRecordMonthlySheets() { return []; } },
  });
  const results = await service.postMedicalRecordsBulkSistrat('a', [id(1), id(2)], 11, 2026, { pauseSeconds: 0 });
  assert.equal(results.length, 2);
  assert.ok(results.every(r => r.status === 'warning'));
  await assert.rejects(service.postMedicalRecordsBulkSistrat('a', [id(3)], 11, 2026), /no pertenece/);
});

function jobsFixture(mode = 'failure') {
  let current = null, release;
  const gate = new Promise(resolve => { release = resolve; });
  const model = {
    collection: { createIndex: async () => {} },
    init: async () => {}, findOne: async () => current?.active ? current : null,
    findById: async () => current,
    create: async data => {
      if (current?.active) throw Object.assign(new Error('duplicate'), { code: 11000 });
      current = { ...data, _id: id(99), active: true, results: [], processed: 0, status: 'PENDING' };
      return { ...current };
    },
    updateOne: async (query, update) => { Object.assign(current, update.$set); return { matchedCount: 1 }; },
  };
  const service = load('services/attentionBatchJob.service.ts', {
    mongoose: { isValidObjectId: value => /^[a-f0-9]{24}$/.test(value) },
    os: { hostname: () => 'test-host' },
    '../models/attentionBatchJob.model': model,
    '../models/patient.model': { countDocuments: async query => query._id.$in.length },
    './sistratCenter.service': { getCenterByName: async () => ({ active: true, usuario: 'test', password: 'test' }) },
    './environmentConfig.service': { getEnvironmentConfigValue: async () => true },
    './medicalRecord.service': { postMedicalRecordsBulkSistrat: async (center, ids, month, year, options) => {
      await options.beforeBatch(1, 2);
      await options.onBatch([{ patientId: ids[0], status: 'success' }]);
      await gate;
      if (mode === 'failure') throw new Error('Fallo en segundo lote');
      await options.beforeBatch(2, 2);
      await options.onBatch([{ patientId: ids[1], status: mode === 'errors' ? 'error' : 'success' }]);
    } },
  });
  return { service, release, current: () => current };
}

test('job devuelve el control, rechaza otro envío y conserva resultados al fallar otro lote', async () => {
  const fixture = jobsFixture();
  const job = await fixture.service.startAttentionBatch('a', [id(1), id(2)], 11, 2026);
  assert.equal(job.active, true);
  await assert.rejects(fixture.service.startAttentionBatch('a', [id(3)], 11, 2026), error => error.statusCode === 409);
  fixture.release();
  for (let n = 0; n < 20 && fixture.current().active; n++) await new Promise(resolve => setTimeout(resolve, 1));
  const result = fixture.current();
  assert.equal(result.active, false);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.processed, 1);
  assert.equal(result.results[0].patientId, id(1));
  assert.match(result.error, /segundo lote/);
});

test('job valida período e identificadores antes de enviar', async () => {
  const { service } = jobsFixture();
  await assert.rejects(service.startAttentionBatch('a', ['bad'], 11, 2026), /válidos/);
  await assert.rejects(service.startAttentionBatch('a', [id(1)], 13, 2026), /Período/);
});

for (const [mode, expected] of [['success', 'COMPLETED'], ['errors', 'COMPLETED_WITH_ERRORS']]) {
  test(`job finaliza y libera bloqueo con estado ${expected}`, async () => {
    const fixture = jobsFixture(mode);
    await fixture.service.startAttentionBatch('a', [id(1), id(2)], 11, 2026);
    fixture.release();
    for (let n = 0; n < 20 && fixture.current().active; n++) await new Promise(resolve => setTimeout(resolve, 1));
    assert.equal(fixture.current().status, expected);
    assert.equal(fixture.current().active, false);
    assert.equal(fixture.current().processed, 2);
  });
}

test('agrupación conserva el límite de mes de Chile al consultar solo fecha y servicio', async () => {
  const records = [
    { date: '2026-11-01T02:00:00Z', service: { description: 'Consulta' } },
    { date: '2026-11-01T03:00:00Z', service: { description: 'Consulta' } },
    { date: '2026-11-02T02:00:00Z', service: { description: 'Consulta' } },
  ];
  const query = { select: () => query, populate: () => query, lean: async () => records };
  const service = load('services/medicalRecordGrouping.service.ts', {
    mongoose: { Types: { ObjectId: class { static isValid() { return true; } } } },
    '../models/medicalRecord.model': { find: () => query },
  });
  const grouped = await service.getGroupedRecordsByPatientAndMonth(id(1), 11, 2026);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].total, 2);
  assert.equal(grouped[0].days[0], 2);
  assert.equal(grouped[0].days[1], 0);
});
