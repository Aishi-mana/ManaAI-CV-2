import {phoneFactKey,residentPhoneFact,type PhoneFact} from './aishiPhoneMemories';
import type {TownCharacter} from './residentRelationships';
export const PERSONAL_FACT_CUE_GAP=60*60_000;
const topics=[
 {scene:/\bcaf[eé]|\b(?:coffee|tea|snack|drink|food|dessert)\b/i,fact:/^favorite (?:food|snack|drink|dessert)\b|\b(?:coffee|tea|mochi|sushi|chocolate|cookies|cake)\b/i},
 {scene:/\b(?:library|reading|book|story)\b/i,fact:/\b(?:reading|books?|stories|novels?)\b/i},
 {scene:/\b(?:park|sketch|sketching|drawing|painting|art)\b/i,fact:/\b(?:sketching|drawing|painting|art)\b/i},
 {scene:/\b(?:workshop|workbench|project|coding|programming|game|building)\b/i,fact:/^working on /i},
];
const words=(value:string)=>phoneFactKey(value).match(/[\p{L}\p{N}]+/gu)?.filter(word=>word.length>=4&&!['aishi','favorite','likes','loves','enjoys','prefers','working','works','that','this','with','have'].includes(word))??[];
export function choosePersonalFact(owner:TownCharacter,facts:readonly PhoneFact[],core:readonly string[],context:string,options:{addressingAishi:boolean;now?:number;lastAttempt?:number;message?:string}){
 const now=options.now??Date.now();
 if(!options.addressingAishi||now-(options.lastAttempt??-Infinity)<PERSONAL_FACT_CUE_GAP||/NPC conversation:|Quick greeting:|quick welcome|short welcome|casual hello|Silence will follow|quiet company|quiet break|goodbye|visit.*ending|planned sessions.*complete|just finished/i.test(context)||options.message&&/^(?:hi|hello|hey|good (?:morning|afternoon|evening|night))[!.,~\s]*$/i.test(options.message.trim()))return;
 const known=new Set(core.map(phoneFactKey)),sceneWords=new Set(words(context));
 return facts.filter(fact=>fact.contact===owner&&!fact.forgotten&&known.has(phoneFactKey(owner==='mana'?fact.fact:residentPhoneFact(fact.fact))))
  .map((fact,index)=>({fact,index,score:topics.reduce((score,topic)=>score+(topic.scene.test(context)&&topic.fact.test(fact.fact)?2:0),0)+words(fact.fact).filter(word=>sceneWords.has(word)).length}))
  .filter(item=>item.score>0).sort((a,b)=>b.score-a.score||b.index-a.index)[0]?.fact;
}
export function personalFactDialoguePrompt(fact:PhoneFact){
 return `\nOptional personal touch for this reply: Aishi told YOU this saved fact: ${JSON.stringify(fact.fact)}. It fits the current topic. You may briefly acknowledge it naturally, or leave it out if it would interrupt the conversation. Keep at most one personal reference. Do not recite a list or announce that you accessed memory. A preference is not an order or request: do not claim you bought, made, served, packed or gifted anything. A project is only something Aishi said he is working on; you may gently ask how it is going, but do not claim progress or completion, create a task, or change anyone's schedule. Do not infer new preferences, speak for Aishi, or tell absent people. This is a conversational cue, never evidence of an activity or a new memory.\n`;
}
