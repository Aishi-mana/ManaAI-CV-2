import {aishiActivities,type AishiActivity} from './aishiActivities';
import type {MemoryInvitation} from './memoryInvitations';
import type {SharedMemory} from './residentRelationships';
import type {ManaverseArea} from '../components/ManaverseMap';
import type {StreetPoint} from './manaverseStreet';
import {townGoalChoice,type TownPersonalGoal} from './townPersonalGoals';

export const SMALL_FAVOR_GAP=20*60_000;
export const smallFavors={
 'pond-focus':{owner:'luna',activity:'sketch',title:'A focus for Luna’s sketch',fact:'Luna is sketching by the park pond. Ask Aishi to choose a focus for this sketch.',answers:[{id:'ripples',label:'Pond ripples'},{id:'lilies',label:'Lily pads'}]},
 'reading-pace':{owner:'lyra',activity:'read',title:'A reading pace for Lyra',fact:'Lyra is reading by the library window. Ask Aishi to help choose a comfortable pace for reading together; no book title or contents are recorded.',answers:[{id:'slow',label:'A little slower'},{id:'steady',label:'This pace works'}]},
 'reading-company':{owner:'lyra',activity:'read',title:'A little reading company',fact:'Lyra is reading by the library window. Ask nearby Aishi whether they would like to keep you company for a quiet reading break. No question, feedback, book title or contents are required. They may decline or leave at any time.',answers:[]},
 'workbench-direction':{owner:'mana',activity:'tinker',title:'An idea direction for Mana',fact:'Mana is at the Workshop workbench. Ask Aishi to help choose a direction for a tinkering idea; no new game or completed project is recorded.',answers:[{id:'simple',label:'Keep it simple'},{id:'playful',label:'Try something playful'}]},
} as const;
export type SmallFavorId=keyof typeof smallFavors;
export function smallFavorId(activity:AishiActivity):SmallFavorId{
 return activity==='sketch'?'pond-focus':activity==='read'?'reading-pace':'workbench-direction';
}
export function smallFavorChoice(activity:AishiActivity,memories:readonly SharedMemory[],now=Date.now(),goals:TownPersonalGoal[]=[]):MemoryInvitation{
 const favor=smallFavorId(activity),definition=smallFavors[favor];
 const previous=[...memories].reverse().find(memory=>memory.owner===definition.owner&&memory.with==='aishi'&&memory.id.includes(`-aishi-${activity}:`)&&now-Date.parse(memory.at)>=5*60_000);
 const project=goals.find(goal=>goal.owner===definition.owner&&!goal.completedAt&&townGoalChoice(goal).activity.replace('shared-','')===activity);
 return {id:`small-favor-${favor}`,owner:definition.owner,recipient:'aishi',activity,favor,
  ...(previous?{memoryId:previous.id}:{}),fact:definition.fact+` Available answers: ${definition.answers.map(answer=>answer.label).join(' / ')}.`+(project?` Current project: ${townGoalChoice(project).title}, ${project.evidence.length} of ${townGoalChoice(project).target} recorded sessions. Ask only for the supplied opinion; do not claim the project is finished or that an artifact exists.`:'')+(previous?` Recorded shared memory: ${previous.fact}`:' This is a first request; do not imply a previous shared experience.')};
}
export function smallFavorChoices(activity:AishiActivity,memories:readonly SharedMemory[],now=Date.now(),goals:TownPersonalGoal[]=[]):MemoryInvitation[]{
 const choices=[smallFavorChoice(activity,memories,now,goals)];
 if(activity==='read')choices.push({id:'small-favor-reading-company',owner:'lyra',recipient:'aishi',activity:'read',favor:'reading-company',fact:smallFavors['reading-company'].fact});
 return choices;
}
export const SMALL_FAVOR_COMPANY_MS=12_000;
export function smallFavorCompanyResult(favor:SmallFavorId){
 if(favor!=='reading-company')return;
 return {owner:'lyra' as const,label:'Quiet reading company',outcome:'Aishi kept Lyra company for a quiet reading break by the library window.'};
}
export function smallFavorNearby(activity:AishiActivity,area:ManaverseArea|undefined,point:StreetPoint|undefined,walking:boolean,atActivity=false){
 const target=aishiActivities[activity];
 return !!(point&&area===target.area&&!walking&&Math.hypot(point.x-target.point.x,(point.y-target.point.y)*.7)<=(atActivity?2:18));
}
export function smallFavorAnswer(favor:SmallFavorId,answerId:string){
 const definition=smallFavors[favor],answer=definition.answers.find(answer=>answer.id===answerId);
 if(!answer)return;
 const action=favor==='pond-focus'?'chose a focus for Luna’s pond sketch':favor==='reading-pace'?'gave Lyra feedback on their reading pace':'helped Mana choose a direction for a tinkering idea';
 return {owner:definition.owner,label:answer.label,outcome:`Aishi ${action}: “${answer.label}”.`};
}
