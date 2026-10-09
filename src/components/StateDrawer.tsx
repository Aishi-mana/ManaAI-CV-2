import type { InternalState } from "../core/internalState";
import { stateMood } from "../core/internalState";
import { journalClock } from "../core/clock";
import type { InitiativeState } from "../core/initiative";
import { initiativePaused } from "../core/initiative";
import type { Relationship } from "../core/relationship";
import { ACTIVITY_LABELS } from "../core/activity";
import type { Activity } from "../core/activity";

export default function StateDrawer({ charName, state, timeZone, onClose, initiative, onInitiative, initiativeStatus, initiativeReady, onStartConversation, relationship, activity }: {
  charName: string; state: InternalState; timeZone: string; onClose: () => void;
  initiative: InitiativeState; onInitiative: (state: InitiativeState) => void; initiativeStatus: string;
  initiativeReady: boolean; onStartConversation: () => void;
  relationship: Relationship;
  activity: Activity;
}) {
  const clock = journalClock(new Date(), timeZone);
  return <>
    <div className="scrim" onClick={onClose} />
    <section className="drawer" role="dialog" aria-label="Companion state">
      <header className="drawer-head"><h2>{charName}'s state</h2><button className="btn" onClick={onClose}>Close</button></header>
      <div className="drawer-body">
        <p>Current time: {clock.date} {clock.time} ({timeZone})</p>
        <h3>{ACTIVITY_LABELS[activity.kind]}</h3>
        <p className="hint-soft">Current mode since {new Date(activity.since).toLocaleString("en-GB", { timeZone })}. Rest and sleep are simulated modes; chatting wakes her immediately. No activities are replayed while the app is closed.</p>
        <h3>Feeling {stateMood(state)}</h3>
        <p className="hint-soft">Mood settles gradually between conversations. Low energy gives her a sleepy expression.</p>
        {([ ["Energy", state.energy, "Recovers 2/hour when idle, 8/hour resting, and 12/hour sleeping while the app runs. Chat uses 2. Offline recovery stays 2/hour."],
          ["Curiosity", state.curiosity, "Grows with conversation and gently returns to its usual level."],
          ["Social need", state.socialNeed, "Rises with time and eases when you chat. You can return whenever you like."] ] as const).map(([label,value,description]) => <div className="progress-card" key={label}>
            <strong>{label}: {Math.round(value)}/100</strong><br />
            <meter className="state-meter" min={0} max={100} value={value} aria-label={label} />
            <p className="hint-soft">{description}</p>
          </div>)}
        <p>Last conversation: {state.lastConversationAt ? new Date(state.lastConversationAt).toLocaleString("en-GB", { timeZone }) : "Not yet"}</p>
        <p className="hint-soft">State is saved between launches and catches up after time away. It updates each minute and during chat.</p>
        <h3>Relationship</h3>
        {([["Bond", relationship.bond], ["Affection", relationship.affection]] as const).map(([label, value]) => <div className="progress-card" key={label}><strong>{label}: {value.toFixed(1)}/100</strong><br /><meter className="state-meter" min={0} max={100} value={value} aria-label={label} /></div>)}
        <p className="hint-soft">Bond represents growing familiarity; affection represents warmth. Completed conversations add 0.2 bond and 0.5 affection; answering an opening adds 0.3 and 1 instead. Unanswered timeouts subtract 0.1 and 0.5 once. Dismissal and disabled initiative do not subtract points. These are companion progression stats; you can return whenever you like.</p>
        {relationship.lastChangedAt && <p className="hint-soft">Last change: {relationship.lastChange} · {new Date(relationship.lastChangedAt).toLocaleString("en-GB", { timeZone })}</p>}
        <h3>Starting conversations</h3>
        <p className="hint-soft">Say “I'm busy” or “talk later” to pause starters for one hour, or “give me 30 minutes” for a specific pause (up to 24 hours). Your next chat message ends the pause early, unless it requests another pause. Pending reply countdowns are cleared without penalty.</p>
        {initiativePaused(initiative)&&<><p role="status">Conversation starters paused until {new Date(initiative.pausedUntil!).toLocaleString("en-GB",{timeZone})}.</p><button className="btn" onClick={()=>onInitiative({...initiative,pausedUntil:null,pauseRequest:null})}>Resume conversation starters</button></>}
        <label className="check"><input type="checkbox" checked={initiative.enabled} onChange={(e) => onInitiative({ ...initiative, enabled: e.target.checked })} /><span>Let {charName} occasionally start a conversation</span></label>
        <label className="field"><span>Minimum time between attempts (randomized up to twice this)</span><select value={initiative.cooldownMinutes} onChange={(e) => onInitiative({ ...initiative, cooldownMinutes: Number(e.target.value) })}>
          {[15, 30, 60, 120, 240].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
        </select></label>
        <label className="field"><span>Wait for a reply</span><select value={initiative.replyMinutes ?? 5} onChange={(e) => onInitiative({ ...initiative, replyMinutes: Number(e.target.value) })}>{[1, 3, 5, 10, 15, 30].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
        <p className="hint-soft">Off by default. Openings wait for five quiet minutes and a saved random interval between the minimum and twice that time. Quiet hours are 22:00–08:00 ({timeZone}). Low energy, open panels, drafts, and journal writing postpone openings. An unanswered opening gets one gentle closing message when its reply window expires. Time away counts, and disabling initiative pauses timeout handling.</p>
        <button className="btn" disabled={!initiative.enabled || !initiativeReady || !!initiative.pending || initiativePaused(initiative)} onClick={onStartConversation}>Start a conversation now</button>
        <p className="hint-soft">This button bypasses quiet hours and the time waits for testing.</p>
        {initiative.pending && <><p>Waiting for your reply: {initiative.pending.content}</p><p className="hint-soft">Reply window ends: {initiative.pending.expiresAt ? new Date(initiative.pending.expiresAt).toLocaleString("en-GB", { timeZone }) : "Not set"}</p><button className="btn" onClick={() => onInitiative({ ...initiative, pending: null })}>Dismiss opening</button></>}
        {initiative.nextAttemptAt && <p className="hint-soft">Next opening eligible after: {new Date(initiative.nextAttemptAt).toLocaleString("en-GB", { timeZone })}. Idle and quiet-hour rules still apply.</p>}
        {initiativeStatus && <p role="status">{initiativeStatus}</p>}
      </div>
    </section>
  </>;
}
