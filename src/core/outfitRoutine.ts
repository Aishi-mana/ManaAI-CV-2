import type {AvatarConfig,SavedLook} from './avatar';
import type {Wardrobe} from './wardrobe';
import {seasonalAssignments} from './seasonalLooks';
export type OutfitPeriod='morning'|'night';
export interface DailyChoices{outfits:string[];hairstyles:string[];accessories:string[]}
export interface PreferredSet{outfit:string;hairstyle?:string;accessory?:string}
export interface OutfitRoutine{enabled:boolean;morning:string;night:string;pools:Record<OutfitPeriod,SavedLook[]>;choices?:Partial<Record<OutfitPeriod,DailyChoices>>;preferredSets?:PreferredSet[];preferredLookNames?:string[];last?:{period:string;at:string;look:string}}
const time=(v:unknown):v is string=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const lookKey=(look:Pick<SavedLook,'skin'|'outfit'|'hairstyle'|'backHairstyle'|'accessories'>)=>JSON.stringify([look.skin,look.outfit,look.hairstyle,look.backHairstyle??look.hairstyle,[...look.accessories].sort()]);
export function validateOutfitRoutine(value:unknown):OutfitRoutine{
 const v=value as OutfitRoutine;const result:OutfitRoutine={enabled:v?.enabled===true,morning:'08:00',night:'20:00',pools:{morning:[],night:[]}};
 if(time(v?.morning)&&time(v?.night)&&v.morning<v.night){result.morning=v.morning;result.night=v.night;}
 for(const slot of ['morning','night'] as const){const seen=new Set<string>();for(const candidate of Array.isArray(v?.pools?.[slot])?v.pools[slot].slice(0,20):[]){const look=seasonalAssignments({spring:candidate}).spring;if(!look)continue;const key=lookKey(look);if(!seen.has(key)){seen.add(key);result.pools[slot].push(look);}}}
 const ids=(items:unknown)=>Array.isArray(items)?Array.from(new Set(items.slice(0,100).filter((id):id is string=>typeof id==='string'&&!!id.trim()&&id.length<=200))):[];
 result.choices={};
 for(const slot of ['morning','night'] as const){
  const choices=v?.choices?.[slot],looks=result.pools[slot];
  result.choices[slot]={
   outfits:ids(choices?.outfits??looks.map(look=>look.outfit)),
   hairstyles:ids(choices?.hairstyles??looks.map(look=>look.hairstyle)),
   accessories:ids(choices?.accessories??looks.flatMap(look=>look.accessories)),
  };
 }
 const validId=(id:unknown):id is string=>typeof id==='string'&&!!id.trim()&&id.length<=200;
 if(Array.isArray(v?.preferredLookNames)){
  result.preferredLookNames=ids(v.preferredLookNames).filter(name=>name.length<=60).slice(0,30);
 }else if(Array.isArray(v?.preferredSets)){
  const sets:PreferredSet[]=[];
  for(const set of v.preferredSets.slice(0,60)){
   if(!set||!validId(set.outfit))continue;
   const hairstyle=validId(set.hairstyle)?set.hairstyle:undefined;
   const accessory=validId(set.accessory)?set.accessory:undefined;
   if((hairstyle||accessory)&&!sets.some(item=>item.outfit===set.outfit&&item.hairstyle===hairstyle&&item.accessory===accessory)){
    sets.push({outfit:set.outfit,hairstyle,accessory});
   }
  }
  result.preferredSets=sets;
 }
 if(v?.last&&/^\d{4}-\d{2}-\d{2}:(morning|night)$/.test(v.last.period)&&typeof v.last.at==='string'&&Number.isFinite(Date.parse(v.last.at))&&typeof v.last.look==='string'&&v.last.look.length<=60)result.last={period:v.last.period,at:v.last.at,look:v.last.look};return result;
}
export function preferredLookNames(looks:SavedLook[],routine:OutfitRoutine):string[]{
 if(routine.preferredLookNames)return routine.preferredLookNames.filter(name=>looks.some(look=>look.name===name));
 const matches=new Set<string>();
 for(const set of routine.preferredSets??[]){
  const candidates=looks.filter(look=>look.outfit===set.outfit&&
   (!set.hairstyle||look.hairstyle===set.hairstyle)&&(!set.accessory||look.accessories.includes(set.accessory)));
  if(candidates.length===1)matches.add(candidates[0].name);
 }
 return Array.from(matches);
}
export function outfitPeriod(now:Date,timeZone:string,routine:OutfitRoutine):{id:string;slot:OutfitPeriod}{
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now),get=(key:string)=>parts.find(p=>p.type===key)!.value;
 let date=get('year')+'-'+get('month')+'-'+get('day');const clock=get('hour')+':'+get('minute');const slot:OutfitPeriod=clock>=routine.morning&&clock<routine.night?'morning':'night';if(clock<routine.morning){const previous=new Date(date+'T12:00:00Z');previous.setUTCDate(previous.getUTCDate()-1);date=previous.toISOString().slice(0,10);}return {id:date+':'+slot,slot};
}
export function chooseDailyOutfit(cfg:AvatarConfig,data:Wardrobe,now:Date,timeZone:string,random:()=>number=Math.random):AvatarConfig|undefined{
 const routine=validateOutfitRoutine(cfg.outfitRoutine);if(!routine.enabled||!Number.isFinite(now.getTime())||routine.last&&Date.parse(routine.last.at)>now.getTime())return;
 let period;try{period=outfitPeriod(now,timeZone,routine);}catch{return;}
 if(routine.last?.period===period.id)return;
 const choices=routine.choices?.[period.slot];
 if(!choices)return;
 const approved=(ids:string[],items:Wardrobe['outfits'])=>ids.filter(id=>items.some(item=>item.name===id&&item.unlocked));
 const roll=()=>Math.max(0,Math.min(.999999,Number(random())||0));
 const pick=(eligible:string[],isCurrent:(id:string)=>boolean)=>{
  const alternatives=eligible.filter(id=>!isCurrent(id));
  const pool=alternatives.length?alternatives:eligible;
  if(pool.length<=1)return pool[0];
  return pool[Math.floor(roll()*pool.length)];
 };
 const outfit=pick(approved(choices.outfits,data.outfits),id=>id===cfg.outfit);
 const hairstyles=approved(choices.hairstyles,data.hairs);
 const accessories=approved(choices.accessories,data.accessories);
 const looks=cfg.looks??[];
 const preferredNames=preferredLookNames(looks,routine);
 const matches=looks.filter(look=>look.outfit===outfit&&preferredNames.includes(look.name)&&
  data.skins.some(item=>item.name===look.skin&&item.unlocked)&&hairstyles.includes(look.hairstyle)&&
  (!look.backHairstyle||hairstyles.includes(look.backHairstyle)&&data.hairs.some(item=>item.name===look.backHairstyle&&item.hasBackHair!==false))&&
  look.accessories.every(id=>accessories.includes(id)));
 const preferred=matches.length>0&&roll()<.65
  ? matches[matches.length===1?0:Math.floor(roll()*matches.length)]
  : undefined;
 if(preferred)return {...cfg,skin:preferred.skin,outfit:preferred.outfit,hairstyle:preferred.hairstyle,
  backHairstyle:preferred.backHairstyle,accessories:[...preferred.accessories],
  outfitRoutine:{...routine,last:{period:period.id,at:now.toISOString(),look:preferred.name}}};
 const hair=pick(hairstyles,id=>id===cfg.hairstyle);
 const accessory=pick(accessories,id=>cfg.accessories.includes(id));
 if(!outfit&&!hair&&!accessory)return;
 const label=(list:Wardrobe['outfits'],id:string,alias?:string)=>alias??list.find(item=>item.name===id)?.label??id;
 const lookLabel=[
  outfit&&label(data.outfits,outfit,cfg.outfitNames?.[outfit]),
  hair&&label(data.hairs,hair,cfg.itemNames?.['hair:'+hair]),
  accessory&&label(data.accessories,accessory,cfg.itemNames?.['accessories:'+accessory]),
 ].filter(Boolean).join(' · ').slice(0,60);
 return {...cfg,outfit:outfit??cfg.outfit,...(hair?{hairstyle:hair,backHairstyle:undefined}:{}),
  accessories:accessory?[accessory]:cfg.accessories,outfitRoutine:{...routine,last:{period:period.id,at:now.toISOString(),look:lookLabel}}};
}
