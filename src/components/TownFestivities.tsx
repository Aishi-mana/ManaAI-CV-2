import {activeDecorationObjects,townFestivities,townFestivityContext,type TownDecorationSettings} from '../core/townFestivities';
import type {TownEventCalendar} from '../core/townEvents';
import {useSceneLine} from './SceneVoice';
import type {StreetCharacter,StreetPoint} from '../core/manaverseStreet';
import TownDecorationObjects from './TownDecorationObjects';

export default function TownFestivities({events,reaction,settings,date}:{events:TownEventCalendar['active'];reaction?:{speaker:StreetCharacter;point:StreetPoint};settings?:TownDecorationSettings;date?:string}){
 const theme=townFestivities(events,settings,date);
 const line=useSceneLine(theme.active&&reaction?`You are standing in Town Square. ${townFestivityContext(events,settings,date)} Give one short spontaneous reaction to what you see.`:undefined,reaction?.speaker??'mana');
 if(!theme.active)return null;
 const objects=activeDecorationObjects(events,settings,date);
 return <>
  <div className="town-festive-dressing" data-christmas={theme.christmas} data-new-year={theme.newYear} aria-hidden="true">
   <TownDecorationObjects objects={objects}/>
  </div>
  {reaction&&line&&<p className="manaverse-street-speech scene-festival-line" role="status"
   style={{left:`${Math.max(15,Math.min(85,reaction.point.x))}%`,top:`${reaction.point.y-18}%`}}>{line}</p>}
 </>;
}
