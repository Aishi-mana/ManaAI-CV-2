import {useEffect,useState} from 'react';
import {residentProfiles,type ResidentId} from '../core/residentProfiles';

export default function ResidentSprite({walking,facing,visible,resident='lyra'}:{walking:boolean;facing:number;visible:boolean;resident?:ResidentId}){
 const {avatar:idle,name,blink,step}=residentProfiles[resident];
 const [frame,setFrame]=useState<string>(idle);
 useEffect(()=>{
  if(visible)for(const src of [idle,step,blink])new Image().src=src;
 },[visible,idle,step,blink]);
 useEffect(()=>{
  setFrame(idle);
  if(!visible)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer=0,blinkEnd=0;
  let index=0;
  const walk=[idle,step];
  const schedule=()=>{
   clearInterval(timer);
   clearTimeout(blinkEnd);
   setFrame(idle);
   if(motion.matches)return;
   timer=walking?window.setInterval(()=>setFrame(walk[++index%walk.length]),180):
    window.setInterval(()=>{
     setFrame(blink);
     blinkEnd=window.setTimeout(()=>setFrame(idle),145);
    },3200);
  };
  schedule();
  motion.addEventListener('change',schedule);
  return ()=>{clearInterval(timer);clearTimeout(blinkEnd);motion.removeEventListener('change',schedule);};
 },[walking,visible,idle,step,blink]);
 return <img src={frame} style={{scale:`${facing} 1`}} alt={name}/>;
}
