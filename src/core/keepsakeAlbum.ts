import {activityKeepsakeNames,homeDisplayKeepsakes,recordActivityKeepsake,type ActivityKeepsake} from './activityKeepsakes';
import type {TownPersonalGoal} from './townPersonalGoals';
import type {TownGuestbookVisit} from './townGuestbook';
import type {SharedMemory} from './residentRelationships';
import type {RecordedEvent} from './events';
import {townSketchbookDays} from './townSketchbook';
import {journalClock} from './clock';

export type KeepsakeAlbumEntry=ActivityKeepsake&{category:'birthday'|'project'|'activity'};
export function keepsakeAlbumEntries(history:ActivityKeepsake[],goals:TownPersonalGoal[],birthdays:TownGuestbookVisit[],events:RecordedEvent[],memories:SharedMemory[],timeZone:string,now=Date.now()):KeepsakeAlbumEntry[]{
 const entries=new Map<string,KeepsakeAlbumEntry>();
 const add=(keepsake:ActivityKeepsake)=>{
  if(!keepsake.birthday&&(!Number.isFinite(Date.parse(keepsake.at))||Date.parse(keepsake.at)>now))return;
  const category=keepsake.birthday?'birthday':keepsake.project?'project':'activity';
  const day=keepsake.birthday?.date??journalClock(new Date(keepsake.at),timeZone).date;
  const key=category==='activity'?`${keepsake.owner}:${keepsake.kind}:${day}:${keepsake.moment}`:keepsake.id;
  if(!entries.has(key))entries.set(key,{...keepsake,category});
 };
 for(const goal of goals)for(const keepsake of homeDisplayKeepsakes([],[goal],now,[],timeZone))add(keepsake);
 for(const birthday of birthdays)for(const keepsake of homeDisplayKeepsakes([],[],now,[birthday],timeZone))add(keepsake);
 for(const keepsake of history)add(keepsake);
 for(const day of townSketchbookDays(events,memories,timeZone,now))for(const moment of day.moments){
  const action=moment.kind==='sketch'?'aishi-sketch':moment.kind==='read'?'aishi-read':moment.kind==='tinker'?'workshop-tinkering':undefined;
  if(action)for(const keepsake of recordActivityKeepsake([],moment.id,action,moment.text,moment.people,new Date(moment.at)))add(keepsake);
 }
 return [...entries.values()].sort((a,b)=>(b.birthday?.date??journalClock(new Date(b.at),timeZone).date).localeCompare(a.birthday?.date??journalClock(new Date(a.at),timeZone).date)||b.at.localeCompare(a.at)||a.id.localeCompare(b.id));
}
export function albumKeepsakeTitle(keepsake:ActivityKeepsake){return keepsake.birthday?.title??keepsake.project?.title??activityKeepsakeNames[keepsake.kind];}
