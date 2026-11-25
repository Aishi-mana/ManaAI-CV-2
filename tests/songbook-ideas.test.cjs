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
 vm.runInNewContext(js,{exports,require:name=>{
  if(!(name in dependencies))throw Error('Unexpected dependency '+name);
  return dependencies[name];
 },JSON,Date,Number,Math,Array,Set,Map,String,Object,Error,AbortController},{filename:path});
 return exports;
}
const original=load('src/core/originalSong.ts');
const domain={isRecord:value=>!!value&&typeof value==='object'&&!Array.isArray(value)};
const context={name:'Mana',mood:'curious',interests:['art','night skies'],recentSongTitles:['Old Star']};
const idea={
 title:'Little Lanterns',
 concept:'Imagined lanterns floating over a quiet garden',
 creativeReason:'I like peaceful nighttime scenes.',
 prompt:'A completely original dreamy synth-pop melody with gentle bells and quiet strings.',
 lyrics:'[Verse]\nLittle lanterns drift up high\nGolden light across the sky\n[Chorus]\nEvery gentle spark is new\nI can share this light with you',
 style:'synth-pop',duration:90,seed:42,
};
function runtime(streamChat){
 return load('src/core/songbookIdeas.ts',{
  './llm':{streamChat},
  './originalSong':original,
  './validation':domain,
 });
}
const plain=value=>JSON.parse(JSON.stringify(value));

test('Songbook asks local chat model for original lyrics without web or covers',()=>{
 const {songbookIdeaMessages}=runtime(async()=>{});
 const messages=plain(songbookIdeaMessages(context));
 assert.equal(messages.length,2);
 assert.deepEqual(messages.map(m=>m.role),['system','user']);
 assert.match(messages[0].content,/ORIGINAL song/);
 assert.match(messages[0].content,/No web search/);
 assert.match(messages[0].content,/copyrighted melodies/);
 assert.match(messages[0].content,/existing local ACE-Step|local ACE-Step/);
 assert.match(messages[1].content,/Old Star/);
 assert.ok(messages[1].content.length<900);
 assert.ok(messages[0].content.length<2800);
});

test('One complete JSON song becomes a validated local ACE-Step original brief',async()=>{
 const calls=[];
 const {prepareWeeklySongIdea}=runtime(async opts=>{calls.push(opts);opts.onToken(JSON.stringify(idea));});
 const result=plain(await prepareWeeklySongIdea({port:8080,context,signal:new AbortController().signal}));
 assert.equal(calls.length,1);
 assert.equal(calls[0].maxTokens,1250);
 assert.equal(calls[0].temperature,.8);
 assert.equal(calls[0].rejectTruncated,true);
 assert.equal(calls[0].port,8080);
 assert.equal(result.title,'Little Lanterns');
 assert.equal(result.brief.style,'synth-pop');
 assert.equal(result.brief.duration,90);
 assert.equal(result.brief.seed,42);
 assert.equal(result.brief.instrumental,false);
 assert.equal(result.brief.lyrics,idea.lyrics);
 assert.equal(result.creativeReason,idea.creativeReason);
});

test('Malformed and plagiaristic-looking ideas are not submitted to audio',()=>{
 const {readSongbookIdea}=runtime(async()=>{});
 for(const raw of [
  'just write something nice',
  '{"title":"Incomplete"}',
  JSON.stringify({...idea,title:''}),
  JSON.stringify({...idea,prompt:''}),
  JSON.stringify({...idea,lyrics:'Do re mi'}),
  JSON.stringify({...idea,style:'other'}),
  JSON.stringify({...idea,duration:200}),
  JSON.stringify({...idea,seed:-1}),
  JSON.stringify({...idea,concept:'A cover of a famous song'}),
  JSON.stringify({...idea,prompt:'In the style of an existing singer'}),
  JSON.stringify({...idea,lyrics:'[Verse]\n'+('la'.repeat(1400))}),
 ])assert.throws(()=>readSongbookIdea(raw));
 const safe=plain(readSongbookIdea(JSON.stringify(idea)));
 assert.equal(safe.title,'Little Lanterns');
});

test('A single bounded JSON repair is attempted; a second invalid reply is rejected',async()=>{
 let attempts=0;
 const {prepareWeeklySongIdea}=runtime(async opts=>{
  attempts++;
  opts.onToken(attempts===1?'The song is ready!':JSON.stringify(idea));
 });
 const repaired=await prepareWeeklySongIdea({port:8080,context,signal:new AbortController().signal});
 assert.equal(repaired.title,'Little Lanterns');
 assert.equal(attempts,2);
 let badCalls=0;
 const bad=runtime(async opts=>{badCalls++;opts.onToken('no JSON');});
 await assert.rejects(bad.prepareWeeklySongIdea({
  port:8080,context,signal:new AbortController().signal,
 }),/JSON/);
 assert.equal(badCalls,2);
});

test('Transport failure and cancellation do not launch another audio or model request',async()=>{
 const aborted=new AbortController();aborted.abort();
 let count=0;
 const {prepareWeeklySongIdea}=runtime(async opts=>{count++;opts.onToken(JSON.stringify(idea));});
 await assert.rejects(prepareWeeklySongIdea({port:8080,context,signal:aborted.signal}),/cancelled/);
 assert.equal(count,0);
 const bad=runtime(async()=>{count++;throw Error('Local llama server disconnected');});
 await assert.rejects(bad.prepareWeeklySongIdea({
  port:8080,context,signal:new AbortController().signal,
 }),/disconnected/);
 assert.equal(count,1);
});

test('Oversized model output aborts its streaming request safely',async()=>{
 let stopped=false;
 const {prepareWeeklySongIdea}=runtime(async opts=>{
  opts.onToken('x'.repeat(5501));
  stopped=opts.signal.aborted;
 });
 await assert.rejects(prepareWeeklySongIdea({port:8080,context,signal:new AbortController().signal}),/too long/);
 assert.equal(stopped,true);
});

test('Markdown fenced JSON from compatible local models is accepted',()=>{
 const {readSongbookIdea}=runtime(async()=>{});
 const f=String.fromCharCode(96).repeat(3);
 const result=readSongbookIdea(f+'json\n'+JSON.stringify(idea)+'\n'+f);
 assert.equal(result.title,idea.title);
});


test('Original anime opening request stays new and English rather than translating a cover',()=>{
 const {songbookIdeaMessages}=runtime(async()=>{});
 const messages=plain(songbookIdeaMessages({...context,creativeDirection:'anime-opening-original'}));
 assert.match(messages[0].content,/ORIGINAL English-language anime-opening-inspired song/);
 assert.match(messages[0].content,/NOT an adaptation, translation, cover/);
 assert.match(messages[0].content,/Do not mention or copy a named franchise/);
 assert.match(messages[1].content,/completely original English anime-opening-style song/);
 assert.match(messages[1].content,/anime-opening-original/);
 const normal=plain(songbookIdeaMessages(context));
 assert.doesNotMatch(normal[0].content,/For this request, write a completely ORIGINAL English-language anime-opening-inspired song/);
});
