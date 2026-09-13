const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const silent = { log() {}, error() {}, group() {}, groupEnd() {}, warn() {} };
function load(file, dependencies) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => dependencies[name] || {},
    console: silent, setInterval, clearInterval, Date, Promise });
  return module.exports;
}
const tick = () => new Promise(setImmediate);
function deferred() { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; }
const patient = Object.fromEntries(['rut', 'sistratCenter', 'region', 'comuna', 'phone', 'phoneFamily', 'mainSubstance', 'previousTreatments', 'typeContact', 'whoRequest', 'whoDerives'].map(key => [key, '1']));
patient._id = 'patient';
function scraperFixture({ alerts, close, manual = false, validation = false } = {}) {
  class Logger { async log() {} async close() {} }
  class Scrapper {
    async closeBrowser() { if (close) await close.promise; }
  }
  for (const method of ['clickButton', 'waitAndType', 'setSelectValue', 'setDateValue', 'waitForSeconds']) Scrapper.prototype[method] = async () => {};
  const fresh = { ...patient, codigoSistrat: 'NEW-CODE' };
  const Sistrat = load('services/sistrat/sistrat.class.ts', {
    '../scrapper': Scrapper, '../../utils/processLogger': Logger,
    '../../models/patient.model': { findById: async () => fresh },
    '../environmentConfig.service': { getEnvironmentConfigValue: async key => key.includes('wait') ? '1' : !manual }
  }).default;
  const instance = new Sistrat();
  instance.login = async () => ({ on() {}, waitForSelector: async () => {}, click: async () => {},
    waitForFunction: async () => {}, waitForResponse: async () => ({ ok: () => true }) });
  instance.listActiveDemands = async () => {};
  instance.setCodeAlertSistrat = async () => fresh;
  instance.checkForValidationError = async () => { if (validation) throw Error('SISTRAT_VALIDATION_ERROR: teléfono'); };
  instance.updateAlerts = async p => { assert.equal(p.codigoSistrat, 'NEW-CODE'); return alerts ? alerts.promise : fresh; };
  return instance;
}

test('crearDemanda waits for alerts and browser cleanup, using the refreshed code', async () => {
  const alerts = deferred(), close = deferred();
  const sistrat = scraperFixture({ alerts, close });
  let completed = false;
  const steps = [];
  const result = sistrat.crearDemanda(patient, async (step, progress) => steps.push(progress)).then(() => completed = true);
  await tick(); assert.equal(completed, false); assert.equal(steps.at(-1), 80);
  alerts.resolve({ codigoSistrat: 'NEW-CODE' });
  await tick(); assert.equal(completed, false); assert.equal(steps.at(-1), 95);
  close.resolve(); await result; assert.equal(completed, true);
});
test('missing alerts cannot produce success', async () => {
  const alerts = deferred(); alerts.resolve(null);
  await assert.rejects(scraperFixture({ alerts }).crearDemanda(patient), /no se completó/);
});
test('manual mode never returns registration success', async () => {
  await assert.rejects(scraperFixture({ manual: true }).crearDemanda(patient), /Revisión manual/);
});
test('explicit SISTRAT validation rejection allows corrected resubmission', async () => {
  let result;
  await assert.rejects(scraperFixture({ validation: true }).crearDemanda(patient, async (s, p, r) => { if (r) result = r; }), /SISTRAT_VALIDATION_ERROR/);
  assert.equal(result.submitted, false);
});

function jobFixture() {
  const jobs = [];
  let runs = 0;
  const pending = deferred();
  const matches = (j, filter) => Object.entries(filter).every(([k,v]) => k === 'leaseUntil' ? +j[k] < +v.$lt : j[k] === v);
  function update(j, change) {
    for (const [key, value] of Object.entries(change.$set || {})) {
      if (key.startsWith('result.')) j.result[key.slice(7)] = value;
      else j[key] = value;
    }
    if (change.$push?.history) j.history.push(change.$push.history);
  }
  const model = {
    init: async () => {},
    findOne: filter => {
      const found = jobs.filter(j => matches(j, filter)).at(-1) || null;
      return { sort: async () => found, then: (resolve, reject) => Promise.resolve(found).then(resolve, reject) };
    },
    create: async data => {
      if (jobs.some(j => j.activeDemand)) throw Object.assign(Error('duplicate'), { code: 11000 });
      const job = { ...data, _id: String(jobs.length + 1), createdAt: new Date() }; jobs.push(job); return job;
    },
    updateOne: async (filter, change) => {
      const job = jobs.find(j => matches(j, filter)); if (job) update(job, change); return { matchedCount: job ? 1 : 0 };
    },
    updateMany: async (filter, change) => { jobs.filter(j => matches(j, filter)).forEach(j => update(j, change)); }
  };
  class Sistrat {
    async crearDemanda(p, report) {
      runs++;
      await report('Enviando', 50, { submitted: true });
      await report('Alertas', 80, { registered: true });
      await pending.promise;
    }
    async updateAlerts() { runs++; return patient; }
  }
  const service = load('services/demandJob.service.ts', {
    mongoose: { isValidObjectId: () => true }, '../models/sistratJob.model': model,
    '../models/patient.model': { findById: async () => patient }, './sistrat/sistrat.class': Sistrat
  });
  return { ...service, jobs, pending, runs: () => runs };
}
test('simultaneous requests launch one job; success is persisted only after the work finishes', async () => {
  const f = jobFixture();
  try {
    const jobs = await Promise.all([f.startDemandJob('patient'), f.startDemandJob('patient')]);
    await tick(); assert.equal(f.runs(), 1); assert.equal(jobs[0]._id, jobs[1]._id);
    assert.equal(f.jobs[0].status, 'IN_PROGRESS');
    f.pending.resolve(); await tick();
    assert.equal(f.jobs[0].status, 'COMPLETED'); assert.equal(f.jobs[0].activeDemand, false);
    await assert.rejects(f.startDemandJob('patient'), /ya fue enviada/);
  } finally { f.pending.resolve(); await tick(); }
});
test('expired jobs become interrupted and cannot blindly resubmit; confirmed jobs can retry only alerts', async () => {
  const f = jobFixture();
  f.jobs.push({ _id: 'old', patientId: 'patient', type: 'demanda', activeDemand: true, status: 'IN_PROGRESS', leaseUntil: new Date(0), history: [], result: { submitted: true, registered: true } });
  const old = await f.getDemandJob('patient');
  assert.equal(old.status, 'FAILED');
  await assert.rejects(f.startDemandJob('patient'), /ya fue enviada/);
  await f.startDemandJob('patient', true); await tick();
  assert.equal(f.runs(), 1); assert.equal(f.jobs.at(-1).status, 'COMPLETED');
});

test('verification updates alerts without submitting a new demand', async () => {
  const sistrat = scraperFixture();
  sistrat.crearDemanda = async () => { throw Error('must not submit'); };
  const states = [];
  await sistrat.verifyDemand(patient, async (step, progress, result) => states.push({ progress, result }));
  assert.equal(states.find(s => s.result?.registered)?.progress, 80);
  assert.equal(states.at(-1).progress, 95);
});
test('verification does not declare registration when lookup fails', async () => {
  const sistrat = scraperFixture();
  sistrat.setCodeAlertSistrat = async () => { throw Error('connection lost'); };
  let confirmed = false;
  await assert.rejects(sistrat.verifyDemand(patient, async (s, p, r) => { confirmed ||= !!r?.registered; }), /connection lost/);
  assert.equal(confirmed, false);
});
