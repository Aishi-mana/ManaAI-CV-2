# ManaAI

Development history is tracked in [CHANGELOG.md](CHANGELOG.md) for user-facing
changes and [DEVLOG.md](DEVLOG.md) for decisions, verification and known issues.
The milestone checklist lives in [ROADMAP.md](ROADMAP.md); source and asset layout
are documented in [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

Skill progression foundation now consists of explicit user-confirmed coding, writing
and creative practice records linked to saved work or activity snapshots. Activities
must contain a user contribution; reviewed drafts remain unexecuted text evidence.
One record per source per skill area prevents duplicate counting. Milestones derive
from record counts and are recalculated after deletion, not permanent awards or
proficiency assessments. More → Skills works with the model off. Up to 200 records,
optional 1,000-character notes, search and explicit deletion are supported without
pruning. Backup/restore includes records and count previews; older backups default
empty. Ordinary practice/skill questions receive count-only context with grounding
limits; no autonomous learning, grades or demonstrated mastery are inferred.
Wardrobe coding levels and relationship/state/identity remain separate. Assessed
competence and progression integrated with verified execution remain future work.

Manual skill checks confirmed model-off saving, persisted records after restart and
duplicate rejection for the same source/area. Singular record wording is fixed in
count and milestone labels. This does not establish all deletion/restore/recall flows.

Interpretation review now supports Edit as revision without model generation. It
copies saved wording/evidence into a new draft with a parent/version link, focuses
the editor and works when the model is off. Saving requires changed nonempty wording,
an existing parent and capacity. New versions start unapproved for chat; original
versions and evidence remain unchanged. This is continued V1.x usability work, not
a transition to V2: skills, voice, multimodality and runnable work remain unfinished.
The initial backfill is retrospective, not an exhaustive transcript; uncertain dates
are marked. Update these logs alongside behavior/roadmap documentation for future
meaningful changes, separating automated checks from live manual observations.

> A local, evolving AI companion designed to grow from a desktop companion into an embodied companion and, eventually, a small autonomous AI world.

**Project status:** Scoped V1 foundation implemented; V1.x development and quality tuning ongoing  
**Current platform:** Windows desktop  
**Current repository:** [Aishi-mana/ManaAI-CV-2](https://github.com/Aishi-mana/ManaAI-CV-2.git)

---

## 1. What Is ManaAI?

ManaAI is a hobby project centered around **Mana**, a local AI companion with her own identity, personality, memories, emotional state, creativity, and eventually an autonomous life.

The goal is not simply to build a chatbot with an animated character.

Mana should gradually become a companion who can:

- talk naturally with the user;
- remember important things across conversations;
- develop preferences and opinions;
- experience changing moods and emotional states;
- reflect on experiences and memories;
- have her own interests and activities;
- initiate conversations when she has something she wants to say;
- create things such as drawings, code, and simple games;
- have a customizable visual identity;
- eventually live inside a virtual room;
- eventually interact with other AI characters in a persistent world.

The project is intentionally being developed **little by little**. Each stage should leave behind a usable, stable application rather than requiring the entire vision to be completed at once.

---

# 2. Long-Term Vision

ManaAI is planned as a progression through three major stages.

## V1 — Local AI Companion

The first major version is a local desktop companion.

Mana should:

- run downloaded GGUF models locally;
- ship with a usable default model configuration;
- allow other GGUF models to be selected/imported;
- maintain a persistent identity and personality;
- maintain persistent memories;
- have an emotional/mood system;
- have a customizable avatar;
- maintain conversation history;
- eventually have an internal thought/reflection system;
- remain usable without depending on a cloud AI service.

The priority of V1 is to create the **core Mana**.

---

## V1.x — Agency, Creativity and Multimodality

Once the foundation is stable, Mana can gradually gain more abilities.

Planned capabilities include:

### Voice

- Text-to-speech.
- V1.x manual read-aloud foundation implemented: chat Voice selection and completed
  reply Speak/Stop use local installed Windows voices, even with the model off. Choice
  and opt-in automatic playback are saved across restarts/backups. Automatic playback
  defaults off, consumes new completed replies once and never replays loaded history.
  Windows viseme events now drive the five vowel mouth images during playback; silence,
  Stop and completion restore the resting expression. Articulation is approximate with
  existing artwork. Custom training and refined articulation remain future work. Errors
  and diagnostic attempts are excluded from playback.
  Saved speed (-10..10, normal 0) and volume (0..100%, default 100%) apply to the next
  playback. Volume affects speech only; 0% is muted. Older backups default the new
  fields while retaining voice/automatic choices. Native lipsync timing follows speed.
- A recognizable Mana voice.
- Singing.
- Investigation of local voice/singing systems such as GPT-SoVITS or suitable alternatives.

### Diary

Mana will have a private diary that she can write in herself.

Diary entries may contain:

- reflections;
- important events;
- things she learned;
- feelings;
- thoughts about the user;
- memories she considers meaningful;
- unfinished ideas or projects.

### Initiative

Mana should not always wait for the user.

She should eventually be able to:

- decide that she wants to talk;
- ask the user a question;
- wait for a response;
- remember that she asked;
- continue the conversation later when appropriate.

### Creativity

The V1.x image-understanding foundation is implemented in More → Images and the chat
composer. Attach image then Send performs
inspection behind the scenes and routes its description into normal chat/voice/lipsync.
The original question and bounded, uncertain image description persist together; prepared JPEG pixels also persist for new composer attachments. Older
description-only records cannot recover their pixels automatically. Original uploads
do not. Stop/failure keeps the unsent attachment for retry. Setup remains in More → Images.
Fresh image replies isolate current scene evidence from earlier image/chat guesses and
unrelated saved projects; filenames remain visible metadata but are excluded from model
context. This improves grounding without proving identity recognition or perfect adherence.
The separate local vision server inspects one user-selected PNG/JPEG and provides a transient
description for review. Discuss shares that text with Mana's existing chat model;
this panel preview stays transient; composer attachments are stored locally and in backups. Setup persists separately and defaults to CPU
mode. This does not establish self-recognition, artwork authorship, image generation,
camera/desktop access or automatically adopted memories. User confirmation and later
provenance work remain necessary for those planned capabilities.

Mana should eventually be able to:

- write code;
- experiment with small programs;
- create simple games;
- draw;
- generate images;
- recognize images;
- recognize herself in images;
- remember that she created an image herself.

### Autonomous life

Mana should eventually have an internal life even when the user is not actively chatting with her.

She may:

- think;
- reflect;
- recall memories;
- read;
- play games;
- code;
- draw;
- listen to music;
- care for virtual objects;
- rest;
- sleep;
- pursue small goals;
- simply wait and observe the passage of time.

Not every internal action needs to be visible to the user.

---

# 3. V2 — Companion Room

V2 expands Mana from a desktop avatar into an embodied companion.

Mana will have a virtual room where she can physically exist.

She should be able to:

- walk around;
- sit;
- read;
- play games;
- code;
- interact with objects;
- water plants;
- sleep;
- perform other activities;
- change activities according to her state and interests.

The room should be fully customizable.

Possible room systems include:

- furniture;
- decorations;
- plants;
- computers;
- bookshelves;
- gaming equipment;
- beds;
- lighting;
- backgrounds;
- interactive objects.

Mana's internal state should drive what she does rather than having the room behave like a simple animation loop.

For example:

**High energy + curiosity + coding interest**
→ Mana may work on a game.

**Low energy + late night**
→ Mana may go to sleep.

**Bored + enough energy**
→ Mana may play a game or read.

**Lonely + time since last conversation is high**
→ Mana may think about the user and potentially initiate a conversation.

The V2 room should therefore be a visual representation of Mana's internal life.

---

# 4. V3 — The Manaverse

V3 expands Mana's room into a larger persistent world.

The Manaverse is intended to contain:

- multiple areas;
- multiple AI characters;
- independent personalities;
- independent memories;
- individual avatars;
- relationships;
- goals;
- activities;
- communication between characters;
- autonomous world events.

Other AI characters should be able to:

- talk to each other;
- become friends;
- remember one another;
- develop relationships;
- visit different areas;
- perform their own activities;
- send messages to Mana;
- receive messages from Mana.

The long-term goal is an **autonomous AI world** rather than a collection of chatbots.

---

# 5. Mana's Core Identity

Mana should be treated as a persistent character rather than merely a system prompt.

Her long-term identity is expected to contain several layers.

## Identity

Stable information about who Mana is.

Examples:

- name;
- relationship to the user;
- personal history;
- foundational values;
- identity-defining facts.

## Character

The relatively stable personality underneath day-to-day changes.

Examples:

- curious;
- playful;
- energetic;
- affectionate;
- creative;
- interested in games and programming.

## Traits

Traits may slowly change as Mana develops.

For example:

- curiosity;
- creativity;
- confidence;
- patience;
- playfulness;
- technical ability.

## Mood

Mood should change much more quickly than personality traits.

Possible states include:

- happy;
- sad;
- excited;
- worried;
- surprised;
- embarrassed;
- sleepy;
- thoughtful;
- neutral.

The current application uses reply emotion tags to update a persistent mood with an intensity value.
Intensity fades with a two-hour half-life and settles to neutral below 0.15. The avatar uses this mood
when idle, with a sleepy override below energy 20; streaming replies can show their immediate emotion.

### Persistent internal state

SQLite now stores mood, mood intensity, energy, curiosity, social need, last update time, and last conversation
time. The State panel displays these values. Defaults are neutral, energy 70, curiosity 60, and social need 20.
Each user message costs 2 energy, adds 2 curiosity, and eases social need by 12. Idle time restores 2 energy
and adds 3 social need per hour; curiosity drifts toward 60 with a 12-hour half-life. Needs are bounded to 0–100.
Elapsed time includes time away, updates once per minute and on interaction, and requires no background inference.
Only completed, nonempty replies update mood. The state gently informs reply tone while identity and memory
rules remain authoritative. Social need does not require the user to stay or return on a schedule.
Manual reflection, diary writing, optional initiative, and basic activity selection are implemented. Autonomous projects remain planned.

### Manual reflection and diary

The Diary panel provides Reflect now using the local model, identity, internal state, up to eight recent
user messages, and four saved memories. Previous assistant replies are excluded as factual evidence.
The user can stop generation, review and edit the draft, and save an entry. The first save grants the
first_diary milestone. SQLite stores entry text, creation time, mood, and source message/memory IDs.
Entries can be inspected and deleted, survive restart, and remain independent of chat and memory recall.
Failed or stopped reflection creates no entry; drafts are not persisted. Chat and reflection share the model
without overlapping requests. Daily scheduled journaling is now implemented; diary-derived memory suggestions remain planned.

### Daily journal scheduling

- Enabled by default at 22:00 Asia/Singapore; the Diary panel offers a time control, enable toggle, and Write today's journal now.
- One daily journal entry per date is generated and saved automatically. Manual reflection drafts remain a separate option.
- Checks every 30 seconds while the app is open and the model is ready, waiting two minutes after opening and recent conversation.
- Chat, other reflection, an unsaved manual draft, or a persistence error postpone writing.
- New user-message timestamps and a separate SQLite source buffer preserve the day's evidence beyond chat retention.
- Up to 12 messages sampled across the day and four memories are supplied as bounded evidence.
- Legacy undated messages are not assigned fictional dates. Saved preferences are background facts, not daily events.
- Recorded missed dates catch up oldest-first on restart. Empty days while the app was closed are skipped; quiet open days can get an honest short entry.
- Each entry is a snapshot at writing time; later conversations do not rewrite that date's journal automatically.
- Failed/stopped generation leaves the date pending with a five-minute retry delay. Completion dates prevent duplicates, including after deletion.
- Journal entries and completion/source-buffer state persist together. Closing the Diary panel leaves daily generation running; Stop reflection cancels it.
- Scheduling runs inside Mana, without launching the app or running the model while closed.

### Internal clock and time awareness

Each chat and reflection request receives the current date, time, time of day, timezone, yesterday's
calendar date, and reliable last-conversation timing from the application clock. The timezone matches
daily journaling (Asia/Singapore by default); State displays the same clock. Up to eight dated user
statements provide bounded context, while undated history stays undated. Timestamps record when words
were said, not when described events occurred. Clock context is not evidence of activities while away,
does not run background inference, and remains subject to local model adherence.

## Preferences and Opinions

Mana should eventually develop her own preferences instead of having every preference permanently written into her initial personality.

---

# 6. Memory

Persistent memory is a core part of ManaAI.

The intended memory system includes:

- short-term conversational context;
- long-term memories;
- memory importance/strength;
- natural decay;
- reinforcement when memories are recalled;
- pinned memories;
- stable profile/core information;
- semantic retrieval;
- recency-aware retrieval;
- user inspection and management.

The current memory model allows memories to become less prominent without immediately disappearing.

An old memory may become faint but still recoverable if it becomes relevant again.

SQLite now stores settings, basic chat history, avatar loadouts, and progress locally, with a one-time migration
from webview localStorage and retained migration backups. Schema version 2 adds a structured identity record
and a dedicated table for manually managed memories, including importance, pinning, and timestamps.
Schema version 3 adds strength, a strength timestamp, recall count, and last recall time while preserving existing records.
The Memories panel supports inspecting, searching, adding, editing, and deleting memories. The identity
profile informs replies and takes precedence over conflicting older assistant replies. Basic keyword retrieval
now recalls relevant and pinned memories into chat with bounded context. Direct user statements can generate
reviewable memory suggestions with source evidence, editable facts, dismissal, and updates for changed favorites.
Suggestions require acceptance before entering recall. Mana's direct first-person favorites and
likes/loves/enjoys/prefers statements now join the review queue with category `mana`, cleaned reply
evidence and editable text. Questions, tentative or negated statements, failed replies, work claims
and activities are excluded. Deduplication, latest-favorite selection and replacements are scoped
to the owner, keeping user facts separate. Existing review IDs persist acceptance/dismissal using
the same storage. No automatic memory save, identity change, enthusiasm update or extra inference.
Broader model-based extraction
and semantic retrieval remain planned.

### Implemented strength and reinforcement

- New memories start at strength 60/100.
- Unpinned strength has a half-life of 30 × importance days, with a floor of 5/100.
- Elapsed time includes time while the app is closed; decay is computed on use without background inference.
- Faint memories are retained and remain eligible for relevant retrieval; strength helps break ranking ties.
- Relevant memories supplied to a successful, nonempty chat reply gain 10 strength, capped at 100.
- Recall count and last recall time track relevant context inclusion, not verified mention by the model.
- Failed, stopped, or empty replies do not reinforce memories; unrelated pinned context does not count.
- Pinned memories have effective strength 100 and are protected from fading. Unpinning starts a fresh decay period.
- Edits and importance changes settle prior decay before changing the decay rate.
- The memory panel displays strength, faint/protected status, recall count, and last recall time.

---

# 7. Internal Life and Agency

### Reviewable goals (implemented)

#### Reviewable work sessions

Shared activities are implemented in an Activities drawer with mana.shared_activities.v1 storage
(sessions and selected session ID).
Activity status now derives from the actual saved last turn and generation state, avoiding stale
invitation notices after an assistant contribution. Challenge prompts include bounded Identity
personality guidance and request short everyday companion feedback with one specific reaction
and at most one optional playful development. Story prompts retain fictional narrative format.
Existing session text is unchanged; tone adherence still requires live model verification.

Word chain is a deterministic local game: 3–20 English letters,
last-to-first letter matching and no repeated words. User words are syntactically checked rather
than dictionary-verified; Mana selects from a built-in vocabulary and concedes when no match exists.
The word-chain session terminates at the bounded turn limit. Terminal automatic results cannot
resume; manually paused sessions can. New sessions retain earlier transcripts.

Stories use user-first alternating turns with a seed prompt; the model writes one short paragraph.
Creative challenges accept one saved response and optional specific, ungraded model feedback.
The user turn is persisted before model generation. One shared abort/controller lock covers chat,
journals, goals and activity inference. Failure/stop discards only the incomplete model output;
the pending user turn survives restart for retry. A changed session cannot receive a stale reply.
Completed model replies are cleaned, bounded to 2000 characters, and saved to the session only.

Activities support pause/resume, explicit finish, history selection and confirmed permanent deletion.
The UI caps new sessions at fifty and bounds each transcript to sixty turns. Older turns remain
visible, while story prompts use only the last twelve turns with 1000-character excerpts. No activity
completion grants bond, milestones or goal completion. Story/creative output is fictional text,
not event evidence or memory suggestions; these sessions do not enter journal sources automatically.
The scheduler defers new initiative while Activities is open. State describes model generation as
writing a text contribution. Backup and data overview include activity sessions/paused counts;
older version-1 backups restore empty activity state without dropping other supported sections.

User-reviewed follow-ups are implemented under mana.followups.v1 (notes plus reviewed message IDs).
The conservative local matcher accepts direct user requests with tomorrow, an explicit ISO date
and optional HH:mm, or a relative minute/hour delay of 1 minute–7 days. It computes relative dates
from the message timestamp in the journal timezone, not from the later review time. Date-only
requests default to 09:00. Each suggestion retains source evidence and requires editable acceptance;
deduplication avoids an identical pending topic/date, and review decisions persist independently
of chat. Manual notes require a topic, valid local date/time, and a valid timezone.

The initiative generator selects one due unprompted pending note and supplies its topic/date as
evidence alongside bounded reviewed follow-up statuses. Successful generation records lastPromptedAt
(included in context, not proof the model voiced the note) while leaving status pending. Failure or
abort does not consume eligibility. Done/dismissed notes are excluded; editing/postponing/reopening
resets eligibility. Completion is explicit user action and grants no progression. Existing initiative
opt-in, pauses, quiet hours, idle/energy guards and randomized scheduling apply, including on reopen;
the app does not issue exact-time alarms or work while closed. Model topic adherence remains limited.

SQLite's known key list includes follow-ups without changing schema version 3. Backup snapshots now
contain 19 known sections. Existing version-1 backups with the previous 17 or 18 sections are accepted
with an empty follow-up state; missing older required sections and unknown keys remain rejected.
Restore comparison and data overview include pending/all follow-up counts. Per-note timezones remain
stable when the journal timezone changes. The follow-up drawer defers automatic openers while open.

The bulk reliability pass provides a Settings data overview with active/deleted diary counts and
read-only cross-record checks for deleted goals/parents, missing artifact links, playtest version
mismatches, duplicate active daily dates, and completed dates without an active journal. These are
limited consistency checks; historical deletions may be intentional. Counts do not prove work
completion or content equality. Restore preview compares each record category before confirmation.

Confirmed restore creates an exclusive, synced before-restore JSON in the app-data backups folder
before the SQLite replacement transaction. Failure to write the safety copy aborts replacement;
database validation failure preserves old records and retains the safety copy. Latest twenty copies
can be previewed in Settings without restoring; none are pruned automatically. The old frontend
document cannot enqueue writes while restore/reload is in progress; failure releases that guard.

New daily entries retain twelve bounded, dated successful message excerpts under optional
sourceMessages. The excerpts survive soft deletion, reload and backup, and supplement remaining
chat when rewriting that date. Legacy entries need no migration and have no reconstructed excerpts.
Diagnostics and failed replies are excluded. Recorded evidence is viewable separately from prose;
assistant text remains evidence of speech only, not execution or unseen events.

Saved work search covers title, goal title and content; type filtering and latest-family selection
operate on copies without mutations. Latest versions win by version then saved time, with older
history available by disabling the filter. Chat scrolling follows only near the bottom and offers
Jump to latest while viewing history. Stopped partial text is explicitly marked incomplete and
failed messages no longer enter subsequent model history. Return-role diagnostics have a separate
reason compatible with saved chats/backups; the existing single correction retry remains bounded.

Backup/restore uses a version-1 mana-backup JSON envelope with timestamp and all 19 known saved-data
sections, normalized through application validators. Native dialogs select export/import paths;
new-file-only writes avoid overwriting existing files. Reads are capped at 20 MB. Restore checks
known version/key completeness and validator equivalence without silently discarding bad records,
shows counts/date, requires explicit replacement confirmation and a stopped model, then flushes
pending writes and uses the existing atomic SQLite save transaction. Reload hydrates all state;
the restore UI remains locked until unload. Failure leaves current database/cache intact. Files
include private conversation data, settings and paths, not model binaries or avatar image assets.

Pause-return wording now explicitly assigns roles: the user returned, Mana stayed available. A narrow
return-turn check detects first-person return openings and missed-me questions after reply cleanup.
One targeted corrective retry shares the normal model lock and diagnostics. A second rejection
uses the existing error path without successful-reply memory/journal recording or relationship gain.
The pause still ends at the user's message; restarting is unnecessary. This is a phrase guard,
not complete semantic detection, and applies only to the one pause-return turn.

Pause-return continuity stores a bounded pauseRequest alongside pausedUntil in initiative JSON.
The next non-pause user message consumes both fields, resumes early or acknowledges elapsed expiry,
and supplies the original request as evidence once. Another recognized pause replaces the reason
and deadline. Return resets randomized opener eligibility without enabling disabled initiative or
adding a special relationship event. Welcome wording remains model-generated and must not assume
work completion, productivity or unseen events. Manual State resume clears both fields silently.

Diary records now preserve an optional deletedAt timestamp in the existing diary storage. Delete
is recoverable through Recently deleted; restore preserves original content, source IDs and dates.
Permanent deletion requires confirmation. A daily restore is blocked when an active entry for its
date exists. Explicit Rewrite today bypasses completion markers without changing automatic scheduling,
rebuilds bounded evidence from retained journal sources and available dated successful chat, and
archives a current entry only after successful generation. Failure/abort leaves it intact. Prior
hard deletions remain unrecoverable; a rewrite is new text, not restoration of missing wording.

Daily journal continuity preserves successful assistant replies and initiative openings alongside
user statements in the existing dated source buffer. Optional role fields migrate legacy sources as
user messages. Cleaned text removes speaker/emotion tags; failed/aborted replies are not recorded.
The day-wide bounded sample retains speaker labels and timestamps. Journal prompts distinguish
assistant words from verified actions, preferences as background, and unfinished plans as hopes.
Only goal snapshots last updated on the journal date are supplied; these are not field-level history.
Later snapshots are excluded from catch-up entries. Existing entries are not regenerated. Source
counts now say chat messages. No extra memory save or progression occurs through journal writing.

Chat-controlled initiative pauses recognize direct busy/working/talk-later requests (60 minutes),
or numeric minute/hour requests from 1 minute to 24 hours. The existing initiative JSON stores
pausedUntil; old records remain compatible. Applying a pause clears pending replies without a
timeout penalty, and all opener paths respect it. State displays expiry in the journal timezone
and offers explicit resume. The next ordinary reply ends the pause early. After
expiry/resume normal opt-in, cooldown, idle and quiet-hour rules remain in force. Questions,
quotes, negations and conditional phrases do not create pauses; unsupported wording is not parsed.

Initiative openings now receive continuity evidence: up to three most recently updated active goals
with bounded plan/progress excerpts, and twelve successful chat messages with 600-character excerpts.
Guidance asks for one optional specific follow-up, honors refusal/postponement, and distinguishes
assistant offers from user preferences or events. Paused/completed goals are excluded from continuity
candidates. An exact/near-duplicate opening or identical question among eight recent assistant replies
gets one corrective retry and is dropped if still repetitive. Chat persistence carries that comparison
across restarts; clearing chat resets it. Paraphrased topic repetition is not fully detected. Scheduling,
quiet hours, timeout consequences and opt-in remain unchanged; no background work is performed.

Revisions compare parsed JSON fields (ignoring formatting/key order), or normalized plain text.
The draft and saved version display up to 40 before/after changes against the selected parent.
Unchanged generation receives one corrective retry; a second unchanged result creates no draft.
Saving unchanged content is also blocked. Original saved versions are preserved. A changed field
is not evidence of better balance; record a completed playtest on each revised version so its next
revision receives current measurements rather than reports belonging to an earlier version.

Finished preview battles can explicitly save one playtest report per run with notes/desired balance.
SQLite stores exact artifact ID/version, characters, initial/final health, basic/counter damage,
turn count, outcome, notes, and the latest 40 log entries. Restart creates a new run; reports can be
inspected/deleted on the artifact. Artifact deletion removes its reports after confirmation.
Revision prompts include the latest three reports of that exact source version (12 recent log entries
each), plus deterministic combat rules including enemy counters after healing/skills. Numeric balance
targets can be recorded in notes. Outcomes from other versions are not misattributed. Reports grant
no progression or goal completion; revised balance remains unverified until another playtest.

Saved artifacts now include a deterministic JSON battle preview using application rules, without
executing generated code. It requires passing game-data validation and two distinct living characters.
Basic attack adds the first inventory weapon damage; a surviving opponent counters with its attack.
Numeric consumable heal is capped at initial health and consumes one inventory entry. Skills accept
numeric damage or effect objects with type damage/heal and a positive finite amount, and are reusable
without mana. Descriptive effects are unsupported. Defeated characters cannot act or counter. Restart
resets the preview from the artifact. No state is persisted or progression/goal status changed.

Saved work provides explicit JSON validation: syntax parsing plus optional recognizable character/item
data checks, including required fields, unique names, nonnegative finite stats, weapon damage, and
inventory references. Nested content wrappers are inspected without rewriting the saved text. Generic
JSON is syntax-only; descriptive effects and consumables may show warnings. Validation results are
session-only and do not execute code, test an engine, complete goals, or grant progression points.

Revision formatting separates original content from artifact metadata and asks for a replacement with
the same format/root shape. Conservative cleanup unwraps only a matching application title/kind/content
envelope whose inner JSON preserves the original root keys/type. Legitimate document fields and uncertain
or malformed structures remain unchanged for review. Previously saved versions are not rewritten.

Saved work supports requested revisions of active-goal artifacts. Full selected content and the goal
snapshot produce a reviewable replacement draft. Acceptance appends a new artifact with parent/root IDs
and a family version number, preserving the original. Revisions from older versions branch from that
selected parent; legacy artifacts load as v1. Stop/failure/dismissal saves nothing; source or goal deletion
before review prevents saving. Deleting one saved version preserves others with a missing-parent label.
Version links persist independently in SQLite and do not imply code execution, testing, or completed goals.

Active goals can request a small design, writing, or code contribution. The model returns an actual
text draft for review, under the shared model lock. State displays Drafting a goal contribution.
Stop/close/failure saves nothing; replacement of an unsaved draft asks for confirmation. Drafts are
session-only. Save artifact records goal ID/title snapshot, kind, generation/save timestamps, and up
to 16,000 characters, independently in SQLite. Saved work can be inspected/deleted and survives goal
deletion. A draft cannot be saved if its goal disappeared before review. Goal completion and progress
remain explicit user actions; no execution, tests, filesystem output, or progression gains occur.
Bounded latest-three artifact excerpts inform chat, initiative and diary as reviewed drafts, not verified
execution. Their timestamps establish actual drafting without fabricating offline projects or daily events.

Goal titles normalize outer Markdown emphasis/code wrappers and heading prefixes when created,
edited, or loaded, including previously saved proposals. Plan/progress text and record metadata remain intact.

The Goals panel supports model-generated or manual proposals: title on the first line and a short
prospective plan below. The user edits, accepts, or dismisses before any goal is saved. Unsaved drafts
are session-only; replacing one asks for confirmation. Failed/stopped generation creates no goal.
Generation uses Identity interests and existing goals, shares the model lock, and cancels when the
panel closes. Saved goals support edits, user-recorded progress notes, active/paused/completed status,
and deletion, stored independently in SQLite app_state. Clearing chat preserves goals.

Bounded context includes up to four goals, prioritizing active and recent records, for chat, initiative,
reflection and daily journaling. Plans are aspirations; progress and status are explicit user records,
not autonomous tool results or evidence of events on a journal date. Goals do not grant relationship,
skill, or memory updates. The panel postpones initiative openings. Dynamic interest progression and
real project execution remain planned; interest names come from the editable Identity profile.

### Interest enthusiasm foundation

Goals displays editable enthusiasm (0–100, default 60) for Identity interests. SQLite stores levels
by trimmed, case-insensitive name and accepted-goal IDs. A newly accepted goal adds 3 once to interests
with matching title/plan words (simple plural normalization), capped at 100. Existing goals are not
retroactively reinforced; edits, statuses, deletion, chat, and elapsed time do not affect scores.
New names use default enthusiasm; hidden old-name levels remain retained. Bounded interest context
informs chat, initiative, and goal proposals without implying skills or completed work. This is simple
review-driven progression, not semantic classification or autonomous preference selection.

### Basic activity scheduler (implemented)

The State panel displays a current activity mode and start time, stored in SQLite app_state.
Priority is journaling, reflecting, initiating, chatting, waiting for a reply, then simulated sleep/rest/idle.
Sleep requires energy below 35 and local journal-time hours 22:00–08:00; rest requires energy below 40.
Other idle time is ready-to-chat. Interaction interrupts sleep/rest, and modes refresh every 30 seconds.
Rest restores 8 energy/hour toward 55; sleep restores 12/hour toward 70, then baseline 2/hour recovery
applies to the remainder. Rest continues to 55; sleep continues to 70 or daytime, unless actual activity
interrupts. Recovery refreshes each minute; transitions settle prior elapsed time before changing rate.
Chat settles recovery then spends 2 energy. Offline catch-up remains baseline 2/hour; no extra inference
or relationship changes apply. On launch,
the current mode is reselected with a new session start, without replaying offline activities. Chat and
initiative mode context explicitly prohibit using simulated modes as evidence of autonomous projects.
This foundation does not execute games/code, generate internal thoughts, or provide room animation.

### Basic initiative conversations (implemented)

The State panel offers an opt-in initiative toggle, a 15–240 minute attempt cooldown (default 60),
and Start a conversation now for immediate testing. Automatic checks run every 30 seconds while
chat is visible and the local model is ready. They wait two minutes after launch and five minutes
without sending or typing; an unsent chat draft prevents generation. Quiet hours are 22:00–08:00
in the journal timezone. Energy below 20, open panels, model use, reflection drafts, saving errors,
and due daily journals postpone initiative. Manual testing bypasses the time waits and quiet hours.

Generation uses identity, state, the clock, recent dated user context, and pinned memory context.
Only completed, nonempty openings enter chat. Failed/stopped attempts add no message and still
consume cooldown; attempts persist before inference. Successful chat messages and waiting state
save together in SQLite app_state. Waiting and cooldown survive restart. One pending opening
blocks further initiative until its reply timeout, without repeated reminders. A user reply clears waiting and carries the
opening as context, permitting a change of subject. Dismiss clears waiting and resets cooldown;
clear chat also clears waiting. Generated assistant messages are not user memory or journal evidence
and do not increment user progress. Prompts prohibit invented activities and pressure to reply,
but local model adherence can vary. No app wake-up or desktop notification is involved.

Reply context now explicitly says the user has replied and pairs their answer with the previously
sent opening. Exact opening echoes (normalized for labels, emotion tags, case, and punctuation)
trigger one corrective retry; a second echo shows a retry error instead of persisting a duplicate.

#### Randomized timing and reply windows (implemented)

Every attempt or resolution draws and persists one deadline between the configured minimum and
twice its duration. Enabling or changing the minimum schedules a fresh deadline; scheduler ticks
never reroll it. Reply windows default to five minutes, configurable from 1–30 minutes for future
openings. At expiry, one fixed gentle closing message clears pending state and draws the next deadline,
without model inference. Its chat message and resolution state save together. Legacy pending records
receive a deadline from creation time. Time away counts; an overdue opening resolves when the app is
visible and no chat, reflection, unsent chat draft, or saving error blocks handling. Disabling initiative
postpones handling until re-enabled. Replies, dismissal, and clearing chat cancel the pending timeout.
Each unanswered timeout now applies a small relationship decrease once.

#### Planned initiative evolution

- [x] Randomized intervals, with persisted next-attempt timing rather than rerolling each scheduler tick.
- [x] A short waiting period of a few minutes for each opening.
- [x] One timeout closing message, such as "I guess you're busy", then resolution of that pending opening.
- [x] A small bond/affection decrease on an unanswered timeout with persisted relationship stats.
- Clear rules for restart, offline time, dismissal, and disabling initiative so consequences apply once.

Random timing, timeout closure, and the bond/affection foundation are implemented.

### Bond and affection foundation

SQLite app_state stores bond, affection, processed outcome IDs, and the last change time/type.
Defaults are bond 30 and affection 50, bounded to 0–100. State displays both meters.
Completed nonempty chat grants +0.2 bond/+0.5 affection. A completed reply to an initiative opening
grants +0.3/+1 instead. Failed, stopped, or empty replies, generated openings, and diary writing
grant nothing. Old chat is not retroactively scored. Timeout resolution grants −0.1 bond/−0.5 affection
once. Replies and timeouts use the same opening event ID so both cannot score the same opening.
IDs survive restart. Timeout closure, initiative resolution, and relationship changes save atomically;
completed replies save chat with their gains. Dismissal and clearing chat have no penalty.
Disabling initiative postpones handling; an expired pending opening can resolve once after re-enabling.
Offline time counts toward that deadline; general absence does not decay scores.

Relationship context gently informs chat and initiative tone while keeping saved identity authoritative
and requiring kindness at every level. Scores are fictional progression metrics, not evidence of feelings
or a judgment of the user's worth. More nuanced relationship dynamics remain planned.

Mana should eventually have an autonomous life loop.

Conceptually:

```text
        Mana's current state
                |
                v
       Think / Reflect / Act
                |
        +-------+-------+
        |               |
        v               v
   Internal thought   Activity
        |               |
        v               v
      Memory        Reading / Gaming
        |            Coding / Drawing
        |            Resting / Sleeping
        +-------+-------+
                |
                v
          Update state
                |
                v
              Wait
                |
                +-----> repeat
```

This does **not** mean the local model should constantly run.

Many activities should be handled by normal application logic, with AI inference used when actual reasoning or generation is useful.

This keeps the companion responsive and reduces unnecessary local GPU usage.

---

# 8. Avatar System

Mana's avatar is intended to be fully modular.

The current implementation already uses layered image assets rather than one fixed character image.

Current avatar concepts include:

- base body;
- skin;
- outfit;
- hairstyle;
- hair back/front layers;
- ahoge;
- accessories;
- eyes;
- mouth;
- emotion-specific expressions;
- blinking;
- lip-sync mouth shapes;
- multiple viewing/zoom presets.

The avatar should remain independent enough from the AI system that Mana's visual representation can evolve without replacing her underlying identity or AI logic.

---

# 9. Avatar Equipment / Wardrobe

The current project now includes a wardrobe/loadout system.

The intended equipment model is:

| Slot | Required | Default |
|---|---:|---|
| Skin | Yes | Default skin |
| Outfit | Yes | Default outfit |
| Hairstyle | Yes | Default hairstyle |
| Ahoge | Future decision | Currently part of hairstyle |
| Accessories | No | None |
| Background | No | Plain/default |

### Required-slot rule

Mana's default outfit is protected.

The application must never allow a missing, locked, deleted, or invalid outfit selection to leave Mana without an outfit.

Required slots fall back to their default item.

The same principle applies to the default skin and hairstyle.

### Accessories

Accessories can be equipped independently and multiple accessories can be active at once.

Accessory depth is already supported so items can appear:

- behind everything;
- behind the body;
- behind front hair;
- above everything.

This allows things such as headsets, glasses, wings, hair clips, and held objects to be layered correctly.

### Deferred activity response fixes

Manual activity review passed the saved-turn status and warmer feedback changes. Two model response
improvements remain deferred: shared stories should develop the user's concrete contribution rather
than linger on the prior scene, and creative challenge feedback should contain at most one optional
idea. The observed story stayed at a doorway after the user introduced another world; challenge
feedback suggested both a warning bell and a funny arrival sound. Prompt guidance alone has not
fully resolved these behaviors.

### Future wardrobe features

Named saved looks are implemented in the Wardrobe drawer. Up to 30 unique names (60 characters)
store skin, outfit, hairstyle and accessories within the existing mana.avatar.v1 configuration.
Apply uses the current wardrobe unlock resolver and preserves the current body view. Missing or
locked choices fall back with a notice without modifying the saved look. Deletion requires
confirmation. Avatar validation retains bounded, valid looks; existing configurations and backups
without looks remain compatible. Backup and restore include looks through the avatar section.
The saved data overview and restore comparison both display a Saved wardrobe looks count,
including zero for older backups without looks.

Possible future additions include:

- more skins;
- summer outfits;
- winter outfits;
- additional hairstyles;
- removable/toggleable ahoge;
- more accessories;
- backgrounds;
- seasonal wardrobe selection;
- Mana choosing her own outfit;
- imported item packs.

---

# 10. Current Implementation

The current repository already provides a working foundation for the local companion.

## Application

Thoughts foundation is an optional manual simulated character reflection panel under More.
mana.thoughts.v1 stores enabled state and up to 100 reviewed entries; each holds text (2000 chars),
date, mood snapshot and up to six successful conversation excerpts (700 chars each). Failed replies,
diagnostics and hidden tags are excluded. The payload requests a short character reflection rather
than hidden reasoning, forbids invented offline work/preferences/physical senses, and labels assistant
speech as statements rather than event evidence. Sparse evidence permits modest present curiosity.
Generation shares the model lock and abort controller. Only completed output becomes a review draft;
explicit Save persists it. Closing/stopping/failure discards unsaved output. Initiative openings defer
while the panel or draft is open. No automatic scheduling, offline generation, inference recall,
memory/diary source collection, bond or mood changes result from thoughts. Storage does not prune
entries automatically; capacity blocks drafting. Deletion confirms. Backups include the section and
overview count; older files restore disabled empty defaults. Live output grounding needs review.

Voice tuning clarifies precedence: enabled controls override conflicting style adjectives in
profile/card/history/mood, preserving identity facts. Low-playfulness ordinary chat requests a
literal definition and avoids imagined-object analogies unless explicitly requested. Detailed
explanations request definition, actual example values/syntax, explanation and useful detail;
generic references to a game are insufficient. No automatic style rejection or truncation is added.

Ordinary chat and its corrective retry append a bounded current-style reminder after grounding.
Brief targets at most two concise sentences and suppresses optional follow-up invitations;
Detailed explanation questions request definition, concrete example and useful detail (typically
4–6 sentences or a short list), while greetings remain short. Low playfulness discourages playful
analogies. Explicit longer/code/list requests take precedence. Prior replies are not modified,
and output is not mechanically truncated. This tuning needs live verification; task-specific
diary/story formats continue using their own length guidance.

Optional personality controls in Memories → Identity persist validated mana.personality.v1
independently of identity and mood. Warmth/playfulness/curiosity/expressiveness range 0–100;
verbosity is brief/balanced/detailed. Disabled defaults preserve existing profile prose.
Identity context and shared activities receive concrete style guidance; task format, user requests,
accuracy and identity take precedence. Traits do not evolve or alter bond, mood or memories.
Backup restore includes them, with disabled defaults for old files. Live model adherence varies.

Secondary toolbar tools now appear under More: Archives, Settings, Memories, State, Goals,
Follow-ups, Activities and Diary. Model controls and Archive & clear remain directly available.
The trigger exposes expanded state and a combined suggestion count; tool buttons retain their
individual indicators. Selection/outside pointer/Escape closes the panel, with Escape restoring
trigger focus. The grid is bounded to viewport width/height. Shared export notices show the
saved basename and retain the full path as hover text; errors remain visible. Export destinations
and file content are unchanged.

Playtest report text export is available within each artifact's Saved playtests list. It preserves
the report's artifact title/version/ID, report ID/date, actors, outcome, turn count, starting/final
health, basic attack/counter damage, user notes and retained battle log (up to 40 entries).
PREVIEW_RULES accompany the measurements so they remain scoped to the deterministic preview,
not generated code execution or full engine certification. Formatting does not rerun a battle or
alter reports. export_playtest writes unique Mana-playtest .txt files under the approved
C:\AI\ManaAI-CV-2\exports\playtests using the UTF-8 exclusive-create writer and 20 MB cap.

Saved work artifact export is available on each work card, including older revisions selected
through the library. It preserves the content exactly after a text metadata header containing
title, goal, kind, version, saved/generated dates, artifact ID and optional parent ID.
The header retains reviewed-draft, not-executed/tested status; JSON validation and battle previews
do not turn a draft into executed code. No goal, artifact or progression data is changed.
export_work uses the exclusive-create UTF-8 writer with a 20 MB limit under the approved
C:\AI\ManaAI-CV-2\exports\work directory, creating unique Mana-work .txt files. No inference
is required, and the returned path or error is displayed beside the export button.

Activity transcript export formats the selected session's kind, current character name, status,
creation/update dates, prompt, chronological saved turns with roles/dates, and optional result.
It supports word chain, shared story and creative challenge without mutating any session.
Unsaved input and generation previews are excluded; the export control is disabled while that
session is generating. The native export_activity command accepts content only and uses the
exclusive-create writer under C:\AI\ManaAI-CV-2\exports\activities with unique Mana-activity
filenames, UTF-8 content and a 20 MB limit. Model availability is not required.

Diary text export supports one active entry or all active entries. The formatter sorts by creation
time and preserves journal dates, recorded ISO timestamps, moods and saved content. Deleted
entries and source chat excerpts are excluded; the original entries remain unchanged.
export_diary writes only under C:\AI\ManaAI-CV-2\exports\diary, creating it when needed,
with a unique Mana-diary timestamp filename and the existing UTF-8, 20 MB, exclusive-create
writer. Success shows the output path; failure reports an error. No inference or state updates
are performed. Full backup and restore remain the way to preserve all diary recovery metadata.

Conversation text export is available from current chat and an opened archive. A shared formatter
produces UTF-8 text with title, current configured speaker names, recorded timestamps when present,
visible message content and incomplete/error labels. Diagnostics and hidden thinking/emotion tags
are excluded. Export snapshots text before writing, changes no stored state and requires no model.
The native export_conversation command accepts content only, capped at 20 MB, and writes a unique
timestamped .txt file exclusively under the user-approved C:\AI\ManaAI-CV-2\exports\conversations
destination. It creates the category directory when needed and reports the resulting path or error.
Existing files cannot be overwritten. Future export types can receive separate directories under
exports; no other export type is implemented yet. The export root is excluded from Git.

Chat archives use mana.chat_archives.v1, a native SQLite allowlisted section. Archive & clear
confirms the action, persists the archive and flushes storage before clearing active chat. Errors
retain active text and requeue it for saving. Inference is blocked during the operation.
The read-only Archives drawer searches titles and cleaned message text, outlining matches in
the selected full transcript. Up to 50 archives retain validated current-chat snapshots (up to
all currently visible messages); no automatic archive eviction. Full capacity blocks clearing. Permanent
archive deletion requires confirmation. Backup validation includes archives and supports older
files without the section; overview and restore comparison display archive counts.
Archives are never supplied to inference, memory suggestions or journal source collection.
Previously cleared chat remains unrecoverable unless retained in an older backup.

Chat history search is available above the transcript. Case-insensitive literal matching uses
user text and cleaned assistant text, excluding hidden tags, thinking and diagnostics. Matching
message IDs retain chronological order; Previous/Next wrap through results, and Enter advances.
Navigation scrolls to and outlines the selected bubble without filtering or modifying chat.
Latest clears selection and resumes following new messages. Search state is local to the panel,
requires no inference, and is not included in saved data or backups.

- Windows desktop application.
- Tauri 2 shell.
- React + TypeScript frontend.
- Rust backend for local process management.

## Local LLM

Implemented:

- local `llama-server` integration;
- GGUF model selection;
- configurable model path;
- configurable llama-server path;
- configurable port;
- context size;
- GPU layer configuration;
- model start/stop;
- health monitoring;
- streaming chat responses;
- local OpenAI-compatible chat-completions endpoint;
- handling of model startup failures and logs.

## Chat

Chat retries now retain bounded diagnostics: up to two raw attempts, their individual repetition/capability
classification, and an optional simpler-prompt comparison (8,000 characters per text). A collapsible
Reply diagnostics view appears on retried messages, including successful corrected replies. The final
error names the specific failing check. Diagnostics persist with chat and are excluded from prompts
and memory evidence. Clearing chat removes them. Compare with simpler prompt uses the current model
and temperature with the same user input, a short standalone prompt, and no history/saved context.
Comparison output stays in debug data, uses the shared model lock and cancellation, and does not update
relationship, mood, progress, or journal evidence. This supports false-positive analysis but does not
establish causality by itself, since generation varies and context differs.

Near-duplicate replies use shared adjacent-word overlap in the latest eight messages, with a ten-word
minimum and a 0.72 Dice threshold. Same-question answers, short greetings, explicit repeat requests,
and differing topics are protected from this check. Narrow capability checks detect unsupported visual
observations, promises to provide food/drinks, and music playback. Explicit roleplay requests and marked
imaginary scenes are exempt. Chat issues receive one corrective retry; a second issue is an error and
grants no relationship gain. Initiative capability claims also receive one retry before rejection.
These heuristics do not establish general factual correctness. Chat streams may briefly show a candidate
before correction; errors do not require restarting Mana.

Activity grounding accompanies system and latest-user context in chat and initiative prompts.
Interests and imagined ideas do not imply autonomous coding, robot control, game execution,
music playback, or physical activities. Older assistant stories are not evidence of activities.
Mood questions should use current state without invented causes; topic requests should offer
two or three concrete choices, with a low-effort option when tired. Both known older default
cards migrate with line-ending tolerance; custom cards stay intact. Live model adherence still
requires validation; these are prompt rules rather than verified activity tracking.

Repetition handling now removes example dialogues from the default character card, migrating only
an exact saved copy of the previous default and preserving custom cards. Model payloads omit stale
copies of duplicate assistant replies of at least 40 characters while retaining the latest occurrence;
saved/visible chat is unchanged. Ordinary replies that exactly echo recent assistant wording receive
one corrective retry. Same-question factual answers and explicit repeat/quote requests are exempt.
Initiative echo checks remain active. A second echo produces an error and grants no relationship gain.
This is a bounded repetition guard, not a guarantee of local model creativity or semantic understanding.

Implemented:

- conversational UI;
- streaming responses;
- persistent chat history between launches in SQLite (latest 200 messages);
- clear-chat functionality;
- configurable character/user names;
- system prompt configuration;
- temperature setting;
- model readiness state;
- stopping an active response.

## Emotion and expression

Implemented:

- emotion tags in model output;
- removal of visible `<think>` blocks;
- emotion extraction;
- emotion-to-avatar expression mapping;
- multiple eye expressions;
- multiple mouth expressions;
- blinking;
- basic text-driven mouth/lip-sync animation.

Current supported expression concepts include:

- neutral;
- happy;
- excited;
- sad;
- worried;
- thinking;
- surprised;
- embarrassed;
- sleepy.

## Avatar

Implemented:

- modular PNG-based avatar;
- configurable avatar folder;
- layered body/hair/outfit/accessory rendering;
- accessory depth;
- full/half/bust views;
- zoom control;
- avatar asset reloading;
- customizable accessories;
- separate hairstyle layers;
- expression layers.

## Wardrobe

Implemented:

- wardrobe panel;
- skin selection;
- outfit selection;
- hairstyle selection;
- accessory selection;
- required-slot enforcement;
- default-item protection;
- automatic fallback to defaults;
- persistent loadout configuration.

## Progress and unlock foundation

Implemented:

- days spent together;
- message count;
- coding-level placeholder;
- milestones;
- unlock rules;
- unlock notifications;
- item metadata via `items.json`;
- seasonal unlock rules;
- message/day/milestone-based unlock rules.

The unlock system is intentionally extensible so future features such as the diary, games, skills, and other achievements can contribute milestones.

---

# 11. Project and Asset Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for source responsibilities, runtime
data locations and avatar asset layout. Update that guide when the layout changes.

---

# 12. Development Principles

ManaAI should follow these principles throughout development.

## Local-first

Core companion functionality should work locally whenever practical.

## Modular

Mana's memory, personality, AI runtime, avatar, activities, and future world systems should remain separable.

## Persistent

Mana should retain meaningful state between launches.

## Incremental

Build small pieces at a time.

Every milestone should leave the application in a usable state.

## Expandable

V1 architecture should not prevent V1.x, V2, or V3.

## Character-first

Mana should remain a coherent character as new features are added.

New systems should enhance her identity rather than turning her into a collection of disconnected features.

## Safe autonomy

Future autonomous capabilities such as filesystem access, code execution, generated programs, and external tools should have explicit permission and sandbox boundaries.

---

# 13. Roadmap

The milestone checklist and scope/status notes are maintained in [ROADMAP.md](ROADMAP.md).
Keep implementation detail here and update the roadmap when scope or completion changes.

---

# 14. Ultimate Goal

ManaAI should eventually feel less like:

> "A chatbot with an avatar."

and more like:

> **"A little person with an ongoing digital life who happens to live inside my computer."**

She should be able to remember the past, experience the present, have things she cares about, develop interests, create things, change over time, and eventually exist inside a world of her own.

The technology is there to support that character.

The character remains the heart of the project.

---

## Repository

The current implementation is maintained in [ManaAI-CV-2](https://github.com/Aishi-mana/ManaAI-CV-2.git).

