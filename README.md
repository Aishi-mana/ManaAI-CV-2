# Mana

Repository: [Aishi-mana/ManaAI-CV-2](https://github.com/Aishi-mana/ManaAI-CV-2.git)

A local daughter-companion AI. Step 1: a chat window that launches `llama-server` and talks to your GGUF model.

Project history: [Changelog](docs/CHANGELOG.md) · [Dev log](docs/DEVLOG.md) ·
[Roadmap](docs/ROADMAP.md) · [Project structure](docs/PROJECT_STRUCTURE.md) ·
[Vision and implementation](docs/ManaAI.md). The logs include a retrospective
backfill with stated evidence limits; new meaningful changes should update both logs.

## Run it

```powershell
npm install
npm run tauri dev
```

The first run compiles the Rust side and takes several minutes. Later runs are fast.

## First launch

1. Click **Settings**.
2. Check the **llama-server file** (it is prefilled with `C:\ai\llama-cpp\llama-server.exe`).
3. **Browse** for a model, for example `Qwen3-8B-Q4_K_M.gguf`.
4. Type your name under **Your name**, then **Save settings**.
5. Click **Start model**. The pill turns green when it is ready, then say hi.

Settings, chat history, avatar selections, and progress are stored in `mana.sqlite3` in Mana's application data
directory (`%APPDATA%\com.mana.companion` on Windows). The database engine ships with the app.

On the first launch after this update, existing webview `localStorage` data is imported in one transaction.
The original records are retained in `localStorage` and in the database's `legacy_backup` table. Migration
runs once and never overwrites existing database values. Chat keeps the existing 200-message retention limit.
Browser-only development continues using `localStorage`.

Startup waits for saved data to load. A database error shows a Retry screen instead of opening with empty state.
Save failures show a banner and retain pending changes for **Retry saving**. Normal window closing waits for
pending saves, and stays open if saving fails. Streaming replies are checkpointed once per second.

## Persistent companion state

Open **State** in the top bar to inspect Mana's mood, energy, curiosity, social need, and last conversation
time. State is stored in SQLite, updates each minute and during chat, and catches up after time away without
running the model in the background. Defaults are neutral mood, energy 70, curiosity 60, and social need 20.

Chatting uses 2 energy, adds 2 curiosity, and eases social need by 12. Idle time restores 2 energy and adds
3 social need per hour. Curiosity returns toward 60 with a 12-hour half-life. Reply emotion tags update mood;
mood intensity halves every 2 hours and settles to neutral below 0.15. All needs stay within 0–100.
Energy below 20 gives the idle avatar a sleepy expression. Replies may display their immediate expression
while streaming; completed replies update persistent mood. Failed or stopped replies do not set a new mood.

The current state is provided to chat to gently influence tone while preserving identity and memory facts.
Social need does not oblige you to chat, and the prompt instructs Mana not to guilt you for being away.
Manual reflection, diary writing, optional initiative, and a basic activity scheduler are available; autonomous projects remain planned.

## Goals

### Goal work sessions

#### Battle preview

After a battle finishes, add notes or a measurable balance target and choose **Save playtest report**.
Each run can be saved once; Restart battle begins a new run. Reports persist in SQLite with the exact
artifact ID/version, player/opponent, starting/final health, basic damage, counter damage, outcome,
turn count, notes, and the latest 40 log entries (earlier actions may be omitted in long battles).
Inspect or delete them in the artifact's Saved playtests section. No goal or progression points change.
Deleting an artifact also deletes its reports after confirmation; other versions remain intact.

Revisions automatically receive the latest three reports for the selected version, with up to 12
recent log entries each and the exact preview rules. Other versions' outcomes are not attributed to it.
Put a target in your notes/request, for example "Hero should win with 10–30 health using one potion."
Mana proposes numeric changes from that evidence; revisions are untested until played again. A single
action sequence is evidence for that run, not proof of general game balance.

Saved artifacts now offer **Battle preview** for JSON passing game-data checks with at least two
characters. Pick distinct living player/opponent characters and Start battle. Attack deals the player's
attack plus the first inventory weapon's damage. The opponent counters using its attack if it survives
the action. Healing consumes one item, caps at initial player health, and uses numeric heal fields.
Skills use numeric damage or `effect: {"type":"damage","amount":30}` (or type heal); amount must be
positive and finite. Skills are reusable, with no mana system. Descriptive effect strings are ignored
and unsupported actions are disabled. Use a reviewed artifact revision to convert effects when needed.

Defeated characters cannot act; a defeated opponent does not counter. Restart resets from the artifact.
This is a built-in deterministic interpretation of JSON, not generated-code execution or a full game
engine. Preview state is session-only, does not alter artifacts or goals, and grants no progression.

Saved artifacts offer **Validate JSON**. It checks syntax (including a single JSON code fence) and,
when recognizable characters/items arrays are present, required names/health/attack/inventory, item
names/types, duplicate names, finite nonnegative numeric fields, weapon damage, and inventory references.
Common content wrappers are followed without modifying the artifact. Other valid JSON receives a
syntax-only result. Descriptive effects and schema-dependent consumables receive warnings. Results
are session-only, do not change progression, and do not execute code or establish game behavior.

#### Artifact revisions

**Activities** offers saved sessions for Word chain, Shared story and Creative challenge.
Turn status is derived from the saved transcript: awaiting Mana, generating, your turn, or feedback
saved. It no longer retains an old “Ask Mana” notice after her response. Activity prompts use the
editable Identity personality as bounded tone guidance; challenge feedback requests conversational
companion wording and one specific reaction rather than formal critique. Existing replies remain saved.
Word chain runs locally without a model: words must use 3–20 English letters, start with the last
letter of the previous word and avoid repeats. User spelling is not dictionary-checked; Mana uses
a built-in list and concedes if she has no unused match. Stories alternate saved user contributions
and a requested model paragraph; challenges save one response with optional model feedback.

Save your turn first, then request Mana's contribution. Failure/stop leaves your turn available
for retry; incomplete model text is not saved. Pause/resume, finish and session history persist
across restarts. New sessions preserve old transcripts, up to fifty sessions with bounded turn
limits. Deleting a session requires confirmation. Activities are separate from chat, automatic
memory suggestions, diary sources and goal completion, with no automatic bond/progression gains.
They share the normal model lock, and automatic openers defer while the panel is open.
Backups now include nineteen sections; older backups restore an empty activity-session list.

**Follow-ups** stores user-reviewed topics to revisit. Direct messages such as “Let's talk about
our game tomorrow”, “Remind me about our game in 30 minutes”, or “Let's name our game on 2026-10-12
at 14:30” propose an editable note. Suggestions are not scheduled until saved; questions, ambiguous
phrasing and assistant statements are excluded. Tomorrow/date-only requests default to 09:00 in
the journal timezone. Manual notes are available without the model.

Pending notes become eligible after their local date/time and can inform an opt-in conversation
starter while Mana is open. Quiet hours, pauses, randomized intervals and existing busy guards still
apply; this is not an exact-time alarm. One successful starter consumes a note's prompt eligibility
without marking it done. Complete, dismiss, postpone, edit or reopen notes in the drawer; editing
or postponing resets prompt eligibility. Failed/stopped starters do not consume it. Notes and review
decisions persist and are included in backups/data overview. Older version-1 backups restore an
empty follow-up list; all their other data remains supported.

The bulk reliability pass adds a read-only **Saved data overview** in Settings: active/deleted diary
counts, chat, memories, goals, work, playtests, estimated snapshot size, and missing-link notes.
Deleted goals/parents may explain those notes; nothing is automatically deleted or repaired.
Restore previews compare current vs incoming counts (equal counts do not prove equal contents).
Every confirmed restore first saves a new safety JSON in the app-data `backups` folder; failure to
save it stops replacement. Settings lists the latest 20 safety copies for preview/restore; older
copies remain on disk. Old-document writes are blocked during replacement/reload.
See [Reliability checks](docs/Reliability-checks.md) for the live verification steps.

Chat now keeps your scroll position while you read older messages; **Jump to latest** resumes
following streamed replies. Stopped partial replies are marked incomplete, and failed replies are
excluded from later inference, memory suggestions, and journal evidence. Welcome-back retry
diagnostics distinguish incorrect return roles from repeated wording.

Goals → Saved work has title/goal/content search, type filters, and a latest-version-per-family
view enabled by default. Disable that checkbox to inspect older versions; filters never alter
saved artifacts. New daily entries retain up to twelve dated chat excerpts, displayed under
**Recorded chat evidence** and available for rewrites even after chat is cleared. Excerpts follow
the entry into Recently deleted and backups; permanent deletion removes that entry's excerpts.

Settings now offers **Export backup / Choose backup to restore** while the model is stopped.
Versioned JSON includes all 22 saved-data sections, including identity, memories, diary trash, goals,
artifacts and playtests; model/avatar files are excluded. Files contain private chat and local paths.
Restore validates sections, shows date/counts, and asks before replacing all data in one SQLite
transaction, then reloads. Export current data first to keep it. Unknown versions, missing/unknown
sections, invalid records and files over 20 MB are rejected. Export never overwrites an existing file;
choose a new name. Restored file paths may need adjustment on another machine.

Welcome-back replies explicitly distinguish the returning user from Mana, who remained available.
A scoped check catches first-person return announcements and “did/do/have you miss(ed) me” questions
on the pause-return turn, using the existing one-retry pipeline and diagnostics. A second rejection
saves no successful reply or relationship reward; normal later chat is not subject to this check.

Your next chat message after a requested pause now ends it early (unless requesting another pause).
Mana receives the saved original request once for a grounded welcome back, including after restart
or natural expiry. She must answer the new message without assuming accomplishments during absence.
Returning resets the randomized opener cooldown, preserves opt-in, and grants no extra relationship
reward/penalty. Explicit Resume in State clears the saved reason without generating a greeting.

Diary Delete now moves entries to **Recently deleted**, persisted across restarts, with Restore and
confirmed permanent deletion. Restoring a daily entry requires no other active entry for that date.
**Rewrite today's journal** explicitly bypasses the completed-date marker and uses retained dated
sources plus available successful chat. On success an existing active daily entry moves to trash;
failure/abort preserves it. Automatic writing remains once per date, including deleted entries.
Older hard-deleted entries cannot be restored; rewriting generates new wording from remaining evidence.

Daily journals now retain both user statements and completed assistant replies/openings with
speaker labels and timestamps. Failed/aborted replies are excluded; existing source records default
to user statements. Accepted memories remain background. Goal snapshots are included only when
their latest update falls on the journal date, and are labelled user-recorded snapshots rather than
a change history. Assistant words do not prove physical actions, tested code or offline events.
Already written entries remain intact; the richer evidence applies to future entries.

Chat requests “I'm busy”, “I'm working”, or “talk later” pause starters for one hour. “Give me 30
minutes” or “talk in 2 hours” sets a specific pause (1 minute–24 hours). The pause persists across
restarts, clears any pending reply countdown without a timeout penalty, and leaves ordinary chat
available. State shows the end time and a Resume button. Resume/expiry still respects opt-in,
cooldown, idle and quiet-hour rules; the manual testing button also respects the pause.

Conversation starters receive up to three active goals and the last twelve successful chat messages
(bounded excerpts), so Mana can offer a specific optional follow-up. Prompt guidance respects refusals
and postponed topics, avoids old invitations, and treats assistant suggestions as unconfirmed offers.
Exact/near-duplicate replies or identical recent questions trigger one retry; repeated output is dropped.
The comparison covers the last eight successful assistant replies, including across restarts while chat
is retained. Existing opt-in, randomized timing, quiet hours and reply deadlines still apply.

Revision drafts and saved versions show a before/after content summary (up to 40 changes).
JSON whitespace/key order alone does not count. Unchanged model output gets one corrective retry;
if still unchanged, no new draft is created. Saving an unchanged revision is blocked.
Changes do not prove balance: save a fresh completed playtest report on each new version, since
revision prompts use only the selected version's reports. Existing versions remain intact.

Revision prompts supply original content separately from application metadata and require the same
document format/root structure unless you request a change. A narrow cleanup removes an extra
title/kind/content envelope only when its title/kind match application metadata and its inner JSON
retains the original root keys/type. Legitimate document title/content fields, unfamiliar structures,
and malformed JSON remain for review. Existing saved versions are never rewritten by this cleanup.

In Saved work, enter a requested change and choose **Draft revision**. The goal must still be active.
Mana receives the selected artifact's full text and goal snapshot, then drafts a complete replacement.
Review/edit it and Save artifact to append a new version; the original is never overwritten. Revisions
retain parent ID, family root ID, and an incrementing family version number. Selecting an older version
creates a branch whose parent remains that selected version. Existing artifacts become v1 on load.
Stop, failure, or dismissal saves no revision; replacing an unsaved draft asks for confirmation.
If the source artifact or goal is deleted before review, saving the revision is blocked. Deleting an
already saved version leaves other versions intact, with an explicit missing-parent label where needed.
All links persist in SQLite. Code stays unexecuted/untested, with no automatic goal completion or points.

For an active saved goal, select **Design notes**, **Writing**, or **Code draft**, describe the small
contribution, and choose **Work on this goal**. Save goal edits first. The local model generates one
draft under the shared model lock; chat, journal, and proposal generation cannot overlap it. State
shows Drafting a goal contribution. Stop work session or closing Goals cancels generation, creating
no new artifact. Failed generation also saves nothing. Replacing an existing unsaved work draft asks
for confirmation; drafts remain editable but are lost on restart.

Review the draft title/text and choose **Save artifact** or **Dismiss work draft**. Saved artifacts retain
their goal ID/title snapshot, kind, generation and save timestamps, and up to 16,000 characters of text.
They persist independently in SQLite and can be inspected or deleted in Saved work. Deleting a goal
preserves its saved artifacts; a new draft cannot be saved if its goal was deleted before review.
No code is executed, tested, exported to files, or automatically marked complete. Drafting/saving adds
no relationship, interest, skill, or memory points. Latest three artifact excerpts (1,000 characters
each) inform chat, initiative, reflections, and journals as reviewed drafts, not verified execution.
Generation timestamps distinguish actual drafting from imagined activity. Existing daily entries are
not rewritten automatically after a new artifact is saved.

### Interest enthusiasm

Goals now shows an editable 0–100 enthusiasm slider for each Identity interest, defaulting to 60.
Interest names remain in Memories → Identity. Levels persist separately in SQLite, matched by trimmed,
case-insensitive names; renaming to a new name starts at the default while hidden old levels are retained.
Accepting a new related goal adds 3 once to matching interests, capped at 100. Matching uses words in
the reviewed title/plan, with simple plural normalization; it is not semantic classification. Existing
goals are not scored retroactively. Editing, status changes, deletion, discarded proposals, chat, and
time away do not change enthusiasm. Higher scores guide relevant chat, initiative, and goal ideas;
they are not evidence of skills or completed activities. Dynamic autonomous preferences remain planned.

Goal titles remove outer Markdown emphasis, code wrappers, and heading markers on acceptance, edit,
and loading existing goals. Plans, progress notes, status, and creation timestamps are preserved.

Open **Goals** and choose **Ask Mana for an idea** with the model ready, or write your own draft.
The first line is the title; the remaining lines are a prospective plan. Edit before **Accept goal**,
or **Dismiss draft**. Generated proposals never save automatically. Drafts are not persisted across restart.
Replacing an unsaved draft requires confirmation. Failed or stopped generation creates no goal.

Saved goals support title/plan edits, explicit progress notes, pause/resume, completion, and deletion.
Use Save changes to record edits; status buttons also save current fields. Goals persist in SQLite
independently of chat and memories. Clearing chat does not remove goals. Proposal generation shares
the model lock with chat, journaling, and reflection and can be stopped; closing Goals cancels it.
Open Goals postpones automatic initiative openings.

Up to four saved goals prioritize active plans and inform chat, initiative, reflections, and daily journals.
Plans are aspirations; progress/status are user records, not tool execution results or proof of events
on a journal date. No autonomous steps, memory insertion, skill points, or relationship rewards are added.
Interest names come from Identity, with editable enthusiasm and accepted-goal reinforcement; autonomous project execution remains planned.

## Activity modes

State shows Mana's current mode and its start time. The application selects daily journaling,
reflection, starting a conversation, chatting, or waiting based on actual current work, in that order.
When otherwise idle, energy below 35 during 22:00–08:00 in the journal timezone selects simulated
sleep; energy below 40 selects rest; otherwise she is ready to chat. Chat interrupts rest/sleep immediately.
This is a lightweight mode scheduler, without continuous inference or autonomous game/coding activity.
Rest recovers 8 energy/hour toward 55; sleep recovers 12/hour toward 70, then remaining elapsed time
uses baseline recovery of 2/hour. Offline recovery remains 2/hour. No relationship rewards, penalties,
or background model calls are added. Modes update on interaction and every 30 seconds, persist in SQLite, and start a new session
on launch instead of fabricating an uninterrupted activity history while closed. Chat and initiative
receive explicit mode context; it is not evidence of activities she performed. Room animations and
interest-driven activities remain future work.

Rest continues until energy reaches 55; sleep continues until 70 or daytime (08:00), unless another
activity interrupts. These targets prevent rest/sleep from ending immediately after their entry thresholds.
Energy updates each minute. Mode transitions settle elapsed time at the previous rate before switching;
chat settles recovery first and then spends 2 energy. Restart uses baseline offline catch-up and reselects
the current mode without claiming uninterrupted sleep while closed.

## Initiative conversations

In **State**, enable **Let Mana occasionally start a conversation**. It is off by default, with a
60-minute minimum between attempts (choices from 15 minutes to 4 hours). Each deadline is randomly
chosen between that minimum and twice its duration, saved once per attempt or resolution, and preserved
through restart. Enabling initiative or changing the minimum draws a new deadline. Automatic checks run every
30 seconds with the app open, chat visible, and the model ready. They wait two minutes after launch
and five minutes after sending or typing. An unsent chat draft prevents an opening.
Quiet hours are 22:00–08:00 in the journal timezone; energy below 20, open panels, chat/reflection,
an unsaved reflection draft, saving errors, and a due journal postpone automatic initiative.

**Start a conversation now** tests an opening immediately, bypassing quiet hours and time waits.
It still requires initiative enabled, a ready model, no draft, and no unanswered opening.
Only completed, nonempty generation adds a chat message. Stop or failure adds nothing and still
counts as an attempt for cooldown. Attempts are saved before inference; successful openings and
their waiting state are saved together. The next user message clears waiting and receives context
about the opening, while allowing a change of subject. Dismiss clears waiting without deleting
the chat message and draws a new cooldown. Clearing chat also clears waiting and draws a new cooldown.

Waiting and cooldown survive restart. The reply window defaults to five minutes, configurable from
1 to 30 minutes in State; changes apply to future openings. When it expires, one fixed closing message
("I guess you're busy … We can chat later") clears waiting and draws the next random deadline. It needs
no model inference. Time away counts; an overdue wait resolves when the app is visible and not chatting,
reflecting, typing a draft, or showing a saving error. Disabling initiative postpones timeout handling
until re-enabled; dismissing or replying cancels it. No repeated reminders apply; timeout resolution makes a small relationship adjustment.
Initiative is an assistant message, never a synthetic user fact or journal
source. It does not add user message progress or automatically save memories. The prompt asks for
one gentle question without invented activities or pressure to reply; model wording can vary.
This runs inside Mana and does not wake a closed app or send desktop notifications.

Replies to an opening are explicitly marked as received, with the user's answer supplied alongside
the previous question. If the model echoes that opening verbatim (ignoring labels, tags, case, and
punctuation), Mana retries once with a correction. A second echo produces a visible retry error
rather than saving another duplicate response. Local model wording still needs live verification.

Randomized timing, reply timeouts, and small relationship changes are implemented.

## Bond and affection

State displays persistent **Bond** (familiarity, initially 30/100) and **Affection** (warmth, initially
50/100). Scores stay within 0–100. A completed, nonempty conversation adds 0.2 bond and 0.5 affection.
A completed reply to an initiative opening adds 0.3 bond and 1 affection instead. Failed, stopped,
or empty replies, generated openings, and diary writing grant nothing. Old chat is not scored retroactively.

An unanswered initiative timeout subtracts 0.1 bond and 0.5 affection once. Dismissal and clearing chat
have no penalty. Disabling initiative postpones timeout handling; re-enabling with an expired pending
opening can resolve it once. Offline time counts toward the pending deadline; general absence does
not decay scores. Persisted outcome IDs prevent repeated scoring or both a reply and a timeout
scoring the same opening. Timeout chat, pending resolution, and relationship state save together
in SQLite; completed replies save chat alongside their gains.

Relationship context gently informs chat and initiative tone while preserving saved identity.
Mana remains kind at all scores; prompts prohibit blame, demands for attention, and threats over points.
These are fictional companion progression stats. More nuanced dynamics remain planned.

## Time awareness

Chat and reflections receive a fresh application clock for each request, using the journal timezone
(Asia/Singapore by default). It supplies the current date, time, time of day, yesterday's calendar date,
and the last recorded conversation time. The State panel displays this clock too.
Up to eight recent dated user statements provide bounded temporal context. Their timestamps describe
when the words were said, not when the events they mention happened; undated history stays undated.
The prompt tells Mana not to infer activities from time away. This provides time context without
background inference; model adherence still varies.

## Reflection and diary

Open **Diary**, start the model, and click **Reflect now**. Mana writes a short first-person reflection from
up to eight recent user messages, four saved memories, her identity, and current state. Assistant replies
are excluded as factual evidence to avoid reinforcing prior invented stories. Sources are bounded, and the
prompt tells her not to invent activities or assume undated notes happened today. Generated wording still
needs your review.

Edit the draft and choose **Save diary entry** to store it in SQLite. Saved entries include creation time,
mood, and source message/memory IDs. The first save grants the `first_diary` milestone. Entries persist
independently of chat and memories and can be deleted. Drafts are not saved automatically and are lost on restart.
Reflection can be stopped; failed or interrupted generation does not create an entry. Chat is paused while
reflection uses the model. Diary entries do not enter chat recall or create memories automatically.
### Daily journal

Daily journaling is enabled by default at **22:00 Asia/Singapore**. In Diary, change the writing time,
disable automatic journaling, or choose **Write today's journal now**. Mana writes and automatically saves
one dated daily entry; manual reflections remain separate drafts that you review and save.

The scheduler checks every 30 seconds while the app is open and the model is ready. It waits two minutes
after opening and after the day's latest message, and never overlaps chat or reflection. An unsaved manual
draft or a persistence error postpones scheduled writing. Closing the Diary panel does not stop a daily
entry being written; use Stop reflection, stop the model, or close the app to cancel it.

New user messages have timestamps and are kept in a journal-source buffer independent of the 200-message
chat limit. Up to 12 messages sampled across the day and four saved memories provide bounded evidence.
Existing undated chat is not retroactively assigned to a day. A journal is a snapshot at writing time;
conversations after that day's entry are not added to it automatically. Saved preferences are background
facts, not proof that something happened that day.

Missed dates with recorded messages are caught up oldest-first when Mana next runs with a ready model.
Days when Mana was closed and recorded nothing are skipped; an open but quiet day can get a short honest
entry without invented activities. Failure or cancellation does not mark the day complete and retries
wait five minutes. Successful completion persists the date and clears its source buffer. Deleting an entry
does not trigger automatic regeneration. Entries and completion state save in the same SQLite batch.
The app does not launch itself or run inference while closed. Diary-derived memory proposals remain planned.

## Identity and memories

Open **Memories** in the top bar. The **Identity** tab lets you edit Mana's relationship, background,
personality, values, and interests. The profile is stored in SQLite and included in the next chat request
alongside your character card. Character and user names remain in Settings.

The **Memories** tab supports manually adding, editing, deleting, searching, and pinning facts about you,
Mana, or your time together. Importance ranges from 1 to 5; pinned memories appear first. Records have
creation/update timestamps and persist independently of chat. Clearing chat does not delete memories.
It also suggests memories from direct statements in your recent chat, such as "My favorite drink is coffee",
"I enjoy puzzle games", or "I work as a developer". Open Memories when its count appears, review the source,
edit the suggested fact, and choose **Save memory** or **Dismiss**. Changed favorite preferences offer
**Update memory**, preserving the original pin and creation date. Decisions persist across restarts.
Suggestions are generated locally with conservative phrase matching; they are not recalled until accepted.
Mana's direct first-person favorites and likes/loves/enjoys/prefers statements also produce reviewable
preference suggestions, labelled with her name and original reply. Saving stores them under Mana,
separately from your facts; changed favorites offer an update only to the same owner's memory.
Questions, tentative choices, error replies, jobs and activities are excluded from her suggestions.
Edit, save or dismiss in Memories. Choices remain character preferences rather than proof of events;
no extra model call or automatic identity/interest-slider update occurs.
Chat recalls notes using keyword matches from your current message and the previous two user messages.
Pinned notes receive priority; at most eight notes are included within a bounded context budget. This is
basic local retrieval, not semantic search. The current identity and recalled facts are also placed next
to the current question to help local models follow them over older assistant guesses. Instructions tell
Mana to admit unknown facts rather than inventing memories; model adherence can still vary.
Memories now track strength, recall count, and last recall time. New memories start at **60/100**. Unpinned
strength halves every **30 × importance days** (30 days at importance 1; 150 at importance 5), with a floor of 5.
Fading never deletes a memory or makes it ineligible for a relevant lookup. Strength helps rank otherwise
equally relevant memories. Decay uses elapsed wall-clock time when memories are viewed or retrieved, including
time while the app is closed; it requires no background model inference.

After a successful, nonempty reply, relevant memories supplied as context gain **10 strength**, capped at 100,
and their recall count/time is recorded. This tracks inclusion in relevant context, not proof that the model
mentioned the fact. Unrelated pinned notes, failed replies, and stopped replies are not reinforced.
Pinned memories have effective strength **100** and do not fade; unpinning starts decay from 100 at that time.
Editing or changing importance settles prior decay before applying the new rate. The Memories panel displays
strength, faint/protected status, recall count, and last recall time.

Broader model-based extraction and semantic retrieval remain planned. SQLite schema version **3** upgrades
existing identity, memory, chat, and progress data in place, adding strength and recall metadata.

## Avatar (step 2)

Mana's paper doll is built from the PNGs in your avatar folder (Settings -> Avatar folder). Expected layout:

The default avatar is bundled automatically in development and packaged builds. Leave **Custom avatar folder**
empty, or click **Use bundled avatar**, to use it. Browse to a folder to use your own assets.
Old hardcoded default paths are migrated automatically; other custom folders are preserved.

When moving a portable build made with `Build Mana exe.bat`, copy `mana.exe` and its adjacent `assets` folder
together. Installer builds include the assets automatically.

```
base/            body.png
eyes/            eye_<name>.png      (one per look, plus eye_closed and eye_half_closed for blinking)
mouth/           mouth_<name>.png    (rest mouths) and mouth_a/e/i/o/u.png (lip sync)
hairstyles/<style>/   hair_back.png (behind the body), hair_front.png, hair_ahoge.png ...
outfits/<name>/       outfit.png      (a file with "_back" in its name goes behind the body)
accessories/     any .png, toggled from "Dress up and test"
accessories/<depth>/   same, but placed at a depth (see below)
```

Which eyes and mouth each emotion uses, each accessory's depth, and the zoom presets all live in `src/core/avatar-map.json`.

**Accessory depth** (bottom to top): `back` (behind everything), `behind-body` (above back hair, behind the body, e.g. wings),
`behind-front-hair` (e.g. headset, glasses), `top` (above everything, the default, e.g. handheld items).
Set it by dropping the file into `accessories/<depth>/` (e.g. `accessories/behind-body/wings.png`) or by adding a line to `accessorySlots` in the JSON.

**View:** the Full / Half / Bust buttons under her, or scroll the mouse wheel over her to zoom.
After adding or changing images, press **Reload images** in the "Dress up and test" panel.

## Wardrobe and unlocks

Open **Wardrobe** under her (or from the unlock banner). Skin, outfit and hairstyle can never be empty: she always
wears her **default**, and defaults are always available. Anything that is missing, still locked, or removed
falls back to the default automatically. A valid skin needs `body`, an outfit needs `outfit`, and a hairstyle
needs `hair_front` (PNG, WebP, JPG or JPEG). Folders containing only extra layers are excluded from the wardrobe.
If a required selection and its default are unavailable, she is not drawn and the stage explains what is missing.

Extra skins live in `base/<skin>/body.png` (the loose files in `base/` are the `default` skin). Outfits, hairstyles
and accessories work as described above.

To give an item a nicer name or make it earnable, create `items.json` in your avatar folder. The key is the item's
id: `outfits/<name>`, `hairstyles/<name>`, `base/<skin>`, or `accessories/<name>`. Items without an entry are available
from the start.

```json
{
  "outfits/summer": { "name": "Summer dress", "unlock": { "type": "days", "value": 7 } },
  "outfits/winter": { "name": "Winter coat",  "unlock": { "type": "season", "months": [12, 1, 2] } },
  "hairstyles/long": { "unlock": [ { "type": "messages", "value": 500 }, { "type": "milestone", "id": "first_game" } ] },
  "accessories/glasses": { "unlock": { "type": "skill", "value": 2 } }
}
```

A list of rules means all of them must be met. Rule types: `days` (different days you chatted), `messages`,
`skill` (Mana's coding level, nothing raises it yet), `milestone` (`first_chat` works now; `first_diary` and
`first_game` come with those features), and `season` (months 1-12). Progress counts from the day you update.
The first time something unlocks, a banner appears and Mana is told so she can react.
Reload with the **Reload images** button after editing `items.json`.

## Notes

**More → Thoughts** provides optional simulated character reflections. Enable the panel and
click **Draft a thought**, then review and explicitly save it. Up to 100 dated thoughts retain
their mood and up to six recent successful chat excerpts. Stop/failure/closing discards an unsaved
draft. These reflections are not hidden model reasoning; they never enter chat context, memory
recall or diary sources and do not change bond or mood. No automatic or offline generation.
SQLite, backups, restore and saved-data counts include thoughts; older backups restore an empty,
disabled panel. Deletion requires confirmation. Live grounding remains subject to model adherence.

Enabled voice controls now explicitly override conflicting style adjectives in profile prose,
character cards, mood and old replies while preserving identity facts. Low playfulness requests
literal explanations; Detailed requests actual example values/syntax and an explanation, rather
than a generic game reference or invitation. User-requested analogies still take precedence.

Ordinary chat now reinforces the current voice settings at the end of its request: Brief asks for
at most two sentences without an automatic follow-up; Detailed explanation questions ask for a
definition, concrete example and useful detail. Explicit user requests override these defaults.
Low playfulness also avoids playful analogies. Older replies remain intact; guidance still depends
on model adherence and does not truncate output.

**More → Memories → Identity** offers optional **Consistent voice traits**: warmth, playfulness,
curiosity, expressiveness and reply length. Enable and save them for the next generated reply.
Profile prose remains intact. Traits guide identity-based chat, initiative, reflections, goals and
shared activities; task format takes priority. They do not change mood or memories. SQLite and
backups retain them; old backups restore disabled defaults. Model adherence needs live review.

The toolbar groups Archives, Settings, Memories, State, Goals, Follow-ups, Activities and Diary
under **More**. Its badge totals pending memory/follow-up suggestions; individual counts remain
inside the menu. Selecting a tool, clicking outside, or pressing Escape closes the menu.
Export success notices show only the filename; hover to see the full destination path.

Saved playtests offer **Export report** under `exports\playtests`. Reports preserve artifact
version and IDs, outcome, turns, starting/final health, damage values, notes and the saved recent
battle log (up to 40 entries). Preview rules are included to explain what was measured; these
reports do not certify generated code or a full game engine. Export does not change saved data.

Saved work offers **Export draft** under `exports\work`. Design, writing and code artifacts
export as readable `.txt` copies with goal, kind, version, IDs and dates above the exact draft
content. Exports retain the reviewed-draft status and do not run code or change progress.
Use the work library's history toggle to select an earlier version for export.

Saved activity sessions offer **Export transcript** under `exports\activities`. Word chains,
shared stories and creative challenges export their prompt, status, timestamps, saved turns and
result when present. Exports work with the model off, are disabled during that session's generation,
and exclude unsaved input and unfinished replies. Files are uniquely named UTF-8 text copies.

Diary offers **Export entry** and **Export all active entries**. UTF-8 copies save under
`C:\AI\ManaAI-CV-2\exports\diary` with unique filenames, preserving dates, moods and entry
text in chronological order. Recently deleted entries and recorded chat evidence are excluded.
Export works with the model off and does not alter the diary. Full backups retain recovery data.

**Export text** saves a readable UTF-8 copy of current chat or an opened archive to
`C:\AI\ManaAI-CV-2\exports\conversations`, the configured export destination for this installation.
Files use unique timestamps and never overwrite an existing file. Speaker names and available
message dates are included; hidden thinking, emotion tags and diagnostics are excluded. Failed
or incomplete replies retain their status. Export leaves saved conversations unchanged and
works with the model off. The exports folder is excluded from Git; future export types can use
separate category folders as they are added.

**Archive & clear** saves the current conversation before starting fresh. **Archives** opens a
read-only searchable library, with matching messages outlined in the selected conversation.
Up to 50 conversations are kept; full storage blocks clearing until you explicitly delete an archive.
Deletion requires confirmation. Archives are included in backup, restore and saved-data counts;
older backups restore an empty library. Archived text does not enter current model context,
memory suggestions or new diary sources. Chat already cleared before this feature cannot be recovered.

**Search chat** searches visible user and Mana messages using case-insensitive literal text.
Use Previous/Next (or Enter for next) to jump between matching messages; the selected bubble
is outlined. Latest returns to the current conversation. Search leaves the full transcript visible,
works with the model off, and excludes hidden emotion/thinking tags and reply diagnostics.

Wardrobe now supports up to 30 named **Saved looks**. Save the current skin, outfit, hairstyle and
accessories, then apply or confirm deletion of a look. Names must be unique (ignoring case).
Applying keeps the current body view; missing or locked items fall back to available defaults
with a notice, while the original saved choices remain available for later. Looks persist with
avatar settings and are included in backup and restore; older backups still work.
Saved wardrobe looks also have a count in the saved data overview and the current-versus-backup preview.

### Future fixes

Skill practice manual checks passed for model-off saving, survival after restart
and duplicate blocking on the same source/area. Count/milestone labels now use
singular “record” for one and plural “records” otherwise. Deletion/recalculation and
live count recall still have separate manual checks.

**More → Skills** tracks coding, writing and creative practice you confirm from a
saved work draft or activity with a user contribution. Each source counts once per
area; optional notes, source snapshots, search and deletion are supported. Stages
and milestones derive from counts (1/5/10/25/50/100/200), not assessed proficiency.
Deletion recalculates them. The 200-record limit blocks new entries without pruning.
Model-off use and backup/restore are supported; older backups start empty. Ordinary
skill/practice questions receive count-only context, explicitly not mastery evidence.
This does not change wardrobe coding levels, bond, mood or identity.

Saved interpretations now offer **Edit as revision** to open their wording directly
without generation, including with the model off. Save creates a new unapproved
version with the same source evidence and a link to the original. Unchanged/blank
revisions cannot be saved; discard/close leaves saved versions intact. We remain in
V1.x development; the completed V1 foundation is not completion of skills, voice,
multimodality, runnable work or the V2 room.

- Approved lesson replies: the latest manual test with Lesson v4 enabled and v3
  disabled used comparison language and acknowledged that the preview is not the
  whole game. It still said outcome/turn counts let us see whether moves are balanced.
  Defer further tuning: those measurements help investigate balance, but do not
  establish it alone. Approval/retrieval behavior looks correct in this example;
  response grounding remains a partial pass, not universally verified adherence.

Inspection confirmed enabled Lesson v3 was selected, but two older damage-focused
answers, 4,566 characters of work context and a final Detailed-style reminder were
competing with it. Relevant approved lesson questions now use the latest request
and selected narrative evidence, omitting older conversation, generic work excerpts
and duplicate episodic context for that request only. A lesson-task reminder follows
the general style rules. Saved chat and drafts remain intact; ordinary requests keep
their existing history/context. Live wording still needs verification.

Approved-lesson reply tuning now targets learning/revision questions: use the
practical takeaway, proposed comparison/check and source limits. Draft damage/skill
values are configured data, not proof of execution or balance. A preview win alone
does not establish that damage is sufficient or a skill is effective. Comparisons
should explain changes rather than require an unchanged result. This guidance is
supplied only when a relevant enabled lesson is selected; live adherence needs review.

Context overflow recovery: ordinary chat now supplies its saved context once rather
than duplicating it in system and latest-message prompts. A server-reported context
overflow triggers at most two retries with progressively less older conversation.
Current system instructions and the latest request/evidence stay intact; saved chat
is never cleared or shortened. If those alone exceed capacity, a readable error asks
for a shorter request/context instead of repeatedly sending the same oversized payload.

Saved themes, lessons and belief interpretations now have **Use this interpretation
in relevant replies**, disabled by default. Ordinary chat recalls up to two enabled,
keyword-relevant interpretations with recorded evidence. An enabled newer revision
supersedes linked ancestors; an unswitched revision does not. Disable any version to
exclude it from future requests. Saving and revising do not grant approval. Approval
persists through backup/restore; old records default to disabled. Interpretations
remain tentative and cannot override current instructions, identity or state. This
applies to ordinary chat, not initiative, diaries or other generation flows.

Themes & lessons now also offers **Belief interpretation**. Select reviewed moments
to draft a proposed working outlook, its supporting recorded outcome and its limits.
Review/edit before saving; evidence snapshots and revisions use the existing backup
flow. These proposals do not establish personal traits, another person's feelings,
relationship stages or permanent beliefs. Reply use now requires explicit enablement.

Second lesson tuning: use recorded result → proposed comparison/check → untested
scope. A win/turn count does not verify JSON structure, state transitions or balance.
Future revisions may change the outcome; preserving the same win is not a requirement.
New revision drafts use this guidance; saved versions remain intact pending review.

Theme/lesson tuning: a preview win establishes its recorded result, not Mana's
preferences, comfort or strategic ability. Lessons now target practical workflow
takeaways and their limits; themes describe shared topics without inventing lasting
traits or recurring patterns from one event. Revisions treat earlier interpretations
as drafts to correct, not evidence. Existing saved wording stays intact; use Draft
revision to review a replacement version. Live adherence still needs verification.

**More → Themes & lessons** drafts a tentative life theme or lesson from up to four
selected reviewed moments. Edit before saving, inspect the recorded evidence, search
saved interpretations or draft a revision that preserves the original version.
Snapshots survive source deletion. Up to 100 versions are retained with no pruning;
backup/restore includes them and older backups default to an empty list. Stop,
failure, discard and closing the panel save nothing. Interpretations enter relevant
chat only when explicitly enabled; they do not automatically alter beliefs, identity,
mood or relationship stats.

**More → Event history → Our timeline** groups recorded events and reviewed
memories by the original event date in the journal timezone. Search, date ranges,
reviewed-memory/special-moment filters and oldest-first ordering help browse shared
history. A memory and its event appear once together; saved source snapshots remain
visible after history deletion. Current bond/affection is shown as a fictional
snapshot, with no invented historical scores or automatic growth claims. The view
uses existing backed-up records and stores no extra timeline data.

**Event history → Review as memory** lets you save an edited episodic memory or
special moment with up to eight tags. Saved moments appear in Event history, with
search, edit/delete controls and their original source snapshot. One note per event,
up to 200 notes, with no automatic pruning. Relevant ordinary chat recalls up to
three reviewed notes by keyword, keeping the source outcome separate from the
user's interpretation. Clearing history leaves these snapshots intact. Backup and
restore include them; older backups default to an empty list. No automatic identity
or relationship changes occur.

**More → Event history** records newly saved goals/status changes, work drafts,
playtest results, activity sessions/status changes, diaries, simulated thoughts and
chat archives. Each record has a timestamp, source category/ID and brief outcome.
Existing records are not backfilled. Search/filter, individual deletion and clearing
are available; source deletion does not erase the history snapshot. History is
included in backup/restore (older backups restore empty history). The 500-record
limit stops new recording without pruning; remove records to make room. This
foundation does not feed model context or automatically change memories/identity.

The [legacy Python comparison](docs/Legacy-comparison.md) maps the old vision and
roadmap to current features. V1 foundation completion remains scoped to this app;
experience-linked memories, reviewed narrative growth and a meaningful V2 home are
future plans, not implemented capabilities or an automatic legacy-data migration.

- Personality: improve consistency across topics, especially Detailed examples and low-playfulness wording. Brief and Detailed passed the latest manual examples; these do not guarantee every reply follows the settings.

V1 foundation roadmap scope is implemented, including the optional personality and simulated
thought foundations. This is checklist completion, not a claim of exhaustive release verification.
Long-session stability, broader model adherence and regression checks remain ongoing.

- Shared story: develop the user's concrete contribution in the next paragraph instead of lingering on the previous scene (observed with a door leading to another world).
- Creative challenge: keep feedback to one optional idea; the live model can still offer two despite the prompt guidance.

Both activity flows passed manual review; these are deferred response-quality improvements.

- Retried chat replies now offer **Reply diagnostics**, showing each raw attempt and its specific check result (repeated wording, unsupported capability, or passed). Debug records persist with chat, bounded to two attempts and 8,000 characters per text, and never enter model history or memory recall. Clearing chat removes them.
- **Compare with simpler prompt** runs the same user message with the current model, temperature, and a short standalone prompt, without chat history or saved context. Its result appears only in diagnostics and does not change bond, mood, progress, or memories. It shares the model lock and Stop button with normal generation. This comparison is evidence for troubleshooting, not proof that a check was correct; generation randomness and omitted context affect results. No restart is required for a rejected reply.

- Chat now checks recent replies for near-duplicate adjacent wording as well as exact echoes, and narrowly checks unsupported visual observations, physical food/drink offers, and music playback promises. A detected issue receives one corrective retry; a second issue shows an error with no relationship gain. Initiative openings also retry unsupported capability claims once. These are bounded wording heuristics, not semantic fact verification.
- Short greetings, new topics, answers to the same question, and explicit repeat requests avoid the near-duplicate guard. Explicitly requested roleplay and clearly marked imaginary scenes avoid capability rejection. The rules permit suggesting tea or music while preventing claims that Mana can physically provide them. Draft wording may appear during chat streaming before a corrective retry replaces it; no restart is required for the error.

- Chat and initiative receive current capability rules: interests and imagined projects are not evidence of coding, games, music playback, robot control, or physical activities. Old assistant stories are not activity evidence. Mood questions should use current state; topic requests get two or three specific choices with a gentle option when tired. These rules still depend on model adherence.
- Both known older default prompts migrate, including line-ending differences. Custom character cards stay intact; application grounding accompanies each chat request. User-confirmed activity records are preserved.

- The default character prompt now uses voice instructions without example dialogues that can encourage copied greetings. An exact saved copy of the previous default is migrated; customized prompts are preserved.
- Model context drops stale duplicate assistant messages of at least 40 characters, retaining their latest occurrence; visible saved chat stays intact. Ordinary chat now retries a recent exact echo once, as initiative replies already did. Repeated answers to the same question and explicit requests to repeat/quote are exempt from the ordinary-chat check. A second echo shows an error instead of granting relationship progress. This reduces repetition but does not guarantee varied model wording.

- If you already have a `llama-server` running on port 8080 (for example from a manual test), Mana will use it and show "Ready". Close it first if you want Mana to launch its own with your chosen model.
- Mana continues checking the server after it becomes ready. An unavailable server disables sending until it recovers; a stopped managed process shows its log. Health requests time out after five seconds.
- Port changes apply after stopping and starting the model. Chat and health checks keep using the active port in the meantime. Stopping the model also cancels the current response.
- If the model fails to start, the red box shows the end of llama-server's log. The full log is at `%TEMP%\mana-llama.log`.
- Reasoning models (DeepSeek R1 and similar) may print long thinking text. Mana hides `<think>` blocks, but they are slow, so use a normal chat model.
- `npm run dev` alone opens the UI in a browser tab and talks to an already-running llama-server (no Start button magic). Use `npm run tauri dev` for the real app.

## Layout

```
src/            React UI
src/core/       settings, prompt building, LLM streaming, emotion tags
src/components/ chat, settings drawer, avatar stage (placeholder)
src-tauri/      Rust shell: starts and stops llama-server
```

## Checks

Saved settings, chat, avatar selections, and progress are validated when loaded. Invalid fields use defaults;
valid chat turns are retained with unique message IDs. Custom names, prompts, paths, and valid progress remain intact.
Wardrobe metadata is validated per item. Invalid unlock rules keep the affected item locked and show an error
in Wardrobe. If `items.json` is unreadable or has an invalid root, non-default items stay locked until it is fixed;
default items remain available and the avatar images still load.

Run `npm test` for focused avatar and model lifecycle regression checks, and `npm run build` for TypeScript
checking and the frontend production build. The lifecycle checks mock desktop commands; they do not launch a real model.

Run `cargo test --manifest-path src-tauri/Cargo.toml --lib` for Rust avatar file boundary checks. Avatar reads
accept relative image paths and root `items.json` only. Scanning and reading resolve filesystem links and reject
files outside the selected avatar folder; links whose targets remain inside it are supported.
