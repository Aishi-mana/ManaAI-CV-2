import {createContext,useContext,useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {useSceneLine} from './SceneVoice';

import {residentProfiles,type ResidentId} from '../core/residentProfiles';

type Character='mana'|ResidentId;
export const CharacterNightLighting=createContext(false);

export default function CharacterGesture({character,className,style,children,onDrop,asleep=false}:{
 character:Character;className:string;style?:CSSProperties;children:ReactNode;onDrop?:(point:{x:number;y:number})=>void;asleep?:boolean;
}){
 const start=useRef<{id:number;x:number;y:number;bounds:DOMRect;scene:Element|null;feet?:{x:number;y:number};dropAllowed:boolean}|undefined>(undefined);
 const dragged=useRef(false);
 const reactionTimer=useRef<number|undefined>(undefined);
 const [reaction,setReaction]=useState(false);
 const [spokenTap,setSpokenTap]=useState<number>();
 const lastSpokenTap=useRef(0);
 const [held,setHeld]=useState<{left:number;top:number;width:number;height:number}>();
 const reply=useSceneLine(spokenTap&&!held&&!asleep?`Quick greeting: Aishi just gave you a little wave. Respond naturally in your own voice. Interaction timestamp: ${spokenTap}`:undefined,character);
 const [frame,setFrame]=useState(1);
 const night=useContext(CharacterNightLighting);
 const name=character==='mana'?'Mana':residentProfiles[character].name;
 const manaHeld=!!held&&character==='mana';
 useEffect(()=>{
  if(!onDrop&&start.current)start.current.dropAllowed=false;
 },[onDrop]);
 useEffect(()=>()=>clearTimeout(reactionTimer.current),[]);
 useEffect(()=>{
  if(!spokenTap)return;
  const timer=window.setTimeout(()=>setSpokenTap(undefined),10_000);
  return ()=>clearTimeout(timer);
 },[spokenTap]);
 useEffect(()=>{
  if(!manaHeld||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  setFrame(1);
  const timer=window.setInterval(()=>setFrame(value=>value%6+1),150);
  return ()=>clearInterval(timer);
 },[manaHeld]);
 const pose=character==='mana'?`./companion-room/mana_drag_${frame}.png`:residentProfiles[character].drag;
 return <div className={`${className} character-gesture`} style={style} data-asleep={asleep||undefined}>
  <button type="button" className="character-gesture-hit" aria-label={`Interact with ${name}`} data-held={!!held}
   onPointerDown={event=>{
    if(event.button!==0||start.current)return;
    dragged.current=false;
    const scene=event.currentTarget.closest('.companion-room-scene,.manaverse-street,.manaverse-park-map,.district-interior');
    const bounds=scene?.getBoundingClientRect();
    const left=parseFloat(String(style?.left)),top=parseFloat(String(style?.top));
    const feet=bounds&&Number.isFinite(left)&&Number.isFinite(top)?{x:bounds.left+left*bounds.width/100,y:bounds.top+top*bounds.height/100}:undefined;
    start.current={id:event.pointerId,x:event.clientX,y:event.clientY,bounds:event.currentTarget.getBoundingClientRect(),scene,feet,dropAllowed:!!onDrop};
    event.currentTarget.setPointerCapture(event.pointerId);
   }}
   onPointerUp={event=>{
    const from=start.current;
    if(!from||from.id!==event.pointerId||!dragged.current||!from.dropAllowed||!from.feet)return;
    const bounds=from.scene?.getBoundingClientRect();
    if(!bounds?.width||!bounds.height)return;
    onDrop?.({x:(from.feet.x+event.clientX-from.x-bounds.left)/bounds.width*100,
     y:(from.feet.y+event.clientY-from.y-bounds.top)/bounds.height*100});
   }}
   onPointerMove={event=>{
    const from=start.current;
    if(!from||from.id!==event.pointerId)return;
    const dx=event.clientX-from.x,dy=event.clientY-from.y;
    if(!dragged.current&&Math.hypot(dx,dy)<6)return;
    dragged.current=true;
    setHeld({left:from.bounds.left+dx,top:from.bounds.top+dy,width:from.bounds.width,height:from.bounds.height});
   }}
   onLostPointerCapture={event=>{
    if(start.current?.id!==event.pointerId)return;
    start.current=undefined;
    setHeld(undefined);
   }}
   onClick={event=>{
    event.stopPropagation();
    if(event.detail&&dragged.current)return;
    setReaction(true);
    if(!asleep&&Date.now()-lastSpokenTap.current>=25_000){
     lastSpokenTap.current=Date.now();
     setSpokenTap(lastSpokenTap.current);
    }
    clearTimeout(reactionTimer.current);
    reactionTimer.current=window.setTimeout(()=>setReaction(false),1300);
   }}>{children}</button>
  {reaction&&!held&&<span className="companion-room-greeting" role="status" aria-label={`${name} sends a heart`}>♥</span>}
  {reply&&<p className="manaverse-player-greeting scene-heart-line" role="status">{reply}</p>}
  {held&&createPortal(<img className="character-drag-preview" data-night={night} src={pose} alt=""
   style={{left:held.left,top:held.top,width:held.width,height:held.height}}/>,document.body)}
 </div>;
}
