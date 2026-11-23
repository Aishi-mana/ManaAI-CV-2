const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

// Test the real planner/runtime with the existing local-chat transport mocked.
// No GPU, Tauri, image generator or network call is started by these tests.
function transpile(file,requireModule){
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(code,{
  exports,require:requireModule,JSON,Date,Math,Number,String,Set,Error,AbortController,
 },{filename:file});
 return exports;
}
const planner=transpile('src/core/sketchbookIdeas.ts',name=>{
 if(name==='./validation')return {isRecord:v=>v!==null&&typeof v==='object'&&!Array.isArray(v)};
 throw Error('Unexpected planner import '+name);
});
function runtime(streamChat){
 return transpile('src/core/sketchbookRuntime.ts',name=>{
  if(name==='./llm')return {streamChat};
  if(name==='./sketchbookIdeas')return planner;
  throw Error('Unexpected runtime import '+name);
 });
}
const context={
 name:'Mana',personality:'Curious and creative',mood:'happy',energy:70,curiosity:80,
 interests:['sketching','cats'],recentDrawings:[],
};
const valid={
 title:'Moonlit Garden',concept:'An imaginary little garden floating on a cloud.',
 prompt:'Little moonlit cloud garden with blue flowers, a tiny teapot and pastel stars',
 inspiration:'imagination',relatedMemoryIds:[],
};
const plain=v=>JSON.parse(JSON.stringify(v));
const session=(signal=new AbortController().signal)=>({port:8080,context,signal});

test('Calls the already-running local chat model and prepares an ordinary picture request',async()=>{
 let call;
 const {prepareSketchbookDrawing}=runtime(async opts=>{
  call=opts;
  opts.onToken(JSON.stringify(valid));
 });
 const result=plain(await prepareSketchbookDrawing(session()));
 assert.equal(call.port,8080);
 assert.equal(call.temperature,.8);
 assert.equal(call.maxTokens,550);
 assert.equal(call.rejectTruncated,true);
 assert.deepEqual(plain(call.messages.map(m=>m.role)),['system','user']);
 assert.equal(result.idea.title,'Moonlit Garden');
 assert.equal(result.pictureRequest.backend,undefined);
 assert.equal(result.pictureRequest.referenceAvatar,undefined);
 assert.match(result.pictureRequest.prompt,/moonlit cloud garden/);
 assert.match(result.pictureRequest.prompt,/sketchbook doodle/);
 assert.ok(result.pictureRequest.prompt.length<=1500);
});

test('Invalid model output fails without constructing a picture',async()=>{
 for(const invalid of ['No idea today',JSON.stringify({...valid,sourceType:'diary',title:''})]){
  const {prepareSketchbookDrawing}=runtime(async opts=>{opts.onToken(invalid);});
  await assert.rejects(prepareSketchbookDrawing(session()),/No image was generated/);
 }
});

test('Rejects an invalid port before contacting any model',async()=>{
 let contacted=false;
 const {prepareSketchbookDrawing}=runtime(async()=>{contacted=true;});
 await assert.rejects(prepareSketchbookDrawing({...session(),port:0}),/valid local chat-model port/);
 assert.equal(contacted,false);
});

test('Cancels an in-progress idea when the caller aborts',async()=>{
 const controller=new AbortController();
 let invoked=false;
 const {prepareSketchbookDrawing}=runtime(async opts=>{
  invoked=true;
  controller.abort();
  assert.equal(opts.signal.aborted,true);
  throw Error('Model request aborted');
 });
 await assert.rejects(prepareSketchbookDrawing(session(controller.signal)),/cancelled/);
 assert.equal(invoked,true);
});

test('Too much model output is cut off and never becomes an image prompt',async()=>{
 const {prepareSketchbookDrawing}=runtime(async opts=>{
  opts.onToken('x'.repeat(6501));
  assert.equal(opts.signal.aborted,true);
  throw Error('Model was stopped');
 });
 await assert.rejects(prepareSketchbookDrawing(session()),/oversized drawing idea/);
});

test('Unapproved memories are rejected even if the local model invents a reference',async()=>{
 const withMemory={...valid,inspiration:'memory',relatedMemoryIds:['forged']};
 const {prepareSketchbookDrawing}=runtime(async opts=>{opts.onToken(JSON.stringify(withMemory));});
 await assert.rejects(prepareSketchbookDrawing(session()),/unapproved or inconsistent memory/);
});
