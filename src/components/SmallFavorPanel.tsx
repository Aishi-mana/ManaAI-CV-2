import {createPortal} from 'react-dom';
import {useEffect,useState} from 'react';
import {smallFavors} from '../core/smallFavors';
import {residentProfiles} from '../core/residentProfiles';
import {useSceneLine,SCENE_BUBBLE_MS} from './SceneVoice';
import type {SmallFavor} from './useSmallFavors';

export default function SmallFavorPanel({favor,speaker,onAccept,onAnswer,onDismiss}:{favor:SmallFavor|undefined;speaker:Element|null|undefined;onAccept:()=>void;onAnswer:(id:string)=>void;onDismiss:()=>void}){
 const [showRequest,setShowRequest]=useState(false);
 useEffect(()=>{
  setShowRequest(favor?.stage==='offered');
  if(favor?.stage!=='offered')return;
  const timer=window.setTimeout(()=>setShowRequest(false),SCENE_BUBBLE_MS);
  return ()=>clearTimeout(timer);
 },[favor?.text,favor?.stage]);
 const reply=useSceneLine(favor?.stage==='completed'&&speaker?favor.choice.favor==='reading-company'?'Aishi just kept you company for a quiet reading break. Thank Aishi in one brief sentence. Do not claim you finished a book, received feedback, or learned a lasting preference.':`Aishi answered your small favor. Your request: ${favor.text} Aishi's actual answer: ${favor.answer}. Thank Aishi in one brief sentence. Do not claim a finished book, sketch, game, gift or project, or invent a lasting preference.`:undefined,favor?.choice.owner);
 if(!favor?.choice.favor)return null;
 const definition=smallFavors[favor.choice.favor],name=definition.owner==='mana'?'Mana':residentProfiles[definition.owner].name;
 const speech=favor.stage==='completed'?reply:showRequest?favor.text:undefined;
 return <>
  {speaker&&speech&&createPortal(<p className="manaverse-player-greeting scene-invitation-line scene-favor-line" role="status">{speech}</p>,speaker)}
  <section className="small-favor-panel" aria-label="Small favor">
   <strong>{definition.title}</strong>
   {favor.stage==='offered'?<><p>{favor.text}</p><p className="hint-soft">Only if you feel like it. No deadline.</p><button className="btn" type="button" onClick={onAccept}>{favor.choice.favor==='reading-company'?`Keep ${name} company`:`Help ${name}`}</button><button className="btn" type="button" onClick={onDismiss}>Not now</button></>:
    favor.stage==='helping'?<><p role="status">Walking over to {name}…</p><button className="btn" type="button" onClick={onDismiss}>Cancel</button></>:
    favor.stage==='sharing'?<><p role="status">Sharing a quiet reading break with {name}.</p><button className="btn" type="button" onClick={onDismiss}>Leave the favor</button></>:
    favor.stage==='answering'?<><p>What would you suggest?</p>{definition.answers.map(answer=><button className="btn" type="button" key={answer.id} onClick={()=>onAnswer(answer.id)}>{answer.label}</button>)}<button className="btn" type="button" onClick={onDismiss}>Skip</button></>:
     <p role="status">{favor.choice.favor==='reading-company'?`Shared a quiet reading break with ${name}.`:`Shared your answer with ${name}: ${favor.answer}`}</p>}
  </section>
 </>;
}
