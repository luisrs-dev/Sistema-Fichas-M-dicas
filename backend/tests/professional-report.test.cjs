const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { Types } = require('mongoose');
const own = '111111111111111111111111', other = '222222222222222222222222';
function fixture({ admin = false, active = true } = {}) {
  let auth, pipeline, filter;
  const handlers = {};
  const router = { use(fn) { auth = fn; }, get(path, fn) { handlers[path] = fn; } };
  const user = {
    findOne: () => ({ populate: () => ({ lean: async () => ({ _id: own, active, permissions: admin ? [{ value: 'admin' }] : [] }) }) }),
    find: f => { filter = f; return { select: () => ({ sort: () => ({ lean: async () => [] }) }) }; }
  };
  const dependencies = {
    express: { Router: () => router }, mongoose: { Types },
    '../utils/jwt.handle': { verifyToken: token => { if (token === 'bad') throw Error(); return { email: 'test@example.com' }; } },
    '../models/user.model': user,
    '../models/patient.model': { collection: { name: 'patients' } },
    '../models/parameters/service.model': { collection: { name: 'services' } },
    '../models/medicalRecord.model': { aggregate: async p => { pipeline = p; return [{ records: [], summary: [], services: [] }]; } }
  };
  const module = { exports: {} };
  const source = fs.readFileSync(require('node:path').join(__dirname, '../src/routes/professional-report.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText,
    { module, exports: module.exports, require: name => dependencies[name] });
  async function call(path, query = {}, token = 'valid') {
    const req = { query, headers: token ? { authorization: `Bearer ${token}` } : {} };
    const res = { locals: {}, statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    let allowed = false;
    await auth(req, res, () => { allowed = true; });
    if (allowed) await handlers[path](req, res);
    return res;
  }
  return { call, pipeline: () => pipeline, filter: () => filter };
}
const filters = { professionalId: own, month: '11', year: '2026' };
test('requires authentication and an active account', async () => {
  assert.equal((await fixture().call('/', filters, '')).statusCode, 401);
  assert.equal((await fixture().call('/', filters, 'bad')).statusCode, 401);
  assert.equal((await fixture({ active: false }).call('/', filters)).statusCode, 403);
});
test('professionals can only query and list themselves', async () => {
  const f = fixture();
  assert.equal((await f.call('/', { ...filters, professionalId: other })).statusCode, 403);
  await f.call('/professionals');
  assert.equal(f.filter()._id, own);
});
test('administrators can query others without filtering inactive users', async () => {
  const f = fixture({ admin: true });
  assert.equal((await f.call('/', { ...filters, professionalId: other })).statusCode, 200);
  assert.equal(String(f.pipeline()[0].$match.registeredBy), other);
  await f.call('/professionals');
  assert.equal(Object.keys(f.filter()).length, 0);
});
test('rejects invalid filters', async () => {
  for (const invalid of [{ month: '13' }, { year: '2026.5' }, { page: '-1' }, { pageSize: '10000' }, { search: ['x'] }, { professionalId: 'invalid' }, { order: 'invalid' }]) {
    const f = fixture();
    assert.equal((await f.call('/', { ...filters, ...invalid })).statusCode, 400);
    assert.equal(f.pipeline(), undefined);
  }
});
test('uses Chile dates, literal search, stable pagination and an empty summary', async () => {
  const f = fixture();
  const response = await f.call('/', { ...filters, search: 'A.*', page: '2', pageSize: '25', order: 'asc' });
  assert.equal(response.body.summary.total, 0);
  const pipeline = f.pipeline();
  assert.equal(pipeline[2].$match.$expr.$eq[0].$dateToString.timezone, 'America/Santiago');
  assert.equal(pipeline[2].$match.$expr.$eq[1], '2026-11');
  assert.equal(pipeline.find(p => p.$match?.$or).$match.$or[0].patientName.$regex, 'A\\.\\*');
  const facets = pipeline.at(-1).$facet;
  assert.equal(facets.records[1].$skip, 50);
  assert.equal(facets.records[2].$limit, 25);
  assert.equal(facets.records[0].$sort.attentionDate, 1);
  assert.equal(facets.summary[0].$group.patients.$addToSet, '$patient');
});
test('PDF export includes every result while keeping permissions and filters', async () => {
  const f = fixture();
  const response = await f.call('/', { ...filters, exportAll: 'true', search: 'María' });
  assert.equal(response.statusCode, 200);
  const pipeline = f.pipeline();
  const records = pipeline.at(-1).$facet.records;
  assert.equal(records.some(stage => stage.$skip !== undefined || stage.$limit !== undefined), false);
  assert.ok(pipeline.find(stage => stage.$match?.$or));
  assert.equal((await f.call('/', { ...filters, exportAll: 'true', professionalId: other })).statusCode, 403);
  assert.equal((await f.call('/', { ...filters, exportAll: 'yes' })).statusCode, 400);
});
