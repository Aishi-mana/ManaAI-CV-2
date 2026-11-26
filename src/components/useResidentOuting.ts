import {useEffect,useRef,useState} from 'react';
import {squareSpots,streetTripDuration,type StreetPoint,type StreetTrip} from '../core/manaverseStreet';
import {manaversePassage} from '../core/manaversePassage';
import {outdoorTrip} from '../core/manaverseNavigation';
import {roomSleepNight} from '../core/companionRoom';
import {residentOutingSlot} from '../core/manaverseRoutine';
import {residentProfiles,type ResidentId} from '../core/residentProfiles';

type Outing={position:StreetPoint;trip?:StreetTrip;homeExit?:StreetTrip;returning?:boolean;goingToPark?:boolean;inPark?:boolean;goingToLibrary?:boolean;inLibrary?:boolean;libraryLeaving?:boolean;goingToSquare?:boolean;squareStops?:number;leavingSquare?:boolean;cafeStage?:'to-district'|'to-cafe'|'inside'|'leaving'|'from-cafe'};

const squareDoor=manaversePassage('street','square')!;
const districtDoor=manaversePassage('square','district')!;
const cafeDoor=manaversePassage('district','cafe')!;
const libraryDoor=manaversePassage('street','library')!;
const parkDoor=manaversePassage('street','park')!;

export function useResidentOuting(resident:ResidentId,away:boolean,timeZone:string,clock:{date:string;time:string},pauseUntil?:number,meetup=false,expectingGuest=false,libraryOpen=false,cafeMeetup=false,townGathering=false,cafePause=false,sheltering=false){
 const {home}=residentProfiles[resident];
 const [outing,setOuting]=useState<Outing>();
 const entrance=manaversePassage(home,'street')!.entry;
 const lastOuting=useRef('');
 const previousShelter=useRef(sheltering);
 useEffect(()=>{
  if(previousShelter.current&&!sheltering)lastOuting.current='';
  previousShelter.current=sheltering;
 },[sheltering]);
 const slot=sheltering?undefined:residentOutingSlot(resident,clock);
 const plan=slot?.place;
 const planKey=slot?.key??'';
 useEffect(()=>{
  if(away){
   setOuting(undefined);
   return;
  }
  if(outing?.homeExit||outing?.libraryLeaving||outing?.cafeStage==='leaving')return;
  if(outing?.trip){
   const {trip,returning}=outing;
   const duration=streetTripDuration(trip);
   if(pauseUntil)return;
   if(outing.cafeStage){
     const next:Outing=outing.cafeStage==='to-district'?{position:districtDoor.entry,cafeStage:'to-cafe'}:
      outing.cafeStage==='to-cafe'?{position:trip.to,cafeStage:'inside'}:
      {position:districtDoor.exit,squareStops:2};
     const timer=window.setTimeout(()=>setOuting(next),Math.max(0,trip.started+duration-Date.now()));
     return ()=>clearTimeout(timer);
   }
   if(outing.goingToSquare||outing.squareStops!==undefined){
    const next=outing.goingToSquare?{position:squareDoor.entry,squareStops:0}
     :outing.leavingSquare?{position:squareDoor.exit}
      :{position:trip.to,squareStops:(outing.squareStops??0)+1};
    const timer=window.setTimeout(()=>setOuting(next),Math.max(0,trip.started+duration-Date.now()));
    return ()=>clearTimeout(timer);
   }
   const timer=window.setTimeout(()=>setOuting(returning?undefined:{
    position:trip.to,inPark:outing.goingToPark,
    inLibrary:outing.goingToLibrary,
   }),Math.max(0,trip.started+duration-Date.now()));
   return ()=>clearTimeout(timer);
  }
  if(outing?.cafeStage){
   if(sheltering&&outing.cafeStage==='inside'&&!expectingGuest&&!roomSleepNight(new Date(),timeZone))return;
   if(outing.cafeStage==='inside'&&(cafeMeetup||cafePause))return;
   const timer=window.setTimeout(()=>{
    if(outing.cafeStage==='inside')setOuting({...outing,cafeStage:'leaving'});
    else {
     const trip=outdoorTrip('district',outing.position,cafeDoor.exit);
     if(trip)setOuting({...outing,trip});
    }
   },outing.cafeStage==='inside'&&!expectingGuest?24_000:500);
   return ()=>clearTimeout(timer);
  }
  if(outing?.inLibrary){
   if(sheltering&&!expectingGuest&&!roomSleepNight(new Date(),timeZone))return;
   const timer=window.setTimeout(()=>setOuting({...outing,libraryLeaving:true}),24_000);
   return ()=>clearTimeout(timer);
  }
  if(outing?.squareStops!==undefined){
   if(pauseUntil)return;
   if(townGathering&&!sheltering){
    const to=squareSpots[home==='library'?1:0];
    if(outing.position.x===to.x&&outing.position.y===to.y)return;
    const timer=window.setTimeout(()=>{
     const trip=outdoorTrip('square',outing.position,to);
     if(trip)setOuting({...outing,leavingSquare:false,trip});
    },600);
    return ()=>clearTimeout(timer);
   }
   if(!sheltering&&(cafeMeetup||plan==='cafe'&&(!outing.squareStops)&&lastOuting.current===planKey)&&!expectingGuest&&!roomSleepNight(new Date(),timeZone)){
    const timer=window.setTimeout(()=>{
     const trip=outdoorTrip('square',outing.position,districtDoor.exit);
     if(trip)setOuting({...outing,cafeStage:'to-district',trip});
    },1200);
    return ()=>clearTimeout(timer);
   }
   const leavingSquare=sheltering||meetup||expectingGuest||!!roomSleepNight(new Date(),timeZone)||outing.squareStops>=2;
   const to=leavingSquare?squareDoor.entry:squareSpots[(outing.squareStops+(home==='library'?1:0))%squareSpots.length];
   const timer=window.setTimeout(()=>{
    const trip=outdoorTrip('square',outing.position,to);
    if(trip)setOuting({...outing,leavingSquare,trip});
   },
    leavingSquare?500:4500+Math.random()*3500);
   return ()=>clearTimeout(timer);
  }
  if(pauseUntil||outing?.inPark||expectingGuest&&!outing)return;
  if(sheltering&&!outing)return;
  if(townGathering&&!sheltering){
   const position=outing?.position??entrance;
   const timer=window.setTimeout(()=>{
    const trip=outdoorTrip('street',position,squareDoor.exit);
    if(trip)setOuting({position,goingToSquare:true,...(outing?{trip}:{homeExit:trip})});
   },900);
   return ()=>clearTimeout(timer);
  }
  if(!outing&&!meetup&&!cafeMeetup&&(!planKey||planKey===lastOuting.current||plan==='library'&&!libraryOpen))return;
  const timer=window.setTimeout(()=>{
   const position=outing?.position??entrance;
   const returning=!!outing&&(sheltering||!meetup&&!cafeMeetup);
   const goingToLibrary=!returning&&!meetup&&!cafeMeetup&&plan==='library';
   const goingToPark=meetup||!returning&&!cafeMeetup&&plan==='park';
   const goingToSquare=cafeMeetup||!returning&&!meetup&&plan==='cafe';
   const to=returning?entrance:goingToLibrary?libraryDoor.exit:goingToPark?parkDoor.exit:squareDoor.exit;
   const trip=outdoorTrip('street',position,to);
   if(!trip)return;
   if(!returning&&!meetup&&!cafeMeetup)lastOuting.current=planKey;
   setOuting({position,returning,goingToPark,goingToLibrary,goingToSquare,...(outing?{trip}:{homeExit:trip})});
  },meetup||cafeMeetup?700:1800);
  return ()=>clearTimeout(timer);
 },[away,entrance,outing,timeZone,pauseUntil,meetup,expectingGuest,libraryOpen,cafeMeetup,townGathering,cafePause,plan,planKey,sheltering]);
 const resume=(pausedMs:number)=>setOuting(current=>current?.trip
  ?{...current,trip:{...current.trip,started:current.trip.started+pausedMs}}
  :current);
 const leavePark=()=>setOuting(current=>current?.inPark?{...current,inPark:false}:current);
 const leaveHome=()=>setOuting(current=>current?.homeExit?{...current,homeExit:undefined,trip:{...current.homeExit,started:Date.now()}}:current);
 const leaveLibrary=()=>setOuting(current=>current?.libraryLeaving?{...current,libraryLeaving:false,inLibrary:false}:current);
 const leaveCafe=()=>setOuting(current=>{
  if(current?.cafeStage!=='leaving')return current;
  const trip=outdoorTrip('district',cafeDoor.exit,districtDoor.entry);
  return trip?{...current,cafeStage:'from-cafe',trip}:current;
 });
 const drop=(point:StreetPoint)=>setOuting(current=>current&&!away&&!pauseUntil&&!current.trip&&
  !current.returning&&!current.inPark&&!current.inLibrary&&current.cafeStage!=='inside'?{...current,position:point}:current);
 return {outing:away?undefined:outing,resume,leavePark,leaveHome,leaveLibrary,leaveCafe,drop};
}


