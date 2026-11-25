import type {TranslationProject} from './translationWorkbench';
import {
 createMelodyGuide,updateMelodyNote,seedGuideWords,syncGuideEnglish,reviewGuideMapping,
 type MelodyGuide,type MidiPhraseFile,type MelodyRightsBasis,
} from './midiMelody';
export type MelodyEditField='lyric'|'lineIndex'|'position'|'duration'|'tone';
type DraftState={translations:TranslationProject[]};
function updateProject<T extends DraftState>(state:T,id:string,
 transform:(p:TranslationProject)=>MelodyGuide,now=new Date()):T{
 if(!Number.isFinite(now.getTime()))throw Error('Invalid melody edit timestamp.');
 const p=state.translations.find(x=>x.id===id);
 if(!p)throw Error('Translation project is unavailable.');
 const melody=transform(p);
 return {...state,translations:state.translations.map(x=>x.id===id?{
  ...x,updatedAt:now.toISOString(),melody,
 }:x)};
}
export function attachMidiGuide<T extends DraftState>(
 state:T,id:string,file:MidiPhraseFile,trackIndex:number,sourceName:string,
 rightsBasis:MelodyRightsBasis,acknowledged:boolean,now=new Date(),
):T{
 return updateProject(state,id,p=>createMelodyGuide(file,trackIndex,sourceName,
  rightsBasis,acknowledged,p.lines,now),now);
}
export function editMelodyGuide<T extends DraftState>(
 state:T,id:string,noteIndex:number,field:MelodyEditField,value:string|number,now=new Date(),
):T{
 return updateProject(state,id,p=>{
  if(!p.melody)throw Error('Import a melody before editing notes.');
  if(field==='lyric'||field==='lineIndex')
   return updateMelodyNote(p.melody,noteIndex,field,value,p.lines.length);
  if(typeof value!=='number'||!Number.isInteger(value))
   throw Error('Melody timing and pitch must be whole-number MIDI values.');
  const notes=p.melody.notes;
  if(noteIndex<0||noteIndex>=notes.length)throw Error('Note is unavailable.');
  const n=notes[noteIndex];
  const next={...n,[field]:value};
  if(next.tone<0||next.tone>127||next.position<0||next.duration<1||
   next.position+next.duration>480*4*128||
   (noteIndex>0&&next.position<notes[noteIndex-1].position+notes[noteIndex-1].duration)||
   (noteIndex<notes.length-1&&next.position+next.duration>notes[noteIndex+1].position))
   throw Error('Keep pitches at 0–127 and MIDI notes in chronological, non-overlapping order.');
  return {...p.melody,mappingReviewed:false,notes:notes.map((x,i)=>i===noteIndex?next:x)};
 },now);
}
export function seedMelodyGuide<T extends DraftState>(
 state:T,id:string,fromLine:number,toLine:number,now=new Date(),
):T{
 return updateProject(state,id,p=>{
  if(!p.melody)throw Error('Choose a MIDI melody first.');
  return seedGuideWords(p.melody,p.lines,fromLine,toLine);
 },now);
}
export function syncMelodyGuide<T extends DraftState>(state:T,id:string,now=new Date()):T{
 return updateProject(state,id,p=>{
  if(!p.melody)throw Error('Choose a MIDI melody first.');
  return syncGuideEnglish(p.melody,p.lines);
 },now);
}
export function confirmMelodyGuide<T extends DraftState>(state:T,id:string,now=new Date()):T{
 return updateProject(state,id,p=>{
  if(!p.melody)throw Error('Choose a MIDI melody first.');
  return reviewGuideMapping(p.melody,p.lines);
 },now);
}
export function dropMelodyGuide<T extends DraftState>(state:T,id:string):T{
 if(!state.translations.some(p=>p.id===id))throw Error('Translation project is unavailable.');
 return {...state,translations:state.translations.map(p=>p.id===id?{
  ...p,updatedAt:new Date().toISOString(),melody:undefined,
 }:p)};
}
