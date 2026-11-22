import {createContext,useContext,useMemo,useState,type ReactNode} from 'react';
import {SceneVoice} from './SceneVoice';
import {DEFAULT_TOWN_WEATHER,TOWN_WEATHER_KINDS,townWeather,townWeatherContext,weatherNeedsShelter,townWeatherLabel,type TownWeather,type TownWeatherSettings} from '../core/townWeather';
import {SEASONS,SEASON_LABELS,type Season} from '../core/seasonalLooks';
import {useWeatherAmbience,type WeatherAudioStatus} from './useWeatherAmbience';

const WeatherContext=createContext<{weather:TownWeather;settings:TownWeatherSettings;onChange:(settings:TownWeatherSettings)=>void;audioStatus:WeatherAudioStatus;enableAudio:()=>Promise<void>}>({weather:townWeather({date:'2000-01-01',time:'00:00'},{...DEFAULT_TOWN_WEATHER,mode:'clear'}),settings:DEFAULT_TOWN_WEATHER,onChange(){},audioStatus:'ready',enableAudio:async()=>{}});
export const useTownWeather=()=>useContext(WeatherContext);
export function TownWeatherProvider({weather,settings,onChange,children,active=true,indoors=false}:{weather:TownWeather;settings:TownWeatherSettings;onChange:(settings:TownWeatherSettings)=>void;children:ReactNode;active?:boolean;indoors?:boolean}){
 const voice=useContext(SceneVoice);
 const [preview,setPreview]=useState<Season>();
 const changeSettings=(next:TownWeatherSettings)=>{
  const {sceneryPreview,...saved}=next;
  setPreview(sceneryPreview);
  onChange(saved);
 };
 const audio=useWeatherAmbience(weather,settings,active,indoors);
 const contextualVoice=useMemo(()=>voice?{...voice,speak:(context:string,signal:AbortSignal,speaker:Parameters<typeof voice.speak>[2])=>voice.speak(`${townWeatherContext(weather)}\n${context}`,signal,speaker)}:null,[voice,weather.kind,weather.intensity]);
 return <WeatherContext.Provider value={{weather,settings:{...settings,sceneryPreview:preview},onChange:changeSettings,audioStatus:audio.status,enableAudio:audio.enable}}><SceneVoice.Provider value={contextualVoice}>{children}</SceneVoice.Provider></WeatherContext.Provider>;
}
export default function TownWeatherControls(){
 const {weather,settings,onChange,audioStatus,enableAudio}=useTownWeather();
 return <section className="town-weather-controls" aria-label="Town weather">
  <h3>{townWeatherLabel(weather)}</h3>
  <p>{weatherNeedsShelter(weather)?'Everyone favors indoor shelter until the weather passes. Outdoor meetups pause; characters walk through the usual exits.':weather.kind==='snow'?'Light flurries leave room for outdoor activities and town celebrations.':'Outdoor activities follow the usual town schedule.'}</p>
  <label>Weather<select value={settings.mode} onChange={event=>onChange({...settings,mode:event.target.value as TownWeatherSettings['mode']})}>
   <option value="automatic">Automatic · seasonal</option><option value="clear">Clear skies</option><option value="rain">Rain</option><option value="snow">Snow</option><option value="fog">Fog</option><option value="breeze">Breeze</option></select></label>
  <label>Intensity<select value={settings.intensity} onChange={event=>onChange({...settings,intensity:event.target.value as TownWeatherSettings['intensity']})}><option value="gentle">Gentle</option><option value="steady">Steady</option></select></label>
  <label>Town seasons<select value={settings.calendar??'north'} onChange={event=>onChange({...settings,calendar:event.target.value==='south'?'south':'north'})}><option value="north">Winter: December–February</option><option value="south">Winter: June–August</option></select></label>
  <p>Current town season: {SEASON_LABELS[weather.season]}. Automatic weather varies by season; snow occurs only in winter.</p>
  <label><input type="checkbox" checked={settings.effects} onChange={event=>onChange({...settings,effects:event.target.checked})}/>Show weather effects</label>
  <label><input type="checkbox" checked={settings.scenery!==false} onChange={event=>onChange({...settings,scenery:event.target.checked})}/>Seasonal scenery</label>
  <label>Scenery preview (temporary)<select aria-label="Scenery preview" value={settings.sceneryPreview??'automatic'} onChange={event=>onChange({...settings,sceneryPreview:SEASONS.find(season=>season===event.target.value)})}>
   <option value="automatic">Automatic</option>{SEASONS.map(season=><option key={season} value={season}>{SEASON_LABELS[season]}</option>)}
  </select></label>
  <p>Preview changes scenery only. Choose Automatic to return to normal; reopening the app also clears the preview.{settings.scenery===false?' Turn on Seasonal scenery to see it.':''}</p>
  <p>Spring adds pastel flowers to planted borders; summer brings golden and coral daisies. Autumn warms foliage and adds fallen leaves along the edges. Winter adds snow caps, even on clear days. The Snow override also previews winter scenery.</p>
  <fieldset><legend>Ambient sound</legend>
   <label><input type="checkbox" checked={settings.audio!==false} onChange={event=>onChange({...settings,audio:event.target.checked})}/>Weather sounds</label>
   <label>Volume<input type="range" min="0" max="100" step="1" aria-label="Weather ambience volume" value={Math.round((settings.volume??.25)*100)} onChange={event=>onChange({...settings,volume:Number(event.target.value)/100})}/><output>{Math.round((settings.volume??.25)*100)}%</output></label>
   {audioStatus==='ready'&&settings.audio!==false&&(settings.volume??.25)>0&&<button type="button" className="btn" onClick={()=>void enableAudio()}>Enable ambience</button>}
   {audioStatus==='unavailable'&&<p>Ambient sound is unavailable in this view.</p>}
   <p>Soft rain and wind are generated locally. Clear skies and fog stay quiet. Sound softens indoors and pauses when this view is hidden.</p>
  </fieldset>
  <p>Automatic weather follows the town calendar in three-hour blocks. {settings.mode==='automatic'?`Next weather check: ${weather.nextChange}.`:'Your manual choice stays in effect until you change it.'}</p>
  <p>Turning effects off keeps weather behavior. Reduced-motion settings use still weather effects.</p>
 </section>;
}
export function TownWeatherArtwork({weather}:{weather:TownWeather}){
 if(weather.kind==='clear'||!weather.effects)return null;
 if(weather.kind==='fog')return <div className="town-fog" data-intensity={weather.intensity} aria-hidden="true"><div className="town-fog-bank town-fog-far"/><div className="town-fog-bank town-fog-near"/></div>;
 if(weather.kind==='breeze')return <div className="town-breeze" data-intensity={weather.intensity} data-season={weather.season} aria-hidden="true">
  {Array.from({length:9},(_,index)=><span key={index} className="town-wind-leaf" style={{top:`${12+index*9}%`,animationDelay:`${-index*2.1}s`,animationDuration:`${13+index%4*2}s`}}/>)}</div>;
 if(weather.kind==='snow')return <div className="town-snow" data-intensity={weather.intensity} aria-hidden="true"><div className="town-snow-veil"/><div className="town-snow-flakes town-snow-far"/><div className="town-snow-flakes town-snow-near"/></div>;
 return <div className="town-rain" data-intensity={weather.intensity} aria-hidden="true"><div className="town-rain-streaks"/><div className="town-rain-splashes"/></div>;
}
export function TownWeatherEffects(){
 const {weather}=useTownWeather();
 return <div className="town-weather-layers" aria-hidden="true">{TOWN_WEATHER_KINDS.filter(kind=>kind!=='clear').map(kind=>
  <div key={kind} className="town-weather-layer" data-kind={kind} data-active={weather.effects&&weather.kind===kind}>
   <TownWeatherArtwork weather={{...weather,kind,effects:true}}/>
  </div>)}</div>;
}
