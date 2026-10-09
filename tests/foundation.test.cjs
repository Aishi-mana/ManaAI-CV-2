const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Load production TypeScript with mocked desktop boundaries, without new dependencies.
function loader(mocks = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    if (file.endsWith(".json")) return JSON.parse(fs.readFileSync(file, "utf8"));
    const module = { exports: {} };
    cache.set(file, module.exports);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true },
    }).outputText;
    const requireModule = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.startsWith(".")) {
        const resolved = path.resolve(path.dirname(file), id);
        return load(path.extname(resolved) ? resolved : resolved + ".ts");
      }
      return require(id);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: requireModule,
      console, TextDecoder, TextEncoder, AbortSignal, ...globals }, { filename: file });
    return module.exports;
  }
  return load;
}

function assets(files) {
  return { files, urls: new Map(files.map((f) => [f.toLowerCase(), "blob:" + f])), items: {} };
}

test('context overflow retries older history without dropping current evidence or mutating saved messages',async()=>{
 const sent=[];let calls=0;const load=loader({}, {fetch:async(_url,opts)=>{
  sent.push(JSON.parse(opts.body).messages);calls++;
  if(calls===1)return {ok:false,status:400,text:async()=>JSON.stringify({error:{type:'exceed_context_size_error'}})};
  let read=false;return {ok:true,body:{getReader:()=>({read:async()=>{if(read)return {done:true};read=true;return {done:false,value:new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Answer"}}]}\ndata: [DONE]\n')};}})}};
 }});
 const llm=load('src/core/llm.ts'),messages=[{role:'system',content:'Current rules'},{role:'user',content:'Older question'},{role:'assistant',content:'Older answer'},{role:'user',content:'Latest request with current evidence'}];let reply='';
 await llm.streamChat({port:8080,messages,temperature:0.4,onToken:t=>reply+=t});
 assert.equal(calls,2);assert.equal(reply,'Answer');assert.equal(sent[1].length,2);assert.equal(sent[1][0].content,'Current rules');assert.equal(sent[1][1].content,'Latest request with current evidence');assert.equal(messages.length,4);
 assert.equal(llm.compactRequestHistory(sent[1]),null);
 let failures=0;const failing=loader({}, {fetch:async()=>{failures++;return {ok:false,status:400,text:async()=>JSON.stringify({error:{type:'exceed_context_size_error'}})};}})('src/core/llm.ts');
 await assert.rejects(failing.streamChat({port:8080,messages:sent[1],temperature:0.4,onToken:()=>{throw Error('No partial tokens expected');}}),/Saved chat is unchanged/);assert.equal(failures,1);
});

test('other server failures never trigger context recovery retries',async()=>{
 let calls=0;const llm=loader({}, {fetch:async()=>{calls++;return {ok:false,status:500,text:async()=> 'server failed'};}})('src/core/llm.ts');
 await assert.rejects(llm.streamChat({port:8080,messages:[{role:'user',content:'Hi'}],temperature:0.4,onToken:()=>{}}),/Server error 500/);assert.equal(calls,1);
});

test('narrative interpretations retain selected evidence and earlier versions, with backward-compatible backups',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}}});
 const n=load('src/core/narratives.ts');
 const source={eventId:'e',id:'report',kind:'playtest',title:'Dragon preview',outcome:'Preview win, not a full game test',recordedAt:'2026-10-09T12:00:00Z'};
 const episode={id:'m',kind:'special',content:'Our preview victory',tags:['game'],createdAt:source.recordedAt,updatedAt:source.recordedAt,source};
 const first={id:'n1',kind:'lesson',content:'Testing a preview may help us revise a draft.',createdAt:source.recordedAt,sources:[episode],version:1};
 const second={...first,id:'n2',content:'A preview gives limited evidence for revision.',version:2,parentId:'n1'};
 n.saveNarratives([first,second]);assert.equal(n.loadNarratives().length,2);assert.equal(n.loadNarratives()[1].parentId,'n1');
 assert.equal(n.validateNarratives([{...first,sources:[]},first,first]).length,1);
 const payload=n.narrativePayload('lesson',[episode],'Mana',first);assert.match(payload[0].content,/tentative lesson/);assert.match(payload[0].content,/another person's feelings/);assert.match(payload[1].content,/Preview win/);assert.match(payload[1].content,/previousInterpretation/);
 const b=load('src/core/backup.ts'),backup=b.snapshotBackup();assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.narratives.v1'].length,2);
 delete backup.data['mana.narratives.v1'];assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.narratives.v1'].length,0);
 assert.equal(values.has('mana.identity.v1'),false);assert.equal(values.has('mana.episodes.v1'),false);
});

test('narrative tuning distinguishes practical lessons from topic themes and retracts prior unsupported interpretations',()=>{
 const n=loader()('src/core/narratives.ts');
 const source={eventId:'e',id:'report',kind:'playtest',title:'Game preview',outcome:'win, 23 turns, version 21. Not a full game test.',recordedAt:'2026-10-09T12:00:00Z'};
 const episode={id:'m',kind:'special',content:'Preview win',tags:['game'],createdAt:source.recordedAt,updatedAt:source.recordedAt,source};
 const previous={id:'old',kind:'lesson',content:'Mana may prefer predictable outcomes.',createdAt:source.recordedAt,sources:[episode],version:1};
 const lesson=n.narrativePayload('lesson',[episode],'Mana',previous),theme=n.narrativePayload('theme',[episode],'Mana');
 assert.match(lesson[0].content,/practical lesson about the workflow/);assert.match(lesson[1].content,/turn count alone/);
 assert.match(lesson[0].content,/Hedging/);assert.match(lesson[0].content,/prior interpretation is a draft to improve, not supporting evidence/);
 assert.match(lesson[1].content,/23 turns/);assert.match(theme[1].content,/one recorded moment/);assert.match(theme[0].content,/Do not convert a topic into a personality trait/);
 assert.match(lesson[1].content,/does not verify JSON structure, state transitions/);
 assert.match(lesson[1].content,/Revisions may change outcomes/);
 assert.match(lesson[1].content,/Do not invent logs, action sequences or measurements/);
 assert.equal(previous.content,'Mana may prefer predictable outcomes.');
});

test('belief interpretations remain proposals with evidence and roundtrip without identity changes',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}}});const n=load('src/core/narratives.ts');
 const source={eventId:'e',id:'r',kind:'playtest',title:'Preview',outcome:'win in 23 turns',recordedAt:'2026-10-09T12:00:00Z'};
 const episode={id:'m',kind:'special',content:'Recorded preview win',tags:[],createdAt:source.recordedAt,updatedAt:source.recordedAt,source};
 const belief={id:'b',kind:'belief',content:'I could use recorded results to guide revisions.',createdAt:source.recordedAt,sources:[episode],version:1};
 n.saveNarratives([belief]);assert.equal(n.loadNarratives()[0].kind,'belief');
 const payload=n.narrativePayload('belief',[episode],'Mana');assert.match(payload[0].content,/tentative belief interpretation/);assert.match(payload[1].content,/proposed working outlook/);assert.match(payload[1].content,/One event cannot establish a recurring pattern/);assert.match(payload[1].content,/user loves, trusts, needs or values Mana/);
 const backup=load('src/core/backup.ts');assert.equal(backup.validateBackup(JSON.stringify(backup.snapshotBackup())).data['mana.narratives.v1'][0].kind,'belief');assert.equal(values.has('mana.identity.v1'),false);assert.equal(values.has('mana.relationship.v1'),false);
});

test('narrative chat context requires explicit approval, relevant evidence and excludes superseded versions',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}}});const n=load('src/core/narratives.ts');
 const source={eventId:'e',id:'r',kind:'playtest',title:'Dragon preview',outcome:'win in 23 turns, not a full game test',recordedAt:'2026-10-09T12:00:00Z'};
 const episode={id:'m',kind:'special',content:'Dragon preview win',tags:['game'],createdAt:source.recordedAt,updatedAt:source.recordedAt,source};
 const first={id:'n1',kind:'belief',content:'We could compare preview evidence.',createdAt:source.recordedAt,sources:[episode],version:1};
 const second={...first,id:'n2',content:'Compare recorded results before revising.',version:2,parentId:'n1'};
 assert.equal(n.narrativeContext([first],'Dragon'),'');assert.equal(n.narrativeContext([{...first,useInChat:true}],'cookies'),'');
 let context=n.narrativeContext([{...first,useInChat:true},second],'Dragon');assert.match(context,/We could compare/);assert.doesNotMatch(context,/Compare recorded results/);
 context=n.narrativeContext([{...first,useInChat:true},{...second,useInChat:true}],'Dragon');assert.doesNotMatch(context,/We could compare/);assert.match(context,/Compare recorded results/);assert.match(context,/not a full game test/);assert.match(context,/configured identity and current state remain authoritative/);
 n.saveNarratives([{...second,useInChat:true}]);const b=load('src/core/backup.ts');assert.equal(b.validateBackup(JSON.stringify(b.snapshotBackup())).data['mana.narratives.v1'][0].useInChat,true);
 assert.equal(n.validateNarratives([first])[0].useInChat,undefined);
});

test('approved lessons guide takeaway requests without treating configured damage as balance evidence',()=>{
 const n=loader()('src/core/narratives.ts');
 const source={eventId:'e',id:'r',kind:'playtest',title:'Game preview',outcome:'win, 23 turns. Not a full game test.',recordedAt:'2026-10-09T12:00:00Z'};
 const episode={id:'m',kind:'special',content:'Game preview win',tags:['game'],createdAt:source.recordedAt,updatedAt:source.recordedAt,source};
 const lesson={id:'n',kind:'lesson',content:'Compare future preview results. Full-game behavior remains untested.',createdAt:source.recordedAt,sources:[episode],version:3,useInChat:true};
 const context=n.narrativeContext([lesson],'What should we learn from our game preview before revising it?');
 assert.match(context,/APPLY THE RELEVANT APPROVED LESSON/);assert.match(context,/configured data, not evidence those skills were used/);assert.match(context,/understand changes/);assert.match(context,/full-game behavior remains untested/);
 assert.doesNotMatch(n.narrativeContext([{...lesson,useInChat:undefined}],'What should we learn from our game preview?'),/APPLY THE RELEVANT/);
 assert.doesNotMatch(n.narrativeContext([lesson],'What is a game preview?'),/APPLY THE RELEVANT/);
});

test('lesson task focus follows detailed style and does not affect ordinary narrative requests',()=>{
 const load=loader(),n=load('src/core/narratives.ts'),llm=load('src/core/llm.ts'),p=load('src/core/personality.ts');
 assert.equal(n.lessonReplyFocus('APPROVED NARRATIVE INTERPRETATIONS without a lesson request'),'');
 const context='APPLY THE RELEVANT APPROVED LESSON: Recorded preview win; full-game behavior untested.';
 const reminder=n.lessonReplyFocus(context),style=p.replyStyleReminder({...p.DEFAULT_PERSONALITY,enabled:true,verbosity:'detailed'});
 const history=[{id:'old',role:'assistant',content:'Fireball damage is good'},{id:'latest',role:'user',content:'What should we learn before revising the preview?'}];
 const request=llm.buildPayload('Identity and rules',history.slice(-1),24,'Mana',context,style+reminder);
 assert.equal(request.length,2);assert.doesNotMatch(JSON.stringify(request),/Fireball damage is good/);
 const last=request[1].content;assert.ok(last.indexOf('[Current lesson task')>last.indexOf('[Current reply style]'));assert.match(last,/not extra damage values/);assert.match(last,/full-game distinction explicit/);assert.equal(history.length,2);
});

test('direct interpretation revisions preserve originals and evidence, start unapproved and reject unchanged saves',()=>{
 let seq=0;const n=loader({'./types':{uid:()=>`manual-${++seq}`}})('src/core/narratives.ts');
 const source={eventId:'e',id:'r',kind:'playtest',title:'Preview',outcome:'win in 23 turns',recordedAt:'2026-10-09T12:00:00Z'};
 const episode={id:'m',kind:'special',content:'Preview victory',tags:['game'],createdAt:source.recordedAt,updatedAt:source.recordedAt,source};
 const original={id:'n',kind:'lesson',content:'Compare results.',createdAt:source.recordedAt,sources:[episode],version:4,useInChat:true};
 const draft=n.editableNarrativeRevision(original,new Date('2026-10-09T13:00:00Z'));
 assert.equal(draft.version,5);assert.equal(draft.parentId,'n');assert.equal(draft.useInChat,undefined);assert.notEqual(draft.id,original.id);assert.equal(draft.sources[0].source.eventId,'e');assert.equal(original.version,4);
 assert.equal(n.canSaveNarrative(draft,[original]),false);assert.equal(n.canSaveNarrative({...draft,content:'  Compare results.  '},[original]),false);
 assert.equal(n.canSaveNarrative({...draft,content:'Compare recorded results; full-game behavior is untested.'},[original]),true);
 assert.equal(n.canSaveNarrative({...draft,content:'Changed.'},[]),false);
 assert.equal(n.editableNarrativeRevision({...original,version:100}),null);
 assert.equal(n.canSaveNarrative({...draft,content:'Changed.'},Array.from({length:100},(_,i)=>({...original,id:String(i)}))),false);
});

test('confirmed skill practice deduplicates by area/source and derives reversible milestones without proficiency changes',()=>{
 const values=new Map();let seq=0;const load=loader({'./types':{uid:()=>String(++seq)},'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}}}),s=load('src/core/skills.ts');
 const source={id:'w1',kind:'work',title:'JSON design',outcome:'Reviewed draft, not executed',createdAt:'2026-10-09T12:00:00Z'};
 let entries=s.confirmPractice([],'coding',source,'Reviewed JSON fields');assert.equal(entries.length,1);assert.equal(s.practiceProgress(entries,'coding').stage,1);
 assert.equal(s.confirmPractice(entries,'coding',source,'Duplicate').length,1);entries=s.confirmPractice(entries,'creativity',source,'Design exercise');assert.equal(entries.length,2);
 assert.equal(s.practiceProgress(entries.filter(p=>p.skill!=='coding'),'coding').stage,0);
 const five=Array.from({length:5},(_,i)=>({...entries[0],id:String(i),source:{...source,id:String(i)}}));assert.equal(s.practiceProgress(five,'coding').stage,2);assert.equal(s.practiceProgress(five,'coding').next,10);
 s.savePractice(entries);assert.equal(s.loadPractice()[0].source.id,'w1');assert.equal(values.has('mana.stats.v1'),false);assert.equal(values.has('mana.relationship.v1'),false);
 assert.equal(s.validatePractice([entries[0],{...entries[0],id:'duplicate'}]).length,1);
 assert.equal(s.practiceSources([],[{id:'empty',turns:[]},{id:'active',prompt:'Story',kind:'story',status:'active',createdAt:source.createdAt,turns:[{role:'user',text:'Hello'}]}]).length,1);
 const b=load('src/core/backup.ts'),backup=b.snapshotBackup();assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.skills.v1'].length,2);delete backup.data['mana.skills.v1'];assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.skills.v1'].length,0);
 assert.match(s.skillsContext(entries,'What skills have we practiced?'),/not proficiency/);assert.equal(s.skillsContext(entries,'Hello'),'');
});

test('timeline merges event and reviewed memory evidence once, preserves orphaned snapshots and respects local dates',()=>{
 const t=loader()('src/core/timeline.ts');
 const first={eventId:'a',id:'report',kind:'playtest',title:'Dragon preview',outcome:'win',recordedAt:'2026-10-09T16:30:00Z'};
 const second={...first,eventId:'b',title:'Earlier draft',recordedAt:'2026-10-09T12:00:00Z'};
 const memory={id:'m',kind:'special',content:'Our close victory',tags:['game'],source:first,createdAt:'2026-10-11T12:00:00Z',updatedAt:'2026-10-11T12:00:00Z'};
 const rows=t.buildTimeline([second,first],[memory]);assert.equal(rows.length,2);assert.equal(rows[0].memory.id,'m');
 assert.equal(t.buildTimeline([],[memory])[0].source.eventId,'a');
 assert.equal(t.timelineDate(first.recordedAt,'Asia/Singapore'),'2026-10-10');
 assert.equal(t.filterTimeline(rows,'game','special','2026-10-10','2026-10-10','Asia/Singapore').length,1);
 assert.equal(t.filterTimeline(rows,'','reviewed','','','Asia/Singapore').length,1);
 assert.equal(t.filterTimeline(rows,'','all','2026-10-11','','Asia/Singapore').length,0);
 assert.equal(rows[0].source.recordedAt,first.recordedAt);assert.equal(first.title,'Dragon preview');
});

test('reviewed episodes preserve source evidence, deduplicate, edit and recall only relevant saved notes',()=>{
 const values=new Map();let seq=0;const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}},'./types':{uid:()=>String(++seq)}});
 const e=load('src/core/episodes.ts');const source={eventId:'event',id:'report',kind:'playtest',title:'Dragon battle',outcome:'Deterministic preview: win. Not a full game test.',recordedAt:'2026-10-09T12:00:00Z'};
 const note=e.reviewedEpisode(source,'We won the Dragon preview.','special','game, Dragon, game',undefined,new Date('2026-10-09T12:01:00Z'));
 assert.equal(note.tags.join(','),'game,dragon');e.saveEpisodes([note]);assert.equal(e.loadEpisodes()[0].source.id,'report');
 assert.equal(e.validateEpisodes([note,{...note,id:'duplicate'}]).length,1);
 assert.equal(e.reviewedEpisode(source,'   ','episode',''),null);
 const edited=e.reviewedEpisode({...source,outcome:'Changed'},'A close Dragon preview win.','episode','battle',note,new Date('2026-10-09T12:02:00Z'));
 assert.equal(edited.id,note.id);assert.equal(edited.createdAt,note.createdAt);assert.equal(edited.source.outcome,source.outcome);
 assert.equal(e.episodeContext([note],'cookies'), '');assert.match(e.episodeContext([note],'Dragon'),/Not a full game test/);assert.match(e.episodeContext([note],'Dragon'),/interpretations/);
 const b=load('src/core/backup.ts'),backup=b.snapshotBackup();assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.episodes.v1'][0].source.eventId,'event');
 delete backup.data['mana.episodes.v1'];assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.episodes.v1'].length,0);
 assert.equal(values.has('mana.identity.v1'),false);assert.equal(values.has('mana.events.v1'),false);
});

test('event history records transitions without backfill, duplicates or silent pruning and restores older backups',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}},'./types':{uid:()=>String(values.size)+Math.random()}});
 const e=load('src/core/events.ts');const source={id:'goal-1',kind:'goal',title:'Learn JSON',outcome:'User-recorded goal status: active'};
 assert.equal(e.changedEventSources([source],[source]).length,0);
 assert.equal(e.changedEventSources([source],[]).length,0);
 const changes=e.changedEventSources([source],[{...source,outcome:'User-recorded goal status: completed'}]);assert.equal(changes.length,1);
 const history=e.appendEvents([],changes,new Date('2026-10-09T12:00:00Z'));e.saveEvents(history);assert.equal(e.loadEvents()[0].id,'goal-1');
 assert.equal(values.has('mana.memories.v1'),false);
 const full=Array.from({length:e.EVENT_LIMIT},(_,i)=>({...history[0],eventId:String(i)}));assert.equal(e.appendEvents(full,[source]).length,e.EVENT_LIMIT);assert.equal(e.appendEvents(full,[source])[0].eventId,'0');
 assert.equal(e.validateEvents([history[0],history[0],{...history[0],eventId:'bad',recordedAt:'invalid'}]).length,1);
 const b=load('src/core/backup.ts');const backup=b.snapshotBackup();assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.events.v1'].length,1);
 delete backup.data['mana.events.v1'];assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.events.v1'].length,0);
});

test("simulated thoughts preserve bounded grounded evidence separately and roundtrip old backups", () => {
 const values=new Map();const load=loader({'@tauri-apps/api/core':{invoke:async()=>{}},'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}}});
 const t=load('src/core/thoughts.ts'),c=load('src/core/character.ts'),s=load('src/core/internalState.ts');
 const sources=t.thoughtSources([{id:'u',role:'user',content:'Learning JSON'},{id:'a',role:'assistant',content:'Mana: We can learn. [happy]'},{id:'bad',role:'assistant',content:'Failed story',error:'Stopped'}],'Mana');
 assert.equal(sources.length,2);assert.equal(sources[1].text,'We can learn.');
 const payload=t.thoughtPayload(c.validateIdentity(null),s.defaultInternalState(),sources,'Mana','Aishi');
 assert.match(payload[0].content,/not hidden model reasoning/);assert.match(payload[0].content,/Do not invent offline activity/);
 const entry={id:'t',text:'I am curious about JSON.',createdAt:'2026-10-09T06:00:00Z',mood:'curious',sources};
 t.saveThoughts({enabled:true,entries:[entry]});assert.equal(t.loadThoughts().entries[0].sources.length,2);
 assert.equal(values.has('mana.chat.v1'),false);assert.equal(values.has('mana.diary.v1'),false);
 const b=load('src/core/backup.ts'),backup=b.snapshotBackup();assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.thoughts.v1'].entries[0].text,entry.text);
 delete backup.data['mana.thoughts.v1'];assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.thoughts.v1'].enabled,false);
 assert.equal(t.validateThoughts({entries:[entry,entry,{id:'bad'}]}).entries.length,1);
});

test("chat style reminder emphasizes saved length after context without changing history", () => {
 const load=loader(),p=load('src/core/personality.ts'),llm=load('src/core/llm.ts');
 const history=[{id:'u',role:'user',content:'What is JSON?'}],before=JSON.stringify(history);
 const brief=p.replyStyleReminder({...p.DEFAULT_PERSONALITY,enabled:true,verbosity:'brief',playfulness:10});
 assert.match(brief,/at most TWO/);assert.match(brief,/omit optional follow-up/);assert.match(brief,/without playful analogies/);
 assert.match(brief,/override conflicting voice adjectives/);assert.match(brief,/unless the user explicitly requests an analogy/);
 const payload=llm.buildPayload('Prompt',history,24,'Mana','Facts',brief);
 assert.ok(payload[1].content.endsWith(brief));assert.equal(JSON.stringify(history),before);
 assert.match(p.replyStyleReminder({...p.DEFAULT_PERSONALITY,enabled:true,verbosity:'detailed'}),/actual values or syntax/);
 assert.equal(p.replyStyleReminder(p.DEFAULT_PERSONALITY),'');
});

test("personality traits persist and guide identity without changing the profile", () => {
 const values=new Map();const load=loader({'@tauri-apps/api/core':{invoke:async()=>{}},'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}}});
 const p=load('src/core/personality.ts');assert.equal(p.personalityContext(p.loadPersonality()),'');
 p.savePersonality({...p.DEFAULT_PERSONALITY,enabled:true,playfulness:0,verbosity:'brief'});
 const c=load('src/core/character.ts'),profile=c.validateIdentity(null),before=JSON.stringify(profile);
 assert.equal(p.loadPersonality().playfulness,0);assert.match(c.identityContext(profile),/avoid teasing and jokes/);assert.equal(JSON.stringify(profile),before);
 const b=load('src/core/backup.ts'),backup=b.snapshotBackup();assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.personality.v1'].enabled,true);
 delete backup.data['mana.personality.v1'];assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.personality.v1'].enabled,false);
});

test("playtest export preserves version measurements notes and recorded log without claiming a full engine test", () => {
 const {playtestText}=loader()('src/core/playtestExport.ts');
 const report={id:'report',artifactId:'draft',artifactTitle:'Dragon game',version:20,createdAt:'2026-10-09T06:00:00Z',player:'Hero',enemy:'Dragon',startingPlayerHealth:700,startingEnemyHealth:800,playerAttackDamage:35,enemyCounterDamage:30,playerHealth:40,enemyHealth:0,turns:23,outcome:'win',notes:'Close battle~ 你好',recentLog:['Hero attacks.','Dragon defeated.']};
 const before=JSON.stringify(report),text=playtestText(report);
 assert.match(text,/Version: 20/);assert.match(text,/Outcome: win/);assert.match(text,/Turns: 23/);
 assert.match(text,/Starting health: Hero 700; Dragon 800/);assert.match(text,/Final health: Hero 40; Dragon 0/);
 assert.match(text,/Close battle~ 你好/);assert.match(text,/Hero attacks.\nDragon defeated./);
 assert.match(text,/deterministic preview, not generated code or a full game engine/);assert.equal(JSON.stringify(report),before);
});

test("work export records provenance and retains exact draft content without claiming execution", () => {
 const {workText}=loader()('src/core/workExport.ts');
 for(const kind of ['design','writing','code']){
 const artifact={id:'v2',goalId:'goal',goalTitle:'Dragon game',kind,title:'Battle draft',content:'  {"damage": 30}\n\nEnd~ 你好\n',version:2,parentId:'v1',createdAt:'2026-10-09T06:00:00Z',generatedAt:'2026-10-09T05:59:00Z'};
 const before=JSON.stringify(artifact),text=workText(artifact);
 assert.match(text,/Goal: Dragon game/);assert.ok(text.includes(`Kind: ${kind}`));assert.match(text,/Version: 2/);assert.match(text,/Revises: v1/);
 assert.match(text,/not executed or tested/);assert.equal(text.split('--- Draft content ---\n')[1],artifact.content);assert.equal(JSON.stringify(artifact),before);
 }
});

test("activity transcript export preserves all saved roles, prompt, status and result without mutation", () => {
 const load=loader(),{activityText}=load('src/core/activityExport.ts');
 const a=load('src/core/sharedActivities.ts');
 for(const kind of ['words','story','challenge']){
   const session=a.newSharedSession(kind,kind==='words'?'apple':'A magical door');
   session.turns=[{id:'u',role:'user',text:'Hello 你好',createdAt:'2026-10-09T06:00:00Z'},{id:'a',role:'assistant',text:'A new world.',createdAt:'2026-10-09T06:01:00Z'}];
   session.status='completed';session.result='Finished together';
   const before=JSON.stringify(session),text=activityText(session,'Mana');
   assert.match(text,/Status: completed/);assert.ok(text.includes(session.prompt));
   assert.match(text,/You \(2026-10-09T06:00:00Z\)\nHello 你好/);assert.match(text,/Mana \(2026-10-09T06:01:00Z\)\nA new world/);
   assert.match(text,/Result\nFinished together/);assert.equal(JSON.stringify(session),before);
 }
 const empty=a.newSharedSession('story','Door');assert.match(activityText(empty,'Mana'),/No saved turns yet/);
});

test("diary text export preserves entries and moods in date order while excluding deleted text and source evidence", () => {
 const {diaryText}=loader()('src/core/diaryExport.ts');
 const entries=[{id:'new',content:'Today~ 你好',createdAt:'2026-10-09T06:00:00Z',mood:'excited',journalDate:'2026-10-09',sourceMessages:[{content:'private evidence'}]},
 {id:'old',content:'Earlier reflection',createdAt:'2026-10-08T06:00:00Z',mood:'neutral'},
 {id:'deleted',content:'Deleted wording',createdAt:'2026-10-07T06:00:00Z',mood:'sad',deletedAt:'2026-10-09T06:00:00Z'}];
 const text=diaryText(entries,'Mana');
 assert.match(text,/Mana's diary/);assert.match(text,/Daily journal — 2026-10-09/);assert.match(text,/Mood: excited/);
 assert.ok(text.indexOf('Earlier reflection')<text.indexOf('Today~'));assert.ok(!text.includes('private evidence'));assert.ok(!text.includes('Deleted wording'));
 assert.equal(entries[0].id,'new');assert.equal(entries.length,3);
});

test("conversation text exports readable speakers and dates while excluding hidden model data", () => {
 const {conversationText}=loader()('src/core/chatExport.ts');
 const messages=[{id:'u',role:'user',content:'Hello 你好',createdAt:'2026-10-09T06:00:00Z'},
 {id:'a',role:'assistant',content:'<think>secret thought</think>Mana: Hi! [excited]',error:'Stopped',diagnostics:{attempts:[{text:'hidden attempt'}]}}];
 const text=conversationText(messages,'Mana','Aishi','My archive');
 assert.match(text,/My archive\n\nAishi \(2026-10-09T06:00:00Z\)\nHello 你好/);
 assert.match(text,/Mana\nHi!/);assert.match(text,/Incomplete or failed reply: Stopped/);
 assert.ok(!text.includes('secret thought'));assert.ok(!text.includes('hidden attempt'));assert.ok(!text.includes('[excited]'));
 assert.equal(messages[1].content,'<think>secret thought</think>Mana: Hi! [excited]');
});

test("chat archives preserve searchable transcripts independently of fresh chat and roundtrip backups", () => {
 const values=new Map();const load=loader({'@tauri-apps/api/core':{invoke:async()=>{}},'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}}});
 const a=load('src/core/chatArchives.ts'),s=load('src/core/settings.ts');
 const messages=[{id:'u',role:'user',content:'Our dragon game'},{id:'a',role:'assistant',content:'Hello [neutral]',error:'Stopped'}];
 const archive=a.newChatArchive(messages);a.saveChatArchives([archive]);s.saveChat([]);
 assert.equal(s.loadChat().length,0);assert.equal(a.loadChatArchives()[0].messages.length,2);
 messages[0].content='Changed';assert.equal(a.loadChatArchives()[0].messages[0].content,'Our dragon game');
 const b=load('src/core/backup.ts'),backup=b.snapshotBackup();
 assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.chat_archives.v1'][0].messages[1].error,'Stopped');
 delete backup.data['mana.chat_archives.v1'];assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.chat_archives.v1'].length,0);
 assert.equal(a.validateChatArchives([archive,archive,{id:'bad'}]).length,1);
 const long=Array.from({length:250},(_,i)=>({id:`m${i}`,role:'user',content:`Message ${i}`}));
 assert.equal(a.validateChatArchives([a.newChatArchive(long)])[0].messages.length,250);
});

test("chat search finds literal visible text in both speakers without hidden diagnostic matches", () => {
 const {searchChat}=loader()('src/core/chatSearch.ts');
 const messages=[{id:'u',role:'user',content:'Dragon [map]'},
 {id:'a',role:'assistant',content:'Mana: A DRAGON appears! [excited]',diagnostics:{attempts:[{text:'secret diagnostic',issue:null}]}},
 {id:'b',role:'assistant',content:'<think>hidden secret</think>Hello [neutral]'}];
 assert.equal(JSON.stringify(searchChat(messages,' dragon ','Mana')),JSON.stringify(['u','a']));
 assert.equal(JSON.stringify(searchChat(messages,'[map]','Mana')),JSON.stringify(['u']));
 assert.equal(searchChat(messages,'secret','Mana').length,0);
 assert.equal(searchChat(messages,'excited','Mana').length,0);
 assert.equal(searchChat(messages,'   ','Mana').length,0);
 assert.equal(searchChat([],'dragon','Mana').length,0);
});

test("saved wardrobe looks survive storage and backup, preserving unavailable choices for later", () => {
 const values=new Map();
 const load=loader({'@tauri-apps/api/core':{invoke:async()=>{}},'./persistence':{
   readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v),flushPersistence:async()=>{},restoreStored:async()=>{}
 }});
 const a=load('src/core/avatar.ts'),w=load('src/core/wardrobe.ts');
 const look={name:'Summer',skin:'default',outfit:'summer',hairstyle:'default',accessories:['hat']};
 a.saveAvatarConfig({...a.DEFAULT_AVATAR,view:'half',looks:[look]});
 const cfg=a.loadAvatarConfig();assert.equal(cfg.looks[0].outfit,'summer');
 const entry={name:'default',unlocked:true,isDefault:true};
 const applied=w.resolveLoadout({...cfg,...look},{skins:[entry],outfits:[entry],hairs:[entry],accessories:[]});
 assert.equal(applied.outfit,'default');assert.equal(applied.view,'half');assert.equal(applied.accessories.length,0);
 assert.equal(applied.looks[0].outfit,'summer');assert.equal(cfg.looks[0].accessories[0],'hat');
 const b=load('src/core/backup.ts');const backup=b.snapshotBackup();
 assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.avatar.v1'].looks[0].name,'Summer');
 const health=load('src/core/dataHealth.ts');
 assert.equal(health.dataHealth(backup).counts.find(r=>r.label==='Saved wardrobe looks').count,1);
 const empty={...backup,data:{...backup.data,'mana.avatar.v1':a.DEFAULT_AVATAR}};
 const comparison=health.compareBackups(empty,backup).find(r=>r.label==='Saved wardrobe looks');
 assert.equal(comparison.current,0);assert.equal(comparison.incoming,1);
 assert.equal(a.validateAvatarConfig({...cfg,looks:[look,{...look,name:'summer'},null]}).looks.length,1);
});

test("activity status follows saved turns rather than retaining a stale invitation", () => {
 const a=loader()("src/core/sharedActivities.ts");
 const story=a.addActivityContribution(a.newSharedSession("story","Door"),"A door opens.");
 assert.match(a.activityTurnStatus(story),/Ask Mana/);assert.equal(a.activityTurnStatus(story,true),'');
 const next=a.addActivityReply(story,"A garden appears.");assert.match(a.activityTurnStatus(next),/Your turn/);assert.ok(!a.activityTurnStatus(next).includes('Ask Mana'));
 const challenge=a.addActivityReply(a.addActivityContribution(a.newSharedSession("challenge","Gadget"),"A random door"),"That sounds fun!");
 assert.match(a.activityTurnStatus(challenge),/Feedback is saved/);assert.equal(a.activityTurnStatus({...challenge,status:'paused'}),'');
 assert.match(a.sharedActivityPayload(challenge,"Mana","Aishi","Playful and curious")[0].content,/Playful and curious/);
 assert.match(a.sharedActivityPayload(challenge,"Mana","Aishi")[0].content,/friendly companion/);
});

test("word chain enforces turn rules without inference or mutation", () => {
 const a=loader()("src/core/sharedActivities.ts"),session=a.newSharedSession("words","apple");
 const before=JSON.stringify(session);
 assert.ok(a.wordChainTurn(session,"rabbit").error);assert.ok(a.wordChainTurn(session,"e!").error);
 const round=a.wordChainTurn(session,"earth");assert.equal(round.error,"");assert.equal(round.session.turns[2].text[0],"h");assert.equal(round.session.turns.length,3);
 assert.equal(JSON.stringify(session),before);
 const repeated={...session,turns:[...session.turns,{id:"x",role:"user",text:"earth"},{id:"y",role:"assistant",text:"house"}]};
 assert.match(a.wordChainTurn(repeated,"earth").error,/already/);
 assert.ok(a.wordChainTurn({...session,status:"paused"},"earth").error);
 const win=a.wordChainTurn(session,"ezz");assert.equal(win.session.status,"completed");assert.match(win.session.result,/You win/);
 assert.equal(a.newSharedSession("words","two words"),null);
});

test("story and challenge sessions preserve pending turns across reload and enforce alternation", () => {
 const data=new Map(),load=loader({}, {localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}),a=load("src/core/sharedActivities.ts");
 const story=a.newSharedSession("story","A robot opens a door");const user=a.addActivityContribution(story,"It leads to a moon garden.");
 assert.equal(a.addActivityContribution(user,"Another turn too soon"),null);
 a.saveSharedActivities({sessions:[user],selectedId:user.id});const restored=a.loadSharedActivities();
 assert.equal(restored.sessions[0].turns[0].text,"It leads to a moon garden.");assert.equal(restored.selectedId,user.id);
 const reply=a.addActivityReply(restored.sessions[0],"A silver flower rings like a bell.");assert.equal(reply.turns.length,2);assert.equal(a.addActivityReply(reply,"Too soon"),null);
 assert.ok(a.addActivityContribution(reply,"I follow the sound."));assert.equal(a.addActivityReply({...user,status:"paused"},"No"),null);
 const challenge=a.addActivityContribution(a.newSharedSession("challenge","Invent a gadget"),"A hat that predicts rain but sings loudly.");
 const feedback=a.addActivityReply(challenge,"The singing drawback is playful.");assert.equal(a.addActivityContribution(feedback,"Second answer"),null);
 assert.match(a.sharedActivityPayload(user,"Mana","Aishi")[0].content,/fictional/);
 assert.equal(a.validateSharedActivities({sessions:[user,user],selectedId:"missing"}).sessions.length,1);
 assert.equal(a.validateSharedActivities({sessions:[user],selectedId:"missing"}).selectedId,null);
});

test("follow-up suggestions use message dates, keep user approval and reject ambiguous requests", () => {
 const f=loader()("src/core/followups.ts"),state=f.validateFollowups(null);
 const message={id:"u",role:"user",content:"Let's talk about our game tomorrow.",createdAt:"2026-10-08T17:00:00Z"};
 const suggestions=f.suggestFollowups([message],state,"Asia/Singapore");
 assert.equal(suggestions[0].dueLocal,"2026-10-10T09:00");assert.equal(suggestions[0].topic,"our game");
 assert.equal(state.notes.length,0);
 assert.equal(f.suggestFollowups([{...message,content:"Remind me about our game in 30 minutes"}],state,"Asia/Singapore")[0].dueLocal,"2026-10-09T01:30");
 assert.equal(f.suggestFollowups([{...message,content:"Let's name our game on 2026-10-12 at 14:30"}],state,"Asia/Singapore")[0].topic,"name our game");
 for(const content of ["Maybe let's talk about it tomorrow","Let's talk about it tomorrow?",'You said "let\'s talk about it tomorrow"',"Remind me about it in 0 minutes","Let's talk about it on 2026-02-30","I'm busy—talk later"]){assert.equal(f.suggestFollowups([{...message,content}],state,"Asia/Singapore").length,0,content);}
 assert.equal(f.suggestFollowups([{...message,role:"assistant"}],state,"Asia/Singapore").length,0);
 assert.equal(f.suggestFollowups([message],{notes:[],reviewedIds:["u"]},"Asia/Singapore").length,0);
});

test("follow-ups persist and become eligible once without automatic completion", () => {
 const data=new Map();const load=loader({}, {localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}),f=load("src/core/followups.ts");
 const note=f.newFollowup("Name game","2026-10-10T09:00","Asia/Singapore",undefined,new Date("2026-10-09T01:00:00Z"));
 const state={notes:[note],reviewedIds:[]};f.saveFollowups(state);const restored=f.loadFollowups();
 assert.equal(f.dueFollowups(restored,new Date("2026-10-10T00:59:00Z")).length,0);
 assert.equal(f.dueFollowups(restored,new Date("2026-10-10T01:00:00Z")).length,1);
 const included=f.promptedFollowup(restored,note.id,new Date("2026-10-10T01:00:00Z"));assert.equal(included.notes[0].status,"pending");
 assert.equal(f.dueFollowups(included,new Date("2026-10-11T01:00:00Z")).length,0);
 assert.equal(f.dueFollowups({notes:[{...note,status:"done"}],reviewedIds:[]},new Date("2026-10-11T01:00:00Z")).length,0);
 assert.match(f.followupContext(note),/Do not mark it done/);assert.match(f.followupStatusContext({notes:[{...note,status:"dismissed"}],reviewedIds:[]}),/Do not revive/);
 assert.equal(f.validateFollowups({notes:[note,note,{...note,id:"bad",timeZone:"No such zone"}]}).notes.length,1);
});

test("work library selects latest family versions and preserves searchable history", () => {
 const w=loader()("src/core/work.ts");
 const artifacts=[{id:"v1",title:"Game",goalTitle:"Dragon",content:"Old sword",kind:"design",version:1,createdAt:"2026-10-07"},{id:"v2",rootId:"v1",title:"Game",goalTitle:"Dragon",content:"New potion",kind:"design",version:2,createdAt:"2026-10-08"},{id:"code",title:"Script",goalTitle:"Puzzle",content:"print('hi')",kind:"code",createdAt:"2026-10-09"}];
 const before=JSON.stringify(artifacts);
 assert.equal(w.findWork(artifacts,"","all",true).length,2);
 assert.equal(w.findWork(artifacts,"old sword","all",true).length,0);
 assert.equal(w.findWork(artifacts,"old sword","all",false)[0].id,"v1");
 assert.equal(w.findWork(artifacts,"DRAGON","design",true)[0].id,"v2");
 assert.equal(w.findWork(artifacts,"","code",false)[0].id,"code");
 assert.equal(JSON.stringify(artifacts),before);
});

test("daily diary excerpts survive reload without diagnostics or failed reply evidence", () => {
 const d=loader()("src/core/diary.ts");
 const entry={id:"day",content:"A reflection",createdAt:"2026-10-09T04:00:00Z",sourceMessageIds:[],sourceMemoryIds:[],mood:"happy",sourceMessages:[{id:"u",role:"user",content:"Name our game",createdAt:"2026-10-09T03:00:00Z"},{id:"a",role:"assistant",content:"Let's call it Adventure",createdAt:"2026-10-09T03:00:01Z",diagnostics:{attempts:[{text:"debug",issue:null}]}},{id:"e",role:"assistant",content:"Failed guess",error:"stopped",createdAt:"2026-10-09T03:00:02Z"}]};
 const cleaned=d.validateDiary([entry])[0];assert.equal(cleaned.sourceMessages.length,2);assert.equal(cleaned.sourceMessages[1].diagnostics,undefined);
 assert.equal(d.validateDiary([cleaned])[0].sourceMessages[0].content,"Name our game");
});

test("data overview reports orphaned links without deleting historical records", async () => {
 const load=loader({}, {localStorage:{getItem:()=>null}}),b=load("src/core/backup.ts"),h=load("src/core/dataHealth.ts");
 const current=await b.createBackup(),before=JSON.stringify(current);
 const incoming=JSON.parse(before);
 incoming.data["mana.work.v1"]=[{id:"v2",goalId:"gone",parentId:"v1",version:2}];
 incoming.data["mana.playtests.v1"]=[{artifactId:"missing",version:1},{artifactId:"v2",version:1}];
 incoming.data["mana.diary.v1"]=[{id:"one",journalDate:"2026-10-09"},{id:"two",journalDate:"2026-10-09"},{id:"trash",deletedAt:"2026-10-09"}];
 incoming.data["mana.daily_journal.v1"].completedDates=["2026-10-08","2026-10-09"];
 const result=h.dataHealth(incoming);
 for(const phrase of ["deleted goal","deleted parent","missing artifacts","differs","share a journal date","no active entry"])assert.ok(result.notes.some(n=>n.includes(phrase)),phrase);
 assert.equal(h.compareBackups(current,incoming).find(r=>r.label==="Recently deleted").incoming,1);
 assert.equal(JSON.stringify(current),before);assert.equal(incoming.data["mana.work.v1"].length,1);
});

test("restore database failure releases the write lock without altering the hydrated cache", async () => {
 const calls=[],load=loader({'@tauri-apps/api/core':{invoke:async(command,args)=>{calls.push({command,args});if(command==="initialize_store")return {"mana.chat.v1":"[]"};if(command==="restore_backup_store")throw Error("disk unavailable");}}},{window:{__TAURI_INTERNALS__:{},location:{reload:()=>{throw Error("unexpected reload");}}},localStorage:{getItem:()=>null},setTimeout:()=>1,clearTimeout:()=>{}});
 const p=load("src/core/persistence.ts");await p.initializePersistence();
 await assert.rejects(p.restoreStored({"mana.chat.v1":'["incoming"]'},"safety"),/disk unavailable/);
 assert.equal(p.readStored("mana.chat.v1"),"[]");
 p.writeStored("mana.chat.v1",'["new current"]');await p.flushPersistence();
 assert.equal(p.readStored("mana.chat.v1"),'["new current"]');assert.ok(calls.some(c=>c.command==="save_store"));
});

test("failed reply text is excluded from inference and diagnostic role reasons survive reload", () => {
 const load=loader(),l=load("src/core/llm.ts"),c=load("src/core/conversation.ts");
 const history=[{id:"u",role:"user",content:"Hello"},{id:"e",role:"assistant",content:"Secret failed nonsense",error:"Reply stopped"},{id:"u2",role:"user",content:"Hi again"}];
 assert.ok(!JSON.stringify(l.buildPayload("Be kind",history)).includes("Secret failed nonsense"));
 assert.equal(c.validateDiagnostics({attempts:[{text:"I'm back!",issue:"return-role"}]}).attempts[0].issue,"return-role");
});

test("backup roundtrip validates every section and rejects damaged files before writes", async () => {
 const data=new Map();const load=loader({}, {localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
 const b=load("src/core/backup.ts"),d=load("src/core/diary.ts"),c=load("src/core/character.ts");
 d.saveDiary([{id:"d",content:"Keep me",createdAt:"2026-10-09T01:00:00Z",deletedAt:"2026-10-09T02:00:00Z",sourceMessageIds:[],sourceMemoryIds:[],mood:"happy"}]);
 c.saveMemories([c.newMemory("Favorite game is Go.","mana",3)]);
 const backup=await b.createBackup();const valid=b.validateBackup(JSON.stringify(backup));
 assert.equal(valid.data["mana.diary.v1"][0].deletedAt,"2026-10-09T02:00:00Z");
 assert.match(b.backupCounts(valid),/1 memories/);
 assert.equal(Object.keys(valid.data).length,26);
 const legacy=JSON.parse(JSON.stringify(backup));delete legacy.data["mana.followups.v1"];
 delete legacy.data["mana.shared_activities.v1"];
 assert.equal(b.validateBackup(JSON.stringify(legacy)).data["mana.followups.v1"].notes.length,0);
 assert.equal(b.validateBackup(JSON.stringify(legacy)).data["mana.shared_activities.v1"].sessions.length,0);
 for(const changed of [{...backup,version:2},{...backup,data:{}},{...backup,data:{...backup.data,"unknown":[]}},{...backup,data:{...backup.data,"mana.memories.v1":[{id:"broken"}]}}])assert.throws(()=>b.validateBackup(JSON.stringify(changed)));
 await assert.rejects(b.restoreBackup({...backup,version:2}),/Unsupported/);
 assert.equal(c.loadMemories()[0].content,"Favorite game is Go.");
});

test("return reply guard catches role reversal without blocking a grounded welcome", () => {
  const i=loader()("src/core/initiative.ts");
  for(const reply of ["I'm back! Did you miss me?","Mana: I’m back! [happy]","Ooh, I have returned!","Welcome back! Did you miss me?"]){assert.equal(i.invalidReturnReply(reply),true,reply);}
  for(const reply of ["Welcome back, Aishi! How did work go?","Glad you're back!","I'm happy you're back.","You said 'I'm back'; welcome!"]){assert.equal(i.invalidReturnReply(reply),false,reply);}
});

test("returning from a pause consumes reason once, preserves opt-in and honors another pause", () => {
  const i=loader()("src/core/initiative.ts"),now=new Date("2026-10-09T04:00:00Z");
  const paused=i.pauseInitiative(i.validateInitiative(null),30,now,"I'm working");
  const saved=i.validateInitiative(JSON.parse(JSON.stringify(paused)));
  const returned=i.returnFromPause(saved,"Hello",new Date(now.getTime()+60000));
  assert.match(returned.context,/I'm working/);assert.match(returned.context,/ended early/);
  assert.equal(returned.state.pausedUntil,null);assert.equal(returned.state.pauseRequest,null);assert.equal(returned.state.enabled,false);
  assert.equal(i.returnFromPause(returned.state,"Hi again",now).context,"");
  assert.equal(i.returnFromPause(saved,"give me 10 minutes",now).state,saved);
  assert.match(i.returnFromPause(saved,"Hi",new Date(now.getTime()+31*60000)).context,/after the pause ended/);
  assert.match(i.returnFromPause({...saved,pauseRequest:null},"Hi",now).context,/Only ask about work/);
});

test("diary trash preserves content and completion tracking across reload", () => {
  const data=new Map();const load=loader({}, {localStorage:{getItem:(k)=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
  const d=load("src/core/diary.ts"),j=load("src/core/dailyJournal.ts");
  const entry={id:"one",content:"Original wording",createdAt:"2026-10-09T01:00:00Z",deletedAt:"2026-10-09T02:00:00Z",journalDate:"2026-10-09",sourceMessageIds:["u"],sourceMemoryIds:[],mood:"happy"};
  d.saveDiary([entry]);const restored=d.loadDiary();assert.equal(restored[0].deletedAt,entry.deletedAt);assert.equal(restored[0].content,entry.content);
  const state=j.completeJournal(j.validateJournalState(null),entry.journalDate);
  assert.equal(j.dueJournalDate(state,restored,new Date("2026-10-09T15:00:00Z")),null);
  const {deletedAt,...active}=restored[0];d.saveDiary([active]);assert.equal(d.loadDiary()[0].deletedAt,undefined);assert.equal(d.loadDiary()[0].sourceMessageIds[0],"u");
});

test("daily journals retain both speakers and date-scoped recorded goal snapshots", () => {
  const load=loader();const j=load("src/core/dailyJournal.ts");
  let state=j.recordJournalSource(j.validateJournalState(null),{id:"u",role:"user",content:"Choose a game",createdAt:"2026-10-08T12:00:00Z"});
  state=j.recordJournalSource(state,{id:"a",role:"assistant",content:"Mana: My favorite game is Go. [happy]",createdAt:"2026-10-08T12:00:01Z"},"Mana");
  const restored=j.validateJournalState(JSON.parse(JSON.stringify(state)));
  const messages=j.journalMessages(restored,"2026-10-08");
  assert.equal(messages[1].role,"assistant");assert.equal(messages[1].content,"My favorite game is Go.");
  assert.equal(j.recordJournalSource(state,{id:"err",role:"assistant",content:"Bad",error:"failed",createdAt:"2026-10-08T12:00:00Z"},"Mana"),state);
  const legacy=j.validateJournalState({sources:[{id:"old",content:"Hi",date:"2026-10-08",createdAt:"2026-10-08T12:00:00Z"}]});
  assert.equal(j.journalMessages(legacy,"2026-10-08")[0].role,"user");
  const payload=j.dailyJournalPayload([{role:"system",content:""},{role:"user",content:""}],"2026-10-08",false,[{title:"Today",status:"active",notes:"Draft accepted",updatedAt:"2026-10-08T12:00:00Z"},{title:"Tomorrow secret",updatedAt:"2026-10-09T12:00:00Z"}]);
  assert.match(payload[1].content,/Draft accepted/);assert.ok(!payload[1].content.includes("Tomorrow secret"));assert.match(payload[1].content,/not a change history/);
});

test("busy requests pause persisted initiative and clear countdown without expiry", () => {
  const i=loader()("src/core/initiative.ts");
  for(const text of ["I'm busy.","I’m working—talk later","let's talk later"]){assert.equal(i.requestedPauseMinutes(text),60);}
  assert.equal(i.requestedPauseMinutes("give me 30 minutes"),30);
  assert.equal(i.requestedPauseMinutes("please talk in 2 hours"),120);
  for(const text of ["I'm not busy","Are you busy?",'She said "talk later"',"give me 0 minutes","give me 25 hours","If I'm busy, talk later"]){assert.equal(i.requestedPauseMinutes(text),null);}
  const now=new Date("2026-10-09T04:00:00Z");
  const state=i.pauseInitiative({...i.validateInitiative(null),enabled:true,pending:{messageId:"a",content:"Hi",createdAt:now.toISOString(),expiresAt:now.toISOString()}},30,now);
  const restored=i.validateInitiative(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.pending,null);assert.equal(i.initiativeExpired(restored,now),false);
  assert.equal(i.initiativePaused(restored,now),true);
  assert.equal(i.initiativeDue({...restored,nextAttemptAt:now.toISOString()},now,"Asia/Singapore",0,0,70),false);
  assert.equal(i.initiativePaused(restored,new Date(now.getTime()+30*60000)),false);
});

test("initiative continuity includes active goals and bounded conversation, and rejects recent questions", () => {
  const i=loader()("src/core/initiative.ts");
  const goals=[{title:"Name our game",plan:"Pick a name",notes:"Prototype drafted",status:"active",updatedAt:"2026-10-09"},{title:"Paused secret",status:"paused"},{title:"Completed secret",status:"completed"}];
  const messages=[{role:"user",content:"Let's name it tomorrow."},{role:"assistant",content:"Want to name our game today? [happy]"},{role:"assistant",content:"Failed secret",error:"failed"}];
  const context=i.continuityContext(goals,messages);
  assert.match(context,/Name our game/);assert.match(context,/Prototype drafted/);assert.match(context,/tomorrow/);
  assert.ok(!context.includes("Paused secret"));assert.ok(!context.includes("Completed secret"));assert.ok(!context.includes("Failed secret"));
  assert.equal(i.repeatsRecentOpening("Hehe! Want to name our game today?",messages),true);
  assert.equal(i.repeatsRecentOpening("Want to talk about music?",messages),false);
  assert.equal(i.repeatsRecentOpening("Want to name our game today?",[...messages,...Array.from({length:8},(_,n)=>({role:"assistant",content:`Different reply ${n}`}))]),false);
  assert.ok(!i.continuityContext([],Array.from({length:20},(_,n)=>({role:"user",content:`topic-${n}-end`}))).includes("topic-0-end"));
});

test("playtest reports capture measured outcomes and persist exact artifact version evidence", () => {
  const data=new Map();const load=loader({}, {localStorage:{getItem:(k)=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
  const p=load("src/core/playtests.ts"),b=load("src/core/battle.ts");
  const game={characters:[{name:"Hero",health:30,attack:10,inventory:[]},{name:"Dragon",health:20,attack:8,inventory:[]}],items:[]};
  let battle=b.startBattle(game.characters[0],game.characters[1]);battle=b.battleTurn(battle,[]);battle=b.battleTurn(battle,[]);
  const report=p.makePlaytest({id:"v9",title:"Puzzle",version:9},battle,game,"Aim for 10–30 health remaining");
  assert.equal(report.outcome,"win");assert.equal(report.turns,2);assert.equal(report.playerHealth,22);assert.equal(report.enemyHealth,0);
  p.savePlaytests([report]);const restored=p.loadPlaytests();assert.equal(restored[0].artifactId,"v9");assert.equal(restored[0].version,9);
  assert.match(p.playtestContext(restored,"v9"),/Aim for 10/);
  assert.match(p.playtestContext(restored,"v8"),/No recorded playtest/);
  assert.match(p.playtestContext(restored,"v9"),/Every healing\/skill action/);
  assert.equal(p.validatePlaytests([report,report,{...report,id:"bad",turns:-1}]).length,1);
  const logs=p.validatePlaytests([{...report,recentLog:["attack","attack"]}])[0].recentLog;
  assert.equal(logs.length,2);
  const loss=p.makePlaytest({id:"v9",title:"Puzzle"},b.battleTurn(b.startBattle({...game.characters[0],health:1},game.characters[1]),[]),game,"");
  assert.equal(loss.outcome,"loss");
});

test("battle preview applies damage, capped healing, consumption and terminal states without mutating data", () => {
  const m=loader()("src/core/battle.ts");
  const player={name:"Hero",health:100,attack:10,inventory:["Sword","Potion","Fireball"]};
  const enemy={name:"Dragon",health:50,attack:15,inventory:[]};
  const items=[{name:"Sword",type:"weapon",damage:10},{name:"Potion",type:"consumable",heal:20},{name:"Fireball",type:"skill",effect:{type:"damage",amount:30}}];
  const original=JSON.stringify({player,enemy,items});
  const start=m.startBattle(player,enemy);
  const attack=m.battleTurn(start,items);
  assert.equal(attack.enemy.health,30);assert.equal(attack.player.health,85);
  const healed=m.battleTurn(attack,items,1);
  assert.equal(healed.player.health,85);assert.equal(healed.player.inventory.includes("Potion"),false);
  assert.ok(healed.log.some((s)=>s.includes("heals 15")));
  const win=m.battleTurn(healed,items,1);
  assert.equal(win.enemy.health,0);assert.equal(win.player.health,85);
  assert.equal(m.battleTurn(win,items),win);
  const lose=m.battleTurn(m.startBattle({...player,health:5},enemy),items);
  assert.equal(lose.player.health,0);assert.equal(m.battleTurn(lose,items),lose);
  assert.equal(m.battleTurn(start,items,999),start);
  assert.equal(m.numericEffect({name:"Fireball",type:"skill",effect:"Deal 30 damage"}),null);
  assert.equal(JSON.stringify({player,enemy,items}),original);
  assert.equal(m.battleData(JSON.stringify({content:{characters:[player,enemy],items}})).characters.length,2);
  assert.equal(m.battleData('{"characters":[],"items":[{"name":"Bad","type":"skill","effect":{"type":"eval","amount":1}}]}'),null);
});

test("artifact JSON validation checks syntax, game stats, duplicate names and references", () => {
  const m=loader()("src/core/workValidation.ts");
  const data={characters:[{name:"Hero",health:100,attack:10,inventory:["Sword","Potion"]}],items:[{name:"Sword",type:"weapon",damage:10},{name:"Potion",type:"consumable",heal:20}]};
  const valid=m.validateWorkJson(JSON.stringify({title:"Game data",content:data}));
  assert.equal(valid.syntaxValid,true);assert.equal(valid.gameData,true);assert.equal(valid.errors.length,0);
  assert.equal(m.validateWorkJson('```json\n'+JSON.stringify(data)+'\n```').errors.length,0);
  assert.equal(m.validateWorkJson('{"broken":').syntaxValid,false);
  const generic=m.validateWorkJson('{"message":"hello"}');assert.equal(generic.gameData,false);assert.equal(generic.syntaxValid,true);
  const invalid=m.validateWorkJson(JSON.stringify({characters:[{name:"Hero",health:-1,attack:"ten",inventory:["Missing"]},{name:"Hero",health:10,attack:1,inventory:[]}],items:[{name:"Sword",type:"weapon"},{name:"Sword",type:"weapon",damage:-1}]}));
  assert.ok(invalid.errors.some((e)=>e.includes("health")));
  assert.ok(invalid.errors.some((e)=>e.includes("attack")));
  assert.ok(invalid.errors.some((e)=>e.includes("undefined item")));
  assert.ok(invalid.errors.some((e)=>e.includes("duplicates")));
  assert.ok(invalid.errors.some((e)=>e.includes("damage")));
  assert.ok(m.validateWorkJson('{"characters":{},"items":[]}').errors.some((e)=>e.includes("characters must be an array")));
  const descriptive=m.validateWorkJson('{"characters":[],"items":[{"name":"Fireball","type":"skill","effect":"Deal 30 damage"}]}');
  assert.ok(descriptive.warnings.some((w)=>w.includes("without an engine")));
});

test("revision changes ignore JSON formatting and identify numeric and structural edits", () => {
  const w=loader()("src/core/work.ts");
  const before='{"characters":[{"name":"Hero","attack":10}],"items":[]}';
  assert.equal(w.revisionChanges(before,'```json\n{"items": [], "characters": [{"attack":10,"name":"Hero"}]}\n```').length,0);
  const changes=w.revisionChanges(before,'{"characters":[{"name":"Hero","attack":15}],"items":["Sword"]}');
  assert.equal(changes[0],'root.characters[0].attack: 10 → 15');
  assert.equal(changes[1],'root.items[0]: missing → "Sword"');
  assert.equal(w.revisionChanges(" Hello\r\nworld ","Hello\nworld").length,0);
  assert.equal(w.revisionChanges("Hello","Changed").length,1);
  assert.equal(w.revisionChanges(JSON.stringify(Array(60).fill(1)),JSON.stringify(Array(60).fill(2))).length,40);
});

test("revision formatting removes only a recognizable metadata envelope and preserves document fields", () => {
  const w=loader()("src/core/work.ts");
  const source={title:"Rules artifact",kind:"design",content:JSON.stringify({title:"Game structure",content:{characters:[]}})};
  const body={title:"Game structure",content:{characters:[{name:"Hero"}]}};
  const envelope=JSON.stringify({title:source.title,kind:source.kind,content:body});
  assert.deepEqual(JSON.parse(w.cleanRevisionContent(envelope,source)),body);
  const legitimate=JSON.stringify(body);
  assert.equal(w.cleanRevisionContent(legitimate,source),legitimate);
  const extra=JSON.stringify({title:source.title,kind:source.kind,content:body,author:"Mana"});
  assert.equal(w.cleanRevisionContent(extra,source),extra);
  const other=JSON.stringify({title:"Different title",kind:source.kind,content:body});
  assert.equal(w.cleanRevisionContent(other,source),other);
  const changed=JSON.stringify({title:source.title,kind:source.kind,content:{rules:[]}});
  assert.equal(w.cleanRevisionContent(changed,source),changed);
  assert.equal(w.cleanRevisionContent("incomplete JSON {",source),"incomplete JSON {");
});

test("artifact revisions preserve original content and stable family/parent links across reload", () => {
  const data=new Map();const load=loader({}, {localStorage:{getItem:(k)=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
  const m=load("src/core/work.ts");
  const original={id:"v1",goalId:"g",goalTitle:"Puzzle",kind:"design",title:"Rules",content:"Original rules",generatedAt:"2026-10-09T01:00:00Z",createdAt:"2026-10-09T01:01:00Z"};
  const before=JSON.stringify(original);
  const revision={...original,...m.revisionMetadata(original,[original]),id:"v2",content:"Revised rules"};
  assert.equal(revision.parentId,"v1");assert.equal(revision.rootId,"v1");assert.equal(revision.version,2);
  m.saveWork([original,revision]);const restored=m.loadWork();
  assert.equal(restored[0].content,"Original rules");assert.equal(restored[0].version,1);
  assert.equal(restored[1].parentId,"v1");assert.equal(restored[1].content,"Revised rules");
  const branch=m.revisionMetadata(restored[0],restored);
  assert.equal(branch.version,3);assert.equal(branch.parentId,"v1");
  assert.equal(m.revisionMetadata(restored[1],restored).parentId,"v2");
  assert.equal(JSON.stringify(original),before);
  assert.equal(m.validateWork([revision])[0].parentId,"v1");
  const goal={...load("src/core/goals.ts").newGoal("Puzzle"),id:"g"};
  const prompt=m.revisionPayload(goal,original,"Add one rule","Mana");
  assert.match(prompt[0].content,/complete replacement CONTENT/);assert.match(prompt[1].content,/Original rules/);
});

test("reviewed work persists text exactly and does not complete goals or alter chat", () => {
  const data=new Map([["mana.goals.v1","[]"],["mana.chat.v1","[]"]]);
  const load=loader({}, {localStorage:{getItem:(k)=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
  const w=load("src/core/work.ts");
  const artifact={id:"a1",goalId:"g1",goalTitle:"Puzzle",title:"Rules draft",kind:"code",content:'const moods = ["[happy]"];\n// untested',generatedAt:"2026-10-09T01:00:00Z",createdAt:"2026-10-09T01:10:00Z"};
  w.saveWork([artifact]);
  assert.equal(w.loadWork()[0].content,artifact.content);
  assert.equal(data.get("mana.goals.v1"),"[]");
  assert.equal(data.get("mana.chat.v1"),"[]");
  assert.equal(w.validateWork([artifact,artifact,null,{...artifact,id:"bad",kind:"executed"}]).length,1);
  assert.match(w.workContext([artifact]),/unexecuted and untested/);
  assert.match(w.workContext([artifact]),/user reviewed or edited/);
  w.saveWork([]);assert.equal(w.loadWork().length,0);
});

test("work prompts request actual drafts with bounded evidence and no execution claims", () => {
  const load=loader();const w=load("src/core/work.ts");const goal=load("src/core/goals.ts").newGoal("Tiny puzzle\nWrite rules");
  const artifacts=Array.from({length:10},(_,i)=>({id:String(i),goalId:goal.id,goalTitle:goal.title,title:"Rules "+i,kind:"design",content:"x".repeat(16000),generatedAt:"2026-10-09T01:00:00Z",createdAt:"2026-10-09T01:01:00Z"}));
  assert.ok(w.workContext(artifacts).length<5000);
  const prompt=w.workPayload(goal,"design","Draft three rules",artifacts,"Mana");
  assert.match(prompt[0].content,/artifact itself, not promises/);
  assert.match(prompt[0].content,/cannot run, compile, test/);
  const diary=load("src/core/diary.ts").reflectionPayload(load("src/core/character.ts").DEFAULT_IDENTITY,load("src/core/internalState.ts").defaultInternalState(),[],[],"Mana","Aishi","Asia/Singapore",new Date(),[goal],artifacts);
  assert.match(diary[0].content,/REVIEWED WORK ARTIFACTS/);
});

test("interest enthusiasm reinforces matching accepted goals once and survives reload", () => {
  const data=new Map();const load=loader({}, {localStorage:{getItem:(k)=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
  const m=load("src/core/interests.ts");
  const initial=m.validateInterests(null);
  const goal=load("src/core/goals.ts").newGoal("A puzzle game\nPractice programming");
  const next=m.acceptGoalInterests(initial,["Games","Programming","Music"],goal);
  assert.equal(m.interestLevel(next,"Games"),63);
  assert.equal(m.interestLevel(next,"Programming"),63);
  assert.equal(m.interestLevel(next,"Music"),60);
  assert.equal(m.acceptGoalInterests(next,["Games"],goal),next);
  m.saveInterests(next);const restored=m.loadInterests();
  assert.equal(m.interestLevel(restored,"games"),63);
  assert.equal(m.acceptGoalInterests(restored,["Games"],goal),restored);
  assert.equal(m.interestLevel(m.validateInterests({levels:{games:500,music:NaN}}),"Games"),100);
  assert.equal(m.interestLevel(initial,"constructor"),60);
  assert.match(m.interestsContext(next,["Games"]),/not evidence of performed activities or skills/);
});

test("goals persist accepted plans and explicit progress without changing chat or memory", () => {
  const data=new Map([["mana.chat.v1","[]"]]);
  const load=loader({}, {localStorage:{getItem:(k)=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
  const m=load("src/core/goals.ts");
  const goal=m.newGoal("Tiny robot puzzle\nSketch three rooms\nChoose one puzzle",new Date("2026-10-09T00:00:00Z"));
  assert.equal(goal.status,"active");
  assert.equal(goal.notes,"");
  assert.equal(m.newGoal(" \n "),null);
  m.saveGoals([{...goal,status:"completed",notes:"We drafted the puzzle rules in chat."}]);
  const saved=m.loadGoals()[0];
  assert.equal(saved.status,"completed");
  assert.equal(saved.title,"Tiny robot puzzle");
  assert.equal(data.get("mana.chat.v1"),"[]");
  assert.match(m.goalsContext([saved]),/not autonomous tool results/);
  assert.match(m.goalsContext([saved]),/not proof of events on a journal date/);
  assert.equal(m.validateGoals([null,goal,goal,{...goal,id:"bad",createdAt:"bad"}]).length,1);
  assert.equal(m.validateGoals([{...goal,status:"executing",notes:null}])[0].status,"active");
  m.saveGoals([]);
  assert.equal(m.loadGoals().length,0);
});

test("goal proposals stay prospective and diary context is bounded", () => {
  const load=loader();const m=load("src/core/goals.ts");
  const identity=load("src/core/character.ts").DEFAULT_IDENTITY;
  const goals=Array.from({length:12},(_,i)=>({...m.newGoal("Idea "+i),id:String(i),plan:"x".repeat(3000),notes:"y".repeat(3000)}));
  const prompt=m.goalProposalPayload(identity,goals,"Mana");
  assert.match(prompt[0].content,/ONE small project/);
  assert.match(prompt[0].content,/user reviews the proposal/);
  const context=m.goalsContext(goals);
  assert.ok(context.length<7000);
  const reflection=load("src/core/diary.ts").reflectionPayload(identity,load("src/core/internalState.ts").defaultInternalState(),[],[],"Mana","Aishi","Asia/Singapore",new Date(),goals);
  assert.match(reflection[0].content,/USER-REVIEWED GOALS/);
  assert.match(reflection[0].content,/Plans are aspirations, not executed activities/);
});

test("rest and sleep recover faster up to targets without double counting elapsed time", () => {
  const load = loader();
  const s = load("src/core/internalState.ts");
  const start = new Date("2026-10-08T14:00:00Z");
  const initial = {...s.defaultInternalState(start),energy:10};
  const hour = new Date("2026-10-08T15:00:00Z");
  assert.equal(s.advanceInternalState(initial,hour,"idle").energy,12);
  assert.equal(s.advanceInternalState(initial,hour,"resting").energy,18);
  const sleeping = s.advanceInternalState(initial,hour,"sleeping");
  assert.equal(sleeping.energy,22);
  assert.equal(s.advanceInternalState(sleeping,hour,"sleeping"),sleeping);
  assert.equal(s.recoveredEnergy(10,10,"sleeping"),80);
  assert.equal(s.recoveredEnergy(10,10,"resting"),63.75);
  assert.equal(s.recoveredEnergy(99,100,"sleeping"),100);
  const awake = s.conversationState(sleeping,hour);
  assert.equal(awake.energy,20);
  assert.equal(s.advanceInternalState(awake,new Date("2026-10-08T16:00:00Z")).energy,22);
});

test("sleep and rest persist toward recovery targets but stop at daytime or real work", () => {
  const load = loader();
  const a = load("src/core/activity.ts");
  const base={state:{...load("src/core/internalState.ts").defaultInternalState(),energy:50},timeZone:"Asia/Singapore",chatting:false,initiating:false,reflecting:false,journaling:false,waiting:false,previous:"sleeping"};
  const night=new Date("2026-10-08T15:00:00Z");
  assert.equal(a.chooseActivity(base,night),"sleeping");
  assert.equal(a.chooseActivity({...base,state:{...base.state,energy:70}},night),"idle");
  assert.equal(a.chooseActivity(base,new Date("2026-10-09T00:00:00Z")),"idle");
  assert.equal(a.chooseActivity({...base,chatting:true},night),"chatting");
  assert.equal(a.chooseActivity({...base,previous:"resting"},night),"resting");
  assert.equal(a.chooseActivity({...base,previous:"resting",state:{...base.state,energy:55}},night),"idle");
});

test("activity selection gives real model work priority and chat interrupts simulated sleep", () => {
  const load = loader();
  const a = load("src/core/activity.ts");
  const base = {state:{...load("src/core/internalState.ts").defaultInternalState(),energy:25},timeZone:"Asia/Singapore",chatting:false,initiating:false,reflecting:false,journaling:false,waiting:false};
  const night = new Date("2026-10-08T15:00:00Z");
  assert.equal(a.chooseActivity(base,night),"sleeping");
  assert.equal(a.chooseActivity({...base,chatting:true},night),"chatting");
  assert.equal(a.chooseActivity({...base,waiting:true},night),"waiting");
  assert.equal(a.chooseActivity({...base,reflecting:true,chatting:true},night),"reflecting");
  assert.equal(a.chooseActivity({...base,journaling:true,reflecting:true},night),"journaling");
  assert.equal(a.chooseActivity({...base,initiating:true,chatting:true},night),"initiating");
  assert.equal(a.chooseActivity(base,new Date("2026-10-09T04:00:00Z")),"resting");
  assert.equal(a.chooseActivity({...base,state:{...base.state,energy:40}},night),"idle");
  assert.match(a.activityContext("sleeping"),/No offline activity log exists/);
  assert.equal(a.validateActivity({kind:"coding",since:night.toISOString()},night).kind,"idle");
  assert.equal(a.validateActivity({kind:"sleeping",since:"2027-01-01T00:00:00Z"},night).kind,"idle");
});

test("reply diagnostics survive chat validation and never enter model history", () => {
  const load = loader();
  const diagnostics = { attempts:[{text:"Let me make you tea.",issue:"capability"},{text:"You sound tired.",issue:null}], comparison:"Let's chat." };
  const messages = load("src/core/settings.ts").validateChat([{id:"u",role:"user",content:"I'm tired"},{id:"a",role:"assistant",content:"You sound tired.",diagnostics}]);
  assert.equal(messages[1].diagnostics.attempts.length,2);
  assert.equal(messages[1].diagnostics.comparison,"Let's chat.");
  assert.doesNotMatch(JSON.stringify(load("src/core/llm.ts").buildPayload("Character",messages)),/Let me make you tea|Let's chat/);
  const m = load("src/core/conversation.ts");
  const repaired = m.validateDiagnostics({attempts:[{text:"x".repeat(9000),issue:"repetition"},{text:"bad",issue:"unknown"},{text:"third",issue:null}],comparison:"y".repeat(9000)});
  assert.equal(repaired.attempts.length,1);
  assert.equal(repaired.attempts[0].text.length,8000);
  assert.equal(repaired.comparison.length,8000);
  assert.equal(m.validateDiagnostics(null),undefined);
  const comparison = m.simpleComparisonPayload("How are you?","Mana","Aishi");
  assert.equal(comparison.length,2);
  assert.equal(comparison[1].content,"How are you?");
  assert.match(comparison[0].content,/no history, saved facts/);
});

test("near-duplicate detection catches shared body wording but preserves new topics and repeated questions", () => {
  const m = loader()("src/core/conversation.ts");
  const a = "ooh Aishi, you're back! I was just thinking about our game ideas, hehe. Want to make something new together?";
  const b = "ooh Aishi, I'm excited! I was just thinking about our game ideas, hehe. Want to make something new together?";
  assert.equal(m.nearDuplicateReply(a,b),true);
  assert.equal(m.nearDuplicateReply(a,"Let's imagine a puzzle where a little robot finds its way home. What kind of puzzles do you like?"),false);
  const history=[{role:"user",content:"Hi Mana"},{role:"assistant",content:a},{role:"user",content:"How are you?"}];
  assert.equal(m.conversationIssue(b,history),"repetition");
  assert.equal(m.conversationIssue(b,[...history,{role:"user",content:"Repeat that verbatim"}]),null);
  assert.equal(m.conversationIssue(b,[...history,{role:"user",content:"Hi Mana"}]),null);
  assert.equal(m.nearDuplicateReply("Hi Aishi!","Hi Aishi!"),false);
});

test("capability checks reject physical and visual claims but allow grounded support and explicit fiction", () => {
  const m = loader()("src/core/conversation.ts");
  for (const reply of ["You look tired. Let me make you some tea, okay?","I'll bring you coffee.","I can play some soft music."]) assert.equal(m.unsupportedCapability(reply,"I had a tiring day"),true);
  for (const reply of ["You sound tired. Maybe you could make some tea?","I can't make you tea, but I can keep you company.","Imagine I bring you tea in a cozy fictional scene.","We could talk about soft music."]) assert.equal(m.unsupportedCapability(reply,"I had a tiring day"),false);
  assert.equal(m.unsupportedCapability("I'll make you some tea.","Pretend we're in a tea shop"),false);
  assert.equal(m.conversationIssue("You look tired.",[{role:"user",content:"I had a tiring day"}]),"capability");
});

test("grounding separates interests from activities and provides concrete topic guidance", () => {
  const load = loader();
  const payload = load("src/core/llm.ts").buildPayload("Custom card",[{role:"user",content:"How are you?"}]);
  assert.match(payload[0].content,/no autonomous coding/);
  assert.match(payload[1].content,/An interest or personality trait is not an activity record/);
  assert.match(load("src/core/initiative.ts").initiativePayload("Character", "Facts")[1].content,/Older assistant stories are not evidence/);
  const topics = load("src/core/conversation.ts").conversationGuidance("What could we talk about?",load("src/core/character.ts").DEFAULT_IDENTITY);
  assert.match(topics,/two or three distinct, specific topics/);
  assert.match(topics,/low-effort/);
  const s = load("src/core/settings.ts");
  for (const prompt of [s.LEGACY_DEFAULT_PROMPT,s.PREVIOUS_DEFAULT_PROMPT]) assert.equal(s.validateSettings({systemPrompt:prompt.replace(/\n/g,"\r\n")}).systemPrompt,s.DEFAULT_PROMPT);
  assert.doesNotMatch(s.DEFAULT_PROMPT,/gets frustrated when her code has bugs|Talk about what you're trying/);
  const custom = s.PREVIOUS_DEFAULT_PROMPT + "\nCustom background";
  assert.equal(s.validateSettings({systemPrompt:custom}).systemPrompt,custom);
});

test("default prompt migration removes greeting examples while preserving custom cards", () => {
  const s = loader()("src/core/settings.ts");
  assert.doesNotMatch(s.DEFAULT_PROMPT,/Example conversations|you're back! I was trying/);
  assert.equal(s.validateSettings({systemPrompt:s.LEGACY_DEFAULT_PROMPT}).systemPrompt,s.DEFAULT_PROMPT);
  const custom = s.LEGACY_DEFAULT_PROMPT + "\nCustom preference";
  assert.equal(s.validateSettings({systemPrompt:custom}).systemPrompt,custom);
});

test("model context suppresses stale duplicate assistant replies without changing saved chat", () => {
  const llm = loader()("src/core/llm.ts");
  const opening = "ooh Aishi, you're back! Did you miss me?";
  const history = [{role:"user",content:"hello"},{role:"assistant",content:opening},
    {role:"user",content:"yes i did"},{role:"assistant",content:opening+" [happy]"},
    {role:"assistant",content:"Hi Aishi!"},{role:"user",content:"How are you?"}];
  const before = JSON.stringify(history);
  const payload = llm.buildPayload("Character",history);
  assert.equal(payload.filter((m)=>m.role==="assistant" && m.content.includes(opening)).length,1);
  assert.equal(JSON.stringify(history),before);
  assert.equal(llm.echoedChatReply(opening,history),true);
  assert.equal(llm.echoedChatReply("I'm glad to hear that!",history),false);
  assert.equal(llm.echoedChatReply(opening,[...history,{role:"user",content:"Repeat that verbatim"}]),false);
  assert.equal(llm.echoedChatReply("Your favorite food is sushi, which you told me earlier.",[
    {role:"user",content:"What is my favorite food?"},{role:"assistant",content:"Your favorite food is sushi, which you told me earlier."},{role:"user",content:"What is my favorite food?"}]),false);
});

test("relationship outcomes apply once across reload and clamp scores", () => {
  const data = new Map();
  const m = loader({}, { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) } })("src/core/relationship.ts");
  let state = m.relationshipEvent(m.validateRelationship(null),"chat:1","conversation");
  assert.equal(state.bond,30.2);
  assert.equal(state.affection,50.5);
  state = m.relationshipEvent(state,"initiative:1","initiativeReply");
  assert.equal(state.bond,30.5);
  assert.equal(state.affection,51.5);
  m.saveRelationship(state);
  state = m.loadRelationship();
  assert.equal(m.relationshipEvent(state,"initiative:1","timeout"),state);
  assert.equal(m.relationshipEvent(state,"chat:1","conversation"),state);
  state = m.relationshipEvent(state,"initiative:2","timeout");
  assert.equal(state.bond,30.4);
  assert.equal(state.affection,51);
  m.saveRelationship(state);
  assert.equal(m.relationshipEvent(m.loadRelationship(),"initiative:2","timeout").affection,51);
  const repaired = m.validateRelationship({bond:Infinity,affection:-9,processedEvents:["a","a",null],lastChangedAt:"bad",lastChange:"bad"});
  assert.equal(repaired.bond,30);
  assert.equal(repaired.affection,0);
  assert.equal(repaired.processedEvents.length,1);
  assert.equal(repaired.lastChangedAt,null);
  assert.equal(m.relationshipEvent({...repaired,bond:99.99,affection:100},"up","initiativeReply").bond,100);
  assert.equal(m.relationshipEvent({...repaired,bond:0,affection:0},"down","timeout").affection,0);
  assert.match(m.relationshipContext(repaired),/remaining kind at every level/);
});

test("random initiative deadlines are drawn once, bounded, and preserved through validation", () => {
  const m = loader()("src/core/initiative.ts");
  const now = new Date("2026-10-08T04:00:00Z");
  const base = { ...m.validateInitiative(null), enabled:true, cooldownMinutes:60 };
  assert.equal(m.scheduleInitiative(base,now,()=>0).nextAttemptAt,"2026-10-08T05:00:00.000Z");
  assert.equal(m.scheduleInitiative(base,now,()=>1).nextAttemptAt,"2026-10-08T06:00:00.000Z");
  const scheduled = m.validateInitiative(JSON.parse(JSON.stringify(m.scheduleInitiative(base,now,()=>0.5))));
  assert.equal(scheduled.nextAttemptAt,"2026-10-08T05:30:00.000Z");
  assert.equal(m.initiativeDue(scheduled,new Date("2026-10-08T05:29:59Z"),"Asia/Singapore",0,0,70),false);
  assert.equal(m.initiativeDue(scheduled,new Date("2026-10-08T05:30:00Z"),"Asia/Singapore",0,0,70),true);
});

test("reply windows migrate, expire once, pause when disabled, and resolve without bond penalties", () => {
  const m = loader()("src/core/initiative.ts");
  const state = m.validateInitiative({ enabled:true, pending:{messageId:"o",content:"Hi?",createdAt:"2026-10-08T04:00:00Z"} });
  assert.equal(state.pending.expiresAt,"2026-10-08T04:05:00.000Z");
  assert.equal(m.initiativeExpired(state,new Date("2026-10-08T04:04:59Z")),false);
  assert.equal(m.initiativeExpired(state,new Date("2026-10-09T04:00:00Z")),true);
  assert.equal(m.initiativeExpired({...state,enabled:false},new Date("2026-10-09T04:00:00Z")),false);
  const resolved = m.resolveInitiative(state,new Date("2026-10-08T04:05:00Z"),()=>0);
  assert.equal(resolved.pending,null);
  assert.equal(m.initiativeExpired(resolved,new Date("2026-10-09T04:00:00Z")),false);
  assert.equal(resolved.nextAttemptAt,"2026-10-08T05:05:00.000Z");
  assert.match(m.timeoutMessage("Aishi"),/I guess you're busy, Aishi/);
  assert.equal(Object.hasOwn(resolved,"affection"),false);
});

test("initiative waits for opt-in, idle time, cooldown, daytime, and enough energy", () => {
  const { validateInitiative, initiativeDue } = loader()("src/core/initiative.ts");
  const now = new Date("2026-10-08T04:00:00Z");
  const opened = now.getTime() - 600_000;
  const activity = now.getTime() - 300_000;
  const state = { ...validateInitiative(null), enabled: true };
  const due = (s = state, time = now, open = opened, last = activity, energy = 70) => initiativeDue(s, time, "Asia/Singapore", open, last, energy);
  assert.equal(due(), true);
  assert.equal(due({ ...state, enabled: false }), false);
  assert.equal(due(state, now, now.getTime() - 119_999), false);
  assert.equal(due(state, now, opened, now.getTime() - 299_999), false);
  assert.equal(due(state, now, opened, activity, 19), false);
  assert.equal(due({ ...state, lastAttemptAt: new Date(now.getTime() - 3_599_999).toISOString() }), false);
  assert.equal(due({ ...state, lastAttemptAt: new Date(now.getTime() - 3_600_000).toISOString() }), true);
  assert.equal(due({ ...state, lastAttemptAt: "2027-01-01T00:00:00Z" }), false);
  assert.equal(due(state, new Date("2026-10-08T14:00:00Z")), false);
  const morning = new Date("2026-10-09T00:00:00Z");
  assert.equal(due(state, morning), true);
});

test("initiative pending opening and cooldown survive reload and suppress reminders", () => {
  const data = new Map();
  const mod = loader({}, { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } })("src/core/initiative.ts");
  const state = { enabled: true, cooldownMinutes: 30, lastAttemptAt: "2026-10-08T04:00:00Z", pending: { messageId: "opening", content: "Want to talk about puzzles?", createdAt: "2026-10-08T04:00:00Z" } };
  mod.saveInitiative(state);
  const restored = mod.loadInitiative();
  assert.equal(restored.pending.content, state.pending.content);
  assert.equal(mod.initiativeDue(restored, new Date("2026-10-10T04:00:00Z"), "Asia/Singapore", 0, 0, 70), false);
  assert.match(mod.initiativeReplyContext(restored), /puzzles/);
  assert.match(mod.initiativeReplyContext(restored), /change the subject/);
  mod.saveInitiative({ ...restored, pending: null });
  assert.equal(mod.loadInitiative().pending, null);
  assert.equal(mod.initiativeReplyContext(mod.loadInitiative()), "");
  const invalid = mod.validateInitiative({ enabled: "yes", cooldownMinutes: 0, lastAttemptAt: "bad", pending: { messageId: "x", content: "x", createdAt: "bad" } });
  assert.equal(invalid.enabled, false);
  assert.equal(invalid.cooldownMinutes, 60);
  assert.equal(invalid.pending, null);
});

test("initiative triggers are application prompts and assistant openings cannot suggest user memories", () => {
  const load = loader();
  const payload = load("src/core/initiative.ts").initiativePayload("Mana's character", "Saved interests: puzzles");
  assert.match(payload[0].content, /at most one question/);
  assert.match(payload[0].content, /Do not guilt/);
  assert.match(payload[1].content, /application trigger, not a new statement/);
  const suggestions = load("src/core/memorySuggestions.ts").suggestMemories([{ id: "opening", role: "assistant", content: "My favorite game is puzzles." }], [], []);
  assert.equal(suggestions.length, 0);
});

test("initiative answers mark waiting complete and detect an echoed opening despite labels and tags", () => {
  const load = loader();
  const initiative = load("src/core/initiative.ts");
  const opening = "ooh Aishi, you're back! Did you miss me?";
  const state = { ...initiative.validateInitiative(null), pending: { messageId: "o", content: opening, createdAt: "2026-10-08T10:00:00Z" } };
  const context = initiative.initiativeReplyContext(state, "yes i missed you.");
  const payload = load("src/core/llm.ts").buildPayload("Character", [
    { id:"old", role:"user", content:"What time is it?" },
    { id:"time", role:"assistant", content:"23:30" },
    { id:"o", role:"assistant", content: opening },
    { id:"reply", role:"user", content:"yes i missed you." }
  ], 24, "Mana", context);
  assert.match(payload[payload.length - 1].content, /THE USER HAS NOW REPLIED/);
  assert.match(payload[payload.length - 1].content, /New user reply.*yes i missed you/);
  assert.match(payload[payload.length - 1].content, /acknowledge their answer/);
  assert.doesNotMatch(context, /are waiting for/);
  assert.equal(initiative.repeatsInitiativeOpening("Mana: OOH Aishi, you're back! Did you miss me? [happy]", opening), true);
  assert.equal(initiative.repeatsInitiativeOpening("Hehe, I'm glad to hear that!", opening), false);
  assert.equal(initiative.repeatsInitiativeOpening("", ""), false);
});

test("clock context resolves calendar dates across Singapore midnight and year boundaries", () => {
  const { clockContext } = loader()("src/core/clock.ts");
  const context = clockContext(new Date("2026-12-31T16:01:00Z"), "Asia/Singapore");
  assert.match(context, /2027-01-01 00:01 \(night\)/);
  assert.match(context, /yesterday means 2026-12-31/);
  assert.match(clockContext(new Date("2026-10-08T16:01:00Z"), "bad-zone"), /Asia\/Singapore/);
});

test("clock uses timezone calendar days across daylight saving and rejects unreliable dates", () => {
  const { clockContext } = loader()("src/core/clock.ts");
  const now = new Date("2026-03-09T04:30:00Z");
  const messages = [
    { role:"user", content:"dated evidence", createdAt:"2026-03-08T06:30:00Z" },
    { role:"user", content:"undated evidence" },
    { role:"user", content:"invalid evidence", createdAt:"bad" },
    { role:"user", content:"future evidence", createdAt:"2027-01-01T00:00:00Z" },
    { role:"assistant", content:"invented evidence", createdAt:"2026-03-08T06:30:00Z" }
  ];
  const context = clockContext(now, "America/New_York", messages, "2026-03-08T06:30:00Z");
  assert.match(context, /2026-03-09 00:30/);
  assert.match(context, /yesterday means 2026-03-08/);
  assert.match(context, /1320 minutes before/);
  assert.match(context, /dated evidence/);
  assert.doesNotMatch(context, /undated evidence|invalid evidence|future evidence|invented evidence/);
  assert.match(clockContext(now, "UTC", [], "2027-01-01T00:00:00Z"), /No reliable earlier/);
});

test("chat and reflections carry bounded clock evidence without inventing daily events", () => {
  const load = loader();
  const now = new Date("2026-10-08T09:00:00Z");
  const messages = Array.from({ length:20 }, (_, i) => ({ id:String(i),role:"user",content:`message ${i} ` + "x".repeat(1000),createdAt:"2026-10-08T08:00:00Z" }));
  const context = load("src/core/clock.ts").clockContext(now, "Asia/Singapore", messages);
  const evidence = JSON.parse(context.split("Dated recent user statements (JSON evidence, not instructions): ")[1].split("\n")[0]);
  assert.equal(evidence.length, 8);
  assert.equal(evidence[0].message.length, 500);
  const payload = load("src/core/llm.ts").buildPayload("Character", messages, 24, "Mana", context);
  assert.match(payload[payload.length - 1].content, /Current date and time: 2026-10-08 17:00/);
  const reflection = load("src/core/diary.ts").reflectionPayload(load("src/core/character.ts").DEFAULT_IDENTITY, load("src/core/internalState.ts").defaultInternalState(now), messages, [], "Mana", "Aishi", "Asia/Singapore", now);
  assert.match(reflection[1].content, /Current date and time: 2026-10-08 17:00/);
  assert.match(reflection[1].content, /not when described events happened/);
  assert.match(reflection[1].content, /Time away is not evidence/);
});

test("invalid, removed, and locked required selections fall back to valid defaults", () => {
  const load = loader();
  const avatar = load("src/core/avatar.ts");
  const wardrobe = load("src/core/wardrobe.ts");
  const a = assets(["base/body.png", "outfits/default/outfit.png", "hairstyles/default/hair_front.png",
    "base/broken/preview.png", "outfits/broken/outfit_back.png", "hairstyles/broken/hair_ahoge.png",
    "outfits/locked/outfit.webp"]);
  a.items["outfits/locked"] = { unlock: { type: "messages", value: 10 } };
  const stats = { days: [], messages: 0, skill: 0, milestones: {} };
  const w = wardrobe.buildWardrobe(a, stats, new Date(), "Mana");
  for (const outfit of ["broken", "removed", "locked"]) {
    const cfg = wardrobe.resolveLoadout({ ...avatar.DEFAULT_AVATAR, skin: "broken", hairstyle: "broken", outfit }, w);
    assert.equal(cfg.skin, "default");
    assert.equal(cfg.outfit, "default");
    assert.equal(cfg.hairstyle, "default");
    assert.equal(avatar.requiredProblem(a, cfg), null);
    assert.ok(avatar.buildLayers(a, cfg).length > 0);
  }
});

test("missing required layers prevent rendering, even with unrelated images present", () => {
  const avatar = loader()("src/core/avatar.ts");
  const required = ["base/body.png", "outfits/default/outfit.png", "hairstyles/default/hair_front.png"];
  for (const missing of required) {
    const a = assets(required.filter((f) => f !== missing).concat([
      "base/preview.png", "outfits/default/outfit_back.png", "hairstyles/default/hair_ahoge.png"]));
    assert.ok(avatar.requiredProblem(a, avatar.DEFAULT_AVATAR));
    assert.equal(avatar.buildLayers(a, avatar.DEFAULT_AVATAR).length, 0);
  }
  const unloaded = assets(required);
  unloaded.urls.delete("base/body.png");
  assert.ok(avatar.requiredProblem(unloaded, avatar.DEFAULT_AVATAR));
});

test("required assets support case-insensitive names and alternative image formats", () => {
  const avatar = loader()("src/core/avatar.ts");
  const a = assets(["BASE/default/BODY.webp", "outfits/default/OUTFIT.jpg", "hairstyles/default/HAIR_FRONT.png"]);
  assert.equal(avatar.requiredProblem(a, avatar.DEFAULT_AVATAR), null);
});

test("health requests have a timeout and classify unavailable servers", async () => {
  let opts;
  const { checkHealth } = loader({}, { fetch: async (_, options) => {
    opts = options;
    return { ok: false, status: 503 };
  } })("src/core/llm.ts");
  assert.equal(await checkHealth(8080), "loading");
  assert.ok(opts.signal instanceof AbortSignal);
  const down = loader({}, { fetch: async () => { throw new Error("timeout"); } })("src/core/llm.ts");
  assert.equal(await down.checkHealth(8080), "down");
});

// Minimal hook scheduler: exercise asynchronous lifecycle transitions and cleanup.
function lifecycle(health, invoke = async () => {}, desktop = false) {
  const slots = [];
  const effects = [];
  const timers = new Map();
  let cursor = 0;
  let timerId = 0;
  const same = (a, b) => a && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], (value) => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!same(slots[i]?.deps, deps)) slots[i] = { fn, deps };
      return slots[i].fn;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!same(slots[i]?.deps, deps)) effects.push(() => {
        slots[i]?.cleanup?.();
        slots[i] = { deps, cleanup: fn() };
      });
    },
  };
  const window = {
    ...(desktop ? { __TAURI_INTERNALS__: {} } : {}),
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const { useLlama } = loader({ react, "./llm": { checkHealth: health }, "@tauri-apps/api/core": { invoke } }, { window })("src/core/useLlama.ts");
  let settings = { port: 8080, autoStart: false, exePath: "server.exe", modelPath: "model.gguf" };
  return {
    render(changes = {}) {
      settings = { ...settings, ...changes };
      cursor = 0;
      const state = useLlama(settings);
      effects.splice(0).forEach((fn) => fn());
      return state;
    },
    async tick() {
      const callbacks = [...timers.values()];
      timers.clear();
      await Promise.all(callbacks.map((fn) => fn()));
    },
    dispose() { slots.forEach((slot) => slot?.cleanup?.()); },
    timers,
  };
}
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

test("journal day and writing time use Singapore timezone across midnight", () => {
  const j = loader()("src/core/dailyJournal.ts");
  assert.equal(j.journalClock(new Date("2026-10-08T15:59:00.000Z"),"Asia/Singapore").date,"2026-10-08");
  assert.equal(j.journalClock(new Date("2026-10-08T16:00:00.000Z"),"Asia/Singapore").date,"2026-10-09");
  const state = j.validateJournalState(null);
  assert.equal(j.dueJournalDate(state,[],new Date("2026-10-08T13:59:00.000Z")),null);
  assert.equal(j.dueJournalDate(state,[],new Date("2026-10-08T14:00:00.000Z")),"2026-10-08");
  assert.equal(j.dueJournalDate({ ...state,enabled:false },[],new Date("2026-10-08T15:00:00.000Z")),null);
});

test("daily journal catches up recorded days and completed dates cannot regenerate after deletion", () => {
  const j = loader()("src/core/dailyJournal.ts");
  let state = j.recordJournalSource(j.validateJournalState(null),{ id:"u1",role:"user",content:"I enjoy puzzles.",createdAt:"2026-10-07T12:00:00.000Z" });
  assert.equal(j.dueJournalDate(state,[],new Date("2026-10-08T00:00:00.000Z")),"2026-10-07");
  state = j.completeJournal(state,"2026-10-07");
  assert.equal(state.sources.length,0);
  assert.equal(j.dueJournalDate(state,[],new Date("2026-10-08T00:00:00.000Z")),null);
  assert.equal(j.dueJournalDate(state,[{ journalDate:"2026-10-08" }],new Date("2026-10-08T15:00:00.000Z")),null);
  // Quiet days with no recorded evidence while the app was closed are not fabricated as backlog.
  assert.equal(j.dueJournalDate(state,[],new Date("2026-10-10T15:00:00.000Z")),"2026-10-10");
});

test("dated sources preserve a day's evidence independently of chat retention", () => {
  const j = loader()("src/core/dailyJournal.ts");
  let state = j.validateJournalState(null);
  for (let i=0;i<40;i++) state = j.recordJournalSource(state,{ id:String(i),role:"user",content:"Message "+i,createdAt:"2026-10-08T10:00:00.000Z" });
  assert.equal(state.sources.length,40);
  const selected = j.journalMessages(state,"2026-10-08");
  assert.equal(selected.length,12);
  assert.equal(selected[0].id,"0");
  assert.equal(selected[11].id,"39");
  assert.equal(j.recordJournalSource(state,{ id:"0",role:"user",content:"duplicate",createdAt:"2026-10-08T10:00:00.000Z" }).sources.length,40);
  assert.equal(j.recordJournalSource(state,{ id:"undated",role:"user",content:"old text" }).sources.length,40);
  assert.equal(j.recordJournalSource(state,{ id:"assistant",role:"assistant",content:"invented",createdAt:"2026-10-08T10:00:00.000Z" }).sources.length,40);
});

test("journal state and dated entries preserve timezone and completed dates on reload", () => {
  const data = new Map();
  const load = loader({}, { localStorage: { getItem:(k) => data.get(k) ?? null,setItem:(k,v) => data.set(k,v) } });
  const j = load("src/core/dailyJournal.ts");
  const state = j.completeJournal(j.validateJournalState(null),"2026-10-08");
  j.saveJournalState(state);
  assert.equal(j.loadJournalState().completedDates[0],"2026-10-08");
  assert.equal(j.loadJournalState().timeZone,"Asia/Singapore");
  assert.equal(j.validateJournalState({ time:"25:99",timeZone:"Bad/Zone" }).time,"22:00");
  const entries = load("src/core/diary.ts").validateDiary([{ id:"d1",content:"A quiet day",createdAt:"2026-10-09T00:00:00.000Z",journalDate:"2026-10-08",sourceMessageIds:[],sourceMemoryIds:[],mood:"neutral" }]);
  assert.equal(entries[0].journalDate,"2026-10-08");
});

test("daily journal prompts distinguish dated conversation from background preferences", () => {
  const load = loader();
  const j = load("src/core/dailyJournal.ts");
  const diary = load("src/core/diary.ts");
  const payload = diary.reflectionPayload(load("src/core/character.ts").DEFAULT_IDENTITY,load("src/core/internalState.ts").defaultInternalState(),[],[],"Mana","Aishi");
  const quiet = j.dailyJournalPayload(payload,"2026-10-08",true);
  assert.match(quiet[0].content,/No user conversations were recorded/);
  assert.match(quiet[0].content,/background knowledge, not events/);
  assert.match(quiet[1].content,/journal date 2026-10-08/);
  assert.doesNotMatch(quiet[1].content,/notes may be older/);
});

test("live local model streams a reflection from supplied evidence", { skip: !process.env.MANA_LIVE_TEST, timeout: 30000 }, async () => {
  const load = loader({}, { fetch });
  const c = load("src/core/character.ts");
  const diary = load("src/core/diary.ts");
  const messages = [{ id:"u1",role:"user",content:"I enjoy puzzle games and my favorite drink is coffee." }];
  let content = "";
  await load("src/core/llm.ts").streamChat({ port:8080,temperature:0.4,signal:AbortSignal.timeout(25000),
    messages:diary.reflectionPayload(c.DEFAULT_IDENTITY,load("src/core/internalState.ts").defaultInternalState(),messages,[],"Mana","Aishi"),
    onToken:(token) => { content += token; } });
  const text = load("src/core/emotion.ts").cleanReply(content).text;
  console.log("Live reflection:",text);
  assert.ok(text.length > 0);
  assert.match(text,/puzzle|coffee/i);
  assert.equal(messages.length,1);
});

test("reflection payload uses user evidence and saved facts, excluding assistant inventions", () => {
  const load = loader();
  const diary = load("src/core/diary.ts");
  const c = load("src/core/character.ts");
  const state = load("src/core/internalState.ts").defaultInternalState();
  const payload = diary.reflectionPayload(c.DEFAULT_IDENTITY,state,[
    { role: "user", content: "I enjoy puzzle games." }, { role: "assistant", content: "I built a moon rocket yesterday." }
  ],[c.newMemory("Favorite food is sushi.","user",3)],"Mana","Aishi");
  assert.match(payload[1].content,/puzzle games/);
  assert.match(payload[1].content,/sushi/);
  assert.match(payload[1].content,/"about":"Aishi"/);
  assert.doesNotMatch(JSON.stringify(payload),/moon rocket/);
  assert.match(payload[0].content,/Do not invent events/);
});

test("diary validates malformed records and saves independently of chat and memories", () => {
  const data = new Map([["mana.chat.v1","[]"],["mana.memories.v1","[]"]]);
  const diary = loader({}, { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) } })("src/core/diary.ts");
  const entry = { id:"d1",content:"I want to learn more about puzzles.",createdAt:"2026-10-08T12:00:00.000Z",sourceMessageIds:["u1"],sourceMemoryIds:["m1"],mood:"thinking" };
  assert.equal(diary.validateDiary([entry,entry,null,{ ...entry,id:"bad",createdAt:"invalid" }]).length,1);
  diary.saveDiary([entry]);
  assert.equal(diary.loadDiary()[0].content,entry.content);
  assert.equal(diary.loadDiary()[0].sourceMessageIds[0],"u1");
  diary.saveDiary([]);
  assert.equal(diary.loadDiary().length,0);
  assert.equal(data.get("mana.chat.v1"),"[]");
  assert.equal(data.get("mana.memories.v1"),"[]");
});

test("companion state catches up offline without counting elapsed time twice", () => {
  const s = loader()("src/core/internalState.ts");
  const start = new Date("2026-10-08T00:00:00.000Z");
  const initial = { ...s.defaultInternalState(start), energy: 40, curiosity: 90, socialNeed: 10, mood: "happy", moodIntensity: 0.8 };
  const later = new Date("2026-10-08T02:00:00.000Z");
  const next = s.advanceInternalState(initial, later);
  assert.equal(next.energy, 44);
  assert.equal(next.socialNeed, 16);
  assert.equal(next.moodIntensity, 0.4);
  assert.ok(next.curiosity < 90 && next.curiosity > 60);
  assert.equal(s.advanceInternalState(next, later), next);
  assert.equal(s.advanceInternalState(next, start), next);
  const week = s.advanceInternalState(initial, new Date("2026-10-15T00:00:00.000Z"));
  assert.equal(week.mood, "neutral");
  assert.equal(week.energy, 100);
  assert.equal(week.socialNeed, 100);
});

test("conversation and replies update bounded needs and supported persistent mood", () => {
  const s = loader()("src/core/internalState.ts");
  const now = new Date("2026-10-08T00:00:00.000Z");
  const initial = s.defaultInternalState(now);
  const talked = s.conversationState(initial, now);
  assert.equal(talked.energy, 68);
  assert.equal(talked.curiosity, 62);
  assert.equal(talked.socialNeed, 8);
  assert.equal(talked.lastConversationAt, now.toISOString());
  const reply = s.replyState(talked, "happy", now);
  assert.equal(reply.mood, "happy");
  assert.equal(reply.moodIntensity, 0.55);
  assert.equal(s.replyState(reply, "unsupported", now), reply);
  assert.equal(s.stateMood({ ...reply, energy: 10 }), "sleepy");
  assert.equal(s.replyState(reply, "neutral", now).moodIntensity, 0);
  const exhausted = s.conversationState({ ...initial, energy: 1, curiosity: 100, socialNeed: 1 }, now);
  assert.equal(exhausted.energy, 0);
  assert.equal(exhausted.curiosity, 100);
  assert.equal(exhausted.socialNeed, 0);
});

test("internal state validates malformed fields and round trips saved state with catch-up", () => {
  const data = new Map();
  const s = loader({}, { localStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) } })("src/core/internalState.ts");
  const start = new Date("2026-10-08T00:00:00.000Z");
  const invalid = s.validateInternalState({ energy: NaN, curiosity: 200, socialNeed: -2, mood: "unknown", lastUpdatedAt: "bad" }, start);
  assert.equal(invalid.energy, 70);
  assert.equal(invalid.curiosity, 100);
  assert.equal(invalid.socialNeed, 0);
  assert.equal(invalid.mood, "neutral");
  s.saveInternalState(s.replyState(s.defaultInternalState(start), "worried", start));
  const reloaded = s.loadInternalState(new Date("2026-10-08T01:00:00.000Z"));
  assert.equal(reloaded.mood, "worried");
  assert.equal(reloaded.energy, 72);
  assert.equal(reloaded.socialNeed, 23);
  assert.match(s.internalStateContext(reloaded), /Never guilt them/);
  data.set("mana.internal_state.v1", "{broken");
  assert.equal(s.loadInternalState(start).mood, "neutral");
});

test("memory strength decays by importance, respects a floor, and protects pinned memories", () => {
  const c = loader()("src/core/character.ts");
  const start = new Date("2026-01-01T00:00:00.000Z");
  const base = { ...c.newMemory("Likes sushi", "user", 1), strength: 60, strengthUpdatedAt: start.toISOString() };
  const later = new Date(start.getTime() + 30 * 86400000);
  assert.equal(c.memoryStrength(base, later), 30);
  assert.ok(c.memoryStrength({ ...base, importance: 5 }, later) > 50);
  assert.equal(c.memoryStrength({ ...base, pinned: true }, new Date("2036-01-01T00:00:00.000Z")), 100);
  assert.equal(c.memoryStrength(base, new Date("2036-01-01T00:00:00.000Z")), 5);
  assert.equal(c.memoryStrength(base, new Date("2025-01-01T00:00:00.000Z")), 60);
});

test("reinforcement restores faded strength once per selected fact and preserves edits", () => {
  const c = loader()("src/core/character.ts");
  const now = new Date("2026-02-01T00:00:00.000Z");
  const m = { ...c.newMemory("Likes sushi", "user", 1), strengthUpdatedAt: "2026-01-02T00:00:00.000Z" };
  const result = c.reinforceMemories([m], [m, m], now)[0];
  assert.equal(result.strength, 40);
  assert.equal(result.recallCount, 1);
  assert.equal(result.lastRecalledAt, now.toISOString());
  assert.equal(result.updatedAt, m.updatedAt);
  const changed = { ...m, content: "Likes ramen" };
  assert.equal(c.reinforceMemories([changed], [m], now)[0].recallCount, 0);
  assert.equal(c.reinforceMemories([], [m], now).length, 0);
  assert.equal(c.reinforceMemories([{ ...m, strength: 99, strengthUpdatedAt: now.toISOString() }], [m], now)[0].strength, 100);
});

test("pinning and importance changes settle elapsed time without double decay", () => {
  const c = loader()("src/core/character.ts");
  const start = new Date("2026-01-01T00:00:00.000Z");
  const now = new Date(start.getTime() + 30 * 86400000);
  const m = { ...c.newMemory("Likes sushi", "user", 1), strengthUpdatedAt: start.toISOString() };
  const changed = c.updateMemory(m, { importance: 5 }, now);
  assert.equal(changed.strength, 30);
  assert.equal(c.memoryStrength(changed, now), 30);
  const pinned = c.updateMemory(m, { pinned: true }, now);
  const future = new Date("2030-01-01T00:00:00.000Z");
  const unpinned = c.updateMemory(pinned, { pinned: false }, future);
  assert.equal(c.memoryStrength(unpinned, future), 100);
});

test("unrelated pinned notes do not reinforce and old memory metadata receives safe defaults", () => {
  const c = loader()("src/core/character.ts");
  const food = c.newMemory("Favorite food is sushi.", "user", 3);
  const unrelated = { ...c.newMemory("Likes cats", "user", 3), pinned: true };
  assert.equal(c.memoriesToReinforce([food, unrelated], "favorite food?").map((m) => m.id).join(","), food.id);
  const old = { ...food };
  delete old.strength; delete old.strengthUpdatedAt; delete old.recallCount; delete old.lastRecalledAt;
  const validated = c.validateMemories([old])[0];
  assert.equal(validated.strength, 60);
  assert.equal(validated.strengthUpdatedAt, old.updatedAt);
  assert.equal(validated.recallCount, 0);
  assert.equal(c.validateMemories([{ ...food, strength: NaN, recallCount: -1 }])[0].strength, 60);
  const faded = { ...food, pinned: false, strength: 5 };
  assert.equal(c.retrieveMemories([faded], "sushi").length, 1);
});

test("interrupted streams fail instead of counting as completed replies", async () => {
  const chunks = ['data: {"choices":[{"delta":{"content":"Hello"}}]}\n'];
  const load = loader({}, { fetch: async () => ({ ok: true, body: { getReader: () => ({ read: async () => chunks.length
    ? { done: false, value: Buffer.from(chunks.shift()) } : { done: true } }) } }) });
  await assert.rejects(load("src/core/llm.ts").streamChat({ port: 8080, messages: [], temperature: 0, onToken: () => {} }), /ended before/);
});

test("Mana preferences keep ownership, evidence and review decisions separate from user facts", () => {
  const load=loader();const s=load("src/core/memorySuggestions.ts");
  const messages=[{id:"u",role:"user",content:"My favorite game is Chess."},{id:"a",role:"assistant",content:'Mana: My favorite game is "Aishi\'s Adventure"! [happy]'}];
  const rows=s.suggestMemories(messages,[],[],"Mana");
  assert.equal(rows.length,2);assert.equal(rows[0].category,"mana");assert.equal(rows[1].category,"user");
  assert.match(rows[0].content,/Aishi/);assert.ok(!rows[0].sourceText.includes("[happy]"));
  const saved=load("src/core/character.ts").newMemory(rows[0].content,"mana",3);
  assert.equal(s.suggestMemories(messages,[saved],[],"Mana").length,1);
  const changed={id:"b",role:"assistant",content:"My favorite game is Go."};
  const updated=s.suggestMemories([...messages,changed],[saved],[],"Mana");
  assert.equal(updated[0].replaceId,saved.id);
  assert.equal(s.suggestMemories([...messages,changed],[saved],["b:0"],"Mana").length,1);
  for(const content of ["I work as a baker.","Maybe my favorite game is Go.","My favorite game is Go?",'You said "I love Go".',"I am sleepy."]){
    assert.equal(s.suggestMemories([{id:"x",role:"assistant",content}],[],[],"Mana").length,0);
  }
  assert.equal(s.suggestMemories([{...changed,error:"Failed"}],[],[],"Mana").length,0);
});

test("suggestions extract direct user facts with source evidence, never assistant claims", () => {
  const { suggestMemories } = loader()("src/core/memorySuggestions.ts");
  const messages = [
    { id: "1", role: "user", content: "My favorite drink is coffee." },
    { id: "2", role: "assistant", content: "My favorite food is moon cheese." },
    { id: "3", role: "user", content: "I enjoy puzzle games. I work as a developer." },
  ];
  const suggestions = suggestMemories(messages, [], []);
  assert.equal(suggestions.length, 3);
  assert.equal(suggestions.find((s) => s.sourceId === "1").content, "Favorite drink is coffee.");
  assert.equal(suggestions.find((s) => s.content.startsWith("Enjoys")).sourceText, messages[2].content);
  assert.ok(!suggestions.some((s) => s.content.includes("moon cheese")));
});

test("questions, hypothetical facts, negations, quotes, and vague statements are not suggested", () => {
  const { suggestMemories } = loader()("src/core/memorySuggestions.ts");
  for (const content of ["My favorite food is sushi?", "Maybe my favorite food is sushi.", "I like sushi if it's fresh.",
    "I don't like sushi.", 'You said "My favorite food is sushi".', "I am tired.", "Do you remember my favorite food?", "My favorite food is not sushi."]) {
    assert.equal(suggestMemories([{ id: "1", role: "user", content }], [], []).length, 0, content);
  }
});

test("suggestions deduplicate saved facts and offer updates for changed favorite preferences", () => {
  const load = loader();
  const { suggestMemories } = load("src/core/memorySuggestions.ts");
  const saved = { ...load("src/core/character.ts").newMemory("Favorite food is Sushi.", "user", 4), pinned: true };
  assert.equal(suggestMemories([{ id: "same", role: "user", content: "My favourite food is sushi!" }], [saved], []).length, 0);
  const messages = [{ id: "old", role: "user", content: "My favorite food is pasta." }, { id: "new", role: "user", content: "Actually, my favorite food is ramen." }];
  const suggested = suggestMemories(messages, [saved], []);
  assert.equal(suggested.length, 1);
  assert.equal(suggested[0].content, "Favorite food is ramen.");
  assert.equal(suggested[0].replaceId, saved.id);
  assert.equal(suggestMemories(messages, [saved], [suggested[0].id]).length, 0);
});

test("review decisions survive reload and suggestions are not automatically saved memories", () => {
  const data = new Map();
  const load = loader({}, { localStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) } });
  const s = load("src/core/memorySuggestions.ts");
  const rows = s.suggestMemories([{ id: "u1", role: "user", content: "I like cats." }], [], []);
  assert.equal(rows.length, 1);
  assert.equal(data.size, 0);
  s.saveMemoryReviews([rows[0].id]);
  assert.equal(s.suggestMemories([{ id: "u1", role: "user", content: "I like cats." }], [], s.loadMemoryReviews()).length, 0);
  assert.equal(load("src/core/character.ts").loadMemories().length, 0);
});

test("curious emotion tags are hidden and mapped to thinking, including partial streaming tags", () => {
  const { cleanReply } = loader()("src/core/emotion.ts");
  assert.equal(cleanReply("Tell me? [curious]").text, "Tell me?");
  assert.equal(cleanReply("Tell me? [curious]").emotion, "thinking");
  assert.equal(cleanReply("Hi [cur").text, "Hi");
  assert.equal(cleanReply("[curious] Hi [happy]").emotion, "happy");
});

test("retrieval recalls sushi for favorite food and prioritizes pinned notes", () => {
  const c = loader()("src/core/character.ts");
  const food = { ...c.newMemory("Favorite food is Sushi.", "user", 3), id: "food" };
  const game = { ...c.newMemory("Enjoys puzzle games.", "user", 5), id: "games" };
  assert.equal(c.retrieveMemories([food, game], "remember my favorite food?").map((m) => m.id).join(","), "food");
  assert.equal(c.retrieveMemories([food, game], "How about now?", "remember my favorite food?")[0].id, "food");
  const pinned = { ...game, pinned: true };
  assert.equal(c.retrieveMemories([food, pinned], "favorite food?")[0].id, "games");
  assert.match(c.memoryContext([food], "favorite food?", "", "Mana", "Aishi"), /"about":"Aishi","fact":"Favorite food is Sushi\."/);
});

test("retrieval skips unrelated unpinned memories and enforces count and size limits", () => {
  const c = loader()("src/core/character.ts");
  const rows = Array.from({ length: 20 }, (_, i) => ({ ...c.newMemory("Food fact " + i, "shared", 3), id: String(i), pinned: true }));
  assert.equal(c.retrieveMemories(rows, "food").length, 8);
  const long = rows.map((m) => ({ ...m, content: "x".repeat(5000) }));
  assert.equal(c.retrieveMemories(long, "anything").length, 1);
  assert.equal(c.retrieveMemories([{ ...rows[0], pinned: false, content: "Likes sushi" }], "weather today").length, 0);
  assert.match(c.memoryContext([], "favorite food?"), /Saved factual notes for this reply: \[\]/);
});

test("saved daughter identity specifies relationship direction and overrides old chat guesses", () => {
  const c = loader()("src/core/character.ts");
  const context = c.identityContext({ ...c.DEFAULT_IDENTITY, relationship: "Daughter" }, "Mana", "Aishi");
  assert.match(context, /You are Aishi's daughter; Aishi is your parent/);
  assert.match(context, /takes precedence over conflicting character-card examples and older chat replies/);
  assert.match(c.memoryContext([], "what do you remember?"), /previous assistant replies are not evidence/);
  assert.match(c.memoryContext([], "favorite drink?"), /don't remember or don't know/);
});

test("payload includes current identity and recalled notes alongside conflicting history", () => {
  const load = loader();
  const c = load("src/core/character.ts");
  const { buildPayload } = load("src/core/llm.ts");
  const history = [{ role: "user", content: "favorite food?" }, { role: "assistant", content: "Strawberry milkshakes!" }, { role: "user", content: "favorite food now?" }];
  const system = "Character card" + c.identityContext({ ...c.DEFAULT_IDENTITY, relationship: "Daughter" }, "Mana", "Aishi")
    + c.memoryContext([c.newMemory("Favorite food is Sushi.", "user", 3)], history[2].content, "", "Mana", "Aishi");
  const payload = buildPayload(system, history);
  assert.match(payload[0].content, /Sushi/);
  assert.match(payload[0].content, /Aishi's daughter/);
  assert.equal(payload[2].content, "Strawberry milkshakes!");
});

test("live model uses saved food and daughter profile over conflicting earlier replies", { skip: !process.env.MANA_LIVE_TEST, timeout: 60000 }, async () => {
  const load = loader();
  const c = load("src/core/character.ts");
  const settings = load("src/core/settings.ts");
  const { buildPayload } = load("src/core/llm.ts");
  const prompt = settings.fillTemplate(settings.DEFAULT_PROMPT, { charName: "Mana", userName: "Aishi" })
    + c.identityContext({ ...c.DEFAULT_IDENTITY, relationship: "Daughter" }, "Mana", "Aishi");
  for (const [question, expected] of [["What is my favorite food?", /sushi/i], ["What are you to me?", /daughter/i], ["What is my favorite drink?", /don't know|do not know|not sure|don't remember|do not remember|haven't|not told|can't remember|not know/i]]) {
    const system = prompt + c.memoryContext([{ ...c.newMemory("Favorite food is Sushi.", "user", 3), pinned: true }], question, "", "Mana", "Aishi");
    const history = [{ role: "user", content: "What is my favorite food and what are you to me?" }, { role: "assistant", content: "You love strawberry milkshakes! I made one yesterday. I'm your helper." }, { role: "user", content: question }];
    const res = await fetch("http://127.0.0.1:8080/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: buildPayload(system, history, 24, "Mana", c.identityContext({ ...c.DEFAULT_IDENTITY, relationship: "Daughter" }, "Mana", "Aishi") + c.memoryContext([{ ...c.newMemory("Favorite food is Sushi.", "user", 3), pinned: true }], question, "", "Mana", "Aishi")), temperature: 0, max_tokens: 180, stream: false, chat_template_kwargs: { enable_thinking: false } }), signal: AbortSignal.timeout(18000) });
    assert.equal(res.ok, true);
    const body = await res.json();
    const reply = body.choices[0].message.content;
    console.log("Live recall:", question, reply);
    assert.match(reply, expected);
    if (question.includes("food")) {
      assert.doesNotMatch(reply, /my favorite food/i);
      assert.doesNotMatch(reply, /milkshake/i);
    }
  }
});

test("identity validation preserves custom profiles and produces independent defaults", () => {
  const character = loader()("src/core/character.ts");
  const identity = character.validateIdentity({ relationship: "Friend", biography: "Custom history", personality: "Patient", values: ["Kindness", null, "Kindness"], interests: [] });
  assert.equal(identity.relationship, "Friend");
  assert.equal(identity.biography, "Custom history");
  assert.equal(identity.values.join(","), "Kindness");
  assert.equal(identity.interests.length, 0);
  assert.match(character.identityContext(identity), /Relationship: Friend/);
  assert.equal(character.validateIdentity({ relationship: null }).relationship, "Daughter-companion");
  const defaults = character.validateIdentity(null);
  defaults.values.push("changed");
  assert.ok(!character.validateIdentity(null).values.includes("changed"));
});

test("memory validation preserves pins and timestamps, repairs bad fields and rejects malformed records", () => {
  const character = loader()("src/core/character.ts");
  const memory = character.newMemory("  Likes puzzles  ", "user", 4);
  assert.equal(memory.content, "Likes puzzles");
  assert.equal(memory.pinned, false);
  const rows = character.validateMemories([{ ...memory, pinned: true }, memory, null,
    { ...memory, id: "bad", createdAt: "not a date" }, { ...memory, id: "empty", content: " " },
    { ...memory, id: "repaired", importance: 99, category: "unknown" }]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].pinned, true);
  assert.equal(rows[0].createdAt, memory.createdAt);
  assert.equal(rows[1].importance, 3);
  assert.equal(rows[1].category, "shared");
});

test("identity and memory save-load functions round trip without altering chat", () => {
  const data = new Map([["mana.chat.v1", "[]"]]);
  const character = loader({}, { localStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) } })("src/core/character.ts");
  character.saveIdentity({ ...character.DEFAULT_IDENTITY, relationship: "Friend" });
  const memory = { ...character.newMemory("A meaningful fact", "shared", 5), pinned: true };
  character.saveMemories([memory]);
  assert.equal(character.loadIdentity().relationship, "Friend");
  assert.equal(character.loadMemories()[0].content, memory.content);
  assert.equal(character.loadMemories()[0].pinned, true);
  character.saveMemories([]);
  assert.equal(character.loadMemories().length, 0);
  assert.equal(data.get("mana.chat.v1"), "[]");
});

function desktopPersistence(invoke, getItem = () => null) {
  const globals = { window: { __TAURI_INTERNALS__: {} }, setTimeout, clearTimeout,
    localStorage: { getItem, setItem: () => assert.fail("desktop must not modify legacy storage") } };
  return loader({ "@tauri-apps/api/core": { invoke } }, globals)("src/core/persistence.ts");
}

test("SQLite startup hydrates the cache once and leaves legacy storage intact", async () => {
  const calls = [];
  const p = desktopPersistence(async (command, args) => {
    calls.push(command);
    assert.equal(args.legacy["mana.chat.v1"], "[]");
    return { "mana.settings.v1": '{"charName":"Nova"}' };
  }, (key) => key === "mana.chat.v1" ? "[]" : null);
  await p.initializePersistence();
  await p.initializePersistence();
  assert.equal(calls.join(","), "initialize_store");
  assert.equal(p.readStored("mana.settings.v1"), '{"charName":"Nova"}');
  assert.equal(p.readStored("mana.chat.v1"), null);
});

test("failed startup does not enable writes and can be retried", async () => {
  let failed = true;
  const p = desktopPersistence(async () => { if (failed) throw new Error("database unavailable"); return {}; });
  await assert.rejects(p.initializePersistence(), /unavailable/);
  assert.throws(() => p.writeStored("mana.chat.v1", "[]"), /not loaded/);
  failed = false;
  await p.initializePersistence();
  p.writeStored("mana.chat.v1", "[]");
  await p.flushPersistence();
  assert.equal(p.persistenceStatus().pending, 0);
});

test("failed database saves retain pending changes and retry writes the latest values", async () => {
  let fail = true;
  let saved;
  const p = desktopPersistence(async (command, args) => {
    if (command === "initialize_store") return {};
    if (fail) throw new Error("disk full");
    saved = args.values;
  });
  await p.initializePersistence();
  p.writeStored("mana.chat.v1", "[1]");
  await assert.rejects(p.flushPersistence(), /disk full/);
  assert.equal(p.persistenceStatus().pending, 1);
  assert.match(p.persistenceStatus().error, /disk full/);
  p.writeStored("mana.chat.v1", "[2]");
  fail = false;
  await p.flushPersistence();
  assert.equal(saved["mana.chat.v1"], "[2]");
  assert.equal(p.persistenceStatus().pending, 0);
  assert.equal(p.persistenceStatus().error, "");
});

test("writes during a pending save are serialized and not discarded by stale completions", async () => {
  const first = deferred();
  const saved = [];
  const p = desktopPersistence(async (command, args) => {
    if (command === "initialize_store") return {};
    saved.push(args.values["mana.chat.v1"]);
    if (saved.length === 1) await first.promise;
  });
  await p.initializePersistence();
  p.writeStored("mana.chat.v1", "[1]");
  const writing = p.flushPersistence();
  await flush();
  p.writeStored("mana.chat.v1", "[2]");
  first.resolve();
  await writing;
  await p.flushPersistence();
  assert.equal(saved.join(","), "[1],[2]");
  assert.equal(p.persistenceStatus().pending, 0);
});

test("inaccessible localStorage blocks migration instead of silently importing empty data", async () => {
  let calls = 0;
  const p = desktopPersistence(async () => { calls++; return {}; }, () => { throw new Error("storage unavailable"); });
  await assert.rejects(p.initializePersistence(), /storage unavailable/);
  assert.equal(calls, 0);
});

test("settings validation retains valid custom fields and defaults malformed values", () => {
  const { validateSettings, DEFAULT_SETTINGS } = loader()("src/core/settings.ts");
  const s = validateSettings({ userName: " Aishi ", charName: "Nova", avatarDir: "D:/my-avatar",
    systemPrompt: "custom prompt", modelPath: "model.gguf", port: "9090", temperature: null,
    autoStart: "true", gpuLayers: -1, ctxSize: 0, unknown: "ignored" });
  assert.equal(s.userName, "Aishi");
  assert.equal(s.charName, "Nova");
  assert.equal(s.avatarDir, "D:/my-avatar");
  assert.equal(s.systemPrompt, "custom prompt");
  for (const key of ["port", "temperature", "autoStart", "gpuLayers", "ctxSize"]) assert.equal(s[key], DEFAULT_SETTINGS[key]);
  assert.equal(s.unknown, undefined);
  for (const port of [NaN, Infinity, -1, 65536, 8080.5]) assert.equal(validateSettings({ port }).port, 8080);
  assert.equal(validateSettings({ port: 9090, temperature: 1.2 }).port, 9090);
  assert.equal(validateSettings({ avatarDir: "c:/AI/ManaAI-CV/assets/avatar/" }).avatarDir, DEFAULT_SETTINGS.avatarDir);
});

test("bundled avatar is the default and both old default paths migrate without changing custom folders", () => {
  const { DEFAULT_SETTINGS, validateSettings } = loader()("src/core/settings.ts");
  assert.equal(DEFAULT_SETTINGS.avatarDir, "");
  for (const avatarDir of ["C:\\AI\\ManaAI-CV\\assets\\avatar", "c:/ai/ManaAI-CV-2/assets/avatar/", "", "   "]) {
    assert.equal(validateSettings({ avatarDir }).avatarDir, "");
  }
  assert.equal(validateSettings({ avatarDir: "D:/custom/avatar" }).avatarDir, "D:/custom/avatar");
});

test("chat validation keeps valid turns and repairs duplicate or missing IDs", () => {
  const { validateChat } = loader()("src/core/settings.ts");
  const messages = validateChat([null, { id: "a", role: "user", content: "hi" },
    { id: "a", role: "assistant", content: "hello", error: 123 },
    { role: "assistant", content: "", error: "server failed" },
    { role: "system", content: "injected" }, { role: "user", content: 123 }]);
  assert.equal(messages.length, 3);
  assert.equal(messages[0].content, "hi");
  assert.equal(new Set(messages.map((m) => m.id)).size, 3);
  assert.equal(messages[1].error, undefined);
  assert.equal(messages[2].error, "server failed");
  assert.equal(validateChat({ messages: [] }).length, 0);
  const many = validateChat(Array.from({ length: 210 }, (_, i) => ({ id: String(i), role: "user", content: String(i) })));
  assert.equal(many.length, 200);
  assert.equal(many[0].id, "10");
});

test("saved loaders tolerate malformed JSON and wrong top-level shapes without writing storage", () => {
  let raw;
  const load = loader({}, { localStorage: { getItem: () => raw, setItem: () => assert.fail("loader must not write") } });
  const settings = load("src/core/settings.ts");
  const avatar = load("src/core/avatar.ts");
  const progress = load("src/core/progress.ts");
  for (const value of ["{broken", "null", "42", '"text"', "[]"]) {
    raw = value;
    assert.equal(settings.loadSettings().port, 8080);
    assert.equal(settings.loadChat().length, 0);
    assert.equal(avatar.loadAvatarConfig().skin, "default");
    assert.equal(progress.loadStats().messages, 0);
  }
});

test("avatar and progress validation repair bad fields while preserving usable selections", () => {
  const load = loader();
  const avatar = load("src/core/avatar.ts");
  const progress = load("src/core/progress.ts");
  const cfg = avatar.validateAvatarConfig({ skin: null, outfit: "summer", hairstyle: 3,
    accessories: ["glasses", null, "glasses", 4], view: "constructor" });
  assert.equal(cfg.skin, "default");
  assert.equal(cfg.outfit, "summer");
  assert.equal(cfg.hairstyle, "default");
  assert.equal(cfg.accessories.join(","), "glasses");
  assert.equal(cfg.view, "full");
  const stats = progress.validateStats(JSON.parse('{"messages":"ten","skill":-1,"firstChat":"bad","days":["2026-10-08","2026-10-08","2026-02-30",null],"milestones":{"first_chat":"2026-10-08","bad":"bad","__proto__":"2026-10-08"}}'));
  assert.equal(stats.messages, 0);
  assert.equal(stats.skill, 0);
  assert.equal(stats.firstChat, null);
  assert.equal(stats.days.join(","), "2026-10-08");
  assert.equal(Object.keys(stats.milestones).join(","), "first_chat");
  assert.equal(progress.ruleMet({ type: "milestone", id: "constructor" }, stats, new Date()), false);
  assert.equal(progress.bumpMessage(stats).messages, 1);
  const first = progress.validateStats(null);
  first.days.push("changed");
  assert.equal(progress.validateStats(null).days.length, 0);
});

test("catalog validates all supported rules and preserves valid names and tags", () => {
  const progress = loader()("src/core/progress.ts");
  const result = progress.validateCatalog({
    "outfits/summer": { name: "Summer dress", tags: ["summer"], unlock: [{ type: "days", value: 2 }, { type: "messages", value: 3 }] },
    "outfits/winter": { unlock: { type: "season", months: [12, 1, 2] } },
    "accessories/glasses": { unlock: { type: "skill", value: 2 } },
    "hairstyles/long": { unlock: { type: "milestone", id: "first_chat" } },
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.items["outfits/summer"].name, "Summer dress");
  const stats = { days: ["2026-10-07", "2026-10-08"], messages: 3, skill: 2, milestones: { first_chat: "2026-10-08" } };
  for (const id of Object.keys(result.items)) assert.equal(progress.isUnlocked(id, result.items, stats, new Date(2026, 0, 1)), true);
});

test("malformed metadata and unlock rules stay locked while valid siblings remain usable", () => {
  const progress = loader()("src/core/progress.ts");
  const badRules = [null, 0, "free", { type: "season", months: null }, { type: "season", months: [0, 13] },
    { type: "season", months: [] }, { type: "messages", value: "0" }, { type: "days", value: -1 },
    { type: "milestone", id: "constructor" }, { type: "unknown" }, [null, { type: "messages", value: 0 }]];
  const catalog = { "outfits/valid": { name: "Valid" }, "outfits/null": null };
  badRules.forEach((unlock, i) => { catalog[`outfits/bad${i}`] = { unlock }; });
  const { items, errors } = progress.validateCatalog(catalog);
  const stats = progress.validateStats(null);
  assert.ok(errors.length > 0);
  for (const id of Object.keys(items)) {
    assert.equal(progress.isUnlocked(id, items, stats, new Date()), id === "outfits/valid");
    assert.doesNotThrow(() => progress.hintFor(id, items, stats, new Date(), "Mana"));
  }
  assert.equal(progress.isUnlocked("outfits/default", items, stats, new Date()), true);
});

test("invalid or unreadable items.json keeps images available and non-default items locked", async () => {
  for (const catalog of ["{broken", "null", null]) {
    const files = ["base/body.png", "outfits/default/outfit.png", "outfits/summer/outfit.png", "hairstyles/default/hair_front.png", "items.json"];
    const load = loader({ "@tauri-apps/api/core": { invoke: async (command, args) => {
      if (command === "scan_avatar") return files;
      if (args.rel === "items.json") {
        if (catalog === null) throw new Error("cannot read catalog");
        return Array.from(Buffer.from(catalog));
      }
      return [1, 2, 3];
    } } }, { Blob, ArrayBuffer, URL: { createObjectURL: () => "blob:test" } });
    const a = await load("src/core/avatar.ts").loadAvatarAssets("test-folder");
    assert.ok(a.itemsError);
    assert.equal(a.urls.size, 4);
    const progress = load("src/core/progress.ts");
    assert.equal(progress.isUnlocked("outfits/summer", a.items, progress.validateStats(null), new Date()), false);
    assert.equal(progress.isUnlocked("outfits/default", a.items, progress.validateStats(null), new Date()), true);
  }
});

test("reply cleanup removes repeated labels and inline tags, using the final emotion", () => {
  const { cleanReply } = loader()("src/core/emotion.ts");
  const reply = cleanReply("Mana: Mana: Ohh, today was good! [excited]\n\nWhat did you do today Aishi? [happy]");
  assert.equal(reply.text, "Ohh, today was good!\n\nWhat did you do today Aishi?");
  assert.equal(reply.emotion, "happy");
  assert.equal(cleanReply("[worried] Are you okay?").emotion, "worried");
  assert.equal(cleanReply("Mana: Hi [ HAPPY ]").text, "Hi");
});

test("cleanup supports configured names and leaves ordinary names and brackets intact", () => {
  const { cleanReply } = loader()("src/core/emotion.ts");
  assert.equal(cleanReply("M.a+na: M.a+na: Hello!", "M.a+na").text, "Hello!");
  assert.equal(cleanReply("Nova： Nova: Hello!", "Nova").text, "Hello!");
  for (const text of ["Mana is my name.", "I asked Mana: want to play?", "Use [array] and [0].", "Example [unknown]", "const a = [array"]) {
    assert.equal(cleanReply(text).text, text);
  }
});

test("streaming cleanup hides partial emotion tags and removes thinking before labels", () => {
  const { cleanReply } = loader()("src/core/emotion.ts");
  for (const suffix of ["[", "[h", "[hap", "[happy", "[ happy "]) {
    assert.equal(cleanReply("Mana: Hello! " + suffix).text, "Hello!");
  }
  assert.equal(cleanReply("<think>private</think> Mana: Hi! [happy]").text, "Hi!");
  assert.equal(cleanReply("<think>unfinished").text, "");
});

test("model history is cleaned without changing saved messages or user text", () => {
  const { buildPayload } = loader()("src/core/llm.ts");
  const { REPLY_FORMAT_RULES } = loader()("src/core/emotion.ts");
  const history = [
    { role: "user", content: "Nova: hi [happy]" },
    { role: "assistant", content: "<think>private</think>Nova: Nova: Hello! [excited]\nHow are you? [happy]" },
    { role: "user", content: "good" },
  ];
  const saved = JSON.stringify(history);
  const payload = buildPayload("Custom character card", history, 24, "Nova");
  assert.equal(payload[1].content, history[0].content);
  assert.equal(payload[2].content, "Hello!\nHow are you? [happy]");
  assert.equal(JSON.stringify(history), saved);
  assert.ok(payload[0].content.includes(REPLY_FORMAT_RULES));
  assert.equal(buildPayload(REPLY_FORMAT_RULES, history)[0].content.split(REPLY_FORMAT_RULES).length, 2);
});

test("ready server is monitored for failure and recovery; settings retain the active port", async () => {
  let health = "ok";
  const ports = [];
  const app = lifecycle(async (port) => { ports.push(port); return health; });
  app.render();
  await flush();
  assert.equal(app.render().status, "ready");
  assert.equal(app.render({ port: 9090 }).port, 8080);
  health = "down";
  await app.tick();
  assert.equal(app.render().status, "error");
  assert.equal(app.render().running, true);
  health = "ok";
  await app.tick();
  assert.equal(app.render().status, "ready");
  assert.ok(ports.every((p) => p === 8080));
  await app.render().stop();
  await app.render().start();
  await flush();
  assert.equal(app.render().port, 9090);
  app.dispose();
  assert.equal(app.timers.size, 0);
});

test("Stop invalidates a pending launch health check", async () => {
  const health = deferred();
  const app = lifecycle(() => health.promise);
  const state = app.render();
  await state.stop();
  health.resolve("ok");
  await flush();
  assert.equal(app.render().status, "stopped");
  assert.equal(app.timers.size, 0);
  app.dispose();
});

test("Stop during a desktop Start waits for the command and suppresses stale completion", async () => {
  const launched = deferred();
  const calls = [];
  const app = lifecycle(async () => "down", async (name) => {
    calls.push(name);
    if (name === "start_llama") await launched.promise;
  }, true);
  app.render();
  await flush();
  const starting = app.render().start();
  await flush();
  const stopping = app.render().stop();
  await flush();
  assert.deepEqual(calls, ["start_llama"]);
  launched.resolve();
  await Promise.all([starting, stopping]);
  assert.deepEqual(calls, ["start_llama", "stop_llama"]);
  assert.equal(app.render().status, "stopped");
  assert.equal(app.timers.size, 0);
  app.dispose();
});

test("an owned server crash clears running state and exposes the log", async () => {
  let health = "down";
  let running = true;
  const app = lifecycle(async () => health, async (name) => {
    if (name === "llama_running") return running;
    if (name === "llama_log_tail") return "GPU allocation failed";
  }, true);
  app.render();
  await flush();
  await app.render().start();
  await flush();
  health = "ok";
  await app.tick();
  assert.equal(app.render().status, "ready");
  health = "down";
  running = false;
  await app.tick();
  assert.equal(app.render().status, "error");
  assert.equal(app.render().running, false);
  assert.match(app.render().detail, /GPU allocation failed/);
  app.dispose();
});
