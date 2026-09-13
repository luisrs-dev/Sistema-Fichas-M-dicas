const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function fixture(action = 'historicos') {
  const requests = [];
  const service = { snapshot: { data: { bulkAction: action } }, startHistoricalSync: center => { requests.push(center); return Promise.resolve({ job: { _id: 'job', center, active: true } }); } };
  const signal = initial => { let value = initial; const result = () => value; result.set = next => { value = next; }; result.update = fn => { value = fn(value); }; return result; };
  const deps = { '@angular/core': { inject: () => service, signal, computed: fn => fn, Component: () => target => target, ChangeDetectionStrategy: {} },
    rxjs: { firstValueFrom: value => value } };
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/src/app/dashboard/pages/medicalRecord/attentions/attentions.component.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => deps[name] || {}, Date, console });
  return { component: new module.exports.default(), requests };
}
test('selecting a center resets the old list and only checks existing historical job', () => {
  const { component: c } = fixture(); let queries = 0; const resumed = [];
  c.loadPatientsForCenter = () => queries++;
  c.resumeHistoricalSync = center => resumed.push(center);
  c.centerPatients.set([{ _id: 'old' }]); c.patientsLoaded.set(true);
  c.onCenterChange('center');
  assert.equal(queries, 0); assert.equal(c.centerPatients().length, 0); assert.equal(c.patientsLoaded(), false);
  assert.deepEqual(resumed, ['center']);
});
test('recover and force buttons explicitly request different loading modes and honor busy state', () => {
  const { component: c } = fixture(); const calls = [];
  c.loadPatientsForCenter = (center, force = false) => calls.push({ center, force });
  c.selectedCenter.set('center'); c.recoverPatients(); c.forceLoadPatientsForCenter();
  c.patientsLoading.set(true); c.recoverPatients(); c.forceLoadPatientsForCenter();
  assert.deepEqual(calls, [{ center: 'center', force: false }, { center: 'center', force: true }]);
});
test('historical sync starts with a selected center without loading active patients', async () => {
  const { component: c, requests } = fixture();
  c.selectedCenter.set('center'); c.watchHistoricalSync = () => {};
  await c.syncHistoricalPatients();
  assert.deepEqual(requests, ['center']); assert.equal(c.patientsLoaded(), false);
});

test('atenciones and alertas do not query historical jobs when selecting a center', () => {
  for (const action of ['atenciones', 'alertas']) {
    const { component: c } = fixture(action);
    let historicalQueries = 0;
    c.resumeHistoricalSync = () => historicalQueries++;
    c.onCenterChange('center');
    assert.equal(c.action, action);
    assert.equal(historicalQueries, 0);
    assert.equal(c.patientsLoaded(), false);
  }
});
