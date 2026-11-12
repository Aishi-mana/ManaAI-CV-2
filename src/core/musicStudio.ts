import {checkedBandSource,checkedGenreLead,isBandStyle,type BandSource} from './musicGenres';
import {TRAINED_MANA_MODEL} from './voiceProfiles';
import {validateLyrics,type LyricLine} from './lyrics';
import {validateOriginalBrief,type OriginalBrief} from './originalSong';
import {validateBuilderTracks,type BuilderTrack} from './coverBuilder';
export const STUDIO_PROJECT_LIMIT=1000;
export const TRAINED_SINGING_VOICE=TRAINED_MANA_MODEL;
export const SINGING_REFERENCE='C:/AI/ManaAI-CV-2/data/custom-voice/references/mana-v2/singing-stable-v1.wav';
export const BAND_MIX_NAMES=['vocal','lead','accompaniment','bass','drums'] as const;
export type BandMixPart={name:typeof BAND_MIX_NAMES[number];path:string;gain:number;available?:boolean};
export interface StudioProject{
 bandMixParts?:BandMixPart[];
 lyrics?:LyricLine[];kind?:'cover'|'original'|'builder';original?:OriginalBrief;generatedLyrics?:string;builderTracks?:BuilderTrack[];
 id:string;title:string;createdAt:string;status:'rendering'|'ready'|'error'|'stopped'|'interrupted';
 stems?:{name:string;path:string;gain:number;muted:boolean}[];
 source:string;vocal:string;mix:string;instrumental:string;seconds:number;artwork:string;error:string;
 settings:{percussion?:boolean;genre?:'original'|'rock'|'jazz'|'pop'|'country'|'piano-trio'|'guitar-electric';genreLead?:string;bandSource?:BandSource;followBass?:boolean;wholeSong:boolean;start:number;seconds:number;separate:boolean;backingGain:number;vocalGain?:number;reference:string;extractor?:'mega-lead'|'demucs'};
}
export interface StudioState{projects:StudioProject[];selectedId:string|null}
export const generatedAudioPath=(value:unknown):string=>{
 if(typeof value!=='string')return '';const path=value.replace(/\\/g,'/');
 return path.toLowerCase().startsWith('c:/ai/manaai-cv-2/exports/singing/')&&path.toLowerCase().endsWith('.wav')&&!path.split('/').some(s=>s==='.'||s==='..')?path:'';
};
export function validateStudio(value:unknown):StudioState{
 const raw=value&&typeof value==='object'?value as Record<string,unknown>:{};const projects:StudioProject[]=[];
 for(const item of (Array.isArray(raw.projects)?raw.projects:[]).slice(0,STUDIO_PROJECT_LIMIT)){
  if(!item||typeof item!=='object')continue;const p=item as Record<string,unknown>;
  if(typeof p.id!=='string'||!/^studio-[a-z0-9-]{1,80}$/.test(p.id)||projects.some(q=>q.id===p.id)||typeof p.title!=='string'||!p.title.trim()||typeof p.createdAt!=='string'||!Number.isFinite(Date.parse(p.createdAt)))continue;
  const settings=p.settings&&typeof p.settings==='object'?p.settings as Record<string,unknown>:{};
  const number=(v:unknown,fallback:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:fallback;
  projects.push({lyrics:p.lyrics===undefined?undefined:validateLyrics(p.lyrics),kind:p.kind==='original'?'original':p.kind==='builder'?'builder':'cover',builderTracks:validateBuilderTracks(p.builderTracks),original:validateOriginalBrief(p.original),generatedLyrics:typeof p.generatedLyrics==='string'?p.generatedLyrics.slice(0,6000):'',id:p.id,title:p.title.trim().slice(0,120),createdAt:p.createdAt,status:['rendering','ready','error','stopped','interrupted'].includes(String(p.status))?p.status as StudioProject['status']:'error',stems:Array.isArray(p.stems)?p.stems.slice(0,8).flatMap((item:unknown)=>{if(!item||typeof item!=='object')return [];const stem=item as Record<string,unknown>;const path=generatedAudioPath(stem.path);return path&&typeof stem.name==='string'&&['guitar','piano','bass','drums','other','sax','electric-guitar','replacement-piano','electric-guitar-distorted','sax-tenor','sax-weresax','finger-bass','picked-bass','guitar-bright-room','guitar-nam-warm','guitar-nam-rhythm','guitar-nam-lead','strings-estimate','winds-estimate','sax-extracted','piano-banquet','keyboard-extracted','electric-piano-extracted','trumpet-extracted','trumpet'].includes(stem.name)?[{name:stem.name,path,gain:number(stem.gain,1,0,1),muted:stem.muted===true}]:[];}):[],source:typeof p.source==='string'?p.source.slice(0,2000):'',vocal:generatedAudioPath(p.vocal),mix:generatedAudioPath(p.mix),instrumental:generatedAudioPath(p.instrumental),seconds:number(p.seconds,0,0,86400),artwork:typeof p.artwork==='string'&&p.artwork.length<=150000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.artwork)?p.artwork:'',error:typeof p.error==='string'?p.error.slice(0,1000):'',settings:{percussion:settings.percussion===true,genre:['rock','jazz','pop','country','piano-trio','guitar-electric'].includes(String(settings.genre))?settings.genre as 'rock'|'jazz'|'pop'|'country'|'piano-trio'|'guitar-electric':'original',genreLead:checkedGenreLead(String(settings.genre),settings.genreLead),bandSource:isBandStyle(String(settings.genre))?checkedBandSource(settings.bandSource):undefined,followBass:isBandStyle(String(settings.genre))&&settings.followBass===true,extractor:settings.extractor==='mega-lead'?'mega-lead':'demucs',wholeSong:settings.wholeSong===true,start:number(settings.start,0,0,3600),seconds:number(settings.seconds,10,1,isBandStyle(String(settings.genre))?360:60),separate:settings.separate!==false,backingGain:number(settings.backingGain,.3,0,1),vocalGain:number(settings.vocalGain,1,0,1),reference:typeof settings.reference==='string'?settings.reference.slice(0,2000):''}});
 }
 return {projects,selectedId:projects.some(p=>p.id===raw.selectedId)?raw.selectedId as string:projects[0]?.id??null};
}
export const durationLabel=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export function mergeDiscovered(state:StudioState,found:StudioProject[]):StudioState{
 const paths=new Set(state.projects.flatMap(p=>[p.vocal,p.mix]).filter(Boolean));
 const additions=found.filter(p=>!state.projects.some(q=>q.id===p.id)&&![p.vocal,p.mix].filter(Boolean).some(path=>paths.has(path)));
 return validateStudio({...state,projects:[...state.projects,...additions]});
}

export function singingVoiceLabel(reference:string):string{const file=reference.replace(/\\/g,'/').split('/').pop()?.toLowerCase();return file==='mousey-v2-trial-v1_50e_8300s.pth'?'Mousey v2 · 50 passes':file==='mana-current-trial-v1_50e_2800s.pth'?'Trained Mana voice v1 · 50 passes':file==='singing-stable-v1.wav'?'Stable Mana voice v1':file==='singing.wav'?'Earlier singing reference':file==='default-r2.wav'?'Mana chat reference':reference?'Custom voice reference':'Not recorded';}
