import type { DiaryEntry } from "../core/diary";
import ExportDiaryButton from './ExportDiaryButton';
import { journalClock, validJournalTime } from "../core/dailyJournal";
import type { JournalState } from "../core/dailyJournal";
export default function DiaryDrawer({ name, entries, draft, generating, ready, error, onDraft, onReflect, onStop, onSave, onDelete, onClose, journal, onJournal, journalStatus, dailyWriting, onDaily, onRewrite, onRestore, onPurge }: {
  onRewrite:()=>void; onRestore:(id:string)=>void; onPurge:(id:string)=>void;
  name: string; entries: DiaryEntry[]; draft: string; generating: boolean; ready: boolean; error: string;
  onDraft: (text: string) => void; onReflect: () => void; onStop: () => void; onSave: () => void; onDelete: (id: string) => void; onClose: () => void;
  journal: JournalState; onJournal: (state: JournalState) => void; journalStatus: string; dailyWriting: string | null; onDaily: () => void;
}) {
  const active=entries.filter((e)=>!e.deletedAt);
  const deleted=entries.filter((e)=>!!e.deletedAt);
  const today = journalClock(new Date(), journal.timeZone).date;
  const todayComplete = journal.completedDates.includes(today) || active.some((e) => e.journalDate === today);
  return <><div className="scrim" onClick={onClose} /><section className="drawer" role="dialog" aria-label="Diary">
    <header className="drawer-head"><h2>{name}'s diary</h2><button className="btn" onClick={onClose}>Close</button></header>
    <div className="drawer-body">
      <h3>Daily journal</h3>
      <label className="check"><input type="checkbox" checked={journal.enabled} onChange={(e) => onJournal({ ...journal,enabled:e.target.checked })} /><span>Let {name} write and save one journal entry each day</span></label>
      <label className="field"><span>Writing time ({journal.timeZone})</span><input type="time" value={journal.time} onChange={(e) => { if (validJournalTime(e.target.value)) onJournal({ ...journal,time:e.target.value }); }} /></label>
      <p className="hint-soft">Writes automatically while Mana is open and the model is ready. Waits for chat to finish and two minutes of quiet. Missed days with recorded conversations catch up on the next launch; quiet offline days are skipped.</p>
      <button className="btn" disabled={!ready || generating || !!draft || todayComplete} onClick={onDaily}>Write today's journal now</button>
      {todayComplete && <p className="hint-soft">Today is marked as journaled. You can rewrite it using available recorded chat.</p>}
      <button className="btn" disabled={!ready || generating || !!draft} onClick={onRewrite}>Rewrite today's journal</button>
      <p className="hint-soft">Rewriting creates new text from available evidence. A current entry moves to Recently deleted after success. Missing original wording cannot be recovered.</p>
      {!todayComplete && !!draft && <p className="hint-soft">Save or clear the reflection draft before writing today's journal.</p>}
      <p role="status">{journalStatus}</p>
      <h3>Manual reflection</h3><p className="hint-soft">Create and review an additional reflection draft. Diary entries remain separate from chat and memory recall.</p>
      <div className="chips"><button className="btn primary" disabled={!ready || generating} onClick={onReflect}>Reflect now</button>{generating && <button className="btn" onClick={onStop}>Stop reflection</button>}</div>
      {!ready && !generating && <p className="hint-soft">Start the model and finish the current chat reply before reflecting.</p>}
      {error && <p className="msg-error" role="alert">{error}</p>}
      {(draft || generating && !dailyWriting) && <><label className="field"><span>Reflection draft</span><textarea rows={8} maxLength={10000} disabled={generating} value={draft} onChange={(e) => onDraft(e.target.value)} /></label><button className="btn primary" disabled={generating || !draft.trim()} onClick={onSave}>Save diary entry</button></>}
      <p className="hint-soft">New daily entries retain their sampled chat evidence, so a rewrite can use it even after chat is cleared. Permanently deleting the entry also removes those excerpts.</p>
      <h3>Saved entries ({active.length})</h3>{!active.length && <p className="hint-soft">No diary entries yet.</p>}
      <ExportDiaryButton entries={active} name={name} all/>
      <p className="hint-soft">Text copies save to exports\diary. Includes dates, moods and entry text; Recently deleted and recorded chat evidence are excluded.</p>
      {[...active].reverse().map((entry) => <article className="memory-card" key={entry.id}><strong>{entry.journalDate ? `Daily journal — ${entry.journalDate}` : "Reflection"}</strong><p className="hint-soft">Written {new Date(entry.createdAt).toLocaleString()}</p><p className="memory-content">{entry.content}</p><p className="hint-soft">Mood: {entry.mood} · Sources: {entry.sourceMessageIds.length} chat messages, {entry.sourceMemoryIds.length} memories</p>{!!entry.sourceMessages?.length&&<details><summary>Recorded chat evidence ({entry.sourceMessages.length} excerpts)</summary>{entry.sourceMessages.map(message=><div key={message.id}><strong>{message.role==="user"?"You":name}</strong><p className="memory-content">{message.content}</p><p className="hint-soft">{message.createdAt?new Date(message.createdAt).toLocaleString():""}</p></div>)}</details>}<ExportDiaryButton entries={[entry]} name={name}/><button className="btn" onClick={() => { if (window.confirm("Move this diary entry to Recently deleted?")) onDelete(entry.id); }}>Delete</button></article>)}
      <h3>Recently deleted ({deleted.length})</h3>{[...deleted].reverse().map((entry)=><article className="memory-card" key={entry.id}><strong>{entry.journalDate?`Daily journal — ${entry.journalDate}`:"Reflection"}</strong><p className="hint-soft">Deleted {new Date(entry.deletedAt!).toLocaleString()}</p><details><summary>View entry</summary><p className="memory-content">{entry.content}</p></details><button className="btn" disabled={generating} onClick={()=>onRestore(entry.id)}>Restore</button><button className="btn" disabled={generating} onClick={()=>{if(window.confirm("Permanently delete this entry? It cannot be restored."))onPurge(entry.id);}}>Delete permanently</button></article>)}
    </div></section></>;
}
