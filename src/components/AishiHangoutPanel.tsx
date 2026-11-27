import {useState} from 'react';
import {aishiHangoutKinds,hangoutName,type AishiHangout,type AishiHangoutKind} from '../core/aishiHangouts';
import type {TownCharacter} from '../core/residentRelationships';
export default function AishiHangoutPanel({hangout,nearby,pending,message,ready,onInvite,onCancel}:{hangout?:AishiHangout;nearby:TownCharacter[];pending?:TownCharacter;message:string;ready:boolean;onInvite:(owner:TownCharacter,kind:AishiHangoutKind)=>void;onCancel:()=>void}){
 const [owner,setOwner]=useState<TownCharacter>(),[kind,setKind]=useState<AishiHangoutKind>('park');
 if(!hangout&&!nearby.length&&!pending&&!message)return null;
 return <section className="aishi-hangout-panel" aria-label="Invite someone to spend time together">
  {hangout?<><strong>{aishiHangoutKinds[hangout.kind].label} with {hangoutName(hangout.owner)}</strong><p role="status">{hangout.phase==='sharing'?'Spending time together.':`Walking to the meeting place. ${hangoutName(hangout.owner)} will follow their own route.`}</p><button className="btn" type="button" onClick={onCancel}>End hangout</button></>:
   pending?<><p role="status">Asking {hangoutName(pending)}…</p><button className="btn" type="button" onClick={onCancel}>Cancel invitation</button></>:
   nearby.length>0?<><strong>Invite someone</strong><div className="aishi-hangout-choices">{nearby.map(person=><button className="btn" type="button" key={person} aria-pressed={owner===person} onClick={()=>setOwner(person)}>{hangoutName(person)}</button>)}</div>
    {owner&&nearby.includes(owner)&&<><label>Spend time together <select aria-label="Hangout activity" value={kind} onChange={event=>setKind(event.target.value as AishiHangoutKind)}>{Object.entries(aishiHangoutKinds).map(([id,activity])=><option key={id} value={id}>{activity.label}</option>)}</select></label><button className="btn" type="button" disabled={!ready} onClick={()=>onInvite(owner,kind)}>Ask {hangoutName(owner)}</button><small>They may decline. Plans become memories only after you meet and finish.</small></>}
   </>:null}
  {message&&<p role="status">{message}</p>}
 </section>;
}
