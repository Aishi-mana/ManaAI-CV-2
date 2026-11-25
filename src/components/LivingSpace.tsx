import MapTransferArrow from './MapTransferArrow';
import SceneViewport from './SceneViewport';
import CharacterGesture from './CharacterGesture';
import {useSceneLine} from './SceneVoice';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {ROOM_CONTACTS,type RoomContact} from '../core/roomPhone';
import {homeThresholds,streetDoors,streetTripDuration,type StreetTrip} from '../core/manaverseStreet';
import {outdoorTrip} from '../core/manaverseNavigation';
import LyraSprite from './ResidentSprite';
import ManaSprite from './ManaSprite';
import {walkTravelMs} from '../core/manaverseMovement';
import {livingFurnishings,ROOM_ART,ROOM_TIMING,sharedRoomActorDepth,sharedRoomFurnitureDepth,roomPoint,roomDropPosition,roomPosition,roomRoute,type LunaVisitMemory,type RoomPosition} from '../core/companionRoom';

export const livingSpaceEntry=roomPosition(homeThresholds.livingToBedroom.x*7.99,homeThresholds.livingToBedroom.y*6.98,livingFurnishings);
export const livingStreetEntry=roomPosition(homeThresholds.livingToStreet.x*7.99,homeThresholds.livingToStreet.y*6.98,livingFurnishings);
const interactions={
 plant:{label:'Water the plant',pose:'water',status:'Mana is watering the living room plant.'},
 bookshelf:{label:'Read at the bookshelf',pose:'read',status:'Mana is reading in the living room.'},
 chair:{label:'Rest by the beanbag',pose:'idle',status:'Mana is taking a quiet break.'},
} as const;
type Interaction={label:string;pose:'water'|'read'|'idle';status:string};
const BEANBAG=livingFurnishings.find(piece=>piece.id==='chair')!;
const CHAT_MANA=roomPosition(BEANBAG.x+75,BEANBAG.footprint!.bottom+23,livingFurnishings);
const CHAT_LUNA=roomPosition(BEANBAG.x+135,BEANBAG.footprint!.bottom+23,livingFurnishings);
const VISITOR_CHAT:Interaction={label:'Chat with visitor',pose:'idle',status:'Mana is chatting by the beanbag.'};
type VisitPhase='away'|'preparing'|'arriving'|'visiting'|'leaving'|'heading-home';
const VISIT_DURATION=120_000;

function useLivingVisitor(manaPresent:boolean,sleeping:boolean,memories:Partial<Record<RoomContact,LunaVisitMemory>>,onRemember:(contact:RoomContact,memory:LunaVisitMemory)=>void){
 const [phase,setPhase]=useState<VisitPhase>('away');
 const [streetTrip,setStreetTrip]=useState<StreetTrip>();
 const [contact,setContact]=useState<RoomContact>('luna');
 const lastMemory=memories[contact];
 const [feet,setFeet]=useState(livingStreetEntry);
 const [facing,setFacing]=useState(1);
 const [walking,setWalking]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [meetingRequested,setMeeting]=useState(false);
 const meeting=meetingRequested&&manaPresent&&phase==='visiting';
 const current=useRef(livingStreetEntry);
 const greeted=useRef(false);
 const met=useRef(false);
 const sleptThrough=useRef(false);
 const remember=useRef(onRemember);
 remember.current=onRemember;
 const manaInRoom=useRef(manaPresent);
 manaInRoom.current=manaPresent;


 useEffect(()=>{
  if(phase!=='away'&&!sleeping)sleptThrough.current=false;
 },[phase,sleeping]);



 useEffect(()=>{
  if(phase==='visiting'&&manaPresent&&!greeted.current){
   greeted.current=true;
   setSpeaking(true);
  }
 },[manaPresent,phase]);

 useEffect(()=>{
  if(phase!=='visiting'||!manaPresent){
   setMeeting(false);
   return;
  }
  if(met.current)return;
  const timeout=window.setTimeout(()=>{
   met.current=true;
   setMeeting(true);
  },3500);
  return ()=>clearTimeout(timeout);
 },[manaPresent,phase]);

 useEffect(()=>{
  if(!speaking)return;
  const timeout=window.setTimeout(()=>setSpeaking(false),3200);
  return ()=>clearTimeout(timeout);
 },[speaking]);

 useEffect(()=>{
  if(phase==='away')return;
  let frame=0;
  let pause=0;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function move(target:RoomPosition,onArrival:()=>void){
   const route=roomRoute(current.current,target,livingFurnishings);
   if(!route.length){
    onArrival();
    return;
   }
   let from=current.current;
   let index=0;
   let started=performance.now();
   setWalking(!reducedMotion);
   function animate(now:number){
    const to=route[index],a=roomPoint(from),b=roomPoint(to);
    const duration=Math.max(1,walkTravelMs(a,b));
    const progress=reducedMotion?1:Math.min(1,(now-started)/duration);
    const next={u:from.u+(to.u-from.u)*progress,v:from.v+(to.v-from.v)*progress};
    current.current=next;
    setFeet(next);
    if(Math.abs(b.x-a.x)>1)setFacing(b.x<a.x?-1:1);
    if(progress===1){
     index++;
     if(index===route.length){setWalking(false);onArrival();return;}
     from=to;
     started=now;
    }
    frame=requestAnimationFrame(animate);
   }
   frame=requestAnimationFrame(animate);
  }

  function roam(){
   const candidate=roomPoint({u:.14+Math.random()*.72,v:.14+Math.random()*.72});
   move(roomPosition(candidate.x,candidate.y,livingFurnishings),()=>{
    pause=window.setTimeout(roam,2500+Math.random()*3500);
   });
  }

  if(phase==='leaving'){
   setWalking(false);
   const exit=()=>move(livingStreetEntry,()=>{
    if(sleptThrough.current)remember.current(contact,'while-mana-slept');
    beginStreetTrip(contact,false);
   });
   if(manaInRoom.current){
    setSpeaking(true);
    pause=window.setTimeout(exit,2200);
   }else{
    setSpeaking(false);
    exit();
   }
  }else if(phase!=='visiting')return;
  else if(meeting)move(CHAT_LUNA,()=>setFacing(-1));
  else pause=window.setTimeout(roam,900);
  return ()=>{
   clearTimeout(pause);
   cancelAnimationFrame(frame);
  };
 },[phase,meeting,contact]);

 useEffect(()=>{
  if(phase!=='visiting')return;
  const end=window.setTimeout(()=>setPhase('leaving'),VISIT_DURATION);
  return ()=>clearTimeout(end);
 },[phase]);

 function beginStreetTrip(guest:RoomContact,arriving:boolean){
  const home=streetDoors[guest==='lyra'?'library':'luna-home'];
  const mana=streetDoors.living;
  const trip=outdoorTrip('street',arriving?home:mana,arriving?mana:home);
  if(!trip)return;
  setStreetTrip(trip);
  setPhase(arriving?'arriving':'heading-home');
 }
 useEffect(()=>{
  if(!streetTrip)return;
  const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:streetTripDuration(streetTrip);
  const timer=window.setTimeout(()=>{
   setStreetTrip(undefined);
   setPhase(phase==='arriving'?'visiting':'away');
  },Math.max(0,streetTrip.started+duration-Date.now()));
  return ()=>clearTimeout(timer);
 },[streetTrip,phase]);

 return {
  streetTrip,phase,contact,name:ROOM_CONTACTS[contact].name,feet:roomPoint(feet),facing,speaking,lastMemory,meeting,
  finishMeeting:()=>setMeeting(false),
  completeMeeting:()=>{
   remember.current(contact,'beanbag-chat');
   setMeeting(false);
  },
  walking,departHome:()=>beginStreetTrip(contact,true),
  drop:phase==='visiting'&&!walking&&!meetingRequested? (point:{x:number;y:number})=>{
   const target=roomDropPosition(point,livingFurnishings);
   if(!target)return;
   current.current=target;
   setFeet(target);
  }:undefined,
  invite:(guest:RoomContact)=>{
   setContact(guest);
   current.current=livingStreetEntry;
   greeted.current=false;
   met.current=false;
   sleptThrough.current=sleeping;
   setFeet(livingStreetEntry);
   setFacing(1);
   setWalking(false);
   setSpeaking(false);
   setPhase('preparing');
  },
  leave:()=>{setMeeting(false);setPhase('leaving');},
 };
}

type LivingActivity='water'|'read'|'sleep';

export default function LivingSpace({petBot,renderSpeech,position,onPosition,onBedroom,onStreet,shown,present,returning,onReturn,sleeping,memories,onRemember,scheduledActivity,scheduledKind='water',onActivityDone,phoneVisit,onVisitAvailability,onManaIdle,onActivityStatus,onVisitorAway,onVisitorPresent,onVisitorPreparing,visitorAtDoor,onStreetGuest,streetExit}:{
 petBot?:ReactNode;
 renderSpeech?:(feet:{x:number;y:number},activity:string)=>ReactNode;
 position:RoomPosition;onPosition:(position:RoomPosition)=>void;onBedroom:()=>void;
 onStreet:()=>void;
 shown:boolean;present:boolean;returning:boolean;streetExit:boolean;onReturn:(arrived:boolean)=>void;
 sleeping:boolean;memories:Partial<Record<RoomContact,LunaVisitMemory>>;onRemember:(contact:RoomContact,memory:LunaVisitMemory)=>void;
 scheduledActivity?:string;scheduledKind?:LivingActivity;onActivityDone:(id:LivingActivity,label:string)=>void;
 phoneVisit?:{contact:RoomContact};onVisitAvailability:(available:boolean)=>void;onManaIdle:(idle:boolean)=>void;onActivityStatus:(status:string)=>void;
 onVisitorAway:(contact:RoomContact|null)=>void;
 onVisitorPresent:(contact:RoomContact|null)=>void;
 onVisitorPreparing:(contact:RoomContact|null)=>void;visitorAtDoor:RoomContact|null;
 onStreetGuest:(guest:{contact:RoomContact;trip:StreetTrip}|undefined)=>void;
}){
 const visitor=useLivingVisitor(present&&!returning,sleeping,memories,onRemember);
 const [feet,setFeet]=useState(position);
 const [walking,setWalking]=useState(false);
 const [facing,setFacing]=useState(1);
 const [activity,setActivity]=useState<Interaction>();
 const [chatLine,setChatLine]=useState< 'guest'|'mana'>();
 const current=useRef(position);
 const animation=useRef(0);
 const lastScheduledActivity=useRef<string|undefined>(undefined);
 const activityDone=useRef(onActivityDone);
 activityDone.current=onActivityDone;
 const startMeeting=useRef(()=>{});
 const startReturn=useRef(()=>{});
 const finishMeeting=useRef(visitor.finishMeeting);
 finishMeeting.current=visitor.finishMeeting;
 const completeMeeting=useRef(visitor.completeMeeting);
 completeMeeting.current=visitor.completeMeeting;
 const meeting=visitor.meeting&&present&&!returning&&visitor.phase==='visiting';
 const inviteFromPhone=useRef(visitor.invite);
 inviteFromPhone.current=visitor.invite;
 const handledPhoneVisit=useRef<typeof phoneVisit>(undefined);
 useEffect(()=>{
  if(!phoneVisit||phoneVisit===handledPhoneVisit.current)return;
  handledPhoneVisit.current=phoneVisit;
  if(visitor.phase==='away')inviteFromPhone.current(phoneVisit.contact);
 },[phoneVisit,visitor.phase]);
 useEffect(()=>onVisitAvailability(visitor.phase==='away'),[visitor.phase,onVisitAvailability]);
 useEffect(()=>onStreetGuest(visitor.streetTrip?{contact:visitor.contact,trip:visitor.streetTrip}:undefined),[visitor.streetTrip,visitor.contact,onStreetGuest]);
 const visitorInside=visitor.phase==='visiting'||visitor.phase==='leaving';
 useEffect(()=>{onVisitorPresent(visitorInside?visitor.contact:null);},[visitorInside,visitor.contact,onVisitorPresent]);
 useEffect(()=>onVisitorAway(visitor.phase==='away'||visitor.phase==='preparing'?null:visitor.contact),[visitor.contact,visitor.phase,onVisitorAway]);
 useEffect(()=>onVisitorPreparing(visitor.phase==='preparing'?visitor.contact:null),[visitor.contact,visitor.phase,onVisitorPreparing]);
 const departHome=useRef(visitor.departHome);
 departHome.current=visitor.departHome;
 useEffect(()=>{if(visitor.phase==='preparing'&&visitorAtDoor===visitor.contact)departHome.current();},[visitor.phase,visitor.contact,visitorAtDoor]);
 useEffect(()=>onManaIdle(present&&!returning&&!walking&&!activity&&!meeting),[present,returning,walking,activity,meeting,onManaIdle]);
 useEffect(()=>{
  if(present&&returning)startReturn.current();
 },[present,returning,streetExit]);

 useEffect(()=>{
  if(!meeting)return;
  startMeeting.current();
  const timeout=window.setTimeout(()=>finishMeeting.current(),16000);
  return ()=>{clearTimeout(timeout);setChatLine(undefined);};
 },[meeting]);

 const lunaAtBeanbag=Math.hypot(visitor.feet.x-roomPoint(CHAT_LUNA).x,visitor.feet.y-roomPoint(CHAT_LUNA).y)<1;
 useEffect(()=>{
  if(!meeting||!lunaAtBeanbag||activity!==VISITOR_CHAT)return;
  setChatLine('guest');
  const reply=window.setTimeout(()=>setChatLine('mana'),2600);
  const done=window.setTimeout(()=>completeMeeting.current(),5400);
  return ()=>{clearTimeout(reply);clearTimeout(done);setChatLine(undefined);};
 },[meeting,lunaAtBeanbag,activity]);

 useEffect(()=>{
  if(!meeting&&activity===VISITOR_CHAT)setActivity(undefined);
 },[meeting,activity]);
 useEffect(()=>{
  if(present){
   current.current=position;
   setFeet(position);
   return;
  }
  cancelAnimationFrame(animation.current);
  setWalking(false);
  setActivity(undefined);
  lastScheduledActivity.current=undefined;
 },[present]);
 useEffect(()=>()=>cancelAnimationFrame(animation.current),[]);
 useEffect(()=>{
  if(!present||sleeping||walking||meeting||returning)return;
  if(activity){
   const timeout=window.setTimeout(()=>{
    const id=activity===interactions.plant?'water':activity===interactions.bookshelf?'read':'sleep';
    activityDone.current(id,activity.label);
    setActivity(undefined);
   },ROOM_TIMING.activity);
   return ()=>clearTimeout(timeout);
  }
  if(!scheduledActivity){lastScheduledActivity.current=undefined;return;}
  if(lastScheduledActivity.current===scheduledActivity)return;
  const id=scheduledKind==='read'?'bookshelf':scheduledKind==='sleep'?'chair':'plant';
  const piece=livingFurnishings.find(piece=>piece.id===id);
  if(!piece?.footprint)return;
  lastScheduledActivity.current=scheduledActivity;
  walk(piece.x+piece.width/2,piece.footprint.bottom+14,interactions[id]);
 },[activity,present,sleeping,walking,meeting,returning,scheduledActivity,scheduledKind]);

 function walk(x:number,y:number,interaction?:Interaction,onArrival?:(arrived:boolean)=>void){
  if(!present)return;
  const target=roomPosition(x,y,livingFurnishings);
  const route=roomRoute(current.current,target,livingFurnishings);
  if(!route.length){onArrival?.(false);return;}
  cancelAnimationFrame(animation.current);
  setActivity(undefined);
  const arrive=()=>{
   setWalking(false);
   setActivity(interaction);
   if(interaction===VISITOR_CHAT)setFacing(1);
   onPosition(target);
   onArrival?.(true);
  };
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   current.current=target;
   setFeet(target);
   arrive();
   return;
  }
  setWalking(true);
  let from=current.current;
  let index=0;
  let started=performance.now();
  function animate(now:number){
   const to=route[index],a=roomPoint(from),b=roomPoint(to);
   const duration=Math.max(1,walkTravelMs(a,b));
   const progress=Math.min(1,(now-started)/duration);
   const next={u:from.u+(to.u-from.u)*progress,v:from.v+(to.v-from.v)*progress};
   current.current=next;
   setFeet(next);
   if(Math.abs(b.x-a.x)>1)setFacing(b.x<a.x?-1:1);
   if(progress===1){
    index++;
    if(index===route.length){arrive();return;}
    from=to;
    started=now;
   }
   animation.current=requestAnimationFrame(animate);
  }
  animation.current=requestAnimationFrame(animate);
 }
 startReturn.current=()=>{
  const door=roomPoint(streetExit?livingStreetEntry:livingSpaceEntry);
  walk(door.x,door.y,undefined,onReturn);
 };
 startMeeting.current=()=>{
  const spot=roomPoint(CHAT_MANA);
  walk(spot.x,spot.y,VISITOR_CHAT);
 };

 const point=roomPoint(feet);
 const guestSpeaking=chatLine==='guest'||!chatLine&&visitor.speaking;
 const rememberedVisit=visitor.lastMemory==='beanbag-chat'?'You have chatted by the beanbag before.':
  visitor.lastMemory==='while-mana-slept'?'On a previous visit, Mana was sleeping.':'';
 const speech=useSceneLine(shown&&present?(guestSpeaking?
  chatLine==='guest'?`NPC conversation: Only you and Mana are talking by her beanbag. Speak directly to Mana about the visit.`:
   visitor.phase==='leaving'?'NPC conversation: Your visit to Mana’s living space is ending. Say a brief goodbye to Mana.':
    `NPC conversation: You just arrived at Mana’s living space for a visit. Greet Mana gently. ${rememberedVisit}`:
   chatLine==='mana'?`NPC conversation: Only you and ${visitor.name} are talking by the beanbag in your living space. Speak directly to ${visitor.name} about the visit.`:undefined):undefined,guestSpeaking?visitor.contact:'mana');
 const speaker=chatLine==='mana'?point:visitor.feet;
 const activityStatus=returning?(streetExit?'Mana is walking to the street.':'Mana is walking to the bedroom door.'):
  walking?'Mana is walking around the living space.':activity===VISITOR_CHAT?`Mana is chatting with ${visitor.name} by the beanbag.`:activity?.status??'Mana is spending time at home.';
 useEffect(()=>{if(present)onActivityStatus(activityStatus);},[present,activityStatus,onActivityStatus]);
 return <div className="companion-room-body living-space" hidden={!shown}>
  <SceneViewport>
  <div className="companion-room-scene" role="group" aria-label="Living space floor">
   <img className="companion-room-art" src={ROOM_ART+'roombg.png'} alt="" draggable={false}/>
   <img className="companion-room-art companion-room-wall-finish" data-finish="Warm cream" src={ROOM_ART+'roombg.png'} alt="" draggable={false}/>
   <img className="companion-room-art companion-room-floor-finish" data-finish="Honey oak" src={ROOM_ART+'roombg.png'} alt="" draggable={false}/>
   <button className="living-bedroom-door" type="button" aria-label="Return to Mana’s bedroom" onClick={event=>{
    event.stopPropagation();
    onBedroom();
   }}><span aria-hidden="true"/></button>
   <MapTransferArrow point={homeThresholds.livingToStreet} direction="down-right" label="Go to Manaverse Street" onClick={onStreet}/>
   {livingFurnishings.map(piece=>{
    const style={left:`${piece.x/799*100}%`,top:`${piece.y/698*100}%`,width:`${piece.width/799*100}%`,zIndex:sharedRoomFurnitureDepth(piece)};
    return <img key={piece.id} className="companion-room-decoration" src={ROOM_ART+piece.image} alt="" draggable={false} style={style}/>;

   })}
   {petBot}
   {visitorInside&&<CharacterGesture character={visitor.contact} onDrop={visitor.drop} className="companion-room-mana living-visitor" style={{left:`${visitor.feet.x/799*100}%`,top:`${visitor.feet.y/698*100}%`,zIndex:sharedRoomActorDepth(visitor.feet)}}>
    <LyraSprite resident={visitor.contact} walking={visitor.walking} facing={visitor.facing} visible={shown}/>
   </CharacterGesture>}
   {present&&visitorInside&&speech&&<div className="companion-room-thought scene-conversation-line" role="status" style={{
    '--thought-x':`${speaker.x/799*100}%`,
    '--thought-y':`${speaker.y/698*100-20}%`,
   } as CSSProperties}><p>{speech}</p></div>}
   {present&&<CharacterGesture character="mana" onDrop={!walking&&!returning&&!meeting&&!activity&&!sleeping?point=>{
    const target=roomDropPosition(point,livingFurnishings);
    if(!target)return;
    current.current=target;
    setFeet(target);
    onPosition(target);
   }:undefined} className="companion-room-mana" style={{left:`${point.x/799*100}%`,top:`${point.y/698*100}%`,zIndex:sharedRoomActorDepth(point),transform:'translate(-50%, -98%)'}}>
    <ManaSprite walking={walking} pose={activity?.pose??'idle'} facing={facing} visible={shown}/>
   </CharacterGesture>}
   {present&&renderSpeech?.(point,activityStatus)}
  </div>
  </SceneViewport>
  <p role="status">{!present?'Mana is in her bedroom.':activityStatus}</p>
  <div className="living-visit-controls">
   <span role="status">{visitor.phase==='visiting'?`${visitor.name} is visiting.`:visitor.phase==='arriving'?`${visitor.name} is on the way.`:visitor.phase==='leaving'||visitor.phase==='heading-home'?`${visitor.name} is heading home.`:''}</span>
  </div>
 </div>;
}
