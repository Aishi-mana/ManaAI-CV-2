const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

// Run the real TypeScript domain module without launching Tauri, React or a model.
// The persistence adapter is mocked so we exercise load/save without a desktop DB.
const stored=new Map();
function load(file,cache=new Map()){
 const resolved=path.resolve(file);
 if(cache.has(resolved))return cache.get(resolved);
 const exports={};
 cache.set(resolved,exports);
 const js=ts.transpileModule(fs.readFileSync(resolved,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(js,{
  exports,Date,Intl,Error,Map,Set,Math,
  require:specifier=>{
   if(specifier==='./persistence')return {
    readStored:key=>stored.has(key)?stored.get(key):null,
    writeStored:(key,value)=>{stored.set(key,value);},
   };
   if(!specifier.startsWith('.'))throw Error('Unexpected dependency: '+specifier);
   return load(path.resolve(path.dirname(resolved),specifier+'.ts'),cache);
  },
 },{filename:resolved});
 return exports;
}

const sketchbook=load('src/core/sketchbook.ts');
const {SKETCHBOOK_KEY,SKETCHBOOK_DAYS,validateSketchbook,setSketchbookEnabled,
 dueSketchbookSlot,beginSketchbookAttempt,addSketchbookEntry,removeSketchbookEntry,canSaveScheduledSketchbook,recordSketchbookOutcome,sketchbookScheduleSummary,sketchbookCreativePatterns,sketchbookRevisitCandidate,validateSketchbookReflection,addSketchbookReflection,loadSketchbook,saveSketchbook}=sketchbook;
const at=iso=>new Date(iso);
const starting=()=>setSketchbookEnabled(validateSketchbook(null),true,at('2026-11-02T01:00:00.000Z')); // Monday 09:00 Singapore
function drawing(slotId,createdAt,n=1){
 return {id:'drawing'+n,imageId:'image'+n,slotId,createdAt,
  title:'A moon garden',concept:'An imaginary garden with glowing flowers',
  prompt:'Sketch a cozy glowing moon garden, softly colored, no lettering',
  sourceType:'scheduled-drawing',imagined:true,inspiration:'imagination',seed:42,model:'local.safetensors'};
}
function plain(v){return JSON.parse(JSON.stringify(v));}

test('Sketchbook defaults disabled, with three days and no generated records',()=>{
 const state=validateSketchbook(null);
 assert.equal(SKETCHBOOK_KEY,'mana.sketchbook.v1');
 assert.equal(state.settings.enabled,false);
 assert.equal(state.settings.announceInChat,false);
 assert.equal(state.settings.catchUp,true);
 assert.equal(state.settings.frequencyPerWeek,3);
 assert.equal(state.settings.enabledAt,null);
 assert.deepEqual([...SKETCHBOOK_DAYS],[2,4,6]);
 assert.equal(state.entries.length,0);
 assert.equal(dueSketchbookSlot(state,at('2026-11-03T04:01:00.000Z')),null);
});

test('Tuesday noon, Thursday noon and Saturday noon become due in the configured local timezone',()=>{
 let state=starting();
 assert.equal(dueSketchbookSlot(state,at('2026-11-03T03:59:00.000Z')),null);
 assert.equal(dueSketchbookSlot(state,at('2026-11-03T04:00:00.000Z')),'2026-11-03');
 state=addSketchbookEntry(state,drawing('2026-11-03','2026-11-03T04:10:00.000Z',1));
 assert.equal(dueSketchbookSlot(state,at('2026-11-04T10:00:00.000Z')),null);
 assert.equal(dueSketchbookSlot(state,at('2026-11-05T04:00:00.000Z')),'2026-11-05');
 state=addSketchbookEntry(state,drawing('2026-11-05','2026-11-05T04:10:00.000Z',2));
 assert.equal(dueSketchbookSlot(state,at('2026-11-07T04:00:00.000Z')),'2026-11-07');
 state=addSketchbookEntry(state,drawing('2026-11-07','2026-11-07T04:10:00.000Z',3));
 assert.equal(dueSketchbookSlot(state,at('2026-11-08T07:00:00.000Z')),null);
 assert.equal(dueSketchbookSlot(state,at('2026-11-10T04:00:00.000Z')),'2026-11-10');
});

test('No catch-up burst: only the most recent missed slot is eligible',()=>{
 const state=starting();
 assert.equal(dueSketchbookSlot(state,at('2026-11-06T10:00:00.000Z')),'2026-11-05');
 const saved=addSketchbookEntry(state,drawing('2026-11-05','2026-11-06T10:00:00.000Z'));
 assert.equal(dueSketchbookSlot(saved,at('2026-11-06T10:01:00.000Z')),null);
 assert.equal(dueSketchbookSlot(saved,at('2026-11-07T04:00:00.000Z')),'2026-11-07');
});

test('Disabling catch-up does not prevent drawings on scheduled days',()=>{
 const initial=starting();
 const state={...initial,settings:{...initial.settings,catchUp:false}};
 assert.equal(dueSketchbookSlot(state,at('2026-11-04T04:00:00.000Z')),null);
 assert.equal(dueSketchbookSlot(state,at('2026-11-05T04:00:00.000Z')),'2026-11-05');
});

test('Enabling after a drawing time never backfills previously disabled time',()=>{
 const state=setSketchbookEnabled(validateSketchbook(null),true,at('2026-11-03T07:00:00.000Z'));
 assert.equal(dueSketchbookSlot(state,at('2026-11-03T08:00:00.000Z')),null);
 assert.equal(dueSketchbookSlot(state,at('2026-11-05T04:00:00.000Z')),'2026-11-05');
 const disabled=setSketchbookEnabled(state,false,at('2026-11-05T05:00:00.000Z'));
 assert.equal(dueSketchbookSlot(disabled,at('2026-11-07T04:00:00.000Z')),null);
 const reenabled=setSketchbookEnabled(disabled,true,at('2026-11-07T06:00:00.000Z'));
 assert.equal(dueSketchbookSlot(reenabled,at('2026-11-07T07:00:00.000Z')),null);
 assert.equal(dueSketchbookSlot(reenabled,at('2026-11-10T04:00:00.000Z')),'2026-11-10');
});

test('The scheduler observes the saved timezone, not the computer UTC clock',()=>{
 const first=starting();
 const state={...first,settings:{...first.settings,timeZone:'America/New_York'}};
 assert.equal(dueSketchbookSlot(state,at('2026-11-03T16:59:00.000Z')),null);
 assert.equal(dueSketchbookSlot(state,at('2026-11-03T17:00:00.000Z')),'2026-11-03');
});

test('Reservations respect retry backoff and max two attempts per scheduled slot',()=>{
 const initial=starting();
 const t1=at('2026-11-03T04:10:00.000Z');
 const state=beginSketchbookAttempt(initial,'2026-11-03',t1);
 assert.equal(state.lastAttempt.count,1);
 assert.equal(dueSketchbookSlot(state,at('2026-11-03T04:39:00.000Z')),null);
 assert.equal(dueSketchbookSlot(state,at('2026-11-03T04:40:00.000Z')),'2026-11-03');
 const twice=beginSketchbookAttempt(state,'2026-11-03',at('2026-11-03T04:41:00.000Z'));
 assert.equal(twice.lastAttempt.count,2);
 assert.equal(dueSketchbookSlot(twice,at('2026-11-03T12:00:00.000Z')),null);
 assert.throws(()=>beginSketchbookAttempt(twice,'2026-11-03',at('2026-11-03T13:00:00.000Z')),/not ready/);
 assert.throws(()=>beginSketchbookAttempt(initial,'2026-11-05',t1),/not ready/);
});

test('Saved drawings stop repeat jobs for a slot and remain separate from diary records',()=>{
 const state=starting(),entry=drawing('2026-11-03','2026-11-03T04:05:00.000Z');
 const next=addSketchbookEntry(state,entry);
 assert.equal(next.entries.length,1);
 assert.equal(next.entries[0].imagined,true);
 assert.equal(next.entries[0].sourceType,'scheduled-drawing');
 assert.equal(next.entries[0].imageId,'image1');
 assert.equal(dueSketchbookSlot(next,at('2026-11-03T06:00:00.000Z')),null);
 assert.throws(()=>addSketchbookEntry(next,entry),/already saved/);
 assert.equal(state.entries.length,0);
});

test('Validation discards malformed and diary-shaped metadata and sanitizes options',()=>{
 const good=drawing('2026-11-03','2026-11-03T04:05:00.000Z');
 const state=validateSketchbook({
  settings:{enabled:true,enabledAt:'not-a-date',timeZone:'not/a-timezone',announceInChat:'yes',catchUp:false},
  entries:[{...good,sourceType:'diary'},good,
   {...good,id:'copy',imageId:'another',slotId:'2026-11-03'},
   {...good,id:'invalid',imageId:'../../../secret'},
   {...good,id:'nonscheduled',slotId:'2026-11-04'}],
  lastAttempt:{slotId:'2026-11-04',at:'2026-11-03T04:01:00.000Z',count:1},
 });
 assert.equal(state.settings.enabled,false);
 assert.equal(state.settings.timeZone,'Asia/Singapore');
 assert.equal(state.settings.catchUp,false);
 assert.equal(state.settings.announceInChat,false);
 assert.equal(state.entries.length,1);
 assert.equal(state.lastAttempt,undefined);
 assert.deepEqual(plain(state.entries[0]),good);
});

test('Saved metadata and attempt state survive JSON roundtrips without generating artwork',()=>{
 const base=starting(),reserved=beginSketchbookAttempt(base,'2026-11-03',at('2026-11-03T04:10:00.000Z'));
 const state=addSketchbookEntry(reserved,drawing('2026-11-03','2026-11-03T04:15:00.000Z'));
 const restored=validateSketchbook(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(plain(restored),plain(state));
 assert.equal(dueSketchbookSlot(restored,at('2026-11-03T08:00:00.000Z')),null);
 assert.equal(dueSketchbookSlot(restored,at('2026-11-05T04:00:00.000Z')),'2026-11-05');
});

test('Entry validator rejects false authorship, invalid timestamps, and oversized prompts',()=>{
 const state=starting(),base=drawing('2026-11-03','2026-11-03T04:05:00.000Z');
 for(const rejected of [
  {...base,imagined:false},
  {...base,sourceType:'diary-illustration'},
  {...base,createdAt:'yesterday'},
  {...base,prompt:'x'.repeat(1501)},
  {...base,slotId:'2026-11-04'},
 ]){
  assert.throws(()=>addSketchbookEntry(state,rejected),/Invalid Sketchbook/);
 }
});

test('Sketchbook saves through Mana persistence and loads after a simulated restart',()=>{
 stored.clear();
 assert.equal(loadSketchbook().settings.enabled,false);
 const started=starting();
 const state=addSketchbookEntry(started,drawing('2026-11-03','2026-11-03T04:10:00.000Z'));
 saveSketchbook(state);
 assert.equal(stored.has(SKETCHBOOK_KEY),true);
 const restored=loadSketchbook();
 assert.deepEqual(plain(restored),plain(state));
 assert.equal(restored.settings.enabled,true);
 assert.equal(restored.entries[0].imageId,'image1');
 stored.set(SKETCHBOOK_KEY,'{invalid JSON');
 assert.equal(loadSketchbook().settings.enabled,false);
 assert.equal(loadSketchbook().entries.length,0);
});

test('Sketchbook persistence validates metadata before writing',()=>{
 stored.clear();
 const state=starting();
 saveSketchbook({...state,entries:[{
  ...drawing('2026-11-03','2026-11-03T04:10:00.000Z'),sourceType:'diary-illustration',
 }]});
 const saved=JSON.parse(stored.get(SKETCHBOOK_KEY));
 assert.equal(saved.settings.enabled,true);
 assert.equal(saved.entries.length,0);
 assert.equal(loadSketchbook().entries.length,0);
});


test('Removing a drawing never reopens its scheduled slot or deletes gallery artwork',()=>{
 const original=starting(),entry=drawing('2026-11-03','2026-11-03T04:10:00.000Z');
 const saved=addSketchbookEntry(original,entry);
 const removed=removeSketchbookEntry(saved,entry.id);
 assert.equal(saved.entries.length,1);
 assert.equal(removed.entries.length,0);
 assert.deepEqual(plain(removed.removedSlots),['2026-11-03']);
 assert.equal(dueSketchbookSlot(removed,at('2026-11-03T05:00:00.000Z')),null);
 assert.equal(dueSketchbookSlot(removed,at('2026-11-04T11:00:00.000Z')),null);
 assert.equal(dueSketchbookSlot(removed,at('2026-11-05T04:00:00.000Z')),'2026-11-05');
 assert.throws(()=>addSketchbookEntry(removed,entry),/already removed/);
 assert.equal(removeSketchbookEntry(removed,'nonexistent'),removed);
 assert.equal(saved.entries[0].imageId,entry.imageId);
});

test('Removed slots survive restart and toggling automatic drawing off and back on',()=>{
 let state=starting();
 state=removeSketchbookEntry(addSketchbookEntry(state,drawing('2026-11-03','2026-11-03T04:10:00.000Z')),'drawing1');
 saveSketchbook(state);
 const reloaded=loadSketchbook();
 assert.deepEqual(plain(reloaded.removedSlots),['2026-11-03']);
 const off=setSketchbookEnabled(reloaded,false,at('2026-11-03T04:30:00.000Z'));
 const on=setSketchbookEnabled(off,true,at('2026-11-03T04:45:00.000Z'));
 assert.equal(dueSketchbookSlot(on,at('2026-11-03T05:00:00.000Z')),null);
 assert.equal(dueSketchbookSlot(on,at('2026-11-05T04:00:00.000Z')),'2026-11-05');
 assert.deepEqual(plain(validateSketchbook(JSON.parse(JSON.stringify(on)))),plain(on));
});

test('Removed-slot history is validated, bounded, and cannot hide live entries',()=>{
 const current=starting();
 const saved=addSketchbookEntry(current,drawing('2026-11-03','2026-11-03T04:10:00.000Z'));
 const state=validateSketchbook({
  ...saved,removedSlots:['2026-11-03','2026-11-05','2026-11-05','2026-11-04','../../../etc'],
 });
 assert.deepEqual(plain(state.removedSlots),['2026-11-05']);
 assert.equal(state.entries.length,1);
 assert.equal(dueSketchbookSlot(state,at('2026-11-05T04:00:00.000Z')),null);
 const history=Array.from({length:520},(_,i)=>{
  const date=new Date('2020-01-07T12:00:00.000Z');
  date.setUTCDate(date.getUTCDate()+i*7);
  return date.toISOString().slice(0,10);
 });
 const bounded=validateSketchbook({...current,removedSlots:history});
 assert.equal(bounded.removedSlots.length,512);
 assert.equal(bounded.removedSlots[0],history[8]);
 assert.equal(bounded.removedSlots[511],history[519]);
});


test('In-flight work cannot save when disabled, re-enabled, completed or removed',()=>{
 const started=starting(),activation=started.settings.enabledAt,slot='2026-11-03';
 assert.equal(canSaveScheduledSketchbook(started,slot,activation),true);
 const disabled=setSketchbookEnabled(started,false,at('2026-11-03T04:11:00.000Z'));
 assert.equal(canSaveScheduledSketchbook(disabled,slot,activation),false);
 const reenabled=setSketchbookEnabled(disabled,true,at('2026-11-03T04:13:00.000Z'));
 assert.equal(canSaveScheduledSketchbook(reenabled,slot,activation),false);
 const saved=addSketchbookEntry(started,drawing(slot,'2026-11-03T04:15:00.000Z'));
 assert.equal(canSaveScheduledSketchbook(saved,slot,activation),false);
 const removed=removeSketchbookEntry(saved,'drawing1');
 assert.equal(canSaveScheduledSketchbook(removed,slot,activation),false);
 assert.equal(canSaveScheduledSketchbook(started,'2026-11-04',activation),false);
 assert.equal(canSaveScheduledSketchbook(started,slot,null),false);
});


test('Manual Draw Now saves to Sketchbook without consuming Tuesday/Thursday/Saturday slots',()=>{
 let state=validateSketchbook(null); // automatic drawing OFF
 const manual={
  ...drawing('manual-test123','2026-11-02T02:00:00.000Z'),
  slotId:'manual-test123',sourceType:'manual-drawing',
 };
 state=addSketchbookEntry(state,manual);
 assert.equal(state.entries.length,1);
 assert.equal(state.entries[0].sourceType,'manual-drawing');
 assert.equal(state.settings.enabled,false);
 state=setSketchbookEnabled(state,true,at('2026-11-02T01:00:00.000Z'));
 assert.equal(dueSketchbookSlot(state,at('2026-11-03T04:00:00.000Z')),'2026-11-03');
 for(const [i,slot] of ['2026-11-03','2026-11-05','2026-11-07'].entries()){
  const created=slot+'T04:05:00.000Z';
  state=addSketchbookEntry(state,drawing(slot,created,i+2));
 }
 assert.equal(state.entries.length,4);
 assert.equal(dueSketchbookSlot(state,at('2026-11-08T04:00:00.000Z')),null);
 assert.deepEqual(plain(validateSketchbook(JSON.parse(JSON.stringify(state)))),plain(state));
});

test('Removing a manual test does not tombstone a scheduled day',()=>{
 const state=starting();
 const manual={...drawing('manual-hello','2026-11-03T05:00:00.000Z'),sourceType:'manual-drawing'};
 const added=addSketchbookEntry(state,manual);
 const removed=removeSketchbookEntry(added,manual.id);
 assert.equal(removed.entries.length,0);
 assert.equal(removed.removedSlots,undefined);
 assert.equal(dueSketchbookSlot(removed,at('2026-11-03T05:01:00.000Z')),'2026-11-03');
 const newEntry=drawing('2026-11-03','2026-11-03T05:10:00.000Z');
 assert.equal(addSketchbookEntry(removed,newEntry).entries.length,1);
});

test('Invalid manual slot IDs and unrelated source types never enter saved records',()=>{
 const state=starting();
 for(const invalid of [
  {...drawing('2026-11-03','2026-11-03T05:00:00.000Z'),sourceType:'manual-drawing'},
  {...drawing('manual-../oops','2026-11-03T05:00:00.000Z'),sourceType:'manual-drawing'},
  {...drawing('manual-123','2026-11-03T05:00:00.000Z'),sourceType:'diary'},
 ]){
  assert.throws(()=>addSketchbookEntry(state,invalid),/Invalid Sketchbook/);
 }
});

test('Next-drawing summary respects local noon, due slots, retries, and disabled state',()=>{
 const initial=validateSketchbook(null);
 const off=sketchbookScheduleSummary(initial,at('2026-11-02T01:00:00.000Z'));
 assert.equal(off.status,'off');
 assert.equal(off.date,'2026-11-03');
 assert.equal(off.time,'12:00');
 const enabled=starting();
 const upcoming=sketchbookScheduleSummary(enabled,at('2026-11-03T03:59:00.000Z'));
 assert.equal(upcoming.status,'upcoming');
 assert.equal(upcoming.date,'2026-11-03');
 const due=sketchbookScheduleSummary(enabled,at('2026-11-03T04:00:00.000Z'));
 assert.equal(due.status,'due');
 assert.equal(due.date,'2026-11-03');
 const attempted=beginSketchbookAttempt(enabled,'2026-11-03',at('2026-11-03T04:05:00.000Z'));
 const retry=sketchbookScheduleSummary(attempted,at('2026-11-03T04:20:00.000Z'));
 assert.equal(retry.status,'retry-wait');
 assert.equal(retry.date,'2026-11-03');
 assert.equal(retry.time,'12:35');
 const eligible=sketchbookScheduleSummary(attempted,at('2026-11-03T04:36:00.000Z'));
 assert.equal(eligible.status,'due');
 const finished=addSketchbookEntry(attempted,drawing('2026-11-03','2026-11-03T04:40:00.000Z'));
 const next=sketchbookScheduleSummary(finished,at('2026-11-03T04:50:00.000Z'));
 assert.equal(next.status,'upcoming');
 assert.equal(next.date,'2026-11-05');
});

test('Last drawing outcome is persisted, bounded and safe to restore',()=>{
 let state=starting();
 state=recordSketchbookOutcome(state,'postponed','Local model not ready at noon',at('2026-11-03T04:01:00.000Z'));
 assert.equal(state.lastOutcome.kind,'postponed');
 saveSketchbook(state);
 const restored=loadSketchbook();
 assert.deepEqual(plain(restored.lastOutcome),plain(state.lastOutcome));
 assert.equal(restored.lastOutcome.message,'Local model not ready at noon');
 const tooLong=recordSketchbookOutcome(state,'failed','x'.repeat(999));
 assert.equal(tooLong.lastOutcome.message.length,360);
 const bad=validateSketchbook({...state,lastOutcome:{kind:'failed',at:'invalid',message:'x'}});
 assert.equal(bad.lastOutcome,undefined);
});


test('Creative notes and visual motifs survive save, reload and validation without changing legacy drawings',()=>{
 let state=starting();
 const idea={
  ...drawing('2026-11-03','2026-11-03T04:10:00.000Z'),
  creativeReason:'I liked the contrast of lantern light and night sky.',
  motifs:['Glowing Lanterns',' moon garden ','glowing lanterns'],
 };
 state=addSketchbookEntry(state,idea);
 assert.equal(state.entries[0].creativeReason,idea.creativeReason);
 assert.deepEqual(plain(state.entries[0].motifs),['glowing lanterns','moon garden']);
 saveSketchbook(state);
 const restored=loadSketchbook();
 assert.deepEqual(plain(restored),plain(state));
 assert.equal(restored.entries[0].revisitedDrawingId,undefined);
 const old=addSketchbookEntry(starting(),drawing('2026-11-03','2026-11-03T04:10:00.000Z'));
 assert.equal(old.entries[0].motifs,undefined);
 assert.equal(old.entries[0].creativeReason,undefined);
});

test('Unsafe creative claims and oversized optional metadata are ignored, not turned into memories',()=>{
 const base=drawing('2026-11-03','2026-11-03T04:10:00.000Z');
 const entry={...base,creativeReason:'I visited the forest yesterday',
  motifs:['MOON GARDEN','moon garden','../secrets','x'.repeat(40),'night sky'],
  revisitedDrawingId:'../invented'};
 const state=addSketchbookEntry(starting(),entry);
 const saved=state.entries[0];
 assert.equal(saved.creativeReason,undefined);
 assert.equal(saved.revisitedDrawingId,undefined);
 assert.deepEqual(plain(saved.motifs),['moon garden','night sky']);
 const long=addSketchbookEntry(starting(),{...base,creativeReason:'z'.repeat(221)});
 assert.equal(long.entries[0].creativeReason,undefined);
});

test('Recurring patterns count each motif once per completed drawing, not made-up preferences',()=>{
 const rows=[
  {motifs:['moon garden','moon garden','cozy lights']},
  {motifs:['moon garden','quiet sky']},
  {motifs:['quiet sky','blue fireflies']},
  {motifs:['blue fireflies']},
 ];
 const themes=plain(sketchbookCreativePatterns(rows));
 assert.deepEqual(themes,[
  {motif:'blue fireflies',count:2},
  {motif:'moon garden',count:2},
  {motif:'quiet sky',count:2},
 ]);
 assert.deepEqual(plain(sketchbookCreativePatterns([{motifs:['one-off']}])),[]);
});

test('Only every fifth artwork may revisit an actual older drawing, without copying or invented IDs',()=>{
 const oldDates=['2026-10-20','2026-10-22','2026-10-24','2026-10-27'];
 let state=starting();
 for(const [i,slot] of oldDates.entries()){
  state=addSketchbookEntry(state,drawing(slot,slot+'T04:15:00.000Z',i+1));
 }
 const revisit=sketchbookRevisitCandidate(state.entries,at('2026-11-02T04:00:00.000Z'));
 assert.equal(revisit.id,'drawing1');
 assert.equal(revisit.title,'A moon garden');
 assert.equal(revisit.concept,'An imaginary garden with glowing flowers');
 assert.equal(sketchbookRevisitCandidate(state.entries,at('2026-10-26T05:00:00.000Z')),null);
 assert.equal(sketchbookRevisitCandidate(state.entries.slice(0,3),at('2026-11-02T04:00:00.000Z')),null);
 const next={...drawing('2026-11-03','2026-11-03T04:15:00.000Z',5),
  revisitedDrawingId:revisit.id,motifs:['moon garden'],creativeReason:'I wanted a different view of that earlier garden.'};
 state=addSketchbookEntry(state,next);
 assert.equal(state.entries[4].revisitedDrawingId,'drawing1');
 assert.equal(sketchbookRevisitCandidate(state.entries,at('2026-11-03T05:00:00.000Z')),null);
 const restored=validateSketchbook(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(plain(restored),plain(state));
});

test('A revisit link remains historical artwork provenance after original entry removal',()=>{
 let state=starting();
 const older=drawing('2026-11-03','2026-11-03T04:15:00.000Z',1);
 const newer={...drawing('2026-11-05','2026-11-05T04:15:00.000Z',2),
  revisitedDrawingId:older.id};
 state=addSketchbookEntry(addSketchbookEntry(state,older),newer);
 state=removeSketchbookEntry(state,older.id);
 assert.equal(state.entries.length,1);
 assert.equal(state.entries[0].revisitedDrawingId,'drawing1');
 assert.ok(state.removedSlots.includes('2026-11-03'));
});


test('On-demand concept review saves on an existing finished drawing and survives persistence',()=>{
 let state=starting();
 state=addSketchbookEntry(state,drawing('2026-11-03','2026-11-03T04:10:00.000Z'));
 const note={at:'2026-11-03T06:00:00.000Z',basis:'idea-only',
  enjoyed:'I like the mood of the imagined moon garden.',
  nextTime:'I would try a stronger focal tree and fewer flowers.'};
 state=addSketchbookReflection(state,'drawing1',note);
 assert.deepEqual(plain(state.entries[0].reflection),note);
 saveSketchbook(state);
 const saved=loadSketchbook();
 assert.deepEqual(plain(saved.entries[0].reflection),note);
 assert.equal(saved.entries[0].imageId,'image1');
 assert.equal(saved.entries[0].sourceType,'scheduled-drawing');
 assert.equal(saved.settings.frequencyPerWeek,3);
 assert.equal(dueSketchbookSlot(saved,at('2026-11-03T06:01:00.000Z')),null);
});

test('A drawing can be reflected on once; deleted and unknown drawings cannot receive late notes',()=>{
 const note={at:'2026-11-03T06:00:00.000Z',basis:'idea-only',
  enjoyed:'I like the idea of a quiet night.',nextTime:'Next time, simplify the foreground.'};
 const state=addSketchbookEntry(starting(),drawing('2026-11-03','2026-11-03T04:10:00.000Z'));
 const updated=addSketchbookReflection(state,'drawing1',note);
 assert.throws(()=>addSketchbookReflection(updated,'drawing1',note),/already has a reflection/);
 assert.throws(()=>addSketchbookReflection(state,'not-present',note),/no longer in Sketchbook/);
 const removed=removeSketchbookEntry(updated,'drawing1');
 assert.equal(removed.entries.length,0);
 assert.throws(()=>addSketchbookReflection(removed,'drawing1',note),/no longer in Sketchbook/);
 assert.ok(removed.removedSlots.includes('2026-11-03'));
});

test('Unsafe or oversized review metadata is rejected without affecting the completed drawing',()=>{
 const note={at:'2026-11-03T06:00:00.000Z',basis:'idea-only',
  enjoyed:'I like this scene idea.',nextTime:'I would emphasize its soft moonlight.'};
 const state=addSketchbookEntry(starting(),drawing('2026-11-03','2026-11-03T04:10:00.000Z'));
 for(const invalid of [
  {...note,basis:'visual-inspection'},
  {...note,at:'not a date'},
  {...note,enjoyed:'I saw my finished drawing and its colors.'},
  {...note,nextTime:'I inspected the final image earlier.'},
  {...note,enjoyed:'x'.repeat(251)},
  {...note,nextTime:'x'.repeat(221)},
 ]){
  assert.equal(validateSketchbookReflection(invalid),undefined);
  assert.throws(()=>addSketchbookReflection(state,'drawing1',invalid),/Invalid text-only/);
 }
 const injected=validateSketchbook({...state,entries:[{...state.entries[0],reflection:{...note,basis:'made-up'}}]});
 assert.equal(injected.entries[0].reflection,undefined);
 assert.equal(injected.entries[0].prompt,state.entries[0].prompt);
});
