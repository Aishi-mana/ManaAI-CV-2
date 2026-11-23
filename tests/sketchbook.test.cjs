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
 dueSketchbookSlot,beginSketchbookAttempt,addSketchbookEntry,removeSketchbookEntry,loadSketchbook,saveSketchbook}=sketchbook;
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
