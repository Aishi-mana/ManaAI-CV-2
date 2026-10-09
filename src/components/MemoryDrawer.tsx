import { useState } from "react";
import PersonalityControls from './PersonalityControls';
import type { Identity, Memory } from "../core/character";
import { memoryStrength, newMemory, updateMemory, validateIdentity } from "../core/character";
import type { MemorySuggestion } from "../core/memorySuggestions";

interface Props {
  charName: string;
  identity: Identity;
  memories: Memory[];
  suggestions: MemorySuggestion[];
  onReview: (id: string) => void;
  onIdentity: (identity: Identity) => void;
  onMemories: (memories: Memory[]) => void;
  onClose: () => void;
}

export default function MemoryDrawer({ charName, identity, memories, suggestions, onReview, onIdentity, onMemories, onClose }: Props) {
  const [tab, setTab] = useState<"memories" | "identity">("memories");
  const [draft, setDraft] = useState(identity);
  const [values, setValues] = useState(identity.values.join("\n"));
  const [interests, setInterests] = useState(identity.interests.join("\n"));
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Memory["category"]>("shared");
  const [importance, setImportance] = useState(3);
  const [notice, setNotice] = useState("");
  const reset = () => { setEditing(null); setContent(""); setCategory("shared"); setImportance(3); };
  function save() {
    if (!content.trim()) return;
    if (editing) onMemories(memories.map((m) => m.id === editing ? updateMemory(m, { content: content.trim(), category, importance }) : m));
    else onMemories([...memories, newMemory(content, category, importance)]);
    reset();
  }
  const visible = memories.filter((m) => m.content.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt));
  return <>
    <div className="scrim" onClick={onClose} />
    <section className="drawer" role="dialog" aria-label="Identity and memories">
      <header className="drawer-head"><h2>{charName}'s identity &amp; memories</h2><button className="btn" onClick={onClose}>Close</button></header>
      <div className="drawer-body">
        <div className="tabs" role="tablist">
          <button className="tab" role="tab" aria-selected={tab === "memories"} onClick={() => setTab("memories")}>Memories</button>
          <button className="tab" role="tab" aria-selected={tab === "identity"} onClick={() => setTab("identity")}>Identity</button>
        </div>
        {tab === "identity" ? <>
          <p className="hint-soft">This profile helps {charName} describe who she is. Her name and your name are set in Settings.</p>
          <label className="field"><span>Relationship to you</span><input maxLength={500} value={draft.relationship} onChange={(e) => { setDraft({ ...draft, relationship: e.target.value }); setNotice(""); }} /></label>
          <label className="field"><span>Background</span><textarea rows={3} maxLength={2500} value={draft.biography} onChange={(e) => { setDraft({ ...draft, biography: e.target.value }); setNotice(""); }} /></label>
          <label className="field"><span>Personality</span><textarea rows={3} maxLength={2500} value={draft.personality} onChange={(e) => { setDraft({ ...draft, personality: e.target.value }); setNotice(""); }} /></label>
          <label className="field"><span>Values (one per line)</span><textarea rows={3} value={values} onChange={(e) => { setValues(e.target.value); setNotice(""); }} /></label>
          <label className="field"><span>Interests (one per line)</span><textarea rows={3} value={interests} onChange={(e) => { setInterests(e.target.value); setNotice(""); }} /></label>
          <button className="btn primary" disabled={!draft.relationship.trim()} onClick={() => {
            onIdentity(validateIdentity({ ...draft, values: values.split("\n"), interests: interests.split("\n") }));
            setNotice("Profile updated. Changes will apply to the next reply.");
          }}>Save identity</button>
          <p role="status">{notice}</p>
          <PersonalityControls/>
        </> : <>
          <p className="hint-soft">Relevant saved memories are recalled in chat; pinned notes get priority. Review your statements and {charName}'s own preferences before saving them.</p>
          {suggestions.length > 0 && <>
            <h3>Suggested memories ({suggestions.length})</h3>
            <p className="hint-soft">Suggestions identify who said them. {charName}'s preferences are proposed choices for her character; review them before saving. They won't be recalled until saved.</p>
            {suggestions.map((s) => <SuggestionCard key={s.id} charName={charName} suggestion={s} existing={memories.find((m) => m.id === s.replaceId)}
              onDismiss={() => onReview(s.id)} onSave={(text, importance) => {
                if (s.replaceId && memories.some((m) => m.id === s.replaceId)) {
                  onMemories(memories.map((m) => m.id === s.replaceId ? updateMemory(m, { content: text, importance }) : m));
                } else onMemories([...memories, newMemory(text, s.category, importance)]);
                onReview(s.id);
              }} />)}
          </>}
          <h3>{editing ? "Edit memory" : "Add a memory"}</h3>
          <label className="field"><span>What should be remembered?</span><textarea maxLength={5000} rows={3} value={content} onChange={(e) => setContent(e.target.value)} /></label>
          <div className="grid2">
            <label className="field"><span>About</span><select value={category} onChange={(e) => setCategory(e.target.value as Memory["category"])}><option value="user">You</option><option value="mana">{charName}</option><option value="shared">Together</option></select></label>
            <label className="field"><span>Importance</span><select value={importance} onChange={(e) => setImportance(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}{n === 1 ? " — Low" : n === 5 ? " — High" : ""}</option>)}</select></label>
          </div>
          <div className="chips"><button className="btn primary" disabled={!content.trim()} onClick={save}>{editing ? "Save changes" : "Add memory"}</button>{editing && <button className="btn" onClick={reset}>Cancel edit</button>}</div>
          <h3>Saved memories ({memories.length})</h3>
          <label className="field"><span>Search memories</span><input value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          {visible.length === 0 && <p className="hint-soft">{memories.length ? "No memories match your search." : "No memories saved yet. Add something meaningful above."}</p>}
          {visible.map((m) => <article className="memory-card" key={m.id}>
            <p className="memory-content">{m.content}</p>
            <p className="hint-soft">{m.category === "user" ? "You" : m.category === "mana" ? charName : "Together"} · Importance {m.importance}/5 · {new Date(m.createdAt).toLocaleDateString()}{m.pinned ? " · Pinned" : ""}</p>
            <p className="hint-soft">Strength {Math.round(memoryStrength(m))}/100{m.pinned ? " · Protected from fading" : memoryStrength(m) < 20 ? " · Faint, still recoverable" : ""} · Recalled {m.recallCount} {m.recallCount === 1 ? "time" : "times"}</p>
            <meter min={0} max={100} value={memoryStrength(m)} aria-label="Memory strength" />
            {m.lastRecalledAt && <p className="hint-soft">Last recalled: {new Date(m.lastRecalledAt).toLocaleString()}</p>}
            <div className="chips">
              <button className="btn" aria-pressed={m.pinned} onClick={() => onMemories(memories.map((entry) => entry.id === m.id ? updateMemory(entry, { pinned: !entry.pinned }) : entry))}>{m.pinned ? "Unpin" : "Pin"}</button>
              <button className="btn" onClick={() => { setEditing(m.id); setContent(m.content); setCategory(m.category); setImportance(m.importance); }}>Edit</button>
              <button className="btn" onClick={() => {
                if (!window.confirm("Delete this memory?")) return;
                onMemories(memories.filter((entry) => entry.id !== m.id));
                if (editing === m.id) reset();
              }}>Delete</button>
            </div>
          </article>)}
        </>}
      </div>
    </section>
  </>;
}

function SuggestionCard({ suggestion, existing, onSave, onDismiss, charName }: {
  suggestion: MemorySuggestion; existing?: Memory; onSave: (text: string, importance: number) => void; onDismiss: () => void; charName:string;
}) {
  const [text, setText] = useState(suggestion.content);
  const [importance, setImportance] = useState(existing?.importance ?? 3);
  return <article className="memory-card">
    <label className="field"><span>{suggestion.category==="mana"?`Suggested preference for ${charName}`:"Suggested fact about you"}</span><textarea rows={2} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} /></label>
    <details><summary>{suggestion.category==="mana"?`From ${charName}'s reply`:"From your message"}</summary><p className="memory-content">{suggestion.sourceText}</p></details>
    {existing && <p className="hint-soft">Saving will update: {existing.content}</p>}
    <label className="field"><span>Importance</span><select value={importance} onChange={(e) => setImportance(Number(e.target.value))}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
    <div className="chips"><button className="btn primary" disabled={!text.trim()} onClick={() => onSave(text.trim(), importance)}>{existing ? "Update memory" : "Save memory"}</button><button className="btn" onClick={onDismiss}>Dismiss</button></div>
  </article>;
}
