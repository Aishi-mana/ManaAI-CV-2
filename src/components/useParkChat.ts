import {useEffect,useRef} from 'react';
import type {StreetCharacter} from '../core/manaverseStreet';
import type {ParkWalker} from './ManaversePark';

export const parkActivities={
 sketch:{label:'Sketching by the pond',line:'Let’s sketch the ripples together.',reply:'I’m watching how the ripples spread.',outcome:'sketched by the park pond',manaPose:'think',duration:18000},
 read:{label:'Reading by the pond',line:'Want to read together for a bit?',reply:'This is a lovely spot for a chapter.',outcome:'read together by the park pond',manaPose:'read',duration:18000},
 stars:{label:'Stargazing',line:'Look, the first stars are out!',reply:'I wonder what that little cluster is called.',outcome:'watched the stars from the park',manaPose:'window',duration:22000},
} as const;
export type ParkChat={first:StreetCharacter;second:StreetCharacter;planned:false;sketch?:boolean}|
 {first:Exclude<StreetCharacter,'mana'>;second:StreetCharacter;planned:true;activity:keyof typeof parkActivities;lines?:{first:string;second:string}};
type Presence={id:StreetCharacter;walker:ParkWalker;sketching?:boolean};

export function useParkChat(people:Presence[],planned:ParkChat|undefined,chat:ParkChat|undefined,setChat:(chat:ParkChat|undefined)=>void,onComplete:(chat:Extract<ParkChat,{planned:true}>)=>void,pauseCompletion=false){
 const latest=useRef({people,planned,onComplete});
 latest.current={people,planned,onComplete};
 const cooldown=useRef(0);
 const nearby=useRef(new Set<string>());
 useEffect(()=>{
  if(chat)return;
  const timer=window.setInterval(()=>{
   if(document.visibilityState!=='visible')return;
   const {people,planned}=latest.current;
   if(planned){setChat(planned);return;}
   const pairs=people.flatMap((a,i)=>people.slice(i+1).flatMap(b=>{
    if(!a.walker.walking&&!b.walker.walking)return [];
    const p=a.walker.point,q=b.walker.point;
    if(Math.hypot(p.x-q.x,(p.y-q.y)*.58)>=(a.sketching||b.sketching?10:7))return [];
    return [{first:b.sketching?b.id:a.id,second:b.sketching?a.id:b.id,planned:false as const,sketch:a.sketching||b.sketching}];
   }));
   const key=({first,second}:ParkChat)=>first+'-'+second;
   const candidate=pairs.find(pair=>!nearby.current.has(key(pair)));
   nearby.current=new Set(pairs.map(key));
   if(candidate&&Date.now()>=cooldown.current&&Math.random()<.6)setChat(candidate);
  },150);
  return ()=>clearInterval(timer);
 },[chat,setChat]);
 useEffect(()=>{
  if(!chat||chat.planned&&pauseCompletion)return;
  const timer=window.setTimeout(()=>{
   cooldown.current=Date.now()+25_000;
   setChat(undefined);
   if(chat.planned)latest.current.onComplete(chat);
  },chat.planned?parkActivities[chat.activity].duration:6400);
  return ()=>clearTimeout(timer);
 },[chat,setChat,pauseCompletion]);
 useEffect(()=>{
  if(chat&&(!people.some(person=>person.id===chat.first)||!people.some(person=>person.id===chat.second)||(chat.planned&&!planned)))setChat(undefined);
 },[chat,people,planned,setChat]);
}
