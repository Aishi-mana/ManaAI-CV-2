const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {TextDecoder}=require('node:util');
function load(path,mocks={}){
 const exports={};
 const compiled=ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(compiled,{exports,Date,Number,String,JSON,Math,Map,Set,Array,Object,
  Error,Uint8Array,TextDecoder,
  require:name=>{if(name in mocks)return mocks[name];throw Error('Unexpected import '+name);}},
  {filename:path});
 return exports;
}
const midi=load('src/core/midiMelody.ts');
const workbench=load('src/core/translationWorkbench.ts',{'./midiMelody':midi});
const editor=load('src/core/melodyGuide.ts',{'./midiMelody':midi});
const exportUstx=load('src/core/openUtauExport.ts',{'./midiMelody':midi});
const plain=value=>JSON.parse(JSON.stringify(value));
const vlq=value=>{const a=[value&127];while((value>>=7))a.unshift((value&127)|128);return a;};
const chunk=(label,arr)=>[...label.split('').map(c=>c.charCodeAt(0)),
 (arr.length>>>24)&255,(arr.length>>>16)&255,(arr.length>>>8)&255,arr.length&255,...arr];
const noteOn=(tone)=>[0x90,tone,90];
const noteOff=(tone)=>[0x80,tone,0];
const end=[0xff,0x2f,0];
const leadNotes=[
 ...vlq(0),...noteOn(60),
 ...vlq(480),...noteOff(60),
 ...vlq(0),...noteOn(62),
 ...vlq(240),...noteOff(62),
 ...vlq(0),...end,
];
const meta=[
 ...vlq(0),0xff,0x58,4,4,2,24,8, // 4/4
 ...vlq(0),0xff,0x51,3,0x07,0xa1,0x20, // 120 BPM
 ...vlq(480),0xff,0x51,3,0x06,0x1a,0x80, // 150 BPM
 ...vlq(0),...end,
];
function makeMidi(tracks=[meta,leadNotes]){
 return new Uint8Array([...chunk('MThd',[0,1,0,tracks.length,1,0xe0]),
  ...tracks.flatMap(events=>chunk('MTrk',events))]);
}
const project=()=>workbench.createTranslationProject({
 id:'translation-test',title:'Original test melody',sourceLyrics:'ひかりが\nそらにある',
 rightsBasis:'owned',acknowledged:true,
 now:new Date('2026-11-25T00:00:00Z'),
});
function englishState(){
 let state={translations:[project()]};
 state=workbench.updateTranslationLine(state,'translation-test',0,'english','Hello');
 state=workbench.updateTranslationLine(state,'translation-test',1,'english','sky');
 return state;
}
const imported=()=>midi.parseMidiFile(makeMidi());

test('Parse type-1 MIDI metadata and exact monophonic pitches, durations and tempos',()=>{
 const file=imported();
 assert.equal(file.tracks.length,1);
 assert.equal(file.tracks[0].trackIndex,1);
 assert.equal(file.tracks[0].notes.length,2);
 assert.deepEqual(plain(file.tracks[0].notes),[
  {position:0,duration:480,tone:60},
  {position:480,duration:240,tone:62},
 ]);
 assert.deepEqual(plain(file.tempos),[{position:0,bpm:120},{position:480,bpm:150}]);
 assert.deepEqual(plain(file.signature),{beatPerBar:4,beatUnit:4});
});

test('MIDI parser rejects bad headers, oversized audio, incomplete data and polyphonic notes',()=>{
 const bad=new Uint8Array(makeMidi());bad[0]=0;
 assert.throws(()=>midi.parseMidiFile(bad),/not a Standard MIDI/);
 assert.throws(()=>midi.parseMidiFile(new Uint8Array(1_000_001)),/smaller than 1 MB/);
 const truncated=makeMidi().subarray(0,25);
 assert.throws(()=>midi.parseMidiFile(truncated),/incomplete|Truncated|Invalid/);
 const chords=[
  ...vlq(0),...noteOn(60),
  ...vlq(0),...noteOn(64),
  ...vlq(480),...noteOff(60),
  ...vlq(0),...noteOff(64),
  ...vlq(0),...end,
 ];
 assert.throws(()=>midi.parseMidiFile(makeMidi([meta,chords])),/No short monophonic/);
});

test('Melody requires explicit separate rights; attaching never changes original text or version shelf',()=>{
 const initial=englishState(),file=imported();
 assert.throws(()=>editor.attachMidiGuide(initial,'translation-test',file,1,
  'sample.mid','owned',false),/Review the melody/);
 const ready=editor.attachMidiGuide(initial,'translation-test',file,1,
  'sample.mid','licensed',true,new Date('2026-11-25T01:00:00Z'));
 assert.equal(ready.translations[0].melody.rightsBasis,'licensed');
 assert.equal(ready.translations[0].melody.mappingReviewed,false);
 assert.equal(initial.translations[0].melody,undefined);
 assert.equal(ready.translations[0].lines[0].source,initial.translations[0].lines[0].source);
 assert.deepEqual(plain(workbench.validateTranslationProjects(plain(ready.translations))[0]),
  plain(ready.translations[0]));
});

test('Rough seeding is visibly unreviewed and user edits clear approvals',()=>{
 const state=editor.attachMidiGuide(englishState(),'translation-test',imported(),1,
  'song.mid','owned',true);
 const seeded=editor.seedMelodyGuide(state,'translation-test',0,1);
 assert.deepEqual(plain(seeded.translations[0].melody.notes.map(n=>n.lyric)),['Hello','sky']);
 assert.equal(seeded.translations[0].melody.mappingReviewed,false);
 assert.throws(()=>exportUstx.exportOpenUtauGuide(seeded.translations[0]),/Review every/);
 const checked=editor.confirmMelodyGuide(seeded,'translation-test');
 assert.equal(checked.translations[0].melody.mappingReviewed,true);
 const edited=editor.editMelodyGuide(checked,'translation-test',0,'lyric','Hel');
 assert.equal(edited.translations[0].melody.mappingReviewed,false);
 assert.throws(()=>editor.editMelodyGuide(checked,'translation-test',0,'duration',600),
  /non-overlapping/);
 assert.throws(()=>editor.editMelodyGuide(checked,'translation-test',1,'tone',128),
  /0–127/);
});

test('Changing English after approval makes previous syllable map stale until explicit re-review',()=>{
 const attached=editor.attachMidiGuide(englishState(),'translation-test',imported(),1,
  'song.mid','owned',true);
 const mapped=editor.confirmMelodyGuide(editor.seedMelodyGuide(attached,
  'translation-test',0,1),'translation-test');
 const changed=workbench.updateTranslationLine(mapped,'translation-test',0,'english','Good morning');
 assert.equal(midi.guideReady(changed.translations[0].melody,changed.translations[0].lines),false);
 assert.throws(()=>exportUstx.exportOpenUtauGuide(changed.translations[0]),/Review every/);
 assert.throws(()=>editor.confirmMelodyGuide(changed,'translation-test'),/changed/);
 const synced=editor.syncMelodyGuide(changed,'translation-test');
 assert.equal(synced.translations[0].melody.mappingReviewed,false);
 const revised=editor.confirmMelodyGuide(
  editor.editMelodyGuide(synced,'translation-test',0,'lyric','Good'),'translation-test');
 assert.equal(midi.guideReady(revised.translations[0].melody,revised.translations[0].lines),true);
});

test('Reviewed guide produces UTF-8 USTX with all tempo events and note lyrics; never a WAV',()=>{
 const attached=editor.attachMidiGuide(englishState(),'translation-test',imported(),1,
  'song.mid','owned',true);
 const checked=editor.confirmMelodyGuide(editor.seedMelodyGuide(attached,
  'translation-test',0,1),'translation-test');
 const yaml=exportUstx.exportOpenUtauGuide(checked.translations[0]);
 assert.match(yaml,/ustx_version: "0\.6"/);
 assert.match(yaml,/resolution: 480/);
 assert.match(yaml,/time_signatures:\n  - bar_position: 0/);
 assert.match(yaml,/tempos:\n  - position: 0\n    bpm: 120\n  - position: 480\n    bpm: 150/);
 assert.match(yaml,/voice_parts:/);
 assert.match(yaml,/tone: 60\n        lyric: "Hello"/);
 assert.match(yaml,/tone: 62\n        lyric: "sky"/);
 assert.match(yaml,/wave_parts: \[\]/);
 assert.match(yaml,/singer: ""/);
 assert.doesNotMatch(yaml,/WAV bytes|singing_start|original_song_start/);
});

test('Guide does not silently become rendered audio or change weekly cover scheduling',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8');
 const panel=fs.readFileSync('src/components/MelodyGuidePanel.tsx','utf8');
 const rust=fs.readFileSync('src-tauri/src/lib.rs','utf8');
 assert.match(panel,/Use selected melody track/);
 assert.match(panel,/Confirm note lyrics and timing reviewed/);
 assert.match(panel,/Save OpenUtau guide \(\.ustx\)/);
 assert.match(panel,/No automatic audio-to-MIDI transcription/);
 assert.match(app,/exportOpenUtauGuide\(project\)/);
 assert.match(app,/saveDialog\(/);
 assert.match(app,/invoke\('songbook_export_ustx'/);
 assert.match(rust,/fn songbook_export_ustx/);
 assert.match(rust,/\.create_new\(true\)/);
 assert.equal(app.includes("songbook_auto_translate_midi"),false);
});
