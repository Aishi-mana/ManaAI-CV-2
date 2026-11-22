import {useContext,useEffect,useRef,useState,type RefObject} from 'react';
import {createPortal} from 'react-dom';
import {SceneVoice,useSceneLine,type SceneSpeaker} from './SceneVoice';
import {useTownWeather} from './TownWeather';
import {manaversePlaces,type ManaverseArea,type MapCharacters} from './ManaverseMap';
import {residentProfiles} from '../core/residentProfiles';
import {roomSleepNight} from '../core/companionRoom';
import {createWeatherReactionGate,weatherReactionPrompt,weatherReactionTopic} from '../core/weatherReactions';

const SPEAKERS:SceneSpeaker[]=['mana',...Object.keys(residentProfiles) as Exclude<SceneSpeaker,'mana'>[]];
const nameOf=(speaker:SceneSpeaker)=>speaker==='mana'?'Mana':residentProfiles[speaker].name;
const speechSelector='.manaverse-player-greeting,.manaverse-street-speech,.scene-ambient-line,.scene-conversation-line,.scene-pet-line,.scene-open-chat,[role="dialog"],.room-speech';
function competingSpeech(root:HTMLElement){
 return [...root.querySelectorAll(speechSelector)].some(node=>!node.closest('[hidden]')&&!node.classList.contains('scene-weather-line'));
}
function actorAnchor(root:HTMLElement,speaker:SceneSpeaker){
 return [...root.querySelectorAll<HTMLElement>('.character-gesture')].find(node=>{
  const hit=node.querySelector(`button[aria-label="Interact with ${nameOf(speaker)}"]`);
  return hit&&!node.closest('[hidden]')&&node.dataset.asleep!=='true'&&hit.getAttribute('data-held')!=='true';
 });
}
type Reaction={area:ManaverseArea;speaker:SceneSpeaker;anchor:HTMLElement;key:string;activity?:string;context:string};

export default function WeatherReactions({root,area,characters,active,timeZone}:{root:RefObject<HTMLElement|null>;area:ManaverseArea;characters:MapCharacters;active:boolean;timeZone:string}){
 const {weather,settings}=useTownWeather(),voice=useContext(SceneVoice);
 const gate=useRef<ReturnType<typeof createWeatherReactionGate>|undefined>(undefined);
 if(!gate.current)gate.current=createWeatherReactionGate();
 const [reaction,setReaction]=useState<Reaction>();
 const topic=weatherReactionTopic(weather,settings,area);
 const key=`${area}:${weather.kind}:${weather.intensity}:${topic??''}`;
 const latest=useRef({root,area,characters,active,timeZone,weather,settings,voice,topic,key});
 latest.current={root,area,characters,active,timeZone,weather,settings,voice,topic,key};
 const available=()=>{
  const state=latest.current,element=state.root.current;
  return !!(element&&state.active&&document.visibilityState==='visible'&&!roomSleepNight(new Date(),state.timeZone)&&!competingSpeech(element));
 };
 useEffect(()=>{
  const check=()=>{
   const state=latest.current,element=state.root.current;
   if(!available()||!element){setReaction(undefined);return;}
   if(!state.topic||!state.voice?.ready)return;
   const present=SPEAKERS.filter(id=>state.characters[id]?.location===state.area&&actorAnchor(element,id));
   for(const speaker of [...present].sort((a,b)=>gate.current!.lastFor(a)-gate.current!.lastFor(b))){
    if(!gate.current!.claim(speaker,state.topic))continue;
    const activity=state.characters[speaker]?.activity;
    setReaction({area:state.area,speaker,anchor:actorAnchor(element,speaker)!,key:state.key,activity,
     context:weatherReactionPrompt({...state,place:manaversePlaces[state.area],activity,present:present.filter(id=>id!==speaker).map(nameOf),topic:state.topic})+`\nObservation time: ${Date.now()}`});
    break;
   }
  };
  const timer=window.setInterval(check,15_000);
  const hide=()=>{if(document.visibilityState!=='visible')setReaction(undefined);};
  document.addEventListener('visibilitychange',hide);
  return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',hide);};
 },[]);
 const eligible=reaction&&available()&&reaction.key===key&&reaction.anchor.isConnected&&characters[reaction.speaker]?.location===area&&characters[reaction.speaker]?.activity===reaction.activity&&actorAnchor(root.current!,reaction.speaker)===reaction.anchor;
 const line=useSceneLine(eligible?reaction.context:undefined,reaction?.speaker);
 if(!eligible||!line)return null;
 return createPortal(<p className="manaverse-player-greeting scene-weather-line" role="status">{line}</p>,reaction.anchor);
}
