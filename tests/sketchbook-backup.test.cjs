const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {TextEncoder}=require('node:util');

const stored=new Map();
let restored;
function evaluate(path,requireModule){
 const exports={};
 const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 vm.runInNewContext(js,{
  exports,require:requireModule,Date,JSON,Object,Array,Set,Math,Number,String,Error,TextEncoder,
 },{filename:path});
 return exports;
}
const validation=evaluate('src/core/validation.ts',()=>{throw Error('Unexpected validation import');});
const persistence={
 readStored:key=>stored.get(key)??null,
 writeStored:(key,value)=>stored.set(key,value),
 flushPersistence:async()=>{},
 restoreStored:async(values,safety)=>{restored={values,safety};},
};
const sketchbook=evaluate('src/core/sketchbook.ts',name=>{
 if(name==='./persistence')return persistence;
 if(name==='./validation')return validation;
 if(name==='./clock')return evaluate('src/core/clock.ts',()=>{throw Error('Unexpected clock import');});
 throw Error('Unknown Sketchbook import '+name);
});
// Other backup sections are mocked with stable no-op validators. These tests
// exercise the actual backup schema, Sketchbook validator and restore call;
// they do not replace the application-wide backup or native file tests.
function otherModule(name){
 return new Proxy({},{
  get(_target,key){
   if(key==='GAME_DEV_KEY')return 'mana.game_dev.v1';
   if(key==='ROOM_KEY')return 'mana.companion_room.v1';
   if(key==='MUSIC_DRAFTS_KEY')return 'mana.music_drafts.v1';
   if(key==='upgradeCustomVoice')return value=>value;
   if(key==='validateInitiative')return value=>value??{music:{songs:[]},studio:{projects:[]}};
   if(key==='validateCodeGames')return value=>value??{games:[],reports:[]};
   if(key==='validateStudio')return value=>value??{projects:[]};
   if(typeof key==='string'&&key.startsWith('validate'))return value=>value??[];
   return undefined;
  }
 });
}
const backup=evaluate('src/core/backup.ts',name=>{
 if(name==='./persistence')return persistence;
 if(name==='./validation')return validation;
 if(name==='./sketchbook')return sketchbook;
 return otherModule(name);
});
const plain=value=>JSON.parse(JSON.stringify(value));
const drawing={
 id:'sketch123',imageId:'gallery123',slotId:'2026-11-03',createdAt:'2026-11-03T04:15:00.000Z',
 title:'Cloud garden',concept:'An imagined garden on a cloud',prompt:'Doodle a pastel cloud garden',
 sourceType:'scheduled-drawing',imagined:true,inspiration:'imagination',
};
const activated=()=>sketchbook.setSketchbookEnabled(sketchbook.validateSketchbook(null),true,new Date('2026-11-02T01:00:00.000Z'));

test('Current backups roundtrip Sketchbook entries and deletion tombstones as metadata',()=>{
 stored.clear();
 let state=activated();
 state=sketchbook.addSketchbookEntry(state,drawing);
 state=sketchbook.removeSketchbookEntry(state,drawing.id);
 sketchbook.saveSketchbook(state);
 const file=backup.snapshotBackup();
 assert.equal(file.format,'mana-backup');
 assert.equal(file.data['mana.sketchbook.v1'].settings.enabled,true);
 assert.deepEqual(plain(file.data['mana.sketchbook.v1'].removedSlots),['2026-11-03']);
 assert.equal(file.data['mana.sketchbook.v1'].entries.length,0);
 assert.deepEqual(plain(backup.validateBackup(JSON.stringify(file)).data['mana.sketchbook.v1']),plain(state));
 assert.equal(sketchbook.dueSketchbookSlot(sketchbook.validateSketchbook(file.data['mana.sketchbook.v1']),new Date('2026-11-03T06:00:00.000Z')),null);
});

test('Legacy backups without a Sketchbook section restore with drawing disabled',()=>{
 stored.clear();
 const old=plain(backup.snapshotBackup());
 delete old.data['mana.sketchbook.v1'];
 const valid=backup.validateBackup(JSON.stringify(old));
 assert.equal(valid.data['mana.sketchbook.v1'].settings.enabled,false);
 assert.equal(valid.data['mana.sketchbook.v1'].entries.length,0);
 assert.equal(valid.data['mana.sketchbook.v1'].settings.enabledAt,null);
});

test('Corrupt Sketchbook sections reject restore without silently accepting bad metadata',()=>{
 stored.clear();
 let file=plain(backup.snapshotBackup());
 file.data['mana.sketchbook.v1']={...activated(),entries:[{...drawing,sourceType:'diary'}]};
 assert.throws(()=>backup.validateBackup(JSON.stringify(file)),/Invalid data in mana.sketchbook.v1/);
 file=plain(backup.snapshotBackup());
 file.data['mana.sketchbook.v1']={...activated(),removedSlots:['../unsafe']};
 assert.throws(()=>backup.validateBackup(JSON.stringify(file)),/Invalid data in mana.sketchbook.v1/);
});

test('Restore hands normalized Sketchbook metadata to the existing storage restore',async()=>{
 stored.clear();
 restored=undefined;
 let state=activated();
 state=sketchbook.addSketchbookEntry(state,drawing);
 const original=backup.snapshotBackup();
 original.data['mana.sketchbook.v1']=state;
 await backup.restoreBackup(original);
 assert.ok(restored);
 assert.deepEqual(JSON.parse(restored.values['mana.sketchbook.v1']),plain(state));
});
