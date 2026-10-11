import {useEffect,useRef,useState} from 'react';
import {chooseMusic,musicDue,musicPath,MUSIC_CLIPS,ACTIVE_MUSIC_CLIPS,planMusicAttempt,validateMusicalState,type MusicId,type MusicContext} from '../core/musicalMoments';
import type {InitiativeState} from '../core/initiative';
import {findSong} from '../core/songPool';

interface Props{initiative:InitiativeState;onInitiative:(next:InitiativeState)=>void;context:MusicContext;mood:string;playing:boolean;onPlay:(path:string)=>Promise<boolean>;onStop:()=>void;onPlayed:(title:string,kind:'hum'|'song',request?:string)=>void;onUnavailable:(request:string,titles:string[])=>void;onRequestFailed:(text:string)=>void;request:{id:number;kind:'hum'|'song';text:string;title?:string}|null}
export default function MusicalMomentsControls(p:Props){
 const current=useRef(p);current.current=p;
 const launching=useRef(false),handled=useRef(0),alive=useRef(true);
 const [status,setStatus]=useState('');
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function play(id:MusicId,request?:string){
  const props=current.current;if(!id)return false;if(launching.current||props.playing||!props.context.idle||!props.context.ready||props.context.muted||document.visibilityState!=='visible'){if(request)props.onRequestFailed(request);return false;}
  launching.current=true;const state=planMusicAttempt(validateMusicalState(props.initiative.music),id);
  props.onInitiative({...props.initiative,music:state});setStatus('Loading a little musical moment…');
  try{const started=await props.onPlay(musicPath(id,state.songs));if(!alive.current)return false;
   if(started){const clip=state.songs.find(c=>c.id===id)??MUSIC_CLIPS.find(c=>c.id===id)!;props.onPlayed(clip.title,'kind' in clip?clip.kind:'song',request);setStatus(clip.title);return true;}
   props.onInitiative({...current.current.initiative,music:{...validateMusicalState(current.current.initiative.music),enabled:false}});if(request)props.onRequestFailed(request);setStatus('Playback did not start. Musical initiative is off; review the clip and try again.');return false;
  }finally{launching.current=false;}
 }
 useEffect(()=>{const timer=setInterval(()=>{const props=current.current;const state=validateMusicalState(props.initiative.music);if(!launching.current&&!props.playing&&musicDue(state,new Date(),{...props.context,visible:document.visibilityState==='visible'}))void play(chooseMusic(state,props.mood));},1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(!p.request||p.request.id===handled.current)return;handled.current=p.request.id;const state=validateMusicalState(p.initiative.music);const id=p.request.title?findSong(state.songs,p.request.title)?.id:chooseMusic(state,p.mood,p.request.kind);if(!id){p.onUnavailable(p.request.text,state.songs.filter(s=>s.enabled).map(s=>s.title));return;}void play(id,p.request.text);},[p.request]);
 const state=validateMusicalState(p.initiative.music);
 return <details><summary>Humming and little songs</summary><p className="hint-soft">Unaccompanied humming and an approved 10-second cover excerpt in Mana’s voice, with quieter backing. Prepared locally for immediate playback. Other requested songs are not generated here yet.</p>
 <label><input type="checkbox" checked={state.enabled} onChange={e=>{if(!e.target.checked&&p.playing)p.onStop();p.onInitiative({...p.initiative,music:{...state,enabled:e.target.checked,nextAttemptAt:e.target.checked?new Date(Date.now()+state.cooldownMinutes*(1+Math.random())*60000).toISOString():state.nextAttemptAt}});}}/> Occasional musical moments</label>
 <label> Cooldown (minutes)<input type="number" min={15} max={240} value={state.cooldownMinutes} onChange={e=>{const value=Number(e.target.value);if(Number.isInteger(value)&&value>=15&&value<=240)p.onInitiative({...p.initiative,music:{...state,cooldownMinutes:value,nextAttemptAt:new Date(Date.now()+value*60000).toISOString()}});}}/></label>
 <p className="hint-soft">Only while idle, visible and unmuted, between 08:00 and 22:00 in your journal timezone. Pauses, drafts, microphone use and hands-free block spontaneous playback. Stop and voice volume are shared.</p>
 {[...ACTIVE_MUSIC_CLIPS.filter(c=>c.kind==='hum'),...state.songs.filter(s=>s.enabled)].map(clip=><button className="btn" key={clip.id} disabled={p.playing||!p.context.idle||!p.context.ready||p.context.muted} onClick={()=>void play(clip.id)}>{clip.title}</button>)}
 {p.playing&&<button className="btn" onClick={p.onStop}>Stop music</button>}<p role="status">{status}</p></details>;
}
