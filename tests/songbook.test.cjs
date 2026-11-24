const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const store=new Map();
function load(file,mocks={}){
 const exports={};
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(js,{
  exports,JSON,Date,Intl,Math,Map,Set,Array,Object,Number,String,Error,
  require:name=>{
   if(name in mocks)return mocks[name];
   throw Error('Unexpected import '+name);
  },
 },{filename:file});
 return exports;
}
const original=load('src/core/originalSong.ts');
const clock=load('src/core/clock.ts');
const music=load('src/core/musicStudio.ts',{
 './musicGenres':{},'./voiceProfiles':{},'./lyrics':{},
 './originalSong':original,'./coverBuilder':{},
});
const persistence={
 readStored:key=>store.get(key)??null,
 writeStored:(key,value)=>store.set(key,value),
};
const book=load('src/core/songbook.ts',{
 './clock':clock,'./musicStudio':music,
 './originalSong':original,'./persistence':persistence,
 './validation':{isRecord:x=>!!x&&typeof x==='object'&&!Array.isArray(x),
 validDate:s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&
  !Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s},
});
const plain=v=>JSON.parse(JSON.stringify(v));
const now=s=>new Date(s);
const brief={
 prompt:'An original soft synth-pop melody with gentle bells and warm pads',
 lyrics:'[Verse]\nLanterns rise into the blue\nQuiet stars are waiting too\n[Chorus]\nLittle lights will lead us home',
 style:'synth-pop',instrumental:false,duration:90,seed:42,
};
const entry=(slotId,source='weekly',suffix='1')=>({
 id:'song-'+suffix,slotId,source,createdAt:'2026-11-22T04:10:00.000Z',
 title:'Lantern Sky',concept:'Imagined lanterns over a midnight garden',
 creativeReason:'I like soft dreamy sounds.',brief,status:'draft',
});
const start=()=>book.setSongbookEnabled(book.validateSongbook(null),true,now('2026-11-21T02:00:00.000Z'));

test('New Songbook is off by default and scheduled for Sundays at noon',()=>{
 const state=book.validateSongbook(null);
 assert.equal(book.SONGBOOK_KEY,'mana.songbook.v1');
 assert.equal(state.settings.enabled,false);
 assert.equal(state.settings.timeZone,'Asia/Singapore');
 assert.equal(state.settings.catchUp,true);
 assert.equal(book.dueWeeklySong(state,now('2026-11-22T04:01:00.000Z')),null);
 const enabled=start();
 assert.equal(book.dueWeeklySong(enabled,now('2026-11-22T03:59:00.000Z')),null);
 assert.equal(book.dueWeeklySong(enabled,now('2026-11-22T04:00:00.000Z')),'2026-11-22');
 assert.equal(book.nextWeeklySong(enabled,now('2026-11-22T03:59:00.000Z')).date,'2026-11-22');
 assert.equal(book.nextWeeklySong(enabled,now('2026-11-22T04:01:00.000Z')).date,'2026-11-22');
});

test('Weekly slot is reserved before any model call and never replays on restart',()=>{
 let state=start();
 state=book.reserveWeeklySong(state,'2026-11-22',now('2026-11-22T04:00:00.000Z'));
 assert.equal(book.dueWeeklySong(state,now('2026-11-22T04:01:00.000Z')),null);
 assert.throws(()=>book.reserveWeeklySong(state,'2026-11-22',now('2026-11-22T04:02:00.000Z')),/not available/);
 book.saveSongbook(state);
 const restored=book.loadSongbook();
 assert.deepEqual(plain(restored),plain(state));
 state=book.addSongDraft(state,entry('2026-11-22'));
 assert.equal(book.dueWeeklySong(state,now('2026-11-22T08:00:00.000Z')),null);
 assert.equal(book.nextWeeklySong(state,now('2026-11-22T08:00:00.000Z')).date,'2026-11-29');
 assert.throws(()=>book.addSongDraft(state,entry('2026-11-22','weekly','2')),/already saved/);
});

test('Catch-up is bounded to current week and enabling late does not replay Sunday',()=>{
 const state=start();
 assert.equal(book.dueWeeklySong(state,now('2026-11-24T07:00:00.000Z')),'2026-11-22');
 assert.equal(book.dueWeeklySong({...state,settings:{...state.settings,catchUp:false}},
  now('2026-11-24T07:00:00.000Z')),null);
 const enabledLate=book.setSongbookEnabled(book.validateSongbook(null),true,
  now('2026-11-23T01:00:00.000Z'));
 assert.equal(book.dueWeeklySong(enabledLate,now('2026-11-24T07:00:00.000Z')),null);
 assert.equal(book.dueWeeklySong(state,now('2026-11-29T04:01:00.000Z')),'2026-11-29');
 assert.equal(book.nextWeeklySong(state,now('2026-11-24T07:00:00.000Z')).date,'2026-11-22');
});

test('Manual Compose Now saves without toggling schedule or using a weekly slot',()=>{
 let state=book.validateSongbook(null);
 state=book.addSongDraft(state,entry('manual-test_123','manual'));
 assert.equal(state.settings.enabled,false);
 assert.equal(state.entries[0].source,'manual');
 state=book.setSongbookEnabled(state,true,now('2026-11-21T02:00:00.000Z'));
 assert.equal(book.dueWeeklySong(state,now('2026-11-22T04:01:00.000Z')),'2026-11-22');
 state=book.reserveWeeklySong(state,'2026-11-22',now('2026-11-22T04:01:00.000Z'));
 state=book.addSongDraft(state,entry('2026-11-22','weekly','2'));
 assert.equal(state.entries.length,2);
 assert.equal(state.entries.filter(e=>e.source==='weekly').length,1);
});

test('A completed WAV is only recorded when native result supplies a valid local path and duration',()=>{
 const draft=book.addSongDraft(book.validateSongbook(null),entry('manual-one','manual'));
 const mix='C:/AI/ManaAI-CV-2/exports/singing/original-001/mix.wav';
 const finished=book.completeSongAudio(draft,'song-1',{
  mix,seconds:83,generatedLyrics:'[Verse] The stars were gentle.',projectId:'studio-abc',
 });
 assert.equal(finished.entries[0].status,'ready');
 assert.equal(finished.entries[0].audioPath,mix);
 assert.equal(finished.entries[0].projectId,'studio-abc');
 assert.equal(finished.entries[0].brief.lyrics,brief.lyrics);
 book.saveSongbook(finished);
 assert.deepEqual(plain(book.loadSongbook()),plain(finished));
 for(const invalid of ['../secret.wav','C:/AI/private.wav',
  'C:/AI/ManaAI-CV-2/exports/singing/../../private.wav']){
  assert.throws(()=>book.completeSongAudio(draft,'song-1',{mix:invalid,seconds:83}),/valid completed WAV/);
 }
 assert.throws(()=>book.completeSongAudio(draft,'song-1',{mix,seconds:0}),/valid completed WAV/);
});

test('Automatic Mana-voice completion retains the original guide and saves only valid converted WAVs',()=>{
 const draft=book.addSongDraft(book.validateSongbook(null),entry('manual-voice','manual'));
 const guide='C:/AI/ManaAI-CV-2/exports/singing/original-001/mix.wav';
 const original=book.completeSongAudio(draft,'song-1',{mix:guide,seconds:84,projectId:'studio-guide'});
 const mix='C:/AI/ManaAI-CV-2/exports/singing/9001/mix.wav';
 const vocal='C:/AI/ManaAI-CV-2/exports/singing/9001/vocal.wav';
 const converted=book.completeSongVoice(original,'song-1',{
  mix,vocal,seconds:83,projectId:'studio-mana',
 });
 assert.equal(converted.entries[0].status,'ready');
 assert.equal(converted.entries[0].audioPath,guide);
 assert.equal(converted.entries[0].voiceMixPath,mix);
 assert.equal(converted.entries[0].voiceVocalPath,vocal);
 assert.equal(converted.entries[0].voiceSeconds,83);
 assert.equal(converted.entries[0].projectId,'studio-guide');
 assert.equal(converted.entries[0].voiceProjectId,'studio-mana');
 assert.equal(converted.entries[0].brief.lyrics,brief.lyrics);
 book.saveSongbook(converted);
 assert.deepEqual(plain(book.loadSongbook()),plain(converted));
 for(const bad of ['C:/AI/secrets.wav','../fake.wav',
  'C:/AI/ManaAI-CV-2/exports/singing/../../secrets.wav']){
  assert.throws(()=>book.completeSongVoice(original,'song-1',{
   mix:bad,vocal,seconds:83,
  }),/valid completed Mana vocal and mix WAVs/);
  assert.throws(()=>book.completeSongVoice(original,'song-1',{
   mix,vocal:bad,seconds:83,
  }),/valid completed Mana vocal and mix WAVs/);
 }
 assert.throws(()=>book.completeSongVoice(original,'song-1',{mix,vocal,seconds:0}),/valid completed/);
 assert.throws(()=>book.completeSongVoice(draft,'song-1',{mix,vocal,seconds:83}),/saved original/);
});

test('Failed or interrupted voice conversion never downgrades a playable original',()=>{
 const draft=book.addSongDraft(book.validateSongbook(null),entry('manual-voice-error','manual'));
 const original=book.completeSongAudio(draft,'song-1',{
  mix:'C:/AI/ManaAI-CV-2/exports/singing/original-002/mix.wav',seconds:90,
 });
 const failed=book.markSongVoiceError(original,'song-1','Missing trained voice model');
 assert.equal(failed.entries[0].status,'ready');
 assert.equal(failed.entries[0].voiceMixPath,undefined);
 assert.equal(failed.entries[0].voiceError,'Missing trained voice model');
 assert.equal(failed.entries[0].audioPath,original.entries[0].audioPath);
 book.saveSongbook(failed);
 assert.deepEqual(plain(book.loadSongbook()),plain(failed));
 const restored=book.completeSongVoice(failed,'song-1',{
  mix:'C:/AI/ManaAI-CV-2/exports/singing/9002/mix.wav',
  vocal:'C:/AI/ManaAI-CV-2/exports/singing/9002/vocal.wav',seconds:89,
 });
 assert.equal(restored.entries[0].voiceError,undefined);
 assert.equal(restored.entries[0].audioPath,original.entries[0].audioPath);
 assert.equal(book.markSongVoiceError(draft,'song-1','not recorded'),draft);
});

test('Old guide-only songs stay readable and forged converted paths are discarded',()=>{
 const guide='C:/AI/ManaAI-CV-2/exports/singing/original-003/mix.wav';
 const original=book.completeSongAudio(
  book.addSongDraft(book.validateSongbook(null),entry('manual-old','manual')),
  'song-1',{mix:guide,seconds:85});
 const old=book.validateSongbook({entries:original.entries});
 assert.equal(old.entries[0].audioPath,guide);
 assert.equal(old.entries[0].voiceMixPath,undefined);
 const forged=book.validateSongbook({entries:[{
  ...original.entries[0],voiceMixPath:'C:/AI/other/secret.wav',
  voiceVocalPath:'C:/AI/ManaAI-CV-2/exports/singing/fake/vocal.wav',
  voiceSeconds:84,voiceProjectId:'studio-forged',
 }]});
 assert.equal(forged.entries.length,1);
 assert.equal(forged.entries[0].audioPath,guide);
 assert.equal(forged.entries[0].voiceMixPath,undefined);
 assert.equal(forged.entries[0].voiceProjectId,undefined);
});

test('Songbook source wires one automatic voice stage after saving the guide WAV',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8');
 assert.match(app,/await flushPersistence\(\); \/\/ Keep the original even if conversion/);
 assert.match(app,/await convertRecordedSongToManaVoice\(entry\.id,ctrl\)/);
 assert.match(app,/await invoke\('singing_start',[\s\S]*?voiceProfile/);
 assert.match(app,/await convertRecordedSongToManaVoice\(id,ctrl\)/);
 assert.match(app,/markSongVoiceError\(songbookRef\.current,draftId,reason\)/);
});

test('When local ACE-Step is absent, original lyrics survive an explicit audio error',()=>{
 const draft=book.addSongDraft(book.validateSongbook(null),entry('manual-one','manual'));
 const failed=book.markSongAudioError(draft,'song-1','Missing local ACE-Step binaries');
 assert.equal(failed.entries[0].status,'error');
 assert.equal(failed.entries[0].brief.prompt,brief.prompt);
 assert.equal(failed.entries[0].brief.lyrics,brief.lyrics);
 assert.equal(failed.entries[0].error,'Missing local ACE-Step binaries');
 book.saveSongbook(failed);
 assert.deepEqual(plain(book.loadSongbook()),plain(failed));
 assert.equal(book.dueWeeklySong(failed,now('2026-11-22T04:01:00.000Z')),null);
});

test('Malformed original metadata, spoofed audio, duplicates, and excessive entries are filtered',()=>{
 const draft=entry('manual-one','manual');
 for(const invalid of [
  {...draft,slotId:'../../bad'}, {...draft,title:''},
  {...draft,brief:{...brief,style:'artist imitation'}},
  {...draft,source:'cover'},
  {...draft,createdAt:'yesterday'},
  {...draft,status:'ready',audioPath:'C:/AI/private.wav'},
 ]){
  assert.equal(book.validateSongbook({entries:[invalid]}).entries.length,0);
 }
 const state=book.validateSongbook({
  entries:[draft,{...draft,id:'song-duplicate'},entry('manual-two','manual','1')],
 });
 assert.equal(state.entries.length,1);
 assert.equal(state.entries[0].id,'song-1');
});

test('Scheduling and status are timezone-aware and do not invent a recording',()=>{
 let state=book.validateSongbook(null);
 assert.equal(book.nextWeeklySong(state,now('2026-11-22T03:00:00.000Z')).date,'2026-11-22');
 state=book.recordSongbookOutcome(state,'Lyrics saved; audio unavailable',now('2026-11-22T04:10:00.000Z'));
 assert.equal(state.lastOutcome.message,'Lyrics saved; audio unavailable');
 assert.equal(state.entries.length,0);
 assert.equal(state.settings.enabled,false);
});
