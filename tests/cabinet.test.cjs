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

test('every question offers four choices: the answer, one accepted alternative, the trap word and neighbours', () => {
  const chips = ['can', 'must', 'should', 'may', 'have to', 'might', 'could', 'ought to'];
  const lesson = { id: 'modals', drill: { chips, items: [
    { a: ['must'], also: ['have to'] },
    { a: ['could'], also: ['can', 'may'], trap: { word: 'might' } }
  ] } };
  const context = vm.createContext({ document: { documentElement: { hasAttribute: () => true } } });
  vm.runInContext(functionsBetween('drillChoices','gapWord'), context);
  assert.deepEqual(Array.from(context.drillChoices(lesson, 0)), ['can', 'must', 'have to', 'ought to']);
  const second = Array.from(context.drillChoices(lesson, 1));
  assert.equal(second.length, 4);
  assert.ok(second.includes('could') && second.includes('can') && second.includes('might'));
  assert.ok(!second.includes('may'), 'only one accepted alternative is offered');
  assert.deepEqual(Array.from(context.drillChoices(lesson, 1)), second);
  assert.equal(context.drillChoices({ drill: { chips: chips.slice(0, 4), items: [{ a: ['must'] }] } }, 0).length, 4);
});

test('a sample lesson joins the cabinet after the first task, an own lesson as soon as it is opened', () => {
  const steps = () => [{ key: 'theory', n: 1 }, { key: 'drill', n: 0, total: 40 }];
  const context = vm.createContext({ S: { progress: { sample: { theorySeen: true, lastStage: 'theory' }, mine: { theorySeen: true } } }, stepProgress: steps });
  vm.runInContext(functionsBetween('startedLesson','savedStage'), context);
  assert.equal(context.startedLesson({ id: 'sample' }), false);
  assert.equal(context.startedLesson({ id: 'mine', own: true }), true);
  context.S.progress.sample.drill = { i: 1 };
  assert.equal(context.startedLesson({ id: 'sample' }), true);
});

test('the gap keeps an accepted alternative and starts a sentence with a capital letter', () => {
  const context = vm.createContext({ norm: s => String(s).trim().toLowerCase(), stripTags: s => String(s).replace(/<[^>]+>/g, '') });
  vm.runInContext(functionsBetween('gapWord','renderDrill'), context);
  assert.equal(context.gapWord({ s: ['', ' you help me?'], a: ['could'], also: ['can'] }, 'bad', 'must'), 'Could');
  assert.equal(context.gapWord({ s: ['You ', ' wear a seatbelt.'], a: ['must'], also: ['have to'] }, 'also', 'Have to'), 'have to');
  assert.equal(context.gapWord({ s: ['It is late. ', ' we go?'], a: ['shall'] }, 'good', 'shall'), 'Shall');
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
