import {useEffect,useRef,useState,type ReactNode} from 'react';

/** Pan changes only viewport scrolling; canvas coordinates and saved pixels stay intact. */
export default function CanvasViewport({children,handActive,hideHandButton=false,zoom=1,onZoom}:{children:ReactNode;handActive?:boolean;hideHandButton?:boolean;zoom?:number;onZoom?:(zoom:number)=>void}){
 const [hand,setHand]=useState(false),[space,setSpace]=useState(false);
 const useHand=handActive??hand;
 const viewport=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=viewport.current;if(!el||!onZoom)return;let frame=0;const wheel=(e:WheelEvent)=>{if(!e.deltaY)return;e.preventDefault();const next=Math.max(.5,Math.min(12,zoom*Math.exp(-e.deltaY*.0015))),r=next/zoom,rect=el.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,left=(el.scrollLeft+x)*r-x,top=(el.scrollTop+y)*r-y;onZoom(next);cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{el.scrollLeft=left;el.scrollTop=top;});};el.addEventListener('wheel',wheel,{passive:false});return()=>{el.removeEventListener('wheel',wheel);};},[zoom,onZoom]);
 const drag=useRef<{id:number;x:number;y:number;left:number;top:number}|null>(null);
 return <div className="outfit-pan-shell">
  {!hideHandButton&&<button className={'btn outfit-hand'+(hand?' primary':'')} aria-pressed={hand} onClick={()=>setHand(v=>!v)}>Hand / pan</button>}
  <div ref={viewport} className={'outfit-canvas-viewport'+(useHand||space?' is-hand':'')} tabIndex={0} aria-label="Canvas view; hold Space or middle mouse to pan"
   onKeyDownCapture={e=>{if(e.code==='Space'){e.preventDefault();setSpace(true);}}}
   onKeyUpCapture={e=>{if(e.code==='Space'){e.preventDefault();setSpace(false);}}}
   onBlur={()=>setSpace(false)}
   onPointerDownCapture={e=>{if(!(e.button===1||(e.button===0&&(useHand||space))))return;e.preventDefault();e.stopPropagation();const el=e.currentTarget;el.focus();el.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,left:el.scrollLeft,top:el.scrollTop};}}
   onPointerMoveCapture={e=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();e.currentTarget.scrollLeft=d.left-(e.clientX-d.x);e.currentTarget.scrollTop=d.top-(e.clientY-d.y);}}
   onPointerUpCapture={e=>{if(drag.current?.id!==e.pointerId)return;e.stopPropagation();drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
   onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>{children}</div>
 </div>;
}
