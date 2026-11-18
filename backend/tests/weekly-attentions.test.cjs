const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, processCenters } = require('../scripts/monthly-attentions.cjs');

test('período por defecto usa Chile incluso en cambio de mes UTC', () => {
  const options = parseArgs([], new Date('2026-12-01T01:00:00Z'));
  assert.equal(options.month, 11);
  assert.equal(options.year, 2026);
  assert.equal(options.execute, false);
});

test('valida opciones y permite varios centros', () => {
  assert.throws(() => parseArgs(['--month', '11']), /juntos/);
  assert.throws(() => parseArgs(['--month', '13', '--year', '2026']), /mes/);
  assert.throws(() => parseArgs(['--center']), /Falta valor/);
  assert.throws(() => parseArgs(['--invalid']), /desconocida/);
  assert.deepEqual(parseArgs(['--center', 'a', '--center', 'b', '--center', 'a']).centers, ['a', 'b']);
});

test('solo día 1 usa mes anterior; desde el 2 usa actual; enero cambia el año', () => {
  for (const [date, month, year] of [
    ['2026-11-01', 10, 2026], ['2026-11-02', 11, 2026], ['2026-11-03', 11, 2026],
    ['2026-11-04', 11, 2026], ['2027-01-01', 12, 2026],
    ['2027-01-02', 1, 2027], ['2027-01-03', 1, 2027], ['2027-01-04', 1, 2027],
  ]) {
    const options = parseArgs(['--show-period', '--date', date]);
    assert.equal(options.month, month, date);
    assert.equal(options.year, year, date);
  }
});

test('el límite del día 1 al 2 se evalúa en Chile, no en UTC', () => {
  assert.equal(parseArgs([], new Date('2026-11-02T02:59:59Z')).month, 10);
  assert.equal(parseArgs([], new Date('2026-11-02T03:00:00Z')).month, 11);
});

test('período explícito prevalece y la simulación nunca permite envío', () => {
  const options = parseArgs(['--month', '8', '--year', '2025'], new Date('2026-11-01T15:00:00Z'));
  assert.equal(options.month, 8);
  assert.equal(options.year, 2025);
  assert.equal(options.periodSource, 'explicit');
  assert.throws(() => parseArgs(['--show-period', '--date', '2026-02-30']), /inválida/);
  assert.throws(() => parseArgs(['--date', '2026-11-01', '--execute']), /solo se permite/);
  assert.throws(() => parseArgs(['--show-period', '--execute']), /no permite/);
});

test('revisión filtra pacientes sin registros y nunca envía', async () => {
  let submits = 0;
  const result = await processCenters([{ name: 'a' }], parseArgs([]), {
    getPatients: async () => [{ _id: '1' }, { _id: '2' }],
    getRecords: async id => id === '1' ? [{}] : [],
    submit: async () => { submits++; },
  }, async () => {});
  assert.equal(submits, 0);
  assert.equal(result.centers[0].eligible, 1);
  assert.equal(result.failed, false);
});

test('continúa después de fallo de centro y detecta errores por paciente', async () => {
  const calls = [];
  const snapshots = [];
  const result = await processCenters([{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    parseArgs(['--execute']), {
      getPatients: async () => [{ _id: '1' }],
      getRecords: async () => [{}],
      submit: async center => {
        calls.push(center);
        if (center === 'a') throw new Error('No conecta');
        return [{ patientId: '1', status: center === 'b' ? 'error' : 'success' }];
      },
    }, async summary => snapshots.push(JSON.parse(JSON.stringify(summary))));
  assert.deepEqual(calls, ['a', 'b', 'c']);
  assert.deepEqual(result.centers.map(c => c.status), ['failed', 'errors', 'completed']);
  assert.equal(result.failed, true);
  assert.ok(result.finishedAt);
  assert.equal(snapshots.length, 7);
});

test('envía lotes de 10 secuenciales, sin duplicar consulta de atenciones y guarda progreso', async () => {
  const batches = [];
  const pauses = [];
  const snapshots = [];
  let running = false;
  const result = await processCenters([{ name: 'a' }], parseArgs(['--execute']), {
    getPatients: async () => Array.from({ length: 23 }, (_, i) => ({ _id: String(i) })),
    getRecords: async () => { throw new Error('No se debe consultar dos veces'); },
    submit: async (center, ids) => {
      assert.equal(running, false);
      running = true;
      await Promise.resolve();
      batches.push(ids);
      running = false;
      return ids.map(patientId => ({ patientId, status: 'success' }));
    },
    sleep: async ms => pauses.push(ms),
  }, async summary => snapshots.push(JSON.parse(JSON.stringify(summary))));
  assert.deepEqual(batches.map(ids => ids.length), [10, 10, 3]);
  assert.equal(new Set(batches.flat()).size, 23);
  assert.deepEqual(pauses, [5000, 5000]);
  assert.equal(result.centers[0].eligible, 23);
  assert.equal(result.centers[0].batchesCompleted, 3);
  assert.equal(snapshots[1].centers[0].results.length, 10);
  assert.equal(result.failed, false);
});

test('valida tamaño y pausa de lotes', () => {
  assert.throws(() => parseArgs(['--batch-size', '0']), /batch-size/);
  assert.throws(() => parseArgs(['--batch-size', '101']), /batch-size/);
  assert.throws(() => parseArgs(['--pause-seconds', '-1']), /pause-seconds/);
  const options = parseArgs(['--batch-size', '5', '--pause-seconds', '10']);
  assert.equal(options.batchSize, 5);
  assert.equal(options.pauseSeconds, 10);
});

test('terminal delega todo el centro a un único job compartido y guarda avances', async () => {
  let starts = 0;
  const snapshots = [];
  const results = Array.from({ length: 23 }, (_, n) => ({ patientId: String(n), status: 'success' }));
  const result = await processCenters([{ name: 'a' }], parseArgs(['--execute']), {
    getPatients: async () => results.map(r => ({ _id: r.patientId })),
    submitCenter: async (center, ids, month, year, progress) => {
      starts++;
      assert.equal(ids.length, 23);
      await progress({ _id: 'shared', processed: 10, results: results.slice(0, 10) });
      await progress({ _id: 'shared', processed: 23, results });
      return results;
    },
  }, async summary => snapshots.push(JSON.parse(JSON.stringify(summary))));
  assert.equal(starts, 1);
  assert.equal(result.centers[0].jobId, 'shared');
  assert.equal(result.centers[0].batchesCompleted, 3);
  assert.equal(result.centers[0].eligible, 23);
  assert.ok(snapshots.some(s => s.centers[0]?.results.length === 10));
});
