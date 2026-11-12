import {validateBuilderTracks,type BuilderDraft} from './coverBuilder';
import {BAND_MIX_NAMES,generatedAudioPath,validateStudio,type BandMixPart,type StudioProject} from './musicStudio';
import {validateOriginalBrief,type OriginalBrief} from './originalSong';
import {readStored,writeStored} from './persistence';
import {isRecord} from './validation';

export const MUSIC_DRAFTS_KEY='mana.music_drafts.v1';
export interface DraftMix {levels:number[];muted:boolean[];solo:number|null}
export interface CoverPreviewDraft {project:StudioProject;saved:boolean;mix?:DraftMix}
function validateDraftMix(value:unknown):DraftMix|undefined{
 if(!isRecord(value)||!Array.isArray(value.levels)||value.levels.length!==5||!value.levels.every(g=>typeof g==='number'&&Number.isFinite(g)&&g>=0&&g<=1.5)||!Array.isArray(value.muted)||value.muted.length!==5||!value.muted.every(m=>typeof m==='boolean'))return;
 const solo=typeof value.solo==='number'&&Number.isInteger(value.solo)&&value.solo>=0&&value.solo<5?value.solo:null;
 return {levels:value.levels,muted:value.muted,solo};
}
export interface OriginalPreviewDraft extends CoverPreviewDraft {
 brief:OriginalBrief;lyrics:string;fullLength:boolean;requestedSeconds:number;lyricsAdjusted:boolean;durationLimited:boolean;
}
export interface MusicDrafts {builder:BuilderDraft;cover:CoverPreviewDraft|null;original:OriginalPreviewDraft|null}

function validateBandParts(value:unknown):BandMixPart[]|undefined{
 if(!Array.isArray(value)||value.length!==BAND_MIX_NAMES.length)return;
 const parts:BandMixPart[]=[];
 for(const name of BAND_MIX_NAMES){
  const part=value.find(part=>isRecord(part)&&part.name===name);
  const path=generatedAudioPath(part?.path);
  if(!path||typeof part?.gain!=='number'||!Number.isFinite(part.gain)||part.gain<0||part.gain>1)return;
  parts.push({name,path,gain:part.gain,available:part.available!==false});
 }
 return parts;
}

function previewProject(value:unknown):StudioProject|undefined{
 if(!isRecord(value))return;
 const project=validateStudio({projects:[value]}).projects[0];
 if(!project||project.status!=='ready'||(!project.mix&&!project.vocal))return;
 return {...project,bandMixParts:validateBandParts(value.bandMixParts)};
}

export function validateMusicDrafts(value:unknown):MusicDrafts{
 const data=isRecord(value)?value:{};
 const builder=isRecord(data.builder)?data.builder:{};
 const cover=isRecord(data.cover)?data.cover:{};
 const original=isRecord(data.original)?data.original:{};
 const coverProject=previewProject(cover.project);
 const originalProject=previewProject(original.project);
 const brief=validateOriginalBrief(original.brief);
 return {
  builder:{title:typeof builder.title==='string'?builder.title.slice(0,120):'',tracks:validateBuilderTracks(builder.tracks)},
  cover:coverProject?.kind==='cover'&&coverProject.vocal&&cover.saved!==true?{project:coverProject,saved:false,mix:coverProject.bandMixParts?validateDraftMix(cover.mix):undefined}:null,
  original:originalProject?.kind==='original'&&originalProject.mix&&brief&&original.saved!==true?{
   project:originalProject,saved:false,brief,lyrics:typeof original.lyrics==='string'?original.lyrics.slice(0,6000):'',
   fullLength:original.fullLength===true,
   requestedSeconds:typeof original.requestedSeconds==='number'&&Number.isFinite(original.requestedSeconds)&&original.requestedSeconds>0&&original.requestedSeconds<=180?original.requestedSeconds:brief.duration,
   lyricsAdjusted:original.lyricsAdjusted===true,durationLimited:original.durationLimited===true,
  }:null,
 };
}
export function loadMusicDrafts():MusicDrafts{
 try{return validateMusicDrafts(JSON.parse(readStored(MUSIC_DRAFTS_KEY)??'null'));}catch{return validateMusicDrafts(null);}
}
export function saveMusicDrafts(drafts:MusicDrafts){
 const value=JSON.stringify(validateMusicDrafts(drafts));
 if(readStored(MUSIC_DRAFTS_KEY)!==value)writeStored(MUSIC_DRAFTS_KEY,value);
}
