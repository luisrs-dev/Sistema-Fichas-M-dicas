const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ejs = require('ejs');
require('ts-node').register({ transpileOnly: true, project: path.join(__dirname, '../tsconfig.json') });
const Model = require('../src/models/medicalRecord.model.ts').default;
const { Types } = require('mongoose');
const template = path.join(__dirname, '../templates-pdf/clinical-records-template.ejs');
const conclusion = 'Se acuerda continuar el proceso.\nPróxima sesión: revisar <objetivos> & avances.';
function record(extra = {}) {
  return { date: '2026-09-28', relevantElements: 'Sesión de prueba',
    service: { description: 'Atención', code: '1' }, registeredBy: { name: 'Profesional' }, ...extra };
}
function render(records) {
  return ejs.renderFile(template, { patient: { name: 'Paciente', surname: 'Prueba', program: { name: 'Programa' }, codigoSistrat: 'TEST' }, clinicalRecords: records });
}
test('schema retains conclusion and line breaks in the document sent to MongoDB', async () => {
  const data = { service: new Types.ObjectId(), patient: new Types.ObjectId(), registeredBy: new Types.ObjectId() };
  const current = new Model({ ...data, sessionConclusion: conclusion });
  await current.validate();
  assert.equal(current.toObject().sessionConclusion, conclusion);
  const old = new Model(data);
  await old.validate();
  assert.equal(old.toObject().sessionConclusion, undefined);
});
test('shared PDF template displays multiline conclusion as escaped text', async () => {
  const html = await render([record({ sessionConclusion: conclusion })]);
  assert.match(html, /Conclusión o acuerdos tomados en sesión/);
  assert.match(html, /white-space: pre-wrap/);
  assert.ok(html.includes('Se acuerda continuar el proceso.\nPróxima sesión: revisar &lt;objetivos&gt; &amp; avances.'));
});
test('old, empty and whitespace-only records omit the conclusion section', async () => {
  const html = await render([record(), record({ sessionConclusion: '' }), record({ sessionConclusion: ' \n ' }), record({ sessionConclusion: null })]);
  assert.ok(!html.includes('Conclusión o acuerdos tomados en sesión'));
});
