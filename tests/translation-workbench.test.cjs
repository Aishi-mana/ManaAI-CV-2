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
 vm.runInNewContext(js,{exports,JSON,Date,Number,Math,Map,Set,Object,Array,Error,String,URL,
  require:name=>{if(name in mocks)return mocks[name];throw Error('Unexpected '+name);}},
  {filename:path});
 return exports;
}
const midiMelody=load('src/core/midiMelody.ts');
const workbench=load('src/core/translationWorkbench.ts',{'./midiMelody':midiMelody});
const plain=x=>JSON.parse(JSON.stringify(x));
const example='光の道を歩いて\n新しい朝が来る\n夢を胸に抱きしめて';
const at=()=>new Date('2026-11-25T04:00:00.000Z');
const project=(overrides={})=>workbench.createTranslationProject({
 id:'translation-fixture',title:'Original sample excerpt',sourceLyrics:example,
 rightsBasis:'owned',acknowledged:true,now:at(),...overrides,
});
const state=()=>({translations:[project()]});

test('Source lyrics require a user declaration of translation/adaptation rights',()=>{
 for(const basis of ['',null,'unknown']){
  assert.throws(()=>project({rightsBasis:basis}),/Confirm authorization/);
 }
 assert.throws(()=>project({acknowledged:false}),/Confirm authorization/);
 for(const basis of ['owned','licensed','public-domain']){
  const item=project({rightsBasis:basis});
  assert.equal(item.rightsBasis,basis);
  assert.equal(item.rightsAcknowledgedAt,at().toISOString());
  assert.equal(item.sourceLanguage,'ja');assert.equal(item.targetLanguage,'en');
 }
 assert.throws(()=>project({sourceLyrics:''}),/1–16/);
 assert.throws(()=>project({sourceLyrics:('abc\n').repeat(17)}),/1–16/);
 assert.throws(()=>project({sourceLyrics:'x'.repeat(221)}),/1–16/);
 assert.throws(()=>project({sourceLyrics:'x'.repeat(5001)}),/5,000/);
 const withBlanks=project({sourceLyrics:'abc\r\n \r\nxyz'});
 assert.equal(withBlanks.lines.length,2);
 assert.equal(withBlanks.lines[1].source,'xyz');
});

test('Text drafts preserve source, allow 0–30 target syllables and editing',()=>{
 const first=state();
 const revised=workbench.updateTranslationLine(first,'translation-fixture',1,'english','  Another day ',at());
 assert.equal(revised.translations[0].lines[1].english,'  Another day ');
 assert.equal(first.translations[0].lines[1].english,'');
 assert.equal(revised.translations[0].lines[1].source,project().lines[1].source);
 const metered=workbench.updateTranslationLine(revised,'translation-fixture',1,'targetSyllables',6,at());
 assert.equal(metered.translations[0].lines[1].targetSyllables,6);
 assert.throws(()=>workbench.updateTranslationLine(metered,'translation-fixture',1,'targetSyllables',-1,at()),/0–30/);
 assert.throws(()=>workbench.updateTranslationLine(metered,'translation-fixture',1,'targetSyllables',31,at()),/0–30/);
 assert.throws(()=>workbench.updateTranslationLine(metered,'translation-fixture',3,'english','x',at()),/unavailable/);
 assert.throws(()=>workbench.updateTranslationLine(metered,'translation-fixture',1,'english','a'.repeat(251),at()),/length/);
 assert.equal(workbench.approximateEnglishSyllables('Another morning'),5);
});

test('Mana suggestions must map every original line exactly; no invented lines',()=>{
 const p=project();
 const proposal={lines:[
  {index:1,english:'Along a road of light',note:'Keep a soft stress on light'},
  {index:2,english:'A new morning arrives',note:'A gentle ending'},
  {index:3,english:'I hold my dreams so close',note:'Approximate syllables, not melody timing'},
 ]};
 const applied=workbench.applyTranslationProposal({translations:[p]},p.id,proposal,at());
 assert.equal(applied.translations[0].lines[0].english,'Along a road of light');
 assert.equal(applied.translations[0].lines[0].source,p.lines[0].source);
 assert.equal(applied.translations[0].lines.length,p.lines.length);
 assert.equal(p.lines[0].english,'');
 for(const invalid of [
  {lines:proposal.lines.slice(0,2)},
  {lines:[proposal.lines[0],proposal.lines[0],proposal.lines[2]]},
  {lines:[proposal.lines[0],{...proposal.lines[1],index:4},proposal.lines[2]]},
  {lines:[proposal.lines[0],{...proposal.lines[1],english:''},proposal.lines[2]]},
 ])assert.throws(()=>workbench.applyTranslationProposal({translations:[p]},p.id,invalid,at()));
});

test('Saving versions is explicit, restorable, bounded and never overwrites Japanese source',()=>{
 const p=project();
 assert.throws(()=>workbench.saveTranslationVersion({translations:[p]},p.id,'version-first',at()),/at least one/);
 let current=workbench.updateTranslationLine({translations:[p]},p.id,0,'english','Path of light',at());
 current=workbench.saveTranslationVersion(current,p.id,'version-first',at());
 assert.equal(current.translations[0].versions[0].label,'Version 1');
 assert.equal(current.translations[0].versions[0].lines[0].english,'Path of light');
 current=workbench.updateTranslationLine(current,p.id,0,'english','Road of hope',at());
 current=workbench.saveTranslationVersion(current,p.id,'version-second',at());
 assert.equal(current.translations[0].versions[1].lines[0].english,'Road of hope');
 current=workbench.restoreTranslationVersion(current,p.id,'version-first',at());
 assert.equal(current.translations[0].lines[0].english,'Path of light');
 assert.equal(current.translations[0].lines[0].source,p.lines[0].source);
 assert.equal(current.translations[0].versions[1].lines[0].english,'Road of hope');
 const reloaded=workbench.validateTranslationProjects(plain(current.translations));
 assert.equal(reloaded[0].versions.length,2);
 assert.deepEqual(plain(reloaded[0]),plain(current.translations[0]));
});

test('Invalid projects and tampered revision metadata are dropped or sanitized',()=>{
 const p=project();
 const withEnglish=workbench.updateTranslationLine({translations:[p]},p.id,0,'english','Bright road',at());
 const saved=workbench.saveTranslationVersion(withEnglish,p.id,'version-good',at()).translations[0];
 const input=[saved,{...saved,id:'translation-evil',rightsBasis:'unknown'},
  {...saved,id:'translation-evil2',sourceLanguage:'xx'},
  {...saved,id:'translation-evil3',rightsAcknowledgedAt:'nonsense'}];
 const valid=workbench.validateTranslationProjects(plain(input));
 assert.equal(valid.length,1);
 assert.equal(valid[0].versions.length,1);
 const tampered=workbench.normalizeTranslationProject({...saved,versions:[
  {...saved.versions[0],lines:[]},saved.versions[0],
 ]});
 assert.equal(tampered.versions.length,1);
 const invalidEnglish=workbench.normalizeTranslationProject({...saved,lines:[
  {...saved.lines[0],source:''},...saved.lines.slice(1),
 ]});
 assert.equal(invalidEnglish,undefined);
});

test('Draft storage is isolated from Songbook originals, audio and scheduling',()=>{
 const original={translations:[],entries:[{id:'song-existing'}],coverIdeas:[{id:'cover-existing'}],
  weeklyCovers:{local:{enabled:true},web:{enabled:true}}};
 const next=workbench.addTranslationProject(original,project());
 assert.equal(next.entries,original.entries);
 assert.equal(next.coverIdeas,original.coverIdeas);
 assert.equal(next.weeklyCovers,original.weeklyCovers);
 assert.equal(original.translations.length,0);
 assert.throws(()=>workbench.addTranslationProject(next,project()),/already exists/);
 assert.equal(workbench.removeTranslationProject(next,project().id).translations.length,0);
});

test('Translation UI provides reviewed sources, editable English and version recovery without render commands',()=>{
 const ui=fs.readFileSync('src/components/TranslationWorkbench.tsx','utf8');
 const app=fs.readFileSync('src/App.tsx','utf8');
 const book=fs.readFileSync('src/core/songbook.ts','utf8');
 assert.match(ui,/permission to translate\/adapt/);
 assert.match(ui,/Ask Mana for English draft/);
 assert.match(ui,/Save current version/);
 assert.match(ui,/Restore to editor/);
 assert.match(ui,/source \(read-only\)/);
 assert.match(ui,/Target syllables/);
 assert.match(ui,/Phase 3A drafts use only owner-supplied lyrics/);
 const phase=app.slice(app.indexOf('async function draftTranslationEnglish('),app.indexOf('async function chooseWeeklyLocalCoverFolder('));
 assert.match(phase,/proposeTranslation\(/);
 assert.match(phase,/applyTranslationProposal\(/);
 assert.match(phase,/ctrl\.signal\.aborted|ctrl\.signal\.aborted/);
 assert.doesNotMatch(phase,/singing_start|original_song_start|search_web|fetch\(/);
 assert.match(book,/translations:validateTranslationProjects\(/);
});
