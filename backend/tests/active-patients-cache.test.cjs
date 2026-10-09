const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services/patient.service.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
}).outputText;
function fixture(ageHours = null, fail = false) {
  let calls = 0;
  let cache = ageHours === null ? null : { patients: [{ codigoSistrat: 'CACHED' }], lastUpdated: new Date(Date.now() - ageHours * 3600000) };
  const chain = value => ({ select: () => chain(value), lean: async () => value, then: resolve => Promise.resolve(value).then(resolve) });
  class Sistrat { async getActivePatientsByCenter() { calls++; if (fail) throw Error('SISTRAT unavailable'); return [{ codigoSistrat: 'NEW', name: 'Test' }]; } }
  class Logger { async close() {} }
  const deps = {
    './sistrat/sistrat.class': Sistrat, '../utils/processLogger': Logger,
    '../models/patient.model': { find: () => chain([]) },
    '../models/sistratCache.model': {
      findOne: () => chain(cache), findOneAndUpdate: async (filter, data) => { cache = data; }
    }
  };
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => deps[name] || {}, Date, Promise, Map, Set,
    process: { env: {} }, console: { log() {}, error() {} } });
  return { load: force => module.exports.activeSistratPatientsByCenter('center', force), calls: () => calls };
}
test('recover uses current cache without consulting SISTRAT and includes its timestamp', async () => {
  const f = fixture(1); const response = await f.load(false);
  assert.equal(response.source, 'cache'); assert.equal(response.data[0].codigoSistrat, 'CACHED');
  assert.ok(response.lastUpdated instanceof Date); assert.equal(f.calls(), 0);
});
test('expired or missing cache waits for fresh SISTRAT data', async () => {
  for (const age of [7, null]) {
    const f = fixture(age); const response = await f.load(false);
    assert.equal(response.source, 'sistrat'); assert.equal(response.data[0].codigoSistrat, 'NEW'); assert.equal(f.calls(), 1);
  }
});
test('explicit refresh bypasses fresh cache and does not apply a silent cooldown', async () => {
  const f = fixture(1); await f.load(true); await f.load(true); assert.equal(f.calls(), 2);
});
test('simultaneous requests share the refresh and errors do not masquerade as cached success', async () => {
  const f = fixture(); await Promise.all([f.load(true), f.load(true)]); assert.equal(f.calls(), 1);
  const failed = fixture(7, true); await assert.rejects(failed.load(false), /SISTRAT unavailable/);
});
