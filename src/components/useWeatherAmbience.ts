import {useEffect,useRef,useState} from 'react';
import {createWeatherAmbience} from '../core/weatherAmbience';
import type {TownWeather,TownWeatherSettings} from '../core/townWeather';

export type WeatherAudioStatus='ready'|'playing'|'muted'|'unavailable';
export function useWeatherAmbience(weather:TownWeather,settings:TownWeatherSettings,active:boolean,indoors:boolean){
 const [status,setStatus]=useState<WeatherAudioStatus>('ready');
 const engine=useRef<ReturnType<typeof createWeatherAmbience>|undefined>(undefined);
 const latest=useRef({weather,settings,active,indoors});latest.current={weather,settings,active,indoors};
 const mounted=useRef(true);
 const starting=useRef(false);
 async function enable(){
  const current=latest.current;
  if(starting.current||!mounted.current||!current.active||document.visibilityState!=='visible'||current.settings.audio===false||(current.settings.volume??.25)===0)return;
  starting.current=true;
  try{
   if(!engine.current){
    if(typeof AudioContext==='undefined'){if(mounted.current)setStatus('unavailable');return;}
    engine.current=createWeatherAmbience(new AudioContext());
   }
   await engine.current.resume();
   const next=latest.current;
   if(!mounted.current)return;
   if(!next.active||document.visibilityState!=='visible'||next.settings.audio===false){await engine.current.suspend();return;}
   engine.current.update(next.weather,next.settings,next.indoors);setStatus('playing');
  }catch{if(mounted.current)setStatus('ready');}
  finally{starting.current=false;}
 }
 useEffect(()=>{
  mounted.current=true;
  const unlock=()=>{void enable();};
  document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
  const visibility=()=>{
   if(document.visibilityState!=='visible'){void engine.current?.suspend().catch(()=>{});}
   else if(engine.current)void enable();
  };
  document.addEventListener('visibilitychange',visibility);
  return ()=>{
   mounted.current=false;document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',visibility);
   const previous=engine.current;engine.current=undefined;void previous?.dispose().catch(()=>{});
  };
 },[]);
 useEffect(()=>{
  if(!active||document.visibilityState!=='visible'){void engine.current?.suspend().catch(()=>{});return;}
  if(settings.audio===false||(settings.volume??.25)===0){engine.current?.update(weather,settings,indoors);setStatus('muted');return;}
  if(engine.current){engine.current.update(weather,settings,indoors);void enable();}
  else setStatus('ready');
 },[weather.kind,weather.intensity,settings.audio,settings.volume,active,indoors]);
 return {status,enable};
}
