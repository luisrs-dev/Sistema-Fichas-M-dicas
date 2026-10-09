const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => dependencies[name] || {}, console });
  return module.exports;
}
const visibility = load('../../frontend/src/app/dashboard/utils/alert-visibility.ts');
const parameters = load('../src/interfaces/parameters/parameter.interface.ts');
const model = load('../src/models/parameters/profesionalRole.model.ts', {
  mongoose: require('mongoose'), '../../interfaces/parameters/parameter.interface': parameters
}).default;

test('configured cargo determines alerts independently of its name and program', () => {
  const profile = { name: 'Médico', visibleAlerts: ['consentimiento', 'diagnosticoSocial'] };
  for (const option of visibility.ALERT_OPTIONS) {
    assert.equal(visibility.canViewAlert(option.value, profile, false, 'PAI PR'), profile.visibleAlerts.includes(option.value));
  }
});
test('empty selection hides every alert including program exceptions', () => {
  for (const option of visibility.ALERT_OPTIONS) {
    assert.equal(visibility.canViewAlert(option.value, { name: 'Psicólogo', visibleAlerts: [] }, false, 'PAI PR'), false);
  }
});
test('administrator sees all alerts regardless of selection or missing cargo', () => {
  for (const option of visibility.ALERT_OPTIONS) assert.equal(visibility.canViewAlert(option.value, null, true), true);
});
test('unconfigured cargos retain legacy role and program visibility', () => {
  assert.equal(visibility.canViewAlert('cie10', { name: 'Médico' }, false), true);
  assert.equal(visibility.canViewAlert('consentimiento', { name: 'Tens' }, false, 'PAI'), true);
  assert.equal(visibility.canViewAlert('evaluacion', { name: 'Tens' }, false, 'PR'), true);
  assert.equal(visibility.canViewAlert('egreso', { name: 'Tens' }, false), false);
  assert.equal(visibility.canViewAlert('evaluacion', null, false), false);
});
test('schema distinguishes unconfigured and empty selection and rejects unknown alert types', () => {
  assert.equal(new model({ name: 'Tens' }).visibleAlerts, undefined);
  const empty = new model({ name: 'Tens', visibleAlerts: [] });
  assert.equal(empty.visibleAlerts.length, 0);
  assert.equal(empty.validateSync(), undefined);
  assert.ok(new model({ name: 'Tens', visibleAlerts: ['invalid'] }).validateSync());
});
test('cargo update persists empty selection and preserves existing config for older callers', async () => {
  const calls = [];
  const service = load('../src/services/profesionalRole.service.ts', {
    '../models/parameters/profesionalRole.model': { __esModule: true, default: { findByIdAndUpdate: async (...args) => { calls.push(args); return args[1]; } } }
  });
  await service.updateProfesionalRole('cargo', ['service'], []);
  assert.equal(calls[0][1].visibleAlerts.length, 0);
  assert.equal(calls[0][2].runValidators, true);
  await service.updateProfesionalRole('cargo', ['service']);
  assert.equal(Object.hasOwn(calls[1][1], 'visibleAlerts'), false);
  await service.updateProfesionalRole('cargo', undefined, ['cie10']);
  assert.equal(Object.hasOwn(calls[2][1], 'services'), false);
  assert.equal(calls[2][1].visibleAlerts[0], 'cie10');
});
test('API rejects malformed selections before writing', async () => {
  let writes = 0;
  const controller = load('../src/controllers/profesionalRole.controller.ts', {
    '../services/profesionalRole.service': { insertProfesionalRole: async () => { writes++; }, updateProfesionalRole: async () => { writes++; } },
    '../interfaces/parameters/parameter.interface': parameters,
    '../utils/error.handle': { handleHttp: () => assert.fail('Unexpected server error') }
  });
  for (const visibleAlerts of [null, 'cie10', ['invalid']]) {
    for (const handler of [controller.postProfesionalRole, controller.putProfesionalRole]) {
      let status;
      const response = { status(code) { status = code; return this; }, send() {} };
      await handler({ body: { id: 'cargo', name: 'Tens', services: [], visibleAlerts } }, response);
      assert.equal(status, 400);
    }
  }
  assert.equal(writes, 0);
});

test('patient filter matches only active alerts allowed by the cargo', () => {
  const user = { _id: 'professional', profile: { name: 'Trabajador social', visibleAlerts: ['diagnosticoSocial'] }, programs: [] };
  const auth = { isAdmin: () => false, canCreateUser: () => false, getUser: () => user };
  const Component = load('../../frontend/src/app/dashboard/pages/patients/listPatients/listPatients.component.ts', {
    '@angular/core': { Component: () => target => target, ViewChild: () => () => {}, inject: token => token, ChangeDetectionStrategy: { OnPush: 0 } },
    '@angular/material/table': { MatTableDataSource: class { constructor(data) { this.data = data; } } },
    '@angular/router': { ActivatedRoute: { data: { pipe: () => ({ subscribe() {} }) } } },
    rxjs: { Subject: class {}, switchMap() {}, startWith() {} },
    '@angular/core/rxjs-interop': { takeUntilDestroyed() {} },
    '../../../../auth/auth.service': { AuthService: auth },
    '../../../utils/alert-visibility': visibility
  }).default;
  const instance = new Component();
  instance.checkAndResumeExportJob = () => {};
  instance.ngOnInit();
  const filter = JSON.stringify({ search: '', program: '', alerts: true });
  assert.equal(instance.dataSource.filterPredicate({ alertIntegracionSocial: true }, filter), false);
  assert.equal(instance.dataSource.filterPredicate({ alertDiagnosticoSocial: true }, filter), true);
  assert.equal(instance.dataSource.filterPredicate({ alertCie10: true }, filter), false);
  assert.equal(instance.dataSource.filterPredicate({}, filter), false);
  assert.equal(instance.dataSource.filterPredicate({ alertDiagnosticoSocial: false }, filter), false);
});
