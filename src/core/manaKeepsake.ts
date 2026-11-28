import {townCharacterName} from './townCharacters';
import type {RecordedEvent} from './events';
import {phoneMessage,type RoomContact} from './roomPhone';

const captions={
 water:'A little care helps something grow.',
 read:'One more page, then one more.',
 play:'There was time to play today.',
 sleep:'A quiet corner for a little rest.',
 think:'An idea worth coming back to.',
 window:'The view made me pause for a while.',
};
type KeepsakeSpot=keyof typeof captions;
const isSpot=(value:unknown):value is KeepsakeSpot=>
 typeof value==='string'&&Object.prototype.hasOwnProperty.call(captions,value);

export type ManaKeepsake={moment:string;caption:string;pinned:boolean;spot?:KeepsakeSpot;revisited?:true;
 shared?:{contact:RoomContact;place:'park'|'visit';answered?:true}};

export function chooseManaKeepsake(events:readonly RecordedEvent[],random=Math.random(),kind?:'solo'|'shared'):ManaKeepsake|undefined{
 const recent=events.flatMap((event):{event:RecordedEvent;keepsake:ManaKeepsake}[]=>{
  if(event.kind!=='activity'||!event.id.startsWith('room-'))return [];
  const moment=event.outcome.slice(0,300);
  const park=event.id.endsWith('-park-meetup');
  const visit=event.id.endsWith('-host-visit');
  const name=(park?/^Mana and (Luna|Lyra) /:visit?/^Mana visited (Luna|Lyra) /:/$^/).exec(moment)?.[1];
  if(name&&kind!=='solo'){
   const contact=name==='Luna'?'luna':'lyra';
   return [{event,keepsake:{moment,caption:'',pinned:false,shared:{contact,place:park?'park':'visit'}}}];
  }
  const spot=event.id.slice(event.id.lastIndexOf('-')+1);
  return kind!=='shared'&&isSpot(spot)&&!moment.includes('living space')&&!moment.includes('by the beanbag')
   ?[{event,keepsake:{moment,caption:captions[spot],spot,pinned:false}}]:[];
 }).sort((a,b)=>Date.parse(b.event.recordedAt)-Date.parse(a.event.recordedAt)).slice(0,8);
 if(!recent.length)return;
 return recent[Math.floor(random*recent.length)].keepsake;
}

export function sharedKeepsakeExchange(shared:NonNullable<ManaKeepsake['shared']>,moment:string,at=new Date().toISOString()){
 const name=townCharacterName(shared.contact);
 const place=shared.place==='park'?'our time at the pond':'my visit to your place';
 const detail=shared.place==='park'
  ?moment.includes('sketched')?'sketching the ripples on the pond'
   :moment.includes('read together')?'sharing a quiet chapter by the pond'
    :moment.includes('watched the stars')?'seeing the first stars from the park':'our quiet time at the park'
  :shared.contact==='luna'?'having time to swap little stories':'getting to share my favorite corner of the library';
 return {
  messages:[
   {...phoneMessage(shared.contact,'keepsake-question',at),detail:`The keepsake is about ${place}.`},
   {...phoneMessage(shared.contact,'keepsake-reply',at),detail:`The shared memory is ${detail}.`},
  ],
  caption:`With ${name}, I want to remember ${detail}.`,
 };
}

export function validateManaKeepsake(value:unknown):ManaKeepsake|undefined{
 if(!value||typeof value!=='object'||!('moment' in value)||!('caption' in value)||!('pinned' in value))return;
 const {moment,caption,pinned}=value;
 if(typeof moment!=='string'||!moment.trim()||typeof caption!=='string'||typeof pinned!=='boolean')return;
 const shared='shared' in value?value.shared:undefined;
 if(shared&&typeof shared==='object'&&'contact' in shared&&'place' in shared&&
  (shared.contact==='luna'||shared.contact==='lyra')&&(shared.place==='park'||shared.place==='visit')){
  const answered='answered' in shared&&shared.answered===true;
  if((answered||pinned)&&(!answered||!caption.trim()))return;
  return {moment:moment.slice(0,300),caption:caption.slice(0,100),pinned,
   shared:{contact:shared.contact,place:shared.place,...(answered?{answered:true}:{})}};
 }
 if(!caption.trim())return;
 const spot='spot' in value&&isSpot(value.spot)?value.spot:undefined;
 return {moment:moment.slice(0,300),caption:caption.slice(0,100),pinned,
  ...(spot?{spot}:{}),...('revisited' in value&&value.revisited===true?{revisited:true}:{})};
}
