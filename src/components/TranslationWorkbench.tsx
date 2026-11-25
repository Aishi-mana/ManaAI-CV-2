import {useState} from 'react';
import {
 approximateEnglishSyllables,TRANSLATION_LINE_LIMIT,TRANSLATION_PROJECT_LIMIT,
 TRANSLATION_VERSION_LIMIT,type AdaptationRightsBasis,type TranslationProject,
 type TranslationEditField,
} from '../core/translationWorkbench';

interface Props{
 projects:TranslationProject[];
 busy:boolean;
 drafting:boolean;
 status:string;
 onCreate:(title:string,source:string,basis:AdaptationRightsBasis,acknowledged:boolean)=>void;
 onDraft:(id:string)=>void;
 onStop:()=>void;
 onEdit:(id:string,index:number,field:TranslationEditField,value:string|number)=>void;
 onSaveVersion:(id:string)=>void;
 onRestoreVersion:(id:string,versionId:string)=>void;
 onRemove:(id:string)=>void;
}
export default function TranslationWorkbench({
 projects,busy,drafting,status,onCreate,onDraft,onStop,onEdit,onSaveVersion,onRestoreVersion,onRemove,
}:Props){
 const [title,setTitle]=useState('');
 const [source,setSource]=useState('');
 const [rightsBasis,setRightsBasis]=useState<AdaptationRightsBasis|''>('');
 const [acknowledged,setAcknowledged]=useState(false);
 const [selectedId,setSelectedId]=useState('');
 const [formError,setFormError]=useState('');
 const selected=projects.find(project=>project.id===selectedId)??projects[0];
 const existingEnglish=selected?.lines.some(line=>!!line.english.trim())??false;
 const canCreate=!busy&&!!title.trim()&&!!source.trim()&&!!rightsBasis&&acknowledged&&
  projects.length<TRANSLATION_PROJECT_LIMIT;
 return <section className="songbook-translation" aria-label="English Lyric Translation Workbench">
  <div className="songbook-translation-heading">
   <div>
    <span className="songbook-eyebrow">PHASE 3A · MANUAL ADAPTATION</span>
    <h2>English Lyric Translation Workbench</h2>
    <p className="songbook-muted">Give Mana Japanese lyrics you are authorized to adapt. She suggests English lines; you refine their meaning, rhythm, and rhyme before saving versions.</p>
   </div>
   <span className="songbook-small-status">{projects.length} / {TRANSLATION_PROJECT_LIMIT} drafts</span>
  </div>
  <p className="songbook-translation-boundary">Text-only drafts. Mana does not fetch lyrics, check permissions, detect the melody, translate sung audio, or generate a guide singer in this phase. No existing weekly song or cover schedule is affected.</p>
  <details className="songbook-translation-create" open={projects.length===0?true:undefined}>
   <summary>Start a Japanese → English adaptation</summary>
   <form onSubmit={event=>{
    event.preventDefault();setFormError('');
    if(!canCreate){setFormError('Add source lyrics and confirm adaptation permission first.');return;}
    onCreate(title,source,rightsBasis as AdaptationRightsBasis,true);
    setTitle('');setSource('');setRightsBasis('');setAcknowledged(false);
   }}>
    <label className="songbook-translation-field">Working song title
     <input value={title} onChange={event=>setTitle(event.target.value)}
      maxLength={120} placeholder="Your song or working title" disabled={busy}/>
    </label>
    <label className="songbook-translation-field">Your authorized Japanese lyric excerpt
     <textarea value={source} onChange={event=>setSource(event.target.value)}
      maxLength={5000} rows={6} disabled={busy}
      placeholder="Paste 1–16 lines from lyrics you have permission to translate. Work a verse at a time."/>
    </label>
    <small className="songbook-muted">Up to {TRANSLATION_LINE_LIMIT} nonempty lines per project. Original text stays in the local Songbook state; it is sent only to Mana's local language model when you request a draft.</small>
    <label className="songbook-translation-field">Your basis for translation/adaptation permission
     <select value={rightsBasis} disabled={busy} onChange={event=>{
      setRightsBasis(event.target.value as AdaptationRightsBasis|'');setAcknowledged(false);
     }}>
      <option value="">Select a rights basis…</option>
      <option value="owned">I own/control the adaptation rights</option>
      <option value="licensed">I have express permission to translate/adapt</option>
      <option value="public-domain">The supplied lyrics are verified public domain</option>
     </select>
    </label>
    <label className="songbook-cover-ack">
     <input type="checkbox" checked={acknowledged} disabled={busy}
      onChange={event=>setAcknowledged(event.target.checked)}/>
     I have checked that I may make an English adaptation of these specific lyrics. I understand Mana does not verify permissions.
    </label>
    <button className="btn primary" type="submit" disabled={!canCreate}>Create translation draft</button>
    {formError&&<p className="msg-error" role="alert">{formError}</p>}
   </form>
  </details>
  {selected&&<>
   <div className="songbook-translation-project-header">
    <label className="songbook-translation-field">Saved adaptation projects
     <select value={selected.id} disabled={busy} onChange={event=>setSelectedId(event.target.value)}>
      {projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}
     </select>
    </label>
    <span className="songbook-translation-muted">Permission basis: {selected.rightsBasis.replace('-', ' ')} (owner-declared)</span>
   </div>
   <div className="songbook-translation-actions">
    <button className="btn primary" disabled={busy} type="button" onClick={()=>{
     if(existingEnglish&&!window.confirm('Mana’s new English suggestion will replace the current working lines. Save a version first if you want to keep them. Continue?'))return;
     onDraft(selected.id);
    }}>Ask Mana for English draft</button>
    <button className="btn" disabled={busy||!existingEnglish||selected.versions.length>=TRANSLATION_VERSION_LIMIT}
     type="button" onClick={()=>onSaveVersion(selected.id)}>Save current version</button>
    {drafting&&<button className="btn" type="button" onClick={onStop}>Stop drafting</button>}
   </div>
   <p className="songbook-muted">Targets are optional estimated English syllables per line (0 = unset). Counts are approximate, not beat timing or a promise that a line fits the melody.</p>
   <div className="songbook-translation-lines">
    {selected.lines.map((line,index)=>{
     const estimated=approximateEnglishSyllables(line.english);
     return <article className="songbook-translation-line" key={index}>
      <div className="songbook-translation-line-head">
       <strong>Line {index+1}</strong>
       <span className="songbook-translation-muted">{line.english?('≈ '+estimated+' English syllables'):'Awaiting English draft'}</span>
      </div>
      <div className="songbook-translation-line-grid">
       <div className="songbook-translation-original" aria-label={'Japanese source line '+(index+1)}>
        <small>Japanese source (read-only)</small>
        <p lang="ja">{line.source}</p>
       </div>
       <label className="songbook-translation-field">
        English adaptation
        <textarea value={line.english} disabled={busy} rows={3} maxLength={250}
         aria-label={'English adaptation line '+(index+1)}
         onChange={event=>onEdit(selected.id,index,'english',event.target.value)}
         placeholder="Singable English phrase…"/>
       </label>
      </div>
      <div className="songbook-translation-line-tail">
       <label className="songbook-translation-field">
        Target syllables
        <input type="number" min={0} max={30} step={1} value={line.targetSyllables}
         disabled={busy} aria-label={'Target English syllables line '+(index+1)}
         onChange={event=>{
          const value=Number(event.target.value);
          if(Number.isInteger(value)&&value>=0&&value<=30)onEdit(selected.id,index,'targetSyllables',value);
         }}/>
       </label>
       <label className="songbook-translation-field">
        Rhyme / phrasing notes
        <input value={line.note} disabled={busy} maxLength={200}
         aria-label={'Phrasing note line '+(index+1)}
         onChange={event=>onEdit(selected.id,index,'note',event.target.value)}
         placeholder="Meaning, stressed vowel, possible rhyme…"/>
       </label>
       {line.targetSyllables>0&&line.english.trim()&&
        <small className="songbook-translation-muted">Estimated difference: {estimated-line.targetSyllables>0?'+':''}{estimated-line.targetSyllables}</small>}
      </div>
     </article>;
    })}
   </div>
   <div className="songbook-translation-versions">
    <h3>Saved English versions</h3>
    {selected.versions.length===0?<p className="songbook-muted">No snapshot yet. Edit the English lines, then save a version to keep a revision for comparison.</p>:
    selected.versions.map(version=><div key={version.id} className="songbook-translation-version">
     <div><strong>{version.label}</strong>
      <p className="songbook-muted">{new Date(version.createdAt).toLocaleString()} · {version.lines.filter(line=>line.english.trim()).length} translated lines</p>
     </div>
     <button className="btn" type="button" disabled={busy} onClick={()=>{
      if(window.confirm('Restore '+version.label+' into the working lines? Current edits will be replaced, but other saved versions remain.'))
       onRestoreVersion(selected.id,version.id);
     }}>Restore to editor</button>
    </div>)}
   </div>
   <button className="btn" type="button" disabled={busy} onClick={()=>{
    if(window.confirm('Remove this draft and all its saved versions? This cannot be undone.')){onRemove(selected.id);setSelectedId('');}
   }}>Remove translation draft</button>
  </>}
  {status&&<p className="songbook-translation-status" role="status" aria-live="polite">{status}</p>}
 </section>;
}
