# Roadmap

Repository: [Aishi-mana/ManaAI-CV-2](https://github.com/Aishi-mana/ManaAI-CV-2.git)

Extracted from ManaAI.md on 2026-10-09. This file owns the milestone checklist.
See [design notes](ManaAI.md), [project structure](PROJECT_STRUCTURE.md),
[changelog](CHANGELOG.md) and [dev log](DEVLOG.md) for supporting detail.

Deferred narrative reply tuning: the user tested an explicitly edited Lesson v4
(enabled, with v3 disabled). The reply proposed comparing changed outcomes and
acknowledged that the preview is not the whole game, but still claimed outcome/turn
counts reveal whether moves are balanced. Record this as a remaining grounding
limitation: these measurements support investigating balance, not establishing it
alone. The manual example supports approval/retrieval flow; wording is a partial
pass. Further tuning is deferred while development continues, without claiming
universal narrative adherence or changing the user's saved interpretations.

Focused lesson request fix: read-only inspection of saved state and a request
reconstruction confirmed Lesson v3 and its task guidance were present. Competing
inputs included two older damage-focused answers, 4,566 characters of work context,
and general Detailed instructions appended after lesson evidence. This reconstruction
was not an exact captured historical wire request. Ordinary chat now detects a
selected enabled lesson with a learning/revision question and uses only the latest
user request as conversation history, retaining identity/current-state context and
the selected interpretation's source evidence. Generic work excerpts and duplicate
episodic context are omitted for that request. The lesson-specific task reminder is
appended after general style guidance, including on a corrective retry. Saved chat,
work and memories are unchanged; other questions retain normal context. This gives
the local model a focused request rather than additional competing prompts. Live
adherence remains to be checked.

Approved-lesson reply tuning follows a live partial pass: the reply recovered from
overflow and recalled the result, but substituted character/damage details for the
lesson and asserted that a skill's damage was good. Relevant enabled lessons now
receive focused application guidance for learning/revision questions: practical
takeaway, proposed comparison/check and evidence limit. Draft values do not establish
skill execution, effectiveness or balance; unsupported older chat claims should be
corrected. Future results are compared to understand changes, not force consistency.
The full-game limitation must remain explicit when present in the source. This is
prompt guidance for selected approved lessons, not automatic reply fact verification;
another live example is needed to verify model adherence.

Context recovery fix: live narrative-context testing exceeded the local 8,192-token
capacity (requests of 8,817 and 8,902 tokens). Ordinary chat and its corrective retry
now place current saved context only in the latest user message, removing duplicate
system inclusion. The shared streaming boundary recognizes the server's explicit
context-overflow error and retries at most twice, progressively dropping older
conversation while retaining system instructions and the latest request/evidence.
It does not truncate structured evidence or mutate stored chat. Other server errors
are not retried this way. If current context alone is oversized, the request fails
with a readable message rather than silently deleting essential evidence. This is
reactive recovery, not an exact tokenizer-based context budget; larger-context-only
requests may still need less selected evidence or shorter user input.

## V1 — Foundation

Status: the scoped V1 foundation checklist is fully implemented. Personality length/style and
manual simulated thoughts passed their latest user-reviewed examples. This does not establish
exhaustive release readiness or perfect model adherence. Future personality tuning should cover
more topics, stronger Detailed examples, low-playfulness consistency and interactions with mood
and profile prose. Long-session stability and regression review remain ongoing quality work.

### Current / near-term

- [x] Tauri desktop application
- [x] React/TypeScript UI
- [x] Local llama-server integration
- [x] GGUF model selection
- [x] Streaming local chat
- [x] Persistent basic chat history
- [x] Configurable user/Mana names
- [x] Modular avatar
- [x] Expressions
- [x] Blinking
- [x] Basic lip sync
- [x] Avatar customization
- [x] Wardrobe/loadout system
- [x] Required default skin/outfit/hair
- [x] Accessory layering
- [x] Progress/unlock foundation

### Planned

- [x] Structured Mana identity model (relationship, background, personality, values, interests)
- [x] Personality foundation (optional persistent voice traits; model adherence varies)
- [x] Persistent local database (SQLite settings, chat, avatar loadout, and progress)
- [x] Manual memory storage foundation (SQLite, importance, pinning, timestamps)
- [x] Basic memory retrieval (keyword matches and pinned-note priority; semantic retrieval planned)
- [x] Memory strength and decay (importance-based half-life, non-destructive floor, pinned protection)
- [x] Memory reinforcement (relevant context on completed replies, recall count and timestamp)
- [x] Memory management UI (add, edit, delete, search, pin)
- [x] Stable internal state model (mood/intensity, energy, curiosity, social need, timestamps)
- [x] Mood/state persistence (SQLite, elapsed-time updates, idle avatar and chat integration)
- [x] Simulated thought foundation (optional manual grounded character reflections, review before saving; no hidden reasoning)
- [x] Manual reflection system (local model, bounded evidence, reviewable drafts)
- [x] Basic agency/activity scheduler (priority modes, simulated rest/sleep, session-aware timestamps)

---

## V1.x — Growing Mana

### Future interface polish

- [ ] Replace word-heavy action buttons with clear, consistent icons to reduce crowding.
- [ ] Add descriptive tooltips on hover and keyboard focus, plus accessible names for screen readers.
- [ ] Keep start/stop, recording, playback and disabled states easy to distinguish; retain text where an icon alone would be ambiguous.

User-requested enhancement, deferred for future implementation; current buttons are unchanged.


Current development remains in V1.x. The continuity foundations below do not complete
all V1.x scope or imply readiness to move to the V2 room. Skills, TTS/singing,
multimodality, runnable game/code work and broader routines still have open items.
Interpretations support model-generated revisions and direct Edit as revision,
including model-off editing; unchanged revisions are blocked and new versions require
their own reply approval.

Legacy planning cross-check: see [Legacy-comparison.md](Legacy-comparison.md).
The legacy version labels are independent of this roadmap. These additional plans
recover the experience-to-identity thread without changing completed V1 scope:

- [x] Meaningful event history foundation with timestamps, source references and recorded outcomes
- [x] Reviewed episodic memories/special moments with tags and source snapshots
- [x] Relationship and growth timeline foundation grounded in recorded events and reviewed moments
- [x] Reviewable life themes, lessons and belief interpretations foundation with evidence and revision history
- [x] Explicitly enabled narrative interpretations in relevant ordinary reply context; automatic identity changes remain out of scope

Event history is available through More. It records newly saved goals and their
status changes, reviewed work drafts, deterministic playtests, activity sessions and
their status changes, diary entries, reviewed simulated thoughts and chat archives.
Loading existing data does not backfill events; unchanged saves and deletions do
not create events. Timestamps identify when the action was recorded. Source IDs and
brief title/outcome snapshots remain even if the source later changes or is deleted.
Goal/activity status is user-recorded, draft saves are not executed work, and
generated reflections are not verified facts. No chat text, unsaved drafts, stopped
generations or automatic belief changes enter this history. Search/category filters,
delete and clear controls are provided. At 500 records capture stops until space is
made; there is no automatic pruning. Backup/restore includes history, and older
backups default to an empty history. Events are not yet supplied to model context.

Each event now offers Review as memory: edit the wording, choose an episodic memory
or special moment and add up to eight normalized tags. These notes are stored
separately from fact memories, with a maximum of 200 and one note per event. Saved
notes can be searched, edited and deleted in Event history. Their original event
snapshot retains the source ID, event ID, time and outcome after source/history
deletion. Saving requires review; cancellation saves nothing. No model generation
is needed. Ordinary chat supplies up to three keyword-relevant saved notes as JSON
evidence, identifying the note as a user-reviewed interpretation and preserving
draft/preview/simulated-reflection qualifications. Model adherence still varies.
Other generation flows do not yet recall these notes. There is no automatic belief,
identity, bond or mood change. Backup/restore and its count preview include episodic
memories; older backups restore an empty list. The limit blocks new notes without
pruning existing ones. Editing an existing note remains available at the limit.

Our timeline is a separate view within Event history. It groups events and reviewed
memories by original event date using the journal timezone, merging one memory with
its event rather than counting both as separate experiences. Search includes notes,
tags, source titles and outcomes; filters support reviewed memories, special moments,
inclusive local date ranges and oldest-first order. A reviewed source snapshot still
appears when the event has been deleted. Note-save time is displayed separately from
event time. Current fictional bond and affection are shown as a snapshot; historical
scores and personal growth are not inferred. The timeline is derived from existing
backed-up events/memories and has no additional persistence or model context changes.

Themes & lessons is a separate More panel. Select one to four reviewed moments and
request a tentative life theme or lesson from the local model. Generation shares the
model lock and Stop control. Only a completed short response becomes an editable
draft; saving requires explicit review. Stop, failure, discard or closing the panel
saves no interpretation. Saved records retain full selected note/event snapshots,
creation time, type and version. Draft revision uses that version's original evidence
and interpretation, saving a new version with its parent ID while preserving older
versions. Each saved version can be searched or deleted independently. Limits are
100 saved versions and 2,000 characters per interpretation; there is no automatic
pruning. Backup/restore and count previews include versions; older backups restore
an empty list. The prompt distinguishes interpretations from facts and restricts
claims about identity, feelings, offline actions and full-game execution; live model
adherence still needs review. No automatic belief/identity/stat changes occur and
these interpretations require explicit enablement for ordinary chat context. Belief interpretations
were initially deferred; both foundations are now implemented below.

Live lesson review exposed unsupported psychological inferences from one preview
win (preferences, strategic pacing and comfort with JSON), despite tentative wording.
The tuned prompt now separates practical workflow lessons from topic-based themes.
Lessons describe what the recorded result supports checking or doing next and its
limits. Themes describe the evidenced topic and explicitly avoid an enduring pattern
from one moment. Hedging does not excuse unsupported personal-quality claims. A
revision must correct unsupported earlier wording rather than use it as evidence.
Existing versions remain unchanged; new drafts and revisions use this guidance.
This is prompt tuning, not a semantic output validator; live adherence needs review.

Second live review removed psychological claims but still overstated verification
of JSON state transitions and suggested preserving the deterministic outcome. The
lesson prompt now requests three short sentences: recorded measurements, a proposed
future comparison/check, and untested scope. A win alone does not verify structure,
transitions, correctness or balance. Deterministic preview rules do not require later
versions to produce the same outcome. Unrecorded logs/actions must not be invented;
future log inspection can be proposed rather than claimed as completed. Additional
complexity requires a recorded need. Existing versions remain untouched; live review
of a new revision is still needed.

Belief interpretation is now a third draft type in Themes & lessons. It proposes a
modest working outlook motivated by selected recorded outcomes and explicitly
states limited evidence/scope. It must not claim an established trait, preference,
permanent value, recurring pattern from one event, another person's feelings or a
relationship stage. The same manual review, source snapshots, version limits,
revision history and backup/restore apply. Existing themes/lessons remain valid.
These are proposed character interpretations, not automatically adopted beliefs;
identity and relationship stats are unchanged. Reply context requires explicit enablement. Live wording still
requires review before enabling it in reply context.

Approved narrative context is now available for ordinary chat. Each saved version
has a Use this interpretation in relevant replies checkbox, off by default for old
and new records. Saving a draft or revision does not enable it. Requests include up
to two enabled keyword-relevant interpretations with their reviewed notes and source
outcomes. An enabled descendant supersedes its linked ancestors; disabling it lets
an earlier enabled version become eligible again. Deleted ancestor links can no
longer establish that chain. Evidence snapshots survive source deletion. The prompt
keeps these outlooks tentative and subordinate to user instructions, configured
identity, current state and recorded factual outcomes; model adherence still varies.
Approval flags persist in existing narrative backup records without a new section.
Unchecking excludes a version from future requests but cannot erase text already
present in saved chat history. Initiative, diary, thought and other generation flows
do not use this context. Identity, mood and relationship stats remain unchanged.

- [x] Mana diary (manual reflection plus automatic daily journal, date deduplication and catch-up)
- [x] Diary milestones (first_diary)
- [x] Initiative conversations (opt-in idle checks, quiet hours, cooldown, manual testing)
- [x] Waiting for user replies (persisted pending opening, reply context, dismiss, no reminders)
- [x] Internal clock/time awareness (shared journal timezone, dated context, request-time clock)
- [x] Basic autonomous activity selection (idle/rest/sleep and actual model-task modes; projects planned)
- [x] Reviewable goals (proposals, user-recorded progress, pause/resume/completion, SQLite context)
- [x] Interest enthusiasm foundation (Identity names, editable levels, accepted-goal reinforcement)
- [x] Skill progression foundation (user-confirmed practice counts, milestones and source snapshots)
- [ ] Assessed skill competence and verified-execution progression
- [x] Manual Windows TTS foundation (installed voice selection, completed reply Speak/Stop)
- [x] Persistent voice preferences and opt-in automatic playback of new completed replies
- [x] Saved speech speed and volume (manual/automatic playback, old-backup defaults)
- [x] Voice-timed mouth foundation (Windows viseme events mapped to five vowel images)
- [ ] Refined articulation and timing calibration across voices
- [ ] Custom trained Mana voice / singing
- [ ] Singing
- [x] User-selected image understanding foundation (separate local vision model, reviewed description to chat)
- [x] Inline chat attachments (vision description behind the scenes, normal reply/voice, retry/cancel)
- [x] Local prepared image persistence, thumbnails, explicit deletion and backup support (V1.x; manual tests 1–4 passed)
- [x] Explicit hands-free Whisper conversation loop (V1.x; all four manual checks passed after background-noise repair)
- [x] Compact voice input setup, full-width review, Whisper recording timer and level meter (all four manual checks passed)
- [x] Local CPU Whisper English transcription with review (V1.x; synthetic smoke and live Mana/Aishi phrases passed; remaining manual edge checks pending)
- [x] One-phrase microphone transcription to reviewed draft (V1.x; basic live capture confirmed; name/greeting tuning and review implemented, accuracy retest pending)
- [x] Current avatar visual reference comparison (V1.x; all four manual checks passed after repair)
- [ ] Improved image understanding, direct multimodal chat and verified image provenance
- [ ] Self-recognition
- [ ] Image generation
- [ ] Artwork provenance/self-recognition
- [ ] Coding activities
- [ ] Simple game creation
- [ ] Safer code sandbox
- [ ] More avatar customization
- [ ] Backgrounds
- [x] Saved looks (named loadouts, safe apply, backup/restore)
- [ ] Seasonal outfits
- [ ] Mana-selected outfits

---

## V2 — Companion Room

- [ ] Persistent virtual room
- [ ] Memory-linked room objects, furniture preferences and home stories
- [ ] Miniature Mana avatar
- [ ] Walking and navigation
- [ ] Idle behaviors
- [ ] Activities
- [ ] Interactive objects
- [ ] Furniture
- [ ] Plants
- [ ] Gaming area
- [ ] Computer/coding area
- [ ] Bed/sleep system
- [ ] Room customization
- [ ] Time-of-day presentation
- [ ] Mana needs/state
- [ ] Activity-driven animation
- [ ] Autonomous daily routine
- [ ] Room persistence

---

## V3 — Manaverse

- [ ] Expand room into multiple areas
- [ ] Multiple AI characters
- [ ] Independent character identities
- [ ] Independent personalities
- [ ] Independent memories
- [ ] Independent avatars
- [ ] Character goals
- [ ] Character activities
- [ ] Relationships
- [ ] AI-to-AI communication
- [ ] Friendships
- [ ] Persistent world state
- [ ] Autonomous world events
- [ ] Multiple locations
- [ ] Social interactions
- [ ] Shared activities
- [ ] Emergent AI society/world

---

