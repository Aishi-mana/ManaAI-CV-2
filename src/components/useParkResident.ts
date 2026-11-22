import {useEffect,useRef,useState} from 'react';
import {parkBenches,parkStops} from '../core/manaversePark';
import {roomSleepNight} from '../core/companionRoom';
import {useParkWalk} from './useParkWalk';

export function useParkResident(contact:keyof typeof parkBenches,active:boolean,timeZone:string,onExit:()=>void,meetup=false,paused=false,meetingHost?:keyof typeof parkBenches,sheltering=false){
 const park=useParkWalk(active,onExit,paused);
 const bench=parkBenches[contact];
 const meetingStop=meetingHost&&meetingHost!==contact?parkBenches[meetingHost].meetupStop:bench.stop;
 const [resting,setResting]=useState(false);
 const actions=useRef(park);
 actions.current=park;
 useEffect(()=>{
  if(!active||park.moving){setResting(false);return;}
  if(sheltering||roomSleepNight(new Date(),timeZone)){setResting(false);actions.current.leave();return;}
  if(park.stop!==meetingStop){actions.current.walk(meetingStop);return;}
  setResting(true);
  if(meetup||paused)return;
  const timer=window.setTimeout(()=>{
   setResting(false);
   actions.current.leave();
  },22_000);
  return ()=>clearTimeout(timer);
 },[active,bench,meetingStop,park.moving,park.stop,timeZone,meetup,paused,sheltering]);
 const restingBench=meetingHost&&meetingHost!==contact?{...bench,point:parkStops[meetingStop]}:bench;
 return park.walker?{contact,walker:park.walker,bench:resting&&!sheltering&&park.stop===meetingStop&&!park.moving?restingBench:undefined,drop:!resting&&!meetup&&!paused?park.drop:undefined}:undefined;
}

