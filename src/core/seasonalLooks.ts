import type {AvatarConfig,SavedLook} from './avatar';
export const SEASONS=['spring','summer','autumn','winter'] as const;
export type Season=typeof SEASONS[number];
export type SeasonCalendar='north'|'south';
export const SEASON_LABELS:Record<Season,string>={spring:'Spring',summer:'Summer',autumn:'Autumn',winter:'Winter'};
export function seasonalAssignments(value:unknown):Partial<Record<Season,SavedLook>>{
 const result:Partial<Record<Season,SavedLook>>={};if(!value||typeof value!=='object')return result;
 for(const season of SEASONS){const v=(value as Record<string,unknown>)[season] as SavedLook;if(!v||typeof v!=='object'||typeof v.name!=='string'||!v.name.trim()||v.name.trim().length>60||![v.skin,v.hairstyle,v.outfit].every(x=>typeof x==='string'&&x.trim()&&x.length<=200)||!Array.isArray(v.accessories)||v.accessories.length>30||v.accessories.some(x=>typeof x!=='string'||!x.trim()||x.length>200))continue;result[season]={name:v.name.trim(),skin:v.skin,hairstyle:v.hairstyle,outfit:v.outfit,accessories:[...new Set(v.accessories)]};}return result;
}
export function seasonForDate(now:Date,calendar:SeasonCalendar,timeZone?:string):Season{
 let month:number;try{month=Number(new Intl.DateTimeFormat('en-US',{timeZone,month:'numeric'}).format(now));}catch{month=now.getUTCMonth()+1;}
 if(calendar==='south')month=(month+5)%12+1;
 return month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
}
export function seasonMonths(season:Season,calendar:SeasonCalendar):string{const north={spring:'March–May',summer:'June–August',autumn:'September–November',winter:'December–February'},south={spring:north.autumn,summer:north.winter,autumn:north.spring,winter:north.summer};return (calendar==='south'?south:north)[season];}
export function currentSeasonLook(cfg:AvatarConfig,season:Season):SavedLook{return {name:SEASON_LABELS[season]+' look',skin:cfg.skin,outfit:cfg.outfit,hairstyle:cfg.hairstyle,accessories:[...cfg.accessories]};}
