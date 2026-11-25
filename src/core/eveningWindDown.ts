import {journalClock} from './clock';
import {isRecord} from './validation';
import {residentProfiles,type ResidentId,type ResidentActivity} from './residentProfiles';
import type {TownCharacter} from './residentRelationships';

export type EveningWindDownDates=Partial<Record<TownCharacter,string>>;
export const EVENING_TIDY_MS=12_000;
export function eveningWindDown(now:Date,timeZone:string){
 const clock=journalClock(now,timeZone);
 return clock.time>='21:45'&&clock.time<'22:00'?clock.date:undefined;
}
export function validateEveningWindDown(value:unknown):EveningWindDownDates{
 const result:EveningWindDownDates={};if(!isRecord(value))return result;
 for(const owner of ['mana',...Object.keys(residentProfiles)] as TownCharacter[]){
  const key=value[owner];
  if(typeof key==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(key)&&Number.isFinite(Date.parse(key+'T12:00:00Z'))&&new Date(key+'T12:00:00Z').toISOString().slice(0,10)===key)result[owner]=key;
 }
 return result;
}
export function residentEveningActivity(owner:ResidentId,tidy:boolean):ResidentActivity{
 const profile=residentProfiles[owner];
 if(tidy)return {...profile.activities[1],shortPause:true,status:owner==='luna'?'Luna is putting away her sketchbook for the evening.':'Lyra is putting her bottles away for the evening.'};
 return {...profile.activities[owner==='luna'?2:0],shortPause:owner==='luna',status:owner==='luna'?'Luna is winding down quietly by the window.':'Lyra is reading quietly before bed.'};
}
export function eveningGoodnightPrompt(name:string,outcome:string){
 return `Quiet evening wind-down. Recorded action: ${outcome} You are ${name}, awake at home before bedtime. Give one short, gentle sentence about winding down, or a quiet goodnight. No question, promise, new plans, or invented finished work. Do not claim Aishi or another character is present, address an absent listener, or send a phone message. You have not gone to sleep yet.`;
}
