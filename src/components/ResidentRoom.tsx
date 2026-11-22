import ActivityKeepsake from './ActivityKeepsake';
import type {ActivityKeepsake as Keepsake} from '../core/activityKeepsakes';
import MapTransferArrow from './MapTransferArrow';
import SceneViewport from './SceneViewport';
import CharacterGesture from './CharacterGesture';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ROOM_ART,roomSleepNight} from '../core/companionRoom';
import {isResidentFloor,libraryStairFoot,lyraRoomLanding} from '../core/officeWalk';
import type {StreetPoint} from '../core/manaverseStreet';
import ResidentSprite from './ResidentSprite';
import ManaSprite from './ManaSprite';
import {useEntranceWalk} from './useEntranceWalk';
import {sceneTravelMs} from '../core/manaverseMovement';
import {manaversePassage} from '../core/manaversePassage';
import {manaverseWalkRoute} from '../core/manaverseNavigation';
import {libraryStoryText} from '../core/libraryStory';
import {useSceneLine} from './SceneVoice';
import RoomSpeech from './ManaRoomSpeech';

import {residentProfiles,type ResidentActivity,type ResidentId} from '../core/residentProfiles';
import {chooseResidentFreeActivity,type ActivityPreferences} from '../core/activityPreferences';

export default function ResidentRoom({preferences={},coreMemories=[],preferredPose,onActivityDone,keepsake,resident,shown,away,outdoors,leavingHome=false,onResidentExit,onStreet,timeZone,manaPresent,manaLeaving=false,onManaExit,lunaVisiting=false,lunaLeaving=false,onLunaExit,storyLine,upstairs=false,onStairs,onActivityStatus,sharingActivity=false,chat}:{preferences?:ActivityPreferences;coreMemories?:string[];preferredPose?:string;onActivityDone:(resident:ResidentId,pose:string)=>void;keepsake?:Keepsake;resident:ResidentId;shown:boolean;away:boolean;outdoors:boolean;leavingHome?:boolean;onResidentExit?:()=>void;onStreet:()=>void;timeZone:string;manaPresent:boolean;manaLeaving?:boolean;onManaExit?:()=>void;lunaVisiting?:boolean;lunaLeaving?:boolean;onLunaExit?:()=>void;storyLine?:string;upstairs?:boolean;onStairs?:()=>void;onActivityStatus:(status:string)=>void;sharingActivity?:boolean;
 chat?:{ready:boolean;onSend:(message:string,context:string,onReply:(reply:string)=>void,signal:AbortSignal)=>Promise<void>};
}){
 const goalActivity=useRef({preferredPose,onActivityDone,preferences,coreMemories});
 goalActivity.current={preferredPose,onActivityDone,preferences,coreMemories};
 const [chatOpen,setChatOpen]=useState(false);
 const {name,home,upstairs:bedroom,activities,sleep}=residentProfiles[resident];
 const place=home==='library'?'the library':'her home';
 const entrance=manaversePassage('street',home)!.entry;
 const nightActivity=sleep.activity;
 const isLyra=resident==='lyra';
 const [night,setNight]=useState(()=>roomSleepNight(new Date(),timeZone));
 const [feet,setFeet]=useState(()=>isLyra&&night?lyraRoomLanding:entrance);
 const location=useRef(feet);
 const [walking,setWalking]=useState(false);
 const moving=useRef(false);
 const sharing=useRef(sharingActivity);
 sharing.current=sharingActivity;
 const [placementRevision,setPlacementRevision]=useState(0);
 const [facing,setFacing]=useState(1);
 const [activity,setActivity]=useState<ResidentActivity>();
 const [residentFloor,setResidentFloor]=useState<'library'|'lyra-room'|'luna-home'>(()=>isLyra&&night?'lyra-room':home);
 const locationFloor=useRef(residentFloor);
 const residentExit=useRef(onResidentExit);
 useEffect(()=>{residentExit.current=onResidentExit;},[onResidentExit]);

 useEffect(()=>{
  const check=()=>setNight(roomSleepNight(new Date(),timeZone));
  check();
  const timer=window.setInterval(check,15_000);
  document.addEventListener('visibilitychange',check);
  return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check);};
 },[timeZone]);

 useEffect(()=>{
  if(away||outdoors){
   locationFloor.current=home;
   location.current=entrance;
   setResidentFloor(home);
   setFeet(entrance);
   setActivity(undefined);
   moving.current=false;
   setWalking(false);
   return;
  }
  const destination=bedroom&&night&&!leavingHome?bedroom:home;
  const startFloor=locationFloor.current;
  if(!isResidentFloor(startFloor,location.current)){
   location.current=startFloor==='lyra-room'?lyraRoomLanding:entrance;
   setFeet(location.current);
  }
  let frame=0,timer=0,previousPose:string|undefined;
  let finishedStargazing=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function walk(target:StreetPoint,onArrival:()=>void){
   const floor=locationFloor.current;
   const route=manaverseWalkRoute(floor,location.current,target).slice(1);
   if(!route.length){
    setWalking(false);
    if(location.current.x===target.x&&location.current.y===target.y)onArrival();
    else timer=window.setTimeout(start,3000);
    return;
   }
   setActivity(undefined);
   moving.current=true;
   setWalking(!reduced);
   let from=location.current,index=0,started:number|undefined;
   function step(now:number){
    if(!moving.current)return;
    started??=now;
    const to=route[index],duration=Math.max(1,sceneTravelMs(floor,from,to));
    const t=reduced?1:Math.min(1,(now-started)/duration);
    location.current=t===1?to:{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
    setFeet(location.current);
    if(to.x!==from.x)setFacing(to.x<from.x?-1:1);
    if(t===1){
     if(++index===route.length){
      moving.current=false;
      setWalking(false);
      onArrival();
      return;
     }
     from=to;started=now;
    }
    frame=requestAnimationFrame(step);
   }
   frame=requestAnimationFrame(step);
  }

  function chooseActivity(){
   if(sharing.current){timer=window.setTimeout(chooseActivity,1000);return;}
   const beforeBed=finishedStargazing?undefined:sleep.beforeBed;
   const choice:ResidentActivity=night
    ?(beforeBed??nightActivity)
    :chooseResidentFreeActivity(resident,goalActivity.current.preferences,goalActivity.current.coreMemories,previousPose,goalActivity.current.preferredPose);
   previousPose=choice.pose;
   walk(choice.position,()=>{
    setActivity(choice);
    if(choice===beforeBed)finishedStargazing=true;
    if(choice!==nightActivity)timer=window.setTimeout(()=>{
     if(!choice.shortPause&&!sharing.current)goalActivity.current.onActivityDone(resident,choice.pose);
     chooseActivity();
    },choice.shortPause?6500:22000);
   });
  }

  function start(){
   if(locationFloor.current!==destination){
    const passage=manaversePassage(locationFloor.current,destination);
    if(!passage)return;
    walk(passage.exit,()=>{
     location.current=passage.entry;
     locationFloor.current=destination;
     setFeet(passage.entry);
     setResidentFloor(destination);
     start();
    });
   }else if(leavingHome){
    walk(entrance,()=>residentExit.current?.());
   }else chooseActivity();
  }
  timer=window.setTimeout(start,leavingHome?0:1800);
  return ()=>{moving.current=false;cancelAnimationFrame(frame);clearTimeout(timer);};
 },[away,outdoors,night,resident,isLyra,home,activities,entrance,nightActivity,sleep,bedroom,placementRevision,leavingHome]);


 const inBed=activity===nightActivity;
 const floor=upstairs&&bedroom?bedroom:home;
 const point=inBed?sleep.point:isResidentFloor(floor,feet)?feet:upstairs?lyraRoomLanding:entrance;
 const activityStatus=activity?.status??(walking?`${name} is walking around ${place}.`:`${name} is in ${place}.`);
 useEffect(()=>{onActivityStatus(activityStatus);},[activityStatus,onActivityStatus]);
 const artwork=isLyra?(upstairs?'lyra-upstairs':'lyra-library'):'luna-home-interior';
 const canChat=shown&&!away&&!outdoors&&!upstairs&&!night&&!leavingHome&&residentFloor===floor&&!!chat;
 useEffect(()=>{if(!canChat)setChatOpen(false);},[canChat]);
 const line=useSceneLine(shown&&!away&&!outdoors&&!upstairs&&!night&&!leavingHome&&residentFloor===floor&&!chatOpen&&(storyLine||activity)?
  storyLine?`You are looking at the library’s framed note with Mana. The note reads: ${storyLine}. Give a short reaction.`:
   `You are in ${place}. Current activity: ${activity?.status} Say a short thought about what you are doing.`:undefined,resident);
 return <div className="companion-room-body manaverse-outside" hidden={!shown}>
  {canChat&&<button type="button" className="btn" aria-pressed={chatOpen} onClick={()=>setChatOpen(open=>!open)}>Talk to {name}</button>}
  <SceneViewport>
  <div className={`district-interior resident-interior ${artwork}`}>
   <img className="district-interior-shell" src={ROOM_ART+(isLyra?artwork:'luna-home-daylight')+'.png'} alt="" draggable={false}/>
   {keepsake&&shown&&!upstairs&&<ActivityKeepsake key={keepsake.id} keepsake={keepsake} timeZone={timeZone}
    style={{left:isLyra?'16%':'49%',top:isLyra?'58%':'49%',width:isLyra?'2.5%':'4%',zIndex:60}}/>}
   {!away&&!outdoors&&residentFloor===floor&&<CharacterGesture character={resident} asleep={inBed} onDrop={!activity&&(!isLyra||!walking)?point=>{
    if(!isResidentFloor(floor,point)||isLyra&&moving.current)return;
    const interrupted=moving.current;
    moving.current=false;
    location.current=point;
    setFeet(point);
    if(interrupted){
     setWalking(false);
     setPlacementRevision(value=>value+1);
    }
   }:undefined} className={`companion-room-mana living-visitor${inBed?' resident-in-bed':''}`} style={{
    left:`${point.x}%`,
    top:`${point.y}%`,
    zIndex:Math.round(point.y),
   }}>
    {activity?.pose?<img className="visitor-idle" src={`./companion-room/${resident}-${activity.pose}.png`} alt={name}/>:
     <ResidentSprite resident={resident} walking={walking} facing={facing} visible={shown}/>}
   </CharacterGesture>}
   {canChat&&chatOpen&&chat&&<RoomSpeech name={name} open onClose={()=>setChatOpen(false)} ready={chat.ready}
    context={`You are in ${place}. ${activityStatus}`} onChat={chat.onSend}
    anchor={{'--thought-x':`${point.x}%`,'--thought-y':`${point.y-20}%`} as CSSProperties}/>}
   {!away&&!outdoors&&!upstairs&&line&&<div className="companion-room-thought scene-ambient-line" role="status" style={{
    '--thought-x':`${point.x}%`,'--thought-y':`${point.y-20}%`,
   } as CSSProperties}><p>{line}</p></div>}
   {isLyra&&!upstairs&&<details className="library-note" onKeyDown={event=>{
    if(event.key!=='Escape'||!event.currentTarget.open)return;
    event.stopPropagation();
    event.currentTarget.open=false;
    event.currentTarget.querySelector('summary')?.focus();
   }}>
    <summary aria-label="Read the framed note" title="Read the framed note"><span aria-hidden="true"/></summary>
    <blockquote>
     <div>"Wanna get crazy?"<br/>-Aishi</div>
     <div>"Let's gooo~ 🌸💜"<br/>-Lyra</div>
    </blockquote>
   </details>}
   {isLyra&&lunaVisiting&&<HomeVisitor visitor="luna" home="library" shown={shown&&!upstairs} hostPresent={!away&&!outdoors&&!night&&!leavingHome} leaving={lunaLeaving} onExit={onLunaExit}/>}
   {manaPresent&&<HomeVisitor visitor="mana" home={isLyra?'library':'luna-home'} shown={shown&&!upstairs} hostPresent={!away&&!outdoors&&!night} leaving={manaLeaving} onExit={onManaExit}/>}
   {isLyra&&<MapTransferArrow point={upstairs?lyraRoomLanding:libraryStairFoot} direction={upstairs?"down-right":"up-left"}
    label={upstairs?"Return to the library":"Go to Lyra’s room"} onClick={onStairs}/>}
   {!upstairs&&<MapTransferArrow point={entrance} direction="down-right"
    label="Go to Manaverse Street" onClick={onStreet}/>}
  </div>
  </SceneViewport>
  <p role="status">{away?`${name} is visiting Mana.`:outdoors?`${name} is walking around the street.`:activityStatus}</p>
 </div>;
}

const noteSpots={mana:{x:13,y:68},luna:{x:19,y:68}};

function HomeVisitor({visitor,home,shown,hostPresent,leaving=false,onExit}:{
 visitor:'mana'|'luna';home:'library'|'luna-home';shown:boolean;hostPresent:boolean;leaving?:boolean;onExit?:()=>void;
}){
 const door=manaversePassage('street',home)!.entry;
 const note=home==='library'?noteSpots[visitor]:undefined;
 const {point,walking,facing,place}=useEntranceWalk(home,true,door,leaving?door:note);
 const atNote=!!note&&point.x===note.x&&point.y===note.y&&!leaving;
 const [reading,setReading]=useState(false);
 useEffect(()=>{
  setReading(atNote);
  if(!atNote)return;
  const timer=window.setTimeout(()=>setReading(false),9000);
  return ()=>window.clearTimeout(timer);
 },[atNote]);
 useEffect(()=>{
  if(leaving&&!walking&&point.x===door.x&&point.y===door.y)onExit?.();
 },[leaving,walking,point,door,onExit]);
 const line=useSceneLine(shown&&reading&&!leaving?
  `NPC conversation: You are looking at the framed note in the library${hostPresent?' with Lyra':' alone'}. Its recorded story is: ${libraryStoryText} Give one short reaction${hostPresent?' directly to Lyra':''}.`:undefined,visitor);
 if(!shown)return null;
 return <>
  <CharacterGesture character={visitor} className="companion-room-mana living-visitor" style={{
   left:`${point.x}%`,top:`${point.y}%`,zIndex:Math.round(point.y),
  }} onDrop={!walking&&!leaving&&home==='luna-home'?point=>{if(isResidentFloor(home,point))place(point);}:undefined}>
   {visitor==='luna'?<ResidentSprite resident="luna" walking={walking} facing={facing} visible={shown}/>:
    <ManaSprite walking={walking} facing={facing} pose={reading&&!leaving?'think':'idle'} visible={shown}/>}
  </CharacterGesture>
  {line&&<div className="companion-room-thought scene-conversation-line" role="status" style={{
   '--thought-x':`${point.x}%`,'--thought-y':`${point.y-20}%`,
  } as CSSProperties}><p>{line}</p></div>}
 </>;
}

