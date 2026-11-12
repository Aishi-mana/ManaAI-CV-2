import {journalClock} from './clock';
import {readStored,writeStored} from './persistence';
import {isRecord} from './validation';
import {STAR_COLLECTOR_MARKER,STAR_COLLECTOR_REQUEST} from './starCollectorCheck';

export const GAME_DEV_KEY='mana.game_dev.v1';
export const GAME_DEV_LIMIT=30;
export const GAME_DEV_STEPS=['Core gameplay','Presentation','Release check'] as const;
export const GAME_DEV_GENRES=['Puzzle','Platformer','Arcade','Strategy','Adventure','Rhythm','Racing','Simulation'] as const;
export type GameGenre=typeof GAME_DEV_GENRES[number];
export interface DevProject {id:string;title:string;theme:string;code:string;step:number;genre?:GameGenre;publishedAt?:string}
export interface DevNote {id:string;projectId:string;createdAt:string;kind:'development'|'playtest';text:string;diaryText?:string;model?:string}
export type DailyAttempts=1|2|3;
export interface GameDevState {
 developmentEnabled:boolean;playtestsEnabled:boolean;diary:boolean;
 developmentPerDay:DailyAttempts;playsPerDay:DailyAttempts;projects:DevProject[];notes:DevNote[];
 developmentModelPath?:string;
 developmentClaim?:{day:string;count:number};playClaim?:{day:string;slot:number;count:number};
}
const day=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
const stamp=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const key=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(v);
export function validateGameDev(value:unknown):GameDevState {
 const state:GameDevState={developmentEnabled:false,playtestsEnabled:false,diary:true,developmentPerDay:1,playsPerDay:1,projects:[],notes:[]};
 if(!isRecord(value))return state;
 state.developmentEnabled=typeof value.developmentEnabled==='boolean'?value.developmentEnabled:value.enabled===true;
 state.playtestsEnabled=typeof value.playtestsEnabled==='boolean'?value.playtestsEnabled:value.enabled===true;
 state.diary=value.diary!==false;
 state.playsPerDay=value.playsPerDay===2||value.playsPerDay===3?value.playsPerDay:1;
 state.developmentPerDay=value.developmentPerDay===2||value.developmentPerDay===3?value.developmentPerDay:1;
 const modelPath=value.developmentModelPath;
 if(typeof modelPath==='string'&&modelPath.length<=4096&&!modelPath.includes('\0')&&/\.gguf$/i.test(modelPath.trim())){
  state.developmentModelPath=modelPath.trim();
 }
 const work=value.developmentClaim;
 if(isRecord(work)&&day(work.day)&&(work.count===1||work.count===2||work.count===3)){
  state.developmentClaim={day:work.day,count:work.count};
 }else if(day(value.lastDevelopment)){
  state.developmentClaim={day:value.lastDevelopment,count:1};
 }
 const claim=value.playClaim;
 if(isRecord(claim)&&day(claim.day)&&typeof claim.slot==='number'&&Number.isInteger(claim.slot)&&claim.slot>=0&&claim.slot<3&&
  typeof claim.count==='number'&&Number.isInteger(claim.count)&&claim.count>=1&&claim.count<=3)state.playClaim={day:claim.day,slot:claim.slot,count:claim.count};
 for(const item of Array.isArray(value.projects)?value.projects.slice(0,GAME_DEV_LIMIT):[]){
  const genre=isRecord(item)?GAME_DEV_GENRES.find(candidate=>candidate===item.genre):undefined;
  if(!isRecord(item)||!key(item.id)||state.projects.some(project=>project.id===item.id)||
   typeof item.title!=='string'||!item.title.trim()||item.title.length>80||typeof item.theme!=='string'||item.theme.length>150||
   typeof item.code!=='string'||item.code.length>16000||typeof item.step!=='number'||!Number.isInteger(item.step)||item.step<0||item.step>3||
   (item.step>0&&(!item.code.trim()||!genre&&!item.code.startsWith(STAR_COLLECTOR_MARKER+'\n')))||(item.step===3&&!stamp(item.publishedAt)))continue;
  state.projects.push({id:item.id,title:item.title,theme:item.theme,code:item.code,step:item.step,
   ...(genre?{genre}:{}),...(item.step===3&&stamp(item.publishedAt)?{publishedAt:item.publishedAt}:{})});
 }
 for(const note of Array.isArray(value.notes)?value.notes.slice(-90):[]){
  if(isRecord(note)&&key(note.id)&&key(note.projectId)&&stamp(note.createdAt)&&
   (note.kind==='development'||note.kind==='playtest')&&typeof note.text==='string'&&note.text.length<=700)
   state.notes.push({id:note.id,projectId:note.projectId,createdAt:note.createdAt,kind:note.kind,text:note.text,
    ...(typeof note.model==='string'?{model:note.model.slice(0,180)}:{}),...(typeof note.diaryText==='string'?{diaryText:note.diaryText.slice(0,400)}:{})});
 }
 return state;
}
export function loadGameDev():GameDevState{
 try{return validateGameDev(JSON.parse(readStored(GAME_DEV_KEY)??'null'));}catch{return validateGameDev(null);}
}
export const saveGameDev=(state:GameDevState)=>writeStored(GAME_DEV_KEY,JSON.stringify(validateGameDev(state)));

export function developmentAttempts(state:GameDevState,date:string){
 return state.developmentClaim?.day===date?state.developmentClaim.count:0;
}
export function developmentDue(state:GameDevState,date:string){
 return (!state.developmentClaim||state.developmentClaim.day<=date)&&
  developmentAttempts(state,date)<state.developmentPerDay&&
  (state.projects.length<GAME_DEV_LIMIT||state.projects.some(project=>!project.publishedAt&&(!project.genre||project.step<2)));
}
export function playSlot(state:GameDevState,now:Date,timeZone:string){
 if(!state.projects.some(project=>project.publishedAt))return;
 const {date,time}=journalClock(now,timeZone);
 const slot=Math.floor(Number(time.slice(0,2))*state.playsPerDay/24);
 const prior=state.playClaim;
 if(prior&&(prior.day>date||prior.day===date&&(prior.slot>=slot||prior.count>=state.playsPerDay)))return;
 return {day:date,slot,count:prior?.day===date?prior.count+1:1};
}

export function newDevProject(id:string,projects:DevProject[]):DevProject{
 const lastGenre=[...projects].reverse().find(project=>project.genre)?.genre;
 const pool=GAME_DEV_GENRES.filter(genre=>genre!==lastGenre);
 const genre=pool[Math.floor(Math.random()*pool.length)];
 return {genre,id,code:'',step:0,title:genre+' project',theme:''};
}
export function developmentRequest(project:DevProject):string{
 if(project.genre){
  if(project.step===0)return 'Invent a compact, complete '+project.genre+' game. Choose its premise, mechanics, controls, and title yourself. Include readable controls, a clear objective, an outcome, and a way to restart. Return single-file JavaScript. Begin the source with a single-line comment of the form // GAME: {"title":"Your title","theme":"One sentence describing the game"}.';
  return 'Polish the presentation of this '+project.genre+' game, '+JSON.stringify(project.title)+'. Preserve its mechanics, objective, controls, outcome and restart. Return single-file JavaScript.';
 }
 return project.step===0
  ? STAR_COLLECTOR_REQUEST+' Theme: '+project.theme
  : STAR_COLLECTOR_REQUEST+' Improve the presentation with a cohesive background, readable controls and a clear win screen. Keep the checked gameplay. Theme: '+project.theme;
}

export function genreGameDescription(source:string){
 const header=source.match(/^\/\/ GAME: ([^\r\n]+)\r?\n/);
 if(header){
  const value:unknown=JSON.parse(header[1]);
  if(isRecord(value)&&typeof value.title==='string'&&value.title.trim()&&value.title.length<=80&&
    typeof value.theme==='string'&&value.theme.trim()&&value.theme.length<=150){
   return {title:value.title.trim(),theme:value.theme.trim()};
  }
 }
 throw Error('Begin the JavaScript with a GAME comment containing a title and a one-sentence theme.');
}
