import {validateLyrics,type LyricLine} from './lyrics';
import {validateOriginalBrief,type OriginalBrief} from './originalSong';
import {validateBuilderTracks,type BuilderTrack} from './coverBuilder';
export const SINGING_REFERENCE='C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/singing.wav';
export interface StudioProject{
 lyrics?:LyricLine[];kind?:'cover'|'original'|'builder';original?:OriginalBrief;generatedLyrics?:string;builderTracks?:BuilderTrack[];
 id:string;title:string;createdAt:string;status:'rendering'|'ready'|'error'|'stopped'|'interrupted';
 stems?:{name:string;path:string;gain:number;muted:boolean}[];
 source:string;vocal:string;mix:string;instrumental:string;seconds:number;artwork:string;error:string;
 settings:{wholeSong:boolean;start:number;seconds:number;separate:boolean;backingGain:number;vocalGain?:number;reference:string;extractor?:'mega-lead'|'demucs'};
}
export interface StudioState{projects:StudioProject[];selectedId:string|null}
export const generatedAudioPath=(value:unknown):string=>{
 if(typeof value!=='string')return '';const path=value.replace(/\\/g,'/');
 return path.toLowerCase().startsWith('c:/ai/manaai-cv-2/exports/singing/')&&path.toLowerCase().endsWith('.wav')&&!path.split('/').some(s=>s==='.'||s==='..')?path:'';
};
export function validateStudio(value:unknown):StudioState{
 const raw=value&&typeof value==='object'?value as Record<string,unknown>:{};const projects:StudioProject[]=[];
 for(const item of (Array.isArray(raw.projects)?raw.projects:[]).slice(0,50)){
  if(!item||typeof item!=='object')continue;const p=item as Record<string,unknown>;
  if(typeof p.id!=='string'||!/^studio-[a-z0-9-]{1,80}$/.test(p.id)||projects.some(q=>q.id===p.id)||typeof p.title!=='string'||!p.title.trim()||typeof p.createdAt!=='string'||!Number.isFinite(Date.parse(p.createdAt)))continue;
  const settings=p.settings&&typeof p.settings==='object'?p.settings as Record<string,unknown>:{};
  const number=(v:unknown,fallback:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:fallback;
  projects.push({lyrics:p.lyrics===undefined?undefined:validateLyrics(p.lyrics),kind:p.kind==='original'?'original':p.kind==='builder'?'builder':'cover',builderTracks:validateBuilderTracks(p.builderTracks),original:validateOriginalBrief(p.original),generatedLyrics:typeof p.generatedLyrics==='string'?p.generatedLyrics.slice(0,6000):'',id:p.id,title:p.title.trim().slice(0,120),createdAt:p.createdAt,status:['rendering','ready','error','stopped','interrupted'].includes(String(p.status))?p.status as StudioProject['status']:'error',stems:Array.isArray(p.stems)?p.stems.slice(0,8).flatMap((item:unknown)=>{if(!item||typeof item!=='object')return [];const stem=item as Record<string,unknown>;const path=generatedAudioPath(stem.path);return path&&typeof stem.name==='string'&&['guitar','piano','bass','drums','other','sax','electric-guitar','replacement-piano','electric-guitar-distorted','sax-tenor','sax-weresax','finger-bass','picked-bass','guitar-bright-room','guitar-nam-warm','guitar-nam-rhythm','guitar-nam-lead','strings-estimate','winds-estimate','sax-extracted','piano-banquet','keyboard-extracted','electric-piano-extracted','trumpet-extracted','trumpet'].includes(stem.name)?[{name:stem.name,path,gain:number(stem.gain,1,0,1),muted:stem.muted===true}]:[];}):[],source:typeof p.source==='string'?p.source.slice(0,2000):'',vocal:generatedAudioPath(p.vocal),mix:generatedAudioPath(p.mix),instrumental:generatedAudioPath(p.instrumental),seconds:number(p.seconds,0,0,86400),artwork:typeof p.artwork==='string'&&p.artwork.length<=150000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.artwork)?p.artwork:'',error:typeof p.error==='string'?p.error.slice(0,1000):'',settings:{extractor:settings.extractor==='mega-lead'?'mega-lead':'demucs',wholeSong:settings.wholeSong===true,start:number(settings.start,0,0,3600),seconds:number(settings.seconds,10,1,60),separate:settings.separate!==false,backingGain:number(settings.backingGain,.3,0,1),vocalGain:number(settings.vocalGain,1,0,1),reference:typeof settings.reference==='string'?settings.reference.slice(0,2000):''}});
 }
 return {projects,selectedId:projects.some(p=>p.id===raw.selectedId)?raw.selectedId as string:projects[0]?.id??null};
}
export const durationLabel=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export function mergeDiscovered(state:StudioState,found:StudioProject[]):StudioState{
 const paths=new Set(state.projects.flatMap(p=>[p.vocal,p.mix]).filter(Boolean));
 const additions=found.filter(p=>!state.projects.some(q=>q.id===p.id)&&![p.vocal,p.mix].filter(Boolean).some(path=>paths.has(path)));
 return validateStudio({...state,projects:[...state.projects,...additions]});
}
