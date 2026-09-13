const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => dependencies[name] || {},
    process: { env: {} }, console: { log() {}, error() {} } });
  return module.exports;
}
const statusUtils = load('utils/careStatus.ts');
const chain = value => ({ select: () => chain(value), populate: () => chain(value), lean: async () => value,
  then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) });
function fixture(initial = {}, options = {}) {
  const patient = { _id: 'p1', program: 'program1', ...initial, save: async () => patient };
  let admission = options.admission ? { _id: 'a1', patientId: 'p1' } : null;
  let demand = null;
  let writes = 0;
  const patientModel = {
    findOne: () => chain(patient), findById: async () => patient,
    create: async data => Object.assign(patient, data),
    find: filters => {
      let rows = options.rows || [patient];
      if (filters.program) rows = rows.filter(p => filters.program.$in.includes(p.program));
      if (filters.active === false) rows = rows.filter(p => p.active === false);
      return chain(rows);
    },
    findByIdAndUpdate: async (id, fields) => Object.assign(patient, fields),
    updateOne: async (filter, update) => {
      if (options.failStatus) throw Error('status write failed');
      if ((filter.careStatus && '$ne' in filter.careStatus && filter.careStatus.$ne === patient.careStatus) || filter.careStatus?.$nin?.includes(patient.careStatus)) return { modifiedCount: 0 };
      Object.assign(patient, update.$set); writes++;
      return { modifiedCount: 1 };
    },
  };
  const admissionModel = {
    exists: async () => admission,
    findOne: () => chain(admission),
    find: () => chain(options.admissions || (admission ? [admission] : [])),
    findOneAndUpdate: async (filter, update) => {
      if (options.failForm) throw Error('form write failed');
      admission = { _id: 'a1', patientId: filter.patientId, ...update.$set }; return admission;
    },
    updateOne: async () => {
      if (options.failForm) throw Error('form write failed');
      return { matchedCount: 1 };
    },
  };
  const service = load('services/patient.service.ts', {
    '../utils/careStatus': statusUtils, moment: require('moment'),
    mongoose: { Types: { ObjectId: class {} } },
    '../models/patient.model': patientModel,
    '../models/admissionForm.model': admissionModel,
    '../models/demand.model': {
      find: () => chain(options.demands || (demand ? [demand] : [])),
      findOneAndUpdate: async (filter, update) => {
        if (options.failForm) throw Error('form write failed');
        demand = { patientId: filter.patientId, ...update.$set }; return demand;
      },
    },
    ...Object.fromEntries(['topForm', 'socialForm', 'evaluationForm', 'socialDiagnosisForm'].map(name => [
      `../models/${name}.model`, { find: () => chain([]) }
    ])),
  });
  return { service, patient, get writes() { return writes; }, get admission() { return admission; }, get demand() { return demand; } };
}
test('nuevo paciente/demanda integrada starts waiting and ignores submitted status', async () => {
  const f = fixture(); await f.service.inerPatient({ careStatus: 'discharged' });
  assert.equal(f.patient.careStatus, 'waiting');
});
test('demand → waiting → admission → active; retries never downgrade active', async () => {
  const f = fixture();
  await f.service.inerDemand('p1', { patientId: 'another' });
  assert.equal(f.patient.careStatus, 'waiting'); assert.equal(f.demand.patientId, 'p1');
  await f.service.saveAdmissionForm('p1', { patientId: 'another', txtfecha_ingreso_tratamiento: '01/09/2026' });
  assert.equal(f.patient.careStatus, 'active'); assert.equal(f.admission.patientId, 'p1');
  await f.service.inerDemand('p1', {});
  await f.service.saveAdmissionForm('p1', {});
  assert.equal(f.patient.careStatus, 'active'); assert.equal(f.admission._id, 'a1');
});
test('legacy admission prevents demand from moving patient to waiting', async () => {
  const f = fixture({}, { admission: true }); await f.service.inerDemand('p1', {});
  assert.equal(f.patient.careStatus, 'active');
});
test('confirmed discharge survives demand and admission creation/edit', async () => {
  const f = fixture({ careStatus: 'discharged' }, { admission: true });
  await f.service.inerDemand('p1', {}); await f.service.saveAdmissionForm('p1', {}); await f.service.updateAF('p1', {});
  assert.equal(f.patient.careStatus, 'discharged');
});
test('editing a legacy admission sets active and returns updated patient', async () => {
  const f = fixture({}, { admission: true }); const result = await f.service.updateAF('p1', {});
  assert.equal(result.careStatus, 'active'); assert.equal(result.registeredAdmissionForm, true);
});
test('failed form writes do not transition patient', async () => {
  const f = fixture({ careStatus: 'waiting' }, { failForm: true, admission: true });
  await assert.rejects(f.service.saveAdmissionForm('p1', {}));
  await assert.rejects(f.service.updateAF('p1', {}));
  await assert.rejects(f.service.inerDemand('p1', {}));
  assert.equal(f.writes, 0); assert.equal(f.patient.careStatus, 'waiting');
});
test('status persistence failure is returned as an error', async () => {
  const f = fixture({ careStatus: 'waiting' }, { failStatus: true });
  await assert.rejects(f.service.saveAdmissionForm('p1', {}), /status write failed/);
});
test('general patient edits cannot alter care status', async () => {
  const f = fixture({ careStatus: 'active' });
  await f.service.update('p1', { careStatus: 'discharged', name: 'Updated' });
  assert.equal(f.patient.careStatus, 'active'); assert.equal(f.patient.name, 'Updated');
});
test('lists use local forms despite stale flags and manual inactive status, and preserve program filter', async () => {
  const rows = [
    { _id: 'a', program: 'one', active: false, registeredAdmissionForm: false },
    { _id: 'w', program: 'one' }, { _id: 'd', program: 'one', careStatus: 'discharged' },
    { _id: 'unknown', program: 'one', registeredAdmissionForm: true },
    { _id: 'other', program: 'two' }, { _id: 'new', program: 'one', careStatus: 'waiting' },
  ];
  const f = fixture({}, { rows, admissions: [{ patientId: 'a' }, { patientId: 'd' }, { patientId: 'other' }], demands: [{ patientId: 'w' }] });
  for (const [status, ids] of [['waiting', ['w', 'new']], ['active', ['a']], ['discharged', ['d']]]) {
    const actual = await f.service.allPatients(['one'], undefined, status);
    assert.deepEqual(Array.from(actual, p => p._id), ids);
  }
  assert.equal((await f.service.allPatients(['one'])).length, 5);
});
test('only supported care status values are accepted', () => {
  for (const value of ['waiting', 'active', 'discharged']) assert.equal(statusUtils.isCareStatus(value), true);
  for (const value of [null, 'false', [], { $ne: 'waiting' }]) assert.equal(statusUtils.isCareStatus(value), false);
  assert.equal(statusUtils.resolveCareStatus(undefined, false, false), null);
});
test('legacy integrated demand counts as waiting, but incomplete records need review', async () => {
  const integrated = { _id: 'integrated', program: 'one', registeredOnFiclin: true,
    atentionRequestDate: '01/09/2026', mainSubstance: '1', previousTreatments: '1',
    typeContact: '1', whoRequest: '1', whoDerives: '1' };
  assert.equal(statusUtils.hasIntegratedDemand(integrated), true);
  assert.equal(statusUtils.hasIntegratedDemand({ ...integrated, registeredOnFiclin: false }), false);
  assert.equal(statusUtils.hasIntegratedDemand({ ...integrated, atentionRequestDate: '' }), false);
  const f = fixture({}, { rows: [integrated] });
  assert.equal((await f.service.allPatients(['one'], undefined, 'waiting')).length, 1);
});
test('RP patients are assigned exclusively by discharge, admission, then waiting', async () => {
  const program = { _id: 'rp', name: 'RP - Recepción Del Paciente' };
  const rows = [
    { _id: 'rp-missing', program },
    { _id: 'rp-active', program, active: false },
    { _id: 'rp-discharged', program, careStatus: 'discharged' },
    { _id: 'waiting', program: { name: 'PAI' }, careStatus: 'waiting' },
    { _id: 'unclassified', program: null },
  ];
  const f = fixture({}, { rows, admissions: [{ patientId: 'rp-active' }] });
  const waiting = await f.service.allPatients([], undefined, 'waiting');
  assert.deepEqual(Array.from(waiting, p => p._id), ['rp-missing', 'waiting']);
  assert.deepEqual(Array.from(await f.service.allPatients([], undefined, 'discharged'), p => p._id), ['rp-discharged']);
  assert.deepEqual(Array.from(await f.service.allPatients([], undefined, 'active'), p => p._id), ['rp-active']);
  assert.equal((await f.service.allPatients(['another-program'], undefined, 'waiting')).length, 0);
});
test('reception program matching tolerates accents, capitalization and spacing, but not other programs', () => {
  assert.equal(statusUtils.isReceptionProgram({ name: '  RP - RECEPCION  DEL PACIENTE  ' }), true);
  for (const program of [null, 'rp', {}, { name: 'RP - Otro programa' }]) {
    assert.equal(statusUtils.isReceptionProgram(program), false);
  }
});

test('admission includes RP in active while historical status always takes precedence', async () => {
  const rows = [
    { _id: 'active', program: { name: 'PAI' } },
    { _id: 'rp', program: { name: 'RP - Recepción Del Paciente' } },
    { _id: 'historical', program: { name: 'PAI' }, careStatus: 'discharged' },
    { _id: 'rp-historical', program: { name: 'RP - Recepción Del Paciente' }, careStatus: 'discharged' },
  ];
  const f = fixture({}, { rows, admissions: rows.map(p => ({ patientId: p._id })) });
  assert.deepEqual(Array.from(await f.service.allPatients([], undefined, 'active'), p => p._id), ['active', 'rp']);
  assert.deepEqual(Array.from(await f.service.allPatients([], undefined, 'discharged'), p => p._id), ['historical', 'rp-historical']);
});
