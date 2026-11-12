import {useEffect,useRef,useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import type {DraftMix} from '../core/musicDrafts';
import {BAND_MIX_NAMES,type StudioProject} from '../core/musicStudio';

type MixFiles=Pick<StudioProject,'mix'|'vocal'|'instrumental'>;
const labels=['Vocal','Lead','Accompaniment','Bass','Drums'];

export default function BandPreviewMix({project,disabled,saved,playing,onPlay,onStop,onSave,initialMix,onMixChange}:{
 project:StudioProject;disabled:boolean;saved?:boolean;playing:boolean;
 onPlay:(path:string)=>void;onStop:()=>void;onSave:(project:StudioProject)=>boolean;initialMix?:DraftMix;onMixChange?:(mix:DraftMix)=>void;
}){
 const parts=BAND_MIX_NAMES.map(name=>project.bandMixParts!.find(part=>part.name===name)!);
 const defaults=parts.map(part=>part.gain);
 const [levels,setLevels]=useState(initialMix?.levels??defaults),[muted,setMuted]=useState<boolean[]>(initialMix?.muted??[]),[solo,setSolo]=useState<number|null>(initialMix?.solo??null);
 const [working,setWorking]=useState(false),[error,setError]=useState('');
 const latest=useRef<{key:string;files:MixFiles}|undefined>(undefined);
 const mounted=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{onMixChange?.({levels,muted:parts.map((_,i)=>!!muted[i]),solo});},[levels,muted,solo]);
 const gains=levels.map((level,i)=>muted[i]||(solo!==null&&solo!==i)?0:level);
 const blocked=disabled||working;
 function reset(){onStop();setLevels(defaults);setMuted([]);setSolo(null);setError('');}
 async function useMix(save:boolean){
  if(blocked||(save&&saved))return;
  setError('');setWorking(true);
  try{
   const key=JSON.stringify(gains);
   let files:MixFiles=project;
   if(gains.some((gain,i)=>gain!==defaults[i])){
    if(latest.current?.key===key)files=latest.current.files;
    else{
     files=await invoke<MixFiles>('singing_band_mix',{paths:parts.map(part=>part.path),gains});
     latest.current={key,files};
    }
   }
   if(!mounted.current)return;
   if(save)onSave({...project,mix:files.mix,vocal:files.vocal,instrumental:files.instrumental});
   else onPlay(files.mix);
  }catch(error){if(mounted.current)setError(String(error));}
  finally{if(mounted.current)setWorking(false);}
 }
 return <div className="band-preview-mix">
  <details>
   <summary>Adjust band mix</summary>
   <p className="hint-soft">Play preview to hear your current settings.</p>
   {parts.map((part,i)=>part.available!==false&&<div className="builder-actions" key={part.name}>
    <label className="field">{labels[i]} · {Math.round(levels[i]*100)}%<input type="range" min={0} max={1.5} step={.05} value={levels[i]} disabled={blocked||saved} onChange={event=>{const gain=Number(event.target.value);onStop();setLevels(values=>values.map((v,index)=>index===i?gain:v));}}/></label>
    <button type="button" className="btn" disabled={blocked||saved} aria-label={'Solo '+labels[i]} aria-pressed={solo===i} onClick={()=>{onStop();setSolo(solo===i?null:i);}}>Solo</button>
    <button type="button" className="btn" disabled={blocked||saved} aria-label={'Mute '+labels[i]} aria-pressed={!!muted[i]} onClick={()=>{onStop();setMuted(parts.map((_,index)=>index===i?!muted[i]:!!muted[index]));}}>Mute</button>
   </div>)}
   <button type="button" className="btn" disabled={blocked||saved} onClick={reset}>Reset mix</button>
  </details>
  <div className="builder-actions">
   <button type="button" className="btn" disabled={blocked} onClick={()=>void useMix(false)}>{working?'Preparing mix…':playing?'Pause preview':'Play preview'}</button>
   <button type="button" className="btn" disabled={working} onClick={onStop}>Stop preview</button>
   <button type="button" className="btn primary" disabled={blocked||saved} onClick={()=>void useMix(true)}>{saved?'Saved to library':'Save this preview'}</button>
  </div>
  {error&&<p role="alert" className="msg-error">{error}</p>}
 </div>;
}
