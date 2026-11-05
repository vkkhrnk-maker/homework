const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/homework.html'), 'utf8');
const fileCode = source.slice(source.indexOf('const MATERIAL_LIMITS ='), source.indexOf('/* FILE_INTAKE_END */'));
const lessonPrompts = source.slice(source.indexOf('const LESSON_FORMAT ='), source.indexOf('const PARSE_ERRORS ='));
const lessonFlow = source.slice(source.indexOf('const newMode ='), source.indexOf('function openLesson('));
const intakeQuestion = source.slice(source.indexOf('let parseCtl = null, intakeQuestion'), source.indexOf('function setParsing('));
const png = Uint8Array.from([137,80,78,71,13,10,26,10,0]);
function file(name = 'notes.png', bytes = png, size = bytes.length) {
  return { name, size, lastModified: 1, arrayBuffer: async () => bytes.slice().buffer };
}
function harness({ unifiedIntake = false } = {}) {
  const elements = new Map(), notes = [], revoked = [], stored = [], env = { mode: 'material', keys: {}, sheets: [] };
  const el = selector => {
    if (!elements.has(selector)) elements.set(selector, { value: '', hidden: false, innerHTML: '', textContent: '', listeners: {}, classList: { add() {}, remove() {} }, addEventListener(name, fn) { this.listeners[name] = fn; }, contains() { return false; }, click() {}, focus() { env.focused=selector; }, scrollIntoView() {} });
    return elements.get(selector);
  };
  const ctx = {
    Uint8Array, Blob, AbortController, btoa, setTimeout, clearTimeout,
    URL: { createObjectURL: () => `blob:${Math.random()}`, revokeObjectURL: u => revoked.push(u) },
    Image: class { constructor() { this.naturalWidth = 100; this.naturalHeight = 100; } decode() { return env.decode ? env.decode(this) : Promise.resolve(); } },
    $: el, $$: selector => selector === '[data-file-remove]' ? [...el('#material-files').innerHTML.matchAll(/data-file-remove="(\d+)"/g)].map(m => { const b=el('remove:'+m[1]); b.dataset={fileRemove:m[1]}; return b; }) : [],
    document: { addEventListener() {} }, UI: new Proxy({}, { get: (_,key) => String(key).startsWith('file') ? true : undefined }),
    S: { lang: 'en' }, unifiedIntake, AI_NAMES: {gemini:'Gemini',claude:'Claude'}, KEY_GEMINI:'g',KEY_CLAUDE:'c',
    aiProvider:()=>env.provider||'gemini',lsGet:key=>env.keys[key]||'', lessonAI:async()=>env.ai||null,
    keySheet:(...args)=>env.sheets.push(args),PARSE_ERRORS:{rate_limited:'parseBusy',bad_key:'parseBadKey'},
    t: (key,...args) => key==='fileHeading' ? 'Material from: '+args[0] : key,
    newMode: () => env.mode, setParsing: on => {env.busy=on;}, parseHint: (key, error) => notes.push({ key, error }),
    withTimeout: promise => promise,
    save() {}, buildLesson: ({lesson}) => assert.ok(lesson.title),
    storeLesson: async record => { stored.push(record); return true; },
    openLesson: id => { env.opened = id; }
  };
  vm.createContext(ctx);
  vm.runInContext(`${intakeQuestion}\n${fileCode}\n${unifiedIntake ? lessonPrompts + lessonFlow : ""}
    globalThis.intake={materialMime,materialSelectionError,materialBase64,materialEsc,materialWait,extractedMaterialText,appendMaterialText,addMaterialFiles,extractMaterial,renderMaterialFiles,clearMaterialFiles,files:()=>materialDraft.files,cancel:()=>parseCtl?.abort(),limits:MATERIAL_LIMITS,parseLesson:typeof parseLesson==="function"?parseLesson:null};`, ctx);
  return { ...ctx.intake, env, notes, revoked, el, stored, state: ctx.S };
}

test('detects supported formats from bytes, not a spoofed filename or MIME', () => {
  const h = harness();
  assert.equal(h.materialMime(png), 'image/png');
  assert.equal(h.materialMime(Uint8Array.from([255,216,255,224])), 'image/jpeg');
  assert.equal(h.materialMime(new TextEncoder().encode('RIFF1234WEBP')), 'image/webp');
  assert.equal(h.materialMime(new TextEncoder().encode('%PDF-1.4\n')), 'application/pdf');
  assert.equal(h.materialMime(new TextEncoder().encode('<svg onload="bad()">')), '');
});

test('rejects empty, oversized, mixed PDF and duplicate selections before extraction', () => {
  const h = harness();
  assert.equal(h.materialSelectionError([file('empty.png', png, 0)]), 'fileEmpty');
  assert.equal(h.materialSelectionError([file('large.png', png, 10*1024*1024+1)]), 'fileSize');
  assert.equal(h.materialSelectionError(Array.from({length:6},(_,i)=>file(`${i}.png`))), 'fileCount');
  assert.equal(h.materialSelectionError([{...file('one.pdf'),mime:'application/pdf'},file()]), 'fileCount');
  assert.equal(h.materialSelectionError([file(),file()]), 'fileDuplicate');
  assert.equal(h.materialSelectionError([file('1.png'),file('2.png')]), '');
});

test('base64 round-trips binary and filenames are escaped for the attachment list', () => {
  const h = harness(), bytes = Uint8Array.from([0,255,128,1,2,3]);
  assert.deepEqual([...Buffer.from(h.materialBase64(bytes),'base64')], [...bytes]);
  assert.equal(h.materialEsc('<img src=x onerror="bad()">'), '&lt;img src=x onerror=&quot;bad()&quot;&gt;');
});

test('adds a validated image and preserves it when switching to My topic', async () => {
  const h=harness(); await h.addMaterialFiles([file()]);
  assert.equal(h.files().length,1); assert.equal(h.files()[0].mime,'image/png');
  assert.equal(h.el('#parse-btn').textContent,'fileExtract');
  h.env.mode='topic'; h.renderMaterialFiles();
  assert.equal(h.files().length,1);
  h.env.mode='material'; h.renderMaterialFiles();
  assert.equal(h.el('#material-files').hidden,false);
});

test('a failed batch is atomic and leaves the previous attachment and typed text intact', async () => {
  const h=harness(); h.el('#paste-area').value='Teacher notes'; await h.addMaterialFiles([file('existing.png')]);
  await h.addMaterialFiles([file('valid.png'),file('bad.txt',new TextEncoder().encode('hello'))]);
  assert.deepEqual(Array.from(h.files(),f=>f.name),['existing.png']);
  assert.equal(h.el('#paste-area').value,'Teacher notes');
  assert.equal(h.notes.at(-1).key,'fileType');
  assert.equal(h.revoked.length,1);
});

test('cancelling validation preserves earlier attachments and text, without leaking a preview URL', async () => {
  const h=harness(); await h.addMaterialFiles([file('existing.png')]); h.el('#paste-area').value='Keep this';
  let release; h.env.decode=()=>new Promise(resolve=>{release=resolve;});
  const adding=h.addMaterialFiles([file('new.png')]);
  await new Promise(resolve=>setImmediate(resolve));
  h.cancel(); release(); await adding;
  assert.deepEqual(Array.from(h.files(),f=>f.name),['existing.png']);
  assert.equal(h.el('#paste-area').value,'Keep this');
  assert.equal(h.notes.at(-1).key,'fileStopped');
  assert.equal(h.revoked.length,1);
});

test('removing an attachment leaves edited text intact and revokes the preview', async () => {
  const h=harness(); await h.addMaterialFiles([file()]); h.el('#paste-area').value='Edited recognised text';
  h.el('remove:'+h.files()[0].id).listeners.click();
  assert.equal(h.files().length,0); assert.equal(h.el('#paste-area').value,'Edited recognised text');
  assert.equal(h.revoked.length,1);
});

test('recognised pages keep order and exercise blanks, while malformed or partial results fail', () => {
  const h=harness();
  assert.equal(h.extractedMaterialText({pages:[{page:1,text:'We ____ tomorrow.\r\n'},{page:2,text:'Choose a form.'}]},2),'We ____ tomorrow.\n\nChoose a form.');
  assert.throws(()=>h.extractedMaterialText({pages:[{page:2,text:'Out of order'},{page:1,text:'Wrong'}]},2),e=>e.code==='invalid_json');
  assert.throws(()=>h.extractedMaterialText({pages:[{page:1,text:'Only first page'}]},2),e=>e.code==='invalid_json');
  assert.throws(()=>h.extractedMaterialText({pages:[{page:1,text:'  '}]},1),e=>e.code==='fileNoText');
});

test('appending recognised files preserves typed notes and file order and refuses truncation', () => {
  const h=harness(), files=[{name:'one.png',text:'First ____'},{name:'two.png',text:'Second ____'}];
  assert.equal(h.appendMaterialText('Teacher notes',files,n=>'From '+n),'Teacher notes\n\nFrom one.png\nFirst ____\n\nFrom two.png\nSecond ____');
  assert.throws(()=>h.appendMaterialText('x'.repeat(60000),files,n=>n),e=>e.code==='fileTooLong');
});

test('without an API key extraction opens setup and keeps all files and notes',async()=>{
 const h=harness(); await h.addMaterialFiles([file()]); h.el('#paste-area').value='Notes';
 await h.extractMaterial();
 assert.equal(h.files().length,1);assert.equal(h.files()[0].inserted,false);
 assert.equal(h.el('#paste-area').value,'Notes');assert.equal(h.env.sheets.length,1);
 assert.equal(h.notes.at(-1).key,'fileNeedKey');
});

test('extraction appends to the latest edited notes and waits for a separate lesson action',async()=>{
 const h=harness(); await h.addMaterialFiles([file()]);let resolve,calls=0;
 h.env.ai={json:async(prompt,opts)=>{calls++;assert.equal(opts.media[0].mime,'image/png');return new Promise(r=>{resolve=r;});}};
 const running=h.extractMaterial();await new Promise(r=>setImmediate(r));
 h.el('#paste-area').value='Edited while reading';resolve({pages:[{page:1,text:'I ____ tomorrow.'}]});await running;
 assert.equal(h.el('#paste-area').value,'Edited while reading\n\nMaterial from: notes.png\nI ____ tomorrow.');
 assert.equal(h.files()[0].inserted,true);assert.equal(h.el('#parse-btn').textContent,'parseBtn');
 assert.equal(calls,1);assert.equal(h.env.focused,'#paste-area');
 await h.extractMaterial();assert.equal(calls,1); // no duplicate import
});

test('a transient failure keeps source files and caches earlier successes for retry without duplicates',async()=>{
 const h=harness();await h.addMaterialFiles([file('one.png'),file('two.png')]);h.el('#paste-area').value='Teacher notes';let calls=0;
 h.env.ai={json:async()=>{calls++;if(calls===2)throw{code:'rate_limited'};return{pages:[{page:1,text:calls===1?'First ____':'Second ____'}]};}};
 await h.extractMaterial();assert.equal(h.el('#paste-area').value,'Teacher notes');assert.equal(h.files().length,2);
 assert.ok(h.files()[0].text);assert.equal(h.files()[0].inserted,false);assert.equal(h.notes.at(-1).key,'parseBusy');
 await h.extractMaterial();assert.equal(calls,3);assert.equal(h.files().every(f=>f.inserted),true);
 assert.equal((h.el('#paste-area').value.match(/First ____/g)||[]).length,1);
 assert.equal((h.el('#paste-area').value.match(/Second ____/g)||[]).length,1);
});

test('cancelling a model request does not append late results or erase files',async()=>{
 const h=harness();await h.addMaterialFiles([file()]);h.el('#paste-area').value='Keep me';let resolve;
 h.env.ai={json:async()=>new Promise(r=>{resolve=r;})};const running=h.extractMaterial();await new Promise(r=>setImmediate(r));
 h.cancel();resolve({pages:[{page:1,text:'Late result'}]});await running;
 assert.equal(h.el('#paste-area').value,'Keep me');assert.equal(h.files()[0].inserted,false);
 assert.equal(h.notes.at(-1).key,'fileStopped');assert.equal(h.env.busy,false);
});

test('a topic with an unclear level waits for a choice and remembers the chosen level', async () => {
  const h = harness({ unifiedIntake: true });
  const prompts = [];
  h.state.newMode = 'topic';
  h.env.ai = { json: async prompt => {
    prompts.push(prompt);
    return prompts.length === 1 ? { needsLevel: 'topic' } : { title: 'Present Perfect', level: 'B2' };
  } };
  h.el('#paste-area').value = 'When do I use the present perfect?';
  await h.parseLesson();
  assert.equal(h.stored.length, 0);
  assert.equal(h.el('#intake-level').hidden, false);
  assert.equal(h.el('#paste-area').value, 'When do I use the present perfect?');

  await h.parseLesson('B2');
  assert.match(prompts[1], /from scratch.*level B2/);
  assert.equal(h.state.newLevel, 'B2');
  assert.equal(h.stored.length, 1);
  assert.equal(h.el('#intake-level').hidden, true);

  h.el('#paste-area').value = 'Conditionals';
  await h.parseLesson();
  assert.match(prompts[2], /saved level \(B2\)/);
  assert.equal(h.stored.length, 2);
  assert.equal(h.el('#intake-level').hidden, true);
});

test('an imported exercise stays teacher material when the learner is unsure of the level', async () => {
  const h = harness({ unifiedIntake: true });
  h.state.newMode = 'topic';
  const prompts = [];
  h.env.ai = { json: async (prompt, options) => {
    if (options.media) return { pages: [{ page: 1, text: 'She ____ yesterday.' }] };
    prompts.push(prompt);
    return prompts.length === 1 ? { needsLevel: 'material' } : { title: 'Past Simple' };
  } };
  await h.addMaterialFiles([file()]);
  await h.parseLesson();
  assert.equal(prompts.length, 0);
  assert.match(h.el('#paste-area').value, /She ____ yesterday\./);

  await h.parseLesson();
  assert.match(prompts[0], /learner provided a file/);
  assert.equal(h.el('#intake-level').hidden, false);
  await h.parseLesson('');
  assert.match(prompts[1], /teacher's homework material/);
  assert.match(prompts[1], /She ____ yesterday\./);
  assert.equal(h.state.newLevel, undefined);
  assert.equal(h.stored.length, 1);
  assert.equal(h.files().length, 0);
});

test('editing the input dismisses the level question and sends the new draft for analysis', async () => {
  const h = harness({ unifiedIntake: true });
  h.env.ai = { json: async prompt => prompt.includes('A2 articles')
    ? { title: 'Articles', level: 'A2' } : { needsLevel: 'topic' } };
  h.el('#paste-area').value = 'Articles';
  await h.parseLesson();
  assert.equal(h.el('#intake-level').hidden, false);
  h.el('#paste-area').value = 'A2 articles';
  h.el('#paste-area').listeners.input();
  assert.equal(h.el('#intake-level').hidden, true);
  await h.parseLesson();
  assert.equal(h.stored[0].lesson.level, 'A2');
  assert.equal(h.state.newLevel, undefined);
});

test('media payload helpers retain binary MIME and text, without changing audio-only or text-only input',()=>{
 const ctx={};vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('function claudeContent('),source.indexOf('async function claudeJSON('))+';globalThis.api={claudeContent,geminiParts};',ctx);
 const media=[{mime:'application/pdf',data:'TEST_PDF'},{mime:'image/png',data:'TEST_IMAGE'}];
 const c=ctx.api.claudeContent('Read',media);assert.equal(c[0].type,'document');assert.equal(c[1].type,'image');assert.equal(c[0].source.data,'TEST_PDF');assert.equal(c[2].text,'Read');
 assert.equal(ctx.api.claudeContent('Text only'),'Text only');
 const g=ctx.api.geminiParts('Read',{media,audio:{mime:'audio/wav',data:'TEST_AUDIO'}});
 assert.equal(g[0].inline_data.mime_type,'audio/wav');assert.equal(g[1].inline_data.data,'TEST_PDF');assert.equal(g[2].inline_data.data,'TEST_IMAGE');assert.equal(g[3].text,'Read');
});

test('provider fallback retains the same media and skips built-in sampling for file tasks',async()=>{
 let sampleCalls=0;const calls=[],media=[{mime:'application/pdf',data:'TEST_PDF'}];
 const ctx={claudeCap:async()=>{sampleCalls++;return{json:()=>({builtin:true})};},aiProvider:()=> 'gemini',aiKey:()=> 'TEST_KEY',lsGet:()=> 'TEST_KEY',KEY_GEMINI:'g',KEY_CLAUDE:'c',geminiJSON:async(p,o)=>{calls.push(['gemini',o.media]);throw{code:'rate_limited'};},claudeJSON:async(p,o)=>{calls.push(['claude',o.media]);return{pages:[]};}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('async function lessonAI('),source.indexOf('/* режим главной:'))+';globalThis.getAI=lessonAI;',ctx);
 const task=await ctx.getAI({requireMedia:true});await task.json('Read',{media});
 assert.equal(sampleCalls,0);assert.equal(calls.length,2);assert.equal(calls[0][1],media);assert.equal(calls[1][1],media);
 const ordinary=await ctx.getAI();assert.equal(ordinary.builtIn,true);assert.equal(sampleCalls,1);
});

test('Gemini transport keeps the PDF on model retry and uses the configured key without a live request',async()=>{
 const bodies=[],urls=[];
 const ctx={AbortController,setTimeout:(fn,ms)=>ms>=20000?123:setTimeout(fn,0),clearTimeout:()=>{},lsGet:()=> 'TEST_KEY',KEY_GEMINI:'g',
  parseJSONLoose:JSON.parse,fetch:async(url,opts)=>{urls.push(url);bodies.push(JSON.parse(opts.body));return bodies.length===1?{ok:false,status:404,json:async()=>({error:{message:'model unavailable'}})}:{ok:true,json:async()=>({candidates:[{content:{parts:[{text:'{"pages":[{"page":1,"text":"Worksheet ____"}]}'}]}}]})};}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function geminiParts('),source.indexOf('async function claudeJSON('))+source.slice(source.indexOf('async function geminiJSON('),source.indexOf('/* null — разбирать некому:'))+';globalThis.request=geminiJSON;',ctx);
 const result=await ctx.request('Transcribe',{media:[{mime:'application/pdf',data:'TEST_PDF'}]});
 assert.equal(result.pages[0].text,'Worksheet ____');assert.equal(bodies.length,2);assert.notEqual(urls[0],urls[1]);
 for(const body of bodies){assert.equal(body.contents[0].parts[0].inline_data.mime_type,'application/pdf');assert.equal(body.contents[0].parts[0].inline_data.data,'TEST_PDF');assert.equal(body.contents[0].parts[1].text,'Transcribe');}
});

test('Claude transport receives native PDF/image blocks and a full output budget for extraction',async()=>{
 let sent;
 const ctx={AbortController,setTimeout:()=>1,clearTimeout:()=>{},withTimeout:p=>p,materialWait:p=>p,parseJSONLoose:JSON.parse,claudeClient:async()=>({messages:{stream:opts=>{sent=opts;return{on(){},finalMessage:async()=>({stop_reason:'end_turn',content:[{type:'text',text:'{"pages":[{"page":1,"text":"Worksheet ____"}]}'}]})};}}})};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function claudeContent('),source.indexOf('function geminiParts('))+source.slice(source.indexOf('async function claudeJSON('),source.indexOf('async function geminiJSON('))+';globalThis.request=claudeJSON;',ctx);
 await ctx.request('Transcribe',{media:[{mime:'application/pdf',data:'TEST_PDF'},{mime:'image/png',data:'TEST_IMAGE'}]});
 assert.equal(sent.max_tokens,32000);assert.equal(sent.messages[0].content[0].type,'document');assert.equal(sent.messages[0].content[1].type,'image');assert.equal(sent.messages[0].content[2].text,'Transcribe');
});

test('cancelling while Claude SDK loads prevents a later file request',async()=>{
 let resolve,requests=0;const h=harness(),controller=new AbortController();
 const ctx={AbortController,setTimeout:()=>1,clearTimeout:()=>{},withTimeout:p=>p,materialWait:h.materialWait,parseJSONLoose:JSON.parse,claudeClient:()=>new Promise(r=>{resolve=r;})};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function claudeContent('),source.indexOf('function geminiParts('))+source.slice(source.indexOf('async function claudeJSON('),source.indexOf('async function geminiJSON('))+';globalThis.request=claudeJSON;',ctx);
 const pending=ctx.request('Read',{signal:controller.signal,media:[{mime:'application/pdf',data:'TEST_PDF'}]});
 controller.abort();await assert.rejects(pending,e=>e.code==='cancelled');
 resolve({messages:{stream(){requests++;}}});await new Promise(r=>setImmediate(r));
 assert.equal(requests,0);
});
