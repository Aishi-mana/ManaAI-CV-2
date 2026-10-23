import type {BuilderTrack} from './coverBuilder';
import {trackClips,timelineGain,clipFadeLevel,type BuilderClip} from './builderTimeline';
import {checkedSections} from './backingSections';
import {loadBuilderAudio} from './builderAudio';

export interface PlaybackSpan {id:string;path:string;start:number;end:number;songStart:number;section?:{start:number;end:number};fade:number;clip?:BuilderClip}
export function builderPlaybackPlan(tracks:BuilderTrack[],position:number):{end:number;spans:PlaybackSpan[]}{
 const end=Math.max(0,...tracks.flatMap(t=>trackClips(t).map(c=>t.offset+c.offset+c.end)));
 if(!Number.isFinite(position)||position<0||end>3600)throw Error('Choose a cursor position within a timeline up to one hour.');
 const spans:PlaybackSpan[]=[];
 for(const t of tracks){
  const sections=t.sections===undefined?undefined:checkedSections(t.sections,t.seconds);
  for(const c of trackClips(t)){
   const offset=t.offset+c.offset;
   for(const section of sections??[{start:c.start,end:c.end}]){
    const start=Math.max(c.start,section.start,position-offset,-offset),stop=Math.min(c.end,section.end);
    if(stop>start)spans.push({id:t.id,path:t.path,start,end:stop,songStart:start+offset,section:sections?section:undefined,fade:t.sectionFade??.15,...((c.fadeIn||c.fadeOut)?{clip:c}:{})});
   }
  }
 }return {end,spans};
}
function spanLevel(span:PlaybackSpan,sourceTime:number):number{
 const clip=span.clip?clipFadeLevel(span.clip,sourceTime):1;if(!span.section||!span.fade)return clip;
 const edge=Math.min(span.fade,(span.section.end-span.section.start)/2);
 const fraction=Math.max(0,Math.min(1,(sourceTime-span.section.start)/edge,(span.section.end-sourceTime)/edge));return clip*Math.sin(fraction*Math.PI/2)**2;
}

export class BuilderPlayback {
 private context=new AudioContext();
 private master=this.context.createGain();
 private nodes:AudioScheduledSourceNode[]=[];
 private gains=new Map<string,GainNode>();
 private clips:GainNode[]=[];
 private buffers=new Map<string,AudioBuffer>();
 private tracks:BuilderTrack[]=[];
 private epoch=0;private base=0;private started=0;private end=0;
 private finished:()=>void=()=>{};
 active=false;
 constructor(){this.master.connect(this.context.destination);}
 get position(){return this.active?Math.min(this.end,this.base+Math.max(0,this.context.currentTime-this.started)):this.base;}
 pause(){const position=this.position;this.epoch++;this.active=false;this.base=position;for(const node of this.nodes){node.onended=null;try{node.stop();}catch{}node.disconnect();}this.nodes=[];for(const node of this.clips)node.disconnect();this.clips=[];for(const node of this.gains.values())node.disconnect();this.gains.clear();return position;}
 async play(tracks:BuilderTrack[],position:number,volume:number,finished:()=>void){
  this.pause();this.base=position;const epoch=this.epoch;
  // Resume within the user's Play gesture, before awaiting disk reads.
  const resumed=this.context.resume();
  const paths=[...new Set(tracks.map(t=>t.path))];
  const audio=await Promise.all(paths.map(loadBuilderAudio));await resumed;
  if(epoch!==this.epoch)return false;
  this.buffers=new Map(paths.map((p,i)=>[p,audio[i]]));this.tracks=tracks;this.finished=finished;this.setVolume(volume);this.schedule(position);return true;
 }
 private schedule(position:number){
  this.pause();const plan=builderPlaybackPlan(this.tracks,position);
  if(position>=plan.end)throw Error('Move the cursor before the end of the arrangement.');
  this.base=position;this.end=plan.end;this.started=this.context.currentTime+.03;
  for(const t of this.tracks){const gain=this.context.createGain();gain.gain.value=timelineGain(t,this.tracks);gain.connect(this.master);this.gains.set(t.id,gain);}
  for(const span of plan.spans){
   const buffer=this.buffers.get(span.path)!;
   const end=Math.min(span.end,buffer.duration);if(end<=span.start)continue;
   const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.connect(gain);gain.connect(this.gains.get(span.id)!);
   const when=this.started+span.songStart-position,duration=end-span.start;
   if((span.section&&span.fade)||span.clip){
    // Small automation curves cover only the fades, rather than scanning entire songs.
    const boundaries=[...(span.clip?[span.clip.start+Math.min(span.clip.fadeIn??0,(span.clip.end-span.clip.start)/2),span.clip.end-Math.min(span.clip.fadeOut??0,(span.clip.end-span.clip.start)/2)]:[]),span.start,Math.min(end,(span.section?.start??span.start)+span.fade),Math.max(span.start,(span.section?.end??end)-span.fade),end].filter(v=>v>=span.start&&v<=end).sort((a,b)=>a-b);
    gain.gain.setValueAtTime(spanLevel(span,span.start),when);
    for(let i=1;i<boundaries.length;i++){const a=boundaries[i-1],b=boundaries[i];if(b<=a)continue;const count=spanLevel(span,a)===1&&spanLevel(span,b)===1?1:16;for(let j=1;j<=count;j++){const t=a+(b-a)*j/count;gain.gain.linearRampToValueAtTime(spanLevel(span,t),when+t-span.start);}}
   }
   source.start(when,span.start,duration);this.nodes.push(source);this.clips.push(gain);
  }
  const clock=this.context.createConstantSource(),silent=this.context.createGain();silent.gain.value=0;clock.connect(silent);silent.connect(this.master);this.clips.push(silent);this.nodes.push(clock);
  const epoch=this.epoch;clock.onended=()=>{if(this.epoch!==epoch)return;this.pause();this.base=this.end;this.finished();};
  clock.start(this.started);clock.stop(this.started+plan.end-position);this.active=true;
 }
 seek(position:number){if(this.active)this.schedule(position);else this.base=position;}
 updateLevels(tracks:BuilderTrack[]){this.tracks=tracks;const paths=new Set(tracks.map(t=>t.path));for(const path of this.buffers.keys())if(!paths.has(path))this.buffers.delete(path);for(const t of tracks)this.gains.get(t.id)?.gain.setTargetAtTime(timelineGain(t,tracks),this.context.currentTime,.01);}
 setVolume(volume:number){this.master.gain.setTargetAtTime(volume,this.context.currentTime,.01);}
 dispose(){this.pause();void this.context.close();}
}
