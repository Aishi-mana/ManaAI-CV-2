import {trackClips} from './builderTimeline';
import type {BuilderDraft,InstrumentCustom} from './coverBuilder';

export interface BuilderSnapshot {
 draft:BuilderDraft;
 choices:Record<string,string>;
 customs:Record<string,InstrumentCustom>;
}
interface Entry {before:BuilderSnapshot;after:BuilderSnapshot;label:string}
export interface BuilderHistory {present:BuilderSnapshot;past:Entry[];future:Entry[];group?:string}
const LIMIT=50;
export function createBuilderHistory(present:BuilderSnapshot):BuilderHistory{return {present,past:[],future:[]};}
// React draft/setting updates are immutable. History retains metadata and saved paths, never audio buffers.
export function recordBuilderEdit(history:BuilderHistory,next:BuilderSnapshot,label:string,group?:string):BuilderHistory {
 if(JSON.stringify(history.present)===JSON.stringify(next))return history;
 const past=[...history.past];
 if(group&&group===history.group&&past.length)past[past.length-1]={...past[past.length-1],after:next};
 else past.push({before:history.present,after:next,label});
 return {present:next,past:past.slice(-LIMIT),future:[],group};
}
export function undoBuilderEdit(history:BuilderHistory):BuilderHistory {
 const entry=history.past[history.past.length-1];
 return entry?{present:entry.before,past:history.past.slice(0,-1),future:[entry,...history.future]}:history;
}
export function redoBuilderEdit(history:BuilderHistory):BuilderHistory {
 const entry=history.future[0];
 return entry?{present:entry.after,past:[...history.past,entry].slice(-LIMIT),future:history.future.slice(1)}:history;
}
export function describeBuilderEdit(before:BuilderDraft,after:BuilderDraft):{label:string;group?:string} {
 if(before.title!==after.title)return {label:'Rename cover',group:'title'};
 if(after.tracks.length!==before.tracks.length)return {label:!after.tracks.length?'New draft':after.tracks.length>before.tracks.length?'Add track':'Remove track'};
 if(before.tracks.some((t,i)=>t.id!==after.tracks[i]?.id))return {label:'Reorder tracks'};
 for(let i=0;i<after.tracks.length;i++){
  const a=before.tracks[i],b=after.tracks[i];
  if(JSON.stringify(a.clips)!==JSON.stringify(b.clips)){const old=trackClips(a),clips=trackClips(b);if(old.length===clips.length&&old.every((c,i)=>c.id===clips[i].id&&c.start===clips[i].start&&c.end===clips[i].end&&c.offset===clips[i].offset))return {label:'Clip fades',group:b.id+':fades'};return {label:clips.length>old.length?'Add / split clip':clips.length<old.length?'Delete clip':'Move / trim clip',group:clips.length===old.length?b.id+':clips':undefined};}
  if(JSON.stringify(a.noteEdit)!==JSON.stringify(b.noteEdit))return {label:'Edit instrument notes',group:b.id+':notes'};
  if(a.name!==b.name)return {label:'Rename track',group:b.id+':name'};
  if(a.gain!==b.gain)return {label:'Track volume',group:b.id+':gain'};
  if(a.offset!==b.offset)return {label:'Move track',group:b.id+':offset'};
  if(JSON.stringify(a.trim)!==JSON.stringify(b.trim))return {label:'Trim track',group:b.id+':trim'};
  if(a.muted!==b.muted)return {label:'Mute track'};
  if(a.solo!==b.solo)return {label:'Solo track'};
  if(a.path!==b.path)return {label:'Change track audio'};
 }
 return {label:'Edit track'};
}
