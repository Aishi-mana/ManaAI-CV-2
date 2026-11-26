import {ROOM_ART} from '../core/companionRoom';
import {type StreetPoint} from '../core/manaverseStreet';

export default function OutdoorPetBot({point,facing}:{point:StreetPoint;facing:number}) {
 return <div className="manaverse-street-actor manaverse-pet-bot" style={{left:`${point.x}%`,top:`${point.y}%`,zIndex:Math.round(point.y)}}>
  <img src={ROOM_ART+'pet_bot.webp'} style={{scale:`${facing} 1`}} alt="Pet Bot following Mana" draggable={false}/>
 </div>;
}
