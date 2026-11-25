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
 vm.runInNewContext(js,{exports,JSON,Date,Number,Math,Map,Set,Object,Array,Error,String,AbortController,
  require:name=>{if(name in mocks)return mocks[name];throw Error('Unexpected '+name);}},
  {filename:file});
 return exports;
}
const midiMelody=load('src/core/midiMelody.ts');
const workbench=load('src/core/translationWorkbench.ts',{'./midiMelody':midiMelody});
const project=workbench.createTranslationProject({
 id:'translation-example',title:'An original Japanese poem for testing',
 sourceLyrics:'空に星が光る\n朝日を待っている',rightsBasis:'owned',acknowledged:true,
 now:new Date('2026-11-25T04:00:00.000Z'),
});
const response={lines:[
 {index:1,english:'Stars are shining in the sky',note:'Open vowel on sky'},
 {index:2,english:'I wait to greet the morning light',note:'An approximate rhythmic draft'},
]};
const plain=x=>JSON.parse(JSON.stringify(x));
const helper=stream=>load('src/core/translationIdeas.ts',{
 './llm':{streamChat:stream},
 './translationWorkbench':{TRANSLATION_LINE_LIMIT:workbench.TRANSLATION_LINE_LIMIT},
});

test('Local prompt protects the user-provided source and does not invent lyrics or melody',()=>{
 const prompts=plain(helper(async()=>{}).translationPrompt(project));
 assert.equal(prompts.length,2);
 assert.match(prompts[0].content,/user-supplied Japanese lyrics/);
 assert.match(prompts[0].content,/untrusted source DATA/);
 assert.match(prompts[0].content,/do not browse, retrieve or reconstruct missing lyrics/);
 assert.match(prompts[0].content,/unheard melody/);
 assert.match(prompts[0].content,/JSON object/);
 assert.match(prompts[1].content,/空に星が光る/);
 assert.match(prompts[1].content,/targetEnglishSyllables/);
 assert.ok(prompts[1].content.length<2000);
});

test('Complete JSON output maps each source line to an English proposal',async()=>{
 const calls=[];
 const api=helper(async options=>{calls.push(options);options.onToken(JSON.stringify(response));});
 const result=plain(await api.proposeTranslation({
  project,port:8080,signal:new AbortController().signal,
 }));
 assert.deepEqual(result,plain(response));
 assert.equal(calls.length,1);
 assert.equal(calls[0].rejectTruncated,true);
 assert.ok(calls[0].maxTokens>=600);
 assert.equal(calls[0].port,8080);
});

test('Wrong line count, swapped indices, extra verse, or empty drafts are rejected',()=>{
 const api=helper(async()=>{});
 for(const invalid of [
  {lines:response.lines.slice(0,1)},
  {lines:[{...response.lines[0],index:2},{...response.lines[1],index:1}]},
  {lines:[response.lines[0],{...response.lines[1],english:''}]},
  {lines:[response.lines[0],response.lines[0]]},
  {lines:[...response.lines,{index:3,english:'Extra line',note:''}]},
 ])assert.throws(()=>api.readTranslationProposal(JSON.stringify(invalid),2));
 const fenced=String.fromCharCode(96).repeat(3);
 assert.deepEqual(plain(api.readTranslationProposal(fenced+'json\n'+JSON.stringify(response)+'\n'+fenced,2)),plain(response));
 assert.throws(()=>api.readTranslationProposal('not json',2),/JSON/);
});

test('One repair retry is allowed; failure or cancelled work does not save partial text',async()=>{
 let calls=0;
 const api=helper(async options=>{
  calls++;
  options.onToken(calls===1?'{bad json':JSON.stringify(response));
 });
 const result=await api.proposeTranslation({
  project,port:8080,signal:new AbortController().signal,
 });
 assert.equal(result.lines.length,2);
 assert.equal(calls,2);
 const failure=helper(async options=>options.onToken('broken reply'));
 await assert.rejects(()=>failure.proposeTranslation({
  project,port:8080,signal:new AbortController().signal,
 }),/JSON/);
 const abort=new AbortController();abort.abort();
 let invoked=0;
 const cancelled=helper(async()=>{invoked++;});
 await assert.rejects(()=>cancelled.proposeTranslation({
  project,port:8080,signal:abort.signal,
 }),/stopped/);
 assert.equal(invoked,0);
});

test('Long model outputs abort and do not return a generated proposal',async()=>{
 let cancelled=false;
 const api=helper(async options=>{
  options.onToken('x'.repeat(14001));
  cancelled=options.signal.aborted;
 });
 await assert.rejects(()=>api.proposeTranslation({project,port:8080,
  signal:new AbortController().signal}),/exceeded/);
 assert.equal(cancelled,true);
});
