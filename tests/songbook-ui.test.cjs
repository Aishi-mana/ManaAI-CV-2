const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('src/components/SongbookWorkspace.tsx','utf8');
const css=fs.readFileSync('src/styles.css','utf8');

test('Songbook retains compose, stop, schedule, studio and native audio operations',()=>{
 for(const callback of ['onCompose','onStop','onEnable','onCatchUp','onOpenStudio','onConvertVoice','onClose']){
  assert.match(source,new RegExp(callback));
 }
 assert.match(source,/invoke<number\[\]\|ArrayBuffer>\('singing_audio',\{path\}\)/);
 assert.match(source,/<audio[^>]*controls/);
 assert.match(source,/URL\.revokeObjectURL\(audioUrl\)/);
});

test('Selected original defaults to Mana voice when a completed conversion exists',()=>{
 assert.match(source,/const defaultVersion=.*?entry\.voiceMixPath\?'mana':'guide'/);
 assert.match(source,/version==='mana'\?song\.voiceMixPath:song\.audioPath/);
 assert.match(source,/aria-pressed=\{activeVersion==='mana'\}/);
 assert.match(source,/aria-pressed=\{activeVersion==='guide'\}/);
});

test('Audio loading prevents stale requests from replacing the selected recording',()=>{
 assert.match(source,/const request=\+\+audioRequest\.current/);
 assert.match(source,/if\(request!==audioRequest\.current\)return/);
 assert.match(source,/function resetAudio\(\)/);
 assert.match(source,/audioRequest\.current\+\+/);
});

test('Songbook offers readable search, statuses, lyrics and a retry for legacy guides',()=>{
 assert.match(source,/type="search"/);
 assert.match(source,/aria-label="Search Songbook"/);
 assert.match(source,/aria-pressed=\{selected\?\.id===entry\.id\}/);
 assert.match(source,/entry\.voiceError\?'Voice needs retry'/);
 assert.match(source,/selected\.voiceError\?'Retry conversion'/);
 assert.match(source,/Original lyrics/);
 assert.match(source,/Musical direction/);
});

test('Responsive Songbook rules remain scoped to the Songbook UI',()=>{
 for(const selector of ['.songbook-dashboard','.songbook-library-layout','.songbook-song-list',
  '.songbook-song-detail','.songbook-version-picker','.songbook-record-cover','.songbook-header']){
  assert.ok(css.includes(selector),'Missing '+selector);
 }
 assert.match(css,/@media\(max-width:960px\)/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css, /prefers-reduced-motion:reduce/);
});
