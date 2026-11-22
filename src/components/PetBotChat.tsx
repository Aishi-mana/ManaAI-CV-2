import {SCENE_BUBBLE_MS} from './SceneVoice';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {ROOM_ART,sharedRoomActorDepth,type RoomObject} from '../core/companionRoom';
import {usePetBotRoam} from './usePetBotRoam';
import type {StreetPoint} from '../core/manaverseStreet';
import type {RoomContact} from '../core/roomPhone';

export default function PetBotChat({memory, ready, roomContext, objects, entry, exit, onArrive, editing, pause, bedtime, returnToCharge, characterChatOpen, onOpen, onReply, onMemory,visitor}: {
  visitor?:RoomContact;
  memory: string[];
  ready: boolean;
  roomContext: string;
  objects: readonly RoomObject[];
  entry?: StreetPoint;
  exit?: StreetPoint;
  onArrive: () => void;
  editing: boolean;
  pause: boolean;
  bedtime: boolean;
  returnToCharge: boolean;
  characterChatOpen: boolean;
  onOpen: () => void;
  onReply: (message: string, memory: string[], signal: AbortSignal, roomContext: string) => Promise<{reply:string;memory?:string}>;
  onMemory: (fact: string) => void;
}) {
  const {point:feet,facing,charging}=usePetBotRoam(objects,entry,exit,onArrive,pause,returnToCharge);
  const left=`${feet.x/799*100}%`;
  const anchor={'--thought-x':left,'--thought-y':`${(feet.y-49)/698*100}%`} as CSSProperties;
  const spriteStyle={left,top:`${feet.y/698*100}%`,width:`${49/799*100}%`,transform:'translate(-50%, -100%)',zIndex:sharedRoomActorDepth(feet)};
  const pending = useRef<AbortController | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [line, setLine] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const ambient = useRef<() => void>(()=>{});
  const greetedVisitor=useRef<RoomContact|undefined>(undefined);

  async function speak(text?: string) {
    if (!ready || bedtime || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setWaiting(true);
    setError('');
    try {
      const result = await onReply(text ?? '', memory, controller.signal, roomContext);
      controller.signal.throwIfAborted();
      setLine(result.reply);
      if (text) {
        if (result.memory) onMemory(result.memory);
        setMessage('');
      }
    } catch (failure) {
      if (text && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Pet Bot could not reply.');
    } finally {
      pending.current = undefined;
      if (!controller.signal.aborted) setWaiting(false);
    }
  }

  useEffect(()=>{ ambient.current=()=>{void speak();}; });
  useEffect(()=>{
    if(!visitor){greetedVisitor.current=undefined;return;}
    if(!ready||bedtime||open||waiting||characterChatOpen||greetedVisitor.current===visitor)return;
    greetedVisitor.current=visitor;
    ambient.current();
  },[visitor,ready,bedtime,open,waiting,characterChatOpen]);
  useEffect(()=>()=>pending.current?.abort(), []);
  useEffect(()=>{
    if (!ready || bedtime || open || waiting || characterChatOpen) return;
    const timer=window.setInterval(()=>{
      if (document.visibilityState==='visible') ambient.current();
    }, 90_000);
    return ()=>window.clearInterval(timer);
  }, [ready, bedtime, open, waiting, characterChatOpen]);
  useEffect(()=>{
    if (!line || open) return;
    const timer=window.setTimeout(()=>setLine(''), SCENE_BUBBLE_MS);
    return ()=>window.clearTimeout(timer);
  }, [line, open]);

  useEffect(()=>{
    if(!characterChatOpen&&!bedtime)return;
    pending.current?.abort();
    setOpen(false);
    setLine('');
    setWaiting(false);
  },[characterChatOpen,bedtime]);

  if(editing)return null;
  const label=charging?'Pet Bot is charging':bedtime?'Pet Bot is heading to its charging spot':'Talk to Pet Bot';
  return <>
   <button type="button" className="companion-room-object" data-room-object="pet-bot" data-charging={charging||undefined} style={spriteStyle}
    aria-label={label} aria-expanded={!bedtime&&open} aria-disabled={bedtime||undefined} title={label} onClick={event=>{
      event.stopPropagation();
      if(bedtime)return;
      if(!open)onOpen();
      setOpen(!open);
    }}>
    <img src={ROOM_ART+'pet_bot.png'} style={{scale:`${facing} 1`}} alt="" draggable={false}/>
    {charging&&<span className="pet-bot-charge-icon" aria-hidden="true">ϟ</span>}
   </button>
   {(!bedtime&&!characterChatOpen&&(open||line||waiting))&&<div className={`companion-room-thought pet-bot-overlay ${open?'scene-open-chat':'scene-pet-line'}`} style={anchor}>
    <div className="pet-bot-bubble" onClick={event=>event.stopPropagation()} onKeyDown={event=>{
      if(event.key==='Escape'&&open){event.preventDefault();setOpen(false);}
      event.stopPropagation();
    }}>
      <div role="status">{waiting?'…':line}</div>
      {open&&<form onSubmit={event=>{
        event.preventDefault();
        const text=message.trim();
        if(text)void speak(text);
      }}>
        <input aria-label="Talk to Pet Bot" placeholder="Talk to Pet Bot" value={message} maxLength={400}
          onChange={event=>setMessage(event.target.value)} autoFocus/>
        <button className="btn" disabled={!ready||waiting||!message.trim()}>Send</button>
        <button className="btn" type="button" aria-label="Close Pet Bot chat" onClick={()=>setOpen(false)}>×</button>
        {!ready&&!waiting&&<small>Pet Bot is waiting for the chat model.</small>}
        {error&&<small role="alert">{error}</small>}
      </form>}
    </div>
   </div>}
  </>;
}
