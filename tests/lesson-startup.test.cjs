// Свои уроки собираются при загрузке страницы (rebuildLessons() сразу после объявления).
// Всё, что зовет buildLesson, должно быть объявлено выше этого вызова или быть функцией (она поднимается):
// иначе сборка падает, урок молча выпадает из списка и пропадает после обновления страницы.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('helpers used by buildLesson exist before the startup rebuild', () => {
  const src = fs.readFileSync(path.join(__dirname, '../src/homework.html'), 'utf8');
  const lines = src.split('\n');
  const start = lines.findIndex(l => l.startsWith('function buildLesson('));
  const end = lines.findIndex((l, i) => i > start && l === '}');
  const boot = lines.findIndex(l => l.trim() === 'rebuildLessons();');
  assert.ok(start > 0 && end > start && boot > end, 'buildLesson and the startup rebuild are found');
  const body = lines.slice(start + 1, end).join('\n');
  const called = new Set([...body.matchAll(/\b([A-Za-z_$][\w$]*)\(/g)].map(m => m[1]));
  const late = [];
  for (const name of called) {
    const decl = lines.findIndex(l => new RegExp(`^(const|let)\\s+${name.replace('$', '\\$')}\\s*=`).test(l));
    if (decl > boot) late.push(`${name} (line ${decl + 1})`);
  }
  assert.deepEqual(late, [], 'declared with const/let after rebuildLessons(): ' + late.join(', '));
});
