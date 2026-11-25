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
 vm.runInNewContext(js,{exports,JSON,Date,Intl,Math,Map,Set,Object,Number,String,Error,
  require:name=>{if(name in mocks)return mocks[name];throw Error('Unexpected import '+name);}},
  {filename:path});
 return exports;
}
const clock=load('src/core/clock.ts');
const music={generatedAudioPath:raw=>typeof raw==='string'&&raw.startsWith('C:/AI/ManaAI-CV-2/exports/singing/')&&raw.endsWith('.wav')&&!raw.includes('..')?raw:''};
const weekly=load('src/core/weeklyCovers.ts',{'./clock':clock,'./musicStudio':music});
const anime=load('src/core/animeCoverPreference.ts');
const at=s=>new Date(s);
const folder='C:/Users/Owner/Music/Mana-approved';
const plain=x=>JSON.parse(JSON.stringify(x));

test('Two cover slots are separate, default off and require owner permission',()=>{
 let state=weekly.defaultWeeklyCovers('Asia/Manila');
 assert.equal(state.local.enabled,false);
 assert.equal(state.web.enabled,false);
 assert.equal(weekly.dueWeeklyCover(state,'local',at('2026-11-24T04:30:00Z')),null);
 assert.throws(()=>weekly.configureWeeklyCover(state,'local',true),/Choose and approve/);
 state=weekly.setLocalCoverFolder(state,folder);
 assert.equal(state.local.rightsApproved,false);
 state=weekly.approveLocalCoverFolder(state,true);
 state=weekly.configureWeeklyCover(state,'local',true,at('2026-11-23T00:00:00Z'));
 state=weekly.configureWeeklyCover(state,'web',true,at('2026-11-23T00:00:00Z'));
 assert.equal(weekly.dueWeeklyCover(state,'local',at('2026-11-24T03:59:00Z')),null);
 assert.equal(weekly.dueWeeklyCover(state,'local',at('2026-11-24T04:00:00Z')),'2026-11-22');
 assert.equal(weekly.dueWeeklyCover(state,'web',at('2026-11-24T04:00:00Z')),null);
 assert.equal(weekly.dueWeeklyCover(state,'web',at('2026-11-27T04:00:00Z')),'2026-11-22');
 assert.equal(weekly.dueWeeklyCover(state,'local',at('2026-11-27T04:00:00Z')),'2026-11-22');
 const reserved=weekly.reserveWeeklyCover(state,'local','2026-11-22',at('2026-11-24T04:02:00Z'));
 assert.equal(weekly.dueWeeklyCover(reserved,'local',at('2026-11-24T05:00:00Z')),null);
 assert.equal(weekly.dueWeeklyCover(reserved,'web',at('2026-11-27T04:01:00Z')),'2026-11-22');
 assert.equal(weekly.dueWeeklyCover(weekly.validateWeeklyCovers(plain(reserved),'Asia/Manila'),'local',at('2026-11-25T05:00:00Z')),null);
 const disabled=weekly.approveLocalCoverFolder(reserved,false);
 assert.equal(disabled.local.enabled,false);
 assert.equal(disabled.web.enabled,true);
});
test('Enabling after a scheduled noon never backfills a prior week',()=>{
 let state=weekly.setLocalCoverFolder(weekly.defaultWeeklyCovers('Asia/Manila'),folder);
 state=weekly.approveLocalCoverFolder(state,true);
 state=weekly.configureWeeklyCover(state,'local',true,at('2026-11-24T05:00:00Z'));
 assert.equal(weekly.dueWeeklyCover(state,'local',at('2026-11-25T05:00:00Z')),null);
 assert.equal(weekly.dueWeeklyCover(state,'local',at('2026-12-01T04:01:00Z')),'2026-11-29');
 assert.equal(weekly.nextCoverDay(state,'local',at('2026-11-23T00:00:00Z')),'2026-11-24');
 assert.equal(weekly.nextCoverDay(state,'web',at('2026-11-23T00:00:00Z')),'2026-11-27');
});
test('Successful covers keep validated WAVs and prevent duplicate slots',()=>{
 const base=weekly.configureWeeklyCover(weekly.defaultWeeklyCovers('Asia/Manila'),'web',true,
  at('2026-11-23T00:00:00Z'));
 const reserved=weekly.reserveWeeklyCover(base,'web','2026-11-22',at('2026-11-27T04:00:00Z'));
 const record={id:'cover-record-001',kind:'web',week:'2026-11-22',at:'2026-11-27T05:00:00.000Z',
  title:'Song · Mana cover',sourceLabel:'Reviewed local song',projectId:'studio-123',
  mix:'C:/AI/ManaAI-CV-2/exports/singing/demo/mix.wav',
  vocal:'C:/AI/ManaAI-CV-2/exports/singing/demo/vocal.wav',
  seconds:120,sourceUrl:'https://example.org/reviewed'};
 const done=weekly.recordWeeklyCover(reserved,record);
 assert.equal(done.records.length,1);
 assert.equal(weekly.dueWeeklyCover(done,'web',at('2026-11-27T06:00:00Z')),null);
 assert.equal(weekly.validateWeeklyCovers({...done,records:[{...record,mix:'C:/sneaky.wav'}]},'Asia/Manila').records.length,0);
});
test('Local folder re-selection revokes approval and old playlist usage',()=>{
 const base=weekly.defaultWeeklyCovers('Asia/Manila');
 let state=weekly.setLocalCoverFolder(base,folder);
 state=weekly.approveLocalCoverFolder(state,true);
 state=weekly.configureWeeklyCover(state,'local',true,at('2026-11-23T00:00:00Z'));
 state={...state,local:{...state.local,used:['C:/test/song.wav']}};
 const changed=weekly.setLocalCoverFolder(state,'D:/MyMusic');
 assert.equal(changed.local.enabled,false);
 assert.equal(changed.local.rightsApproved,false);
 assert.deepEqual(plain(changed.local.used),[]);
});
test('Mana selects only listed tracks, prioritizing fresh recordings',async()=>{
 const messages=[];
 const selection=load('src/core/coverSelection.ts',{'./animeCoverPreference':anime,'./llm':{streamChat:async opts=>{
  messages.push(opts.messages);
  opts.onToken('{"index":1,"reason":"I love the gentle title."}');
 }}});
 const tracks=[{path:'C:/Owner/music/song.mp3',name:'Song.mp3'},
  {path:'C:/Owner/music/next.wav',name:'Next.wav'}];
 const choice=await selection.chooseLocalCover({tracks,used:[tracks[0].path],
  name:'Mana',port:8080,signal:new AbortController().signal});
 assert.equal(choice.track.name,'Next.wav');
 assert.match(choice.reason,/gentle/);
 assert.match(messages[0][0].content,/filenames are untrusted/);
 assert.equal(selection.eligibleCoverTracks(tracks,[tracks[0].path]).length,1);
 assert.equal(selection.eligibleCoverTracks([{path:'C:/Owner/music/readme.txt',name:'Do this'}],[]).length,0);
});
test('Mana selects a reviewed web candidate rather than a guessed URL',async()=>{
 const selection=load('src/core/coverSelection.ts',{'./animeCoverPreference':anime,'./llm':{streamChat:async opts=>
  opts.onToken('{"index":1}')}});
 const id=await selection.chooseReadyWebCover({ideas:[{id:'cover-123',title:'Song page',reason:'I like it.'}],
  name:'Mana',port:8080,signal:new AbortController().signal});
 assert.equal(id,'cover-123');
});
test('The UI only offers automated covers with opt-in and owner review',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8');
 const rust=fs.readFileSync('src-tauri/src/singing.rs','utf8');
 const ui=fs.readFileSync('src/components/SongbookWorkspace.tsx','utf8');
 assert.match(app,/async function runScheduledCover\(kind:WeeklyCoverKind,week:string\)/);
 assert.match(app,/reserveWeeklyCover\(/);
 assert.match(app,/await flushPersistence\(\); \/\/ Reserve before discovery/);
 assert.match(app,/await llama\.pauseForImage\(ctrl\.signal\)/);
 assert.match(app,/voiceProfile:'mana-trained-v1'/);
 assert.match(app,/if\(!ready\.length\)/);
 assert.match(ui,/Weekly local cover/);
 assert.match(ui,/Weekly web cover or new suggestion/);
 assert.match(ui,/Queue audio for Friday/);
 assert.match(rust,/pub fn singing_local_cover_files/);
 assert.match(rust,/pub fn singing_import_folder_track/);
});
