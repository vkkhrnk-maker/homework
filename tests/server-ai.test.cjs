const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/homework.html'), 'utf8');
const between = (a, b) => source.slice(source.indexOf(a), source.indexOf(b));
const serverCode = between('/* SERVER_AI_START', '/* SERVER_AI_END */');
const chooser = between('async function lessonAI(', '/* режим главной:');
const looseJSON = between('function parseJSONLoose(', '/* Media stays in every provider retry');

function transport({ reply, online = true, host = 'vkkhrnk-maker.github.io', store = {} } = {}) {
  const sent = [];
  const ctx = {
    AbortController, setTimeout: () => 1, clearTimeout() {}, crypto: globalThis.crypto, Uint8Array,
    location: { hostname: host }, navigator: { onLine: online },
    lsGet: key => store[key] || '', lsSet: (key, value) => { store[key] = value; },
    fetch: async (url, opts) => {
      sent.push({ url, opts, body: JSON.parse(opts.body) });
      if (reply instanceof Error) throw reply;
      if (typeof reply === 'function') return reply(opts);
      return { status: reply.status ?? 200, text: async () => reply.text };
    }
  };
  vm.createContext(ctx);
  vm.runInContext(`${looseJSON}\n${serverCode}\nglobalThis.api={serverJSON,deviceId,aiServerURL};`, ctx);
  return { ...ctx.api, sent, store };
}

test('without a key the lesson request goes to the Learny server with the task, device label, text and files, and no key', async () => {
  const h = transport({ reply: { text: '{"wait":8}\n{"wait":16}\n{"ok":true,"text":"{\\"title\\":\\"From server\\"}"}\n' } });
  const media = [{ mime: 'application/pdf', data: 'TEST_PDF', name: 'private-name.pdf', url: 'blob:x' }];
  const lesson = await h.serverJSON('Build a lesson', { task: 'lesson', media });
  assert.equal(lesson.title, 'From server');
  const { url, opts, body } = h.sent[0];
  assert.equal(url, 'https://homework-sync-vika.fly.dev/api/ai');
  assert.deepEqual(Object.keys(opts.headers), ['Content-Type']);
  assert.deepEqual(Object.keys(body).sort(), ['device', 'media', 'prompt', 'task']);
  assert.equal(body.task, 'lesson'); assert.equal(body.prompt, 'Build a lesson');
  assert.deepEqual(body.media, [{ mime: 'application/pdf', data: 'TEST_PDF' }]);
  assert.match(body.device, /^[a-f0-9]{32}$/);
  assert.equal(h.deviceId(), body.device);
});

test('server refusals become messages the learner can act on', async () => {
  const cases = [
    [{ status: 429, text: '{"error":"device_limit"}' }, 'quota_device'],
    [{ status: 429, text: '{"error":"daily_limit"}' }, 'quota_day'],
    [{ status: 503, text: '{"error":"no_key"}' }, 'server_down'],
    [{ status: 503, text: '{"error":"busy"}' }, 'server_busy'],
    [{ status: 413, text: '{"error":"too_large"}' }, 'prompt_too_large'],
    [{ status: 403, text: '{"error":"origin"}' }, 'server_down'],
    [{ status: 200, text: '{"wait":8}\n{"error":"timeout"}\n' }, 'upstream_error'],
    [{ status: 200, text: '{"error":"refused"}' }, 'refused'],
    [{ status: 502, text: '<html>Bad gateway</html>' }, 'server_down'],
    [{ status: 200, text: '{"ok":true,"text":"not json"}' }, 'invalid_json'],
  ];
  for (const [reply, code] of cases) await assert.rejects(transport({ reply }).serverJSON('x', { task: 'lesson' }), e => e.code === code, code);
  await assert.rejects(transport({ reply: new TypeError('Failed to fetch') }).serverJSON('x'), e => e.code === 'server_down');
  await assert.rejects(transport({ reply: new TypeError('Failed to fetch'), online: false }).serverJSON('x'), e => e.code === 'offline');
});

test('stopping the request reports a cancel, not a server failure', async () => {
  const controller = new AbortController();
  const h = transport({ reply: opts => new Promise((_, reject) => opts.signal.addEventListener('abort', () => reject(new Error('aborted')))) });
  const pending = h.serverJSON('x', { task: 'lesson', signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, e => e.code === 'cancelled');
});

test('another server address works only on a local page', () => {
  const store = { 'et-ai-server': 'http://127.0.0.1:8787/' };
  assert.equal(transport({ host: 'localhost', store }).aiServerURL(), 'http://127.0.0.1:8787');
  assert.equal(transport({ host: 'vkkhrnk-maker.github.io', store }).aiServerURL(), 'https://homework-sync-vika.fly.dev');
});

function choose({ keys = {}, provider = 'gemini', sample = null } = {}) {
  const calls = [];
  const ctx = {
    claudeCap: async () => sample, aiProvider: () => provider, KEY_GEMINI: 'g', KEY_CLAUDE: 'c',
    lsGet: key => keys[key] || '', aiKey: () => keys[provider === 'claude' ? 'c' : 'g'] || '',
    serverJSON: async (prompt, opts) => { calls.push(['server', opts]); return { via: 'server' }; },
    geminiJSON: async (prompt, opts) => { calls.push(['gemini', opts]); if (ctx.geminiFails) throw { code: 'rate_limited' }; return { via: 'gemini' }; },
    claudeJSON: async (prompt, opts) => { calls.push(['claude', opts]); return { via: 'claude' }; }
  };
  vm.createContext(ctx);
  vm.runInContext(chooser + ';globalThis.getAI=lessonAI;', ctx);
  return { ctx, calls };
}

test('the server is the default path and carries the kind of task for its limits', async () => {
  const { ctx, calls } = choose();
  const ai = await ctx.getAI({ task: 'lesson' });
  assert.equal(ai.server, true);
  assert.equal((await ai.json('Build', { media: undefined })).via, 'server');
  const files = await ctx.getAI({ requireMedia: true, task: 'extract' });
  await files.json('Read', { media: [{ mime: 'image/png', data: 'TEST' }] });
  await (await ctx.getAI()).json('Translate', { quick: true });
  assert.deepEqual(calls.map(([via, opts]) => [via, opts.task]), [['server', 'lesson'], ['server', 'extract'], ['server', 'quick']]);
});

test('a saved key keeps the direct path as the fallback and never touches the server', async () => {
  const one = choose({ keys: { g: 'TEST_KEY' } });
  assert.equal((await (await one.ctx.getAI({ task: 'lesson' })).json('Build', {})).via, 'gemini');
  const both = choose({ keys: { g: 'TEST_KEY', c: 'TEST_KEY' } });
  both.ctx.geminiFails = true;
  assert.equal((await (await both.ctx.getAI({ task: 'lesson' })).json('Build', {})).via, 'claude');
  const claudeOnly = choose({ keys: { c: 'TEST_KEY' }, provider: 'claude' });
  assert.equal((await (await claudeOnly.ctx.getAI({ requireMedia: true, task: 'extract' })).json('Read', {})).via, 'claude');
  for (const h of [one, both, claudeOnly]) assert.ok(h.calls.every(([via]) => via !== 'server'));
});

test('a lesson returned by the server passes through the same cleaning as any AI answer', async () => {
  const dirty = { title: '<img src=x onerror="steal()">Modals', level: 'B1', theory: [{ name: '<script>bad()</script>can', gloss: { ru: '<b>ок</b>', en: '<a href="javascript:x">link</a>' }, uses: [{ name: 'Use', ex: ['I <b>can</b> swim<iframe>'] }] }] };
  const h = transport({ reply: { text: JSON.stringify({ ok: true, text: JSON.stringify(dirty) }) } });
  const raw = await h.serverJSON('Build', { task: 'lesson' });
  const ctx = { UI: { speakDefault: '', tipsDefault: '' }, plural: () => '', stripTags: s => String(s).replace(/<[^>]+>/g, ''), flattenSpeak: () => [], raw };
  vm.createContext(ctx);
  vm.runInContext(between('function safe(', 'let LESSONS = BUILTIN_LESSONS') + ';globalThis.lesson=buildLesson({id:"u-1",createdAt:0,lesson:raw});', ctx);
  const built = JSON.stringify(ctx.lesson);
  for (const bad of ['<img', '<script', '<iframe', '<a ']) assert.ok(!built.includes(bad), bad);
  assert.ok(built.includes('<b>can</b>'));
  assert.equal(ctx.lesson.own, true);
});

test('when a lesson cannot be created now, the way out appears next to the message and leaves with the next attempt', () => {
  const els = {};
  const $ = selector => els[selector] ||= { hidden: false, dataset: {}, textContent: '', classList: { toggle() {} } };
  const ctx = { $, $$: () => [], t: key => key, document: { documentElement: { dataset: { intake: 'unified' } } }, materialDraft: { operation: '' } };
  vm.createContext(ctx);
  vm.runInContext(between('const PARSE_ERRORS =', '/* ---- кто разбирает:') + ';globalThis.api={parseHint,setParsing,PARSE_ERRORS};', ctx);
  $('#parse-fallback').hidden = true;
  for (const code of ['quota_device', 'quota_day', 'server_down']) {
    ctx.api.parseHint(ctx.api.PARSE_ERRORS[code], true);
    assert.equal($('#parse-fallback').hidden, false, code);
    ctx.api.parseHint('parseHint');
    assert.equal($('#parse-fallback').hidden, true);
  }
  ctx.api.parseHint(ctx.api.PARSE_ERRORS.server_busy, true);
  assert.equal($('#parse-fallback').hidden, true);
  ctx.api.parseHint('aiServerDown', true); ctx.api.setParsing(true);
  assert.equal($('#parse-fallback').hidden, true);
});

test('the new messages and actions exist in both languages and no key is baked into the page', () => {
  const ui = between('aiQuotaDevice:', 'modeMaterial:');
  for (const key of ['aiQuotaDevice', 'aiQuotaDay', 'aiServerDown', 'aiServerBusy', 'aiLimitShort', 'aiDownShort', 'aiServer', 'aiSheetServer', 'fallbackDemo', 'fallbackKey', 'fileSendServer'])
    assert.match(ui, new RegExp(key + '\\s*:\\s*\\{\\s*ru: "[^"]+",\\s*en: "[^"]+"'), key);
  assert.doesNotMatch(source, /AIza[0-9A-Za-z_-]{20,}|sk-ant-[0-9A-Za-z_-]{20,}/);
});

test('words around a gap never glue to the answer, and punctuation or contractions stay attached', () => {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(between('function gapSpaces(', '/* ответ Claude') + ';globalThis.gapSpaces=gapSpaces;', ctx);
  const fix = (a, b) => Array.from(ctx.gapSpaces([a, b]));
  assert.deepEqual(fix('My family', 'live in a small village.'), ['My family ', ' live in a small village.']);
  assert.deepEqual(fix('I ', ' my keys yesterday.'), ['I ', ' my keys yesterday.']);
  assert.deepEqual(fix('', 'play any instruments?'), ['', ' play any instruments?']);
  assert.deepEqual(fix('She said she', ', but nobody came.'), ['She said she ', ', but nobody came.']);
  assert.deepEqual(fix('He (', ') left.'), ['He (', ') left.']);
  assert.deepEqual(fix('It', "'s been raining."), ['It ', "'s been raining."]);
  assert.deepEqual(fix('They <b>really</b>', 'it.'), ['They <b>really</b> ', ' it.']);
  assert.deepEqual(fix('Wait', ''), ['Wait ', '']);
});

test('a verb repeated right after a multi-word answer is removed, single-word answers are left alone', () => {
  const ctx = { stripTags: s => String(s).replace(/<[^>]+>/g, '') }; vm.createContext(ctx);
  vm.runInContext(between('function gapSpaces(', '/* ответ Claude') + ';globalThis.raw=(s,a)=>gapSpaces(gapEcho(s,a));', ctx);
  ctx.fix = (s, a) => Array.from(ctx.raw(s, a));
  assert.deepEqual(ctx.fix(['There ', ' be a cinema in our town.'], 'used to be'), ['There ', ' a cinema in our town.']);
  assert.deepEqual(ctx.fix(['I ', ' believe in fairy tales.'], 'used to believe'), ['I ', ' in fairy tales.']);
  assert.deepEqual(ctx.fix(['My family ', ' live in a village.'], 'used to'), ['My family ', ' live in a village.']);
  assert.deepEqual(ctx.fix(['She ', ' been to Italy.'], 'has never been'), ['She ', ' to Italy.']);
  assert.deepEqual(ctx.fix(['He said ', ' that day.'], 'that'), ['He said ', ' that day.']);
  assert.deepEqual(ctx.fix(['They ', ' better now.'], 'used to be'), ['They ', ' better now.']);
});
