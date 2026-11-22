import {SCENE_BUBBLE_MS} from './SceneVoice';
import {useEffect,useRef,useState,type CSSProperties} from 'react';

export default function ManaRoomSpeech({name='Mana',open,onClose,ready,context,anchor,fallback,onThought,onChat}:{
 name?:string;
 open:boolean;onClose:()=>void;ready:boolean;context:string;anchor:CSSProperties;fallback?:string;
 onThought?:(context:string,signal:AbortSignal)=>Promise<string>;
 onChat:(message:string,context:string,onReply:(reply:string)=>void,signal:AbortSignal)=>Promise<void>;
}){
 const [line,setLine]=useState('');
 const [message,setMessage]=useState('');
 const [sending,setSending]=useState(false);
 const [error,setError]=useState('');
 const ambient=useRef<AbortController|undefined>(undefined);
 const sendingController=useRef<AbortController|undefined>(undefined);
 const latest=useRef({open,ready,context,onThought});
 useEffect(()=>{latest.current={open,ready,context,onThought};},[open,ready,context,onThought]);
 useEffect(()=>{
  const timer=window.setInterval(()=>{
   const current=latest.current;
   if(current.open||!current.ready||!current.onThought||ambient.current||document.visibilityState!=='visible')return;
   const controller=new AbortController();
   ambient.current=controller;
   void current.onThought(current.context,controller.signal).then(reply=>{
    if(reply&&!controller.signal.aborted&&!latest.current.open)setLine(reply);
   }).catch(()=>{}).finally(()=>{if(ambient.current===controller)ambient.current=undefined;});
  },75_000);
  return ()=>{window.clearInterval(timer);ambient.current?.abort();sendingController.current?.abort();};
 },[]);
 useEffect(()=>{
  if(!line||open)return;
  const timer=window.setTimeout(()=>setLine(''),SCENE_BUBBLE_MS);
  return ()=>window.clearTimeout(timer);
 },[line,open]);

 async function send(){
  const text=message.trim();
  if(!ready||sendingController.current||!text)return;
  const controller=new AbortController();
  sendingController.current=controller;
  setSending(true);
  setError('');
  let received=false;
  try{
   await onChat(text,context,reply=>{
    if(!reply||controller.signal.aborted)return;
    received=true;
    setLine(reply);
    setMessage('');
   },controller.signal);
   if(!received&&!controller.signal.aborted)setError(`${name} couldn’t finish her reply.`);
  }catch{
   if(!controller.signal.aborted)setError(`${name} couldn’t finish her reply.`);
  }finally{
   sendingController.current=undefined;
   if(!controller.signal.aborted)setSending(false);
  }
 }

 function closeChat(){
  sendingController.current?.abort();
  setSending(false);
  setLine('');
  setError('');
  onClose();
 }

 const speech=sending?'…':line||(open?'':fallback);
 if(!open&&!speech)return null;
 return <div className={`companion-room-thought pet-bot-overlay ${open?'scene-open-chat':'scene-ambient-line'}`} style={anchor}>
  <div className="pet-bot-bubble" onClick={event=>event.stopPropagation()} onKeyDown={event=>{
   if(event.key==='Escape'&&open){event.preventDefault();closeChat();}
   event.stopPropagation();
  }}>
   <div role="status">{speech}</div>
   {open&&<form onSubmit={event=>{event.preventDefault();void send();}}>
    <input aria-label={`Talk to ${name}`} placeholder={`Talk to ${name}`} autoFocus maxLength={400} value={message}
     onChange={event=>setMessage(event.target.value)}/>
    <button className="btn" disabled={!ready||sending||!message.trim()}>Send</button>
    <button type="button" className="btn" aria-label={`Close ${name}’s speech bubble`} onClick={closeChat}>×</button>
    {!ready&&!sending&&<small>Waiting for the chat model.</small>}
    {error&&<small role="alert">{error}</small>}
   </form>}
  </div>
 </div>;
}
