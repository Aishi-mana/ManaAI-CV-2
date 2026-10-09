import type {Msg} from './types';
import {cleanReply} from './emotion';

export function conversationText(messages:Msg[],charName:string,userName:string,title='Current conversation'):string {
 const sections=messages.map(message=>{
   const speaker=message.role==='user'?userName:charName;
   const text=message.role==='user'?message.content:cleanReply(message.content,charName).text;
   const image=message.imageReport?`\n[Image: ${message.imageReport.filename}; local vision description, may contain mistakes; image pixels are not embedded in this text export]\n${message.imageReport.description}`:'';
   return `${speaker}${message.createdAt?` (${message.createdAt})`:''}\n${text}${image}${message.error?`\n[Incomplete or failed reply: ${message.error}]`:''}`;
 });
 return `${title}\n\n${sections.join('\n\n')}\n`;
}
