import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Msg } from "../core/types";
import { cleanReply } from "../core/emotion";
import { searchChat } from "../core/chatSearch";
import ExportChatButton from './ExportChatButton';

interface Props {
  messages: Msg[];
  busy: boolean;
  ready: boolean;
  charName: string;
  userName: string;
  onSend: (text: string) => void;
  onStop: () => void;
  onDraftChange: (draft: string) => void;
  onCompare: (id: string) => void;
}

export default function ChatPanel({ messages, busy, ready, charName, userName, onSend, onStop, onDraftChange, onCompare }: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const logRef=useRef<HTMLDivElement>(null);
  const followLatest=useRef(true);
  const [showLatest,setShowLatest]=useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [selectedMatch,setSelectedMatch]=useState<string|null>(null);
  const messageNodes=useRef(new Map<string,HTMLDivElement>());
  const matches=useMemo(()=>searchChat(messages,query,charName),[messages,query,charName]);
  const matchIndex=selectedMatch ? matches.indexOf(selectedMatch) : -1;

  function jumpMatch(index:number) {
    if(!matches.length)return;
    const id=matches[(index+matches.length)%matches.length];
    followLatest.current=false;setShowLatest(true);setSelectedMatch(id);
    messageNodes.current.get(id)?.scrollIntoView({block:'center'});
  }
  function latest() {
    setSelectedMatch(null);followLatest.current=true;setShowLatest(false);
    endRef.current?.scrollIntoView({block:'end'});
  }

  useEffect(() => {
    if(followLatest.current)endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function submit() {
    const text = draft.trim();
    if (!text || busy || !ready) return;
    followLatest.current=true;setShowLatest(false);
    setDraft("");
    onDraftChange("");
    onSend(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <>
      <div className="chat-search">
        <ExportChatButton messages={messages} charName={charName} userName={userName} disabled={busy}/>
        <button className="btn" aria-expanded={searchOpen} onClick={()=>{
          setSearchOpen(!searchOpen);if(searchOpen){setQuery("");setSelectedMatch(null);}
        }}>{searchOpen ? 'Close search' : 'Search chat'}</button>
        {searchOpen&&<>
          <input aria-label="Search chat history" type="search" maxLength={200} value={query}
            placeholder="Search messages…" onChange={e=>{setQuery(e.target.value);setSelectedMatch(null);}}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();jumpMatch(matchIndex+1);}}}/>
          <span role="status">{query.trim() ? matches.length ? `${matchIndex>=0?matchIndex+1:'–'} of ${matches.length} matches` : 'No matches' : 'Enter text to search'}</span>
          <button className="btn" disabled={!matches.length} onClick={()=>jumpMatch(matchIndex<0?matches.length-1:matchIndex-1)}>Previous</button>
          <button className="btn" disabled={!matches.length} onClick={()=>jumpMatch(matchIndex+1)}>Next</button>
          <button className="btn" onClick={latest}>Latest</button>
        </>}
      </div>
      <div ref={logRef} className="messages" role="log" aria-live="polite" onScroll={()=>{const log=logRef.current;if(!log)return;const nearBottom=log.scrollHeight-log.scrollTop-log.clientHeight<80;followLatest.current=nearBottom;setShowLatest(!nearBottom);}}>
        {messages.length === 0 && (
          <p className="empty">
            {ready
              ? `Say hi to ${charName}.`
              : "Start the model with the button above, then say hi."}
          </p>
        )}

        {messages.map((m) => {
          if (m.role === "user") {
            return (
              <div key={m.id} ref={node=>{if(node)messageNodes.current.set(m.id,node);else messageNodes.current.delete(m.id);}} className={`row me${selectedMatch===m.id?' search-selected':''}`}>
                <div className="bubble me">{m.content}</div>
              </div>
            );
          }
          const { text, emotion } = cleanReply(m.content, charName);
          const waiting = busy && !text && !m.error;
          return (
            <div key={m.id} ref={node=>{if(node)messageNodes.current.set(m.id,node);else messageNodes.current.delete(m.id);}} className={`row mana${selectedMatch===m.id?' search-selected':''}`}>
              <div className="bubble mana">
                {waiting ? (
                  <span className="dots" aria-label={`${charName} is typing`}>
                    <i /> <i /> <i />
                  </span>
                ) : (
                  text
                )}
                {m.error && <div className="msg-error">{m.error}</div>}
                {m.diagnostics && <details><summary>Reply diagnostics</summary>
                  <p className="hint-soft">Application checks can misfire. These attempts are debug evidence, not accepted chat or memory facts.</p>
                  {m.diagnostics.attempts.map((attempt, i) => <div key={i}><strong>Attempt {i + 1}: {attempt.issue === "capability" ? "Unsupported capability claim" : attempt.issue === "return-role" ? "Incorrect welcome-back roles" : attempt.issue === "repetition" ? "Repeated wording" : "Passed checks"}</strong><p className="memory-content">{attempt.text}</p></div>)}
                  <button className="btn" disabled={busy || !ready || !!draft.trim()} onClick={() => onCompare(m.id)}>Compare with simpler prompt</button>
                  <p className="hint-soft">Uses the same model and temperature, with this user message and a short prompt only. No history or saved context. Does not affect bond, mood, or memories.</p>
                  {m.diagnostics.comparison && <p className="memory-content">{m.diagnostics.comparison}</p>}
                </details>}
              </div>
              {emotion && !busy && <span className="tag">{emotion}</span>}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {showLatest&&<button className="btn jump-latest" onClick={latest}>Jump to latest</button>}
      <div className="composer">
        <textarea
          value={draft}
          onChange={(e) => { setDraft(e.target.value); onDraftChange(e.target.value); }}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={ready ? `Message ${charName}  (Enter to send, Shift+Enter for a new line)` : "The model is not running yet"}
          aria-label="Message"
        />
        {busy ? (
          <button className="btn" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button className="btn primary" onClick={submit} disabled={!ready || !draft.trim()}>
            Send
          </button>
        )}
      </div>
    </>
  );
}
