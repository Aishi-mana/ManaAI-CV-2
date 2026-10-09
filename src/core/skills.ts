import {readStored,writeStored} from './persistence';
import {isRecord,nonEmptyString} from './validation';
import {uid} from './types';
import type {WorkArtifact} from './work';
import type {SharedSession} from './sharedActivities';
export const SKILLS={coding:'Coding practice',writing:'Writing practice',creativity:'Creative practice'};
export type Skill=keyof typeof SKILLS;
export interface PracticeSource {id:string;kind:'work'|'activity';title:string;outcome:string;createdAt:string}
export interface Practice {id:string;skill:Skill;notes:string;confirmedAt:string;source:PracticeSource}
export const PRACTICE_LIMIT=200;
const time=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function validatePractice(value:unknown):Practice[]{
 if(!Array.isArray(value))return [];const ids=new Set<string>(),links=new Set<string>();
 return value.flatMap((p):Practice[]=>{
  if(!isRecord(p)||!nonEmptyString(p.id)||ids.has(p.id)||!['coding','writing','creativity'].includes(String(p.skill))||typeof p.notes!=='string'||!time(p.confirmedAt)||!isRecord(p.source))return [];
  const s=p.source;if(!nonEmptyString(s.id)||(s.kind!=='work'&&s.kind!=='activity')||!nonEmptyString(s.title)||!nonEmptyString(s.outcome)||!time(s.createdAt))return [];
  const link=`${p.skill}:${s.kind}:${s.id}`;if(links.has(link))return [];ids.add(p.id);links.add(link);
  return [{id:p.id,skill:p.skill as Skill,notes:p.notes.trim().slice(0,1000),confirmedAt:p.confirmedAt,source:{id:s.id,kind:s.kind,title:s.title.slice(0,200),outcome:s.outcome.slice(0,300),createdAt:s.createdAt}}];
 }).slice(0,PRACTICE_LIMIT);
}
export function loadPractice():Practice[]{try{return validatePractice(JSON.parse(readStored('mana.skills.v1')??'[]'));}catch{return [];}}
export const savePractice=(entries:Practice[])=>writeStored('mana.skills.v1',JSON.stringify(validatePractice(entries)));
export function practiceSources(work:WorkArtifact[],sessions:SharedSession[]):PracticeSource[]{
 return [...work.map(w=>({id:w.id,kind:'work' as const,title:w.title,createdAt:w.createdAt,outcome:`Reviewed ${w.kind} draft, v${w.version??1}. Not executed or independently tested.`})),...sessions.filter(s=>s.turns.some(t=>t.role==='user')).map(s=>({id:s.id,kind:'activity' as const,title:s.prompt,createdAt:s.createdAt,outcome:`${s.kind} session: ${s.status}, ${s.turns.length} saved turns. Fictional story/feedback is not proficiency evidence.`}))].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
}
export function confirmPractice(entries:Practice[],skill:Skill,source:PracticeSource,notes:string,now=new Date()):Practice[]{
 if(entries.length>=PRACTICE_LIMIT||entries.some(p=>p.skill===skill&&p.source.kind===source.kind&&p.source.id===source.id))return entries;
 return validatePractice([...entries,{id:uid(),skill,source,notes,confirmedAt:now.toISOString()}]);
}
export function practiceProgress(entries:Practice[],skill:Skill){
 const count=entries.filter(p=>p.skill===skill).length;
 const milestones=[1,5,10,25,50,100,200].filter(n=>n<=count);
 return {count,stage:milestones.length,next:[1,5,10,25,50,100,200].find(n=>n>count)??null,milestones};
}
export function skillsContext(entries:Practice[],query:string):string{
 if(!/\b(skill|skills|practice|progress|learned|learning)\b/i.test(query))return '';
 return `\nUSER-CONFIRMED PRACTICE COUNTS (not proficiency): ${JSON.stringify(Object.keys(SKILLS).map(k=>({skill:k,records:practiceProgress(entries,k as Skill).count})))}\nCounts describe records the user confirmed, not tested ability, executed code or proof of learning. Do not infer mastery, assign grades or claim autonomous practice.\n`;
}
