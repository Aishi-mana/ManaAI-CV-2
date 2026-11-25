const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

function load(path,mocks={}){
 const exports={};
 const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(js,{exports,JSON,Date,Math,Map,Set,Number,String,Object,Array,Error,URL,
  require:name=>{if(name in mocks)return mocks[name];throw Error('Unmocked '+name);}},
  {filename:path});
 return exports;
}
const music=load('src/core/musicStudio.ts',{
 './musicGenres':{checkedBandSource:()=>undefined,checkedGenreLead:()=>undefined,isBandStyle:()=>false},
 './voiceProfiles':{TRAINED_MANA_MODEL:'model.pth'},
 './lyrics':{validateLyrics:()=>[]},
 './originalSong':{validateOriginalBrief:()=>undefined},
 './coverBuilder':{validateBuilderTracks:()=>[]},
});
const discovery=load('src/core/coverDiscovery.ts',{'./llm':{streamChat:async()=>{}},'./musicStudio':music});
const cover=load('src/core/coverHandoff.ts',{
 './musicStudio':music,'./coverDiscovery':discovery,
});
const idea={
 id:'cover-good',createdAt:'2026-11-25T00:00:00.000Z',
 query:'traditional piano',title:'Archive of songs',url:'https://example.org/songs',
 excerpt:'Sheet music overview',reason:'I like this melody.',
};
const imported={path:'C:/AI/ManaAI-CV-2/exports/singing/import-101/track.wav',seconds:84,name:'Old song'};
const input=(patch={})=>({
 idea,rightsBasis:'licensed',acknowledged:true,imported,
 token:'coverjob-12345',now:new Date('2026-11-25T00:00:00.000Z'),...patch,
});
const plain=x=>JSON.parse(JSON.stringify(x));

test('Cover handoff requires explicit rights basis and independent acknowledgment',()=>{
 for(const rights of ['','unknown',null]){
  assert.throws(()=>cover.prepareCoverHandoff(input({rightsBasis:rights})),/Review rights/);
 }
 assert.throws(()=>cover.prepareCoverHandoff(input({acknowledged:false})),/Review rights/);
 assert.throws(()=>cover.prepareCoverHandoff(input({idea:{...idea,url:'http://localhost/file'}})),/saved cover inspiration/);
 for(const basis of ['owned','licensed','public-domain']){
  const result=cover.prepareCoverHandoff(input({rightsBasis:basis}));
  assert.equal(result.attribution.rightsBasis,basis);
  assert.equal(result.attribution.sourceUrl,idea.url);
  assert.equal(result.localAudio,imported.path);
  assert.equal(result.title,'Old song · Mana cover');
 }
});
test('Only a validated native imported local WAV can be handed to Studio',()=>{
 for(const path of ['C:/private/song.mp3','https://example.org/audio.wav',
  'C:/AI/ManaAI-CV-2/exports/singing/../../secret.wav','C:/other/file.wav']){
  assert.throws(()=>cover.prepareCoverHandoff(input({imported:{...imported,path}})),/not imported/);
 }
 for(const seconds of [0,3601,NaN]){
  assert.throws(()=>cover.prepareCoverHandoff(input({imported:{...imported,seconds}})),/not imported/);
 }
 assert.throws(()=>cover.prepareCoverHandoff(input({token:'../bad'})),/Invalid cover handoff/);
});
test('Saved covers preserve vetted provenance without claiming verification',()=>{
 const handoff=plain(cover.prepareCoverHandoff(input()));
 const project={
  id:'studio-1234',kind:'cover',title:handoff.title,createdAt:'2026-11-25T00:00:00.000Z',
  status:'ready',source:handoff.localAudio,
  vocal:'C:/AI/ManaAI-CV-2/exports/singing/cover-1/vocal.wav',
  mix:'C:/AI/ManaAI-CV-2/exports/singing/cover-1/mix.wav',
  instrumental:'',seconds:84,artwork:'',error:'',
  settings:{wholeSong:true,start:0,seconds:1,separate:true,backingGain:1,reference:'model.pth'},
  coverAttribution:handoff.attribution,
 };
 const valid=music.validateStudio({projects:[project]});
 assert.deepEqual(plain(valid.projects[0].coverAttribution),handoff.attribution);
 assert.equal(valid.projects[0].source,imported.path);
 for(const bad of ['https://localhost/source','javascript:alert(1)','https://example.org/#fragment']){
  const rejected=music.validateStudio({projects:[{...project,coverAttribution:{...handoff.attribution,sourceUrl:bad}}]});
  assert.equal(rejected.projects[0].coverAttribution,undefined);
 }
});
test('Phase 2B never fetches or auto-starts cover from web excerpts',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8');
 const ui=fs.readFileSync('src/components/SongbookWorkspace.tsx','utf8');
 const studio=fs.readFileSync('src/components/SingingDrawer.tsx','utf8');
 const step=app.slice(app.indexOf('async function prepareReviewedCover('),app.indexOf('async function discoverCoverIdea('));
 assert.match(step,/await open\(\{multiple:false/);
 assert.match(step,/invoke<\{path:string;seconds:number;name:string\}>\('singing_import_track',\{source\}\)/);
 assert.match(step,/prepareCoverHandoff/);
 assert.doesNotMatch(step,/invoke\('singing_start'|invoke\('original_song_start'|fetch\(/);
 assert.match(ui,/I have reviewed this source/);
 assert.match(ui,/Choose local audio &amp; create cover/);
 assert.match(studio,/setSingingProfile\('mana-trained-v1'\)/);
 assert.match(studio,/targetProfile=linkedAttribution\?'mana-trained-v1':singingProfile/);
 assert.match(studio,/setCoverDraft\(\{project:.*?status:'ready'/s);
 assert.match(studio,/saved:false/);
});
