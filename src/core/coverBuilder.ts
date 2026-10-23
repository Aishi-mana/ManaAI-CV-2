import {validateNoteEdit,type NoteEdit} from './builderNotes';
import {checkedSections,type BackingSection} from './backingSections';
import {validTrackTrim,validateClips,type BuilderClip,type TrackTrim} from './builderTimeline';
export interface InstrumentCustom{pitch:number;extension:number}
export function defaultInstrumentCustom(instrument:string):InstrumentCustom{return {pitch:instrument==='guitar-bright-room'?2:0,extension:0};}
const generatedAudioPath=(value:unknown)=>{if(typeof value!=='string')return '';const p=value.replace(/\\/g,'/');return p.toLowerCase().startsWith('c:/ai/manaai-cv-2/exports/singing/')&&p.toLowerCase().endsWith('.wav')&&!p.split('/').some(s=>s==='.'||s==='..')?p:'';};
export interface BuilderTrack{id:string;name:string;role:'vocal'|'backing-vocal'|'guitar'|'piano'|'bass'|'drums'|'other';path:string;originalPath:string;gain:number;muted:boolean;offset:number;seconds:number;converted:boolean;replacement?:string;custom?:InstrumentCustom;sections?:BackingSection[];sectionFade?:number;trim?:TrackTrim;clips?:BuilderClip[];solo?:boolean;noteEdit?:NoteEdit;detectedNotes?:{path:string;start:number;seconds:number}}
export interface BuilderDraft{title:string;tracks:BuilderTrack[]}
export function validateBuilderTracks(value:unknown):BuilderTrack[]{
 if(!Array.isArray(value))return [];
 const tracks:BuilderTrack[]=[];
 for(const item of value.slice(0,16)){
  if(!item||typeof item!=='object')continue;const t=item as Record<string,unknown>;
  const path=generatedAudioPath(t.path),originalPath=generatedAudioPath(t.originalPath);
  if(!path||!originalPath||typeof t.id!=='string'||!/^track-[a-z0-9-]{1,80}$/.test(t.id)||tracks.some(p=>p.id===t.id))continue;
  const role=['vocal','backing-vocal','guitar','piano','bass','drums','other'].includes(String(t.role))?t.role as BuilderTrack['role']:'other';
  if(role==='vocal'&&tracks.some(p=>p.role==='vocal'))continue;
  const number=(v:unknown,fallback:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:fallback;
  let sections:BackingSection[]|undefined;
  if(role==='backing-vocal'&&t.sections!==undefined){try{sections=checkedSections(t.sections as BackingSection[],number(t.seconds,0,0,3600));}catch{sections=[];}}
  tracks.push({id:t.id,name:typeof t.name==='string'?t.name.trim().slice(0,100)||'Track':'Track',role,path,originalPath,gain:number(t.gain,1,0,1),muted:t.muted===true,offset:number(t.offset,0,-3600,3600),seconds:number(t.seconds,0,0,3600),converted:t.converted===true,replacement:typeof t.replacement==='string'?t.replacement.slice(0,100):undefined,custom:validCustom(t.custom),trim:validTrackTrim(t.trim,number(t.seconds,0,0,3600)),solo:t.solo===true,noteEdit:validateNoteEdit(t.noteEdit,number(t.seconds,0,0,3600)),detectedNotes:validNoteCache(t.detectedNotes,number(t.seconds,0,0,3600)),clips:t.clips===undefined?undefined:validateClips(t.clips,number(t.seconds,0,0,3600)),sections,sectionFade:role==='backing-vocal'?number(t.sectionFade,.15,0,2):undefined});
 }return tracks;
}

function validCustom(value:unknown):InstrumentCustom|undefined{
 if(!value||typeof value!=='object')return undefined;
 const c=value as Record<string,unknown>;
 if(typeof c.pitch!=='number'||!Number.isInteger(c.pitch)||c.pitch< -12||c.pitch>12||typeof c.extension!=='number'||!Number.isFinite(c.extension)||c.extension<0||c.extension>1.5)return undefined;
 return {pitch:c.pitch,extension:c.extension};
}

export function detectedPreviewSections(trackSeconds:number,start:number,seconds:number,whole:boolean):{start:number;seconds:number;offset:number}[]{
 if(!Number.isFinite(trackSeconds)||trackSeconds<1||trackSeconds>3600)throw Error('Use a track between 1 second and 1 hour.');
 if(whole){start=0;seconds=trackSeconds;}
 if(!Number.isFinite(start)||!Number.isFinite(seconds)||start<0||seconds<1||(!whole&&seconds>60)||start+seconds>trackSeconds+.000001)throw Error('Choose a 1–60 second preview within this track, or Whole song.');
 const blocks=Math.ceil(seconds/60),length=seconds/blocks;
 return Array.from({length:blocks},(_,i)=>({start:start+i*length,seconds:i===blocks-1?seconds-i*length:length,offset:i*length}));
}

function validNoteCache(value:unknown,seconds:number):BuilderTrack['detectedNotes']{if(!value||typeof value!=='object')return;const v=value as {path:string;start:number;seconds:number};if(typeof v.path!=='string'||!v.path.replace(/\\/g,'/').toLowerCase().startsWith('c:/ai/manaai-cv-2/exports/singing/')||!v.path.endsWith('.json')||v.path.replace(/\\/g,'/').split('/').some(x=>x==='..'||x==='.')||!Number.isFinite(v.start)||v.start<0||!Number.isFinite(v.seconds)||v.seconds<1||v.seconds>60||v.start+v.seconds>seconds+.00001)return;return {path:v.path,start:v.start,seconds:v.seconds};}
