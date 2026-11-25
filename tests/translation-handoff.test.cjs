const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function load(file,mocks={}){
 const exports={};
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(js,{exports,Date,JSON,Math,Number,String,Object,Array,Set,Map,URL,Error,
  require:key=>{if(key in mocks)return mocks[key];throw Error('Unexpected import '+key);}},
  {filename:file});
 return exports;
}
const midi=load('src/core/midiMelody.ts');
const music=load('src/core/musicStudio.ts',{
 './musicGenres':{checkedBandSource:()=>undefined,checkedGenreLead:()=>undefined,isBandStyle:()=>false},
 './voiceProfiles':{TRAINED_MANA_MODEL:'C:/Mana/model.pth'},
 './lyrics':{validateLyrics:()=>[]},
 './originalSong':{validateOriginalBrief:()=>undefined},
 './coverBuilder':{validateBuilderTracks:()=>[]},
});
const h=load('src/core/translationHandoff.ts',{'./musicStudio':music,'./midiMelody':midi});
const plain=x=>JSON.parse(JSON.stringify(x));
const lines=[{source:'空を見上げて',english:'I look up to the sky'}];
const project=()=>({
 id:'translation-3c',title:'Bright Sky',rightsBasis:'owned',
 lines:plain(lines),melody:{
  sourceName:'owner-melody.mid',trackName:'Lead',rightsBasis:'licensed',
  mappingReviewed:true,englishRevision:midi.englishRevision(lines),
  notes:[{position:0,duration:480,tone:60,lyric:'I',lineIndex:0}],
 },
});
const guide={path:'C:/AI/ManaAI-CV-2/exports/singing/import-101/track.wav',seconds:92,name:'English-OpenUtau-guide'};
const backing={path:'C:/AI/ManaAI-CV-2/exports/singing/import-102/track.wav',seconds:92.2,name:'Accompaniment'};
const input=(overrides={})=>({
 project:project(),imported:guide,rightsBasis:'licensed',acknowledged:true,
 token:'translationjob-test',now:new Date('2026-11-25T03:00:00.000Z'),...overrides,
});

test('Only a reviewed and current Phase 3B note map may hand off English guide audio',()=>{
 const result=h.prepareTranslationHandoff(input());
 assert.equal(result.localAudio,guide.path);
 assert.equal(result.title,'Bright Sky · Mana English vocal');
 assert.equal(result.attribution.sourceTitle,'Bright Sky');
 assert.equal(result.attribution.lyricRightsBasis,'owned');
 assert.equal(result.attribution.melodyRightsBasis,'licensed');
 assert.equal(result.attribution.guideRightsBasis,'licensed');
 assert.deepEqual(plain(result.attribution.englishLyrics),['I look up to the sky']);
 for(const broken of [
  {...project(),melody:{...project().melody,mappingReviewed:false}},
  {...project(),melody:{...project().melody,englishRevision:'old lyrics'}},
  {...project(),melody:undefined},
 ]){
  assert.throws(()=>h.prepareTranslationHandoff(input({project:broken})),/Review the current English/);
 }
});

test('Guide WAV and voicebank permissions are a separate explicit acknowledgment',()=>{
 for(const rights of ['',null,'unknown']){
  assert.throws(()=>h.prepareTranslationHandoff(input({rightsBasis:rights})),/OpenUtau rendered/);
 }
 assert.throws(()=>h.prepareTranslationHandoff(input({acknowledged:false})),/OpenUtau rendered/);
 assert.throws(()=>h.prepareTranslationHandoff(input({token:'../bad'})),/Invalid English guide/);
 assert.throws(()=>h.prepareTranslationHandoff(input({imported:{...guide,path:'C:/private/guide.wav'}})),/Import a valid/);
 assert.throws(()=>h.prepareTranslationHandoff(input({imported:{...guide,seconds:0}})),/Import a valid/);
 assert.throws(()=>h.prepareTranslationHandoff(input({imported:{...guide,seconds:4000}})),/Import a valid/);
});

test('Instrumental mixing requires independent rights and closely aligned imported WAV',()=>{
 const ok=h.prepareTranslationHandoff(input({backing:{
  imported:backing,rightsBasis:'owned',acknowledged:true,
 }}));
 assert.equal(ok.backingAudio,backing.path);
 assert.equal(ok.attribution.backingAudio,backing.path);
 assert.equal(ok.attribution.backingRightsBasis,'owned');
 for(const invalid of [
  {imported:backing,rightsBasis:'licensed',acknowledged:false},
  {imported:backing,rightsBasis:'unknown',acknowledged:true},
  {imported:{...backing,seconds:97},rightsBasis:'licensed',acknowledged:true},
  {imported:{...backing,path:guide.path},rightsBasis:'owned',acknowledged:true},
  {imported:{...backing,path:'https://example.com/backing.wav'},rightsBasis:'owned',acknowledged:true},
 ])assert.throws(()=>h.prepareTranslationHandoff(input({backing:invalid})));
 assert.equal(h.prepareTranslationHandoff(input()).backingAudio,undefined);
});

test('Music Studio persistence retains approved English provenance and rejects tampering',()=>{
 const handoff=plain(h.prepareTranslationHandoff(input({backing:{
  imported:backing,rightsBasis:'owned',acknowledged:true,
 }})));
 const base={
  id:'studio-3c',kind:'cover',title:handoff.title,createdAt:'2026-11-25T03:00:00.000Z',
  status:'ready',source:guide.path,vocal:'C:/AI/ManaAI-CV-2/exports/singing/123/vc_mana-trained-v1.wav',
  mix:'C:/AI/ManaAI-CV-2/exports/singing/mixes/english-adaptation-4.wav',
  instrumental:backing.path,seconds:92,artwork:'',error:'',
  settings:{wholeSong:true,start:0,seconds:1,separate:false,backingGain:0,reference:'C:/Mana/model.pth'},
  translationAttribution:handoff.attribution,
 };
 const loaded=music.validateStudio({projects:[base]});
 assert.deepEqual(plain(loaded.projects[0].translationAttribution),handoff.attribution);
 assert.equal(loaded.projects[0].source,guide.path);
 assert.equal(loaded.projects[0].instrumental,backing.path);
 const invalid=music.validateStudio({projects:[{...base,translationAttribution:{
  ...handoff.attribution,backingAudio:'C:/Users/secret.wav',
 }}]});
 assert.equal(invalid.projects[0].translationAttribution,undefined);
 const long={...handoff.attribution,englishRevision:'A'.repeat(3800)};
 assert.equal(music.validateTranslationAttribution(long).englishRevision.length,3800);
});

test('Studio uses a dry English vocal and never automatically translates or publishes',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8');
 const studio=fs.readFileSync('src/components/SingingDrawer.tsx','utf8');
 const ui=fs.readFileSync('src/components/TranslationVoicePanel.tsx','utf8');
 const rust=fs.readFileSync('src-tauri/src/singing.rs','utf8');
 const step=app.slice(app.indexOf('async function prepareEnglishGuideForVoice('),app.indexOf('async function chooseWeeklyLocalCoverFolder('));
 assert.match(step,/guideReady\(project.melody,project.lines\)/);
 assert.match(step,/singing_import_track/);
 assert.match(step,/prepareTranslationHandoff\(/);
 assert.doesNotMatch(step,/singing_start|search_web|fetch\(/);
 assert.match(studio,/const conversionSeparate=linkedTranslation\?false:separate/);
 assert.match(studio,/const conversionGenre=linkedTranslation\?'original':genre/);
 assert.match(studio,/const conversionWholeSong=linkedTranslation\?true:wholeSong/);
 assert.match(studio,/setTranslationAttribution\(handoff.attribution\)/);
 assert.match(studio,/setCoverDraft\(/);
 assert.match(studio,/songbook_mix_translation_backing/);
 assert.match(ui,/I rendered and reviewed an English singing guide/);
 assert.match(ui,/permission to use this specific|instrumental's permissions/);
 assert.match(rust,/fn english_mix_input_shapes/);
 assert.match(rust,/english-adaptation-\{nonce\}/);
 assert.match(rust,/\-n/);
});
