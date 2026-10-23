export interface EditableNote {start:number;end:number;pitch:number;velocity:number}
export interface NoteEdit {start:number;seconds:number;instrument:string;notes:EditableNote[]}
export const noteInstruments=[['piano','Piano'],['sax','Sax'],['acoustic-guitar','Acoustic guitar'],['electric-guitar','Electric guitar'],['finger-bass','Bass'],['strings','Strings'],['flute','Flute'],['trumpet','Trumpet'],['harmonica','Harmonica'],['electric-piano','Electric piano'],['synth-pad','Synth pad'],['drums-standard','Standard drums'],['drums-rock','Rock drums']] as const;
export function validateNoteEdit(value:unknown,trackSeconds:number):NoteEdit|undefined{
 if(!value||typeof value!=='object')return;const v=value as NoteEdit;
 if(!Number.isFinite(v.start)||v.start<0||!Number.isFinite(v.seconds)||v.seconds<1||v.seconds>60||v.start+v.seconds>trackSeconds+.000001||!noteInstruments.some(([id])=>id===v.instrument)||!Array.isArray(v.notes)||v.notes.length>4096)return;
 const notes:EditableNote[]=[];
 for(const n of v.notes){if(!n||!Number.isFinite(n.start)||n.start<0||!Number.isFinite(n.end)||n.end<=n.start||n.end>v.seconds||!Number.isInteger(n.pitch)||n.pitch<0||n.pitch>127||!Number.isFinite(n.velocity)||n.velocity<0||n.velocity>1)return;notes.push({start:n.start,end:n.end,pitch:n.pitch,velocity:n.velocity});}
 return {start:v.start,seconds:v.seconds,instrument:v.instrument,notes};
}
export function importDetectedNotes(value:unknown,seconds:number):EditableNote[]{
 if(!Array.isArray(value)||value.length>4096)throw Error('Use a saved notes.json array with at most 4096 notes.');
 const notes=value.map(row=>{if(!Array.isArray(row)||row.length<4)throw Error('Use detected start, end, MIDI pitch and strength values.');return {start:row[0],end:row[1],pitch:row[2],velocity:row[3]};});
 const valid=validateNoteEdit({start:0,seconds,instrument:'piano',notes},seconds);if(!valid)throw Error('Notes must fit this 1–60 second section; pitch 0–127 and strength 0–1.');return valid.notes;
}
export function noteName(pitch:number){return ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][pitch%12]+(Math.floor(pitch/12)-1);}
