const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Типограф (tools/typograf.py) держит тексты по правилам DESIGN.md, «4. Тексты». Тест падает, если в исходниках
// появилась «ё», точка в конце подписи, висячий предлог или тире без привязки. Чинится одной командой:
// python3 tools/typograf.py (ее же первым шагом запускает python3 build.py).
const tool = path.join(__dirname, '../tools/typograf.py');
const run = flag => spawnSync('python3', ['-B', tool, flag], { encoding: 'utf8' });

test('the typograph itself handles the sample texts', () => {
  const r = run('--selftest');
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('interface and landing texts follow the typography rules', () => {
  const r = run('--check');
  assert.equal(r.status, 0, '\n' + r.stdout + r.stderr);
});
