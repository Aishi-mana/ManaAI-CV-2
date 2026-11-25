const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function load(streamChat=async()=>{}){
 const exports={};
 const source=ts.transpileModule(fs.readFileSync('src/core/coverDiscovery.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(source,{
  exports,JSON,Date,Math,Map,Set,Array,Object,Number,String,Error,URL,
  require:id=>id==='./animeCoverPreference'?{rankCoverCandidates:items=>items,coverPreferenceInstruction:()=>'',coverPreferenceSearchTheme:theme=>theme}:id==='./llm'?{streamChat}:id==='./musicStudio'?{generatedAudioPath:path=>typeof path==='string'&&path.startsWith('C:/AI/ManaAI-CV-2/exports/singing/')&&path.endsWith('.wav')?path:''}:(()=>{throw Error('Unexpected '+id);})(),
 },{filename:'src/core/coverDiscovery.ts'});
 return exports;
}
const plain=x=>JSON.parse(JSON.stringify(x));
const idea=(url='https://example.org/old-music')=>({
 id:'cover-example',createdAt:'2026-11-25T00:00:00.000Z',query:'old music',
 title:'Historical music archive',url,excerpt:'A description of songs',reason:'I enjoy this mood.',
});

test('Discovery query is bounded and prefers documented public-domain works',()=>{
 const cover=load();
 assert.match(cover.coverSearchQuery(''),/public domain/);
 assert.match(cover.coverSearchQuery('gentle piano'),/gentle piano song public domain/);
 assert.throws(()=>cover.coverSearchQuery('x'.repeat(121)),/up to 120/);
});
test('Untrusted and duplicate web URLs cannot enter the idea shelf',()=>{
 const cover=load();
 for(const url of ['javascript:alert(1)','http://example.org/music','https://localhost/','https://127.0.0.1/',
  'https://alice:pass@example.org','file:///etc/passwd','https://example.org/music#section']){
  assert.equal(cover.safeCoverUrl(url),'');
  assert.equal(cover.normalizeCoverIdea(idea(url)),undefined);
 }
 const list=cover.verifiedCoverSources([
  {url:'https://example.org/a',title:'Traditional songs',snippets:['A source']},
  {url:'https://example.org/a',title:'Duplicate',snippets:['Ignore']},
  {url:'https://localhost/secret',title:'Private',snippets:['No']},
  {url:'http://example.org/b',title:'Plain HTTP',snippets:['No']},
 ]);
 assert.equal(list.length,1);
 assert.equal(list[0].title,'Traditional songs');
 const state={coverIdeas:[]};
 const one=cover.addCoverIdea(state,idea());
 assert.equal(one.coverIdeas.length,1);
 assert.equal(state.coverIdeas.length,0);
 assert.throws(()=>cover.addCoverIdea(one,idea()),/already saved/);
 assert.equal(cover.removeCoverIdea(one,'cover-example').coverIdeas.length,0);
});
test('Mana picks only a web-provided source, not imaginary audio or a guessed title',async()=>{
 let messages;
 const cover=load(async options=>{
  messages=options.messages;
  options.onToken('{"index":1,"reason":"I like the quiet melody this page describes."}');
 });
 const chosen=await cover.pickCoverSource({
  sources:[{url:'https://example.org/song',title:'Historical tune page',snippets:['A traditional work']}],
  theme:'gentle songs',name:'Mana',port:8080,signal:new AbortController().signal,
 });
 assert.equal(chosen.source.title,'Historical tune page');
 assert.equal(chosen.source.url,'https://example.org/song');
 assert.match(chosen.reason,/quiet melody/);
 assert.match(messages[0].content,/not verifying a song/);
 assert.match(messages[0].content,/Never claim that audio is downloaded/);
 assert.equal(cover.readCoverPick('{"index":1,"reason":"Good fit."}',1).index,1);
 for(const text of ['{"index":2,"reason":"Bad"}','{"index":-1,"reason":"Bad"}',
  '{"index":1,"reason":""}','{"index":"1","reason":"Bad"}','not json']){
  assert.throws(()=>cover.readCoverPick(text,1));
 }
});
test('No relevant source fails without saving a fabricated cover',async()=>{
 const cover=load(async options=>options.onToken('{"index":0,"reason":"Nothing looks like a song."}'));
 await assert.rejects(()=>cover.pickCoverSource({
  sources:[{url:'https://example.org/page',title:'Unrelated source',snippets:['Unrelated']}],
  theme:'piano',name:'Mana',port:8080,signal:new AbortController().signal,
 }),/did not find/);
});
test('Cover discovery uses existing local search and stores source only',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8');
 assert.match(app,/invoke<CoverSearchSource\[\]>\('search_web',\{query\}\)/);
 assert.match(app,/pickCoverSource\(/);
 assert.match(app,/setSongbookState\(next\)/);
 assert.doesNotMatch(app.slice(app.indexOf('async function discoverCoverIdea'),app.indexOf('async function convertRecordedSongToManaVoice')),/invoke\('singing_start'|invoke\('original_song_start'/);
 const ui=fs.readFileSync('src/components/SongbookWorkspace.tsx','utf8');
 assert.match(ui,/open_web_source/);
 assert.match(ui,/Find a cover idea/);
 assert.match(ui,/Source only; no audio imported/);
});
