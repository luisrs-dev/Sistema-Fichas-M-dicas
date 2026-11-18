const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cheerio = require('cheerio');

function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, console,
    require: name => dependencies[name] || {}, ...globals });
  return module.exports;
}

// Mismo formato de SISTRAT: celdas th e id=fmensual repetido por paciente.
function row(name, code, attributes) {
  return `<tr><th>1</th><th>${name}</th><th>${code}</th><th></th><th></th><th>${attributes === null ? '' : `<span id="fmensual" name="fmensual" ${attributes}></span>`}</th></tr>`;
}
function fixture(rows) {
  const $ = cheerio.load(`<table id="table_pacientes"><tr><th>Usuario activo</th></tr>${rows}</table>`);
  const clicked = [];
  const collection = values => ({ length: values.length, item: i => values[i] });
  const document = { getElementById: () => ({ rows: collection($('#table_pacientes tr').toArray().map(tr => ({
    cells: collection($(tr).children('th,td').toArray().map(cell => ({
      innerText: $(cell).text(), querySelector: selector => {
        const button = $(cell).find(selector).first();
        if (!button.length) return null;
        return {
          classList: { contains: name => button.hasClass(name) },
          closest: selector => button.closest(selector).length ? {} : null,
          getAttribute: name => button.attr(name) ?? null,
          click: () => clicked.push($(tr).children().eq(2).text()),
        };
      },
    }))),
  }))) }) };
  return { ...load('services/sistrat/monthlySheetButton.ts', {}, { document }), clicked };
}

test('icono cancel sin onclick se informa bloqueado y no se hace clic', () => {
  const f = fixture(row('PACIENTE&nbsp;BLOQUEADO', 'BLOCKED', 'class="ui-icon ui-icon-cancel button b4"'));
  assert.equal(f.openMonthlySheetButton('pacientebloqueado', 'BLOCKED'), 'BLOCKED');
  assert.equal(f.clicked.length, 0);
});

for (const icon of ['ui-icon-document', 'ui-icon-circle-plus']) {
  test(`${icon} con onclick sigue habilitado; no confundir con otro paciente bloqueado`, () => {
    const f = fixture(row('Bloqueado', 'BLOCKED', 'class="ui-icon-cancel b4"')
      + row('Habilitado', 'ENABLED', `class="ui-icon ${icon} button" onclick="fmensual(123);"`));
    assert.equal(f.openMonthlySheetButton('habilitado', 'ENABLED'), 'OPENED');
    assert.deepEqual(f.clicked, ['ENABLED']);
  });
}

test('botones deshabilitados y sin acción no se intentan abrir', () => {
  for (const attrs of ['class="ui-icon-document"', 'onclick="fmensual(1)" aria-disabled="true"',
    'onclick="fmensual(1)" class="ui-state-disabled"', 'onclick="fmensual(1)" disabled']) {
    const f = fixture(row('Paciente', 'CODE', attrs));
    assert.equal(f.openMonthlySheetButton('paciente', 'CODE'), 'BLOCKED');
    assert.equal(f.clicked.length, 0);
  }
});

test('distingue botón ausente de paciente no encontrado', () => {
  const f = fixture(row('Paciente', 'CODE', null));
  assert.equal(f.openMonthlySheetButton('paciente', 'CODE'), 'BUTTON_NOT_FOUND');
  assert.equal(f.openMonthlySheetButton('otro', 'OTHER'), 'NOT_FOUND');
});

test('registro masivo devuelve mensaje del bloqueo sin esperar tabla y continúa con el siguiente paciente', async () => {
  const helper = fixture(row('Paciente Bloqueado', 'BLOCKED', 'class="ui-icon-cancel b4"')
    + row('Paciente Habilitado', 'ENABLED', 'class="ui-icon-document" onclick="fmensual(123)"'));
  let waits = 0, closes = 0;
  const { default: Sistrat } = load('services/sistrat/sistrat.class.ts', {
    './monthlySheetButton': helper,
    '../scrapper': class {
      async waitForSeconds() {}
      async closeBrowser() { closes++; }
    },
  });
  const sistrat = new Sistrat();
  sistrat.login = async () => ({ on() {}, evaluate: (fn, ...args) => fn(...args),
    waitForSelector: async () => { waits++; throw new Error('Espera del paciente habilitado'); } });
  sistrat.openActiveUsersList = async () => {};
  const patient = (code, surname) => ({ _id: code, name: 'Paciente', surname, secondSurname: '', codigoSistrat: code });
  const results = await sistrat.bulkRecordMonthlySheets([
    { patient: patient('BLOCKED', 'Bloqueado'), records: [{}] },
    { patient: patient('ENABLED', 'Habilitado'), records: [{}] },
  ], 'centro', 11, 2026);
  assert.equal(results[0].status, 'error');
  assert.equal(results[0].message, helper.MONTHLY_SHEET_BLOCKED_MESSAGE);
  assert.equal(results[1].patientId, 'ENABLED');
  assert.equal(waits, 1);
  assert.equal(closes, 1);
});
