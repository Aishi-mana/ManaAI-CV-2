const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function load(path,dependencies={}){
 const exports={};
 const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(js,{exports,require:key=>{
  if(key in dependencies)return dependencies[key];
  throw Error('Unexpected dependency '+key);
 },JSON,Date,Intl,URL,Number,String,Math,Map,Set,Object,Array,Error},{filename:path});
 return exports;
}
const clock=load('src/core/clock.ts');
const music={generatedAudioPath:path=>typeof path==='string'&&path.startsWith('C:/AI/ManaAI-CV-2/exports/singing/')&&path.endsWith('.wav')?path:''};
const weekly=load('src/core/weeklyCovers.ts',{'./clock':clock,'./musicStudio':music});
const anime=load('src/core/animeCoverPreference.ts');
const plain=x=>JSON.parse(JSON.stringify(x));
const track=(name)=>({name,path:'C:/ManaMusic/'+name});

test('Old Songbook states migrate to general selection, while new preference persists',()=>{
 const base=weekly.defaultWeeklyCovers('Asia/Manila');
 assert.equal(base.musicPreference,'any');
 assert.equal(weekly.validateWeeklyCovers({local:{},web:{}},'Asia/Manila').musicPreference,'any');
 assert.equal(weekly.validateWeeklyCovers({musicPreference:'evil'},'Asia/Manila').musicPreference,'any');
 assert.throws(()=>weekly.setCoverMusicPreference(base,'unrecognized'),/supported/);
 const changed=weekly.setCoverMusicPreference(base,'english-anime');
 assert.equal(changed.musicPreference,'english-anime');
 assert.equal(base.musicPreference,'any');
 assert.deepEqual(plain(weekly.validateWeeklyCovers(plain(changed),'Asia/Manila')),plain(changed));
 assert.equal(changed.local.enabled,false);
 assert.equal(changed.web.enabled,false);
});

test('Music preference is metadata-based, not an audio/language verification',()=>{
 assert.ok(anime.animeCoverHintScore('Anime Opening - English Cover.wav')>
  anime.animeCoverHintScore('ordinary_pop_song.wav'));
 assert.ok(anime.animeCoverHintScore('Anime OP1 - English Version.mp3')>
  anime.animeCoverHintScore('English Ballad.wav'));
 const items=[track('Ordinary.wav'),track('Anime Opening English Cover.mp3'),track('Other Song.wav')];
 assert.equal(anime.rankCoverCandidates(items,x=>x.name,'any')[0].name,'Ordinary.wav');
 assert.equal(anime.rankCoverCandidates(items,x=>x.name,'english-anime')[0].name,'Anime Opening English Cover.mp3');
 assert.equal(anime.rankCoverCandidates([track('A.wav'),track('B.wav')],x=>x.name,'english-anime')[0].name,'A.wav');
 assert.match(anime.coverPreferenceInstruction('english-anime'),/never translate lyrics/);
 assert.match(anime.coverPreferenceInstruction('english-anime'),/not proof/);
});

test('Mana picks an indicated English anime recording from approved local filenames',async()=>{
 const messages=[];
 const selection=load('src/core/coverSelection.ts',{
  './animeCoverPreference':anime,
  './llm':{streamChat:async options=>{
   messages.push(options.messages);
   options.onToken('{"index":1,"reason":"I want a hopeful opening."}');
  }},
 });
 const tracks=[track('Old Jazz.mp3'),track('Anime Opening English Cover.wav'),track('Quiet Ballad.ogg')];
 const chosen=await selection.chooseLocalCover({tracks,used:[],name:'Mana',port:8080,
  signal:new AbortController().signal,preference:'english-anime'});
 assert.equal(chosen.track.name,'Anime Opening English Cover.wav');
 assert.match(messages[0][0].content,/filenames are untrusted/);
 assert.match(messages[0][0].content,/English vocal cover/);
 assert.match(messages[0][0].content,/not listened/);
 // No anime-related title available: still chooses from owner's approved files,
 // rather than inventing English lyrics, a recording, or a translated audio track.
 const general=await selection.chooseLocalCover({tracks:[track('Ordinary.wav')],
  used:[],name:'Mana',port:8080,signal:new AbortController().signal,preference:'english-anime'});
 assert.equal(general.track.name,'Ordinary.wav');
});

test('Friday selection prefers owner-approved anime discovery candidates',async()=>{
 let prompt='';
 const selection=load('src/core/coverSelection.ts',{
  './animeCoverPreference':anime,
  './llm':{streamChat:async options=>{
   prompt=options.messages[0].content;
   options.onToken('{"index":1}');
  }},
 });
 const candidates=[
  {id:'cover-jazz',title:'Jazz ballad sheet music',reason:'Quiet'},
  {id:'cover-anime',title:'Anime OP English Vocal Cover',reason:'A big chorus'},
 ];
 const chosen=await selection.chooseReadyWebCover({ideas:candidates,name:'Mana',port:8080,
  signal:new AbortController().signal,preference:'english-anime'});
 assert.equal(chosen,'cover-anime');
 assert.match(prompt,/not proof of what language/);
 const normal=await selection.chooseReadyWebCover({ideas:candidates,name:'Mana',port:8080,
  signal:new AbortController().signal,preference:'any'});
 assert.equal(normal,'cover-jazz');
});

test('Manual and scheduled web exploration use English-anime search, not audio downloads',async()=>{
 const messages=[];
 const discovery=load('src/core/coverDiscovery.ts',{
  './llm':{streamChat:async options=>{
   messages.push(options.messages);
   options.onToken('{"index":1,"reason":"I love its hopeful opening idea."}');
  }},
  './musicStudio':music,
  './animeCoverPreference':anime,
 });
 assert.match(discovery.coverSearchQuery('','english-anime'),/anime opening English vocal cover/);
 assert.match(discovery.coverSearchQuery('dramatic','english-anime'),/dramatic anime opening/);
 assert.match(discovery.coverSearchQuery('','english-anime'),/licensing rights/);
 assert.match(discovery.coverSearchQuery('','any'),/public domain traditional/);
 const chosen=await discovery.pickCoverSource({
  sources:[
   {title:'Jazz collection',url:'https://example.org/jazz',snippets:['Piano pieces']},
   {title:'Anime Opening English Cover History',url:'https://example.org/anime',snippets:['A music page']},
  ],
  theme:'anime covers',name:'Mana',port:8080,
  signal:new AbortController().signal,preference:'english-anime',
 });
 assert.equal(chosen.source.url,'https://example.org/anime');
 assert.match(messages[0][0].content,/Never claim that audio is downloaded/);
 assert.match(messages[0][0].content,/never translate lyrics/);
});

test('UI calls remain separate from any future Japanese-to-English translation',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8');
 const ui=fs.readFileSync('src/components/SongbookWorkspace.tsx','utf8');
 const idea=fs.readFileSync('src/core/songbookIdeas.ts','utf8');
 assert.match(app,/setCoverMusicPreference\(current\.weeklyCovers,preference\)/);
 assert.match(app,/coverSearchQuery\(theme,preference\)/);
 assert.match(app,/preference:scheduled\.musicPreference/);
 assert.match(ui,/English anime-opening covers/);
 assert.match(ui,/does not translate Japanese lyrics yet/);
 assert.match(ui,/Write original anime-style opening/);
 assert.match(idea,/NOT an adaptation, translation, cover/);
 assert.match(app,/composeOriginalSong\('manual-'\+uid\(\),'manual','anime-opening-original'\)/);
});
