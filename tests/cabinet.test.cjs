const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/homework.html'), 'utf8');
function functionsBetween(first, next) {
  return source.slice(source.indexOf('function ' + first + '('), source.indexOf('function ' + next + '('));
}

test('a saved question from before the cabinet resumes at its stage, including skipped questions', () => {
  const lesson = { id: 'old' };
  const progress = { theorySeen: true, drill: { i: 3 }, match: { i: 0 } };
  const context = vm.createContext({ S: { progress: { old: progress } }, stepProgress: () => [
    { key: 'theory', label: 'Theory', n: 1 }, { key: 'drill', label: 'Practice', n: 0, total: 40 },
    { key: 'match', label: 'Mini-dialogues', n: 0, total: 10 }
  ], t: (key, i, n) => key === 'qCounter' ? `Question ${i} of ${n}` : key });
  vm.runInContext(functionsBetween('startedLesson','lessonResumeText'), context);
  assert.equal(context.startedLesson(lesson), true);
  assert.equal(context.savedPosition(lesson), 'Practice · Question 4 of 40');
  progress.lastStage = 'match';
  assert.equal(context.savedPosition(lesson), 'Mini-dialogues · Question 1 of 10');
});

test('the first sample offers four choices including both accepted answers and later questions keep the full set', () => {
  const chips = ['can', 'must', 'should', 'may', 'have to', 'ought to'];
  const lesson = { id: 'modals', drill: { chips, items: [{ a: ['must'], also: ['have to'] }] } };
  const context = vm.createContext({ document: { documentElement: { hasAttribute: () => true } } });
  vm.runInContext(functionsBetween('drillChoices','renderDrill'), context);
  assert.deepEqual(Array.from(context.drillChoices(lesson, 0)), ['can', 'must', 'have to', 'ought to']);
  assert.equal(context.drillChoices(lesson, 1), chips);
});

test('preview navigations under a project subpath cannot overwrite its offline home', async () => {
  const scope = 'https://localhost/homework/';
  const handlers = {}, writes = [];
  const worker = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  vm.runInNewContext(worker, {
    URL,
    self: { registration: { scope }, addEventListener: (type, fn) => { handlers[type] = fn; } },
    fetch: async () => ({ ok: true, clone() { return this; } }),
    caches: { open: async () => ({ put: async key => writes.push(key) }) }
  });
  function navigate(pathname) {
    let response;
    handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: scope + pathname }, respondWith(promise) { response = promise; } });
    return response;
  }
  for (const preview of ['learny-calm.html', 'learny-calm-c.html', 'calm-preview/index.html']) assert.equal(navigate(preview), undefined);
  await navigate('');
  assert.deepEqual(writes, ['index.html']);
});
