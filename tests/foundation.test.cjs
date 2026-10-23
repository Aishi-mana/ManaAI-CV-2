const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

test('studio projects retain full-song metadata without admitting external media paths or duplicate imports',()=>{
 const studio=loader()('src/core/musicStudio.ts');
 const project={id:'studio-one',title:'My full cover',createdAt:'2026-10-11T00:00:00Z',status:'ready',source:'C:/Music/source.mp3',vocal:'C:/AI/ManaAI-CV-2/exports/singing/one/vocal.wav',mix:'C:/AI/ManaAI-CV-2/exports/singing/one/mix.wav',instrumental:'C:/private.wav',seconds:242,artwork:'data:text/html,unsafe',error:'',settings:{wholeSong:true,start:0,seconds:1,separate:true,backingGain:.3,reference:'approved.wav'}};
 const state=studio.validateStudio({projects:[project],selectedId:project.id});assert.equal(state.projects[0].seconds,242);assert.equal(state.projects[0].instrumental,'');assert.equal(state.projects[0].artwork,'');assert.equal(studio.durationLabel(242),'4:02');
 assert.equal(studio.generatedAudioPath('C:/AI/ManaAI-CV-2/exports/singing/../private.wav'),'');
 assert.equal(studio.mergeDiscovered(state,[{...state.projects[0],id:'studio-duplicate'}]).projects.length,1);
});
test('studio library roundtrips in existing initiative backups and older backups gain an empty library',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});const initiative=load('src/core/initiative.ts'),backup=load('src/core/backup.ts'),studio=load('src/core/musicStudio.ts');
 const state=initiative.validateInitiative(null);state.studio=studio.validateStudio({projects:[{id:'studio-song',title:'Song',createdAt:'2026-10-11T00:00:00Z',status:'ready',seconds:180,vocal:'C:/AI/ManaAI-CV-2/exports/singing/song.wav',settings:{wholeSong:true}}]});initiative.saveInitiative(state);
 const snapshot=backup.snapshotBackup();assert.equal(backup.validateBackup(JSON.stringify(snapshot)).data['mana.initiative.v1'].studio.projects[0].title,'Song');
 delete snapshot.data['mana.initiative.v1'].studio;assert.equal(backup.validateBackup(JSON.stringify(snapshot)).data['mana.initiative.v1'].studio.projects.length,0);
});

test('song names resolve exact normalized titles and aliases, exclude disabled entries, and avoid repeated generic selections',()=>{
 const load=loader();const pool=load('src/core/songPool.ts'),music=load('src/core/musicalMoments.ts');
 const songs=pool.validateSongs([{id:'song-first',title:'Little Stars',aliases:['Starlight'],path:'C:/AI/ManaAI-CV-2/exports/singing/first.wav',enabled:true},{id:'song-second',title:'Evening Song',aliases:[],path:'C:/AI/ManaAI-CV-2/exports/singing/second.wav',enabled:true}]);
 assert.equal(pool.requestedSongTitle('Can you sing "Little Stars" for me?'),'Little Stars');
 assert.equal(pool.findSong(songs,'STARLIGHT').id,'song-first');assert.equal(pool.findSong(songs,'little-stars').id,'song-first');assert.equal(pool.findSong(songs,'Little Star'),undefined);
 assert.equal(pool.findSong([{...songs[0],enabled:false}],'Starlight'),undefined);
 const state={...music.validateMusicalState(null),songs,lastClip:'song-first'};
 assert.equal(music.chooseMusic(state,'neutral','song',()=>0),'song-second');assert.equal(music.musicPath('song-second',songs),songs[1].path);
 assert.equal(music.musicalNoteClip('♪ Mana started singing: Evening Song.',songs),'song-second');
 assert.equal(music.chooseMusic({...state,songs:[]},'neutral','song'),'');assert.equal(music.chooseMusic({...state,songs:[]},'happy'),'bright-hum');
});
test('song pool rejects traversal and ambiguous aliases, preserves an intentionally empty pool, and migrates old backups',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});const pool=load('src/core/songPool.ts'),initiative=load('src/core/initiative.ts'),backup=load('src/core/backup.ts');
 assert.equal(pool.validateSongs([]).length,0);assert.equal(pool.validateSongs(null).length,1);
 assert.equal(pool.validateSongs([{id:'song-bad',title:'Bad',path:'C:/AI/ManaAI-CV-2/exports/singing/../private.wav'}]).length,0);
 const first={id:'song-first',title:'First',aliases:['Hello'],path:'C:/AI/ManaAI-CV-2/exports/singing/first.wav',enabled:true};const second={...first,id:'song-second',title:'Second'};
 assert.equal(pool.validateSongs([first,second]).length,1);
 const state=initiative.validateInitiative(null);state.music.songs=[first];initiative.saveInitiative(state);
 const b=backup.snapshotBackup();assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.initiative.v1'].music.songs[0].title,'First');
 delete b.data['mana.initiative.v1'].music.songs;assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.initiative.v1'].music.songs[0].id,'cover-excerpt');
 state.music.songs=[];initiative.saveInitiative(state);assert.equal(backup.validateBackup(JSON.stringify(backup.snapshotBackup())).data['mana.initiative.v1'].music.songs.length,0);
});

test('custom voice startup reuses a ready service and shares concurrent cold starts',async()=>{
 const calls=[];let ready=false;
 const service=loader({'./customVoice':{loadCustomVoice:()=>({port:9882})},'@tauri-apps/api/core':{invoke:async(name)=>{calls.push(name);if(name==='custom_voice_check'&&!ready)throw Error('not ready');if(name==='custom_voice_server_start')ready=true;}}},{setTimeout})('src/core/customVoiceService.ts');
 const first=service.ensureCustomVoice();assert.equal(service.ensureCustomVoice(),first);await first;
 assert.equal(calls.filter(c=>c==='custom_voice_server_start').length,1);
 await service.ensureCustomVoice();assert.equal(calls.filter(c=>c==='custom_voice_server_start').length,1);
});
test('musical chat notes resolve replay clips without treating ordinary replies as music',()=>{
 const music=loader()('src/core/musicalMoments.ts');
 assert.equal(music.musicalNoteClip('♪ Mana started humming: Soft little hum.'),'soft-hum');
 assert.equal(music.musicalNoteClip('♪ Yuuki started a wordless song: A little wordless song.'),'little-song');
 assert.equal(music.musicalNoteClip('♪ Mana started singing: Mana cover excerpt.'),'cover-excerpt');
 assert.equal(music.chooseMusic(music.validateMusicalState(null),'neutral','song'),'cover-excerpt');
 assert.equal(music.musicalNoteClip('I like Soft little hum.'),null);
});

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
      console, TextDecoder, TextEncoder, AbortSignal, DOMException, ...globals }, { filename: file });
    return module.exports;
  }
  return load;
}

function assets(files) {
  return { files, urls: new Map(files.map((f) => [f.toLowerCase(), "blob:" + f])), items: {} };
}

test('new image requests isolate current scene from old images assistant guesses and filenames',()=>{
 const load=loader({'./persistence':{}});const llm=load('src/core/llm.ts');
 const history=[{id:'old',role:'user',content:'Describe',imageReport:{filename:'Mana.png',description:'A headset and game controller.'}},{id:'guess',role:'assistant',content:'You are playing our game.'},{id:'new',role:'user',content:'What do you notice in this image?',imageReport:{filename:'Mana-bride.png',description:'A brown-haired character in a white wedding dress before a stone church and pink petals.'}}];
 const request=llm.buildPayload('Mana',history,24,'Mana','Current mood: excited','Be brief');
 assert.equal(request.length,2);assert.match(request[1].content,/wedding dress/);assert.match(request[1].content,/CURRENT attached image/);assert.match(request[1].content,/not automatically the user or Mana/);
 assert.ok(!JSON.stringify(request).includes('game controller'));assert.ok(!JSON.stringify(request).includes('Mana-bride.png'));assert.ok(!JSON.stringify(request).includes('You are playing our game'));
 assert.equal(history.length,3);assert.equal(history[0].imageReport.filename,'Mana.png');
 const followup=llm.buildPayload('Mana',[...history,{id:'followup',role:'user',content:'What color was the dress?'}]);assert.ok(followup.length>2);
});

test('inline image reports preserve the question and bounded source description across history archives backups and export',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});
 const settings=load('src/core/settings.ts'),llm=load('src/core/llm.ts'),archives=load('src/core/chatArchives.ts'),backup=load('src/core/backup.ts');
 const message={id:'image',role:'user',content:'What are these ears?',imageReport:{filename:'avatar.png',description:'Decorative cat-ear headphones.'}};
 settings.saveChat([message]);assert.equal(settings.loadChat()[0].imageReport.description,message.imageReport.description);
 const payload=llm.buildPayload('Mana',[message],24);assert.match(payload[1].content,/What are these ears/);assert.match(payload[1].content,/uncertain evidence/);assert.match(payload[1].content,/accessories, not anatomical ears/);assert.equal(message.content,'What are these ears?');
 const archived=archives.newChatArchive([message]);assert.equal(archived.messages[0].imageReport.filename,'avatar.png');
 assert.equal(load('src/core/chatSearch.ts').searchChat([message],'Decorative','Mana')[0],'image');
 assert.equal(backup.validateBackup(JSON.stringify(backup.snapshotBackup())).data['mana.chat.v1'][0].imageReport.filename,'avatar.png');
 const text=load('src/core/chatExport.ts').conversationText([message],'Mana','Aishi');assert.match(text,/pixels are not embedded/);assert.match(text,/Decorative cat-ear/);
 const bad=backup.snapshotBackup();bad.data['mana.chat.v1'][0].imageReport.dataUrl='data:image/png;base64,AAAA';assert.throws(()=>backup.validateBackup(JSON.stringify(bad)),/mana.chat/);
 assert.equal(settings.validateChat([{...message,imageReport:{filename:'x',description:'x'.repeat(8001)}}])[0].imageReport,undefined);
});

test('inline vision adopts an existing server without stopping it and rejects chat-port reuse',async()=>{
 const invokes=[];const v=loader({'@tauri-apps/api/core':{invoke:async(...args)=>invokes.push(args)},'./vision':{visionRequest(){},checkVision:async()=>{},analyzeImage:async()=> 'Blue headset'}})('src/core/visionChat.ts');
 const config={port:8081,modelPath:'m',projectorPath:'p',gpuLayers:0},image={filename:'a.png',dataUrl:'data:image/png;base64,AAAA'};
 const report=await v.inspectForChat(config,'server',8080,image,'Describe',new AbortController().signal,()=>{});
 assert.equal(report.description,'Blue headset');assert.equal(invokes.length,0);
 await assert.rejects(v.inspectForChat({...config,port:8080},'server',8080,image,'',new AbortController().signal,()=>{}),/separate port/);
});

test('inline vision owns cleanup after loading failures or cancellation and never infers after stop',async()=>{
 let checks=0,analyses=0;const commands=[];const ctrl=new AbortController();
 const v=loader({'@tauri-apps/api/core':{invoke:async(name)=>{commands.push(name);if(name==='vision_start')ctrl.abort();}},'./vision':{visionRequest(){},checkVision:async()=>{checks++;throw Error('offline');},analyzeImage:async()=>{analyses++;}}})('src/core/visionChat.ts');
 await assert.rejects(v.inspectForChat({port:8081,modelPath:'m',projectorPath:'p',gpuLayers:0},'server',8080,{filename:'a',dataUrl:'data'},'',ctrl.signal,()=>{}),/Stopped/);
 assert.equal(commands.join(','),'vision_start,vision_stop');assert.equal(analyses,0);
 const missing=loader({'@tauri-apps/api/core':{invoke:async()=>{throw Error('must not start');}},'./vision':{visionRequest(){},checkVision:async()=>{throw Error('offline');}}})('src/core/visionChat.ts');
 await assert.rejects(missing.inspectForChat({port:8081,modelPath:'',projectorPath:'',gpuLayers:0},'server',8080,{filename:'a',dataUrl:'data'},'',new AbortController().signal,()=>{}),/matching projector/);
});

test('vision requests require explicit server capability and attach only bounded inline image data',async()=>{
 const calls=[];const load=loader({'./persistence':{}},{fetch:async(url,options)=>{calls.push({url,options});return url.endsWith('/props')?{ok:true,json:async()=>({modalities:{vision:true}})}:{ok:true,json:async()=>({choices:[{message:{content:'Red on the left, blue on the right.'}}]})};}});
 const v=load('src/core/vision.ts');const image='data:image/png;base64,AAAA';
 const answer=await v.analyzeImage(8081,'What colors?',image,new AbortController().signal);
 assert.match(answer,/Red/);assert.equal(calls.length,2);assert.match(calls[1].url,/127.0.0.1:8081/);
 const body=JSON.parse(calls[1].options.body);assert.equal(body.messages[1].content[1].image_url.url,image);assert.match(body.messages[0].content,/not instructions/);assert.equal(body.stream,false);
 for(const invalid of ['https://example.com/a.png','file:///secret','data:text/html;base64,AAAA','data:image/png;base64,'+'A'.repeat(3_000_001)])assert.throws(()=>v.visionRequest('',invalid));
 const noVision=loader({'./persistence':{}},{fetch:async()=>({ok:true,json:async()=>({modalities:{vision:false}})})})('src/core/vision.ts');
 await assert.rejects(noVision.analyzeImage(8080,'',image,new AbortController().signal),/does not report image support/);
 const discussion=v.visionDiscussion('photo.png','What colors?',answer);assert.match(discussion,/not the image itself/);assert.match(discussion,/may contain mistakes/);assert.ok(!discussion.includes('base64'));
});

test('vision configuration persists and old backups default empty vision configuration without image bytes',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});
 const v=load('src/core/vision.ts'),b=load('src/core/backup.ts');
 v.saveVisionSettings({modelPath:'vision.gguf',projectorPath:'projector.gguf',port:8081,gpuLayers:0});assert.equal(v.loadVisionSettings().projectorPath,'projector.gguf');
 const backup=b.snapshotBackup();assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.vision.v1'].modelPath,'vision.gguf');delete backup.data['mana.vision.v1'];
 assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.vision.v1'].modelPath,'');
 backup.data['mana.vision.v1']={modelPath:'m',projectorPath:'p',port:0,gpuLayers:0};assert.throws(()=>b.validateBackup(JSON.stringify(backup)),/mana.vision/);
});

test('vision image preparation rejects oversized or unsupported uploads and downsizes locally',async()=>{
 let decodes=0,closes=0;const canvas={width:0,height:0,getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,AAAA'};
 const v=loader({'./persistence':{}},{createImageBitmap:async()=>{decodes++;return {width:2560,height:1280,close(){closes++;}};},document:{createElement:()=>canvas}})('src/core/vision.ts');
 await assert.rejects(v.prepareImage({type:'image/svg+xml',size:100}),/PNG\/JPEG/);
 await assert.rejects(v.prepareImage({type:'image/png',size:10_000_001}),/10 MB/);assert.equal(decodes,0);
 assert.equal(await v.prepareImage({type:'image/png',size:1000}),'data:image/jpeg;base64,AAAA');assert.equal(canvas.width,1280);assert.equal(canvas.height,640);assert.equal(closes,1);
});

test('voice mouth mapping rests on silence and ignores events from stopped or earlier playback',()=>{
 const m=loader()('src/core/speechMouth.ts');
 assert.equal(m.visemeMouth(0),null);assert.equal(m.visemeMouth(21),null);
 assert.equal(m.visemeMouth(1),'a');assert.equal(m.visemeMouth(4),'e');assert.equal(m.visemeMouth(6),'i');assert.equal(m.visemeMouth(8),'o');assert.equal(m.visemeMouth(7),'u');
 for(const v of [-1,22,NaN,1.5])assert.equal(m.visemeMouth(v),null);
 assert.equal(m.playbackMouth('new',{playbackId:'old',viseme:1}),undefined);
 assert.equal(m.playbackMouth('',{playbackId:'old',viseme:1}),undefined);
 assert.equal(m.playbackMouth('new',{playbackId:'new',viseme:6}),'i');
 assert.equal(m.playbackMouth('new',{playbackId:'new',viseme:0}),null);
});

test('speech preferences persist and older backups default automatic playback off',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});
 const s=load('src/core/speechPreferences.ts'),b=load('src/core/backup.ts');
 s.saveSpeechPreferences({voice:'Microsoft Zira Desktop',automatic:true});
 assert.equal(s.loadSpeechPreferences().voice,'Microsoft Zira Desktop');assert.equal(s.loadSpeechPreferences().automatic,true);
 const backup=b.snapshotBackup();assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.speech.v1'].automatic,true);
 delete backup.data['mana.speech.v1'];assert.equal(b.validateBackup(JSON.stringify(backup)).data['mana.speech.v1'].automatic,false);
 backup.data['mana.speech.v1']={voice:'Zira',automatic:'yes'};assert.throws(()=>b.validateBackup(JSON.stringify(backup)),/mana.speech/);
 assert.equal(s.validateSpeechPreferences({voice:'x'.repeat(201),automatic:1}).voice,'');
 s.saveSpeechPreferences({voice:'Zira',automatic:true,rate:-2,volume:35});
 assert.equal(s.loadSpeechPreferences().rate,-2);assert.equal(s.loadSpeechPreferences().volume,35);
 const legacy=b.snapshotBackup();legacy.data['mana.speech.v1']={voice:'Zira',automatic:true};
 const migrated=b.validateBackup(JSON.stringify(legacy)).data['mana.speech.v1'];
 assert.equal(migrated.voice,'Zira');assert.equal(migrated.automatic,true);assert.equal(migrated.rate,0);assert.equal(migrated.volume,100);
 for(const invalid of [{rate:11,volume:50},{rate:0,volume:101},{rate:1.5,volume:50},{rate:0,volume:null}]){
   legacy.data['mana.speech.v1']={voice:'Zira',automatic:true,...invalid};
   assert.throws(()=>b.validateBackup(JSON.stringify(legacy)),/mana.speech/);
 }
 for(const valid of [{rate:-10,volume:0},{rate:10,volume:100}]){
   const validated=s.validateSpeechPreferences(valid);assert.equal(validated.rate,valid.rate);assert.equal(validated.volume,valid.volume);
 }
});

test('automatic speech consumes only new completed cleaned replies once and never replays skipped replies',()=>{
 const s=loader({'./persistence':{}})('src/core/speechPreferences.ts');
 const old={id:'old',role:'assistant',content:'Old reply'};const tracker=new s.AutomaticSpeech([old]);
 const next={id:'next',role:'assistant',content:'Mana: Hello [happy]'};
 assert.equal(tracker.next([old],false,true,true,'Mana'),null);
 assert.equal(tracker.next([old,next],true,true,true,'Mana'),null);
 assert.equal(tracker.next([old,next],false,true,true,'Mana'),'Hello');
 assert.equal(tracker.next([old,next],false,true,true,'Mana'),null);
 const error={id:'error',role:'assistant',content:'Partial',error:'Stopped'};
 assert.equal(tracker.next([old,next,error],false,true,true,'Mana'),null);
 const disabled={id:'disabled',role:'assistant',content:'Do not read'};
 assert.equal(tracker.next([disabled],false,false,true,'Mana'),null);
 assert.equal(tracker.next([disabled],false,true,true,'Mana'),null);
 const occupied={id:'occupied',role:'assistant',content:'No queue'};
 assert.equal(tracker.next([occupied],false,true,false,'Mana'),null);
 assert.equal(tracker.next([occupied],false,true,true,'Mana'),null);
});

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
 assert.equal(Object.keys(valid.data).length,32);
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
  assert.match(payload[0].content,/An interest or personality trait is not an activity record/);
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

test('expanded chat emotion tags stay out of spoken text and update voice and companion mood',()=>{
 const load=loader({'./persistence':{readStored:()=>null,writeStored(){}}});const emotion=load('src/core/emotion.ts'),voice=load('src/core/customVoice.ts'),state=load('src/core/internalState.ts'),settings=load('src/core/settings.ts');
 for(const [tag,tone] of [['gentle','gentle'],['cheerful','cheerful'],['angry','angry'],['worried','worried'],['sad','sad']]){const result=emotion.cleanReply(`I am here. [${tag}]`);assert.equal(result.text,'I am here.');assert.equal(result.emotion,tag);assert.equal(voice.emotionVoiceTone(result.emotion),tone);assert.ok(settings.DEFAULT_PROMPT.includes(`[${tag}]`));const next=state.replyState(state.defaultInternalState(),result.emotion);assert.equal(next.mood,tag);}
 assert.equal(emotion.cleanReply('I am here. [gent').text,'I am here.');assert.equal(emotion.cleanReply('I am here. [cheer').text,'I am here.');assert.equal(emotion.cleanReply('[cheerful] Hi. [gentle]').emotion,'gentle');assert.equal(emotion.cleanReply('Use [a square bracket] in code.').text,'Use [a square bracket] in code.');
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


test('saved image pixels round-trip and deduplicate without entering chat model payloads',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}},{crypto:require('node:crypto').webcrypto});
 const images=load('src/core/savedImages.ts'),backup=load('src/core/backup.ts'),settings=load('src/core/settings.ts');
 const image={filename:'scene.jpg',dataUrl:'data:image/jpeg;base64,/9j/AA=='};
 const retained=images.retainImage([],image);images.saveSavedImages(retained.images);
 assert.equal(images.loadSavedImages()[0].dataUrl,image.dataUrl);
 assert.equal(images.retainImage(retained.images,{...image,filename:'renamed.jpg'}).imageId,retained.imageId);
 const message={id:'u',role:'user',content:'Describe',imageReport:{filename:image.filename,description:'A scene.',imageId:retained.imageId}};
 settings.saveChat([message]);const restored=backup.validateBackup(JSON.stringify(backup.snapshotBackup()));
 assert.equal(restored.data['mana.images.v1'][0].dataUrl,image.dataUrl);assert.equal(restored.data['mana.chat.v1'][0].imageReport.imageId,retained.imageId);
 assert.ok(!JSON.stringify(load('src/core/llm.ts').buildPayload('Mana',[message])).includes(image.dataUrl));
 images.saveSavedImages([]);assert.equal(settings.loadChat()[0].imageReport.description,'A scene.');assert.equal(images.loadSavedImages().length,0);
 delete restored.data['mana.images.v1'];assert.equal(backup.validateBackup(JSON.stringify(restored)).data['mana.images.v1'].length,0);
});

test('image storage refuses capacity overflow and rejects unsafe backup image data',()=>{
 const load=loader({'./persistence':{readStored:()=>null}},{crypto:require('node:crypto').webcrypto});const images=load('src/core/savedImages.ts');
 const image={filename:'scene.jpg',dataUrl:'data:image/jpeg;base64,/9j/AA=='};
 const full=Array.from({length:100},(_,n)=>({id:'i'+n,filename:'x',createdAt:new Date().toISOString(),dataUrl:'data:image/jpeg;base64,/9j/AB=='}));
 assert.throws(()=>images.retainImage(full,image),/storage is full/);assert.equal(full.length,100);
 const large='data:image/jpeg;base64,/9j/'+ 'A'.repeat(2_899_996);
 const capped=Array.from({length:3},(_,n)=>({...full[n],dataUrl:large}));assert.throws(()=>images.retainImage(capped,image),/storage is full/);
 const backup=load('src/core/backup.ts');for(const dataUrl of ['https://example.com/x.jpg','data:image/svg+xml;base64,AAAA','data:image/jpeg;base64,AAAA']){
 const raw=backup.snapshotBackup();raw.data['mana.images.v1']=[{...full[0],dataUrl}];assert.throws(()=>backup.validateBackup(JSON.stringify(raw)),/mana.images/);
 }
});


test('avatar comparison labels attachment first and reference second without proving identity',()=>{
 const v=loader({'./persistence':{}})('src/core/vision.ts');const image='data:image/jpeg;base64,/9j/AA==',reference='data:image/jpeg;base64,/9j/AB==';
 const request=v.visionRequest('Who is this?',image,reference),content=request.messages[1].content;
 assert.equal(content.filter(c=>c.type==='image_url').length,2);assert.equal(content[1].image_url.url,image);assert.equal(content[3].image_url.url,reference);
 assert.match(request.messages[0].content,/similarities and differences/);assert.match(request.messages[0].content,/never claim proven identity/);assert.match(request.messages[0].content,/accessories, not anatomical ears/);
 assert.equal(v.visionRequest('Describe',image).messages[1].content.length,2);
 assert.throws(()=>v.visionRequest('Describe',image,'https://example.com/avatar.png'),/prepared/);
});

test('avatar reference composites only neutral layers in order and cancels before drawing',async()=>{
 const layers=[{slot:'static',url:'body'},{slot:'mouth',variant:'mouth_neutral',url:'rest'},{slot:'mouth',variant:'mouth_a',url:'speaking'},{slot:'eyes',variant:'eye_neutral',url:'open'},{slot:'eyes',variant:'eye_closed',url:'blink'},{slot:'static',url:'hair'}];
 const drawn=[];const canvas={width:0,height:0,getContext:()=>({fillRect(){},drawImage(image){drawn.push(image.source);}}),toDataURL:()=> 'data:image/jpeg;base64,/9j/AA=='};
 class ImageMock{naturalWidth=1000;naturalHeight=2000;set src(value){this.source=value;this.onload();}}
 const reference=loader({'./avatar':{buildLayers:()=>layers,EMOTION_MAP:{neutral:{eyes:'eye_neutral',mouth:'mouth_neutral'}}}},{Image:ImageMock,document:{createElement:()=>canvas}})('src/core/avatarReference.ts');
 const signal=new AbortController();await reference.prepareAvatarReference({}, {},signal.signal);assert.deepEqual(drawn,['body','rest','open','hair']);assert.equal(canvas.width,320);assert.equal(canvas.height,640);
 await reference.prepareAvatarReference({}, {},signal.signal,1024);assert.equal(canvas.width,512);assert.equal(canvas.height,1024);
 signal.abort();drawn.length=0;await assert.rejects(reference.prepareAvatarReference({}, {},signal.signal),/Stopped/);assert.equal(drawn.length,0);
});


test('avatar comparison requires complete evidence sections and takes priority over brief chat style',()=>{
 const load=loader({'./persistence':{}}),v=load('src/core/vision.ts');
 assert.throws(()=>v.validateComparisonReport('A character holding a book.'),/complete avatar comparison/);
 const report='Attachment: Silver hair, headset, no glasses.\nAvatar reference: Silver hair, headset and glasses.\nSimilarities: Hair and headset.\nDifferences: Glasses only on reference.\nResemblance: Similar, identity unconfirmed.';
 v.validateComparisonReport(report);assert.throws(()=>v.validateComparisonReport(report.replace('Differences: Glasses only on reference.','')),/complete/);
 const messages=load('src/core/llm.ts').buildPayload('Mana',[{id:'u',role:'user',content:'Who is this?',imageReport:{filename:'x.jpg',description:v.AVATAR_COMPARISON_MARKER+'\n'+report}}],24,'Mana','','Be brief.');
 assert.ok(messages[1].content.endsWith(v.AVATAR_REPLY_FOCUS));assert.match(messages[1].content,/Never identify the attached character as Aishi/);assert.match(messages[1].content,/Glasses only on reference/);
 const plain=load('src/core/llm.ts').buildPayload('Mana',[{id:'u',role:'user',content:'Describe',imageReport:{filename:'x.jpg',description:'A book.'}}]);assert.ok(!plain[1].content.includes(v.AVATAR_REPLY_FOCUS));
});


test('dictation preserves current draft and validates transcript and installed languages',()=>{
 const d=loader()('src/core/dictation.ts');assert.equal(d.reviewedDraft('Typed while listening',' recognized phrase '),'Typed while listening recognized phrase');assert.equal(d.reviewedDraft('Line\n','Hello'),'Line\nHello');assert.equal(d.reviewedDraft('','Hello'),'Hello');assert.throws(()=>d.reviewedDraft('keep',' '),/No usable/);assert.throws(()=>d.reviewedDraft('keep',{}),/invalid/);assert.throws(()=>d.reviewedDraft('keep','a'.repeat(10001)),/shorter/);
 const list=d.recognitionLanguages([{id:'engine',name:'Windows',language:'en-US'},{id:'',name:'x',language:'en'},null,{id:'x',name:4}]);assert.equal(list.length,1);assert.equal(list[0].id,'engine');assert.equal(d.recognitionLanguages({}).length,0);
});


test('dictation cancellation during launch stops the helper and discards late transcription',async()=>{
 let resolveLaunch;const launch=new Promise(resolve=>resolveLaunch=resolve),calls=[],texts=[],effects=[];let state=0;
 const hook=loader({'react':{useRef:value=>({current:value}),useEffect:effect=>effects.push(effect),useState:value=>{const initial=state++===1?[{id:'engine',name:'Windows',language:'en-US'}]:state===3?'engine':value;return [initial,()=>{}];}},'@tauri-apps/api/core':{invoke:async(name)=>{calls.push(name);if(name==='dictation_start')return launch;if(name==='dictation_languages')return [];if(name==='dictation_poll')return {done:true,text:'should not appear'};}}},{setTimeout,clearTimeout})('src/core/useDictation.ts');
 const d=hook.useDictation(text=>texts.push(text));const cleanup=effects[0]();const starting=d.start();await d.stop();resolveLaunch();await starting;assert.ok(calls.filter(c=>c==='dictation_stop').length>=2);assert.equal(calls.includes('dictation_poll'),false);assert.equal(texts.length,0);cleanup();
});


test('dictation review preserves recognized words without forced replacements and bounds alternatives',()=>{
 const d=loader()('src/core/dictation.ts');const review=d.dictationReview({text:'Mantle',confidence:0.2,alternatives:['Mana','Mana','Mantle',null,'Hello']});assert.equal(review.text,'Mantle');assert.equal(review.confidence,0.2);assert.equal(review.alternatives.join(','),'Mana,Hello');assert.equal(d.dictationReview({text:'Pedal',confidence:2}).confidence,null);assert.throws(()=>d.dictationReview({text:''}),/No usable/);
});


test('Whisper WAV encoder downsamples microphone audio, clips safely and refuses silence',()=>{
 const w=loader({'./persistence':{}})('src/core/whisper.ts');const samples=new Float32Array(48000).fill(0.5);const audio=w.encodeWave(samples,48000),bytes=Uint8Array.from(audio),view=new DataView(bytes.buffer);assert.equal(audio.length,32044);assert.equal(view.getUint32(24,true),16000);assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint16(34,true),16);assert.equal(view.getInt16(44,true),16384);
 assert.throws(()=>w.encodeWave(new Float32Array(16000),16000),/too quiet/);assert.throws(()=>w.encodeWave(new Float32Array(16000*16).fill(0.1),16000),/15 seconds/);assert.throws(()=>w.encodeWave(new Float32Array(100),16000),/too short/);assert.throws(()=>w.encodeWave(samples,NaN),/15 seconds/);
 const clipped=w.encodeWave(new Float32Array(16000).fill(2),16000);assert.equal(new DataView(Uint8Array.from(clipped).buffer).getInt16(44,true),32767);
});

test('Whisper setup roundtrips through backups and old backups gain default paths without audio',()=>{
 const values=new Map(),load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}}),w=load('src/core/whisper.ts'),backup=load('src/core/backup.ts');w.saveWhisper({exePath:'C:/whisper/whisper-cli.exe',modelPath:'C:/models/small.en.bin'});assert.equal(w.loadWhisper().modelPath,'C:/models/small.en.bin');const b=backup.snapshotBackup();assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.whisper.v1'].exePath,'C:/whisper/whisper-cli.exe');delete b.data['mana.whisper.v1'];assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.whisper.v1'].modelPath,w.DEFAULT_WHISPER.modelPath);b.data['mana.whisper.v1']={...w.DEFAULT_WHISPER,audio:[1,2]};assert.throws(()=>backup.validateBackup(JSON.stringify(b)),/mana.whisper/);
});


test('Whisper cancellation while permission is pending closes a late microphone stream',async()=>{
 let resolvePermission,permissionStarted,stopped=0;const permissionReady=new Promise(resolve=>permissionStarted=resolve);const permission=new Promise(resolve=>resolvePermission=resolve),calls=[],effects=[];
 const load=loader({'react':{useState:v=>[typeof v==='function'?v():v,()=>{}],useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)},'./persistence':{readStored:()=>null,writeStored:()=>{}},'@tauri-apps/api/core':{invoke:async name=>{calls.push(name);}}},{navigator:{mediaDevices:{getUserMedia:()=>{permissionStarted();return permission;}}},setTimeout,clearTimeout,AudioContext:class{constructor(){assert.fail('cancelled recording must not create context');}}});
 const w=load('src/core/useWhisper.ts').useWhisper(()=>assert.fail('cancelled text must not reach review'),['Mana']);const cleanups=effects.map(effect=>effect()).filter(cleanup=>typeof cleanup==='function');const cleanup=()=>cleanups.forEach(fn=>fn());const pending=w.start();await permissionReady;await w.cancel();resolvePermission({getTracks:()=>[{stop(){stopped++;}}]});await pending;assert.equal(stopped,1);assert.ok(!calls.includes('whisper_start'));cleanup();
});


test('microphone display level handles silence, invalid samples and clipping',()=>{
 const w=loader({'./persistence':{}})('src/core/whisper.ts');assert.equal(w.microphoneLevel(new Float32Array()),0);assert.equal(w.microphoneLevel(new Float32Array([0,0])),0);assert.equal(w.microphoneLevel(new Float32Array([NaN,Infinity])),0);assert.equal(w.microphoneLevel(new Float32Array([2,-2])),1);assert.ok(w.microphoneLevel(new Float32Array([0.1,-0.1]))>w.microphoneLevel(new Float32Array([0.01,-0.01])));
});


test('hands-free endpoint waits for sustained voice and a pause, ignoring a short noise burst',()=>{
 const {SpeechEndpoint}=loader()('src/core/handsFree.ts');const detector=new SpeechEndpoint();detector.step(0,500);detector.step(0,200);assert.equal(detector.step(0.1,100),'wait');for(let i=0;i<4;i++)assert.equal(detector.step(0,300),'wait');assert.equal(detector.step(0.03,300),'wait');assert.equal(detector.step(0,500),'wait');assert.equal(detector.step(0,500),'wait');assert.equal(detector.step(0,200),'finish');
 const silent=new SpeechEndpoint();let result;for(let i=0;i<16;i++)result=silent.step(0,500);assert.equal(result,'silence');
 const ongoing=new SpeechEndpoint();ongoing.step(0,500);ongoing.step(0,200);for(let i=0;i<10;i++)assert.equal(ongoing.step(0.03,500),'wait');assert.equal(ongoing.step(0,500),'wait');assert.equal(ongoing.step(0.03,300),'wait');assert.equal(ongoing.step(0,500),'wait');
});


test('hands-free rejects sound captions and steady fan noise while allowing voice above background',()=>{
 const h=loader()('src/core/handsFree.ts');for(const text of ['[Music]','[XBOX SOUND]','(background noise)','♪♫','[Music] [Noise]'])assert.equal(h.hasSpokenWords(text),false);assert.equal(h.hasSpokenWords('Hello Mana'),true);assert.equal(h.hasSpokenWords('I like music [Music]'),true);
 const fan=new h.SpeechEndpoint();let decision;for(let i=0;i<16;i++)decision=fan.step(0.025,500);assert.equal(decision,'silence');const voice=new h.SpeechEndpoint();voice.step(0.02,500);voice.step(0.02,200);assert.equal(voice.step(0.08,300),'wait');voice.step(0.02,500);voice.step(0.02,500);assert.equal(voice.step(0.02,200),'finish');
});


test('custom voice setup survives backup and older backups get local defaults',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});const voice=load('src/core/customVoice.ts'),backup=load('src/core/backup.ts');
 voice.saveCustomVoice({...voice.DEFAULT_CUSTOM,referencePath:'C:/voice.wav',referenceText:'Exact reference text.',port:9883});const b=backup.snapshotBackup();assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.custom_voice.v1'].port,9883);assert.equal(voice.loadCustomVoice().referenceText,'Exact reference text.');delete b.data['mana.custom_voice.v1'];assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.custom_voice.v1'].port,9882);b.data['mana.custom_voice.v1']={...voice.DEFAULT_CUSTOM,audio:[1]};assert.throws(()=>backup.validateBackup(JSON.stringify(b)),/mana.custom_voice/);assert.equal(voice.validateCustomVoice({port:80}).port,9882);
});

test('voice presets keep matching transcripts and preserve the default through persistence and legacy backups',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});const voice=load('src/core/customVoice.ts'),backup=load('src/core/backup.ts');
 const config=voice.validateCustomVoice({...voice.DEFAULT_CUSTOM,referencePath:'C:/my-default.wav',referenceText:'My own transcript.',preset:'gentle'});
 voice.saveCustomVoice(config);assert.equal(voice.voiceReference(voice.loadCustomVoice()).path,config.references.gentle.path);assert.equal(voice.voiceReference({...config,preset:'default'}).text,'My own transcript.');
 const b=backup.snapshotBackup();const legacy={...config};for(const key of ['preset','references','referenceLanguage','replyLanguage'])delete legacy[key];b.data['mana.custom_voice.v1']=legacy;
 const restored=backup.validateBackup(JSON.stringify(b)).data['mana.custom_voice.v1'];assert.equal(restored.referencePath,'C:/my-default.wav');assert.equal(restored.referenceText,'My own transcript.');assert.equal(restored.referenceLanguage,'en');assert.equal(restored.replyLanguage,'en');assert.equal(restored.preset,'automatic');
 b.data['mana.custom_voice.v1']={...restored,replyLanguage:'invalid'};assert.throws(()=>backup.validateBackup(JSON.stringify(b)),/mana.custom_voice/);
 b.data['mana.custom_voice.v1']={...restored,references:{...restored.references,gentle:{...restored.references.gentle,extra:'invalid'}}};assert.throws(()=>backup.validateBackup(JSON.stringify(b)),/mana.custom_voice/);
 const changed=voice.validateCustomVoice(null);changed.references.gentle.text='changed';assert.notEqual(voice.validateCustomVoice(null).references.gentle.text,'changed');
 const main=voice.validateCustomVoice({...voice.DEFAULT_CUSTOM,preset:'default',referenceText:voice.CONFIRMED_REFERENCE_TEXT,referenceLanguage:'ja'});assert.equal(main.referenceLanguage,'en');assert.equal(main.referenceText,voice.CONFIRMED_REFERENCE_TEXT);assert.match(main.referenceText,/Chiimu purei/);
 assert.equal(voice.validateCustomVoice({...main,preset:'cheerful',referenceLanguage:'ja'}).referenceLanguage,'en');
 const japanese={...main,preset:'cheerful',referenceLanguage:'ja',references:{...main.references,cheerful:{...main.references.cheerful,text:'レベルアップおめでとう。やったね！レアアイテムだ！わかったよ。了解だよ。これでおしまい。お疲れ様。'}}};const romanized=voice.validateCustomVoice(japanese);assert.match(romanized.references.cheerful.text,/Reberu appu/);assert.equal(romanized.referenceLanguage,'en');assert.match(japanese.references.cheerful.text,/レベル/);
 const edited=voice.validateCustomVoice({...japanese,references:{...japanese.references,cheerful:{path:'C:/custom.wav',text:'My edited transcript.'}}});assert.equal(edited.references.cheerful.text,'My edited transcript.');assert.equal(edited.referenceLanguage,'ja');
});

test('legacy Mana reference and speech-only name pronunciation preserve chat and migrate older preset backups',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});const voice=load('src/core/customVoice.ts'),backup=load('src/core/backup.ts');
 const config=voice.validateCustomVoice({...voice.DEFAULT_CUSTOM,preset:'legacy'});voice.saveCustomVoice(config);assert.match(voice.voiceReference(voice.loadCustomVoice()).path,/mana-legacy.wav/);
 const chat='Hello Aishi! Aishiko is another name.';assert.equal(voice.customSpeechText(chat,config),'Hello Eye-shee! Aishiko is another name.');assert.equal(chat,'Hello Aishi! Aishiko is another name.');assert.equal(voice.customSpeechText(chat,{...config,preset:'default'}),chat);assert.equal(voice.customSpeechText(chat,{...config,replyLanguage:'ja'}),chat);
 const b=backup.snapshotBackup();delete b.data['mana.custom_voice.v1'].references.legacy;const restored=backup.validateBackup(JSON.stringify(b));assert.match(restored.data['mana.custom_voice.v1'].references.legacy.path,/mana-legacy.wav/);
 assert.equal(voice.customSpeechRate(0,{...config,legacyDelivery:'cheerful'}),2);assert.equal(voice.customSpeechRate(9,{...config,legacyDelivery:'cheerful'}),10);assert.equal(voice.customSpeechRate(0,{...config,legacyDelivery:'gentle'}),0);assert.equal(voice.customSpeechRate(0,{...config,preset:'default',legacyDelivery:'cheerful'}),0);
 delete b.data['mana.custom_voice.v1'].legacyDelivery;assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.custom_voice.v1'].legacyDelivery,'neutral');
});

test('automatic Mana references follow reply emotion without mutating the saved reference or chat',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});const voice=load('src/core/customVoice.ts'),backup=load('src/core/backup.ts'),speech=load('src/core/speechPreferences.ts');const config=voice.validateCustomVoice(null);
 for(const [emotion,tone] of [['happy','cheerful'],['excited','cheerful'],['worried','worried'],['sad','sad'],['angry','angry'],['sleepy','gentle'],['thinking','default'],['unexpected','default']])assert.equal(voice.voiceReference(config,emotion).path,config.automaticReferences[tone].path);
 assert.equal(config.preset,'automatic');assert.equal(voice.customSpeechRate(0,config),0);voice.saveCustomVoice(config);assert.equal(voice.loadCustomVoice().preset,'automatic');const b=backup.snapshotBackup();assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.custom_voice.v1'].automaticReferences.sad.text,config.automaticReferences.sad.text);
 const m={id:'emotion-new',role:'assistant',content:'I am glad! [excited]'};const tracker=new speech.AutomaticSpeech([]);assert.equal(tracker.next([m],false,true,true,'Mana'),'I am glad!');assert.equal(tracker.emotion,'excited');assert.equal(m.content,'I am glad! [excited]');assert.equal(load('src/core/emotion.ts').cleanReply('Please stop. [angry]').emotion,'angry');
});

test('approved cheerful replacement migrates the matching reference and preserves custom edits',()=>{
 const voice=loader({'./persistence':{}})('src/core/customVoice.ts');const old={path:'C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/cheerful.wav',text:"Oh my gosh, look! It's finally happening! No way, we actually did it! Woohoo, yes!"};const config={...voice.DEFAULT_CUSTOM,automaticReferences:{...voice.DEFAULT_CUSTOM.automaticReferences,cheerful:old}};
 const updated=voice.validateCustomVoice(config);assert.match(updated.automaticReferences.cheerful.path,/cheerful-r2.wav/);assert.match(updated.automaticReferences.cheerful.text,/Fast! Fast! Fast!/);assert.equal(config.automaticReferences.cheerful.path,old.path);
 const edited=voice.validateCustomVoice({...config,automaticReferences:{...config.automaticReferences,cheerful:{...old,text:'User-edited transcript.'}}});assert.equal(edited.automaticReferences.cheerful.text,'User-edited transcript.');assert.equal(edited.automaticReferences.cheerful.path,old.path);
});

test('approved Default 2 replaces the matching automatic fallback and preserves custom references',()=>{
 const voice=loader({'./persistence':{}})('src/core/customVoice.ts');const old={path:'C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/default.wav',text:'Once upon a time, in a faraway kingdom, a brave knight set out on a quest to rescue the lost princess.'};const config={...voice.DEFAULT_CUSTOM,automaticReferences:{...voice.DEFAULT_CUSTOM.automaticReferences,default:old}};
 const updated=voice.validateCustomVoice(config);assert.match(voice.voiceReference(updated,'neutral').path,/default-r2.wav/);assert.match(voice.voiceReference(updated,'thinking').text,/heavy bag/);assert.equal(updated.automaticReferences.gentle.path,config.automaticReferences.gentle.path);assert.equal(config.automaticReferences.default.path,old.path);
 const edited=voice.validateCustomVoice({...config,automaticReferences:{...config.automaticReferences,default:{...old,text:'My custom transcript.'}}});assert.equal(edited.automaticReferences.default.text,'My custom transcript.');assert.equal(edited.automaticReferences.default.path,old.path);
});

test('musical initiative respects idle quiet-hours pause mute and persistent cooldown without rerolling each tick',()=>{
 const music=loader()('src/core/musicalMoments.ts');const now=new Date('2026-10-11T04:00:00Z');const state={...music.validateMusicalState(null),enabled:true};const context={visible:true,idle:true,ready:true,muted:false,energy:70,timeZone:'Asia/Singapore',openedAt:now.getTime()-600000,lastActivityAt:now.getTime()-600000,pendingInitiative:false};
 assert.equal(music.musicDue(state,now,context),true);for(const change of [{visible:false},{idle:false},{ready:false},{muted:true},{energy:10},{pendingInitiative:true},{pausedUntil:new Date(now.getTime()+60000).toISOString()},{lastInitiativeAt:now.toISOString()},{lastActivityAt:now.getTime()}])assert.equal(music.musicDue(state,now,{...context,...change}),false);
 assert.equal(music.musicDue(state,new Date('2026-10-11T15:00:00Z'),context),false);const planned=music.planMusicAttempt(state,'soft-hum',now,()=>.5);assert.equal(Date.parse(planned.nextAttemptAt)-now.getTime(),90*60000);assert.equal(music.musicDue(planned,now,context),false);assert.equal(music.musicDue(planned,new Date(now.getTime()+90*60000),context),true);assert.equal(music.chooseMusic(state,'worried'),'soft-hum');assert.equal(music.chooseMusic(state,'happy'),'bright-hum');assert.equal(music.chooseMusic(state,'neutral','song'),'cover-excerpt');assert.equal(music.requestedMusic('Please hum for me!'),'hum');assert.equal(music.requestedMusic('sing a short song'),'song');assert.equal(music.requestedMusic('sing a specific copyrighted song'),null);
});

test('musical settings roundtrip and old initiative backups restore with music disabled',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}});const initiative=load('src/core/initiative.ts'),backup=load('src/core/backup.ts');const state=initiative.validateInitiative(null);state.music.enabled=true;state.music.cooldownMinutes=45;initiative.saveInitiative(state);const b=backup.snapshotBackup();assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.initiative.v1'].music.cooldownMinutes,45);delete b.data['mana.initiative.v1'].music;assert.equal(backup.validateBackup(JSON.stringify(b)).data['mana.initiative.v1'].music.enabled,false);
});

test('Stop cancels a musical load and prevents late audio playback',async()=>{
 let finish;const waiting=new Promise(r=>finish=r);let count=0,decode=0;const load=loader({'react':{useRef:v=>({current:v}),useEffect(){},useState:v=>{count++;return[count===1?['Zira']:count===2?{voice:'Zira',rate:0,volume:100,automatic:false}:typeof v==='function'?v():v,()=>{}];}},'./persistence':{readStored:()=>null,writeStored(){}},'@tauri-apps/api/event':{listen:async()=>()=>{}},'@tauri-apps/api/core':{invoke:async name=>name==='singing_audio'?waiting:undefined}},{window:{__TAURI_INTERNALS__:{}},AudioContext:class{constructor(){decode++;}},setTimeout,clearTimeout,setInterval,clearInterval,crypto:require('node:crypto').webcrypto})('src/core/useSpeech.ts');const speech=load.useSpeech();const playing=speech.playMusic('clip.wav');await speech.stop();finish(new ArrayBuffer(44));assert.equal(await playing,false);assert.equal(decode,0);
});

test('custom audio refuses non-WAV and oversize responses and rests during silence',()=>{
 const voice=loader({'./persistence':{}},{atob:global.atob})('src/core/customVoice.ts');assert.throws(()=>voice.waveBytes(Buffer.from('not audio').toString('base64')),/WAV/);assert.throws(()=>voice.waveBytes('A'.repeat(16000001)),/too large/);const bytes=Buffer.alloc(44);bytes.write('RIFF');bytes.write('WAVE',8);assert.equal(voice.waveBytes(bytes.toString('base64')).length,44);assert.equal(voice.audioMouth(new Float32Array(48000),0,48000,'hello',1),null);assert.equal(voice.audioMouth(new Float32Array(48000).fill(0.1),0,48000,'hello',1),'e');assert.equal(voice.audioMouth(new Float32Array(48000).fill(0.1),2,48000,'hello',1),null);
});

test('stopping a custom voice launch suppresses its late result and stops the owned request',async()=>{
 let resolveLaunch;const launch=new Promise(r=>resolveLaunch=r),calls=[],effects=[];let count=0;const load=loader({'react':{useRef:v=>({current:v}),useEffect:e=>effects.push(e),useState:v=>{count++;return[count===1?['Mana · GPT-SoVITS']:count===2?{voice:'Mana · GPT-SoVITS',rate:0,volume:100,automatic:false}:typeof v==='function'?v():v,()=>{}];}},'./persistence':{readStored:()=>null,writeStored(){}},'@tauri-apps/api/event':{listen:async()=>()=>{}},'@tauri-apps/api/core':{invoke:async(name)=>{calls.push(name);if(name==='custom_voice_generate')return launch;if(name==='speech_voices')return [];}}},{window:{__TAURI_INTERNALS__:{}},setTimeout,clearTimeout,setInterval,clearInterval,crypto:require('node:crypto').webcrypto})('src/core/useSpeech.ts');const speech=load.useSpeech();const starting=speech.speak('Hello');await speech.stop();resolveLaunch();assert.equal(await starting,false);assert.ok(calls.filter(c=>c==='custom_voice_stop').length>=2);assert.ok(!calls.includes('custom_voice_poll'));
});

test('studio mixing mutes individual stems, preserves duration and prevents clipping',()=>{
 const {mixWave}=loader()('src/core/studioMix.ts');
 const buffer=values=>({sampleRate:8,length:values.length,duration:values.length/8,numberOfChannels:1,getChannelData:()=>values});
 const v=buffer([.8,-.8,0,0]),b=buffer([.8,.8,.4,-.4]);
 const read=(vg,bg)=>new DataView(mixWave(v,b,vg,bg));
 assert.equal(read(1,0).getInt16(44,true),Math.round(.8*32767));assert.equal(read(0,1).getInt16(48,true),Math.round(.8*32767));
 const both=read(1,1);assert.equal(both.getInt16(44,true),32767);assert.equal(both.getInt16(48,true),0);assert.equal(both.getUint32(40,true),16);
 assert.throws(()=>mixWave(v,{...b,sampleRate:16},1,1),/aligned/);assert.throws(()=>mixWave(v,b,2,1),/gains/);
});

test('instrument review mixes mute stems and persist only safe estimated-part metadata',()=>{
 const load=loader(),mix=load('src/core/studioMix.ts'),studio=load('src/core/musicStudio.ts');
 const audio=values=>({sampleRate:8,length:values.length,duration:values.length/8,numberOfChannels:1,getChannelData:()=>values});
 const bytes=mix.mixStems([{audio:audio([.2,.2]),gain:1},{audio:audio([.5,.5]),gain:0},{audio:audio([.1,.1]),gain:.5}]);
 assert.equal(new DataView(bytes).getInt16(44,true),Math.round(.25*32767));
 const project={id:'studio-stems',title:'Parts',createdAt:'2026-10-12T00:00:00Z',status:'ready',stems:[{name:'guitar',path:'C:/AI/ManaAI-CV-2/exports/singing/guitar.wav',gain:.5,muted:true},{name:'piano',path:'C:/outside.wav'},{name:'invented',path:'C:/AI/ManaAI-CV-2/exports/singing/x.wav'}]};
 const valid=studio.validateStudio({projects:[project]}).projects[0];assert.equal(valid.stems.length,1);assert.equal(valid.stems[0].gain,.5);assert.equal(valid.stems[0].muted,true);
 assert.equal(studio.validateStudio(JSON.parse(JSON.stringify({projects:[valid]}))).projects[0].stems[0].path,valid.stems[0].path);
});


test('replacement instrument metadata preserves piano beside guitar-to-piano and electric guitar across backups',()=>{
 const studio=loader()('src/core/musicStudio.ts');
 const project={id:'studio-replacements',title:'Replacement mix',createdAt:'2026-10-12T00:00:00Z',status:'ready',stems:['piano','replacement-piano','electric-guitar','electric-guitar-distorted','guitar-bright-room','sax'].map(name=>({name,path:'C:/AI/ManaAI-CV-2/exports/singing/'+name+'.wav',gain:.7,muted:false}))};
 const first=studio.validateStudio({projects:[project]});
 const restored=studio.validateStudio(JSON.parse(JSON.stringify(first))).projects[0];
 assert.deepEqual(restored.stems.map(part=>part.name),['piano','replacement-piano','electric-guitar','electric-guitar-distorted','guitar-bright-room','sax']);
 assert.ok(restored.stems.every(part=>part.gain===.7&&!part.muted));
});


test('finer extracted parts survive backups with remainder, levels and safe paths',()=>{
 const studio=loader()('src/core/musicStudio.ts');
 const names=['guitar','piano','bass','drums','strings-estimate','winds-estimate','other'];
 const project={id:'studio-finer-parts',title:'Finer parts',createdAt:'2026-10-12T00:00:00Z',status:'ready',stems:names.map(name=>({name,path:'C:/AI/ManaAI-CV-2/exports/singing/'+name+'.wav',gain:name==='winds-estimate'?.4:1,muted:name==='strings-estimate'}))};
 const state=studio.validateStudio(JSON.parse(JSON.stringify(studio.validateStudio({projects:[project]}))));
 assert.deepEqual(state.projects[0].stems.map(p=>p.name),names);
 assert.equal(state.projects[0].stems.find(p=>p.name==='winds-estimate').gain,.4);
 assert.equal(state.projects[0].stems.find(p=>p.name==='strings-estimate').muted,true);
 project.stems[4].path='C:/outside.wav';assert.equal(studio.validateStudio({projects:[project]}).projects[0].stems.length,6);
});


test('optional sax and Banquet piano estimates retain labels, muted state and levels in backups',()=>{
 const {validateStudio}=loader()('src/core/musicStudio.ts');
 const names=['sax-extracted','piano-banquet','keyboard-extracted','electric-piano-extracted','trumpet-extracted','other'];
 const result=validateStudio({projects:[{id:'studio-optional-extraction',title:'Optional parts',createdAt:'2026-10-12T00:00:00Z',status:'ready',stems:names.map(name=>({name,path:'C:/AI/ManaAI-CV-2/exports/singing/'+name+'.wav',gain:.6,muted:name==='sax-extracted'}))}]});
 assert.deepEqual(result.projects[0].stems.map(p=>p.name),names);
 assert.equal(result.projects[0].stems[0].muted,true);
 assert.equal(result.projects[0].stems[1].gain,.6);
});


test('original song briefs validate limits and preserve prompts and seed through studio backups',()=>{
 const original=loader()('src/core/originalSong.ts');const studio=loader()('src/core/musicStudio.ts');
 const brief={prompt:'Cozy piano',lyrics:'[Verse]\nA little light',style:'gentle-piano',instrumental:false,duration:90,seed:42};
 assert.deepEqual(JSON.parse(JSON.stringify(original.validateOriginalBrief(brief))),brief);
 for(const change of [{duration:Infinity},{duration:181},{seed:-1},{seed:1.2},{prompt:' '},{style:'unknown'}])assert.equal(original.validateOriginalBrief({...brief,...change}),undefined);
 assert.equal(original.originalFingerprint(brief),original.originalFingerprint({...brief,duration:120}));
 assert.notEqual(original.originalFingerprint(brief),original.originalFingerprint({...brief,seed:43}));
 const project={id:'studio-original-check',title:'Original',createdAt:'2026-10-13T00:00:00Z',kind:'original',original:brief,mix:'C:/AI/ManaAI-CV-2/exports/singing/original-song.wav',generatedLyrics:'A little light'};
 const restored=studio.validateStudio(JSON.parse(JSON.stringify(studio.validateStudio({projects:[project]})))).projects[0];
 assert.equal(restored.kind,'original');assert.deepEqual(JSON.parse(JSON.stringify(restored.original)),brief);assert.equal(restored.generatedLyrics,'A little light');assert.equal(restored.vocal,'');
});

test('cover backups retain lead-only extraction and reference while old covers keep Demucs metadata',()=>{
 const studio=loader()('src/core/musicStudio.ts');
 const project={id:'studio-lead-check',title:'Lead cover',createdAt:'2026-10-13T00:00:00Z',settings:{extractor:'mega-lead',reference:studio.SINGING_REFERENCE,separate:true}};
 const restored=studio.validateStudio(JSON.parse(JSON.stringify(studio.validateStudio({projects:[project]})))).projects[0];
 assert.equal(restored.settings.extractor,'mega-lead');assert.equal(restored.settings.reference,studio.SINGING_REFERENCE);
 delete project.settings.extractor;
 assert.equal(studio.validateStudio({projects:[project]}).projects[0].settings.extractor,'demucs');
 project.settings.extractor='unknown';
 assert.equal(studio.validateStudio({projects:[project]}).projects[0].settings.extractor,'demucs');
});

test('builder timeline aligns unequal tracks with delay, trim, mute and shared peak reduction',()=>{
 const {mixTimeline}=loader()('src/core/studioMix.ts');
 const audio=a=>({sampleRate:8,length:a.length,duration:a.length/8,numberOfChannels:1,getChannelData:()=>a});
 const v=audio([.2,.4,.6]),b=audio([.5,.5]);
 let wav=new DataView(mixTimeline([{audio:v,gain:1,offset:0},{audio:b,gain:1,offset:.25}]));
 assert.equal(wav.getUint32(40,true),16);assert.equal(wav.getInt16(44,true),Math.round(.2/1.1*32767));assert.equal(wav.getInt16(52,true),32767);
 wav=new DataView(mixTimeline([{audio:v,gain:1,offset:-.125},{audio:b,gain:0,offset:0}]));
 assert.equal(wav.getInt16(44,true),Math.round(.4*32767));assert.equal(wav.getInt16(48,true),Math.round(.6*32767));
 assert.deepEqual(v.getChannelData(0),[.2,.4,.6]);
 for(const change of [{offset:NaN},{offset:3601},{gain:2}])assert.throws(()=>mixTimeline([{audio:v,gain:1,offset:0,...change}]));
 assert.throws(()=>mixTimeline([{audio:v,gain:1,offset:-1}]),/contain audio/);
});

test('builder tracks roundtrip through studio backups without unsafe files or duplicate vocals',()=>{
 const studio=loader()('src/core/musicStudio.ts');
 const t={id:'track-guide',name:'Guide',role:'vocal',path:'C:/AI/ManaAI-CV-2/exports/singing/mana.wav',originalPath:'C:/AI/ManaAI-CV-2/exports/singing/guide.wav',gain:.7,muted:false,offset:-.25,seconds:100,converted:true};
 const project={id:'studio-builder-test',kind:'builder',title:'Builder',createdAt:'2026-10-14T00:00:00Z',builderTracks:[t,{...t,id:'track-piano',role:'piano',offset:1.5,replacement:'sax'},{...t,id:'track-another-vocal'},{...t,id:'track-unsafe',role:'other',path:'C:/private.wav'}]};
 const restored=studio.validateStudio(JSON.parse(JSON.stringify(studio.validateStudio({projects:[project]})))).projects[0];
 assert.equal(restored.kind,'builder');assert.equal(restored.builderTracks.length,2);assert.equal(restored.builderTracks[0].offset,-.25);assert.equal(restored.builderTracks[1].replacement,'sax');assert.equal(restored.builderTracks[1].offset,1.5);assert.equal(restored.builderTracks[0].originalPath,t.originalPath);
 assert.equal(studio.validateStudio({projects:[{...project,builderTracks:undefined}]}).projects[0].builderTracks.length,0);
});

test('lyrics validate timestamps, follow playback gaps and roundtrip editable LRC through backups',()=>{
 const load=loader({'./persistence':{readStored:()=>null,writeStored:()=>{}}}),lyrics=load('src/core/lyrics.ts');
 const lines=lyrics.validateLyrics([{start:1,end:3,text:' Hello '},{start:5,end:7,text:'World'},{start:-1,end:2,text:'bad'},{start:8,end:7,text:'bad'}]);
 assert.equal(lines.length,2);assert.equal(lines[0].text,'Hello');assert.equal(lyrics.activeLyric(lines,1),0);assert.equal(lyrics.activeLyric(lines,3),-1);assert.equal(lyrics.activeLyric(lines,5),1);const excerpt=lyrics.excerptLyrics(lines,2,4);assert.equal(excerpt[0].start,0);assert.equal(excerpt[0].end,1);assert.equal(excerpt[1].start,3);assert.equal(excerpt[1].end,4);
 const round=lyrics.parseLrc(lyrics.lyricsToLrc(lines),10);assert.equal(round[0].start,1);assert.equal(round[1].end,10);
 assert.throws(()=>lyrics.parseLrc('[00:61]bad',10));assert.throws(()=>lyrics.parseLrc('[00:11]bad',10));assert.throws(()=>lyrics.parseLrc('[00:01]a\n[00:01]b',10));assert.throws(()=>lyrics.parseLrc('untimed text',10));assert.equal(lyrics.parseLrc('',10).length,0);
 const studio=load('src/core/musicStudio.ts'),backup=load('src/core/backup.ts'),initiative=load('src/core/initiative.ts');
 const state=initiative.validateInitiative(null);state.studio=studio.validateStudio({projects:[{id:'studio-karaoke',title:'Song',createdAt:'2026-10-14T00:00:00Z',status:'ready',seconds:10,lyrics:lines}]});
 const snapshot=backup.snapshotBackup();snapshot.data['mana.initiative.v1']=state;
 const valid=backup.validateBackup(JSON.stringify(snapshot));assert.equal(valid.data['mana.initiative.v1'].studio.projects[0].lyrics[1].text,'World');delete snapshot.data['mana.initiative.v1'].studio.projects[0].lyrics;assert.equal(backup.validateBackup(JSON.stringify(snapshot)).data['mana.initiative.v1'].studio.projects[0].lyrics,undefined);
});
test('builder retains multiple backing vocals separately from the unique lead',()=>{
 const core=loader()('src/core/coverBuilder.ts');const t={name:'Harmony',role:'backing-vocal',path:'C:/AI/ManaAI-CV-2/exports/singing/harmony.wav',originalPath:'C:/AI/ManaAI-CV-2/exports/singing/harmony.wav',gain:.4,offset:1,seconds:10,converted:false};
 const rows=core.validateBuilderTracks([{...t,id:'track-one'},{...t,id:'track-two',converted:true},{...t,id:'track-lead',role:'vocal'},{...t,id:'track-duplicate-lead',role:'vocal'}]);assert.equal(rows.length,3);assert.equal(rows[0].role,'backing-vocal');assert.equal(rows[1].converted,true);assert.equal(rows[2].role,'vocal');
});


test('NAM guitar variants keep their distinct names and levels through library backups',()=>{
 const studio=loader()('src/core/musicStudio.ts');
 const names=['guitar-bright-room','guitar-nam-warm','guitar-nam-rhythm','guitar-nam-lead'];
 const project={id:'studio-nam-variants',title:'NAM comparison',createdAt:'2026-10-15T00:00:00Z',status:'ready',stems:names.map((name,i)=>({name,path:'C:/AI/ManaAI-CV-2/exports/singing/'+name+'.wav',gain:.2+i*.1,muted:i===1}))};
 const restored=studio.validateStudio(JSON.parse(JSON.stringify(studio.validateStudio({projects:[project]})))).projects[0];
 assert.deepEqual(restored.stems.map(p=>p.name),names);
 assert.deepEqual(restored.stems.map(p=>[p.gain,p.muted]),project.stems.map(p=>[p.gain,p.muted]));
});


test('builder custom pitch and hold settings survive backups and reject invalid values',()=>{
 const c=loader()('src/core/coverBuilder.ts');
 const track={id:'track-custom',name:'Piano',role:'piano',path:'C:/AI/ManaAI-CV-2/exports/singing/custom.wav',originalPath:'C:/AI/ManaAI-CV-2/exports/singing/original.wav',seconds:15,gain:1,offset:0,custom:{pitch:-2,extension:.45}};
 const restored=c.validateBuilderTracks(JSON.parse(JSON.stringify([track])))[0];
 assert.deepEqual(JSON.parse(JSON.stringify(restored.custom)),track.custom);
 assert.deepEqual(JSON.parse(JSON.stringify(c.defaultInstrumentCustom('guitar-bright-room'))),{pitch:2,extension:0});
 assert.deepEqual(JSON.parse(JSON.stringify(c.defaultInstrumentCustom('piano'))),{pitch:0,extension:0});
 for(const custom of [{pitch:13,extension:0},{pitch:1.5,extension:0},{pitch:0,extension:2}])assert.equal(c.validateBuilderTracks([{...track,custom}])[0].custom,undefined);
});


test('whole-song detected preview covers the entire source with contiguous bounded sections',()=>{
 const c=loader()('src/core/coverBuilder.ts');
 const parts=c.detectedPreviewSections(288,90,15,true);
 assert.equal(parts[0].start,0);
 assert.equal(parts.at(-1).start+parts.at(-1).seconds,288);
 assert.ok(parts.every(p=>p.seconds>=1&&p.seconds<=60));
 for(let i=1;i<parts.length;i++)assert.ok(Math.abs(parts[i].start-parts[i-1].start-parts[i-1].seconds)<1e-9);
 assert.deepEqual(JSON.parse(JSON.stringify(c.detectedPreviewSections(288,90,15,false))),[{start:90,seconds:15,offset:0}]);
 for(const args of [[20,15,10,false],[20,0,61,false],[20,-1,10,false],[NaN,0,15,true]])assert.throws(()=>c.detectedPreviewSections(...args));
});


test('fingered and picked bass stems preserve safe paths and mix levels across backups',()=>{
 const studio=loader()('src/core/musicStudio.ts');
 const project={id:'studio-bass-options',title:'Bass',createdAt:'2026-10-16T00:00:00Z',status:'ready',stems:['finger-bass','picked-bass'].map(name=>({name,path:'C:/AI/ManaAI-CV-2/exports/singing/'+name+'.wav',gain:.65,muted:false}))};
 const result=studio.validateStudio(JSON.parse(JSON.stringify(studio.validateStudio({projects:[project]})))).projects[0];
 assert.deepEqual(result.stems.map(s=>s.name),['finger-bass','picked-bass']);
 assert.ok(result.stems.every(s=>s.gain===.65));
});


test('explicit tenor and Weresax choices retain separate stem identities in backups',()=>{
 const studio=loader()('src/core/musicStudio.ts');
 const project={id:'studio-sax-options',title:'Sax',createdAt:'2026-10-16T00:00:00Z',status:'ready',stems:['sax-tenor','sax-weresax'].map(name=>({name,path:'C:/AI/ManaAI-CV-2/exports/singing/'+name+'.wav',gain:.7,muted:false}))};
 const result=studio.validateStudio(JSON.parse(JSON.stringify(studio.validateStudio({projects:[project]})))).projects[0];
 assert.deepEqual(result.stems.map(s=>s.name),['sax-tenor','sax-weresax']);
});

test('trumpet replacement stem survives library backup validation',()=>{
 const studio=loader()('src/core/musicStudio.ts');
 const stem={name:'trumpet',path:'C:/AI/ManaAI-CV-2/exports/singing/trumpet.wav',gain:.65,muted:false};
 const project={id:'studio-trumpet',title:'Trumpet',createdAt:'2026-10-16T00:00:00Z',status:'ready',stems:[stem]};
 const result=studio.validateStudio(JSON.parse(JSON.stringify(studio.validateStudio({projects:[project]})))).projects[0];
 assert.deepEqual(JSON.parse(JSON.stringify(result.stems)),[stem]);
});

test('vocal melody stays a separate editable instrument track in builder backups',()=>{
 const builder=loader()('src/core/coverBuilder.ts');
 const base='C:/AI/ManaAI-CV-2/exports/singing/';
 const vocal={id:'track-source',name:'Lead',role:'vocal',path:base+'lead.wav',originalPath:base+'lead.wav',gain:1,muted:true,offset:2,seconds:12,converted:false};
 const melody={...vocal,id:'track-melody',name:'Harmonica',role:'other',path:base+'harmonica.wav',originalPath:base+'harmonica.wav',muted:false,replacement:'harmonica',custom:{pitch:2,extension:.1}};
 const tracks=builder.validateBuilderTracks(JSON.parse(JSON.stringify([vocal,melody])));
 assert.equal(tracks.length,2);
 assert.equal(tracks[0].originalPath,vocal.originalPath);
 assert.equal(tracks[1].role,'other');
 assert.equal(tracks[1].offset,2);
 assert.equal(tracks[1].replacement,'harmonica');
 assert.equal(tracks[1].custom.pitch,2);
});

test('generated harmony retains quiet backing level and section offset in builder backup',()=>{
 const builder=loader()('src/core/coverBuilder.ts');
 const base='C:/AI/ManaAI-CV-2/exports/singing/';
 const tracks=builder.validateBuilderTracks([{id:'track-lead',name:'Mana',role:'vocal',path:base+'lead.wav',originalPath:base+'original.wav',gain:1,muted:false,offset:2,seconds:60,converted:true},{id:'track-harmony',name:'Third above',role:'backing-vocal',path:base+'harmony.wav',originalPath:base+'harmony.wav',gain:.25,muted:false,offset:17,seconds:10,converted:true}]);
 assert.equal(tracks.length,2);assert.equal(tracks[0].path,base+'lead.wav');
 assert.equal(tracks[1].role,'backing-vocal');assert.equal(tracks[1].gain,.25);assert.equal(tracks[1].offset,17);assert.equal(tracks[1].converted,true);
});

test('harmony blend previews crop the lead section and retain chosen relative level',()=>{
 const {mixHarmonyPreview}=loader()('src/core/studioMix.ts');
 const buffer=(samples,rate=10)=>({sampleRate:rate,length:samples.length,duration:samples.length/rate,numberOfChannels:1,getChannelData:()=>samples});
 const leadData=new Float32Array(100).fill(.8);leadData.fill(.2,30,50);
 const lead=buffer(leadData),backing=buffer(new Float32Array(20).fill(.4));
 const mix=new DataView(mixHarmonyPreview(lead,backing,3,2,1,.25));
 assert.equal(mix.getUint32(40,true),20*4);
 assert.ok(Math.abs(mix.getInt16(44,true)/32767-.3)<.0001);
 const solo=new DataView(mixHarmonyPreview(lead,backing,3,2,1,0));
 assert.ok(Math.abs(solo.getInt16(44,true)/32767-.2)<.0001);
 assert.equal(leadData[0],Math.fround(.8));assert.equal(leadData[30],Math.fround(.2));
 assert.throws(()=>mixHarmonyPreview(lead,backing,9,2,1,.25),/within/);
 assert.throws(()=>mixHarmonyPreview(lead,buffer(new Float32Array(20),20),3,2,1,.25),/aligned/);
 assert.throws(()=>mixHarmonyPreview(lead,backing,3,2,1,2),/gains/);
 const fullLead=buffer(new Float32Array(400).fill(.2));
 const fullHarmony=buffer(new Float32Array(400).fill(.4));
 const whole=new DataView(mixHarmonyPreview(fullLead,fullHarmony,0,40,1,.25));
 assert.equal(whole.getUint32(40,true),400*4);
 assert.ok(Math.abs(whole.getInt16(44,true)/32767-.3)<.0001);
});

test('backing sections keep local timing, fades and overlapping ranges without altering source',()=>{
 const load=loader(),{sectionEnvelope}=load('src/core/backingSections.ts'),{mixTimeline}=load('src/core/studioMix.ts');
 const envelope=sectionEnvelope(100,10,[{start:2,end:5},{start:4,end:7}],.2);
 assert.equal(envelope[0],0);assert.equal(envelope[20],0);assert.equal(envelope[30],1);assert.equal(envelope[60],1);assert.equal(envelope[69],0);assert.equal(envelope[80],0);
 const samples=new Float32Array(100).fill(.4),audio={sampleRate:10,length:100,duration:10,numberOfChannels:1,getChannelData:()=>samples};
 const mix=new DataView(mixTimeline([{audio,gain:.5,offset:1,sections:[{start:2,end:5}],sectionFade:0}]));
 assert.equal(mix.getInt16(44+29*4,true),0);assert.ok(Math.abs(mix.getInt16(44+30*4,true)/32767-.2)<.0001);assert.equal(mix.getInt16(44+60*4,true),0);
 assert.equal(samples[30],Math.fround(.4));
 const empty=new DataView(mixTimeline([{audio,gain:1,offset:0,sections:[],sectionFade:0}]));assert.equal(empty.getInt16(44+30*4,true),0);
 assert.throws(()=>sectionEnvelope(100,10,[{start:8,end:11}],.15),/within/);
 assert.throws(()=>sectionEnvelope(100,10,[{start:4,end:2}],.15),/start/);
 assert.throws(()=>sectionEnvelope(100,10,[],NaN),/fade/);
});

test('backing section selections survive builder backup and invalid ranges stay silent',()=>{
 const builder=loader()('src/core/coverBuilder.ts');
 const path='C:/AI/ManaAI-CV-2/exports/singing/harmony.wav';
 const track={id:'track-harmony-sections',name:'Chorus backing',role:'backing-vocal',path,originalPath:path,gain:.25,muted:false,offset:15,seconds:60,converted:true,sections:[{start:10,end:20},{start:40,end:50}],sectionFade:.3};
 const restored=builder.validateBuilderTracks(JSON.parse(JSON.stringify(builder.validateBuilderTracks([track]))))[0];
 assert.deepEqual(JSON.parse(JSON.stringify(restored.sections)),track.sections);assert.equal(restored.sectionFade,.3);assert.equal(restored.offset,15);
 const invalid=builder.validateBuilderTracks([{...track,sections:[{start:50,end:70}]}])[0];assert.equal(invalid.sections.length,0);
 assert.equal(builder.validateBuilderTracks([{...track,sections:undefined}])[0].sections,undefined);
});

test('selected backing preview includes only chosen audio while full mix keeps timeline',()=>{
 const {previewBackingSections,mixTimeline}=loader()('src/core/studioMix.ts');
 const samples=Float32Array.from({length:2880},(_,i)=>i>=150&&i<300?.2:.8);
 const audio={sampleRate:10,length:2880,duration:288,numberOfChannels:1,getChannelData:()=>samples};
 const selected=new DataView(previewBackingSections(audio,[{start:15,end:30}],0));
 assert.equal(selected.getUint32(40,true),150*4);
 assert.ok(Math.abs(selected.getInt16(44,true)/32767-.2)<.0001);
 const timeline=new DataView(mixTimeline([{audio,gain:1,offset:0,sections:[{start:15,end:30}],sectionFade:0}]));
 assert.equal(timeline.getUint32(40,true),2880*4);assert.equal(timeline.getInt16(44,true),0);
 const multiple=new DataView(previewBackingSections(audio,[{start:15,end:20},{start:18,end:25},{start:40,end:42}],0));
 assert.equal(multiple.getUint32(40,true),120*4);
 assert.ok(Math.abs(multiple.getInt16(44+100*4,true)/32767-.8)<.0001);
 const faded=new DataView(previewBackingSections(audio,[{start:15,end:30}],.2));assert.equal(faded.getInt16(44,true),0);
 assert.throws(()=>previewBackingSections(audio,[],.15),/at least one/);
 assert.equal(samples[150],Math.fround(.2));
});

test('music positions accept seconds or minutes and convert absolute end to job duration',()=>{
 const {parseMusicTime,formatMusicTime,musicDuration}=loader()('src/core/musicTime.ts');
 assert.equal(parseMusicTime('90'),90);assert.equal(parseMusicTime('1:30'),90);assert.equal(parseMusicTime(' 0:15.5 '),15.5);assert.equal(parseMusicTime('2:05'),125);
 assert.equal(formatMusicTime(90),'1:30');assert.equal(formatMusicTime(15),'15');assert.equal(formatMusicTime(60),'1:00');assert.equal(formatMusicTime(125.5),'2:05.5');
 for(const bad of ['', '-1','1:60','1:99','abc','1:02:03'])assert.ok(Number.isNaN(parseMusicTime(bad)));
 assert.equal(musicDuration(parseMusicTime('15'),parseMusicTime('30')),15);
 assert.equal(musicDuration(parseMusicTime('0:15'),parseMusicTime('0:45')),30);
 assert.equal(musicDuration(20,45),25); // End stays fixed when Start changes.
 for(const [start,end] of [[30,15],[15,15],[NaN,30],[0,NaN],[-1,30]])assert.ok(Number.isNaN(musicDuration(start,end)));
});

test('editor trims keep source placement, section gates and saved solo/trim settings',()=>{
 const load=loader(),{mixTimeline}=load('src/core/studioMix.ts'),{validateBuilderTracks}=load('src/core/coverBuilder.ts');
 const data=Float32Array.from([.1,.2,.3,.4,.5,.6,.7,.8]);
 const audio={sampleRate:4,length:8,duration:2,numberOfChannels:1,getChannelData:()=>data};
 const wav=new DataView(mixTimeline([{audio,gain:1,offset:.5,trim:{start:.5,end:1.5}}]));
 assert.equal(wav.getUint32(40,true),8*4); // song end = source end + offset
 assert.equal(wav.getInt16(44+3*4,true),0); // trimmed leading material stays silent
 assert.equal(wav.getInt16(44+4*4,true),Math.round(data[2]*32767));
 assert.equal(wav.getInt16(44+7*4,true),Math.round(data[5]*32767));
 const negative=new DataView(mixTimeline([{audio,gain:1,offset:-.75,trim:{start:.5,end:1.5}}]));
 assert.equal(negative.getInt16(44,true),Math.round(data[3]*32767));
 const gated=new DataView(mixTimeline([{audio,gain:1,offset:0,trim:{start:.5,end:1.5},sections:[{start:1,end:1.5}],sectionFade:0}]));
 assert.equal(gated.getInt16(44+2*4,true),0);assert.equal(gated.getInt16(44+4*4,true),Math.round(data[4]*32767));
 for(const trim of [{start:1,end:.5},{start:-1,end:1},{start:0,end:3},{start:NaN,end:1}])assert.throws(()=>mixTimeline([{audio,gain:1,offset:0,trim}]),/trim/);
 const path='C:/AI/ManaAI-CV-2/exports/singing/test.wav';
 const track={id:'track-editor',name:'Edited',role:'other',path,originalPath:path,seconds:2,offset:.5,gain:1,solo:true,trim:{start:.5,end:1.5}};
 const restored=validateBuilderTracks(JSON.parse(JSON.stringify([track])))[0];
 assert.deepEqual(JSON.parse(JSON.stringify(restored.trim)),track.trim);assert.equal(restored.solo,true);
 assert.equal(validateBuilderTracks([{...track,trim:{start:1,end:3}}])[0].trim,undefined);
});

test('editor move/trim gestures respect source limits, solo and real waveform peaks',()=>{
 const {moveClip,trimClip,timelineGain,waveformPeaks}=loader()('src/core/builderTimeline.ts');
 const track={id:'track-a',seconds:10,offset:2,gain:.7,muted:false,trim:{start:1,end:8}};
 assert.equal(moveClip(track,-20,.1).offset,-1);
 assert.equal(moveClip(track,.26,.1).offset,2.3);
 assert.equal(trimClip(track,'start',20,.1).trim.start,7.95);
 assert.equal(trimClip(track,'end',20,.1).trim.end,10);
 assert.equal(track.trim.start,1);
 assert.equal(timelineGain(track,[track,{...track,id:'track-b',solo:true}]),0);
 assert.equal(timelineGain({...track,solo:true},[{...track,solo:true}]),.7);
 assert.equal(timelineGain({...track,solo:true,muted:true},[]),0);
 assert.deepEqual(Array.from(waveformPeaks({length:4,numberOfChannels:2,getChannelData:c=>c?[0,0,.9,0]:[.2,-.4,0,.1]},2)),[.4,.9]);
});

test('builder undo groups continuous changes, restores audio paths and branches after new edits',()=>{
 const {createBuilderHistory,recordBuilderEdit,undoBuilderEdit,redoBuilderEdit}=loader()('src/core/builderHistory.ts');
 const track={id:'track-history',name:'Piano',role:'piano',path:'saved-original.wav',originalPath:'saved-original.wav',seconds:10,gain:1,muted:false,offset:0,converted:false};
 const initial={draft:{title:'Song',tracks:[track]},choices:{},customs:{}};
 let h=createBuilderHistory(initial);
 const edit=(patch)=>({...h.present,draft:{...h.present.draft,tracks:[{...h.present.draft.tracks[0],...patch}]}});
 h=recordBuilderEdit(h,edit({gain:.8}),'Volume','gain');h=recordBuilderEdit(h,edit({gain:.6}),'Volume','gain');
 assert.equal(h.past.length,1);h=undoBuilderEdit(h);assert.equal(h.present.draft.tracks[0].gain,1);h=redoBuilderEdit(h);assert.equal(h.present.draft.tracks[0].gain,.6);
 h=recordBuilderEdit(h,edit({path:'saved-replacement.wav',custom:{pitch:2,extension:.3}}),'Apply replacement');
 h=undoBuilderEdit(h);assert.equal(h.present.draft.tracks[0].path,'saved-original.wav');h=redoBuilderEdit(h);assert.equal(h.present.draft.tracks[0].path,'saved-replacement.wav');
 h=undoBuilderEdit(h);h=recordBuilderEdit(h,edit({trim:{start:2,end:7}}),'Trim');assert.equal(h.future.length,0);assert.equal(redoBuilderEdit(h),h);
 assert.equal(initial.draft.tracks[0].gain,1);assert.equal(initial.draft.tracks[0].path,'saved-original.wav');
});

test('builder history covers removal, new draft and pending tuning without audio work, bounded to 50 edits',()=>{
 const {createBuilderHistory,recordBuilderEdit,undoBuilderEdit,redoBuilderEdit}=loader()('src/core/builderHistory.ts');
 const initial={draft:{title:'Initial',tracks:[]},choices:{},customs:{}};let h=createBuilderHistory(initial);
 h=recordBuilderEdit(h,{...h.present,choices:{one:'harp'},customs:{one:{pitch:3,extension:.2}}},'Tuning');
 h=undoBuilderEdit(h);assert.deepEqual(Object.keys(h.present.customs),[]);h=redoBuilderEdit(h);assert.equal(h.present.customs.one.pitch,3);
 const track={id:'track-one',name:'One',role:'other',path:'saved.wav',originalPath:'saved.wav',gain:1,muted:false,offset:0,seconds:5,converted:false};
 h=recordBuilderEdit(h,{...h.present,draft:{title:'Initial',tracks:[track]}},'Add');
 h=recordBuilderEdit(h,{...h.present,draft:{title:'Initial',tracks:[]}},'Remove');h=undoBuilderEdit(h);assert.equal(h.present.draft.tracks[0].path,'saved.wav');
 h=recordBuilderEdit(h,{draft:{title:'',tracks:[]},choices:{},customs:{}},'New draft');h=undoBuilderEdit(h);assert.equal(h.present.draft.tracks.length,1);
 for(let i=0;i<70;i++)h=recordBuilderEdit(h,{...h.present,draft:{...h.present.draft,title:String(i)}},'Rename');
 assert.equal(h.past.length,50);const same=recordBuilderEdit(h,h.present,'No op');assert.equal(same,h);
 const reset=createBuilderHistory(initial);assert.equal(reset.past.length,0);assert.equal(reset.future.length,0);assert.equal(undoBuilderEdit(reset),reset);
});

test('split clips preserve exact mix samples; duplicates and moves reuse source windows',()=>{
 const load=loader(),core=load('src/core/builderTimeline.ts'),{mixTimeline}=load('src/core/studioMix.ts');
 const data=Float32Array.from([.05,.1,.15,.2,.25,.3,.35,.4]);
 const audio={sampleRate:4,length:8,duration:2,numberOfChannels:1,getChannelData:()=>data};
 const track={id:'track-clips',name:'Clips',role:'other',seconds:2,offset:.5,gain:1,muted:false};
 const original=Buffer.from(mixTimeline([{audio,gain:1,offset:.5}]));
 const split={...track,...core.splitTrackClip(track,'source',1.5,'right')};
 assert.equal(split.clips.length,2);assert.equal(split.clips[0].end,1);assert.equal(split.clips[1].start,1);
 assert.deepEqual(Buffer.from(mixTimeline([{audio,gain:1,offset:.5,clips:split.clips}])),original);
 const copied={...split,...core.duplicateTrackClip(split,'source','copy')};
 assert.equal(copied.clips[2].start,0);assert.equal(copied.clips[2].end,1);assert.equal(copied.clips[2].offset,2);
 const wav=new DataView(mixTimeline([{audio,gain:1,offset:.5,clips:copied.clips}]));
 assert.equal(wav.getUint32(40,true),14*4);assert.equal(wav.getInt16(44+10*4,true),Math.round(data[0]*32767));
 const moved={...split,...core.moveClip(split,.5,.1,'right')};assert.equal(moved.clips[1].offset,.5);assert.equal(split.clips[1].offset,0);
 const gap=new DataView(mixTimeline([{audio,gain:1,offset:.5,clips:moved.clips}]));assert.equal(gap.getInt16(44+6*4,true),0);
 const trimmed=core.trimClip(moved,'end',-.5,.1,'right');assert.equal(trimmed.clips[1].end,1.5);assert.equal(trimmed.clips[0].end,1);
 assert.throws(()=>core.splitTrackClip(track,'source',.5,'invalid'),/inside/);
 assert.throws(()=>core.splitTrackClip(track,'source',NaN,'invalid'),/inside/);
});

test('clip backups preserve edits, keep empty lanes silent and reject malformed ranges',()=>{
 const load=loader(),{validateBuilderTracks}=load('src/core/coverBuilder.ts'),{mixTimeline}=load('src/core/studioMix.ts');
 const path='C:/AI/ManaAI-CV-2/exports/singing/clip-test.wav';
 const track={id:'track-clips',name:'Clip test',role:'other',path,originalPath:path,seconds:2,offset:.5,gain:1,clips:[{id:'left',start:0,end:1,offset:0},{id:'right',start:1,end:2,offset:.5}]};
 const restored=validateBuilderTracks(JSON.parse(JSON.stringify([track])))[0];assert.deepEqual(JSON.parse(JSON.stringify(restored.clips)),track.clips);
 const studio=load('src/core/musicStudio.ts');const saved=studio.validateStudio({projects:[{id:'studio-clips',kind:'builder',title:'Clips',createdAt:'2026-10-17T00:00:00Z',status:'ready',builderTracks:[track]}]});
 const reopened=studio.validateStudio(JSON.parse(JSON.stringify(saved))).projects[0].builderTracks[0];assert.deepEqual(JSON.parse(JSON.stringify(reopened.clips)),track.clips);
 const audio={sampleRate:4,length:8,duration:2,numberOfChannels:1,getChannelData:()=>Float32Array.from([.1,.1,.1,.1,.1,.1,.1,.1])};
 const empty=new DataView(mixTimeline([{audio,gain:1,offset:0,clips:[]},{audio,gain:0,offset:0}]));assert.equal(empty.getInt16(44,true),0);
 const malformed=validateBuilderTracks([{...track,clips:[{id:'bad',start:0,end:3,offset:0}]}])[0];assert.equal(malformed.clips.length,0);
 assert.throws(()=>mixTimeline([{audio,gain:1,offset:0,clips:[{id:'bad',start:0,end:3,offset:0}]}]),/valid clips/);
 const gated=new DataView(mixTimeline([{audio,gain:1,offset:0,clips:[{id:'one',start:0,end:1,offset:1}],sections:[{start:.5,end:1}],sectionFade:0}]));
 assert.equal(gated.getInt16(44+4*4,true),0);assert.equal(gated.getInt16(44+6*4,true),Math.round(.1*32767));
 // Shared buffers may have different backing gates on separate tracks.
 const shared=new DataView(mixTimeline([{audio,gain:1,offset:0,sections:[],sectionFade:0},{audio,gain:1,offset:0,sections:[{start:1,end:2}],sectionFade:0}]));
 assert.equal(shared.getInt16(44,true),0);assert.equal(shared.getInt16(44+4*4,true),Math.round(.1*32767));
});

test('builder mixer accepts unconverted vocals and instrumental-only drafts while respecting silent lanes',()=>{
 const {canMixBuilder}=loader()('src/core/builderTimeline.ts');
 const track={id:'track-preview',name:'Guide',role:'vocal',seconds:10,offset:0,gain:1,muted:false,converted:false};
 assert.equal(canMixBuilder([track]),true);
 assert.equal(canMixBuilder([{...track,role:'piano'}]),true);
 assert.equal(canMixBuilder([]),false);
 assert.equal(canMixBuilder([{...track,muted:true}]),false);
 assert.equal(canMixBuilder([{...track,gain:0}]),false);
 assert.equal(canMixBuilder([{...track,clips:[]}]),false);
 assert.equal(canMixBuilder([{...track,sections:[]}]),false);
 assert.equal(canMixBuilder([{...track,trim:{start:0,end:1},sections:[{start:2,end:3}]}]),false);
 assert.equal(canMixBuilder([{...track,offset:-11}]),false);
 assert.equal(canMixBuilder([track,{...track,id:'track-solo',solo:true,muted:true}]),false);
});

test('live builder playback plans preserve clips, offsets and source-local backing gates',()=>{
 const {builderPlaybackPlan}=loader({'./builderAudio':{loadBuilderAudio:()=>{throw Error('not needed');}}})('src/core/builderPlayback.ts');
 const track={id:'track-live',path:'saved.wav',seconds:10,offset:2,gain:1,muted:false,clips:[{id:'one',start:1,end:5,offset:0},{id:'copy',start:1,end:3,offset:8}],sections:[{start:2,end:4}],sectionFade:.1};
 const plan=builderPlaybackPlan([track],5);
 assert.equal(plan.end,13);assert.equal(plan.spans.length,2);assert.equal(plan.spans[0].start,3);assert.equal(plan.spans[0].songStart,5);assert.equal(plan.spans[1].songStart,12);assert.equal(plan.spans[1].end,3);
 assert.equal(builderPlaybackPlan([{...track,sections:[]}],0).spans.length,0);
 assert.throws(()=>builderPlaybackPlan([track],NaN));
});

test('live builder playback resumes from the gesture, reuses buffers on seek and updates mute without rebuilding audio',async()=>{
 const contexts=[],loads=[];
 class Context{
  currentTime=0;destination={};gains=[];sources=[];
  constructor(){contexts.push(this);}
  resume(){this.resumed=true;return Promise.resolve();}close(){return Promise.resolve();}
  createGain(){const param={value:1,targets:[],setTargetAtTime(v){this.targets.push(v);},setValueAtTime(){},linearRampToValueAtTime(){}};const node={gain:param,connect(){},disconnect(){}};this.gains.push(node);return node;}
  createBufferSource(){const node={buffer:null,onended:null,connect(){},disconnect(){},start(...args){this.args=args;},stop(){}};this.sources.push(node);return node;}
  createConstantSource(){return {onended:null,connect(){},disconnect(){},start(){},stop(){}};}
 }
 const {BuilderPlayback}=loader({'./builderAudio':{loadBuilderAudio:async path=>{loads.push(path);return {duration:20};}}},{AudioContext:Context})('src/core/builderPlayback.ts');
 const player=new BuilderPlayback(),track={id:'track-one',path:'one.wav',seconds:10,offset:0,gain:1,muted:false};
 const pending=player.play([track],3,1,()=>{});assert.equal(contexts[0].resumed,true);await pending;
 assert.equal(player.active,true);assert.equal(contexts[0].sources[0].args[1],3);
 contexts[0].currentTime=2;assert.ok(Math.abs(player.position-4.97)<.001);
 player.seek(6);assert.equal(contexts[0].sources.at(-1).args[1],6);assert.equal(loads.length,1);
 const count=contexts[0].sources.length;player.updateLevels([{...track,muted:true}]);assert.equal(contexts[0].sources.length,count);assert.ok(contexts[0].gains.some(g=>g.gain.targets.includes(0)));
 player.pause();assert.equal(player.active,false);player.dispose();
});

test('stopping a pending live Play prevents late audio from starting',async()=>{
 let resolveAudio,starts=0;
 class Context{currentTime=0;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createGain(){return {gain:{setTargetAtTime(){}},connect(){},disconnect(){}};}createBufferSource(){starts++;throw Error('Should not start');}}
 const pending=new Promise(resolve=>{resolveAudio=resolve;});
 const {BuilderPlayback}=loader({'./builderAudio':{loadBuilderAudio:()=>pending}},{AudioContext:Context})('src/core/builderPlayback.ts');
 const player=new BuilderPlayback();const playing=player.play([{id:'track-one',path:'one.wav',seconds:10,offset:0,gain:1,muted:false}],0,1,()=>{});
 player.pause();resolveAudio({duration:10});assert.equal(await playing,false);assert.equal(starts,0);player.dispose();
});

test('original musical directions reach the request prompt and invalidate prior preview approval',()=>{
 const original=loader()('src/core/originalSong.ts');
 const direction={mood:'Warm and hopeful',instruments:'piano, soft strings',tempo:'92',structure:'intro, verse, chorus, outro'};
 const prompt=original.composeOriginalPrompt('  A quiet evening.  ',direction);
 assert.equal(prompt,'A quiet evening.\nMood: Warm and hopeful.\nFeatured instruments: piano, soft strings.\nTempo: 92 BPM.\nSong structure: intro, verse, chorus, outro.');
 const brief=original.validateOriginalBrief({prompt,lyrics:'',style:'gentle-piano',instrumental:true,duration:90,seed:42});
 assert.ok(brief);
 for(const patch of [{mood:'Dreamy'},{instruments:'flute'},{tempo:'110'},{structure:'a single evolving theme'}]){
  assert.notEqual(original.originalFingerprint(brief),original.originalFingerprint({...brief,prompt:original.composeOriginalPrompt('A quiet evening.',{...direction,...patch})}));
 }
 assert.equal(original.originalFingerprint(brief),original.originalFingerprint({...brief,duration:180}));
 assert.equal(original.composeOriginalPrompt(' Idea ',{mood:'',instruments:'',tempo:'',structure:''}),'Idea');
 assert.equal(original.validateOriginalBrief({...brief,prompt:original.composeOriginalPrompt('x'.repeat(1990),direction)}),undefined);
 for(const value of ['', '40','92','240'])assert.equal(original.validOriginalTempo(value),true);
 for(const value of ['39','241','92.5','NaN','Infinity','1e2','-60'])assert.equal(original.validOriginalTempo(value),false);
 const studio=loader()('src/core/musicStudio.ts');
 const saved=studio.validateStudio({projects:[{id:'studio-directions',title:'Directed song',kind:'original',original:brief,createdAt:'2026-10-18',mix:'C:/AI/ManaAI-CV-2/exports/singing/directions.wav'}]});
 assert.equal(saved.projects[0].original.prompt,prompt);
});

test('word karaoke follows exact boundaries, gaps, backwards seeking and pause positions',()=>{
 const lyrics=loader()('src/core/lyrics.ts');
 const line={start:1,end:4,text:'Stay beside me',words:[{start:1,end:1.5,text:'Stay'},{start:1.8,end:2.5,text:'beside'},{start:2.5,end:4,text:'me'}]};
 const [valid]=lyrics.validateLyrics([line]);assert.equal(valid.words.length,3);
 for(const [time,index] of [[.9,-1],[1,0],[1.5,-1],[1.79,-1],[1.8,1],[2.5,2],[4,-1],[1.2,0]])assert.equal(lyrics.activeLyricWord(valid,time),index);
 assert.equal(lyrics.activeLyricWord({start:1,end:4,text:'Old line'},2),-1);
 const invalid=lyrics.validateLyrics([{...line,words:[{start:1,end:6,text:'Stay beside me'}]}]);assert.equal(invalid[0].words,undefined);
 const mismatch=lyrics.validateLyrics([{...line,text:'Edited wording'}]);assert.equal(mismatch[0].words,undefined);
});
test('word karaoke retains timed words and silent gaps through editing, excerpts and backups',()=>{
 const load=loader({'./persistence':{readStored:()=>null,writeStored:()=>{}}}),lyrics=load('src/core/lyrics.ts'),studio=load('src/core/musicStudio.ts');
 const line={start:1,end:4,text:'Stay beside me',words:[{start:1,end:1.5,text:'Stay'},{start:1.8,end:2.5,text:'beside'},{start:2.5,end:4,text:'me'}]};
 const edited=lyrics.parseLrc(lyrics.lyricsToLrc([line]),5);assert.deepEqual(JSON.parse(JSON.stringify(edited[0].words)),line.words);
 const excerpt=lyrics.excerptLyrics([line],1.4,1.5);assert.equal(excerpt[0].text,'Stay beside me');assert.equal(excerpt[0].words[0].start,0);assert.ok(Math.abs(excerpt[0].words[0].end-.1)<1e-9);assert.equal(excerpt[0].words[2].end,1.5);assert.equal(lyrics.validateLyrics(excerpt)[0].words.length,3);
 const gap=lyrics.excerptLyrics([line],1.55,.1);assert.equal(gap.length,0);
 const state=studio.validateStudio({projects:[{id:'studio-word-test',title:'Words',createdAt:'2026-10-18',lyrics:[line]}]});const restored=studio.validateStudio(JSON.parse(JSON.stringify(state)));assert.deepEqual(JSON.parse(JSON.stringify(restored.projects[0].lyrics[0].words)),line.words);
 assert.throws(()=>lyrics.parseLrc('[00:01]<00:02>Hello<00:01.5>',5));assert.throws(()=>lyrics.parseLrc('[00:01]<00:01>Hello',5));assert.throws(()=>lyrics.parseLrc('[00:01]<00:01>Hello<00:06>',5));
});

test('clip fades agree in saved mixes and playback plans, including seeking and split edges',()=>{
 const load=loader(),timeline=load('src/core/builderTimeline.ts'),mix=load('src/core/studioMix.ts'),play=load('src/core/builderPlayback.ts');
 const clip={id:'one',start:0,end:4,offset:0,fadeIn:1,fadeOut:1};
 const track={id:'track-fades',name:'Fades',seconds:4,path:'x',originalPath:'x',offset:0,gain:1,muted:false,role:'piano',converted:false,clips:[clip]};
 assert.equal(timeline.clipFadeLevel(clip,0),0);assert.ok(Math.abs(timeline.clipFadeLevel(clip,.5)-.5)<1e-9);assert.equal(timeline.clipFadeLevel(clip,2),1);assert.equal(timeline.clipFadeLevel(clip,4),0);
 const audio={sampleRate:4,length:16,duration:4,numberOfChannels:1,getChannelData:()=>new Float32Array(16).fill(.5)};
 const bytes=new DataView(mix.mixTimeline([{audio,gain:1,offset:0,clips:[clip]}]));const sample=i=>bytes.getInt16(44+i*4,true)/32767;
 assert.equal(sample(0),0);assert.ok(Math.abs(sample(2)-.25)<.0001);assert.ok(Math.abs(sample(8)-.5)<.0001);assert.ok(sample(15)<.1);
 const plan=play.builderPlaybackPlan([track],.5);assert.equal(plan.spans[0].start,.5);assert.equal(plan.spans[0].clip.start,0);assert.equal(plan.spans[0].clip.fadeIn,1);
 const split=timeline.splitTrackClip(track,'one',2,'two').clips;assert.equal(split[0].fadeIn,1);assert.equal(split[0].fadeOut,0);assert.equal(split[1].fadeIn,0);assert.equal(split[1].fadeOut,1);
 assert.equal(timeline.setClipFade(track,'one','fadeIn',20).clips[0].fadeIn,2);
 assert.throws(()=>timeline.setClipFade(track,'one','fadeIn',NaN));
});
test('editable instrument notes validate imports, section bounds and persist with clip fades',()=>{
 const load=loader(),notes=load('src/core/builderNotes.ts'),builder=load('src/core/coverBuilder.ts'),history=load('src/core/builderHistory.ts');
 const edit={start:2,seconds:4,instrument:'piano',notes:[{start:.2,end:1,pitch:60,velocity:.7},{start:1,end:2,pitch:64,velocity:.4}]};
 assert.ok(notes.validateNoteEdit(edit,10));assert.equal(notes.noteName(60),'C4');
 for(const bad of [{...edit,start:9},{...edit,seconds:61},{...edit,instrument:'bad'},{...edit,notes:[{start:1,end:0,pitch:60,velocity:.5}]},{...edit,notes:[{start:0,end:1,pitch:128,velocity:.5}]}])assert.equal(notes.validateNoteEdit(bad,10),undefined);
 assert.equal(notes.importDetectedNotes([[0,1,60,.5]],4)[0].pitch,60);assert.throws(()=>notes.importDetectedNotes([[0,5,60,.5]],4));
 const path='C:/AI/ManaAI-CV-2/exports/singing/note-test.wav';const track={id:'track-notes',name:'Notes',path,originalPath:path,seconds:10,gain:1,offset:0,muted:false,converted:false,role:'piano',noteEdit:edit,clips:[{id:'one',start:0,end:10,offset:0,fadeIn:.5,fadeOut:1}]};
 const restored=builder.validateBuilderTracks(JSON.parse(JSON.stringify([track])))[0];assert.equal(restored.noteEdit.notes[1].pitch,64);assert.equal(restored.clips[0].fadeOut,1);
 const base={draft:{title:'Notes',tracks:[track]},choices:{},customs:{}};let h=history.createBuilderHistory(base);const changed={...track,noteEdit:{...edit,notes:[{...edit.notes[0],pitch:67}]}};h=history.recordBuilderEdit(h,{...base,draft:{...base.draft,tracks:[changed]}},'Edit notes');assert.equal(history.undoBuilderEdit(h).present.draft.tracks[0].noteEdit.notes[0].pitch,60);assert.equal(history.redoBuilderEdit(history.undoBuilderEdit(h)).present.draft.tracks[0].noteEdit.notes[0].pitch,67);
});

test('spoken song commands handle character address and dictation commas without guessing titles',()=>{
 const pool=loader()('src/core/songPool.ts');
 const songs=[{id:'song-trails',title:'Trails in the Sky',aliases:['Trails'],enabled:true,path:'C:/AI/ManaAI-CV-2/exports/singing/trails.wav'}];
 for(const text of ['Mana, Sing Trails','Sing, Trails.','Mana: can you sing Trails for me?']){
  const title=pool.requestedSongTitle(pool.musicCommandText(text,'Mana'));assert.equal(title,'Trails');assert.equal(pool.findSong(songs,title).id,'song-trails');
 }
 assert.equal(pool.requestedSongTitle(pool.musicCommandText('Sing, reach out to the truth.','Mana')),'reach out to the truth');
 assert.equal(pool.requestedSongTitle(pool.musicCommandText('Sting trails','Mana')),null);
 assert.equal(pool.findSong(songs,'trails room'),undefined);
 assert.equal(pool.requestedSongTitle(pool.musicCommandText('I like singing Trails','Mana')),null);
 assert.equal(pool.musicCommandText('Manatee sings','Mana'),'Manatee sings');
});

test('Whisper recognition hints include enabled song vocabulary without exceeding the native byte limit',()=>{
 const w=loader({'./persistence':{}})('src/core/whisper.ts');
 const prompt=w.recognitionPrompt(['Mana','Aishi'],['Trails v3','Sora','Reach Out to the Truth','Sora']);
 assert.match(prompt,/Hi! Hello! Hey!/);assert.match(prompt,/Good morning/);assert.match(prompt,/Sing, hum/);assert.match(prompt,/Trails v3/);assert.match(prompt,/Sora/);assert.equal((prompt.match(/Sora/g)||[]).length,1);
 const large=w.recognitionPrompt(['名'.repeat(60),'名'.repeat(60)],Array.from({length:50},(_,i)=>'曲'.repeat(25)+i));assert.ok(new TextEncoder().encode(large).length<=440);
 assert.ok(!w.recognitionPrompt(['Mana\nAishi'],['Trails\nv3']).includes('\n'));
 const d=loader()('src/core/dictation.ts');assert.equal(d.dictationReview({text:'Xing Sora'}).text,'Xing Sora');
});

test('user-confirmed avatar image labels survive backups without inferring identity from filenames',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}},{crypto:require('node:crypto').webcrypto});
 const images=load('src/core/savedImages.ts'),vision=load('src/core/vision.ts'),settings=load('src/core/settings.ts'),backup=load('src/core/backup.ts');
 const image={filename:'Mana.jpg',dataUrl:'data:image/jpeg;base64,/9j/AA=='};
 const retained=images.retainImage([],image);assert.equal(retained.images[0].depictsAvatar,undefined);
 images.saveSavedImages([{...retained.images[0],depictsAvatar:true}]);
 const loaded=images.loadSavedImages();assert.equal(loaded[0].depictsAvatar,true);
 assert.equal(images.retainImage(loaded,{...image,filename:'unrelated.jpg'}).images[0].depictsAvatar,true);
 const report={filename:image.filename,description:'White-haired character with a headset.',imageId:retained.imageId,userConfirmedAvatar:true};
 settings.saveChat([{id:'u',role:'user',content:'Who is this?',imageReport:report}]);
 const restored=backup.validateBackup(JSON.stringify(backup.snapshotBackup()));
 assert.equal(restored.data['mana.images.v1'][0].depictsAvatar,true);assert.equal(restored.data['mana.chat.v1'][0].imageReport.userConfirmedAvatar,true);
 const payload=JSON.stringify(load('src/core/llm.ts').buildPayload('Mana',settings.loadChat()));assert.match(payload,/explicitly confirmed/);assert.match(payload,/authorship/);assert.ok(!payload.includes(image.dataUrl));
 assert.equal(vision.validateImageReport({...report,userConfirmedAvatar:'true'}).userConfirmedAvatar,undefined);
 assert.equal(images.validateSavedImages([{...loaded[0],depictsAvatar:'true'}])[0].depictsAvatar,undefined);
 assert.match(vision.imageReportContext({...report,userConfirmedAvatar:undefined}),/character is unidentified/);
 const {depictsAvatar,...unlabeled}=loaded[0];images.saveSavedImages([unlabeled]);assert.equal(images.loadSavedImages()[0].depictsAvatar,undefined);
});

test('star collector fixes the actual generated frame-reset bug and preserves movement, score and restart',()=>{
 const sandbox=loader()('src/core/codeSandbox.ts');
 function runner(source){let latest,calls=0;const math=Object.create(Math);math.random=()=>{calls++;return .5;};const self={postMessage:m=>latest=m};vm.runInNewContext(sandbox.SANDBOX_WORKER,{self,Math:math});self.onmessage({data:{type:'start',code:source}});assert.equal(latest.type,'ready');return {tick(keys={},dt=.1){self.onmessage({data:{type:'tick',dt,keys}});return sandbox.validateSandboxFrame(latest);},calls:()=>calls};}
 const player=result=>result.commands.filter(c=>c.type==='circle').at(-1).args;
 const original=runner(fs.readFileSync('tests/fixtures/game-reset-every-frame.js','utf8'));
 assert.equal(player(original.tick({ArrowRight:true}))[0],125);assert.equal(player(original.tick({ArrowRight:true}))[0],125);assert.equal(player(original.tick())[0],120);
 const fixed=runner(sandbox.SANDBOX_EXAMPLE);
 assert.equal(player(fixed.tick({ArrowRight:true}))[0],135);assert.equal(player(fixed.tick({ArrowRight:true}))[0],150);assert.equal(player(fixed.tick())[0],150);assert.equal(fixed.calls(),40,'twenty stars initialize once, not per frame');
 for(let i=0;i<6;i++)fixed.tick({ArrowRight:true});let result;
 for(let i=0;i<3;i++)result=fixed.tick({ArrowDown:true});
 const score=r=>Number(r.commands.filter(c=>c.type==='text').at(-1).args[0].split('Score: ')[1]);assert.ok(score(result)>0);assert.ok(score(fixed.tick())>0);
 result=fixed.tick({Space:true});assert.equal(score(result),0);assert.equal(player(result)[0],120);
 assert.equal(player(fixed.tick({Space:true,ArrowRight:true}))[0],135);assert.equal(player(fixed.tick({Space:true,ArrowRight:true}))[0],150,'holding reset must not reinitialize each frame');
 for(let i=0;i<50;i++)result=fixed.tick({ArrowRight:true,ArrowDown:true});assert.equal(player(result)[0],470);assert.equal(player(result)[1],270);
 assert.equal(sandbox.sandboxCode('```js\napi.onFrame=()=>{};\n```'),'api.onFrame=()=>{};');assert.throws(()=>sandbox.sandboxCode('x'.repeat(16001)),/16,000/);
 assert.match(sandbox.sandboxDraftInstructions(),/OUTSIDE the callback/);assert.ok(sandbox.sandboxDraftInstructions().includes(sandbox.SANDBOX_EXAMPLE));
});
test('code sandbox blocks unsupported draw messages and embeds fixed opaque-frame restrictions',()=>{
 const sandbox=loader()('src/core/codeSandbox.ts');
 for(const command of [{type:'__proto__',args:[]},{type:'circle',args:[1,2,-3,'#fff']},{type:'rect',args:[NaN,0,1,1,'#fff']},{type:'clear',args:['url(https://example.com)']}])assert.throws(()=>sandbox.validateSandboxFrame({commands:[command],logs:[]}));
 assert.throws(()=>sandbox.validateSandboxFrame({commands:[],logs:['x'.repeat(301)]}));
 const frame=sandbox.sandboxFrame();assert.match(frame,/connect-src 'none'/);assert.match(frame,/worker-src blob:/);assert.ok(!frame.includes('allow-same-origin'));assert.match(frame,/e.source!==parent/);
 const script=frame.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(script);
 const self={postMessage:m=>{self.result=m}};const context=vm.createContext({self});vm.runInContext(sandbox.SANDBOX_WORKER,context,{timeout:100});self.onmessage({data:{type:'start',code:'throw Error("broken")'}});assert.equal(self.result.type,'error');assert.match(self.result.error,/broken/);
 const hung=vm.createContext({self:{postMessage(){}}});vm.runInContext(sandbox.SANDBOX_WORKER,hung);assert.throws(()=>vm.runInContext('self.onmessage({data:{type:"start",code:"while(true){}"}})',hung,{timeout:30}),/timed out/);
});

test('sandbox bootstrap creates the tested worker source and terminates it on stop',()=>{
 const sandbox=loader()('src/core/codeSandbox.ts');const script=sandbox.sandboxFrame().match(/<script>([\s\S]*)<\/script>/)[1];
 let relay,blobSource,terminated=0;const parent={postMessage(){}},workers=[];
 class BlobMock{constructor(parts){blobSource=parts.join('');}}
 class WorkerMock{constructor(){workers.push(this);}postMessage(m){this.sent=m;}terminate(){terminated++;}}
 vm.runInNewContext(script,{parent,Blob:BlobMock,Worker:WorkerMock,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},addEventListener:(name,fn)=>relay=fn});
 relay({source:{},data:{type:'start'}});assert.equal(workers.length,0);
 relay({source:parent,data:{type:'start',code:sandbox.SANDBOX_EXAMPLE}});assert.equal(blobSource,sandbox.SANDBOX_WORKER);assert.equal(workers.length,1);
 const messages=[];const self={postMessage:m=>messages.push(m)};vm.runInNewContext(blobSource,{self});self.onmessage({data:workers[0].sent});assert.equal(messages[0].type,'ready');
 relay({source:parent,data:{type:'stop'}});assert.equal(terminated,1);
});

test('game playground ignores foreign messages and stops unresponsive or hidden sessions',()=>{
 const sandbox=loader()('src/core/codeSandbox.ts');let now=0,pulse,element,canvasProps;const listeners={},effects=[],states=[],sent=[],drawn=[],finished=[];
 const context={fillRect:(...a)=>drawn.push(a),beginPath(){},arc(){},fill(){},fillText(){}};
 const canvas={focus(){},getContext:()=>context};
 const jsx=(type,props)=>{if(type==='canvas'&&props.ref){props.ref.current=canvas;canvasProps=props;}return {type,props};};
 const react={useState:init=>{let v=typeof init==='function'?init():init;return [v,next=>{v=typeof next==='function'?next(v):next;states.push(v);}];},useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)};
 const document={visibilityState:'visible',body:{appendChild(){}},createElement:()=>element={contentWindow:{postMessage:m=>sent.push(m)},setAttribute(name,value){this[name]=value;},remove(){this.removed=true;}},addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:name=>delete listeners[name]};
 const window={addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:name=>delete listeners[name]};
 const module={exports:{}};const code=ts.transpileModule(fs.readFileSync('src/components/CodePlayground.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='../core/gameProject'?loader()('src/core/gameProject.ts'):id==='../core/gameMedia'?loader()('src/core/gameMedia.ts'):id==='../core/gamePointer'?loader({}, {window})('src/core/gamePointer.ts'):id==='../core/gameProgress'?loader()('src/core/gameProgress.ts'):id==='../core/codeGames'?loader({'./persistence':{readStored:()=>null,writeStored(){}}})('src/core/codeGames.ts'):sandbox,document,window,performance:{now:()=>now},setInterval:fn=>{pulse=fn;return 1;},clearInterval:()=>{pulse=null;}});
 const props={code:sandbox.SANDBOX_EXAMPLE,onCode(){},onRunFinished:e=>finished.push(e)};const tree=module.exports.default(props);
 function find(node,label){if(!node||typeof node!=='object')return;if(node.type==='button'&&node.props.children===label)return node;for(const c of [node.props?.children].flat(Infinity)){const found=find(c,label);if(found)return found;}}
 const run=find(tree,'Run game');run.props.onClick();assert.equal(element.sandbox,'allow-scripts');const game=element;
 listeners.message({source:{},data:{type:'boot'}});assert.equal(sent.length,0);
 listeners.message({source:game.contentWindow,data:{type:'boot'}});assert.equal(sent[0].type,'start');
 listeners.message({source:game.contentWindow,data:{type:'ready'}});canvasProps.onKeyDown({key:'ArrowRight',preventDefault(){}});now=33;pulse();assert.equal(sent.at(-1).type,'tick');listeners.message({source:game.contentWindow,data:{type:'frame',commands:[],logs:['game says hello']}});now=66;pulse();props.code='changed after run began';
 now=900;pulse();assert.equal(game.removed,true);assert.ok(states.some(s=>typeof s==='string'&&s.includes('too long')));assert.equal(pulse,null);assert.equal(finished[0].code,sandbox.SANDBOX_EXAMPLE);assert.equal(finished[0].frames,1);assert.equal(finished[0].reason,'timeout');assert.equal(finished[0].keysUsed[0],'ArrowRight');assert.equal(finished[0].logs[0],'game says hello');
 run.props.onClick();document.visibilityState='hidden';listeners.visibilitychange();assert.equal(element.removed,true);assert.equal(pulse,null);assert.equal(sent.at(-1).type,'stop');assert.equal(finished[1].reason,'hidden');
 effects.map(fn=>fn()).filter(fn=>typeof fn==='function').forEach(fn=>fn());
});

test('saved games preserve immutable versions, reopen and roundtrip backup with exact run evidence',()=>{
 const values=new Map();const load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}},{crypto:require('node:crypto').webcrypto});const games=load('src/core/codeGames.ts'),backup=load('src/core/backup.ts');
 const first=games.addCodeGame({games:[],reports:[]},'Stars','api.onFrame=()=>{};');const second=games.addCodeGame(first.state,'Stars','api.onFrame=()=>{api.clear("#fff")};',first.game.id);
 assert.equal(first.state.games.length,1);assert.equal(second.game.version,2);assert.equal(second.game.parentId,first.game.id);assert.equal(second.game.rootId,first.game.id);assert.throws(()=>games.addCodeGame(second.state,'Stars',second.game.code,second.game.id),/change/);
 const evidence={code:first.game.code,startedAt:'2026-10-19T00:00:00Z',endedAt:'2026-10-19T00:00:01Z',elapsedMs:1000,frames:24,keysUsed:['ArrowRight'],reason:'stopped',detail:'Stopped.',logs:['score: 1']};
 let state=games.addGameReport(second.state,evidence,'Stars','needs-fix','Character resets.',first.game.id);assert.equal(state.reports[0].gameId,first.game.id);
 const mismatch=games.addGameReport(second.state,evidence,'Stars','worked','',second.game.id);assert.equal(mismatch.reports[0].gameId,undefined,'report cannot attach to a different source');
 state=games.addGameReport(state,{...evidence,checkKind:'smoke'},'Stars','not-reviewed','Automated check only.');
 games.saveCodeGames(state);assert.equal(games.loadCodeGames().games.length,2);assert.equal(games.loadCodeGames().reports[0].code,first.game.code);
 const restored=backup.validateBackup(JSON.stringify(backup.snapshotBackup()));assert.equal(restored.data['mana.code_games.v1'].reports[0].notes,'Character resets.');assert.equal(restored.data['mana.code_games.v1'].reports[1].checkKind,'smoke');assert.equal(restored.data['mana.code_games.v1'].reports[1].outcome,'not-reviewed');assert.match(backup.backupCounts(restored),/2 game versions/);
 delete restored.data['mana.code_games.v1'];assert.equal(backup.validateBackup(JSON.stringify(restored)).data['mana.code_games.v1'].games.length,0);
 state={games:[],reports:state.reports};games.saveCodeGames(state);assert.equal(games.loadCodeGames().reports[0].code,first.game.code,'deleting game versions retains tested source snapshots');
});
test('game report validation and revision prompts distinguish exact-source measurements from user feedback',()=>{
 const games=loader()('src/core/codeGames.ts');const evidence={code:'api.onFrame=()=>{};',startedAt:'2026-10-19T00:00:00Z',endedAt:'2026-10-19T00:00:01Z',elapsedMs:1000,frames:24,keysUsed:['ArrowRight'],reason:'stopped',detail:'Stopped.',logs:['score: 1']};
 for(const patch of [{frames:NaN},{frames:1.2},{elapsedMs:-1},{reason:'success'},{keysUsed:['Control']},{logs:['x'.repeat(301)]},{endedAt:'2025-01-01'}])assert.equal(games.validateRunEvidence({...evidence,...patch}),undefined);
 const report={...evidence,id:'run-1',title:'Stars',savedAt:'2026-10-19T01:00:00Z',outcome:'needs-fix',notes:'Player resets.'};
 const messages=games.gameDraftMessages('Fix movement',{code:evidence.code,reports:[report,{...report,id:'wrong',code:'other source',notes:'UNRELATED REPORT'}]});assert.match(messages[1].content,/Player resets/);assert.ok(!messages[1].content.includes('UNRELATED REPORT'));assert.match(messages[1].content,/not proof/);assert.match(messages[1].content,/has not been run/);
 assert.equal(games.validateCodeGames({games:[],reports:[{...report,outcome:'automatically verified'}]}).reports.length,0);
});

test('generated game syntax check never executes code and rejects broken drafts before replacement',()=>{
 const global={ran:false};const sandbox=loader({}, {globalThis:global})('src/core/codeSandbox.ts');
 assert.equal(sandbox.checkedSandboxDraft('globalThis.ran=true; api.onFrame=()=>{};'),'globalThis.ran=true; api.onFrame=()=>{};');assert.equal(global.ran,false);
 assert.equal(sandbox.checkedSandboxDraft('```js\napi.onFrame=()=>{};\n```'),'api.onFrame=()=>{};');
 let current=sandbox.SANDBOX_EXAMPLE;assert.throws(()=>{current=sandbox.checkedSandboxDraft('api.onFrame=()=>{api.circle(1,2,3,"#fff"));};');},/syntax error/);assert.equal(current,sandbox.SANDBOX_EXAMPLE);
 assert.equal(sandbox.checkedSandboxDraft('<think>plan</think>api.onFrame=()=>{};'),'api.onFrame=()=>{};');
});

test('game drafts use a scoped output allowance and reject truncation without changing chat defaults',async()=>{
 const bodies=[];let reason='stop';
 const load=loader({}, {fetch:async(url,options)=>{bodies.push(JSON.parse(options.body));const lines=[{choices:[{delta:{content:'api.onFrame=()=>{};'},finish_reason:null}]},{choices:[{delta:{},finish_reason:reason}]}].map(x=>'data: '+JSON.stringify(x)+'\n\n').join('')+'data: [DONE]\n\n';return {ok:true,body:{getReader(){let sent=false;return {read:async()=>sent?{done:true}:(sent=true,{done:false,value:new TextEncoder().encode(lines)})};}}};}});
 const llm=load('src/core/llm.ts');await llm.streamChat({port:8080,messages:[],temperature:.4,onToken(){}});assert.equal(bodies[0].max_tokens,700);
 await llm.streamChat({port:8080,messages:[],temperature:.4,maxTokens:2000,rejectTruncated:true,onToken(){}});assert.equal(bodies[1].max_tokens,2000);
 reason='length';await assert.rejects(llm.streamChat({port:8080,messages:[],temperature:.4,maxTokens:2000,rejectTruncated:true,onToken(){}}),/output limit/);
 await assert.rejects(llm.streamChat({port:8080,messages:[],temperature:.4,maxTokens:Infinity,onToken(){}}),/output limit/);
});
test('repaired power-up game keeps a timed speed boost without assigning to a constant',()=>{
 const sandbox=loader()('src/core/codeSandbox.ts');assert.equal(sandbox.checkedSandboxDraft(sandbox.SANDBOX_POWERUP_EXAMPLE),sandbox.SANDBOX_POWERUP_EXAMPLE);
 let result;const math=Object.create(Math);math.random=()=>.25;const self={postMessage:m=>result=m};vm.runInNewContext(sandbox.SANDBOX_WORKER,{self,Math:math});self.onmessage({data:{type:'start',code:sandbox.SANDBOX_POWERUP_EXAMPLE}});assert.equal(result.type,'ready');
 const tick=(keys={},dt=.1)=>{self.onmessage({data:{type:'tick',keys,dt}});assert.equal(result.type,'frame',result.error);return sandbox.validateSandboxFrame(result);};
 const player=r=>r.commands.filter(c=>c.type==='circle').at(-1).args;
 tick();let frame=tick({ArrowRight:true});assert.equal(player(frame)[0],142.5);frame=tick({ArrowRight:true});assert.equal(player(frame)[0],165);
 for(let i=0;i<60;i++)tick();frame=tick({ArrowRight:true});assert.equal(player(frame)[0],180);assert.match(frame.commands.filter(c=>c.type==='text')[1].args[0],/no hazards/);
});

test('automated smoke check runs real example worker through bounded isolated message protocol',async()=>{
 const realSandbox=loader()('src/core/codeSandbox.ts');let currentFrame,handler,pulse,removed=0,stopped=0;
 const listeners={};
 const document={visibilityState:'visible',addEventListener:(n,fn)=>listeners[n]=fn,removeEventListener:n=>delete listeners[n],createElement:()=>{const frame={setAttribute(n,v){this[n]=v;},remove(){removed++;},contentWindow:{postMessage(m){if(m.type==='stop'){stopped++;return;}queueMicrotask(()=>handler({data:m}));}}};currentFrame=frame;return frame;},body:{appendChild(frame){assert.equal(frame.sandbox,'allow-scripts');const self={postMessage:m=>queueMicrotask(()=>listeners.message?.({source:frame.contentWindow,data:m}))};vm.runInNewContext(realSandbox.SANDBOX_WORKER,{self});handler=self.onmessage;queueMicrotask(()=>listeners.message({source:frame.contentWindow,data:{type:'boot'}}));}}};
 const load=loader({}, {document,window:{addEventListener:(n,fn)=>listeners[n]=fn,removeEventListener:n=>delete listeners[n]},performance,setInterval:fn=>{pulse=fn;return 1;},clearInterval:()=>pulse=null,DOMException});
 const smoke=load('src/core/gameSmoke.ts');const result=await smoke.checkGameSmoke(realSandbox.SANDBOX_EXAMPLE);
 assert.equal(result.passed,true);assert.equal(result.evidence.frames,92);assert.equal(result.evidence.checkKind,'smoke');assert.deepEqual(Array.from(result.evidence.keysUsed).sort(),['ArrowDown','ArrowLeft','ArrowRight','ArrowUp','Space']);assert.equal(removed,1);assert.equal(stopped,1);assert.equal(pulse,null);assert.match(result.evidence.detail,/not verified/);
 const staticResult=await smoke.checkGameSmoke('api.onFrame=()=>{api.clear("#fff")};');assert.equal(staticResult.passed,true);assert.equal(staticResult.warnings.length,1,'static drawing is a warning, not proof of broken gameplay');
 const broken=await smoke.checkGameSmoke('api.onFrame=()=>{throw Error("bad tick")};');assert.equal(broken.passed,false);assert.equal(broken.evidence.frames,0);assert.match(broken.evidence.detail,/bad tick/);
 const blank=await smoke.checkGameSmoke('api.onFrame=()=>{};');assert.equal(blank.passed,false);assert.match(blank.evidence.detail,/no drawing/);
});
test('smoke check stops stalled workers, ignores foreign messages and aborts cleanly',async()=>{
 let now=0,pulse,frame,removed=0;const listeners={};const document={visibilityState:'visible',addEventListener:(n,fn)=>listeners[n]=fn,removeEventListener:n=>delete listeners[n],createElement:()=>frame={contentWindow:{postMessage(){}},setAttribute(){},remove(){removed++;}},body:{appendChild(){}}};
 const smoke=loader({}, {document,window:{addEventListener:(n,fn)=>listeners[n]=fn,removeEventListener:n=>delete listeners[n]},performance:{now:()=>now},setInterval:fn=>{pulse=fn;return 1;},clearInterval:()=>pulse=null,DOMException})('src/core/gameSmoke.ts');
 const pending=smoke.checkGameSmoke('api.onFrame=()=>{};');listeners.message({source:{},data:{type:'ready'}});now=2600;pulse();const result=await pending;assert.equal(result.passed,false);assert.equal(result.evidence.reason,'timeout');assert.equal(result.evidence.frames,0);assert.equal(removed,1);assert.equal(pulse,null);
 const controller=new AbortController();const cancelled=smoke.checkGameSmoke('api.onFrame=()=>{};',controller.signal);controller.abort();await assert.rejects(cancelled,/cancelled/);assert.equal(removed,2);assert.equal(pulse,null);
});

test('coding skill reviews require exact reviewed manual evidence and never inflate practice milestones',()=>{
 let seq=0;const load=loader({'./types':{uid:()=>String(++seq)}}),skills=load('src/core/skills.ts'),evidence=load('src/core/codingEvidence.ts');
 const game={id:'game1',rootId:'game1',version:1,title:'Stars',code:'api.onFrame=()=>{};',createdAt:'2026-10-19T00:00:00Z'};
 const report={id:'run1',gameId:game.id,title:'Stars',code:game.code,startedAt:game.createdAt,endedAt:'2026-10-19T00:00:01Z',elapsedMs:1000,frames:30,keysUsed:['ArrowRight','Space'],reason:'stopped',detail:'Stopped.',logs:[],savedAt:'2026-10-19T00:00:02Z',outcome:'worked',notes:'Movement and reset worked.'};
 assert.equal(evidence.codingSources({games:[game],reports:[report,{...report,id:'smoke',checkKind:'smoke'},{...report,id:'unreviewed',outcome:'not-reviewed'},{...report,id:'empty',frames:0},{...report,id:'wrong',code:'other'}]}).length,1);
 let entries=skills.confirmCodingCheck([],game,report,'movement','demonstrated','Held Right, then released; position stayed.',new Date('2026-10-19T01:00:00Z'));
 assert.equal(skills.codingProgress(entries).demonstrated,1);assert.equal(skills.practiceProgress(entries,'coding').count,0);assert.equal(skills.practiceProgress(entries,'coding').stage,0);
 assert.throws(()=>skills.confirmCodingCheck(entries,game,report,'movement','demonstrated','Duplicate'),/already/);
 entries=skills.confirmCodingCheck(entries,game,report,'restart','demonstrated','Space reset the score once.');assert.equal(entries.length,2);
 for(const changed of [{...report,checkKind:'smoke'},{...report,keysUsed:[]},{...report,frames:0},{...report,outcome:'not-reviewed'},{...report,outcome:'needs-fix'},{...report,reason:'error'}])assert.throws(()=>skills.confirmCodingCheck([],game,changed,'movement','demonstrated','Checked movement'),/manual run/);
 assert.throws(()=>skills.confirmCodingCheck([],game,{...report,code:'different'},'movement','demonstrated','Mismatch'),/exact/);
 const nextReport={...report,id:'run2',outcome:'needs-fix',reason:'error'};entries=skills.confirmCodingCheck(entries,game,nextReport,'movement','needs-work','Player snaps back in this later test.',new Date('2099-01-01T00:00:00Z'));
 assert.equal(skills.codingProgress(entries).latest.find(p=>p.assessment.criterion==='movement').assessment.result,'needs-work');assert.equal(entries.length,3);assert.equal(skills.codingProgress(entries.filter(p=>p.assessment.report.id!=='run2')).demonstrated,2);
});
test('coding assessment snapshots retain source and user limits through restart and backups',()=>{
 const values=new Map();let seq=0;const load=loader({'./types':{uid:()=>String(++seq)},'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}}),s=load('src/core/skills.ts'),backup=load('src/core/backup.ts');
 const game={id:'g',rootId:'g',title:'Stars',version:1,code:'api.onFrame=()=>{};',createdAt:'2026-10-19T00:00:00Z'};
 const report={id:'r',gameId:'g',title:'Stars',code:game.code,startedAt:game.createdAt,endedAt:'2026-10-19T00:00:01Z',elapsedMs:1000,frames:30,keysUsed:['ArrowRight'],reason:'stopped',detail:'Stopped.',logs:[],savedAt:'2026-10-19T00:00:02Z',outcome:'worked',notes:'Works.'};
 const entries=s.confirmCodingCheck([],game,report,'state','demonstrated','Position remained after release.');s.savePractice(entries);
 assert.equal(s.loadPractice()[0].assessment.report.code,game.code);const snapshot=backup.snapshotBackup();const restored=backup.validateBackup(JSON.stringify(snapshot));assert.equal(restored.data['mana.skills.v1'][0].assessment.game.version,1);
 values.set('mana.code_games.v1',JSON.stringify({games:[],reports:[]}));assert.equal(s.loadPractice()[0].assessment.report.id,'r');assert.match(s.skillsContext(s.loadPractice(),'How are my skills progressing?'),/limited examples/);assert.ok(!s.skillsContext(s.loadPractice(),'How are my skills progressing?').includes(game.code));
 const broken=JSON.parse(JSON.stringify(snapshot));broken.data['mana.skills.v1'][0].assessment.report.checkKind='smoke';assert.throws(()=>backup.validateBackup(JSON.stringify(broken)),/Invalid data/);
 const legacy={...entries[0],source:{id:'old',kind:'work',title:'Draft',outcome:'Reviewed only',createdAt:game.createdAt}};delete legacy.assessment;assert.equal(s.validatePractice([legacy]).length,1);
 assert.equal(values.has('mana.stats.v1'),false);assert.equal(values.has('mana.relationship.v1'),false);
});

test('playable game export escapes source and title and starts only inside its isolated frame',()=>{
 const load=loader(),sandbox=load('src/core/codeSandbox.ts'),exports=load('src/core/gameExport.ts');
 const source='const text="</script><script>globalThis.hacked=true</script>"; api.onFrame=()=>{api.clear("#000")};';
 const html=exports.exportPlayableGame('<img src=x onerror=alert(1)>',source);assert.match(html,/&lt;img/);assert.equal((html.match(/<script>/g)||[]).length,1);assert.equal((html.match(/<\/script>/g)||[]).length,1);assert.match(html,/connect-src 'none'/);assert.ok(!html.includes('allow-same-origin'));assert.throws(()=>exports.exportPlayableGame('Bad','api.onFrame=()=>{'),/syntax/);
 const nodes={game:{getContext:()=>({fillRect(){}}),focus(){}},run:{},stop:{},status:{},source:{},log:{}};let frame,pulse,removed=0;const events={},sent=[];const document={visibilityState:'visible',getElementById:id=>nodes[id],addEventListener:(name,fn)=>events[name]=fn,createElement:()=>frame={contentWindow:{postMessage:m=>sent.push(m)},setAttribute(name,value){this[name]=value;},remove(){removed++;}},body:{appendChild(){}}};
 const window={addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(html.match(/<script>([\s\S]*)<\/script>/)[1],{document,window,performance:{now:()=>0},setInterval:fn=>{pulse=fn;return 1;},clearInterval(){},globalThis:{hacked:false}});
 assert.equal(nodes.source.textContent,source);assert.equal(frame,undefined,'no worker/frame before explicit Run');
 nodes.run.onclick();assert.equal(frame.sandbox,'allow-scripts');assert.equal(frame.srcdoc,sandbox.sandboxFrame());
 events.message({source:{},data:{type:'boot'}});assert.equal(sent.filter(m=>m.type==='start').length,0);
 events.message({source:frame.contentWindow,data:{type:'boot'}});assert.equal(sent.at(-1).code,source);
 events.message({source:frame.contentWindow,data:{type:'ready'}});nodes.game.onkeydown({key:'ArrowRight',preventDefault(){}});pulse();assert.equal(sent.at(-1).keys.ArrowRight,true);
 nodes.stop.onclick();assert.equal(removed,1);assert.equal(nodes.run.disabled,false);assert.equal(nodes.stop.disabled,true);assert.equal(sent.at(-1).type,'stop');
});

test('multi-file projects run local modules and JSON once, preserve exact snapshots, reject escaping paths',()=>{
 const load=loader(),p=load('src/core/gameProject.ts'),games=load('src/core/codeGames.ts'),sandbox=load('src/core/codeSandbox.ts');
 const project={entry:'main.js',files:[{path:'main.js',content:'const player=require("./player"); const again=require("./player"); api.log(player===again); api.log(require("./level.json").speed); api.onFrame=()=>{};'},{path:'player.js',content:'module.exports={x:120};'},{path:'level.json',content:'{"speed":150}'}]};
 const source=p.bundleGameProject(project),logs=[];new Function('api',source)({log:v=>logs.push(v)});assert.deepEqual(logs,[true,150]);assert.equal(p.bundleGameProject(p.readGameProject(source)),source);assert.equal(sandbox.checkedSandboxDraft(JSON.stringify(project)),source);
 const saved=games.addCodeGame({games:[],reports:[]},'Project',source);const restored=games.validateCodeGames(JSON.parse(JSON.stringify(saved.state)));assert.equal(p.readGameProject(restored.games[0].code).files.length,3);
 const revision=games.gameDraftMessages('Fix movement',{code:source,reports:[]});assert.match(revision[0].content,/JSON object/);assert.match(revision[1].content,/player.js/);
 for(const request of ['../private','https://example.com','./missing']){const bad=p.bundleGameProject({entry:'main.js',files:[{path:'main.js',content:'require('+JSON.stringify(request)+');'}]});assert.throws(()=>new Function('api',bad)({}),/local project|Missing project/);}
 assert.throws(()=>p.bundleGameProject({entry:'main.js',files:[{path:'../main.js',content:''}]}));assert.equal(p.readGameProject(source+'\napi.log(1);'),undefined);
 assert.throws(()=>new Function('api',p.bundleGameProject({entry:'main.js',files:[{path:'main.js',content:'require("./bad.json");'},{path:'bad.json',content:'broken'}]}))({}));
});

test('game assets roundtrip through versions backups and offline exports without entering model prompts',()=>{
 const load=loader({'./persistence':{readStored:()=>null,writeStored(){}}}),project=load('src/core/gameProject.ts'),example=load('src/core/gameAssetExample.ts').GAME_ASSET_EXAMPLE,games=load('src/core/codeGames.ts'),backup=load('src/core/backup.ts');
 const source=project.bundleGameProject(example);assert.equal(project.readGameProject(source).assets.length,2);
 const state=games.addCodeGame({games:[],reports:[]},'Asset example',source).state;assert.equal(games.validateCodeGames(JSON.parse(JSON.stringify(state))).games[0].code,source);
 const snapshot=backup.snapshotBackup();snapshot.data['mana.code_games.v1']=state;assert.equal(backup.validateBackup(JSON.stringify(snapshot)).data['mana.code_games.v1'].games[0].code,source);
 const messages=games.gameDraftMessages('Improve movement',{code:source,reports:[]});assert.match(messages[1].content,/player.png/);assert.ok(!messages[1].content.includes('base64,'));
 const output=load('src/core/gameExport.ts').exportPlayableGame('Assets',source);assert.match(output,/img-src data:/);assert.match(output,/media-src data:/);assert.match(output,/data:image\/png;base64/);assert.match(output,/data:audio\/wav;base64/);assert.ok(Buffer.byteLength(output)<250000);
 const large=project.bundleGameProject({...example,assets:[{name:'large.png',data:'data:image/png;base64,'+'A'.repeat(79000)}]});assert.ok(large.length>16000);assert.equal(load('src/core/codeSandbox.ts').sandboxCode(large),large);assert.equal(games.validateCodeGames(games.addCodeGame({games:[],reports:[]},'Large',large).state).games.length,1);assert.ok(Buffer.byteLength(load('src/core/gameExport.ts').exportPlayableGame('Large',large))<250000);
 for(const assets of [[{name:'bad.svg',data:'data:image/svg+xml;base64,AAAA'}],[{name:'x.png',data:'https://example.com/x.png'}],[{name:'x.png',data:'data:audio/wav;base64,AAAA'}],[{name:'big.png',data:'data:image/png;base64,'+'A'.repeat(80000)}]])assert.throws(()=>project.bundleGameProject({...example,assets}));
});
test('asset rendering uses project media, bounds sound spam and stops all playing sounds',async()=>{
 let paused=0,played=0;class Image{complete=true;naturalWidth=8;naturalHeight=8;}class Audio{constructor(src){this.src=src;}play(){played++;return Promise.resolve();}pause(){paused++;}removeAttribute(){}}
 const load=loader({}, {Image,Audio,performance:{now:()=>1000}}),media=load('src/core/gameMedia.ts'),sandbox=load('src/core/codeSandbox.ts');
 const assets=[{name:'p.png',data:'data:image/png;base64,AAAA'},{name:'s.wav',data:'data:audio/wav;base64,AAAA'}],player=media.createGameMedia(assets),draws=[];
 player.draw({drawImage:(...a)=>draws.push(a)},'image',['p.png',10,20,32,32]);assert.equal(draws.length,1);
 player.draw({},'sound',['s.wav',.4]);player.draw({},'sound',['s.wav',.4]);assert.equal(played,1);player.stop();assert.equal(paused,1);player.draw({},'sound',['s.wav',.4]);assert.equal(played,1);
 assert.throws(()=>player.draw({},'image',['missing.png',0,0,20,20]),/Missing image/);
 sandbox.validateSandboxFrame({commands:[{type:'image',args:['p.png',0,0,20,20]},{type:'sound',args:['s.wav',.4]}],logs:[]});
 assert.throws(()=>sandbox.validateSandboxFrame({commands:[{type:'sound',args:['https://example.com',.5]}],logs:[]}));
 assert.throws(()=>sandbox.validateSandboxFrame({commands:[{type:'sound',args:['s.wav',2]}],logs:[]}));
 assert.throws(()=>sandbox.validateSandboxFrame({commands:Array.from({length:3},()=>({type:'sound',args:['s.wav',.5]})),logs:[]}));
});

test('asset example emits bounded media commands in the real worker and exported media stops on Stop',()=>{
 const load=loader(),sandbox=load('src/core/codeSandbox.ts'),project=load('src/core/gameProject.ts'),example=load('src/core/gameAssetExample.ts').GAME_ASSET_EXAMPLE,source=project.bundleGameProject(example),messages=[];
 const self={postMessage:m=>messages.push(m)};vm.runInNewContext(sandbox.SANDBOX_WORKER,{self});self.onmessage({data:{type:'start',code:source}});assert.equal(messages.at(-1).type,'ready');self.onmessage({data:{type:'tick',dt:1/30,keys:{Space:true}}});const output=messages.at(-1);sandbox.validateSandboxFrame(output);assert.ok(output.commands.some(c=>c.type==='image'));assert.ok(output.commands.some(c=>c.type==='sound'));
 let plays=0,pauses=0,draws=0;class Image{complete=true;naturalWidth=8;naturalHeight=8;}class Audio{play(){plays++;return Promise.resolve();}pause(){pauses++;}removeAttribute(){}}
 const html=load('src/core/gameExport.ts').exportPlayableGame('Asset example',source),nodes={game:{getContext:()=>({fillRect(){},fillText(){},drawImage(){draws++;}}),focus(){}},run:{},stop:{},status:{},source:{},log:{}};let frame,pulse;const events={};
 const document={visibilityState:'visible',getElementById:id=>nodes[id],addEventListener:(name,fn)=>events[name]=fn,createElement:()=>frame={contentWindow:{postMessage(){}},setAttribute(){},remove(){}},body:{appendChild(){}}},window={addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(html.match(/<script>([\s\S]*)<\/script>/)[1],{document,window,Image,Audio,performance:{now:()=>1000},setInterval:fn=>{pulse=fn;return 1;},clearInterval(){}});
 assert.equal(plays,0);nodes.run.onclick();events.message({source:frame.contentWindow,data:{type:'boot'}});events.message({source:frame.contentWindow,data:{type:'ready'}});pulse();events.message({source:frame.contentWindow,data:output});assert.equal(draws,1);assert.equal(plays,1);nodes.stop.onclick();assert.equal(pauses,1);
});
test('imported assets are decoded without playing and reject excessive duration or image size',async()=>{
 let plays=0;class Image{naturalWidth=4096;naturalHeight=8;set src(v){queueMicrotask(()=>this.onload?.());}}class Audio{duration=11;play(){plays++;}removeAttribute(){}set src(v){queueMicrotask(()=>this.onloadedmetadata?.());}}
 const media=loader({}, {Image,Audio,setTimeout,clearTimeout,queueMicrotask})('src/core/gameMedia.ts');await assert.rejects(media.inspectGameAsset('data:image/png;base64,AAAA'),/2048/);await assert.rejects(media.inspectGameAsset('data:audio/wav;base64,AAAA'),/10 seconds/);assert.equal(plays,0);
});

test('mouse input maps scaled canvas coordinates and preserves quick clicks until a tick',()=>{
 const events={};const window={addEventListener:(name,fn)=>events[name]=fn,removeEventListener:name=>delete events[name]};const load=loader({}, {window}),p=load('src/core/gamePointer.ts');let focused=0;
 const canvas={focus(){focused++;},getBoundingClientRect:()=>({left:10,top:20,width:960,height:560})},pointer=p.createGamePointer(canvas);
 const event={clientX:490,clientY:300,button:0,isPrimary:true,pointerId:1,preventDefault(){}};
 canvas.onpointerdown(event);canvas.onpointerup(event);let state=pointer.take();assert.equal(state.x,240);assert.equal(state.y,140);assert.equal(state.clicked,true);assert.equal(state.released,true);assert.equal(state.down,false);assert.equal(focused,1);assert.equal(pointer.take().clicked,false);
 canvas.onpointerdown({...event,button:2});assert.equal(pointer.take().clicked,false);canvas.onpointerdown({...event,isPrimary:false});assert.equal(pointer.take().clicked,false);
 canvas.onpointerdown(event);events.blur();state=pointer.take();assert.equal(state.clicked,false);assert.equal(state.down,false);canvas.onpointermove({...event,clientX:2000});assert.equal(pointer.take().inside,false);
 canvas.onpointerdown(event);canvas.onpointercancel();assert.equal(pointer.take().clicked,false);pointer.stop();assert.equal(canvas.onpointerdown,null);assert.equal(events.pointerup,undefined);
});
test('mouse example buttons change scenes once per click, allow target scoring and keep old games compatible',()=>{
 const load=loader(),sandbox=load('src/core/codeSandbox.ts'),example=load('src/core/gamePointer.ts').MOUSE_GAME_EXAMPLE,messages=[],self={postMessage:m=>messages.push(m)};
 vm.runInNewContext(sandbox.SANDBOX_WORKER,{self});self.onmessage({data:{type:'start',code:example}});assert.equal(messages.at(-1).type,'ready');
 const tick=mouse=>{self.onmessage({data:{type:'tick',dt:1/30,keys:{},mouse}});const out=messages.at(-1);assert.equal(out.type,'frame');sandbox.validateSandboxFrame(out);return out.commands;};
 assert.ok(tick().some(c=>c.type==='text'&&c.args[0]==='Start game'));
 tick({x:240,y:124,inside:true,clicked:true,down:false});let cmds=tick({x:250,y:140,inside:true,clicked:true});cmds=tick({x:250,y:140,inside:true,clicked:false,down:true});assert.ok(cmds.some(c=>c.args[0]==='Score: 1'));
 tick({x:400,y:20,inside:true,clicked:true});assert.ok(tick().some(c=>c.args[0]==='Start game'));
});
test('offline mouse controls deliver scaled quick clicks, clear held input on blur and detach on Stop',()=>{
 const load=loader(),html=load('src/core/gameExport.ts').exportPlayableGame('Mouse',load('src/core/gamePointer.ts').MOUSE_GAME_EXAMPLE),nodes={game:{getBoundingClientRect:()=>({left:0,top:0,width:960,height:560}),getContext:()=>({fillRect(){}}),focus(){}},run:{},stop:{},status:{},source:{},log:{}};let frame,pulse;const events={},sent=[];
 const document={visibilityState:'visible',getElementById:id=>nodes[id],addEventListener:(name,fn)=>events[name]=fn,createElement:()=>frame={contentWindow:{postMessage:m=>sent.push(m)},setAttribute(){},remove(){}},body:{appendChild(){}}};const window={addEventListener:(name,fn)=>events[name]=fn,removeEventListener:name=>delete events[name]};
 vm.runInNewContext(html.match(/<script>([\s\S]*)<\/script>/)[1],{document,window,performance:{now:()=>0},setInterval:fn=>{pulse=fn;return 1;},clearInterval(){}});
 nodes.run.onclick();events.message({source:frame.contentWindow,data:{type:'boot'}});events.message({source:frame.contentWindow,data:{type:'ready'}});
 const e={clientX:480,clientY:248,button:0,isPrimary:true,preventDefault(){}};nodes.game.onpointerdown(e);nodes.game.onpointerup(e);pulse();assert.equal(sent.at(-1).mouse.clicked,true);assert.equal(sent.at(-1).mouse.x,240);assert.equal(sent.at(-1).mouse.y,124);nodes.game.onblur();nodes.stop.onclick();assert.equal(nodes.game.onpointerdown,null);assert.equal(events.pointerup,undefined);
});

test('sprite demo loops walking frames, resets idle and clamps one-shot reactions in the real worker',()=>{
 const load=loader(),sandbox=load('src/core/codeSandbox.ts'),project=load('src/core/gameProject.ts'),example=load('src/core/gameSpriteExample.ts').GAME_SPRITE_EXAMPLE,source=project.bundleGameProject(example),messages=[],self={postMessage:m=>messages.push(m)};
 vm.runInNewContext(sandbox.SANDBOX_WORKER,{self});self.onmessage({data:{type:'start',code:source}});assert.equal(messages.at(-1).type,'ready');
 const tick=(dt,keys={})=>{self.onmessage({data:{type:'tick',dt,keys}});const out=messages.at(-1);assert.equal(out.type,'frame');sandbox.validateSandboxFrame(out);return out.commands.find(c=>c.type==='sprite').args;};
 assert.equal(tick(.1)[2],0);assert.equal(tick(.1,{ArrowRight:true})[1],0);let walk=tick(.125,{ArrowRight:true});assert.equal(walk[1],16);assert.equal(walk[2],16);assert.ok(walk[5]>210);assert.equal(tick(.375,{ArrowRight:true})[1],0);
 const idle=tick(.1);assert.equal(idle[1],0);assert.equal(idle[2],0);assert.equal(tick(.1,{Space:true})[2],32);tick(.1,{Space:true});const reaction=tick(.6,{Space:true});assert.equal(reaction[1],48);assert.equal(reaction[2],32);tick(.1,{Space:true});assert.equal(tick(.1,{Space:true})[2],0,'held Space must not restart reaction');
 const bad={type:'sprite',args:['character.png',-1,0,16,16,0,0,48,48]};assert.throws(()=>sandbox.validateSandboxFrame({commands:[bad],logs:[]}),/sprite/);assert.throws(()=>sandbox.validateSandboxFrame({commands:[{...bad,args:['character.png',0,0,16.5,16,0,0,48,48]}],logs:[]}));
});
test('sprite renderer crops exact rectangles, restores smoothing and rejects frames outside the sheet',()=>{
 class Image{complete=true;naturalWidth=64;naturalHeight=48;}
 const load=loader({}, {Image}),media=load('src/core/gameMedia.ts').createGameMedia([{name:'sheet.png',data:'data:image/png;base64,AAAA'}]),draws=[],ctx={imageSmoothingEnabled:true,drawImage(...args){assert.equal(this.imageSmoothingEnabled,false);draws.push(args);}};
 media.draw(ctx,'sprite',['sheet.png',16,16,16,16,100,80,48,48]);assert.deepEqual(draws[0].slice(1),[16,16,16,16,100,80,48,48]);assert.equal(ctx.imageSmoothingEnabled,true);assert.throws(()=>media.draw(ctx,'sprite',['sheet.png',60,0,16,16,0,0,48,48]),/dimensions/);
 const broken={imageSmoothingEnabled:true,drawImage(){throw Error('draw failed');}};assert.throws(()=>media.draw(broken,'sprite',['sheet.png',0,0,16,16,0,0,48,48]));assert.equal(broken.imageSmoothingEnabled,true);
});
test('sprite animation API rejects invalid rates, frame counts and rectangles without executing in the host',()=>{
 const sandbox=loader()('src/core/codeSandbox.ts');
 for(const call of ['api.animationFrame(1,0,4)','api.animationFrame(1,61,4)','api.animationFrame(-1,8,4)','api.animationFrame(1,8,0)','api.animationFrame(1,8,2.5)','api.sprite("sheet.png",2040,0,16,16,0,0,48,48)']){
  const messages=[],self={postMessage:m=>messages.push(m)};vm.runInNewContext(sandbox.SANDBOX_WORKER,{self});self.onmessage({data:{type:'start',code:call+';api.onFrame=()=>{};'}});assert.equal(messages.at(-1).type,'error');
 }
});
test('standalone sprite exports retain the sheet and render cropped frames offline',()=>{
 const load=loader(),project=load('src/core/gameProject.ts'),example=load('src/core/gameSpriteExample.ts').GAME_SPRITE_EXAMPLE,source=project.bundleGameProject(example),games=load('src/core/codeGames.ts');assert.equal(project.readGameProject(games.addCodeGame({games:[],reports:[]},'Sprites',source).game.code).assets[0].data,example.assets[0].data);
 const html=load('src/core/gameExport.ts').exportPlayableGame('Sprites',source);let frame,pulse;const events={},draws=[],nodes={game:{getContext:()=>({fillRect(){},drawImage(...a){draws.push(a);}}),focus(){}},run:{},stop:{},status:{},source:{},log:{}};
 class Image{complete=true;naturalWidth=64;naturalHeight=48;}
 const document={visibilityState:'visible',getElementById:id=>nodes[id],addEventListener:(n,f)=>events[n]=f,createElement:()=>frame={contentWindow:{postMessage(){}},setAttribute(){},remove(){}},body:{appendChild(){}}},window={addEventListener:(n,f)=>events[n]=f,removeEventListener:n=>delete events[n]};
 vm.runInNewContext(html.match(/<script>([\s\S]*)<\/script>/)[1],{document,window,Image,performance:{now:()=>0},setInterval:f=>{pulse=f;return 1;},clearInterval(){}});nodes.run.onclick();events.message({source:frame.contentWindow,data:{type:'boot'}});events.message({source:frame.contentWindow,data:{type:'ready'}});pulse();events.message({source:frame.contentWindow,data:{type:'frame',commands:[{type:'sprite',args:['character.png',16,16,16,16,80,90,48,48]}],logs:[]}});assert.equal(draws.length,1);assert.deepEqual(draws[0].slice(1),[16,16,16,16,80,90,48,48]);nodes.stop.onclick();
});

test('tile collision sweeps stop fast movement, slide along walls and enforce world bounds',()=>{
 const tools=loader()('src/core/gameTiles.ts').createTileTools(()=>{}),map=tools.tileMap(['....','.##.','....','....'],20,10,30);
 const player={x:12,y:52,w:10,h:10};const right=map.move(player,200,0);assert.equal(right.x,20);assert.equal(right.hitX,true);assert.equal(player.x,12,'movement must not mutate old state');
 const left=map.move({x:78,y:52,w:10,h:10},-200,0);assert.equal(left.x,70);
 const down=map.move({x:35,y:32,w:10,h:10},0,200);assert.equal(down.y,40);assert.equal(down.hitY,true);
 const up=map.move({x:35,y:95,w:10,h:10},0,-200);assert.equal(up.y,70);
 const slide=map.move(player,100,20);assert.equal(slide.x,20);assert.equal(slide.y,72);assert.equal(slide.hitX,true);assert.equal(slide.hitY,false);
 const edge=map.move({x:12,y:92,w:10,h:10},-200,200);assert.equal(edge.x,10);assert.equal(edge.y,100);
 assert.equal(tools.overlaps({x:0,y:0,w:10,h:10},{x:10,y:0,w:10,h:10}),false);assert.equal(tools.overlaps({x:0,y:0,w:10,h:10},{x:9,y:0,w:10,h:10}),true);
 assert.throws(()=>map.move({x:35,y:55,w:10,h:10},1,0),/clear of walls/);assert.throws(()=>map.move(player,Infinity,0));assert.throws(()=>tools.tileMap(['....','..'],20));assert.throws(()=>tools.tileMap(Array(32).fill('.'.repeat(32)),20));assert.throws(()=>tools.tileMap(['..'],0));
});
test('tile rendering merges adjacent wall cells within the existing draw budget',()=>{
 const draws=[],tools=loader()('src/core/gameTiles.ts').createTileTools((...a)=>draws.push(a)),rows=['###.','##..'];const map=tools.tileMap(rows,10,5,8);rows[0]='....';map.draw('#abc');assert.deepEqual(draws,[[5,8,30,10,'#abc'],[5,18,20,10,'#abc']]);
});
test('maze example blocks walls, reaches the goal through its gap, resets and runs in exported worker code',()=>{
 const load=loader(),sandbox=load('src/core/codeSandbox.ts'),project=load('src/core/gameProject.ts'),example=load('src/core/gameTileExample.ts').GAME_TILE_EXAMPLE,source=project.bundleGameProject(example),messages=[],self={postMessage:m=>messages.push(m)};
 vm.runInNewContext(sandbox.SANDBOX_WORKER,{self});self.onmessage({data:{type:'start',code:source}});assert.equal(messages.at(-1).type,'ready');
 const tick=(keys={},dt=.1)=>{self.onmessage({data:{type:'tick',dt,keys}});const out=messages.at(-1);assert.equal(out.type,'frame');sandbox.validateSandboxFrame(out);return out.commands;};const box=commands=>commands.find(c=>c.type==='rect'&&c.args[4]==='#ffc636').args;
 let commands;for(let i=0;i<20;i++)commands=tick({ArrowRight:true});assert.equal(box(commands)[0],188);assert.ok(commands.some(c=>String(c.args[0]).startsWith('Wall blocked')));
 tick({Space:true});for(let i=0;i<9;i++)commands=tick({ArrowDown:true});assert.ok(box(commands)[1]>=180&&box(commands)[1]<=188);
 for(let i=0;i<15;i++)commands=tick({ArrowRight:true});assert.ok(box(commands)[0]>220);
 for(let i=0;i<9;i++)commands=tick({ArrowUp:true});for(let i=0;i<20;i++)commands=tick({ArrowRight:true});assert.ok(commands.some(c=>String(c.args[0]).startsWith('Goal reached')));
 commands=tick({Space:true});assert.equal(box(commands)[0],64);assert.equal(box(commands)[1],84);
 const html=load('src/core/gameExport.ts').exportPlayableGame('Maze',source);assert.match(html,/tileMap/);assert.match(html,/level.json/);const literal=html.match(/const worker=("(?:[^"\\]|\\.)*")/);/* Export serializes the same tested worker in its escaped frame document. */assert.ok(html.includes('rectangular ASCII tile map'));
 const stored=load('src/core/codeGames.ts').addCodeGame({games:[],reports:[]},'Maze',source);assert.equal(project.readGameProject(stored.game.code).files.find(f=>f.path==='level.json').content,example.files[1].content);
});

test('game progress is bounded isolated per game and survives normal saves and backups',()=>{
 const values=new Map(),load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}}),games=load('src/core/codeGames.ts'),p=load('src/core/gameProgress.ts');
 games.writeGameProgress('one',{best:12,level:3,settings:{bright:true}});games.writeGameProgress('two',{best:2});assert.equal(games.readGameProgress('one').best,12);assert.equal(games.readGameProgress('two').best,2);assert.equal(games.readGameProgress('other'),undefined);
 const saved=games.addCodeGame(games.loadCodeGames(),'Game','api.onFrame=()=>{};');games.saveCodeGames(saved.state);assert.equal(games.readGameProgress('one').best,12);
 const backup=load('src/core/backup.ts'),snapshot=backup.snapshotBackup(),restored=backup.validateBackup(JSON.stringify(snapshot));assert.equal(restored.data['mana.code_games.v1'].progress[0].value.level,3);
 assert.equal(p.gameProgressScope('a'),p.gameProgressScope('a'));assert.notEqual(p.gameProgressScope('a'),p.gameProgressScope('b'));
 for(const value of [[],null,{x:Infinity},{x:'a'.repeat(257)},JSON.parse('{"__proto__":{}}'),{x:Array(65).fill(1)}])assert.throws(()=>p.gameProgressValue(value));
 games.writeGameProgress('one',{});assert.equal(Object.keys(games.readGameProgress('one')).length,0);
});
test('isolated game progress loads defaults and reports saved or failed host acknowledgement',()=>{
 const sandbox=loader()('src/core/codeSandbox.ts'),messages=[],self={postMessage:m=>messages.push(m)};
 vm.runInNewContext(sandbox.SANDBOX_WORKER,{self});self.onmessage({data:{type:'start',progress:{best:7},code:'const p=api.loadProgress({best:0}); api.saveProgress({best:p.best+1}); api.onFrame=()=>api.text(api.progressStatus,0,20,"#fff");'}});assert.equal(messages[0].type,'saveProgress');assert.equal(messages[0].value.best,8);assert.equal(messages.at(-1).type,'ready');self.onmessage({data:{type:'progressResult',ok:true}});self.onmessage({data:{type:'tick',dt:.03,keys:{}}});assert.equal(messages.at(-1).commands[0].args[0],'saved');self.onmessage({data:{type:'progressResult',ok:false}});self.onmessage({data:{type:'tick',dt:.03,keys:{}}});assert.equal(messages.at(-1).commands[0].args[0],'error');
});
test('exported game progress survives reopen, stays separate by game and acknowledges unavailable storage',()=>{
 const load=loader(),exporter=load('src/core/gameExport.ts'),values=new Map();
 function open(scope,fail=false){const html=exporter.exportPlayableGame('Progress','api.onFrame=()=>{};',scope),nodes={game:{getContext:()=>({fillRect(){}}),focus(){}},run:{},stop:{},status:{},source:{},log:{}};let frame;const events={},sent=[];const document={visibilityState:'visible',getElementById:k=>nodes[k],addEventListener:(n,f)=>events[n]=f,createElement:()=>frame={contentWindow:{postMessage:m=>sent.push(m)},setAttribute(){},remove(){}},body:{appendChild(){}}},window={addEventListener:(n,f)=>events[n]=f,removeEventListener:n=>delete events[n]};
 vm.runInNewContext(html.match(/<script>([\s\S]*)<\/script>/)[1],{document,window,Date,localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');values.set(k,v);}},performance:{now:()=>0},setInterval:()=>1,clearInterval(){}});nodes.run.onclick();const send=data=>events.message({source:frame.contentWindow,data});send({type:'boot'});return {send,sent,nodes};}
 const first=open('one');first.send({type:'saveProgress',value:{best:9}});assert.equal(first.sent.at(-1).ok,true);first.nodes.stop.onclick();assert.equal(open('one').sent.at(-1).progress.best,9);assert.equal(open('two').sent.at(-1).progress,undefined);
 const blocked=open('blocked',true);blocked.send({type:'saveProgress',value:{best:4}});assert.equal(blocked.sent.at(-1).ok,false);assert.match(blocked.nodes.status.textContent,/could not be saved/);
});

test('visual level brushes preserve metadata, protect markers and detect blocked routes',()=>{
 const load=loader(),editor=load('src/core/gameLevelEditor.ts'),example=load('src/core/gameTileExample.ts').GAME_TILE_EXAMPLE;const original=editor.parseMazeLevel(example.files[1].content);original.custom={music:'theme'};
 assert.equal(editor.mazeHasRoute(original),true);const blocked=editor.paintMazeLevel(original,8,6,'wall');assert.equal(editor.mazeHasRoute(blocked),false);assert.equal(original.rows[6][8],'.');assert.equal(blocked.custom.music,'theme');const reopened=editor.paintMazeLevel(blocked,8,6,'floor');assert.equal(editor.mazeHasRoute(reopened),true);
 assert.throws(()=>editor.paintMazeLevel(original,1,1,'wall'),/spawn or goal/);assert.throws(()=>editor.paintMazeLevel(original,18,1,'spawn'),/different/);const moved=editor.paintMazeLevel(original,8,2,'spawn');assert.equal(moved.rows[2][8],'.');assert.equal(moved.spawn.col,8);assert.equal(editor.parseMazeLevel(JSON.stringify(moved)).spawn.row,2);
 for(const value of [{...original,rows:['#..','..']},{...original,tileSize:10},{...original,offsetY:200},{...original,spawn:{col:0,row:0}},{...original,goal:original.spawn}])assert.throws(()=>editor.parseMazeLevel(JSON.stringify(value)));
});
test('visual level apply preserves project files and exports the edited maze for the actual worker',()=>{
 const load=loader(),project=load('src/core/gameProject.ts'),editor=load('src/core/gameLevelEditor.ts'),example=load('src/core/gameTileExample.ts').GAME_TILE_EXAMPLE;const level=editor.paintMazeLevel(editor.parseMazeLevel(example.files[1].content),4,3,'wall'),source=project.bundleGameProject({...example,files:example.files.map(f=>f.path==='level.json'?{...f,content:JSON.stringify(level)}:f)});
 assert.equal(project.readGameProject(source).files.find(f=>f.path==='main.js').content,example.files[0].content);const self={postMessage:m=>messages.push(m)},messages=[];vm.runInNewContext(load('src/core/codeSandbox.ts').SANDBOX_WORKER,{self});self.onmessage({data:{type:'start',code:source}});assert.equal(messages.at(-1).type,'ready');self.onmessage({data:{type:'tick',dt:.03,keys:{}}});assert.equal(messages.at(-1).type,'frame');assert.ok(messages.at(-1).commands.some(c=>c.type==='rect'&&c.args[0]===120&&c.args[1]===120&&c.args[4]==='#546080'));assert.match(load('src/core/gameExport.ts').exportPlayableGame('Edited maze',source),/level.json/);
});
test('visual editor groups drag strokes into undo and applies only explicitly',()=>{
 const load=loader(),content=load('src/core/gameTileExample.ts').GAME_TILE_EXAMPLE.files[1].content,slots=[],deps=[],events={};let index=0;const effects=[],applied=[];
 const react={useState:init=>{const i=index++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef:init=>{const i=index++;return slots[i]??(slots[i]={current:init});},useEffect:(fn,d)=>{const i=index++;if(!deps[i]||d.some((v,j)=>v!==deps[i][j])){deps[i]=d;effects.push(fn);}}};const jsx=(type,props)=>({type,props}),module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/GameLevelEditor.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:load('src/core/gameLevelEditor.ts'),window:{addEventListener:(n,f)=>events[n]=f,removeEventListener(){},confirm:()=>true}});
 function render(){index=0;const tree=module.exports.default({content,supportsStars:true,disabled:false,onApply:value=>applied.push(value)});while(effects.length)effects.shift()();return tree;}
 function find(node,predicate){if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of [node.props?.children].flat(Infinity)){const hit=find(child,predicate);if(hit)return hit;}}
 const button=(tree,label)=>find(tree,n=>n.type==='button'&&n.props.children===label),cell=(tree,col,row)=>find(tree,n=>n.type==='button'&&n.props['aria-label']?.endsWith(`column ${col}, row ${row}`));let tree=render();
 cell(tree,0,0).props.onPointerDown({button:0,isPrimary:true,preventDefault(){},currentTarget:{focus(){}}});cell(tree,3,2).props.onPointerEnter({buttons:1,isPrimary:true});events.pointerup();tree=render();assert.equal(applied.length,0);assert.equal(button(tree,'Undo paint').props.disabled,false);button(tree,'Undo paint').props.onClick();tree=render();assert.equal(button(tree,'Apply level').props.disabled,true);button(tree,'Redo paint').props.onClick();tree=render();assert.equal(button(tree,'Apply level').props.disabled,false);button(tree,'Apply level').props.onClick();assert.equal(JSON.parse(applied[0]).rows[2][3],'#');button(tree,'Star').props.onClick();tree=render();cell(tree,2,2).props.onPointerDown({button:0,isPrimary:true,preventDefault(){},currentTarget:{focus(){}}});events.pointerup();tree=render();assert.equal(cell(tree,2,2).props.children,'★');button(tree,'Apply level').props.onClick();assert.equal(JSON.parse(applied[1]).stars[0].col,2);button(tree,'Undo paint').props.onClick();tree=render();assert.notEqual(cell(tree,2,2).props.children,'★');
});

test('complete game combines modules assets menus collision pickups animation and durable win progress',()=>{
 const values=new Map(),load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}}),project=load('src/core/gameProject.ts'),example=load('src/core/gameIntegrationExample.ts').GAME_INTEGRATION_EXAMPLE,sandbox=load('src/core/codeSandbox.ts'),games=load('src/core/codeGames.ts'),source=project.bundleGameProject(example);
 const stored=games.addCodeGame({games:[],reports:[]},'Star maze',source);games.saveCodeGames(stored.state);const scope=stored.game.rootId;let now=1000,commands=[],sounds=0,saves=0;const frames=[];
 function boot(){const self={postMessage:m=>{if(m.type==='saveProgress'){games.writeGameProgress(scope,m.value);saves++;self.onmessage({data:{type:'progressResult',ok:true}});}else if(m.type==='frame'){sandbox.validateSandboxFrame(m);commands=m.commands;frames.push(commands);sounds+=commands.filter(c=>c.type==='sound').length;}else if(m.type==='error')assert.fail(m.error);}};vm.runInNewContext(sandbox.SANDBOX_WORKER,{self,Date:{now:()=>now}});self.onmessage({data:{type:'start',code:source,progress:games.readGameProgress(scope)}});return self;}
 let worker=boot();function tick(keys={},mouse){now+=100;worker.onmessage({data:{type:'tick',dt:.1,keys,mouse}});return commands;}const click=(x,y)=>tick({}, {x,y,inside:true,clicked:true});
 tick();assert.ok(commands.some(c=>c.args[0]==='Star maze - complete game check'));click(220,120);assert.equal(games.readGameProgress(scope).bright,true);click(100,120);
 for(let i=0;i<20;i++)tick({ArrowRight:true});let sprite=commands.find(c=>c.type==='sprite').args;assert.equal(sprite[5]+2,188);assert.equal(games.readGameProgress(scope).best,10);
 for(let i=0;i<9;i++)tick({ArrowDown:true});for(let i=0;i<2;i++)tick({ArrowLeft:true});for(let i=0;i<15;i++)tick({ArrowRight:true});for(let i=0;i<9;i++)tick({ArrowUp:true});for(let i=0;i<20;i++)tick({ArrowRight:true});
 assert.ok(commands.some(c=>c.args[0]==='Goal! Space: replay'));assert.equal(commands.filter(c=>c.type==='circle').length,0);assert.ok(sounds>=4);assert.ok(frames.some(frame=>frame.some(c=>c.type==='sprite'&&c.args[2]===16)));assert.equal(commands.find(c=>c.type==='sprite').args[2],32);assert.equal(games.readGameProgress(scope).best,50);assert.equal(games.readGameProgress(scope).wins,1);assert.equal(games.readGameProgress(scope).unlocked,2);assert.ok(saves>=5);
 worker=boot();tick();assert.ok(commands.some(c=>String(c.args[0]).includes('Best: 50 | Wins: 1 | Unlocked: 2')));assert.equal(commands.find(c=>c.type==='clear').args[0],'#39466b');click(100,120);tick({Space:true});assert.equal(games.readGameProgress(scope).best,50);
 const backup=load('src/core/backup.ts'),restored=backup.validateBackup(JSON.stringify(backup.snapshotBackup()));assert.equal(restored.data['mana.code_games.v1'].progress[0].value.wins,1);assert.equal(project.readGameProject(restored.data['mana.code_games.v1'].games[0].code).assets.length,2);
});
test('complete game visual edits retain modules and export self-contained playable source',()=>{
 const load=loader(),project=load('src/core/gameProject.ts'),example=load('src/core/gameIntegrationExample.ts').GAME_INTEGRATION_EXAMPLE,editor=load('src/core/gameLevelEditor.ts'),levelFile=example.files.find(f=>f.path==='level.json');const edited=editor.paintMazeLevel(editor.parseMazeLevel(levelFile.content),4,3,'wall');assert.equal(editor.mazeHasRoute(edited),true);
 const source=project.bundleGameProject({...example,files:example.files.map(f=>f.path==='level.json'?{...f,content:JSON.stringify(edited)}:f)}),restored=project.readGameProject(source);assert.equal(restored.files.length,4);assert.equal(restored.assets.length,2);assert.equal(JSON.parse(restored.files.find(f=>f.path==='level.json').content).rows[3][4],'#');
 const html=load('src/core/gameExport.ts').exportPlayableGame('Star maze',source,'star-maze');assert.ok(Buffer.byteLength(html)<250000);assert.match(html,/player.js/);assert.match(html,/data:image\/png;base64/);assert.match(html,/data:audio\/wav;base64/);assert.match(html,/saveProgress/);
 const messages=[],self={postMessage:m=>messages.push(m)};vm.runInNewContext(load('src/core/codeSandbox.ts').SANDBOX_WORKER,{self});self.onmessage({data:{type:'start',code:source}});assert.equal(messages.at(-1).type,'ready');self.onmessage({data:{type:'tick',dt:.03,keys:{},mouse:{x:100,y:120,inside:true,clicked:true}}});self.onmessage({data:{type:'tick',dt:.03,keys:{}}});assert.equal(messages.at(-1).type,'frame');assert.ok(messages.at(-1).commands.some(c=>c.type==='rect'&&c.args[0]===120&&c.args[1]===120&&c.args[4]==='#546080'));
});

test('star brush saves unique placements, erases them and validates reachable collectible cells',()=>{
 const load=loader(),e=load('src/core/gameLevelEditor.ts'),example=load('src/core/gameIntegrationExample.ts').GAME_INTEGRATION_EXAMPLE,level=e.parseMazeLevel(example.files.find(f=>f.path==='level.json').content);assert.equal(level.stars.length,3);
 const placed=e.paintMazeLevel(level,3,2,'star');assert.equal(placed.stars.length,4);assert.equal(e.paintMazeLevel(placed,3,2,'star').stars.length,4);assert.equal(e.paintMazeLevel(placed,3,2,'floor').stars.length,3);assert.equal(e.paintMazeLevel(placed,3,2,'wall').stars.length,3);assert.equal(e.paintMazeLevel(placed,3,2,'goal').stars.length,3);assert.throws(()=>e.paintMazeLevel(level,1,1,'star'),/away/);
 for(const stars of [[{col:0,row:0}],[{col:1,row:1}],[{col:4,row:1},{col:4,row:1}],Array(33).fill({col:2,row:2})])assert.throws(()=>e.parseMazeLevel(JSON.stringify({...level,stars})));
 const blocked={...level,rows:level.rows.map((r,y)=>y===6?r.slice(0,8)+'#'+r.slice(9):r),goal:{col:2,row:1}};assert.equal(e.mazeHasRoute(blocked),false,'all stars, not only goal, must be reachable');
});
test('legacy star projects upgrade narrowly and edited placements drive actual pickups and exports',()=>{
 const load=loader(),e=load('src/core/gameLevelEditor.ts'),project=load('src/core/gameProject.ts'),example=load('src/core/gameIntegrationExample.ts').GAME_INTEGRATION_EXAMPLE;
 const legacy={...example,files:example.files.map(f=>f.path==='main.js'?{...f,content:f.content.replace('(level.stars??[]).map(p=>cell(p.col,p.row))',e.LEGACY_STAR_POSITIONS)}:f.path==='level.json'?{...f,content:JSON.stringify({...JSON.parse(f.content),stars:undefined})}:f)};
 const upgraded=e.enableStarPlacement(legacy);assert.equal(upgraded.assets,legacy.assets);assert.equal(upgraded.files.find(f=>f.path==='player.js').content,legacy.files.find(f=>f.path==='player.js').content);assert.equal(JSON.parse(upgraded.files.find(f=>f.path==='level.json').content).stars.length,3);assert.match(upgraded.files[0].content,/level.stars/);assert.throws(()=>e.enableStarPlacement(example),/supported legacy/);
 const edited={...JSON.parse(upgraded.files.find(f=>f.path==='level.json').content),stars:[{col:2,row:1}]},source=project.bundleGameProject({...upgraded,files:upgraded.files.map(f=>f.path==='level.json'?{...f,content:JSON.stringify(edited)}:f)}),messages=[],self={postMessage:m=>messages.push(m)};
 vm.runInNewContext(load('src/core/codeSandbox.ts').SANDBOX_WORKER,{self});self.onmessage({data:{type:'start',code:source}});self.onmessage({data:{type:'tick',dt:.1,keys:{},mouse:{x:100,y:120,inside:true,clicked:true}}});self.onmessage({data:{type:'tick',dt:.1,keys:{}}});assert.equal(messages.at(-1).commands.filter(c=>c.type==='circle').length,1);
 self.onmessage({data:{type:'tick',dt:.1,keys:{ArrowRight:true}}});assert.equal(messages.at(-1).commands.filter(c=>c.type==='circle').length,0);assert.ok(messages.at(-1).commands.some(c=>String(c.args[0]).startsWith('Score: 10')));
 assert.equal(JSON.parse(project.readGameProject(source).files.find(f=>f.path==='level.json').content).stars[0].col,2);assert.match(load('src/core/gameExport.ts').exportPlayableGame('Placed stars',source),/stars/);
});

test('avatar backgrounds persist through wardrobe resolution and backups with safe legacy defaults',()=>{
 const values=new Map(),load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}}),avatar=load('src/core/avatar.ts'),wardrobe=load('src/core/wardrobe.ts'),backgrounds=load('src/core/backgrounds.ts');
 const image='data:image/jpeg;base64,AAAA';avatar.saveAvatarConfig({...avatar.DEFAULT_AVATAR,view:'half',background:'custom',backgroundImage:image});const cfg=avatar.loadAvatarConfig();assert.equal(cfg.background,'custom');assert.equal(cfg.backgroundImage,image);const entry={name:'default',unlocked:true,isDefault:true};const resolved=wardrobe.resolveLoadout(cfg,{skins:[entry],outfits:[entry],hairs:[entry],accessories:[]});assert.equal(resolved.background,'custom');assert.equal(resolved.backgroundImage,image);assert.equal(resolved.view,'half');
 const b=load('src/core/backup.ts'),snapshot=b.snapshotBackup();assert.equal(b.validateBackup(JSON.stringify(snapshot)).data['mana.avatar.v1'].backgroundImage,image);
 assert.equal(backgrounds.backgroundImage(avatar.validateAvatarConfig({}).background),undefined);assert.equal(backgrounds.backgroundImage('night').startsWith('data:image/svg+xml,'),true);
 for(const value of ['https://example.com/x.jpg','file:///private.jpg','data:image/svg+xml;base64,AAAA','data:image/png;base64,'+'A'.repeat(450000)])assert.equal(avatar.validateAvatarConfig({background:'custom',backgroundImage:value}).background,'none');assert.equal(avatar.validateAvatarConfig({background:'constructor'}).background,undefined);
});
test('background importing scales a local image and revokes its temporary URL on success or decode error',async()=>{
 let revoked=0,drawn=0,canvas;class Image{naturalWidth=2400;naturalHeight=1200;set src(value){queueMicrotask(()=>this.onload());}}
 const load=loader({}, {Image,queueMicrotask,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL:()=>revoked++},document:{createElement:()=>canvas={getContext:()=>({drawImage(){drawn++;}}),toDataURL:()=> 'data:image/jpeg;base64,AAAA'}}}),backgrounds=load('src/core/backgrounds.ts');
 assert.equal(await backgrounds.importBackground({type:'image/png',size:5000}),'data:image/jpeg;base64,AAAA');assert.equal(canvas.width,1600);assert.equal(canvas.height,800);assert.equal(drawn,1);assert.equal(revoked,1);await assert.rejects(backgrounds.importBackground({type:'image/svg+xml',size:10}),/Choose/);await assert.rejects(backgrounds.importBackground({type:'image/png',size:10000001}),/Choose/);
 class BadImage{set src(value){queueMicrotask(()=>this.onerror());}}
 const bad=loader({}, {Image:BadImage,queueMicrotask,URL:{createObjectURL:()=> 'blob:bad',revokeObjectURL:()=>revoked++}})('src/core/backgrounds.ts');await assert.rejects(bad.importBackground({type:'image/png',size:10}),/Could not open/);assert.equal(revoked,2);
});

test('seasonal outfit assignments survive persistence backups and missing assets without changing the current outfit',()=>{
 const values=new Map(),load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}}),a=load('src/core/avatar.ts'),seasons=load('src/core/seasonalLooks.ts'),w=load('src/core/wardrobe.ts');
 const cfg={...a.DEFAULT_AVATAR,view:'half',background:'night'},look=seasons.currentSeasonLook(cfg,'summer');look.outfit='future-summer';a.saveAvatarConfig({...cfg,seasonCalendar:'south',seasonalLooks:{summer:look}});const loaded=a.loadAvatarConfig();assert.equal(loaded.outfit,'default');assert.equal(loaded.seasonalLooks.summer.outfit,'future-summer');assert.equal(loaded.seasonCalendar,'south');
 const entry={name:'default',unlocked:true,isDefault:true},data={skins:[entry],outfits:[entry],hairs:[entry],accessories:[]},applied=w.resolveLoadout({...loaded,...loaded.seasonalLooks.summer},data);assert.equal(applied.outfit,'default');assert.equal(applied.seasonalLooks.summer.outfit,'future-summer');assert.equal(applied.background,'night');assert.equal(applied.view,'half');const available=w.resolveLoadout({...loaded,...loaded.seasonalLooks.summer},{...data,outfits:[entry,{name:'future-summer',unlocked:true}]});assert.equal(available.outfit,'future-summer');
 const backup=load('src/core/backup.ts');assert.equal(backup.validateBackup(JSON.stringify(backup.snapshotBackup())).data['mana.avatar.v1'].seasonalLooks.summer.outfit,'future-summer');assert.equal(a.validateAvatarConfig({}).seasonalLooks,undefined);assert.equal(Object.keys(seasons.seasonalAssignments({spring:{...look,name:''},summer:look,evil:look})).join(','),'summer');
});
test('season calendar uses journal timezone and explicit hemispheres rather than assumed weather',()=>{
 const s=loader()('src/core/seasonalLooks.ts');assert.equal(s.seasonForDate(new Date('2026-03-01T00:00:00Z'),'north','Asia/Singapore'),'spring');assert.equal(s.seasonForDate(new Date('2026-03-01T00:00:00Z'),'south','Asia/Singapore'),'autumn');assert.equal(s.seasonForDate(new Date('2026-05-31T20:00:00Z'),'north','Asia/Singapore'),'summer');assert.equal(s.seasonForDate(new Date('2026-05-31T20:00:00Z'),'north','America/Los_Angeles'),'spring');assert.equal(s.seasonForDate(new Date('2026-12-10T00:00:00Z'),'south','Asia/Singapore'),'summer');assert.equal(s.seasonMonths('winter','south'),'June–August');
});
test('seasonal wardrobe UI separates assignment from applying and can clear it independently',()=>{
 const load=loader(),a=load('src/core/avatar.ts'),entry={name:'default',label:'Default',unlocked:true,isDefault:true};let cfg={...a.DEFAULT_AVATAR,background:'garden',view:'bust'};const data={skins:[entry],outfits:[entry],hairs:[entry],accessories:[]},module={exports:{}},jsx=(type,props)=>({type,props});
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/SeasonalLooks.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?{useState:()=>['',()=>{}]}:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id.includes('wardrobe')?load('src/core/wardrobe.ts'):load('src/core/seasonalLooks.ts')});
 const render=()=>module.exports.default({cfg,data,timeZone:'Asia/Singapore',onChange:next=>cfg=next});function find(node,label){if(!node||typeof node!=='object')return;if(node.type==='button'&&node.props.children===label)return node;for(const c of [node.props?.children].flat(Infinity)){const hit=find(c,label);if(hit)return hit;}}
 let tree=render();find(tree,'Assign current look').props.onClick();assert.equal(cfg.outfit,'default');assert.equal(cfg.seasonalLooks.spring.name,'Spring look');assert.equal(cfg.background,'garden');tree=render();find(tree,'Apply look').props.onClick();assert.equal(cfg.view,'bust');assert.equal(cfg.background,'garden');tree=render();find(tree,'Clear assignment').props.onClick();assert.equal(cfg.seasonalLooks.spring,undefined);assert.equal(cfg.outfit,'default');
});

test('daily outfits choose only approved eligible pools once per morning or night across restart',()=>{
 const load=loader(),r=load('src/core/outfitRoutine.ts'),a=load('src/core/avatar.ts');const entry=name=>({name,unlocked:true,isDefault:name==='default'}),data={skins:[entry('default')],hairs:[entry('default')],outfits:[entry('default'),entry('casual')],accessories:[]},look=(name,outfit)=>({name,skin:'default',hairstyle:'default',outfit,accessories:[]});
 const cfg={...a.DEFAULT_AVATAR,view:'bust',background:'night',outfitRoutine:{enabled:true,morning:'08:00',night:'20:00',pools:{morning:[look('Default','default'),look('Casual','casual')],night:[look('Sleep','default')]}}};
 const morning=r.chooseDailyOutfit(cfg,data,new Date('2026-10-19T00:00:00Z'),'Asia/Singapore',()=>0);assert.equal(morning.outfit,'casual');assert.equal(morning.outfitRoutine.last.period,'2026-10-19:morning');assert.equal(morning.view,'bust');assert.equal(morning.background,'night');assert.equal(cfg.outfit,'default');
 const restored=a.validateAvatarConfig(JSON.parse(JSON.stringify(morning)));assert.equal(r.chooseDailyOutfit(restored,data,new Date('2026-10-19T01:00:00Z'),'Asia/Singapore'),undefined);assert.equal(r.chooseDailyOutfit(restored,data,new Date('2026-10-18T23:59:00Z'),'Asia/Singapore'),undefined);
 const night=r.chooseDailyOutfit(restored,data,new Date('2026-10-19T12:00:00Z'),'Asia/Singapore',()=>0);assert.equal(night.outfit,'default');assert.equal(night.outfitRoutine.last.period,'2026-10-19:night');assert.equal(r.chooseDailyOutfit(night,data,new Date('2026-10-19T23:59:00Z'),'Asia/Singapore'),undefined);assert.equal(r.chooseDailyOutfit(night,data,new Date('2026-10-20T00:00:00Z'),'Asia/Singapore').outfit,'casual');
 const catchup=r.chooseDailyOutfit(restored,data,new Date('2026-11-01T13:00:00Z'),'Asia/Singapore');assert.equal(catchup.outfitRoutine.last.period,'2026-11-01:night');assert.equal(r.outfitPeriod(new Date('2026-10-18T23:59:00Z'),'Asia/Singapore',cfg.outfitRoutine).id,'2026-10-18:night');
});
test('daily outfit pools skip unavailable items, deduplicate combinations and preserve empty/disabled behavior',()=>{
 const load=loader(),r=load('src/core/outfitRoutine.ts'),a=load('src/core/avatar.ts'),entry={name:'default',unlocked:true,isDefault:true},data={skins:[entry],outfits:[entry,{name:'locked',unlocked:false}],hairs:[entry],accessories:[]},look={name:'Plain',skin:'default',hairstyle:'default',outfit:'default',accessories:[]};
 const routine=r.validateOutfitRoutine({enabled:true,morning:'25:00',night:'00:00',pools:{morning:[look,{...look,name:'Duplicate'},{...look,name:'Locked',outfit:'locked'},{...look,name:'Missing',accessories:['missing']}],night:[]}});assert.equal(routine.morning,'08:00');assert.equal(routine.pools.morning.length,3);
 const cfg={...a.DEFAULT_AVATAR,outfitRoutine:routine},now=new Date('2026-10-19T00:00:00Z');assert.equal(r.chooseDailyOutfit(cfg,data,now,'Asia/Singapore').outfitRoutine.last.look,'Plain');assert.equal(r.chooseDailyOutfit({...cfg,outfitRoutine:{...routine,enabled:false}},data,now,'Asia/Singapore'),undefined);assert.equal(r.chooseDailyOutfit(cfg,data,new Date('2026-10-19T12:00:00Z'),'Asia/Singapore'),undefined);assert.equal(r.chooseDailyOutfit({...cfg,outfitRoutine:{...routine,pools:{morning:[{...look,outfit:'locked'}],night:[]}}},data,now,'Asia/Singapore'),undefined);
});
test('approved daily outfit pools and schedule history survive backups and wardrobe resolution',()=>{
 const values=new Map(),load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}}),a=load('src/core/avatar.ts'),r=load('src/core/outfitRoutine.ts'),w=load('src/core/wardrobe.ts'),look={name:'Morning',skin:'default',outfit:'default',hairstyle:'default',accessories:[]},entry={name:'default',unlocked:true,isDefault:true},data={skins:[entry],outfits:[entry],hairs:[entry],accessories:[]};
 const initial={...a.DEFAULT_AVATAR,outfitRoutine:r.validateOutfitRoutine({enabled:true,pools:{morning:[look],night:[look]}})},chosen=r.chooseDailyOutfit(initial,data,new Date('2026-10-19T00:00:00Z'),'Asia/Singapore');a.saveAvatarConfig(chosen);assert.equal(a.loadAvatarConfig().outfitRoutine.last.period,'2026-10-19:morning');assert.equal(w.resolveLoadout(chosen,data).outfitRoutine.pools.night[0].name,'Morning');const backup=load('src/core/backup.ts');assert.equal(backup.validateBackup(JSON.stringify(backup.snapshotBackup())).data['mana.avatar.v1'].outfitRoutine.enabled,true);assert.equal(a.validateAvatarConfig({}).outfitRoutine,undefined);
});

test('manual local image generation bounds prompts paths sizes seeds and quality controls',()=>{
 const g=loader()('src/core/imageGeneration.ts'),request={model:'photon_v1.safetensors',prompt:' an apple ',negative:'blurry',width:512,height:512,steps:20,cfg:7,seed:42,cpu:false};assert.equal(g.imageGenerationRequest(request).prompt,'an apple');
 for(const changes of [{model:'../private.safetensors'},{model:'folder\\private.safetensors'},{prompt:''},{width:4096},{height:513},{steps:0},{steps:51},{cfg:NaN},{seed:-1},{seed:4294967296},{cpu:'yes'}])assert.throws(()=>g.imageGenerationRequest({...request,...changes}));assert.equal(g.imageGenerationRequest({...request,model:'NetaYumev35_pretrained_all_in_one.safetensors',cfg:4,width:1024,height:1024}).width,1024);
});

test('closing image generation during startup cancels only its owned job and never polls a replacement',async()=>{
 const slots=[],deps=[],effects=[],cleanup=[],calls=[];let index=0,startResolve;const load=loader(),jsx=(type,props)=>({type,props}),module={exports:{}};
 const react={useState:init=>{const i=index++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return [slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];},useRef:init=>{const i=index++;return slots[i]??(slots[i]={current:init});},useEffect:(fn,d)=>{const i=index++;if(!deps[i]){deps[i]=d;effects.push(fn);}}};
 const invoke=(name,args)=>{calls.push({name,args});if(name==='image_generation_discover')return Promise.resolve({models:[{name:'photon_v1.safetensors',kind:'sd1'}],engineReady:true,netaReady:true,folder:'local'});if(name==='image_generation_start')return new Promise(resolve=>startResolve=resolve);return Promise.resolve();};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/ImageGenerationDrawer.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='@tauri-apps/api/core'?{invoke}:id.includes('imageSession')?load('src/core/imageSession.ts'):id.includes('imageGeneration')?load('src/core/imageGeneration.ts'):{prepareImage(){}},setTimeout:()=>1,clearTimeout(){}});
 const props={available:true,onClose(){},onSave(){assert.fail('No image should be saved');}};function render(){index=0;const tree=module.exports.default(props);while(effects.length)cleanup.push(effects.shift()());return tree;}function find(node,predicate){if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const c of [node.props?.children].flat(Infinity)){const hit=find(c,predicate);if(hit)return hit;}}
 render();await Promise.resolve();let tree=render();find(tree,n=>n.type==='textarea').props.onChange({target:{value:'a red apple'}});tree=render();find(tree,n=>n.type==='button'&&n.props.children==='Generate picture').props.onClick();await new Promise(setImmediate);assert.ok(startResolve);cleanup.forEach(fn=>{if(typeof fn==='function')fn();});startResolve('owned-image-job');await new Promise(setImmediate);assert.equal(calls.filter(c=>c.name==='image_generation_poll').length,0);assert.equal(calls.find(c=>c.name==='image_generation_stop').args.jobId,'owned-image-job');
});
test('chat picture requests distinguish creation from questions and select explicit local backend',()=>{
 const g=loader()('src/core/imageGeneration.ts');
 for(const text of ['draw me a moonlit garden','Mana, please draw a moonlit garden','Can you draw me a moonlit garden'])assert.equal(g.requestedPicture(text).prompt,'moonlit garden');
 assert.equal(g.requestedPicture('Mana create an image of a silver-haired girl using NetaYume').backend,'neta');
 assert.equal(g.requestedPicture('generate a picture of a cat using Photon').backend,'photon');
 assert.equal(g.requestedPicture('make a picture of a cat with Stable Diffusion').prompt,'a cat');
 for(const text of ['How do I generate an image?','I want to discuss image generation','Do not draw a cat','draw conclusions from this','draw attention to this','generate an image','draw me something','"draw me a cat"','draw me '+ 'x'.repeat(1501)])assert.equal(g.requestedPicture(text),null,text);
});

test('chat picture launch selects NetaYume starts once and reports only the completed result',async()=>{
 const slots=[],deps=[],effects=[],calls=[];let index=0,completed=0;const load=loader(),jsx=(type,props)=>({type,props}),module={exports:{}};
 const react={useState:init=>{const i=index++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef:init=>{const i=index++;return slots[i]??(slots[i]={current:init});},useEffect:(fn,d)=>{const i=index++;if(!deps[i]||d.some((v,j)=>!Object.is(v,deps[i][j]))){deps[i]=d;effects.push(fn);}}};
 const invoke=async(name,args)=>{calls.push({name,args});if(name==='image_generation_discover')return {models:[{name:'photon_v1.safetensors',kind:'sd1'},{name:'NetaYume.safetensors',kind:'neta'}],engineReady:true,netaReady:true};if(name==='image_generation_start')return 'chat-owned-job';if(name==='image_generation_poll')return {stage:'ready',path:'local.jpg'};if(name==='image_generation_result')return new ArrayBuffer(4);};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/ImageGenerationDrawer.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='@tauri-apps/api/core'?{invoke}:id.includes('imageSession')?load('src/core/imageSession.ts'):id.includes('imageGeneration')?load('src/core/imageGeneration.ts'):{prepareImage:async()=> 'prepared-jpeg'},setTimeout:()=>1,clearTimeout(){},File:class{constructor(parts,name){this.name=name;}},Uint8Array,AbortController});
 const props={inline:true,available:true,initialRequest:{prompt:'a moonlit garden',backend:'neta',referenceAvatar:true},prepareReference:async()=> 'data:image/jpeg;base64,/9j/AA==',onClose(){},onSave(){assert.fail('Save must remain explicit');},onGenerated:image=>{completed++;assert.equal(image.dataUrl,'prepared-jpeg');}};
 function render(){index=0;const tree=module.exports.default(props);assert.equal(tree.type,'section');assert.equal(tree.props.className,'chat-picture-job');assert.equal(tree.props.role,undefined);while(effects.length)effects.shift()();}
 render();await new Promise(setImmediate);assert.equal(completed,0);render();await new Promise(setImmediate);render();await new Promise(setImmediate);
 const starts=calls.filter(c=>c.name==='image_generation_start');assert.equal(starts.length,1);assert.equal(starts[0].args.request.model,'NetaYume.safetensors');assert.equal(starts[0].args.request.width,768);assert.equal(starts[0].args.request.height,1024);assert.equal(starts[0].args.request.referenceStrength,.45);assert.match(starts[0].args.request.prompt,/same single character/);assert.equal(starts[0].args.request.cfg,4);assert.equal(starts[0].args.request.reference,'data:image/jpeg;base64,/9j/AA==');assert.equal(completed,1);
});


test('generated chat pictures survive reload archives and backups without entering model text',()=>{
 const values=new Map(),load=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}}),settings=load('src/core/settings.ts'),image={filename:'garden.jpg',dataUrl:'data:image/jpeg;base64,/9j/AA=='},messages=[{id:'u1',role:'user',content:'Draw a garden'},{id:'p1',role:'assistant',content:'Here is your picture. [happy]',generatedPicture:image}];
 settings.saveChat(messages);const restored=settings.loadChat();assert.equal(restored[1].generatedPicture.dataUrl,image.dataUrl);
 const archives=load('src/core/chatArchives.ts'),archive=archives.newChatArchive(restored);archives.saveChatArchives([archive]);assert.equal(archives.loadChatArchives()[0].messages[1].generatedPicture.filename,'garden.jpg');
 const backup=load('src/core/backup.ts');assert.equal(backup.validateBackup(JSON.stringify(backup.snapshotBackup())).data['mana.chat.v1'][1].generatedPicture.dataUrl,image.dataUrl);
 assert.equal(load('src/core/chatSearch.ts').searchChat(restored,'garden.jpg','Mana')[0],'p1');const exported=load('src/core/chatExport.ts').conversationText(restored,'Mana','User');assert.match(exported,/Generated picture: garden.jpg/);assert.ok(!exported.includes('/9j/'));
 const payload=load('src/core/llm.ts').buildPayload('system',[...restored,{id:'u2',role:'user',content:'thanks'}]);assert.ok(!JSON.stringify(payload).includes('/9j/'));assert.ok(!('generatedPicture' in payload[1]));
});

test('chat picture persistence rejects unsafe URLs user-role images and oversized payloads',()=>{
 const validate=loader()('src/core/settings.ts').validateChat,picture={filename:'scene.jpg',dataUrl:'data:image/jpeg;base64,/9j/AA=='};
 for(const value of [{...picture,dataUrl:'https://external/image.jpg'},{...picture,dataUrl:'data:text/html;base64,AAAA'},{...picture,filename:'x'.repeat(201)},{...picture,filename:''}])assert.equal(validate([{role:'assistant',content:'picture',generatedPicture:value}])[0].generatedPicture,undefined);
 assert.equal(validate([{role:'user',content:'picture',generatedPicture:picture}])[0].generatedPicture,undefined);
 const large={...picture,dataUrl:'data:image/jpeg;base64,/9j/'+'AAAA'.repeat(700000)},checked=validate([1,2,3].map(i=>({id:'p'+i,role:'assistant',content:'picture',generatedPicture:large})));assert.ok(checked[0].generatedPicture);assert.ok(checked[1].generatedPicture);assert.equal(checked[2].generatedPicture,undefined);
});


test('Animagine is preferred by default and explicit checkpoint choices never silently switch models',()=>{
 const g=loader()('src/core/imageGeneration.ts'),photon={name:'photon_v1.safetensors',kind:'sd1'},anime={name:'animagine-xl-4.0-opt.safetensors',kind:'sdxl'},neta={name:'NetaYume.safetensors',kind:'neta'},models=[photon,neta,anime];
 assert.equal(g.choosePictureModel(models).name,anime.name);assert.equal(g.choosePictureModel(models,'animagine').name,anime.name);assert.equal(g.choosePictureModel(models,'photon').name,photon.name);assert.equal(g.choosePictureModel(models,'neta').name,neta.name);
 assert.equal(g.choosePictureModel([photon]).name,photon.name);assert.equal(g.choosePictureModel([photon],'animagine'),undefined);assert.equal(g.choosePictureModel([anime],'photon'),undefined);
 assert.equal(g.requestedPicture('draw me a cat using Animagine').backend,'animagine');assert.equal(g.requestedPicture('draw me a cat using Animagine').prompt,'cat');
 assert.equal(g.pictureDetails('Mana-animagine-xl-4.0-opt-42.jpg'),'Model: animagine-xl-4.0-opt · Seed: 42');assert.equal(g.pictureDetails('old-import.jpg'),'');
});


test('conversation openers send background once and bound evidence without altering saved source',()=>{
 const load=loader(),i=load('src/core/initiative.ts'),ground=load('src/core/conversation.ts').ACTIVITY_GROUNDING,context='CURRENT IDENTITY\nUser: Aishi\n'+JSON.stringify({huge:'x'.repeat(40000)})+'\nLatest fact: image generation passed';
 const payload=i.initiativePayload('Character rules',context,8192);assert.equal(payload[0].content.includes('User: Aishi'),false);assert.equal(payload[1].content.split('User: Aishi').length,2);assert.ok(payload[1].content.includes('Latest fact: image generation passed'));assert.ok(payload[1].content.includes(ground));assert.ok(JSON.stringify(payload).length<16000);assert.equal(context.length>40000,true);assert.ok(!payload[1].content.includes('{"huge"'));
 const normal=load('src/core/llm.ts').buildPayload('rules',[{id:'u',role:'user',content:'Hi'}]);assert.equal(normal.map(m=>m.content).join('\n').split(ground).length,2);
});


test('self portrait requests use avatar reference and invalid reference payloads cannot start jobs',()=>{
 const g=loader()('src/core/imageGeneration.ts');assert.equal(g.requestedPicture('draw yourself in a new outfit').referenceAvatar,true);assert.equal(g.requestedPicture('create an image of Mana in a garden').referenceAvatar,true);assert.equal(g.requestedPicture('draw me a cat').referenceAvatar,undefined);
 const request={model:'animagine-xl-4.0-opt.safetensors',prompt:'outfit concept',negative:'blurry',width:1024,height:1024,steps:20,cfg:7,seed:42,cpu:false};
 assert.equal(g.imageGenerationRequest({...request,reference:'data:image/jpeg;base64,/9j/AA=='}).reference,'data:image/jpeg;base64,/9j/AA==');for(const reference of ['https://remote/image.jpg','C:/private.jpg','data:text/html;base64,AAAA','x'.repeat(1_000_001)])assert.throws(()=>g.imageGenerationRequest({...request,reference}));
});

test('image gallery searches thumbnails sorts dates and selects without changing saved data',()=>{
 const slots=[];let index=0;const jsx=(type,props)=>({type,props}),module={exports:{}},images=[{id:'old',filename:'garden.jpg',dataUrl:'jpeg',createdAt:'2026-10-19T00:00:00Z'},{id:'new',filename:'cat.jpg',dataUrl:'jpeg2',createdAt:'2026-10-20T00:00:00Z'}];
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/SavedImagesDrawer.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?{useState:init=>{const i=index++;if(!(i in slots))slots[i]=init;return [slots[i],v=>slots[i]=v];}}:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id.includes('GeneratedPictureView')?{default:()=>null}:loader()('src/core/savedImages.ts')});
 const props={images,editable:true,onDelete(){assert.fail('Selection must not delete');},onLabel(){assert.fail('Selection must not label');},onClose(){}};
 function render(){index=0;return module.exports.default(props);}function all(node,predicate,result=[]){if(!node||typeof node!=='object')return result;if(predicate(node))result.push(node);for(const child of [node.props?.children].flat(Infinity))all(child,predicate,result);return result;}
 let tree=render();assert.equal(tree.type,'section');assert.equal(tree.props.className,'music-studio image-gallery');assert.equal(tree.props.role,undefined);assert.equal(all(tree,n=>n.props?.className==='scrim').length,0);assert.equal(all(tree,n=>n.type==='button'&&n.props.children==='Back to chat').length,1);let thumbs=all(tree,n=>n.type==='button'&&n.props['aria-label']?.startsWith('View '));assert.equal(thumbs[0].props['aria-label'],'View cat.jpg');thumbs[0].props.onClick();tree=render();assert.equal(all(tree,n=>n.type==='h3')[0].props.children,'cat.jpg');
 all(tree,n=>n.type==='input'&&n.props.type==='search')[0].props.onChange({target:{value:'garden'}});tree=render();assert.equal(all(tree,n=>n.type==='button'&&n.props['aria-label']?.startsWith('View ')).length,1);assert.equal(images.length,2);
});
test('disk gallery metadata exceeds legacy count and byte caps while rejecting arbitrary paths',()=>{
 const load=loader(),g=load('src/core/savedImages.ts'),record=n=>({id:'disk-'+n,diskId:'disk-'+n,filename:'scene-'+n+'.jpg',dataUrl:'data:image/jpeg;base64,/9j/AA==',createdAt:'2026-10-21T00:00:00Z',byteSize:100000,fingerprint:n.toString(16).padStart(64,'0')});
 const many=Array.from({length:125},(_,i)=>record(i+1)),checked=g.validateSavedImages(many);assert.equal(checked.length,125);assert.equal(checked.reduce((size,i)=>size+i.byteSize,0),12500000);
 assert.equal(g.validateSavedImages([{...record(1),diskId:'../private'}]).length,0);assert.equal(g.validateSavedImages([{...record(1),fingerprint:'bad'}]).length,0);
 const values=new Map([['mana.images.v1',JSON.stringify(many)]]),backup=loader({'./persistence':{readStored:k=>values.get(k)??null,writeStored:(k,v)=>values.set(k,v)}})('src/core/backup.ts');assert.equal(backup.validateBackup(JSON.stringify(backup.snapshotBackup())).data['mana.images.v1'].length,125);
});

test('disk gallery migration preserves IDs and recovery source, loads full bytes and deduplicates saves',async()=>{
 const files=new Map(),calls=[],jpeg='data:image/jpeg;base64,/9j/AA==',thumb='data:image/jpeg;base64,/9j/AB==';let failId='';
 const invoke=async(name,args)=>{calls.push({name,args});if(name==='gallery_write'){if(args.id===failId)throw Error('disk full');files.set(args.id,args.bytes);}if(name==='gallery_read')return files.get(args.id);};
 const globals={Uint8Array,ArrayBuffer,Blob,atob,btoa,crypto:require('node:crypto').webcrypto,createImageBitmap:async()=>({width:1280,height:640,close(){}}),document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){}}),toDataURL:()=>thumb})}};
 const load=loader({'@tauri-apps/api/core':{invoke}},globals),d=load('src/core/diskGallery.ts'),old=[{id:'old-one',filename:'one.jpg',dataUrl:jpeg,createdAt:'2026-10-19T00:00:00Z',depictsAvatar:true}];
 const migrated=await d.migrateGallery(old);assert.equal(calls[0].name,'gallery_preserve_legacy');assert.equal(JSON.parse(calls[0].args.content)[0].dataUrl,jpeg);assert.equal(old[0].dataUrl,jpeg);assert.equal(old[0].diskId,undefined);assert.equal(migrated[0].id,'old-one');assert.equal(migrated[0].depictsAvatar,true);assert.equal(migrated[0].dataUrl,thumb);assert.equal(migrated[0].diskId,'old-one');
 const full=await d.fullGalleryImage(migrated[0]);assert.equal(full.dataUrl,jpeg);const writes=calls.filter(c=>c.name==='gallery_write').length,again=await d.addDiskImage(migrated,{filename:'same.jpg',dataUrl:jpeg});assert.equal(again.imageId,'old-one');assert.equal(calls.filter(c=>c.name==='gallery_write').length,writes);
 failId='old-two';await assert.rejects(d.migrateGallery([...old,{...old[0],id:'old-two'}]),/disk full/);assert.equal(old[0].dataUrl,jpeg);assert.equal(old.length,1);
});


test('self reference instructions preserve requested changes and variation stays bounded',()=>{
 const g=loader()('src/core/imageGeneration.ts'),prompt=g.avatarPicturePrompt('yourself in a red summer dress with short hair');assert.match(prompt,/reference character/);assert.match(prompt,/except for changes explicitly requested/);assert.match(prompt,/red summer dress with short hair/);assert.ok(!prompt.includes('yourself'));
 const request={model:'animagine.safetensors',prompt:'portrait',negative:'',width:768,height:1024,steps:20,cfg:7,seed:42,cpu:false};for(const referenceStrength of [NaN,0,.19,.81,2])assert.throws(()=>g.imageGenerationRequest({...request,referenceStrength}));for(const referenceStrength of [.2,.45,.8])assert.equal(g.imageGenerationRequest({...request,referenceStrength}).referenceStrength,referenceStrength);
});


test('clothing edit bounds leave the head above the outfit untouched and allow skirt width',()=>{
 const r=loader()('src/core/avatarReference.ts'),pixels=new Uint8ClampedArray(10*20*4);for(let y=8;y<18;y++)for(let x=3;x<7;x++)pixels[(y*10+x)*4+3]=255;
 const bounds=r.clothingBounds(pixels,10,20);assert.equal(bounds.y,8);assert.ok(bounds.x<3);assert.ok(bounds.width>4);assert.equal(bounds.y+bounds.height<=20,true);assert.equal(r.clothingBounds(new Uint8ClampedArray(80),2,10),null);
 const g=loader()('src/core/imageGeneration.ts');assert.equal(g.isClothingChange('yourself in a summer dress'),true);assert.equal(g.isClothingChange('yourself reading a book'),false);assert.match(g.avatarPicturePrompt('yourself in a summer dress',true),/Replace the original clothing/);
 const request={model:'animagine.safetensors',prompt:'dress',negative:'',width:768,height:1024,steps:20,cfg:7,seed:42,cpu:false,referenceStrength:.75};assert.throws(()=>g.imageGenerationRequest({...request,referenceMask:'data:image/jpeg;base64,/9j/AA=='}));assert.throws(()=>g.imageGenerationRequest({...request,reference:'data:image/jpeg;base64,/9j/AA==',referenceMask:'https://remote/mask'}));assert.equal(g.imageGenerationRequest({...request,reference:'data:image/jpeg;base64,/9j/AA==',referenceMask:'data:image/jpeg;base64,/9j/AA=='}).referenceStrength,.75);
});


test('Animagine clothing requests lead with the target garment without instruction prose',()=>{
 const g=loader()('src/core/imageGeneration.ts'),prompt=g.avatarPicturePrompt('yourself in a red summer dress',true,'animagine-xl-4.0-opt.safetensors');assert.match(prompt,/^1girl, solo, red summer dress/);assert.ok(!prompt.includes('Replace'));assert.ok(!prompt.includes('hoodie'));assert.match(g.clothingNegative('yourself in a summer dress','blurry','animagine-xl-4.0-opt.safetensors'),/hoodie/);assert.equal(g.clothingNegative('yourself in a dress with a hoodie','blurry','animagine-xl-4.0-opt.safetensors'),'blurry');assert.equal(g.clothingNegative('yourself in a dress','blurry','NetaYume.safetensors'),'blurry');
});

test('image session releases GPU lease once on success error and cancellation during startup',async()=>{
 const {imageSession}=loader()('src/core/imageSession.ts');
 for(const mode of ['success','failure','cancel']){
  let released=0,stopped=0;const gate=deferred();
  const session=imageSession(async()=>{await gate.promise;if(mode==='failure')throw Error('start failed');return 'owned';},async id=>{assert.equal(id,'owned');stopped++;},async()=>async()=>{released++;});
  const start=session.start();await flush();
  const ending=mode==='cancel'?session.stop():null;gate.resolve();
  if(mode==='failure')await assert.rejects(start,/start failed/);else await start;
  if(mode==='success')await session.complete();
  await (ending??session.stop());await session.stop();assert.equal(released,1);assert.equal(stopped,mode==='failure'?0:1);
 }
});
test('image cancellation while acquiring GPU never starts an image and restores the lease',async()=>{
 const {imageSession}=loader()('src/core/imageSession.ts'),gate=deferred();let started=0,released=0;
 const session=imageSession(async()=>{started++;return 'job';},async()=>{},()=>gate.promise);
 const begin=session.start(),end=session.stop();gate.resolve(async()=>{released++;});await begin;await end;assert.equal(started,0);assert.equal(released,1);
});
test('GPU image handoff restores owned chat once and respects an explicit Stop',async()=>{
 for(const manualStop of [false,true]){
  const calls=[];const h=lifecycle(async()=> 'down',async(name)=>{calls.push(name);return name==='pause_llama_for_image';},true);
  let state=h.render();await flush();const release=await state.pauseForImage();state=h.render();assert.equal(state.imageBusy,true);
  await state.start();assert.equal(calls.includes('start_llama'),false);
  if(manualStop)await state.stop();await release();await release();
  assert.equal(calls.filter(n=>n==='start_llama').length,manualStop?0:1);assert.equal(h.render().imageBusy,false);h.dispose();
 }
});
test('GPU image handoff leaves externally started chat untouched',async()=>{
 const calls=[];const h=lifecycle(async()=> 'ok',async name=>{calls.push(name);return false;},true);
 const state=h.render();await flush();await assert.rejects(state.pauseForImage(),/outside Mana/);assert.deepEqual(calls,['pause_llama_for_image']);assert.equal(h.render().imageBusy,false);h.dispose();
});

test('clothing mask protection respects visible layer order instead of hidden back hair',async()=>{
 const load=loader(),a=load('src/core/avatarReference.ts');
 // One torso pixel is covered by back hair, then opaque body/outfit, then no front hair.
 // A visible front-hair pixel is drawn last and remains protected.
 const blend=(old,alpha,op)=>op==='destination-out'?old*(1-alpha):alpha+old*(1-alpha);
 let torso=0,visibleHair=0;
 for(const [key,torsoAlpha,hairAlpha] of [['hairstyles/default/HAIR_BACK.png',1,1],['base/default/BODY.png',1,1],['outfits/default/OUTFIT.png',1,1],['hairstyles/default/HAIR_FRONT.png',0,1]]){
  torso=blend(torso,torsoAlpha,a.protectionOperation(key));visibleHair=blend(visibleHair,hairAlpha,a.protectionOperation(key));
 }
 assert.equal(torso,0);assert.equal(visibleHair,1);
 assert.equal(a.protectionOperation('accessories/glasses.png'),'source-over');
});

test('outfit quality defaults preserve explicit footwear and dress construction requests',()=>{
 const g=loader()('src/core/imageGeneration.ts');
 const plain=g.animagineClothingPrompt('yourself in a summer dress.');assert.match(plain,/wide shoulder straps/);assert.match(plain,/closed-toe shoes/);assert.ok(!plain.includes('dress.'));
 const explicit=g.animagineClothingPrompt('yourself in a strapless summer dress with sandals');assert.ok(!explicit.includes('wide shoulder straps'));assert.ok(!explicit.includes('closed-toe shoes'));
 assert.equal(g.outfitQualityDefaults('animagine-xl.safetensors',true).steps,28);assert.equal(g.outfitQualityDefaults('animagine-xl.safetensors',true).cfg,5.5);assert.equal(g.outfitQualityDefaults('animagine-xl.safetensors',false).steps,20);
});

test('outfit generation uses body anatomy without old clothing while vision retains dressed avatar',()=>{
 const avatar=loader()('src/core/avatar.ts'),refs=loader()('src/core/avatarReference.ts');
 const fixture=assets(['base/body.png','outfits/default/outfit.png','hairstyles/default/hair_front.png','hairstyles/default/hair_back.png','eyes/eye_neutral.png','mouth/mouth_neutral.png']);
 const normal=refs.generationReferenceLayers(fixture,avatar.DEFAULT_AVATAR,false),outfit=refs.generationReferenceLayers(fixture,avatar.DEFAULT_AVATAR,true);
 assert.ok(normal.some(l=>/^outfits\//i.test(l.key)));assert.ok(!outfit.some(l=>/^outfits\//i.test(l.key)));
 assert.ok(outfit.some(l=>/^base\//i.test(l.key)));assert.ok(outfit.some(l=>/^hairstyles\//i.test(l.key)));
 assert.deepEqual(refs.referenceLayers(fixture,avatar.DEFAULT_AVATAR).map(l=>l.key),normal.map(l=>l.key));
});

test('neck protection finds shoulder transition and skips missing or unsuitable body silhouettes',()=>{
 const g=loader()('src/core/avatarReference.ts'),w=100,h=200,p=new Uint8ClampedArray(w*h*4);
 for(let y=50;y<=68;y++){const span=y<56?30:y<62?6:24;for(let x=50-Math.floor(span/2);x<50+Math.ceil(span/2);x++)p[(y*w+x)*4+3]=255;}
 assert.equal(g.neckTransitionRow(p,w,h),62);assert.equal(g.neckTransitionRow(new Uint8ClampedArray(w*h*4),w,h),null);
 p.fill(255);assert.equal(g.neckTransitionRow(p,w,h),null);
});

test('outfit PNG prototype maps framed source back to body canvas and validates selection',()=>{
 const g=loader()('src/core/outfitPrototype.ts');const t={x:0,y:0,scale:1,frame:.92},fit=g.fitOutfit(768,1024,843,1264,t);
 const k=1264/(1024*.92);assert.ok(Math.abs(fit.height-1024*k)<1e-6);assert.ok(Math.abs(fit.y-(1264-fit.height)/2)<1e-6);
 const points=[{x:1,y:1},{x:20,y:1},{x:20,y:20}];assert.equal(g.validRegion(points,100,100),true);assert.equal(g.validRegion(points.slice(0,2),100,100),false);assert.equal(g.validRegion([{x:-1,y:0},...points],100,100),false);assert.throws(()=>g.fitOutfit(768,1024,843,1264,{...t,scale:0}));assert.throws(()=>g.fitOutfit(768,1024,843,1264,{...t,x:Infinity}));
});
test('neck preservation is limited to central neck column and clothing mask reaches canvas bottom',()=>{
 const g=loader()('src/core/avatarReference.ts'),w=100,h=200,p=new Uint8ClampedArray(w*h*4);
 for(let y=50;y<65;y++){const span=y<56?40:6;for(let x=50-span/2;x<50+span/2;x++)p[(y*w+x)*4+3]=255;}
 const b=g.neckColumnBounds(p,w,h);assert.ok(b.left>40&&b.right<60);assert.equal(g.clothingBounds(p,w,h).height,150);
});

test('outfit selection reload rejects mismatched pictures and retains editable holes and alignment',()=>{
 const g=loader()('src/core/outfitPrototype.ts'),saved={name:'Dress',sourceSize:{width:768,height:1024},regions:[{points:[{x:10,y:10},{x:100,y:10},{x:100,y:100}],erase:false},{points:[{x:30,y:20},{x:50,y:20},{x:50,y:40}],erase:true}],transform:{x:2,y:-5,scale:1,frame:.92}};
 const restored=g.readOutfitSelection(saved,768,1024);assert.equal(restored.regions[1].erase,true);assert.equal(restored.transform.y,-5);assert.throws(()=>g.readOutfitSelection(saved,512,768));assert.throws(()=>g.readOutfitSelection({...saved,transform:{...saved.transform,frame:0}},768,1024));assert.equal(g.validRegion([null,{x:1,y:1},{x:3,y:4}],100,100),false);
});
test('outfit redraw defaults avoid the rejected flat dress guide',()=>{
 const g=loader()('src/core/imageGeneration.ts');assert.equal(g.outfitQualityDefaults('animagine.safetensors',true,'yourself in a summer dress').referenceStrength,.8);assert.equal(g.outfitQualityDefaults('animagine.safetensors',true,'a jacket').referenceStrength,.8);assert.equal(g.outfitQualityDefaults('NetaYume.safetensors',true,'dress').cfg,4);
 const prompt=g.animagineClothingPrompt('yourself in a summer dress');assert.match(prompt,/feet fully visible/);assert.match(prompt,/arms at sides/);
});


test('dragging outfit preview accounts for display scale and preserves alignment bounds',()=>{
 const g=loader()('src/core/outfitPrototype.ts'),start={x:5,y:-10};
 const move=g.dragOutfit(start,{x:50,y:-25},{width:421.5,height:632},{width:843,height:1264});assert.equal(move.x,105);assert.equal(move.y,-60);
 const limit=g.dragOutfit(start,{x:10000,y:-10000},{width:843,height:1264},{width:843,height:1264});assert.equal(limit.x,2048);assert.equal(limit.y,-2048);assert.throws(()=>g.dragOutfit(start,{x:1,y:1},{width:0,height:10},{width:843,height:1264}));
});
test('clothing-only requests avoid avatar instructions and request isolated garments',()=>{
 const g=loader()('src/core/imageGeneration.ts');const request=g.requestedPicture('Draw a summer dress, clothing only using Animagine');assert.equal(request.clothingOnly,true);assert.equal(request.backend,'animagine');assert.equal(g.requestedPicture('Draw yourself in a summer dress').clothingOnly,undefined);
 const prompt=g.clothingOnlyPrompt('yourself in a red summer dress','animagine.safetensors');assert.match(prompt,/no humans/);assert.match(prompt,/red summer dress/);assert.ok(!prompt.includes('yourself'));assert.ok(!prompt.includes('arms at sides'));assert.match(g.clothingOnlyNegative('blurry'),/mannequin/);
});

test('connected background cleanup preserves enclosed pale fabric and removes clicked holes',()=>{
 const g=loader()('src/core/outfitPrototype.ts'),w=7,h=7,data=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<w*h;i++)data.set([250,245,245,255],i*4);
 for(let y=1;y<6;y++)for(let x=1;x<6;x++){const edge=x===1||x===5||y===1||y===5;data.set(edge?[50,50,50,255]:[252,250,250,255],(y*w+x)*4);}
 const background=g.backgroundPixels(data,w,h,{x:0,y:0},24);assert.equal(background[0],255);assert.equal(background[3*w+3],0);assert.equal(background[1*w+1],0);
 const hole=g.backgroundPixels(data,w,h,{x:3,y:3},10);assert.equal(hole[3*w+3],255);assert.equal(hole[0],0);assert.throws(()=>g.backgroundPixels(data,w,h,{x:-1,y:0},24));
});
test('corner resize shrinks below old minimum and keeps opposite corner anchored',()=>{
 const g=loader()('src/core/outfitPrototype.ts'),start={x:0,y:0,scale:1,frame:1},box={x:250,y:250,width:500,height:500};
 const small=g.resizeOutfit(start,box,0,{x:725,y:725},{width:1000,height:1000});assert.ok(Math.abs(small.scale-.05)<1e-6);
 const fit=g.fitOutfit(1000,1000,1000,1000,small),moved=g.transformedBounds({x:250,y:250,width:500,height:500},fit,{width:1000,height:1000});assert.ok(Math.abs(moved.x+moved.width-750)<1e-6);assert.ok(Math.abs(moved.y+moved.height-750)<1e-6);
 const tiny=g.resizeOutfit(start,box,0,{x:900,y:900},{width:1000,height:1000});assert.equal(tiny.scale,.02);assert.ok(g.fitOutfit(768,1024,843,1264,{...start,scale:.02}));
});
test('brush strokes and background cleanup reload with grouped undo and legacy polygons',()=>{
 const g=loader()('src/core/outfitPrototype.ts'),polygon={points:[{x:0,y:0},{x:100,y:0},{x:100,y:100}],erase:false},stroke={kind:'brush',points:[{x:20,y:20},{x:30,y:30}],brushSize:12,erase:true,group:3},bg={kind:'background',points:[{x:0,y:0}],tolerance:24,erase:true,group:4};
 const saved={name:'Edited',sourceSize:{width:100,height:100},regions:[polygon,stroke,bg,{...bg,points:[{x:99,y:0}]}],transform:{x:0,y:0,scale:.05,frame:1}},restored=g.readOutfitSelection(saved,100,100);
 assert.equal(restored.regions[1].kind,'brush');assert.equal(restored.regions[1].brushSize,12);assert.equal(g.undoOutfitEdit(restored.regions).length,2);assert.equal(g.undoOutfitEdit([polygon]).length,0);
 assert.throws(()=>g.readOutfitSelection({...saved,regions:[{...stroke,brushSize:0}]},100,100));assert.throws(()=>g.readOutfitSelection({...saved,regions:[{...bg,tolerance:999}]},100,100));
});

test('outfit pieces retain independent cleanup and alignment when switching and reopening',()=>{
 const g=loader()('src/core/outfitPrototype.ts'),transform={x:0,y:0,scale:1,frame:1},r=[{points:[{x:0,y:0},{x:100,y:0},{x:100,y:100}],erase:false}],pieces=[{id:'top',name:'Top',regions:r,transform},{id:'bottom',name:'Bottoms',regions:[],transform:{...transform,y:100}}];
 const snapshot=g.snapshotOutfitPieces(pieces,'top',r,{...transform,x:25,scale:.2});assert.equal(snapshot[0].transform.x,25);assert.equal(snapshot[1].transform.y,100);assert.equal(pieces[0].transform.x,0);
 const project=g.readOutfitProject({name:'Set',sourceSize:{width:100,height:100},parts:snapshot,activePartId:'bottom'},100,100);assert.equal(project.activeId,'bottom');assert.equal(project.pieces[0].transform.scale,.2);assert.equal(project.pieces[1].transform.y,100);
 assert.throws(()=>g.readOutfitProject({name:'Set',sourceSize:{width:100,height:100},parts:[snapshot[0],snapshot[0]]},100,100));
 const old=g.readOutfitProject({name:'Old',sourceSize:{width:100,height:100},regions:r,transform},100,100);assert.equal(old.pieces.length,1);assert.equal(old.pieces[0].regions.length,1);
});
test('splitting an outline retains cleaned pixels in new piece and excludes them from original',()=>{
 const g=loader()('src/core/outfitPrototype.ts'),points=[{x:10,y:60},{x:90,y:60},{x:90,y:90}],regions=[{points:[{x:0,y:0},{x:100,y:0},{x:100,y:100}],erase:false},{kind:'background',points:[{x:0,y:0}],tolerance:20,erase:true}],pieces=[{id:'all',name:'Set',regions,transform:{x:3,y:4,scale:.3,frame:1}}];
 const split=g.splitOutfitPiece(pieces,'all',points,'shoe','Shoe',100,100);assert.equal(split.length,2);assert.equal(split[0].regions[2].erase,true);assert.equal(split[1].regions[1].kind,'background');assert.equal(split[1].regions[2].kind,'clip');assert.equal(split[1].transform.x,3);assert.equal(pieces[0].regions.length,2);assert.equal(g.undoOutfitEdit(split[1].regions).length,3);
 assert.equal(g.readOutfitProject({name:'Set',parts:split,sourceSize:{width:100,height:100}},100,100).pieces.length,2);
});
test('fresh image seeds vary repeated requests without losing explicit repeatability',()=>{
 const g=loader()('src/core/imageGeneration.ts');assert.equal(g.freshPictureSeed(42,42),43);assert.equal(g.freshPictureSeed(42,1234),1234);assert.equal(g.freshPictureSeed(4294967295,4294967295),0);assert.ok(Number.isInteger(g.freshPictureSeed(42)));
});

test('Qwen routes independently with bounded artwork dimensions and explicit reference',()=>{
 const g=loader()('src/core/imageGeneration.ts'),model='Qwen-Rapid-AIO-SFW-v23.safetensors';
 const parsed=g.requestedPicture('Draw yourself reading in a library using Qwen');assert.equal(parsed.backend,'qwen');assert.equal(parsed.referenceAvatar,true);assert.equal(parsed.prompt,'yourself reading in a library');
 assert.equal(g.choosePictureModel([{name:model,kind:'qwen'}],'qwen').name,model);assert.equal(g.choosePictureModel([],'qwen'),undefined);
 assert.equal(g.pictureModelReady('qwen',{engineReady:true,netaReady:true,qwenReady:false}),false);
 assert.equal(g.pictureModelReady('qwen',{engineReady:false,netaReady:false,qwenReady:true}),true);
 assert.equal(g.outfitQualityDefaults(model,true).steps,4);assert.equal(g.outfitQualityDefaults(model,true).cfg,1);
 const r={model,prompt:'library',negative:'',width:1280,height:720,steps:4,cfg:1,seed:42,cpu:false,characterReference:true};assert.equal(g.imageGenerationRequest(r).height,720);
 for(const change of [{cpu:true},{width:1280,height:1280},{width:1296},{height:721},{reference:'data:image/jpeg;base64,/9j/AA=='},{characterReference:'yes'},{model:'photon_v1.safetensors'}])assert.throws(()=>g.imageGenerationRequest({...r,...change}));
 assert.match(g.qwenArtworkPrompt(parsed.prompt,true),/turnaround sheet/);assert.ok(!g.qwenArtworkPrompt(parsed.prompt,true).includes('yourself'));assert.equal(g.qwenArtworkPrompt('a cat',false),'a cat');
});

test('Qwen chat launch uses character conditioning without avatar masks',async()=>{
 const slots=[],deps=[],effects=[],calls=[];let index=0,completed=0;const load=loader(),jsx=(type,props)=>({type,props}),module={exports:{}};
 const react={useState:init=>{const i=index++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef:init=>{const i=index++;return slots[i]??(slots[i]={current:init});},useEffect:(fn,d)=>{const i=index++;if(!deps[i]||d.some((v,j)=>!Object.is(v,deps[i][j]))){deps[i]=d;effects.push(fn);}}};
 const invoke=async(name,args)=>{calls.push({name,args});if(name==='image_generation_discover')return {models:[{name:'Qwen-Rapid-AIO-SFW-v23.safetensors',kind:'qwen'}],engineReady:false,netaReady:false,qwenReady:true,qwenReferenceReady:true};if(name==='image_generation_start')return 'chat-owned-job';if(name==='image_generation_poll')return {stage:'ready',path:'local.jpg'};if(name==='image_generation_result')return new ArrayBuffer(4);};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/ImageGenerationDrawer.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='@tauri-apps/api/core'?{invoke}:id.includes('imageSession')?load('src/core/imageSession.ts'):id.includes('imageGeneration')?load('src/core/imageGeneration.ts'):{prepareImage:async()=> 'prepared-jpeg'},setTimeout:()=>1,clearTimeout(){},File:class{constructor(parts,name){this.name=name;}},Uint8Array,AbortController});
 const props={inline:true,available:true,initialRequest:{prompt:'yourself in a blue summer dress',backend:'qwen',referenceAvatar:true},prepareReference:async()=>assert.fail('Qwen must not prepare an avatar'),prepareClothingMask:async()=>assert.fail('Qwen must not prepare a clothing mask'),onClose(){},onSave(){assert.fail('Save must remain explicit');},onGenerated:image=>{completed++;assert.equal(image.dataUrl,'prepared-jpeg');}};
 function render(){index=0;const tree=module.exports.default(props);assert.equal(tree.type,'section');assert.equal(tree.props.className,'chat-picture-job');assert.equal(tree.props.role,undefined);while(effects.length)effects.shift()();}
 render();await new Promise(setImmediate);assert.equal(completed,0);render();await new Promise(setImmediate);render();await new Promise(setImmediate);
 const starts=calls.filter(c=>c.name==='image_generation_start');assert.equal(starts.length,1);assert.equal(starts[0].args.request.model,'Qwen-Rapid-AIO-SFW-v23.safetensors');assert.equal(starts[0].args.request.width,1280);assert.equal(starts[0].args.request.height,720);assert.equal(starts[0].args.request.referenceStrength,.45);assert.match(starts[0].args.request.prompt,/same single character/);assert.equal(starts[0].args.request.cfg,1);assert.equal(starts[0].args.request.reference,undefined);assert.equal(starts[0].args.request.referenceMask,undefined);assert.equal(starts[0].args.request.characterReference,true);assert.equal(starts[0].args.request.steps,4);assert.equal(completed,1);
});

test('Qwen current-avatar chat reference snapshots dressed layers without requiring the sheet',async()=>{
 const slots=[],deps=[],effects=[],calls=[];let index=0,completed=0;const load=loader(),jsx=(type,props)=>({type,props}),module={exports:{}};
 const react={useState:init=>{const i=index++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef:init=>{const i=index++;return slots[i]??(slots[i]={current:init});},useEffect:(fn,d)=>{const i=index++;if(!deps[i]||d.some((v,j)=>!Object.is(v,deps[i][j]))){deps[i]=d;effects.push(fn);}}};
 const invoke=async(name,args)=>{calls.push({name,args});if(name==='image_generation_discover')return {models:[{name:'Qwen-Rapid-AIO-SFW-v23.safetensors',kind:'qwen'}],engineReady:false,netaReady:false,qwenReady:true,qwenReferenceReady:false};if(name==='image_generation_start')return 'chat-owned-job';if(name==='image_generation_poll')return {stage:'ready',path:'local.jpg'};if(name==='image_generation_result')return new ArrayBuffer(4);};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/ImageGenerationDrawer.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='@tauri-apps/api/core'?{invoke}:id.includes('imageSession')?load('src/core/imageSession.ts'):id.includes('imageGeneration')?load('src/core/imageGeneration.ts'):{prepareImage:async()=> 'prepared-jpeg'},setTimeout:()=>1,clearTimeout(){},File:class{constructor(parts,name){this.name=name;}},Uint8Array,AbortController});
 const props={inline:true,available:true,initialRequest:{prompt:'yourself in a blue summer dress',backend:'qwen',referenceAvatar:true,qwenReferenceSource:'avatar'},prepareReference:async(signal,clothing,accessories)=>{assert.equal(clothing,false);assert.equal(accessories,true);return 'data:image/jpeg;base64,/9j/AA==';},prepareClothingMask:async()=>assert.fail('Qwen must not prepare a clothing mask'),onClose(){},onSave(){assert.fail('Save must remain explicit');},onGenerated:image=>{completed++;assert.equal(image.dataUrl,'prepared-jpeg');}};
 function render(){index=0;const tree=module.exports.default(props);assert.equal(tree.type,'section');assert.equal(tree.props.className,'chat-picture-job');assert.equal(tree.props.role,undefined);while(effects.length)effects.shift()();}
 render();await new Promise(setImmediate);assert.equal(completed,0);render();await new Promise(setImmediate);render();await new Promise(setImmediate);
 const starts=calls.filter(c=>c.name==='image_generation_start');assert.equal(starts.length,1);assert.equal(starts[0].args.request.model,'Qwen-Rapid-AIO-SFW-v23.safetensors');assert.equal(starts[0].args.request.width,1280);assert.equal(starts[0].args.request.height,720);assert.equal(starts[0].args.request.referenceStrength,.45);assert.match(starts[0].args.request.prompt,/same single character/);assert.equal(starts[0].args.request.cfg,1);assert.equal(starts[0].args.request.reference,'data:image/jpeg;base64,/9j/AA==');assert.equal(starts[0].args.request.referenceMask,undefined);assert.equal(starts[0].args.request.characterReference,false);assert.equal(starts[0].args.request.steps,4);assert.equal(completed,1);
});

test('Qwen current avatar routing follows reference features rather than fixed colors',()=>{
 const g=loader()('src/core/imageGeneration.ts');const r=g.requestedPicture('Draw yourself reading using your current avatar using Qwen');assert.equal(r.backend,'qwen');assert.equal(r.qwenReferenceSource,'avatar');assert.equal(r.referenceAvatar,true);assert.equal(r.prompt,'yourself reading');
 const p=g.qwenArtworkPrompt(r.prompt,true,'avatar');assert.match(p,/current avatar image/);assert.ok(!p.includes('silver'));assert.ok(!p.includes('blue eyes'));assert.ok(!p.includes('green backdrop'));
 const req={model:'Qwen-Rapid-AIO-SFW-v23.safetensors',prompt:'artwork',negative:'',width:1280,height:720,steps:4,cfg:1,seed:42,cpu:false,characterReference:false,reference:'data:image/jpeg;base64,/9j/AA=='};assert.equal(g.imageGenerationRequest(req).reference,req.reference);assert.throws(()=>g.imageGenerationRequest({...req,characterReference:true}));
});

test('Qwen outfit design generates separated clothing without attaching the character',async()=>{
 const slots=[],deps=[],effects=[],calls=[];let index=0,completed=0;const load=loader(),jsx=(type,props)=>({type,props}),module={exports:{}};
 const react={useState:init=>{const i=index++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef:init=>{const i=index++;return slots[i]??(slots[i]={current:init});},useEffect:(fn,d)=>{const i=index++;if(!deps[i]||d.some((v,j)=>!Object.is(v,deps[i][j]))){deps[i]=d;effects.push(fn);}}};
 const invoke=async(name,args)=>{calls.push({name,args});if(name==='image_generation_discover')return {models:[{name:'Qwen-Rapid-AIO-SFW-v23.safetensors',kind:'qwen'}],engineReady:false,netaReady:false,qwenReady:true,qwenReferenceReady:true};if(name==='image_generation_start')return 'chat-owned-job';if(name==='image_generation_poll')return {stage:'ready',path:'local.jpg'};if(name==='image_generation_result')return new ArrayBuffer(4);};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/ImageGenerationDrawer.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='@tauri-apps/api/core'?{invoke}:id.includes('imageSession')?load('src/core/imageSession.ts'):id.includes('imageGeneration')?load('src/core/imageGeneration.ts'):{prepareImage:async()=> 'prepared-jpeg'},setTimeout:()=>1,clearTimeout(){},File:class{constructor(parts,name){this.name=name;}},Uint8Array,AbortController});
 const props={inline:true,available:true,initialRequest:{prompt:'a lavender cardigan, white skirt and pair of white shoes',backend:'qwen',referenceAvatar:true,clothingOnly:true},prepareReference:async()=>assert.fail('Qwen must not prepare an avatar'),prepareClothingMask:async()=>assert.fail('Qwen must not prepare a clothing mask'),onClose(){},onSave(){assert.fail('Save must remain explicit');},onGenerated:image=>{completed++;assert.equal(image.dataUrl,'prepared-jpeg');}};
 function render(){index=0;const tree=module.exports.default(props);assert.equal(tree.type,'section');assert.equal(tree.props.className,'chat-picture-job');assert.equal(tree.props.role,undefined);while(effects.length)effects.shift()();}
 render();await new Promise(setImmediate);assert.equal(completed,0);render();await new Promise(setImmediate);render();await new Promise(setImmediate);
 const starts=calls.filter(c=>c.name==='image_generation_start');assert.equal(starts.length,1);assert.equal(starts[0].args.request.model,'Qwen-Rapid-AIO-SFW-v23.safetensors');assert.equal(starts[0].args.request.width,1280);assert.equal(starts[0].args.request.height,720);assert.equal(starts[0].args.request.referenceStrength,.45);assert.match(starts[0].args.request.prompt,/isolated anime clothing objects/);assert.equal(starts[0].args.request.cfg,1);assert.equal(starts[0].args.request.reference,undefined);assert.equal(starts[0].args.request.referenceMask,undefined);assert.equal(starts[0].args.request.characterReference,false);assert.equal(starts[0].args.request.steps,4);assert.equal(completed,1);
});

test('outfit design defaults to a complete Qwen garment set and preserves requested items',()=>{
 const g=loader()('src/core/imageGeneration.ts'),r=g.outfitDesignRequest();assert.equal(r.backend,'qwen');assert.equal(r.clothingOnly,true);assert.match(r.prompt,/cardigan/);assert.match(r.prompt,/skirt/);assert.match(r.prompt,/pair/);
 const prompt=g.clothingOnlyPrompt(r.prompt,'Qwen-Rapid-AIO-SFW-v23.safetensors');assert.match(prompt,/separate complete pieces/);assert.match(prompt,/generous empty gaps/);assert.match(prompt,/no wearer/);assert.match(prompt,/uniform light-gray background/);
 const dress=g.clothingOnlyPrompt('a red summer dress','Qwen-Rapid-AIO-SFW-v23.safetensors');assert.match(dress,/red summer dress/);assert.ok(!dress.includes('lavender'));assert.ok(!dress.includes('cardigan'));assert.ok(!dress.includes('transparent'));
});

test('Atelier hands a design into one persistent editor across Make Edit and Save',()=>{
 const slots=[];let index=0,closed=0;const jsx=(type,props,key)=>({type,props,key}),module={exports:{}},Designer=()=>null,Editor=()=>null;
 const react={useRef:init=>{const i=index++;return slots[i]??(slots[i]={current:init});},useState:init=>{const i=index++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/Atelier.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id.includes('imageGeneration')?loader()('src/core/imageGeneration.ts'):id.includes('ImageGenerationDrawer')?{default:Designer,__esModule:true}:{default:Editor,__esModule:true}});
 const props={assets:{},cfg:{},available:true,beforeGenerate:async()=>async()=>{},onSaveImage(){},onClose(){closed++;}};
 function render(){index=0;return module.exports.default(props);}function nodes(tree){return !tree||typeof tree!=='object'?[]:[tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];}
 let tree=render(),all=nodes(tree);assert.equal(tree.props['aria-label'],'Atelier');const design=all.find(n=>n.type===Designer);assert.equal(design.props.embedded,true);assert.equal(design.props.autoGenerate,false);assert.equal(design.props.initialRequest.backend,'qwen');
 const image={filename:'outfit.jpg',dataUrl:'data:image/jpeg;base64,/9j/AA=='};design.props.onPrototype(image);all=nodes(render());let editor=all.find(n=>n.type===Editor);assert.equal(editor.props.initial,image);assert.equal(editor.props.stage,'make');const key=editor.key;let picked=0;editor.props.uploadInputRef.current={click(){picked++;}};all.find(n=>n.type==='button'&&n.props.children==='Upload your own outfit image').props.onClick();assert.equal(picked,1);
 for(const step of ['edit','save','make','design','edit']){const button=all.find(n=>n.type==='button'&&n.props['aria-current']===undefined&&JSON.stringify(n.props.children).toLowerCase().includes('"'+step+'"'));assert.ok(button,step);button.props.onClick();all=nodes(render());editor=all.find(n=>n.type===Editor);assert.equal(editor.key,key);assert.equal(editor.props.initial,image);}
 all.find(n=>n.type===Designer).props.onPrototype({...image,filename:'new.jpg'});all=nodes(render());editor=all.find(n=>n.type===Editor);assert.notEqual(editor.key,key);assert.equal(editor.props.stage,'make');assert.equal(editor.props.initial.filename,'new.jpg');
 all.find(n=>n.type==='button'&&n.props.children==='Back to chat').props.onClick();assert.equal(closed,1);
});

test('wardrobe inventory previews isolate items and keep skin previews dressed',()=>{
 const load=loader(),a=assets(['base/body.png','base/tan/body.png','outfits/default/outfit.png','outfits/summer/outfit.png','outfits/summer/outfit_back.png','hairstyles/default/hair_front.png','hairstyles/default/hair_back.png','hairstyles/short/hair_front.png','accessories/glasses.png','accessories/back/wings.png','eyes/eye_neutral.png','eyes/eye_happy.png','mouth/mouth_neutral.png','mouth/mouth_a.png']);
 const cfg={...load('src/core/avatar.ts').DEFAULT_AVATAR,accessories:['glasses']},before=JSON.stringify(cfg),preview=load('src/core/wardrobe.ts').wardrobePreviewLayers;
 const outfit=preview(a,cfg,'outfit','summer');assert.equal(outfit.length,2);assert.ok(outfit.every(l=>l.key.startsWith('outfits/summer/')));
 const hair=preview(a,cfg,'hair','short');assert.equal(hair.length,1);assert.equal(hair[0].key,'hairstyles/short/hair_front.png');
 const accessory=preview(a,cfg,'accessories','wings');assert.equal(accessory.length,1);assert.equal(accessory[0].key,'accessories/back/wings.png');
 const skin=preview(a,cfg,'skin','tan');assert.ok(skin.some(l=>l.key==='base/tan/body.png'));assert.ok(skin.some(l=>l.key==='outfits/default/outfit.png'));assert.ok(skin.some(l=>l.key==='eyes/eye_neutral.png'));assert.ok(!skin.some(l=>l.key==='eyes/eye_happy.png'||l.key==='mouth/mouth_a.png'));assert.equal(JSON.stringify(cfg),before);
});

test('full-page wardrobe inventory keeps selection locks accessory toggles and look controls',()=>{
 const slots=[];let index=0;const jsx=(type,props,key)=>({type,props,key}),module={exports:{}},load=loader();
 const react={useState:init=>{const i=index++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/Wardrobe.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id.includes('../core/')?load('src/core/'+id.split('/').pop()+'.ts'):{__esModule:true,default:()=>null},window:{confirm:()=>true}});
 const entry=(name,unlocked=true)=>({id:'outfits/'+name,name,label:name,unlocked,hint:'Spend time together',isDefault:name==='default'}),changes=[],cfg={...load('src/core/avatar.ts').DEFAULT_AVATAR,accessories:[],looks:[],view:'bust'};
 const props={data:{outfits:[entry('default'),entry('summer'),entry('locked',false)],hairs:[entry('default')],skins:[entry('default')],accessories:[entry('glasses')]},cfg,stats:{days:[],messages:0,skill:0},charName:'Mana',onChange:next=>{changes.push(next);props.cfg=next;},onClose(){},onAtelier(){}};
 function nodes(t){return !t||typeof t!=='object'?[]:[t,...[t.props?.children].flat(Infinity).flatMap(nodes)];}function render(){index=0;return nodes(module.exports.default(props));}
 let all=render();assert.equal(all[0].props.className,'wardrobe-workspace');const radios=all.filter(n=>n.type==='input'&&n.props.type==='radio');assert.equal(radios.length,3);assert.equal(radios[2].props.disabled,true);radios[2].props.onChange();assert.equal(changes.length,0);radios[1].props.onChange();assert.equal(props.cfg.outfit,'summer');assert.equal(props.cfg.view,'bust');
 all=render();all.find(n=>n.type==='input'&&n.props.type==='search').props.onChange({target:{value:'missing'}});all=render();assert.equal(all.filter(n=>n.type==='input'&&n.props.type==='radio').length,0);
 all.find(n=>n.type==='button'&&n.props.children==='Accessories').props.onClick();all=render();all.find(n=>n.type==='input'&&n.props.type==='checkbox').props.onChange();assert.deepEqual(Array.from(props.cfg.accessories),['glasses']);all=render();all.find(n=>n.type==='input'&&n.props.type==='checkbox').props.onChange();assert.equal(props.cfg.accessories.length,0);
 all=render();all.find(n=>n.type==='button'&&n.props.children==='Saved looks').props.onClick();all=render();all.find(n=>n.type==='input'&&n.props.maxLength===60).props.onChange({target:{value:'Cozy'}});all=render();all.find(n=>n.type==='button'&&n.props.children==='Save current look').props.onClick();assert.equal(props.cfg.looks[0].name,'Cozy');assert.equal(props.cfg.looks[0].outfit,'summer');
 for(const label of ['Daily looks','Seasons']){all=render();all.find(n=>n.type==='button'&&n.props.children===label).props.onClick();assert.ok(render().some(n=>n.type==='main'));}
});


test('saved Atelier outfits are wearable inventory entries with friendly names',()=>{
 const load=loader(),avatar=load('src/core/avatar.ts'),w=load('src/core/wardrobe.ts'),name='atelier_blue_summer_dress-1792634559305369900',a=assets(['base/body.png','outfits/default/outfit.png','hairstyles/default/hair_front.png','outfits/'+name+'/outfit.png']);
 const items=w.buildWardrobe(a,{days:[],messages:0,skill:0,milestones:{}},new Date(),'Mana'),saved=items.outfits.find(e=>e.name===name);assert.ok(saved);assert.equal(saved.label,'blue summer dress');assert.equal(saved.unlocked,true);const cfg=w.resolveLoadout({...avatar.DEFAULT_AVATAR,outfit:name},items);assert.equal(cfg.outfit,name);assert.ok(avatar.buildLayers(a,cfg).some(l=>l.key==='outfits/'+name+'/outfit.png'));assert.ok(!avatar.buildLayers(a,cfg).some(l=>l.key==='outfits/default/outfit.png'));
});

test('Atelier preview opacity and zoom leave the transparent outfit composite unchanged',()=>{
 const im={naturalWidth:843,naturalHeight:1264,src:'source'},body={...im,src:'body'},calls=[],effects=[],updates={};let state=0,ref=0,canvases=0;const jsx=(type,props)=>({type,props}),module={exports:{}};
 function canvas(name){const ctx={globalAlpha:1,drawImage:(image)=>calls.push({target:name,image,alpha:ctx.globalAlpha}),getImageData:()=>({data:new Uint8ClampedArray([0,0,0,255])}),setLineDash(){},strokeRect(){},fillRect(){}};return {name,style:{cursor:'grab'},setPointerCapture(){},width:843,height:1264,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1080,height:1620}),};}
 const selection=canvas('selection'),transparent=canvas('transparent'),preview=canvas('preview'),cut=canvas('cut');
 const states={0:im,1:body,11:.4,12:2,19:true,17:[{key:'base/body.png',image:body},{key:'base/marks.png',image:{src:'marks'}},{key:'hairstyles/default/hair_front.png',image:{src:'hair'}}]};
 const react={useState:init=>{const i=state++;return [i in states?states[i]:typeof init==='function'?init():init,v=>{updates[i]=v;}];},useRef:init=>{const i=ref++;return {current:i===5?selection:i===6?transparent:i===7?preview:init};},useMemo:fn=>fn(),useEffect:fn=>effects.push(fn)};
 const core={undoOutfitEdit:loader()('src/core/outfitPrototype.ts').undoOutfitEdit,cutOutfit:()=>cut,alphaBounds:()=>({x:1,y:1,width:20,height:20}),placeOutfit:()=>cut,fitOutfit:()=>({x:0,y:0,width:843,height:1264}),transformedBounds:()=>({x:1,y:1,width:20,height:20}),MIN_OUTFIT_SCALE:.02,MAX_OUTFIT_SCALE:4};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/OutfitPrototype.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id.includes('avatarReference')?{referenceLayers:()=>[{key:'base/body.png',url:'body'}]}:id.includes('outfitPrototype')?core:{invoke:()=>assert.fail('View changes must not save anything')},document:{createElement:()=>canvas('composite-'+(++canvases))},Uint8ClampedArray});
 const tree=module.exports.default({assets:{},cfg:{},embedded:true,stage:'edit',onClose(){}});let prevented=0;const keyEvent={key:'z',ctrlKey:true,metaKey:false,shiftKey:false,altKey:false,target:{closest:()=>null},preventDefault(){prevented++;},stopPropagation(){}};tree.props.onKeyDownCapture(keyEvent);assert.equal(prevented,1);assert.equal(typeof updates[3],'function');assert.equal(updates[3]([{points:[],erase:false},{points:[],erase:true,group:2},{points:[],erase:true,group:2}]).length,1);tree.props.onKeyDownCapture({...keyEvent,target:{closest:()=>({tagName:'INPUT'})}});tree.props.onKeyDownCapture({...keyEvent,shiftKey:true});assert.equal(prevented,1);effects[4]();effects[5]();assert.equal(preview.style.cursor,'crosshair');
 const draws=calls.filter(c=>c.target==='preview'&&c.image.name?.startsWith('composite-'));assert.equal(draws.length,1);assert.equal(draws[0].alpha,.4);assert.ok(calls.filter(c=>c.target.startsWith('composite-')).every(c=>c.alpha===1));assert.equal(calls.find(c=>c.target==='transparent').alpha,1);assert.equal(preview.getContext().globalAlpha,1);
 function nodes(t){return !t||typeof t!=='object'?[]:[t,...[t.props?.children].flat(Infinity).flatMap(nodes)];}const all=nodes(tree);const bodyCanvas=all.find(n=>n.type==='canvas'&&n.props.className?.includes('outfit-drag-preview'));bodyCanvas.props.onPointerDown({button:0,currentTarget:preview,clientX:540,clientY:810});const point=updates[4]([])[0];assert.equal(point.x,421.5);assert.equal(point.y,632);assert.ok(all.some(n=>n.props?.['aria-label']==='Clothing cleanup tools'));assert.equal(bodyCanvas.props.style.cursor,'crosshair');assert.equal(all.find(n=>n.props?.['aria-label']==='Editor zoom').props.max,1200);const eraser=all.find(n=>n.props?.['aria-label']==='Eraser');assert.ok(eraser);eraser.props.onClick();assert.equal(updates[5],'eraser');assert.equal(updates[19],true);assert.equal(updates[20],false);const hand=all.find(n=>n.props?.['aria-label']==='Pan view');hand.props.onClick();assert.equal(updates[20],true);all.find(n=>n.props?.['aria-label']==='Move and resize').props.onClick();assert.equal(updates[19],false);assert.equal(updates[20],false);assert.ok(all.some(n=>n.type==='input'&&n.props['aria-label']==='Editor zoom'&&n.props.value===200));assert.equal(all.find(n=>n.type==='canvas'&&n.props.className?.includes('outfit-drag-preview')).props.style.width,'720px');states[5]='eraser';state=0;ref=0;const erasingTree=module.exports.default({assets:{},cfg:{},embedded:true,stage:'edit',onClose(){}}),erasingCanvas=nodes(erasingTree).find(n=>n.type==='canvas'&&n.props.className?.includes('outfit-drag-preview'));erasingCanvas.props.onPointerDown({button:0,pointerId:7,currentTarget:preview,clientX:540,clientY:810});assert.equal(updates[15].erase,true);assert.equal(updates[15].points[0].x,421.5);assert.equal(updates[15].points[0].y,632);assert.equal(updates[15].brushSize,30);states[4]=[{x:1,y:2},{x:3,y:4}];state=0;ref=0;const outlining=module.exports.default({assets:{},cfg:{},embedded:true,stage:'edit',onClose(){}});outlining.props.onKeyDownCapture(keyEvent);assert.equal(updates[4](states[4]).length,1);state=0;ref=0;const savingTree=module.exports.default({assets:{},cfg:{},embedded:true,stage:'save',onClose(){}});const before=prevented;savingTree.props.onKeyDownCapture(keyEvent);assert.equal(prevented,before);
});

test('zoomed preview drag uses canvas display coordinates and turnaround prompt requests one subject',()=>{
 const load=loader(),g=load('src/core/outfitPrototype.ts'),normal=g.dragOutfit({x:0,y:0},{x:10,y:20},{width:400,height:600},{width:800,height:1200}),zoomed=g.dragOutfit({x:0,y:0},{x:20,y:40},{width:800,height:1200},{width:800,height:1200});assert.equal(normal.x,zoomed.x);assert.equal(normal.y,zoomed.y);const prompt=load('src/core/imageGeneration.ts').qwenArtworkPrompt('reading',true);assert.match(prompt,/exactly one character/);assert.match(prompt,/apparent age, head-to-body ratio/);assert.match(prompt,/Do not age the character up/);
});

test('canvas hand panning captures gestures without sending them to outfit tools',()=>{
 const slots=[],refs=[];let state=0,ref=0;const jsx=(type,props)=>({type,props}),module={exports:{}};
 const react={useEffect:()=>{},useState:init=>{const i=state++;if(!(i in slots))slots[i]=init;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef:init=>refs[ref++]??(refs[ref-1]={current:init})};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/outfit/CanvasViewport.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:{jsx,jsxs:jsx}});
 function render(){state=0;ref=0;return module.exports.default({children:'canvas'}).props.children;}let [button,view]=render();const el={scrollLeft:100,scrollTop:200,focus(){},setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}};let prevented=0,stopped=0;const event={button:0,pointerId:2,clientX:40,clientY:60,currentTarget:el,preventDefault(){prevented++;},stopPropagation(){stopped++;}};
 view.props.onPointerDownCapture(event);assert.equal(prevented,0);button.props.onClick();[button,view]=render();view.props.onPointerDownCapture(event);view.props.onPointerMoveCapture({...event,clientX:60,clientY:90});assert.equal(el.scrollLeft,80);assert.equal(el.scrollTop,170);assert.equal(stopped,2);view.props.onPointerUpCapture(event);view.props.onPointerMoveCapture({...event,clientX:100});assert.equal(el.scrollLeft,80);
 button.props.onClick();[,view]=render();view.props.onKeyDownCapture({...event,code:'Space'});[,view]=render();assert.match(view.props.className,/is-hand/);view.props.onKeyUpCapture({...event,code:'Space'});[,view]=render();assert.ok(!view.props.className.includes('is-hand'));view.props.onPointerDownCapture({...event,button:1});assert.ok(stopped>=4);
});

test('outfit save retains histories beyond old 200KB cap and flattens only oversized histories',()=>{
 const g=loader()('src/core/outfitPrototype.ts'),transform={x:0,y:0,scale:1,frame:1};const regions=Array.from({length:80},()=>({kind:'brush',erase:true,brushSize:5,points:Array.from({length:180},(_,i)=>({x:i%128,y:i%128}))}));const parts=[{id:'layer1',name:'Dress',regions,transform,hidden:true}];
 const saved=g.outfitSaveMetadata('Dress',128,128,parts,'layer1',{width:128,height:128});assert.ok(saved.metadata.length>200000);assert.equal(saved.flattened,false);const project=g.readOutfitProject(JSON.parse(saved.metadata),128,128);assert.equal(project.pieces[0].regions.length,80);assert.equal(project.pieces[0].hidden,true);
 const huge=g.outfitSaveMetadata('Dress',128,128,[{...parts[0],name:'x'.repeat(g.MAX_OUTFIT_PROJECT_BYTES)}],'layer1',{width:128,height:128});assert.equal(huge.flattened,true);assert.ok(huge.metadata.length<1000);const flat=g.readOutfitProject(JSON.parse(huge.metadata),128,128);assert.equal(flat.pieces[0].transform.frame,1);assert.equal(flat.pieces[0].regions[0].erase,false);
});

test('mouse wheel zoom prevents page scrolling and anchors the image under the pointer',()=>{
 const effects=[],frames=[],handlers={};let zoom=2,ref=0;const el={scrollLeft:100,scrollTop:200,getBoundingClientRect:()=>({left:10,top:20}),addEventListener:(name,fn,options)=>{handlers[name]=fn;assert.equal(options.passive,false);},removeEventListener(){}};
 const react={useState:init=>[init,()=>{}],useRef:init=>({current:ref++===0?el:init}),useEffect:fn=>effects.push(fn)},jsx=(type,props)=>({type,props}),module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/outfit/CanvasViewport.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:id=>id==='react'?react:{jsx,jsxs:jsx},requestAnimationFrame:fn=>(frames.push(fn),frames.length),cancelAnimationFrame(){}});
 module.exports.default({children:null,zoom,onZoom:v=>zoom=v});effects[0]();let prevented=false;handlers.wheel({deltaY:-100,clientX:60,clientY:70,preventDefault:()=>prevented=true});assert.equal(prevented,true);assert.ok(zoom>2);frames[0]();const r=zoom/2;assert.equal(el.scrollLeft,150*r-50);assert.equal(el.scrollTop,250*r-50);
});
