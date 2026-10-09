import {useState} from 'react';
import {loadPersonality,savePersonality,personalityContext} from '../core/personality';

export default function PersonalityControls(){
 const [draft,setDraft]=useState(loadPersonality),[notice,setNotice]=useState('');
 return <section><h3>Consistent voice traits</h3><p className="hint-soft">Optional style guidance alongside the personality description. These traits do not change mood, bond or memories. Model adherence can vary.</p>
 <label className="check"><input type="checkbox" checked={draft.enabled} onChange={e=>{setDraft({...draft,enabled:e.target.checked});setNotice('');}}/>Use structured voice traits</label>
 {(['warmth','playfulness','curiosity','expressiveness'] as const).map(key=><label className="field" key={key}><span>{key[0].toUpperCase()+key.slice(1)}: {draft[key]}/100</span><input type="range" min={0} max={100} value={draft[key]} onChange={e=>{setDraft({...draft,[key]:Number(e.target.value)});setNotice('');}}/></label>)}
 <label className="field"><span>Reply length</span><select value={draft.verbosity} onChange={e=>{setDraft({...draft,verbosity:e.target.value as typeof draft.verbosity});setNotice('');}}><option value="brief">Brief</option><option value="balanced">Balanced</option><option value="detailed">Detailed when useful</option></select></label>
 <details><summary>Preview voice guidance</summary><p className="memory-content">{personalityContext(draft)||'Structured traits are off. The personality description still applies.'}</p></details>
 <button className="btn" onClick={()=>{try{savePersonality(draft);setNotice('Voice traits saved. Applies to the next generated reply.');}catch(e){setNotice(`Could not save: ${String(e)}`);}}}>Save voice traits</button><p role="status">{notice}</p></section>;
}
