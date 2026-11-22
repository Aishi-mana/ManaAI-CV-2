import {townTodayCards,type TownTodayState} from '../core/townToday';
import type {PhoneMessage} from '../core/roomPhone';
import {manaversePlaces,type ManaverseArea} from './ManaverseMap';

export default function TownToday({state,pendingVisit,hostVisit,timeZone,now,onView}:{
 state:TownTodayState;pendingVisit?:PhoneMessage;hostVisit?:PhoneMessage&{confirmed:boolean};
 timeZone:string;now:number;onView:(area:ManaverseArea)=>void;
}){
 const cards=townTodayCards(state,pendingVisit,hostVisit,timeZone,new Date(now));
 return <div className="room-phone-list room-phone-plans town-today">
  {cards.length?cards.map(card=><article key={card.id}>
   <strong>{card.title}</strong>
   <p>{card.detail}</p>
   <button type="button" className="btn" onClick={()=>onView(card.area)}>View {manaversePlaces[card.area]}</button>
  </article>):<p>No gatherings, invitations, or personal goals right now.</p>}
 </div>;
}
