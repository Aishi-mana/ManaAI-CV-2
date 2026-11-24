const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

function load(path,dependencies={}){
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(code,{exports,
  require:name=>{
   if(!(name in dependencies))throw Error('Unexpected import '+name);
   return dependencies[name];
  },
  Date,Math,JSON,String,Number,Set,Error,RegExp,Uint32Array,Array,Object,AbortController,
 },{filename:path});
 return exports;
}
const imageGeneration=load('src/core/imageGeneration.ts');
const reliability=load('src/core/imageReliability.ts',{'./imageGeneration':imageGeneration});
const {
 lastSuccessfulSketchbookModel,chooseReadyImageModel,imageProgressStalled,explainImageFailure,
}=reliability;
const photon={name:'photon_v1.safetensors',kind:'sd1'};
const animagine={name:'animagine-xl-4.0-opt.safetensors',kind:'sdxl'};
const neta={name:'NetaYume.safetensors',kind:'neta'};
const qwen={name:'Qwen-Rapid-AIO-SFW-v23.safetensors',kind:'qwen'};
const ready={models:[animagine,photon,neta,qwen],engineReady:true,netaReady:true,qwenReady:true};

test('Autonomous drawing prefers a checkpoint proven by already saved artwork',()=>{
 const entries=[
  {model:'photon_v1.safetensors'},
  {model:'animagine-xl-4.0-opt.safetensors'},
 ];
 assert.equal(lastSuccessfulSketchbookModel(entries),animagine.name);
 const chosen=chooseReadyImageModel(ready,{
  preferredModel:lastSuccessfulSketchbookModel(entries),preferEfficientModel:true,
 });
 assert.equal(chosen.name,animagine.name);
 assert.equal(chooseReadyImageModel(ready,{preferredModel:photon.name,preferEfficientModel:true}).name,photon.name);
});

test('First-time autonomous drawing prefers only an available smaller installed checkpoint',()=>{
 assert.equal(chooseReadyImageModel(ready,{preferEfficientModel:true}).name,photon.name);
 assert.equal(chooseReadyImageModel({...ready,models:[animagine,neta]},{preferEfficientModel:true}).name,neta.name);
 assert.equal(chooseReadyImageModel({...ready,models:[animagine]},{preferEfficientModel:true}).name,animagine.name);
 assert.equal(chooseReadyImageModel({...ready,models:[qwen]},{preferEfficientModel:true}),undefined);
 assert.equal(chooseReadyImageModel({...ready,models:[qwen]},{backend:'qwen'}).name,qwen.name);
 assert.equal(chooseReadyImageModel({...ready,engineReady:false},{preferEfficientModel:true}).name,neta.name);
 assert.equal(chooseReadyImageModel({...ready,engineReady:false,netaReady:false,qwenReady:false},{preferEfficientModel:true}),undefined);
});

test('Missing or unsafe remembered checkpoint falls back only to discovered models',()=>{
 const entries=[{model:'../secret.safetensors'},{model:'C:\\secret.safetensors'}];
 assert.equal(lastSuccessfulSketchbookModel(entries),undefined);
 assert.equal(chooseReadyImageModel(ready,{preferredModel:'../secret.safetensors',preferEfficientModel:true}).name,photon.name);
 assert.equal(chooseReadyImageModel(ready,{preferredModel:'lost_checkpoint.safetensors',preferEfficientModel:true}).name,photon.name);
 assert.equal(chooseReadyImageModel({...ready,models:[]},{preferEfficientModel:true}),undefined);
});

test('Explicit user backend selection never silently chooses another installed model',()=>{
 assert.equal(chooseReadyImageModel(ready,{backend:'animagine',preferEfficientModel:true}).name,animagine.name);
 assert.equal(chooseReadyImageModel(ready,{backend:'photon',preferredModel:animagine.name}).name,photon.name);
 assert.equal(chooseReadyImageModel({...ready,models:[photon]},{backend:'animagine',preferEfficientModel:true}),undefined);
 assert.equal(chooseReadyImageModel({...ready,engineReady:false},{backend:'photon'}),undefined);
 assert.equal(chooseReadyImageModel(ready).name,animagine.name); // Existing Create-picture default.
});

test('GPU inactivity timeout is shorter than CPU; negative or invalid timestamps are ignored',()=>{
 const t=1_000_000;
 assert.equal(imageProgressStalled(t,t+19*60_000,false),false);
 assert.equal(imageProgressStalled(t,t+21*60_000,false),true);
 assert.equal(imageProgressStalled(t,t+21*60_000,true),false);
 assert.equal(imageProgressStalled(t,t+121*60_000,true),true);
 assert.equal(imageProgressStalled(t,t-1,false),false);
 assert.equal(imageProgressStalled(Number.NaN,t,false),false);
});

test('Native errors explain resource remedies without automatic downloads or model switching',()=>{
 const gpu=explainImageFailure('CUDA out of memory while loading model',false);
 assert.match(gpu,/GPU could not fit/);
 assert.match(gpu,/SD1\/Photon/);
 assert.match(gpu,/chat model/);
 const ram=explainImageFailure('Failed to allocate memory',true);
 assert.match(ram,/system memory/);
 assert.doesNotMatch(ram,/choose CPU mode/i);
 const external=explainImageFailure('The chat model was started outside Mana',false);
 assert.match(external,/external chat server/);
 assert.equal(explainImageFailure('Image generation was stopped.',false),
  'The local image job stopped before finishing. No incomplete picture was saved.');
 assert.equal(explainImageFailure('Image generation failed for another reason.',false),
  'Image generation failed for another reason.');
});

test('ImageSession continues to release exactly one lease on failed native startup and stop',async()=>{
 const {imageSession}=load('src/core/imageSession.ts');
 let acquired=0,released=0,stopped=0;
 const session=imageSession(
  async()=>{throw Error('GPU job failed to start');},
  async()=>{stopped++;},
  async()=>{acquired++;return async()=>{released++;};},
 );
 await assert.rejects(session.start(),/GPU job failed/);
 await session.stop();
 await session.complete();
 assert.equal(acquired,1);
 assert.equal(released,1);
 assert.equal(stopped,0);
});


test('ImageSession sends cancellation to a queued GPU acquisition and never starts a cancelled job',async()=>{
 const {imageSession}=load('src/core/imageSession.ts');
 let pendingSignal,started=0,stopped=0,released=0;
 const session=imageSession(
  async()=>{started++;return 'never-started';},
  async()=>{stopped++;},
  signal=>new Promise((resolve,reject)=>{
   pendingSignal=signal;
   signal.addEventListener('abort',()=>reject(Error('Waiting GPU handoff cancelled')),{once:true});
  }),
 );
 const start=session.start();
 await Promise.resolve();
 assert.ok(pendingSignal);
 await session.stop();
 await assert.rejects(start,/cancelled/);
 assert.equal(pendingSignal.aborted,true);
 assert.equal(started,0);
 assert.equal(stopped,0);
 assert.equal(released,0);
});

test('Cancelling a queued GPU lease does not release another image job lease',async()=>{
 // Exercise useLlama's real GPU queue with a simulated local native pause.
 // The hook does not mount any timers or actually launch a chat model here.
 const source=fs.readFileSync('src/core/useLlama.ts','utf8');
 const compiled=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
 }).outputText;
 const exports={};
 let index=0,pausedCalls=0;
 const slots=[];
 const useState=init=>{
  const at=index++;
  if(!(at in slots))slots[at]=typeof init==='function'?init():init;
  return [slots[at],value=>{slots[at]=typeof value==='function'?value(slots[at]):value;}];
 };
 const useRef=init=>{
  const at=index++;
  if(!(at in slots))slots[at]={current:init};
  return slots[at];
 };
 const react={useState,useRef,useCallback:fn=>{index++;return fn;},useEffect:()=>{index++;}};
 const invoke=async command=>{
  if(command==='pause_llama_for_image'){pausedCalls++;return false;}
  return false;
 };
 vm.runInNewContext(compiled,{
  exports,require:name=>{
   if(name==='react')return react;
   if(name==='@tauri-apps/api/core')return {invoke};
   if(name==='./llm')return {checkHealth:async()=> 'offline'};
   throw Error('Unexpected model import '+name);
  },
  window:{__TAURI_INTERNALS__:{},clearTimeout(){},setTimeout(){}},
  Date,Math,JSON,String,Number,Set,Error,AbortController,Promise,
 },{filename:'useLlama.ts'});
 const llama=exports.useLlama({port:8034,autoStart:false});
 const firstRelease=await llama.pauseForImage();
 assert.equal(pausedCalls,1);
 const ctrl=new AbortController();
 const queued=llama.pauseForImage(ctrl.signal);
 ctrl.abort();
 await assert.rejects(queued,/cancelled before GPU handoff/);
 assert.equal(pausedCalls,1);
 // A third lease remains queued behind the FIRST active job, even though the
 // second lease cancelled. This is the safety-critical GPU ownership rule.
 const third=llama.pauseForImage();
 await Promise.resolve();
 assert.equal(pausedCalls,1);
 await firstRelease();
 const thirdRelease=await third;
 assert.equal(pausedCalls,2);
 await thirdRelease();
});
