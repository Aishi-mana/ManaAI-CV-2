import {VOICE_PROFILES,type VoiceProfileId} from '../core/voiceProfiles';
export default function VoiceProfileSelect(p:{label:string;value:VoiceProfileId;disabled?:boolean;onChange:(value:VoiceProfileId)=>void}){
 return <label className="field">{p.label}<select value={p.value} disabled={p.disabled} onChange={e=>p.onChange(e.target.value as VoiceProfileId)}>{VOICE_PROFILES.map(voice=><option key={voice.id} value={voice.id}>{voice.name}</option>)}</select></label>;
}
