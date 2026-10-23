import type {BuilderTrack} from './coverBuilder';

export interface TrackTrim {start:number;end:number}
export interface BuilderClip extends TrackTrim {id:string;offset:number;fadeIn?:number;fadeOut?:number}
export const MAX_CLIPS=32;
export function trackClips(track:{seconds:number;trim?:TrackTrim;clips?:BuilderClip[]}):BuilderClip[]{
 return track.clips??[{id:'source',...trackTrim(track),offset:0}];
}
export function validateClips(value:unknown,seconds:number):BuilderClip[]{
 if(!Array.isArray(value))return [];
 const result:BuilderClip[]=[];
 for(const item of value.slice(0,MAX_CLIPS)){
  if(!item||typeof item!=='object')continue;
  const c=item as BuilderClip;
  if(typeof c.id!=='string'||!/^[-a-z0-9]{1,80}$/.test(c.id)||result.some(r=>r.id===c.id)||!validTrackTrim(c,seconds)||!Number.isFinite(c.offset)||Math.abs(c.offset)>3600)continue;
  const fade=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?Math.min(v,(c.end-c.start)/2):undefined;
  result.push({id:c.id,start:c.start,end:c.end,offset:c.offset,...(c.fadeIn!==undefined?{fadeIn:fade(c.fadeIn)}:{}),...(c.fadeOut!==undefined?{fadeOut:fade(c.fadeOut)}:{})});
 }return result;
}
export function patchClip(track:BuilderTrack,id:string,patch:Partial<TrackTrim>):Partial<BuilderTrack>{
 if(track.clips===undefined)return {trim:{...trackTrim(track),...patch}};
 return {clips:track.clips.map(c=>c.id===id?{...c,...patch}:c)};
}
export function splitTrackClip(track:BuilderTrack,id:string,songTime:number,newId:string):Partial<BuilderTrack>{
 const clips=trackClips(track),clip=clips.find(c=>c.id===id);
 const sourceTime=songTime-track.offset-(clip?.offset??0);
 if(!clip||clips.length>=MAX_CLIPS||!Number.isFinite(sourceTime)||sourceTime-clip.start<.05||clip.end-sourceTime<.05)throw Error('Place the cursor inside the selected clip, at least 0.05 seconds from its edges.');
 if(clips.some(c=>c.id===newId))throw Error('Use a unique clip id.');
 return {trim:undefined,clips:clips.flatMap(c=>c.id===id?[{...c,end:sourceTime,...(c.fadeOut!==undefined?{fadeOut:0}:{})},{...c,id:newId,start:sourceTime,...(c.fadeIn!==undefined?{fadeIn:0}:{})}]:[c])};
}
export function duplicateTrackClip(track:BuilderTrack,id:string,newId:string):Partial<BuilderTrack>{
 const clips=trackClips(track),clip=clips.find(c=>c.id===id);
 if(!clip||clips.length>=MAX_CLIPS||clips.some(c=>c.id===newId))throw Error('Select a clip; use at most 32 clips per track.');
 const end=Math.max(0,...clips.map(c=>track.offset+c.offset+c.end));
 if(end+clip.end-clip.start>3600)throw Error('The duplicated clip would exceed one hour.');
 return {trim:undefined,clips:[...clips,{...clip,id:newId,offset:end-track.offset-clip.start}]};
}
// Source positions stay independent of song time: song time = source time + offset.
export function trackTrim(track:{seconds:number;trim?:TrackTrim}):TrackTrim {
 return track.trim??{start:0,end:track.seconds};
}
export function validTrackTrim(value:unknown,seconds:number):TrackTrim|undefined {
 if(!value||typeof value!=='object')return undefined;
 const {start,end}=value as TrackTrim;
 return Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start&&end<=seconds?{start,end}:undefined;
}
export function timelineGain(track:BuilderTrack,tracks:BuilderTrack[]):number {
 return track.muted||(tracks.some(t=>t.solo)&&!track.solo)?0:track.gain;
}
export function canMixBuilder(tracks:BuilderTrack[]):boolean {
 return tracks.some(t=>timelineGain(t,tracks)>0&&trackClips(t).some(c=>
  c.end+t.offset+c.offset>0&&(t.sections===undefined||t.sections.some(s=>Math.min(s.end,c.end)>Math.max(s.start,c.start)&&Math.min(s.end,c.end)+t.offset+c.offset>0))));
}
export function moveClip(track:BuilderTrack,delta:number,snap:number,clipId?:string):Partial<BuilderTrack> {
 if(clipId&&track.clips!==undefined){
  return {clips:track.clips.map(c=>c.id===clipId?{...c,offset:Math.round(Math.max(-track.offset-c.start,Math.min(3600-track.offset-c.end,Math.round((c.offset+delta)/snap)*snap))*1000)/1000}:c)};
 }
 const offset=Math.round((track.offset+delta)/snap)*snap;
 return {offset:Math.round(Math.max(-trackTrim(track).start,Math.min(3600-trackTrim(track).end,offset))*1000)/1000};
}
export function trimClip(track:BuilderTrack,edge:'start'|'end',delta:number,snap:number,clipId?:string):Partial<BuilderTrack> {
 if(clipId&&track.clips!==undefined){
  const clip=track.clips.find(c=>c.id===clipId);if(!clip)return {};
  const patch=trimClip({...track,clips:undefined,trim:clip,offset:track.offset+clip.offset},edge,delta,snap);
  return patchClip(track,clipId,patch.trim??clip);
 }
 const trim={...trackTrim(track)},minimum=Math.min(.05,track.seconds);
 const target=Math.round((trim[edge]+delta)/snap)*snap;
 if(edge==='start')trim.start=Math.max(0,-track.offset,Math.min(trim.end-minimum,target));
 else trim.end=Math.max(trim.start+minimum,Math.min(track.seconds,target));
 return {trim:{start:Math.round(trim.start*1000)/1000,end:Math.round(trim.end*1000)/1000}};
}
export function waveformPeaks(audio:Pick<AudioBuffer,'length'|'numberOfChannels'|'getChannelData'>,bins=1000):number[] {
 const peaks:number[]=[];
 for(let bin=0;bin<bins;bin++){
  let peak=0;const first=Math.floor(bin*audio.length/bins),last=Math.floor((bin+1)*audio.length/bins);
  for(let c=0;c<audio.numberOfChannels;c++){
   const data=audio.getChannelData(c);
   for(let i=first;i<last;i++)peak=Math.max(peak,Math.abs(data[i]));
  }
  peaks.push(peak);
 }
 return peaks;
}

export function clipFadeLevel(clip:Pick<BuilderClip,'start'|'end'|'fadeIn'|'fadeOut'>,sourceTime:number):number{const length=clip.end-clip.start;const a=Math.min(clip.fadeIn??0,length/2),b=Math.min(clip.fadeOut??0,length/2);const fraction=Math.max(0,Math.min(1,a?(sourceTime-clip.start)/a:1,b?(clip.end-sourceTime)/b:1));return Math.sin(fraction*Math.PI/2)**2;}
export function setClipFade(track:BuilderTrack,id:string,edge:'fadeIn'|'fadeOut',seconds:number):Partial<BuilderTrack>{if(!Number.isFinite(seconds)||seconds<0)throw Error('Use a non-negative fade length.');return {trim:undefined,clips:trackClips(track).map(c=>c.id===id?{...c,[edge]:Math.min(seconds,(c.end-c.start)/2)}:c)};}
