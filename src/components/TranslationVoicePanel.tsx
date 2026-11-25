import {useEffect,useState} from 'react';
import {guideReady} from '../core/midiMelody';
import type {TranslationProject} from '../core/translationWorkbench';
import type {GuideRecordingRightsBasis} from '../core/translationHandoff';

interface Props{
 project:TranslationProject;busy:boolean;unavailableReason:string;
 onPrepare:(id:string,guideRights:GuideRecordingRightsBasis,guideAcknowledged:boolean,
  withBacking:boolean,backingRights?:GuideRecordingRightsBasis,backingAcknowledged?:boolean)=>void;
}
export default function TranslationVoicePanel({project,busy,unavailableReason,onPrepare}:Props){
 const [basis,setBasis]=useState<GuideRecordingRightsBasis|''>('');
 const [ack,setAck]=useState(false);
 const [withBacking,setWithBacking]=useState(false);
 const [backingBasis,setBackingBasis]=useState<GuideRecordingRightsBasis|''>('');
 const [backingAck,setBackingAck]=useState(false);
 useEffect(()=>{
  setBasis('');setAck(false);setWithBacking(false);setBackingBasis('');setBackingAck(false);
 },[project.id]);
 const ready=guideReady(project.melody,project.lines);
 const allowed=ready&&!busy&&!unavailableReason&&!!basis&&ack&&
  (!withBacking||(!!backingBasis&&backingAck));
 return <section className="songbook-melody songbook-translation-voice" aria-label="Phase 3C English voice conversion">
  <div className="songbook-translation-heading">
   <div>
    <span className="songbook-eyebrow">PHASE 3C · ENGLISH GUIDE TO MANA'S VOICE</span>
    <h3>Let Mana sing the English adaptation</h3>
    <p className="songbook-muted">After rendering and listening to your OpenUtau project, choose its local WAV to convert the actual English singing—not the Japanese recording—into Mana's trained voice.</p>
   </div>
   <span className="songbook-small-status">{ready?'Note mapping reviewed':'Mapping needs review'}</span>
  </div>
  <p className="songbook-translation-boundary">OpenUtau must render the English guide WAV first. Mana cannot verify sung words, pitch accuracy, translation permission, voicebank license or instrumental rights. No audio is downloaded, published or generated from text in this step.</p>
  {!ready&&<p className="songbook-muted">First finish Phase 3A English lyrics and confirm your current Phase 3B note mapping. Updating words or notes requires another review before converting.</p>}
  <label className="songbook-translation-field">Rights to reuse the rendered OpenUtau vocals and selected voicebank
   <select value={basis} disabled={busy} onChange={event=>{setBasis(event.target.value as GuideRecordingRightsBasis|'');setAck(false);}}>
    <option value="">Select a rights basis…</option>
    <option value="owned">I own/control the required voicebank and recording rights</option>
    <option value="licensed">I have permission/license to convert and use this recording</option>
    <option value="public-domain">Voicebank and guide recording are verified public domain</option>
   </select>
  </label>
  <label className="songbook-cover-ack">
   <input type="checkbox" checked={ack} disabled={busy} onChange={event=>setAck(event.target.checked)}/>
   I rendered and reviewed an English singing guide for this project and have permission to convert and use it.
  </label>
  <label className="songbook-cover-ack">
   <input type="checkbox" checked={withBacking} disabled={busy} onChange={event=>setWithBacking(event.target.checked)}/>
   Also mix in a separately permitted, aligned instrumental backing WAV after Mana's voice conversion
  </label>
  {withBacking&&<>
   <label className="songbook-translation-field">Rights to the instrumental arrangement and recording
    <select value={backingBasis} disabled={busy} onChange={event=>{setBackingBasis(event.target.value as GuideRecordingRightsBasis|'');setBackingAck(false);}}>
     <option value="">Select a rights basis…</option>
     <option value="owned">I own/control the instrumental composition and recording rights</option>
     <option value="licensed">I have permission/license for this instrumental</option>
     <option value="public-domain">Both instrumental work and recording are verified public domain</option>
    </select>
   </label>
   <label className="songbook-cover-ack">
    <input type="checkbox" checked={backingAck} disabled={busy}
     onChange={event=>setBackingAck(event.target.checked)}/>
    I checked this particular instrumental's permissions and that it aligns with the singing guide.
   </label>
  </>}
  <button className="btn primary" type="button" disabled={!allowed}
   onClick={()=>{if(basis)onPrepare(project.id,basis,ack,withBacking,
    backingBasis||undefined,backingAck);}}>
   Choose rendered guide WAV &amp; open Music Studio
  </button>
  <p className="songbook-muted">Music Studio will use the trained Mana voice, with no re-translation or automatic note adjustment. Generate a preview, listen to the vocal or mix, then save only if you like it. The imported guide and any backing audio are retained separately.</p>
  {unavailableReason&&<p className="songbook-muted">{unavailableReason}</p>}
 </section>;
}
