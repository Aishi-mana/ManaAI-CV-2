import {useEffect,useState} from 'react';

const idleFrames=[1,2,3,4,5,6,7,8,7,6,5,4,3,2];
const actionFrames=[1,2,3];

export default function ManaSprite({walking=false,facing=1,pose='idle',visible=true}:{
 walking?:boolean;facing?:number;pose?:'idle'|'think'|'read'|'window'|'water';visible?:boolean;
}){
 const [frame,setFrame]=useState(0);
 const motion=walking?'walk':pose;
 const frames=motion==='idle'?idleFrames:actionFrames;
 useEffect(()=>{
  setFrame(0);
  if(!visible)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer:number|undefined;
  const schedule=()=>{
   window.clearInterval(timer);
   setFrame(0);
   if(!reduced.matches)timer=window.setInterval(()=>setFrame(index=>(index+1)%frames.length),motion==='idle'?150:170);
  };
  schedule();
  reduced.addEventListener('change',schedule);
  return ()=>{window.clearInterval(timer);reduced.removeEventListener('change',schedule);};
 },[frames,motion,visible]);
 return <img src={`./companion-room/mana_${motion}_${frames[frame%frames.length]}.webp`} style={{scale:`${facing} 1`}} alt="Mini Mana" draggable={false}/>;
}
