/** Phase 3A is text-only. These are user-supplied, permission-reviewed lyrics,
 * never discovered/downloaded from the internet or sent to external services. */
export const TRANSLATION_PROJECT_LIMIT=16;
export const TRANSLATION_LINE_LIMIT=16;
export const TRANSLATION_VERSION_LIMIT=8;
export type AdaptationRightsBasis='owned'|'licensed'|'public-domain';
export interface TranslationLine {
 source:string;
 english:string;
 targetSyllables:number; // 0 = unknown / not assigned
 note:string;
}
export interface TranslationVersion {
 id:string;createdAt:string;label:string;
 lines:Pick<TranslationLine,'english'|'targetSyllables'|'note'>[];
}
export interface TranslationProject {
 id:string;title:string;createdAt:string;updatedAt:string;
 sourceLanguage:'ja';targetLanguage:'en';
 rightsBasis:AdaptationRightsBasis;rightsAcknowledgedAt:string;
 lines:TranslationLine[];
 versions:TranslationVersion[];
}
export const translationId=/^translation-[a-zA-Z0-9_-]{1,80}$/;
const versionId=/^version-[a-zA-Z0-9_-]{1,80}$/;
const validTime=(x:unknown):x is string=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(x).toISOString()===x;
const boundedText=(x:unknown,max:number)=>typeof x==='string'?x.trim().slice(0,max):'';
const validBasis=(x:unknown):x is AdaptationRightsBasis=>
 x==='owned'||x==='licensed'||x==='public-domain';
const count=(raw:unknown):number=>{
 if(typeof raw!=='number'||!Number.isInteger(raw)||raw<0||raw>30)return 0;
 return raw;
};
function cleanedLine(raw:unknown):TranslationLine|undefined{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return;
 const line=raw as Record<string,unknown>;
 const source=boundedText(line.source,220);
 if(!source)return;
 return {source,english:boundedText(line.english,250),
  targetSyllables:count(line.targetSyllables),note:boundedText(line.note,200)};
}
function cleanedVersion(raw:unknown,lineCount:number):TranslationVersion|undefined{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return;
 const p=raw as Record<string,unknown>;
 if(typeof p.id!=='string'||!versionId.test(p.id)||!validTime(p.createdAt)||
   typeof p.label!=='string'||!p.label.trim()||p.label.length>80||
   !Array.isArray(p.lines)||p.lines.length!==lineCount)return;
 const lines=p.lines.map(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item))return null;
  const x=item as Record<string,unknown>;
  return {english:boundedText(x.english,250),targetSyllables:count(x.targetSyllables),
   note:boundedText(x.note,200)};
 });
 if(lines.some(x=>!x)||!lines.some(x=>!!x?.english))return;
 return {id:p.id,createdAt:p.createdAt,label:p.label.trim(),lines:lines as TranslationVersion['lines']};
}
export function normalizeTranslationProject(raw:unknown):TranslationProject|undefined{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return;
 const p=raw as Record<string,unknown>;
 if(typeof p.id!=='string'||!translationId.test(p.id)||
   typeof p.title!=='string'||!p.title.trim()||p.title.length>120||
   !validTime(p.createdAt)||!validTime(p.updatedAt)||
   p.sourceLanguage!=='ja'||p.targetLanguage!=='en'||
   !validBasis(p.rightsBasis)||!validTime(p.rightsAcknowledgedAt)||
   !Array.isArray(p.lines)||p.lines.length<1||p.lines.length>TRANSLATION_LINE_LIMIT)return;
 const lines=p.lines.map(cleanedLine);
 if(lines.some(x=>!x))return;
 const unique=new Set<string>(),versions:TranslationVersion[]=[];
 if(Array.isArray(p.versions))for(const version of p.versions.slice(0,TRANSLATION_VERSION_LIMIT)){
  const v=cleanedVersion(version,lines.length);
  if(!v||unique.has(v.id))continue;
  unique.add(v.id);versions.push(v);
 }
 return {id:p.id,title:p.title.trim(),createdAt:p.createdAt,updatedAt:p.updatedAt,
  sourceLanguage:'ja',targetLanguage:'en',rightsBasis:p.rightsBasis,rightsAcknowledgedAt:p.rightsAcknowledgedAt,
  lines:lines as TranslationLine[],versions};
}
export function validateTranslationProjects(raw:unknown):TranslationProject[]{
 const projects:TranslationProject[]=[],used=new Set<string>();
 if(!Array.isArray(raw))return projects;
 for(const item of raw.slice(0,TRANSLATION_PROJECT_LIMIT)){
  const project=normalizeTranslationProject(item);
  if(project&&!used.has(project.id)){used.add(project.id);projects.push(project);}
 }
 return projects;
}
export function parseSourceLyrics(raw:string):string[]{
 if(typeof raw!=='string'||raw.length>5000)throw Error('Use up to 5,000 characters of supplied lyrics.');
 const lines=raw.replace(/\r\n?/g,'\n').split('\n').map(s=>s.trim()).filter(Boolean);
 if(!lines.length||lines.length>TRANSLATION_LINE_LIMIT||lines.some(s=>s.length>220))
  throw Error('Use 1–16 non-empty lines, each up to 220 characters. Work a verse at a time.');
 return lines;
}
export function createTranslationProject(args:{
 id:string;title:string;sourceLyrics:string;rightsBasis:AdaptationRightsBasis;
 acknowledged:boolean;now?:Date;
}):TranslationProject{
 const now=args.now??new Date(),title=args.title?.trim();
 if(!translationId.test(args.id)||!title||title.length>120||!Number.isFinite(now.getTime()))
  throw Error('Choose a valid project title.');
 if(!validBasis(args.rightsBasis)||args.acknowledged!==true)
  throw Error('Confirm authorization to translate and adapt these lyrics first.');
 const lines=parseSourceLyrics(args.sourceLyrics);
 const stamp=now.toISOString();
 return {id:args.id,title,createdAt:stamp,updatedAt:stamp,sourceLanguage:'ja',targetLanguage:'en',
  rightsBasis:args.rightsBasis,rightsAcknowledgedAt:stamp,
  lines:lines.map(source=>({source,english:'',targetSyllables:0,note:''})),versions:[]};
}
export function addTranslationProject<T extends {translations:TranslationProject[]}>(
 state:T,project:TranslationProject,
):T{
 const valid=normalizeTranslationProject(project);
 if(!valid)throw Error('Invalid translation project.');
 if(state.translations.length>=TRANSLATION_PROJECT_LIMIT)throw Error('Translation shelf is full.');
 if(state.translations.some(x=>x.id===valid.id))throw Error('That translation draft already exists.');
 return {...state,translations:[valid,...state.translations]};
}
export type TranslationEditField='english'|'targetSyllables'|'note';
export function updateTranslationLine<T extends {translations:TranslationProject[]}>(
 state:T,id:string,index:number,field:TranslationEditField,value:string|number,now=new Date(),
):T{
 if(!Number.isFinite(now.getTime()))throw Error('Invalid edit time.');
 const project=state.translations.find(p=>p.id===id);
 if(!project||!Number.isInteger(index)||index<0||index>=project.lines.length)
  throw Error('Translation line is unavailable.');
 let next:string|number;
 if(field==='targetSyllables'){
  if(typeof value!=='number'||!Number.isInteger(value)||value<0||value>30)
   throw Error('Target syllables must be 0–30 (0 means unset).');
  next=value;
 }else{
  if(typeof value!=='string'||value.length>(field==='english'?250:200))
   throw Error('English line or note exceeds its length limit.');
  next=value; // Keep spaces while typing; persistence normalizes text on reload.
 }
 if(project.lines[index][field]===next)return state;
 return {...state,translations:state.translations.map(p=>p.id===id?{
  ...p,updatedAt:now.toISOString(),
  lines:p.lines.map((line,i)=>i===index?{...line,[field]:next}:line),
 }:p)};
}
export function applyTranslationProposal<T extends {translations:TranslationProject[]}>(
 state:T,id:string,proposal:{lines:{index:number;english:string;note:string}[]},now=new Date(),
):T{
 const p=state.translations.find(p=>p.id===id);
 if(!p||!Number.isFinite(now.getTime())||!Array.isArray(proposal.lines)||
    proposal.lines.length!==p.lines.length)throw Error('Draft does not match the current source.');
 const unique=new Set<number>();
 for(const line of proposal.lines){
  if(!line||!Number.isInteger(line.index)||line.index<1||line.index>p.lines.length||
   unique.has(line.index)||typeof line.english!=='string'||!line.english.trim()||
   line.english.length>250||typeof line.note!=='string'||line.note.length>200)
   throw Error('Mana returned a mismatched English line.');
  unique.add(line.index);
 }
 return {...state,translations:state.translations.map(current=>current.id===id?{
  ...current,updatedAt:now.toISOString(),
  lines:current.lines.map((line,i)=>{
   const chosen=proposal.lines.find(value=>value.index===i+1)!;
   return {...line,english:chosen.english.trim(),note:chosen.note.trim()};
  }),
 }:current)};
}
export function saveTranslationVersion<T extends {translations:TranslationProject[]}>(
 state:T,id:string,versionIdValue:string,now=new Date(),
):T{
 const p=state.translations.find(p=>p.id===id);
 if(!p||!versionId.test(versionIdValue)||!Number.isFinite(now.getTime()))
  throw Error('Choose an existing translation draft.');
 if(p.versions.length>=TRANSLATION_VERSION_LIMIT)throw Error('This draft already has 8 saved versions.');
 if(!p.lines.some(line=>line.english.trim()))throw Error('Write at least one English line before saving a version.');
 const version:TranslationVersion={id:versionIdValue,createdAt:now.toISOString(),
  label:'Version '+(p.versions.length+1),
  lines:p.lines.map(({english,targetSyllables,note})=>({english,targetSyllables,note}))};
 return {...state,translations:state.translations.map(item=>item.id===id?{
  ...item,updatedAt:now.toISOString(),versions:[...item.versions,version],
 }:item)};
}
export function restoreTranslationVersion<T extends {translations:TranslationProject[]}>(
 state:T,id:string,versionIdValue:string,now=new Date(),
):T{
 const p=state.translations.find(p=>p.id===id);
 const version=p?.versions.find(v=>v.id===versionIdValue);
 if(!p||!version||!Number.isFinite(now.getTime()))throw Error('Saved version is unavailable.');
 return {...state,translations:state.translations.map(item=>item.id===id?{
  ...item,updatedAt:now.toISOString(),
  lines:item.lines.map((line,i)=>({...line,...version.lines[i]})),
 }:item)};
}
export function removeTranslationProject<T extends {translations:TranslationProject[]}>(
 state:T,id:string,
):T{
 return {...state,translations:state.translations.filter(project=>project.id!==id)};
}
/** Approximation for English only. Never use as a Japanese pronunciation meter. */
export function approximateEnglishSyllables(text:string):number{
 return text.trim().split(/\s+/).filter(Boolean).reduce((sum,word)=>{
  const cleaned=word.toLowerCase().replace(/[^a-z]/g,'');
  if(!cleaned)return sum;
  const parts=cleaned.replace(/e$/,'').match(/[aeiouy]+/g);
  return sum+Math.max(1,parts?.length??1);
 },0);
}
