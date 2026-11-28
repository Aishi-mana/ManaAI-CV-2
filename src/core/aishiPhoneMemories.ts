import {suggestMemories} from './memorySuggestions';
import {newMemory,type Memory} from './character';
import type {AishiPhoneMessage} from './aishiPhone';
export type PhoneFact={sourceId:string;contact:AishiPhoneMessage['contact'];fact:string;forgotten?:true};
export const phoneFactKey=(text:string)=>text.toLowerCase().replace(/favourite/g,'favorite').replace(/[.!]+$/,'').replace(/\s+/g,' ').trim();
export function phoneFact(source:AishiPhoneMessage):PhoneFact|undefined{
 if(source.from!=='aishi'||/[?？]/.test(source.text)||/\b(?:maybe|might|perhaps|pretend|imagine|if|tomorrow|today|tonight|yesterday|for now|right now|this week|this month|temporary|temporarily|later|used to|you said|she said|he said|not sure|want to|would like|going to|plan to|hope to)\b/i.test(source.text))return;
 const text=source.text.trim().replace(/^please\s+/i,'');
 const suggestions=suggestMemories([{id:source.id,role:'user',content:text}],[],[]);
 let fact=suggestions.find(item=>item.category==='user')?.content;
 if(!fact){const project=text.match(/^(?:remember (?:that )?)?I(?: am|'m|’m) working on (.+?)[.!]*$/i);if(project)fact=`Working on ${project[1].trim()}.`;}
 if(!fact||fact.length>170)return;
 return {sourceId:source.id,contact:source.contact,fact};
}
export function residentPhoneFact(fact:string){
 if(/^Favorite /i.test(fact))return `Aishi's ${fact[0].toLowerCase()+fact.slice(1)}`;
 return `Aishi ${/^Working on /i.test(fact)?'is ':''}${fact[0].toLowerCase()+fact.slice(1)}`;
}
const topic=(fact:string)=>phoneFactKey(fact).match(/^favorite (.+?) is /)?.[1]??(/^working on /i.test(fact)?'current-project':undefined);
export function mergePhoneCoreFacts(previous:string[],fact:string){
 const canonical=residentPhoneFact(fact),key=phoneFactKey(canonical);
 if(previous.some(old=>phoneFactKey(old)===key))return previous;
 const subject=topic(fact);
 return [...previous.filter(old=>!subject||!/^Aishi(?:'s)? /i.test(old)||topic(old.replace(/^Aishi(?:'s)? (?:is )?/i,''))!==subject),canonical];
}
export function mergeManaPhoneFact(previous:Memory[],fact:string,sourceId:string){
 if(previous.some(memory=>memory.category==='user'&&phoneFactKey(memory.content)===phoneFactKey(fact)))return previous;
 const subject=topic(fact),keep=previous.filter(memory=>memory.category!=='user'||!subject||topic(memory.content)!==subject);
 return [...keep,{...newMemory(fact,'user',3),id:`aishi-phone-memory-${sourceId}`}];
}
