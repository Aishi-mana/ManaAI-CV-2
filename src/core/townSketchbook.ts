import {journalClock} from './clock';
import type {RecordedEvent} from './events';
import type {SharedMemory} from './residentRelationships';
import {residentIds,residentProfiles} from './residentProfiles';
import type {Friend} from './friendshipHabits';
import {friendName} from './friendshipHabits';
import type {ManaverseArea} from '../components/ManaverseMap';

export type TownSketchMoment={id:string;at:string;date:string;title:string;text:string;people:Friend[];kind:'sketch'|'read'|'tinker'|'favor'|'evening'|'visit'|'project';area?:ManaverseArea};
export type TownSketchDay={date:string;moments:TownSketchMoment[]};
export const sketchbookPeople:Friend[]=['mana',...residentIds,'aishi'];
const blocked=(id:string,title:string)=>/cancel|declin|invit|request|while-mana-slept|sleep-followup/i.test(`${id} ${title}`);
function actionFor(id:string){return /^(?:room|shared)-\d{4}-\d{2}-\d{2}-(.+)$/.exec(id)?.[1]??id;}
function eveningOwner(action:string){return (['mana',...residentIds] as SharedMemory['owner'][]).find(owner=>action===`evening-wind-down-${owner}`||action.startsWith(`evening-wind-down-${owner}-`));}
function presentation(action:string,text:string,people:Friend[]):Pick<TownSketchMoment,'kind'|'area'>{
 if(action.startsWith('town-project-')){
  const area=action.includes('park-')||action.includes('group-sketch')||action.includes('group-read')||action.includes('aishi-sketch')?'park':action.includes('workshop-tinkering')||action.includes('aishi-tinker')?'workshop':people[0]==='mana'?'bedroom':people[0]&&people[0]!=='aishi'?residentProfiles[people[0]].home:undefined;
  return {kind:'project',area};
 }
 if(action.startsWith('small-favor-'))return {kind:'favor',area:action.includes('pond-focus')?'park':action.includes('reading-pace')?'library':action.includes('workbench-direction')?'workshop':undefined};
 if(action.startsWith('evening-wind-down-')){const owner=eveningOwner(action);return {kind:'evening',area:owner==='mana'?'bedroom':owner?residentProfiles[owner].home:undefined};}
 if(action==='workshop-tinkering'||action==='aishi-tinker')return {kind:'tinker',area:'workshop'};
 if(action==='aishi-read')return {kind:'read',area:'library'};
 if(action==='aishi-sketch')return {kind:'sketch',area:'park'};
 if(/^(?:aishi-group-(?:read|sketch)|(?:resident-)?park-meetup)$/.test(action))return {kind:action.includes('read')||/read together/.test(text)?'read':/sketch/.test(action+' '+text)?'sketch':'visit',area:'park'};
 if(action==='cafe-meetup')return {kind:'visit',area:'cafe'};
 if(action==='library-founding-story'||action==='luna-library-visit')return {kind:'visit',area:'library'};
 if(action.startsWith('birthday-celebration-'))return {kind:'visit',area:'square'};
 if((action.startsWith('beanbag-chat-')||action.startsWith('quiet-company-')))return {kind:'visit',area:'living'};
 if(action==='host-visit')return {kind:'visit',area:people.includes('lyra')?'library':people.includes('luna')?'luna-home':undefined};
 if(action==='mana-keepsake'||action==='shared-keepsake')return {kind:'visit',area:'bedroom'};
 return {kind:'visit'};
}
function eventPeople(action:string,text:string):Friend[]{
 if(action.startsWith('town-project-')){const owner=(['mana',...residentIds] as SharedMemory['owner'][]).find(owner=>action.startsWith(`town-project-${owner}-`));return owner?[owner]:[];}
 if(action==='aishi-group-read'||action==='aishi-group-sketch')return ['aishi','luna','lyra'];
 if(action==='aishi-read')return ['aishi','lyra'];
 if(action==='aishi-sketch')return ['aishi','luna'];
 if(action==='aishi-tinker')return ['aishi','mana'];
 if(action.startsWith('small-favor-'))return action.includes('pond-focus')?['aishi','luna']:action.includes('reading-pace')?['aishi','lyra']:action.includes('workbench-direction')?['aishi','mana']:[];
 if(action==='resident-park-meetup'||action==='luna-library-visit')return ['luna','lyra'];
 if(action==='library-founding-story')return ['mana','lyra'];
 if(action==='host-visit'){
  const name=/^Mana visited (Luna|Lyra)\b/.exec(text)?.[1];return name?['mana',name==='Luna'?'luna':'lyra']:['mana'];
 }
 if(action==='park-meetup'||action==='cafe-meetup'){
  const name=/^Mana and (Luna|Lyra)\b/.exec(text)?.[1];return name?['mana',name==='Luna'?'luna':'lyra']:['mana'];
 }
 if(action.startsWith('evening-wind-down-')){const owner=eveningOwner(action);return owner?[owner]:[];}
 if((action.startsWith('beanbag-chat-')||action.startsWith('quiet-company-')))return ['mana',action.endsWith('lyra')?'lyra':'luna'];
 return ['mana'];
}
function includedEvent(action:string){
 return /^(?:aishi-(?:group-)?(?:read|sketch|tinker)|(?:resident-)?park-meetup|cafe-meetup|host-visit|library-founding-story|luna-library-visit|(?:beanbag-chat|quiet-company)-(?:luna|lyra)|workshop-tinkering|(?:mana|shared)-keepsake|small-favor-.+|evening-wind-down-.+|town-project-.+)$/.test(action);
}
export function townSketchbookDays(events:readonly RecordedEvent[],memories:readonly SharedMemory[],timeZone:string,now=Date.now()):TownSketchDay[]{
 const moments=new Map<string,TownSketchMoment>();
 for(const memory of memories){
  const time=Date.parse(memory.at);if(!Number.isFinite(time)||time>now||blocked(memory.id,memory.activity))continue;
  const suffix=`:${memory.owner}:${memory.with}`;
  const source=memory.id.endsWith(suffix)?memory.id.slice(0,-suffix.length):memory.id;
  const id=source.replace(/^shared-(\d{4}-\d{2}-\d{2}-)/,'room-$1'),action=actionFor(source);
  const existing=moments.get(id),people=[...new Set([...(existing?.people??[]),memory.owner,memory.with])];
  const prefix=`I spent time with ${friendName(memory.with)}. `;
  const text=memory.fact.startsWith(prefix)?memory.fact.slice(prefix.length):memory.fact;
  const moment={id,at:existing?.at??memory.at,date:journalClock(new Date(existing?.at??memory.at),timeZone).date,title:memory.activity,text:existing?.text??text,people,...presentation(action,text,people)};
  moments.set(id,moment);
 }
 for(const event of events){
  const time=Date.parse(event.recordedAt),action=actionFor(event.id);
  if(event.kind!=='activity'||!/^room-\d{4}-\d{2}-\d{2}-/.test(event.id)||!Number.isFinite(time)||time>now||blocked(event.id,event.title)||!includedEvent(action))continue;
  const previous=moments.get(event.id),people=previous?.people??eventPeople(action,event.outcome);
  moments.set(event.id,{id:event.id,at:event.recordedAt,date:journalClock(new Date(event.recordedAt),timeZone).date,title:event.title.replace(/^Companion Room\s*·\s*/,''),text:event.outcome,people,...presentation(action,event.outcome,people)});
 }
 const days=new Map<string,TownSketchMoment[]>();
 for(const moment of [...moments.values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||a.id.localeCompare(b.id))){
  moment.people=sketchbookPeople.filter(person=>moment.people.includes(person));
  days.set(moment.date,[...(days.get(moment.date)??[]),moment]);
 }
 return [...days].map(([date,moments])=>({date,moments}));
}
export function filterTownSketchbook(days:readonly TownSketchDay[],person:Friend|'all',query:string){
 const search=query.trim().toLocaleLowerCase();
 return days.flatMap(day=>{
  const moments=day.moments.filter(moment=>(person==='all'||moment.people.includes(person))&&(!search||`${day.date} ${moment.title} ${moment.text}`.toLocaleLowerCase().includes(search)));
  return moments.length?[{date:day.date,moments}]:[];
 });
}
