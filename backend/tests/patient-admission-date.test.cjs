const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services/patient.service.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;

function fixture(form, patient = { _id: 'patient-id', admissionDate: '01/01/2000' }) {
  const dependencies = {
    moment: require('moment'),
    mongoose: { Types: { ObjectId: class {} } },
    '../models/patient.model': { findOne: () => ({ populate: async () => patient && { toObject: () => patient } }) },
    '../models/medicalRecord.model': { find: () => ({ populate: async () => [] }) },
    '../models/admissionForm.model': { findOne: query => {
      assert.equal(query.patientId, 'patient-id');
      return { select: async field => {
        assert.equal(field, 'txtfecha_ingreso_tratamiento');
        return form;
      } };
    } },
  };
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => dependencies[name] || {}, console, process: { env: {} } });
  return module.exports.findPatient('patient-id');
}

for (const date of ['15/03/2026', '15-03-2026', '2026-03-15', '2026-03-15T03:00:00.000Z']) {
  test(`patient detail reads and normalizes admission form date: ${date}`, async () => {
    const result = await fixture({ txtfecha_ingreso_tratamiento: date });
    assert.equal(result.patient.admissionDate, '15/03/2026');
    assert.equal(result.patient._id, 'patient-id');
    assert.equal(result.medicalRecords.length, 0);
  });
}
for (const form of [null, {}, { txtfecha_ingreso_tratamiento: '' }, { txtfecha_ingreso_tratamiento: '31/02/2026' }]) {
  test(`missing or invalid admission date does not use obsolete patient date: ${JSON.stringify(form)}`, async () => {
    assert.equal((await fixture(form)).patient.admissionDate, '');
  });
}
test('missing patient remains null', async () => {
  assert.equal((await fixture(null, null)).patient, null);
});
