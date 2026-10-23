import type {AvatarConfig,SavedLook} from './avatar';
import type {Wardrobe} from './wardrobe';
import {seasonalAssignments} from './seasonalLooks';
export type OutfitPeriod='morning'|'night';
export interface OutfitRoutine{enabled:boolean;morning:string;night:string;pools:Record<OutfitPeriod,SavedLook[]>;last?:{period:string;at:string;look:string}}
const time=(v:unknown):v is string=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const lookKey=(look:Pick<SavedLook,'skin'|'outfit'|'hairstyle'|'accessories'>)=>JSON.stringify([look.skin,look.outfit,look.hairstyle,[...look.accessories].sort()]);
export function validateOutfitRoutine(value:unknown):OutfitRoutine{
 const v=value as OutfitRoutine;const result:OutfitRoutine={enabled:v?.enabled===true,morning:'08:00',night:'20:00',pools:{morning:[],night:[]}};
 if(time(v?.morning)&&time(v?.night)&&v.morning<v.night){result.morning=v.morning;result.night=v.night;}
 for(const slot of ['morning','night'] as const){const seen=new Set<string>();for(const candidate of Array.isArray(v?.pools?.[slot])?v.pools[slot].slice(0,20):[]){const look=seasonalAssignments({spring:candidate}).spring;if(!look)continue;const key=lookKey(look);if(!seen.has(key)){seen.add(key);result.pools[slot].push(look);}}}
 if(v?.last&&/^\d{4}-\d{2}-\d{2}:(morning|night)$/.test(v.last.period)&&typeof v.last.at==='string'&&Number.isFinite(Date.parse(v.last.at))&&typeof v.last.look==='string'&&v.last.look.length<=60)result.last={period:v.last.period,at:v.last.at,look:v.last.look};return result;
}
export function outfitPeriod(now:Date,timeZone:string,routine:OutfitRoutine):{id:string;slot:OutfitPeriod}{
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now),get=(key:string)=>parts.find(p=>p.type===key)!.value;
 let date=get('year')+'-'+get('month')+'-'+get('day');const clock=get('hour')+':'+get('minute');const slot:OutfitPeriod=clock>=routine.morning&&clock<routine.night?'morning':'night';if(clock<routine.morning){const previous=new Date(date+'T12:00:00Z');previous.setUTCDate(previous.getUTCDate()-1);date=previous.toISOString().slice(0,10);}return {id:date+':'+slot,slot};
}
export function eligibleRoutineLook(look:SavedLook,data:Wardrobe){return data.skins.some(e=>e.name===look.skin&&e.unlocked)&&data.outfits.some(e=>e.name===look.outfit&&e.unlocked)&&data.hairs.some(e=>e.name===look.hairstyle&&e.unlocked)&&look.accessories.every(name=>data.accessories.some(e=>e.name===name&&e.unlocked));}
export function chooseDailyOutfit(cfg:AvatarConfig,data:Wardrobe,now:Date,timeZone:string,random:()=>number=Math.random):AvatarConfig|undefined{
 const routine=validateOutfitRoutine(cfg.outfitRoutine);if(!routine.enabled||!Number.isFinite(now.getTime())||routine.last&&Date.parse(routine.last.at)>now.getTime())return;
 let period;try{period=outfitPeriod(now,timeZone,routine);}catch{return;}
 if(routine.last?.period===period.id)return;
 const eligible=routine.pools[period.slot].filter(look=>eligibleRoutineLook(look,data));if(!eligible.length)return;
 const alternatives=eligible.filter(look=>lookKey(look)!==lookKey(cfg)),pool=alternatives.length?alternatives:eligible,r=Math.max(0,Math.min(.999999,Number(random())||0)),look=pool[Math.floor(r*pool.length)];
 return {...cfg,skin:look.skin,outfit:look.outfit,hairstyle:look.hairstyle,accessories:[...look.accessories],outfitRoutine:{...routine,last:{period:period.id,at:now.toISOString(),look:look.name}}};
}
