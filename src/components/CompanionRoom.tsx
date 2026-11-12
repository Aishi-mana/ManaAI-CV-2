import {useEffect,useRef,useState} from 'react';
import {loadRoom,PLANT_POSITION,roomPoint,roomPosition,roomRoute,saveRoom,type RoomPosition} from '../core/companionRoom';

const art='./companion-room/';
const walkFrames=[1,2,3].map(frame=>art+`mana_walk_${frame}.png`);

export default function CompanionRoom({onClose}:{onClose:()=>void}){
 const [room]=useState(loadRoom);
 const current=useRef(room);
 const frame=useRef(0);
 const [position,setPosition]=useState(room.position);
 const [sprite,setSprite]=useState(art+'mana_idle_1.png');
 const [facing,setFacing]=useState(1);
 const [status,setStatus]=useState('');
 const [wateredAt,setWateredAt]=useState(room.wateredAt);
 const scene=useRef<HTMLDivElement>(null);
 const panel=useRef<HTMLDialogElement>(null);

 useEffect(()=>{
  if(panel.current&&!panel.current.open)panel.current.showModal();
  return ()=>cancelAnimationFrame(frame.current);
 },[]);

 function walkTo(target:RoomPosition,water=false){
  cancelAnimationFrame(frame.current);
  const origin=current.current.position;
  const route=roomRoute(origin,target);
  if(!route.length){setSprite(art+'mana_idle_1.png');setStatus('Mana could not find a path there.');return;}
  const finish=()=>{
   const timestamp=water?new Date().toISOString():current.current.wateredAt;
   current.current={layout:2,position:target,wateredAt:timestamp};
   setPosition(target);
   setSprite(art+'mana_idle_1.png');
   saveRoom(current.current);
   if(water){setWateredAt(timestamp);setStatus('Mana watered the plant.');}
  };
  setStatus(water?'Mana is walking to the plant.':'');
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  const legs=route.map((end,index)=>{
   const start=index===0?origin:route[index-1];
   const a=roomPoint(start),b=roomPoint(end);
   return {start,end,dx:b.x-a.x,duration:Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)*4)};
  });
  const started=performance.now();
  let index=0,elapsedBeforeLeg=0;
  const advance=(now:number)=>{
   const elapsed=now-started;
   while(index<legs.length&&elapsed-elapsedBeforeLeg>=legs[index].duration){
    elapsedBeforeLeg+=legs[index].duration;
    index++;
   }
   if(index===legs.length){finish();return;}
   const {start,end,dx,duration}=legs[index];
   if(Math.abs(dx)>1)setFacing(dx<0?-1:1);
   const t=(elapsed-elapsedBeforeLeg)/duration;
   const point={u:start.u+(end.u-start.u)*t,v:start.v+(end.v-start.v)*t};
   current.current.position=point;
   setPosition(point);
   setSprite(walkFrames[Math.floor(elapsed/110)%walkFrames.length]);
   frame.current=requestAnimationFrame(advance);
  };
  frame.current=requestAnimationFrame(advance);
 }

 function close(){
  cancelAnimationFrame(frame.current);
  saveRoom(current.current);
  onClose();
 }

 const point=roomPoint(position);
 return <dialog ref={panel} className="wardrobe-workspace companion-room" aria-labelledby="companion-room-title" onCancel={event=>{event.preventDefault();close();}}>
  <header className="drawer-head">
   <h2 id="companion-room-title">Mana’s Companion Room</h2>
   <button className="btn" onClick={close}>Back to chat</button>
  </header>
  <main className="companion-room-body">
   <p id="room-controls">Click the floor or use the arrow keys while the room is focused.</p>
   <div ref={scene} className="companion-room-scene" tabIndex={0} role="group" aria-label="Room floor" aria-describedby="room-controls"
    onClick={event=>{
     const bounds=event.currentTarget.getBoundingClientRect();
     walkTo(roomPosition((event.clientX-bounds.left)*799/bounds.width,(event.clientY-bounds.top)*698/bounds.height));
    }}
    onKeyDown={event=>{
     if(event.target!==scene.current)return;
     const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
     if(!direction)return;
     event.preventDefault();
     if(event.repeat)return;
     const from=roomPoint(current.current.position);
     walkTo(roomPosition(from.x+direction[0]*28,from.y+direction[1]*28));
    }}>
    <img className="companion-room-art" src={art+'room.png'} alt="" draggable={false}/>
    <button className="companion-room-plant" aria-label="Water the plant" title="Water the plant"
     onClick={event=>{event.stopPropagation();walkTo(PLANT_POSITION,true);}}>
     <img src={art+'plant.png'} alt="" draggable={false}/>
    </button>
    <img className="companion-room-mana" src={sprite} alt="Miniature Mana" draggable={false}
     style={{left:`${point.x/799*100}%`,top:`${point.y/698*100}%`,transform:`translate(-50%, -98%) scaleX(${facing})`}}/>
    {point.y<518&&<img className="companion-room-art companion-room-table-depth" src={art+'room.png'} alt="" draggable={false}/>}
   </div>
   <p role="status">{status|| (wateredAt?'The plant has been watered.':'')}</p>
  </main>
 </dialog>;
}
