import {useEffect,useState} from 'react';
import {
 parseMidiFile,guideReady,englishRevision,MIDI_MAX_BYTES,
 type MidiPhraseFile,type MelodyRightsBasis,
} from '../core/midiMelody';
import type {TranslationProject} from '../core/translationWorkbench';
import type {MelodyEditField} from '../core/melodyGuide';

interface Props{
 project:TranslationProject;busy:boolean;
 onImport:(id:string,file:MidiPhraseFile,track:number,name:string,basis:MelodyRightsBasis,ack:boolean)=>boolean;
 onEdit:(id:string,note:number,field:MelodyEditField,value:string|number)=>void;
 onSeed:(id:string,fromLine:number,toLine:number)=>void;
 onSync:(id:string)=>void;
 onReview:(id:string)=>void;
 onRemove:(id:string)=>void;
 onExport:(id:string)=>void;
}
export default function MelodyGuidePanel({project,busy,onImport,onEdit,onSeed,onSync,
 onReview,onRemove,onExport}:Props){
 const [midi,setMidi]=useState<MidiPhraseFile|null>(null);
 const [midiName,setMidiName]=useState('');
 const [track,setTrack]=useState(0);
 const [rightsBasis,setRightsBasis]=useState<MelodyRightsBasis|''>('');
 const [ack,setAck]=useState(false);
 const [error,setError]=useState('');
 const [firstLine,setFirstLine]=useState(0);
 const [lastLine,setLastLine]=useState(project.lines.length-1);
 useEffect(()=>{setMidi(null);setMidiName('');setTrack(0);setRightsBasis('');
  setAck(false);setError('');setFirstLine(0);setLastLine(project.lines.length-1);
 },[project.id]);
 const guide=project.melody;
 const stale=!!guide&&guide.englishRevision!==englishRevision(project.lines);
 const ready=guideReady(guide,project.lines);
 const fullEnd=guide?Math.max(1,guide.notes[guide.notes.length-1].position+
  guide.notes[guide.notes.length-1].duration):1;
 const low=guide?Math.min(...guide.notes.map(n=>n.tone)):48;
 const high=guide?Math.max(...guide.notes.map(n=>n.tone)):72;
 async function selectMidi(file:File|undefined){
  setMidi(null);setError('');setMidiName('');
  if(!file)return;
  if(!/\.mid(?:i)?$/i.test(file.name)||file.size>MIDI_MAX_BYTES){
   setError('Choose a local .mid or .midi file smaller than 1 MB.');return;
  }
  try{
   const bytes=new Uint8Array(await file.arrayBuffer());
   const result=parseMidiFile(bytes);
   setMidi(result);setMidiName(file.name);setTrack(result.tracks[0].trackIndex);
  }catch(e){setError('Unable to read MIDI melody: '+String(e));}
 }
 return <section className="songbook-melody" aria-label="Phase 3B melody and timing guide">
  <div className="songbook-translation-heading">
   <div><span className="songbook-eyebrow">PHASE 3B · MIDI TO SINGING GUIDE</span>
    <h3>Give the English lyrics a melody</h3>
    <p className="songbook-muted">Choose a short, authorized monophonic MIDI melody. Match words or syllables to its notes, review pitch and timing, then export an editable OpenUtau project.</p>
   </div>
   <span className="songbook-small-status">{guide?'Melody loaded':'No melody yet'}</span>
  </div>
  <p className="songbook-translation-boundary">No automatic audio-to-MIDI transcription or singer is installed by this feature. Importing a MIDI does not establish song rights. OpenUtau needs an English-capable voicebank, phonemizer and renderer to produce a real singing-guide WAV.</p>
  <details className="songbook-translation-create">
   <summary>{guide?'Replace imported melody':'Import a melody MIDI'}</summary>
   <div className="songbook-melody-import">
    <label className="songbook-translation-field">Select an authorized, lead-only MIDI file
     <input type="file" accept=".mid,.midi,audio/midi,audio/x-midi" disabled={busy}
      onChange={event=>void selectMidi(event.target.files?.[0])}/>
    </label>
    {midi&&<>
     <label className="songbook-translation-field">Monophonic MIDI track
      <select value={track} disabled={busy}
       onChange={event=>setTrack(Number(event.target.value))}>
       {midi.tracks.map(candidate=><option key={candidate.trackIndex} value={candidate.trackIndex}>
        {candidate.name} · {candidate.notes.length} notes
       </option>)}
      </select>
     </label>
     <small className="songbook-muted">Time signature {midi.signature.beatPerBar}/{midi.signature.beatUnit}, {midi.tempos.length} tempo event(s). Mana does not guess which track is the main vocal melody.</small>
    </>}
    <label className="songbook-translation-field">Composition / melody rights basis
     <select value={rightsBasis} disabled={busy} onChange={event=>{
      setRightsBasis(event.target.value as MelodyRightsBasis|'');setAck(false);
     }}>
      <option value="">Choose your basis…</option>
      <option value="owned">I own/control this melody</option>
      <option value="licensed">I have permission to adapt/use the melody</option>
      <option value="public-domain">The melody is verified public domain</option>
     </select>
    </label>
    <label className="songbook-cover-ack">
     <input type="checkbox" checked={ack} disabled={busy}
      onChange={event=>setAck(event.target.checked)}/>
     I have reviewed my permission to use this specific MIDI melody with the English adaptation.
    </label>
    <button className="btn primary" type="button"
     disabled={busy||!midi||!rightsBasis||!ack}
     onClick={()=>{
      if(!midi||!rightsBasis||!ack)return;
      if(guide&&!window.confirm('Replace the existing note guide? Its manual note lyrics and timing edits will be lost. Continue?'))return;
      if(onImport(project.id,midi,track,midiName,rightsBasis,true)){
       setMidi(null);setMidiName('');setAck(false);setRightsBasis('');setError('');
      }else setError('Melody could not be imported. Review the Songbook status.');
     }}>
     Use selected melody track
    </button>
   </div>
  </details>
  {error&&<p className="msg-error" role="alert">{error}</p>}
  {guide&&<>
   <div className="songbook-melody-info">
    <strong>{guide.trackName}</strong>
    <small>{guide.sourceName} · {guide.notes.length} monophonic notes ·
     {guide.signature.beatPerBar}/{guide.signature.beatUnit} ·
     {guide.tempos.map(x=>x.bpm).join(' → ')} BPM ·
     melody rights: {guide.rightsBasis} (owner-declared)</small>
   </div>
   <div className="songbook-melody-roll" aria-label="Melody pitch-and-timing overview">
    {guide.notes.map((note,i)=><span key={i}
     title={'MIDI '+note.tone+', beat '+(note.position/480).toFixed(2)+', length '+(note.duration/480).toFixed(2)}
     style={{left:(note.position/fullEnd*100)+'%',
      width:Math.max(.25,note.duration/fullEnd*100)+'%',
      bottom:((note.tone-low)/Math.max(1,high-low)*84+6)+'%'}}/>)}
   </div>
   <div className="songbook-melody-seed">
    <label className="songbook-translation-field">English phrase starts at
     <select value={firstLine} disabled={busy} onChange={event=>{
      const n=Number(event.target.value);setFirstLine(n);if(lastLine<n)setLastLine(n);
     }}>
      {project.lines.map((_,i)=><option value={i} key={i}>Line {i+1}</option>)}
     </select>
    </label>
    <label className="songbook-translation-field">English phrase ends at
     <select value={lastLine} disabled={busy} onChange={event=>setLastLine(Number(event.target.value))}>
      {project.lines.map((_,i)=><option key={i} value={i} disabled={i<firstLine}>Line {i+1}</option>)}
     </select>
    </label>
    <button className="btn" disabled={busy} type="button" onClick={()=>{
     if(window.confirm('Roughly place English words onto the notes? Existing note lyrics will be replaced, and you must check every note afterward.'))
      onSeed(project.id,firstLine,lastLine);
    }}>Seed English words (rough)</button>
   </div>
   <p className="songbook-muted">Each note has a pitch (MIDI 60 = C4), start tick and duration tick (480 ticks = 1 quarter note), source line, and editable English lyric/syllable. OpenUtau uses <code>+</code> for the next syllable and <code>+~</code> for holding the current one. Seeding is approximate and may put words on the wrong notes.</p>
   <div className="songbook-melody-notes">
    <div className="songbook-melody-note-head" aria-hidden="true">
     <span>Note</span><span>Pitch</span><span>Start tick</span><span>Length</span><span>English syllable</span><span>Source line</span>
    </div>
    {guide.notes.map((note,index)=><div className="songbook-melody-note" key={index}>
     <strong>{index+1}</strong>
     <input aria-label={'MIDI pitch note '+(index+1)} type="number" min={0} max={127}
      step={1} value={note.tone} disabled={busy}
      onChange={event=>onEdit(project.id,index,'tone',Number(event.target.value))}/>
     <input aria-label={'Start tick note '+(index+1)} type="number" min={0} max={245760}
      step={1} value={note.position} disabled={busy}
      onChange={event=>onEdit(project.id,index,'position',Number(event.target.value))}/>
     <input aria-label={'Duration tick note '+(index+1)} type="number" min={1} max={245760}
      step={1} value={note.duration} disabled={busy}
      onChange={event=>onEdit(project.id,index,'duration',Number(event.target.value))}/>
     <input aria-label={'English syllable note '+(index+1)} value={note.lyric}
      maxLength={60} disabled={busy} placeholder="word, + or +~"
      onChange={event=>onEdit(project.id,index,'lyric',event.target.value)}/>
     <select aria-label={'English source line note '+(index+1)} value={note.lineIndex}
      disabled={busy} onChange={event=>onEdit(project.id,index,'lineIndex',Number(event.target.value))}>
      {project.lines.map((_,i)=><option key={i} value={i}>{i+1}</option>)}
     </select>
    </div>)}
   </div>
   {stale&&<p className="songbook-translation-boundary" role="status">
    English lyrics changed since this note map was prepared. Review and resync before exporting.
    <button className="btn" type="button" disabled={busy} onClick={()=>{
     if(window.confirm('Keep MIDI notes but mark them as needing review against the newest English lyrics?'))onSync(project.id);
    }}>Sync to current English (review required)</button>
   </p>}
   <div className="songbook-melody-actions">
    <button className="btn" type="button" disabled={busy||stale||guide.notes.some(x=>!x.lyric.trim())}
     onClick={()=>onReview(project.id)}>
     Confirm note lyrics and timing reviewed
    </button>
    <button className="btn primary" type="button" disabled={busy||!ready}
     onClick={()=>onExport(project.id)}>
     Save OpenUtau guide (.ustx)
    </button>
    <button className="btn" type="button" disabled={busy} onClick={()=>{
     if(window.confirm('Remove the imported MIDI note guide? English drafts and versions will remain.'))
      onRemove(project.id);
    }}>Remove MIDI guide</button>
   </div>
   <p className="songbook-muted">{ready?
    'Ready to export an UNRENDERED OpenUtau project. Select an English-capable singer and phonemizer in OpenUtau, listen and correct pronunciation, then use File → Export Audio → Export wav Files.':
    'Not export-ready: every note needs a syllable/hold and you must explicitly review the current English mapping.'}</p>
  </>}
 </section>;
}
