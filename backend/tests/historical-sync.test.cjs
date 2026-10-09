const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: n => deps[n] || {}, Date, Map, Set, console, setInterval, clearInterval });
  return module.exports;
}
const scraper = load('services/historicalPatients.scraper.ts', { cheerio: require('cheerio') });
test('reads th and td rows, normalizes and deduplicates identification column', () => {
  const html = '<table id="table_pacientes_historicos"><thead><tr><th>Header</th></tr></thead><tbody>' +
    '<tr><th>1</th><th>Test</th><th> CODE1&nbsp;</th></tr>' +
    '<tr><td>2</td><td>Test</td><td>code1</td></tr></tbody></table>';
  assert.deepEqual(Array.from(scraper.extractHistoricalCodes(html)), ['CODE1']);
});
test('missing or malformed tables fail, explicit empty table is valid', () => {
  assert.throws(() => scraper.extractHistoricalCodes('<html>Login</html>'));
  assert.throws(() => scraper.extractHistoricalCodes('<table id="table_pacientes_historicos"><tbody><tr><td>1</td></tr></tbody></table>'));
  assert.equal(scraper.extractHistoricalCodes('<table id="table_pacientes_historicos"><tbody></tbody></table>').length, 0);
});
function worker({ rows = [], codes = [], failFetch = false, failUpdate = false, lostLease = false } = {}) {
  const writes = [], states = []; let cacheDeleted = false;
  const service = load('services/historicalSync.service.ts', {
    '../models/historicalSyncJob.model': { updateOne: async (filter, update) => {
      states.push(structuredClone(update.$set)); return { matchedCount: lostLease ? 0 : 1 };
    } },
    '../models/patient.model': {
      find: filter => { assert.equal(filter.sistratCenter, 'center'); return { select: () => ({ lean: async () => rows }) }; },
      updateOne: async (filter, update) => { if (failUpdate) throw Error('write failed'); writes.push({ filter, update }); return { modifiedCount: 1 }; }
    },
    '../models/sistratCache.model': { deleteOne: async filter => { assert.equal(filter.center, 'center'); cacheDeleted = true; } },
    './historicalPatients.scraper': { normalizeHistoricalCode: scraper.normalizeHistoricalCode,
      fetchHistoricalCodes: async () => { if (failFetch) throw Error('SISTRAT unavailable'); return codes; } },
  });
  return { run: () => service.executeHistoricalSync('job', 'center'), writes, states, cacheDeleted: () => cacheDeleted };
}
test('updates exact center matches, preserves unknown and ambiguous, reports already historical', async () => {
  const f = worker({ codes: ['A', 'B', 'C', 'D'], rows: [
    { _id: '1', codigoSistrat: ' a ' }, { _id: '2', codigoSistrat: 'B', careStatus: 'discharged' },
    { _id: '3', codigoSistrat: 'D' }, { _id: '4', codigoSistrat: 'D' },
  ] });
  await f.run(); assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].filter.sistratCenter, 'center');
  assert.equal(f.writes[0].update.$set.careStatus, 'discharged');
  assert.equal(f.writes[0].update.$set.historicalSync.jobId, 'job');
  const final = f.states.at(-1);
  assert.equal(final.status, 'COMPLETED');
  assert.deepEqual(final.result, { total: 4, updated: ['A'], alreadyHistorical: ['B'], notFound: ['C'], ambiguous: ['D'], errors: [] });
  assert.equal(f.cacheDeleted(), true);
});
test('repeat sync does not rewrite confirmed historical patients', async () => {
  const f = worker({ codes: ['A'], rows: [{ _id: '1', codigoSistrat: 'A', careStatus: 'discharged' }] });
  await f.run(); assert.equal(f.writes.length, 0); assert.deepEqual(f.states.at(-1).result.alreadyHistorical, ['A']);
});
test('failed extraction and expired ownership never update patients', async () => {
  for (const options of [{ failFetch: true }, { lostLease: true }]) {
    const f = worker({ codes: ['A'], rows: [{ _id: '1', codigoSistrat: 'A' }], ...options });
    await f.run(); assert.equal(f.writes.length, 0); assert.equal(f.states.at(-1).status, 'FAILED');
  }
});
test('individual write errors appear in result without claiming an update', async () => {
  const f = worker({ codes: ['A'], rows: [{ _id: '1', codigoSistrat: 'A' }], failUpdate: true });
  await f.run(); assert.deepEqual(f.states.at(-1).result.errors, ['A']); assert.equal(f.states.at(-1).result.updated.length, 0);
});
test('empty historical list makes no patient changes', async () => {
  const f = worker(); await f.run(); assert.equal(f.writes.length, 0); assert.equal(f.states.at(-1).result.total, 0);
});
test('SISTRAT navigation uses historical menu and filter, and always closes browser', async () => {
  for (const fail of [false, true]) {
    const clicks = []; const waits = []; let closed = false; let evaluations = 0;
    class Sistrat {
      scrapper = { closeBrowser: async () => { closed = true; } };
      async login(center) {
        assert.equal(center, 'center');
        return { waitForSelector: async selector => { waits.push(selector); }, click: async s => { clicks.push(s); }, waitForNavigation: async () => { throw Error('Navigation timeout of 30000 ms exceeded'); },
          evaluate: async () => { if (++evaluations === 1) return; if (fail) throw Error('unknown pagination'); return '<table id="table_pacientes_historicos"><tbody><tr><th>1</th><th>Test</th><th>ABC</th></tr></tbody></table>'; } };
      }
    }
    const s = load('services/historicalPatients.scraper.ts', { cheerio: require('cheerio'), './sistrat/sistrat.class': Sistrat });
    if (fail) await assert.rejects(s.fetchHistoricalCodes('center', async () => {}));
    else assert.deepEqual(Array.from(await s.fetchHistoricalCodes('center', async () => {})), ['ABC']);
    assert.deepEqual(clicks, ['#flyout', 'a[href="php/consultar_paciente_historicos.php"]', '#filtrar']);
    assert.ok(waits.includes('#filtrar'));
    assert.ok(waits.includes('#table_pacientes_historicos:not([data-ficlin-awaiting-filter])'));
    assert.equal(closed, true);
  }
});
test('starting sync reuses an existing job for the selected center', async () => {
  let created = false;
  const existing = { _id: 'existing', active: true };
  const service = load('services/historicalSync.service.ts', {
    './sistratCenter.service': { getCenterByName: async () => ({ name: 'center', active: true }) },
    '../models/historicalSyncJob.model': { init: async () => {}, updateMany: async () => {}, findOne: async () => existing,
      create: async () => { created = true; } }
  });
  assert.equal(await service.startHistoricalSync('center', 'admin'), existing);
  assert.equal(created, false);
});
test('inactive or unknown center cannot start a synchronization', async () => {
  const service = load('services/historicalSync.service.ts', { './sistratCenter.service': { getCenterByName: async () => null } });
  await assert.rejects(service.startHistoricalSync('missing', 'admin'));
});
