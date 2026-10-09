import {validateChat} from './settings';
import {readStored,writeStored} from './persistence';
import {isRecord} from './validation';
import {uid} from './types';
import type {Msg} from './types';

export interface ChatArchive {id:string;title:string;createdAt:string;messages:Msg[]}
const KEY='mana.chat_archives.v1';
export function validateChatArchives(value:unknown):ChatArchive[]{
 if(!Array.isArray(value))return [];
 const ids=new Set<string>();
 return value.filter(isRecord).filter(a=>typeof a.id==='string'&&!ids.has(a.id)&&!!ids.add(a.id)&&typeof a.title==='string'&&!!a.title.trim()&&a.title.length<=100&&typeof a.createdAt==='string'&&Number.isFinite(Date.parse(a.createdAt))&&Array.isArray(a.messages)).slice(0,50).map(a=>({id:a.id as string,title:a.title as string,createdAt:a.createdAt as string,messages:validateChat(a.messages,Number.MAX_SAFE_INTEGER)}));
}
export function newChatArchive(messages:Msg[]):ChatArchive {
 if(!messages.length)throw new Error('There is no chat to archive.');
 return {id:uid(),title:(messages.find(m=>m.role==='user')?.content.trim()||'Conversation').slice(0,100),createdAt:new Date().toISOString(),messages:validateChat(messages,Number.MAX_SAFE_INTEGER)};
}
export function loadChatArchives():ChatArchive[]{try{return validateChatArchives(JSON.parse(readStored(KEY)??'[]'));}catch{return [];}}
export function saveChatArchives(archives:ChatArchive[]){writeStored(KEY,JSON.stringify(validateChatArchives(archives)));}
