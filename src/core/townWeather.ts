import type {ManaverseArea} from '../components/ManaverseMap';
import {seasonForDate,type Season,type SeasonCalendar} from './seasonalLooks';

export const TOWN_WEATHER_KINDS=['clear','rain','snow','fog','breeze'] as const;
export type TownWeatherKind=typeof TOWN_WEATHER_KINDS[number];
// sceneryPreview is session-only UI state; validation deliberately never restores it.
export type TownWeatherSettings={mode:'automatic'|TownWeatherKind;intensity:'gentle'|'steady';effects:boolean;calendar?:SeasonCalendar;audio?:boolean;volume?:number;scenery?:boolean;sceneryPreview?:Season};
export const DEFAULT_TOWN_WEATHER:TownWeatherSettings={mode:'automatic',intensity:'gentle',effects:true,calendar:'north',audio:true,volume:.25,scenery:true};
export const SEASONAL_WEATHER_CHANCES:Record<Season,{rain:number;snow:number;fog:number;breeze:number}>={
 spring:{rain:35,snow:0,fog:10,breeze:20},summer:{rain:20,snow:0,fog:5,breeze:25},
 autumn:{rain:30,snow:0,fog:20,breeze:25},winter:{rain:10,snow:45,fog:15,breeze:10},
};
export function validateTownWeather(value:unknown):TownWeatherSettings{
 const raw=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const mode=TOWN_WEATHER_KINDS.find(kind=>kind===raw.mode)??'automatic';
 return {mode,intensity:raw.intensity==='steady'?'steady':'gentle',effects:raw.effects!==false,calendar:raw.calendar==='south'?'south':'north',audio:raw.audio!==false,scenery:raw.scenery!==false,
  volume:typeof raw.volume==='number'&&Number.isFinite(raw.volume)?Math.max(0,Math.min(1,raw.volume)):.25};
}
export function townWeather(clock:{date:string;time:string},settings=DEFAULT_TOWN_WEATHER){
 const hour=Number(clock.time.slice(0,2));
 const block=Number.isFinite(hour)?Math.floor(hour/3):0;
 const key=`${clock.date}:${block}`;
 let hash=2166136261;
 for(const character of key)hash=Math.imul(hash^character.charCodeAt(0),16777619);
 const season=seasonForDate(new Date(`${clock.date}T12:00:00Z`),settings.calendar??'north','UTC');
 const chance=SEASONAL_WEATHER_CHANCES[season],roll=(hash>>>0)%100;
 const automatic:TownWeatherKind=roll<chance.snow?'snow':roll<chance.snow+chance.rain?'rain':
  roll<chance.snow+chance.rain+chance.fog?'fog':roll<chance.snow+chance.rain+chance.fog+chance.breeze?'breeze':'clear';
 const kind:TownWeatherKind=settings.mode==='automatic'?automatic:settings.mode;
 return {kind,season,intensity:settings.intensity,effects:settings.effects,
  key:settings.mode==='automatic'?key:settings.mode,nextChange:`${String((block+1)*3%24).padStart(2,'0')}:00`};
}
export type TownWeather=ReturnType<typeof townWeather>;
export function weatherNeedsShelter(weather:Pick<TownWeather,'kind'|'intensity'>){
 return weather.kind==='rain'||weather.kind==='snow'&&weather.intensity==='steady';
}
export function townWeatherLabel(weather:Pick<TownWeather,'kind'|'intensity'>){
 if(weather.kind==='fog')return weather.intensity==='gentle'?'Light mist':'Drifting fog';
 if(weather.kind==='breeze')return weather.intensity==='gentle'?'Gentle breeze':'Breezy';
 return weather.kind==='clear'?'Clear skies':`${weather.intensity==='gentle'?'Gentle':'Steady'} ${weather.kind}`;
}
export function isOutdoorMap(area:ManaverseArea){return area==='street'||area==='square'||area==='district'||area==='park';}
export function weatherShelterDestination(target:ManaverseArea,current:ManaverseArea,sheltering:boolean,petAlong=false):ManaverseArea{
 if(!sheltering)return target;
 if(petAlong&&target!=='bedroom')return 'living';
 if(!isOutdoorMap(target))return target;
 if(current==='square')return 'town-hall';
 if(current==='district')return 'cafe';
 if(current==='street'||current==='park')return 'living';
 return current;
}
export const rainShelterDestination=weatherShelterDestination;
export function townWeatherContext(weather:TownWeather){
 if(weather.kind==='fog')return 'Mist is drifting outside in Manaverse. Paths and doors remain visible and outdoor activities can continue. Indoors is sheltered. Do not claim anyone is lost, has arrived, or completed an activity without evidence.';
 if(weather.kind==='breeze')return 'A breeze is moving a few leaves outside in Manaverse. Outdoor activities can continue. Indoors is sheltered. Do not invent damage, cold, or completed activities without evidence.';
 if(weather.kind==='snow')return weatherNeedsShelter(weather)?
  'Steady snow is falling outside in Manaverse. Characters favor indoor shelter and walk there through normal doors. Indoors is sheltered; do not claim anyone has arrived, is cold, or completed an activity without evidence.':
  'Gentle snow is drifting outside in Manaverse. Outdoor activities and town celebrations can continue in these light flurries. Indoors is sheltered. Do not invent snowball fights, snowmen, feeling cold, or completed activities without evidence.';
 return weather.kind==='rain'?'It is raining outside in Manaverse. Characters favor indoor shelter and walk there through normal doors. Indoors is sheltered; do not claim anyone is wet, has arrived, or has completed an activity without evidence.':
  'The weather outside in Manaverse is clear.';
}
