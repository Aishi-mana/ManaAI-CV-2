import {residentIds,type ResidentId} from './residentProfiles';
import type {PhoneMessage} from './roomPhone';

export type PhoneReadState=Partial<Record<ResidentId,string>>;
export function phoneMessageReadKey(message:PhoneMessage){
 let hash=2166136261;
 for(const character of message.text??'')hash=Math.imul(hash^character.charCodeAt(0),16777619);
 return `${message.at}|${message.kind}|${hash>>>0}`;
}
export function validatePhoneReadState(value:unknown):PhoneReadState{
 const result:PhoneReadState={};
 if(value&&typeof value==='object')for(const id of residentIds){
  const key=(value as Record<string,unknown>)[id];
  if(typeof key==='string'&&key.length>0&&key.length<=256)result[id]=key;
 }
 return result;
}
export function latestPhoneIncoming(messages:readonly PhoneMessage[]){
 const latest:Partial<Record<ResidentId,PhoneMessage>>={};
 for(const message of messages)if(message.from==='contact'&&message.text)latest[message.contact]=message;
 return latest;
}
export function unreadPhoneContacts(messages:readonly PhoneMessage[],read:PhoneReadState){
 const latest=latestPhoneIncoming(messages);
 return residentIds.filter(id=>latest[id]&&phoneMessageReadKey(latest[id]!)!==read[id]);
}
