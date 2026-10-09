# Mana development log

Started 2026-10-09. Backfilled from current project documentation, available session
evidence and Git. This records decisions and verification, not every tool call or
a complete historical audit. Older details without reliable dates are grouped rather
than assigned invented timestamps. No legacy data was migrated by writing this log.

## 2026-10-10 — Future icon-button enhancement

User requested a future switch from word-heavy buttons to icons, with tooltips. Added a deferred
V1.x interface-polish checklist to the roadmap: consistent recognizable icons, hover/focus tooltips,
accessible action names and clear state indicators. Text can remain where an icon would be ambiguous.
Documentation only; no buttons converted in this update.

## 2026-10-10 — Hands-free manual acceptance complete

User confirmed repaired test 4 passed, completing the earlier tests 1–3. Screenshot shows
“No speech detected” and the hands-free session stopped with background fan noise; earlier sound-caption
chat entries remain historical messages. This accepts all four manual foundation checks, not all possible
noise environments. The repeated stop notice visible in the screenshot remains a minor UI polish item.
No code changed in this acceptance update.

## 2026-10-10 — Hands-free background noise repair

User confirmed loop tests 1, 2 and 3 passed (automatic send, reply/resume, Stop). Test 4 could
not pass with fan/background audio: Whisper produced [Music] and [XBOX SOUND], sent into chat.
User currently has no headphones. Added 700 ms initial background calibration, requiring signal
above 2.5 times the measured floor (minimum RMS threshold unchanged). UI asks the user to wait
briefly during calibration. Caption-only bracketed/parenthesized noise and musical symbols are
blocked before automatic send, stopping the loop with feedback. Ordinary speech mentioning music
remains allowed. This is heuristic noise handling; real voice-like background or hallucinated plain
words can still fool it. Build passes; 148 frontend tests pass, 2 optional live tests skipped.
Retest background-only stop and spoken greeting above the fan is pending. Earlier noisy messages
are left untouched as chat history. No native or model change.

## 2026-10-10 — Hands-free voice loop

User authorized explicit hands-free mode. Start requires ready chat, available audible voice and no current
draft/image/review/busy microphone. Whisper input uses amplitude-based SpeechEndpoint: 300 ms sustained
signal, 1.2 s quiet endpoint, 8 s no-voice timeout, existing 15 s maximum capture. This is heuristic pause
detection, not a learned VAD. Transcripts automatically call the normal chat send path; the current assistant
ID baseline prevents replaying history. Chat waits for a new completed assistant reply, starts speech,
then resumes capture after playback with a 700 ms cooldown. Standard automatic speech is suppressed for
the session to avoid double playback; saved automatic preference is unchanged. Stop cancels capture/CLI,
playback and a pending session reply. Hidden app/model loss/errors stop the loop. Session is never persisted.
Voice input review remains the default outside hands-free; failures to send preserve transcript for review.

Production build and frontend tests pass (147 passed, 2 optional live tests skipped). Endpoint tests cover
pause, sustained voice, short noise, silence and continuous speech; existing cancellation tests remain.
No native code change. Full live loop/playback feedback/Stop acceptance is pending; no real microphone
or synthesized endless conversation was initiated by the agent.

## 2026-10-10 — Voice input layout polish

User authorized de-crowding the growing voice/image controls. Added compact voice-input toolbar with
collapsed-by-default recognizer/language/path setup, full-width transcription review and bounded scrolling
for expanded settings/review. Record/Transcribe/Cancel stay accessible while setup is collapsed; errors
remain visible. Avatar comparison toggle appears only while an image is attached. Whisper capture
provides a 100 ms display timer and RMS-derived input meter using audio already captured for transcription;
no additional recording or persistence. Meter clears outside recording, capped timer shows 15 seconds;
this is signal level, not voice detection or transcription confidence. Windows recognition has no input meter.

Production build passes; 146 frontend tests passed, 2 optional live tests skipped. Existing cancellation test
updated for the additional meter effect; meaningful signal tests cover silence, invalid samples and clipping.
No native behavior changed. User subsequently confirmed all four voice-input polish checks passed. Screenshot shows the compact collapsed toolbar and restored chat space; timer/meter and review checks are accepted based on the user report.

## 2026-10-10 — Whisper live recognition confirmed

User reports accurate real-microphone transcription. Screenshots show “Hello Mana, how are you today?”
and “My name is Aishi” correctly in review, with the first greeting subsequently visible in chat.
This confirms microphone permissions/capture, local recognition for those phrases and review-to-chat use.
Record this as successful live phrase recognition, not a measured general accuracy rate. Cancellation,
silence handling and the automatic 15-second limit remain covered by implementation/automated checks
rather than a reported complete manual test set. No code changed for this acceptance update.

## 2026-10-10 — Local Whisper transcription

Windows name tuning still misheard live Hello Mana as All were with uncertain alternatives. User authorized a stronger local transcription model. Installed whisper.cpp CPU x64 release b5454 (CLI version 1.9.5) and ggml-small.en.bin (487,614,201 bytes) under ignored data/whisper; model SHA256 verified against publisher metadata: c6138d6d58ecc8322097e0f987c32f1be8bb0a18532a3f88f734d1bbf9c41e5d.

Added explicit WebView microphone capture with permission handling, 15-second cap, 16 kHz mono WAV encoding and silence check. Native Whisper owns one hidden CPU CLI process, a 180-second inference timeout and temporary input/output deletion through session Drop. Normal app exit cleans up; hard crashes can leave temp files. Cancel while permission/launch is pending invalidates late results and closes streams. Review uses the existing edit/add/discard flow; Windows remains a selectable fallback. Whisper paths persist as mana.whisper.v1 and old backups gain default paths; audio/runtime/model are excluded from backup. Installed English model is not automatic language detection or voice training.

Synthetic 3.4-second TTS WAV produced Hello Mana How are you today? in about five seconds on CPU, both console and production-style output-txt paths checked; smoke files deleted. No live microphone was opened during agent checks. Build passes with existing nonfatal chunk-size advisory; frontend 145 pass, 2 optional live tests skipped; Rust 53 pass. Tests cover WAV format/resampling/clipping/silence, old backup compatibility, cancellation during pending microphone permission and session temp cleanup. Real microphone accuracy, permissions and record/transcribe/cancel UI acceptance pending.

## 2026-10-10 — Dictation names and review improvements

User tested live capture successfully but reported Mana becoming Mantle and Hello becoming Pedal.
This confirms capture-to-draft, not recognition accuracy or the cause of errors. User authorized tuning.
Added a companion-name/greeting grammar alongside unrestricted dictation, using configured character/user
names sent as bounded JSON data. No global replacements or automatic corrections. Native result includes
confidence and up to four alternatives. Frontend keeps recognition in an editable review box; Add to draft
is explicit and Send is blocked until review is accepted/discarded. Scores are not accuracy percentages.
This grammar primarily assists isolated names and greetings; arbitrary speech may still struggle.
Synthetic in-memory “Hello Mana” tested through the production helper with its microphone input replaced
by a WAV stream yielded exact “Hello Mana”, confidence 0.985, no competing alternative. No microphone
opened or audio file saved by the check. Build passes, 142 frontend tests passed (2 live tests skipped),
49 Rust tests passed. Live retest needed for names, ordinary sentences, alternatives and discard.

## 2026-10-10 — Microphone draft input (manual acceptance deferred)

User authorized implementation but cannot test the microphone currently. Added local Windows System.Speech dictation using a hidden owned PowerShell helper; installed recognizers enumerate without listening. Explicit Microphone starts one-phrase recognition from the default device; Cancel discards pending results and kills the helper. Recognition appends to the current draft, preserving edits made while listening; Send remains manual. Native polling enforces a 30-second wall limit and process cleanup on exit, frontend cleanup on unmount. Speech playback is gated while listening. No audio storage or new backup keys; language is session-only.

Read-only inventory found MS-1033-80-DESK (en-US). Synthetic speech generated into an in-memory WAV and transcribed through installed dictation yielded “Hello world” (first phrase); no microphone or speaker used and no audio file created. Frontend tests cover validation, preserving typed text and cancellation during pending launch; native tests cover input validation and idle stop. Real microphone permissions, accuracy and device cancellation remain unverified. Do not mark manual tests passed. Build succeeds with a nonfatal Vite chunk-size advisory; 141 frontend tests pass, 2 optional live tests skipped; 48 Rust tests pass.

## 2026-10-10 — Avatar comparison manual acceptance

User confirmed repaired tests 1, 2 and 4 passed, alongside the prior comparison-off test 3.
Screenshots show tentative resemblance for Mana artwork, the glasses difference, hair/clothing
comparison for the cardigan character, and headset/clothing differences for the dark-uniform character.
All four manual checks are accepted for the avatar-reference foundation. This does not establish
perfect visual accuracy or verified identity. Remaining tuning examples: the X hair clip is called
a forehead mark, and a plain white background is called a room. These are recorded limitations,
not reasons to undo the accepted reference feature. No code changed for this acceptance update.

## 2026-10-10 — Avatar comparison acceptance failures and prompt repair

User reports only test 3 (comparison off) passed. Test 1 falsely called the attached character Aishi;
test 2 discussed the book without appearance differences; test 4 omitted glasses and invented prior reading.
The screenshots do not establish whether the underlying vision report compared the reference accurately.
Code review confirms the reference argument reaches vision; there was no required comparison format or
comparison-specific final chat instruction. Vision now requests five nonempty sections: Attachment,
Avatar reference, Similarities, Differences, Resemblance, explicitly checking glasses and headset ornaments.
Incomplete reports fail visibly and preserve the attachment instead of silently accepting description-only output.
A marked comparison report adds final chat guidance after brief style: include resemblance plus concrete
comparison evidence, never infer Aishi identity or invent previous activities. These are model instructions,
not a guarantee of visual accuracy or compliance. Build passes; frontend 139 passed, 2 optional live tests
skipped. Retest 1, 2 and 4 remains pending; no live two-image inference was run in this repair.

## 2026-10-10 — Current avatar reference

User requested avatar reference next. Added avatarReference.ts to composite current wardrobe layers with neutral eyes/mouth on white at 640 pixels maximum. Chat checkbox defaults on for the session; missing avatar disables it. Attachment remains first in the two-image vision request, reference second. Comparison asks for similarities/differences and separates headset decorations from anatomy; it cannot prove identity or authorship. Current avatar is regenerated on inspection, not stored as a library entry or affected by stage zoom/blinks/speech. Comparison reports are retained with ordinary image descriptions. Production build and frontend tests pass; manual two-image model acceptance remains pending.

## 2026-10-10 — Saved image attachments

User accepted local image persistence as the next V1.x item after confirming inline test 2 passed.
Prepared JPEGs now live in SQLite app_state under mana.images.v1, included in validated JSON backups.
Image reports reference deduplicated pixels by ID; chat and archives show thumbnails. Use image again
attaches the stored copy for fresh vision inspection. More → Saved images provides search and explicit
deletion, preserving descriptions and earlier backup copies. Images are saved after successful vision
inspection and flushed before handing the report to chat. Aborted inspection retains the composer attachment.
A stop during the persistence flush can leave an unlinked library image, which can be deleted explicitly.
Limits are 100 images and 8 MB encoded JPEG data; originals are resized to 1280 pixels maximum.
No automatic pruning, identity recognition or direct pixel input to the chat model is introduced.
Older backups default to an empty image library; older reports and review-panel text remain description-only.

Validation: production build passes; frontend 136 passed with 2 optional live tests skipped; Rust 46 passed,
including SQLite reopen and pixel deletion preserving chat links. User confirmed manual desktop tests 1–4 passed: restart retains the thumbnail; Use image again
performs fresh inspection; backup/restore retains pixels; deleting pixels preserves descriptions.
Screenshots show the library dropping from one image to zero and restore preview finding one
image in the backup. Identity recognition remains unverified: Mana describes the library scene
but remains uncertain after the user identifies the character as Mana. Headset ears are still
sometimes described as anatomical cat ears; this acceptance covers persistence, not visual accuracy.

## 2026-10-10 — Current image scene grounding

User passed inline attachment tests 1, 3 and 4. Image-only test 2 failed: the stored
vision report correctly described a brown-haired character in a wedding dress by a
stone church with petals, but the chat reply described the prior controller/game image.
The earlier gaming-image reply also falsely identified the character as Aishi and
invented “our game.” Self-recognition is still unverified; filename influence is possible,
not established as the sole cause.

Fresh attached-image requests now send only the latest user image turn, omitting earlier
image/chat guesses. App context keeps identity/current mood/clock but omits unrelated
work, goals, memory and narrative evidence. Filenames remain in stored UI metadata but
are excluded from model image context. A final grounding instruction prioritizes current
description and forbids unconfirmed person/self identity or shared-game claims. Both
initial and corrective requests use this focus. Normal text follow-ups retain history;
cross-image comparisons are not a verified feature of this focused path.

Validation: production build and 134 frontend tests passed (two live-model tests skipped).
Regression uses the gaming→wedding sequence and checks the old scene/filename are absent
without changing stored history. Native code unchanged. User reported manual re-test #2
passed: image-only wedding submission now describes brown hair, purple bow, white lace
dress, pink blossoms and arched windows. A subsequent image-only submission describes
a character beside a robot in a futuristic workshop rather than carrying over the wedding
scene. All four inline-attachment checks are now user-passed. Fine detail interpretation
(such as decorative versus anatomical cat ears) remains a tuning limitation.
Pixel retention is future work, not added here;
current restart retention remains question/description only.

## 2026-10-09 — Establish the historical record

### Local image understanding foundation

Inline attachment follow-up: user authorized moving image entry into chat after the panel
flow passed. Added Attach image/preview/remove alongside the composer. Sending invokes
saved vision configuration, verifies capability, starts a separate server when needed,
then passes bounded report metadata into the existing chat request. Original question
remains visible; description is collapsible and retained in chat/archive/backup/export.
History payload includes report text as uncertain source evidence, never image pixels.
Cancellation/failure keeps the attachment and draft; no chat turn is added before successful
inspection. Image-only submissions get a default question. The pipeline has a four-minute
timeout, uses normal generation lock, and stops only its own vision process in finally.
Existing external servers remain untouched. Normal chat still drives voice/lipsync.

User noted the earlier report confused headset cat-ear decoration with anatomical ears;
added a grounding reminder without claiming this fully fixes model inference. No confirmed
self-recognition/reference matching yet. Frontend tests cover history/archive/backup/export
roundtrip and rejecting pixel fields, existing-server adoption, wrong-port rejection and
owned cleanup on cancellation. Production build and 133 frontend tests passed (two live
checks skipped); native commands unchanged from the 45-test validated vision foundation.
Manual pending: attach/question/Send with automatic vision startup; image-only Send;
Stop during startup/inference and retry; restart with retained description and no pixels.

User chose to preserve Qwen3 chat and use a separate vision model. Read-only inspection
found the chat server reports vision false, RTX 5070 Laptop 8 GB with about 3 GB free,
and an installed Qwen3-VL-8B Q4_K_M plus matching F16 projector. Implemented More → Images
with independent hidden llama-server ownership, port 8081, CPU/default projector offload
disabled, local PNG/JPEG decoding/downsize, transient preview, capability check and image
inference. Discussion explicitly shares uncertain description text with normal chat; it
does not imply direct vision in the chat model or picture-based identity/authorship.
Owned server stops on close/exit; existing external servers are disconnected only. Opening
the panel pauses initiative and automatic journal generation. Settings persist in the
new generic app_state key mana.vision.v1 and backups; old backups default empty setup.

Live smoke: scripts/vision-smoke.py launched a separate owned CPU server on port 18081
with the installed pair, verified vision capability, then sent a generated red/blue test
image. Reply: “Two vertical rectangles side by side: left is red, right is blue.” Passed;
smoke server was terminated/reaped and chat server remained unchanged. No downloads or
changes to user's app settings/chat. Runtime log is ignored by Git.

Validation: production build, 130 frontend tests (two live-model checks skipped) and
45 Rust tests passed. Tests cover inline
image payload/capability gating, configuration/old backups, bounds and local resizing.
User reported manual checks 1–4 passed: detected pair startup, real PNG inspection,
review/Discuss with Mana, and restart with retained setup and cleared image. Shared
description and conversation correctly remained in saved chat. Screenshots show a
detailed character/outfit description of Mana Full.png and the subsequent spoken chat
reply. That reply calls the character “me”; this is an identity inference from textual
context (including the filename), not verified visual self-recognition. Reference-based
recognition/provenance remains open. User expressed interest in future inline chat
attachments. Cancel/close during loading or inference remains a separate manual check;
CPU inference may be slow and detailed OCR remains unverified.
Sources: official llama.cpp server and multimodal documentation (GET /props, image_url,
--mmproj and --no-mmproj-offload).

### Manual read-aloud foundation

Speed/volume follow-up: added integer-bounded rate (-10..10) and volume (0..100) to
`mana.speech.v1`, passed as JSON into System.Speech before playback. Defaults preserve
existing behavior (rate 0, volume 100). Old backups missing these two fields are upgraded
with defaults without changing voice/automatic settings; explicitly invalid values still
reject restore. Both manual and automatic playback use the preferences captured at start;
edits apply to the next playback. Volume 0 mutes speech without changing system volume.
Native viseme timing naturally follows speech rate. Voice controls now use a responsive
grid and checkbox-specific styling to avoid the generic chat search input's large width.

Validation: 127 frontend tests passed (two live checks skipped), 44 Rust tests passed,
production build passed. Added preference roundtrip/old-backup/range checks and native
control rejection; WAV+viseme smoke test uses rate +2 and volume 40. User reported
manual checks 1–4 passed: normal/slower/faster playback, volume 100/30/0, lipsync/Stop,
and restart retention with automatic playback using saved controls. User also tried
speed +10. Screenshot shows Zira Desktop, automatic playback enabled, normal speed
and volume 100%. Backup restore with these controls remains a separate manual check.
Sources: Microsoft SpeechSynthesizer Rate and Volume properties.

Lipsync follow-up: the hidden speech helper attaches a C# VisemeReached handler and
writes bounded numeric timing events on stdout. A Rust reader forwards events with a
playback ID to the frontend. Current playback alone controls five existing vowel images;
silence and completion reset the mouth, and Stop invalidates the ID immediately. Older
events and stale status checks cannot move/reset a newer playback. With a usable Windows
voice, ordinary chat streaming no longer drives the text-timed mouth; Test/browser fallback
keep the original preview behavior. Existing artwork limits articulation, and native helper
startup/device buffering can affect perceived timing. No audio upload or new saved data.

Validation: native WAV synthesis test also verifies nonzero viseme events; all 43 Rust
tests and 127 frontend tests pass (two live-model tests skipped). Production build passed.
User reported manual lipsync checks 1–4 passed: Speak on an existing reply animates
the mouth, automatic playback animates a new reply, Stop voice restores the resting
mouth, and Speak works with the model off. Restart without replaying mouth motion
remains a separate manual check. Source: Microsoft System.Speech VisemeReached docs.

Follow-up: added validated `mana.speech.v1` preferences to SQLite and backups; older
backups default automatic playback off. Voice selection is preserved even if unavailable,
with an explicit notice rather than substitution. Opt-in automatic playback observes new
assistant IDs, waits for generation to complete, cleans reply text and consumes each once.
Loaded history, failed/interrupted replies and occupied/unavailable playback are skipped;
no delayed queue. Turning the option off stops playback. Frontend checks cover preference
roundtrip, old backup defaults, streaming completion, replay prevention and skipped replies.
126 frontend tests passed (two live-model checks skipped), production build and 43
Rust tests passed. User reported manual follow-up steps 1–4 passed: selected Zira and
enabled automatic playback, heard a new completed reply, stopped voice playback, and
restarted with both settings retained and no old-chat replay. Screenshot shows Microsoft
Zira Desktop selected and automatic read-aloud checked. Backup restore and unavailable
saved-voice handling remain separate manual checks.

Implemented Windows System.Speech through a hidden, owned PowerShell process. Text
and voice are JSON on UTF-8 stdin, never interpolated into executable script. Speak
uses cleaned completed assistant text; errors/debug attempts are excluded. Voice
enumeration is independent of llama-server. Stop kills/reaps the helper; app exit does
the same. Browser preview reports desktop-only availability. Kept selection session-only
for the original slice; the follow-up above adds saved preferences and automatic playback.

Installed voices enumerated (David/Zira Desktop and David/Mark/Zira); local WAV synthesis
smoke check passed. Frontend: 124 passed, two live tests skipped. Production build passed.
All 42 Rust tests passed, including Unicode JSON-to-WAV synthesis and owned helper
cancellation. User reported manual steps 1–3 passed: voice selection, audible Speak
and Stop voice. Screenshot shows Microsoft Zira Desktop selected; the desktop app
lists David Desktop and Zira Desktop (voice availability can differ by process).
Model-off playback, every available voice and app-exit cleanup remain separate manual
checks. At that stage avatar lipsync was still text-timed; the follow-up above connects
native speech timing to the mouth.

### Skill practice foundation

Manual follow-up passed model-off save (one coding record/stage 1), restart retention
and duplicate rejection on the same v21 work source under coding. Corrected “1 records”
to singular in counts/milestones. Deletion/recalculation and live count recall remain
separate manual checks; no new behavioral tests are needed for this text-only fix.

User selected skills as the next V1.x item. Implemented explicit practice confirmation
from saved work or activities with user contributions, categorized coding/writing/
creativity. Kept practice-count stages separate from the legacy wardrobe coding
stat: draft generation is not executed work or demonstrated competence. One source
can count once per area, with a snapshot surviving source deletion. Milestones are
derived from counts and reversible on deletion. Added native storage key, backward
compatible backup default/count preview and count-only ordinary-chat context.
No automatic grants, model generation or personality/relationship changes. Manual
checks still needed: model-off save, duplicate rejection, reopen persistence and deletion.

Validation: 124 frontend tests passed, two live-model tests skipped, 40 Rust tests
passed, and production build passed. Tests cover deduplication, reversible count
milestones, source snapshots and old-backup defaults without coding-stat changes.

### Direct interpretation revisions and scope correction

The user requested direct editing and challenged the premature suggestion of moving
to V2. Added Edit as revision, independent of model availability, with the same
review editor and preserved source snapshots. A new version links to its parent and
does not inherit reply approval. Saving rejects empty/unchanged drafts, missing parents
and full capacity. Original versions remain untouched; opening a draft does not persist
anything. Editor focus/scroll brings the draft into view. Save/delete/approval use a
storage/editability guard separate from model readiness. Both generated and manual
revision saves require changed wording. Current work remains V1.x; voice, skills,
multimodality and runnable work are still unfinished. Automated checks below verify
revision invariants; model-off editor behavior still needs manual review.

Validation: 123 frontend tests passed, two live-model tests skipped, production build
passed. Rust tests were not rerun because this change has no native storage changes.

Documentation follow-up: updated the current repository to
[Aishi-mana/ManaAI-CV-2](https://github.com/Aishi-mana/ManaAI-CV-2.git). Extracted
the existing roadmap/checklist into ROADMAP.md without resetting progress. Created
PROJECT_STRUCTURE.md from inspected source layout, moving the avatar-layout section
there. ManaAI.md retains vision/design/implementation detail and links to both guides.
README and changelog navigation now use the new locations. This was documentation
work; Git remotes were not changed. Verified local link targets and section extraction;
application tests were not rerun for document-only changes.

Created CHANGELOG.md for user-facing changes and this file for engineering decisions,
manual findings, validation and deferred work. Git currently contains four early
2026-10-08 commits; substantial later development remains uncommitted. A working-tree
feature entry does not mean a release was shipped or a commit was created.

## 2026-10-09 — Legacy Python cross-check

Read the legacy manifest, Living Mana vision and roadmap in `C:/AI/ManaAI/docs`.
Recorded the mapping in [Legacy-comparison.md](Legacy-comparison.md). Legacy
completion labels were not verified by auditing Python runtime/code.

The current app covers much of the companion foundation and has explicit reviewed
preservation flows. The legacy vision adds a richer experience → memory → reflection
→ meaning → identity → behavior thread, plus a persistent home and social world.
Legacy v3.3/v3.7 labels are independent of this project's V1/V2/V3 scopes. Kept V1
foundation completion scoped to the current roadmap; added continuity work to V1.x.
Legacy files/data remained untouched.

## 2026-10-09 — Event history, episodic memories and timeline

Built recorded events from changes in saved application records. Mounted existing
state is the baseline, so opening the app does not invent past events. Unchanged
saves/deletions do not become achievements. Snapshot outcomes distinguish reviewed
drafts, deterministic previews, user-recorded completion and simulated reflections.

Added reviewed episodic notes/special moments with source snapshots, tags, limits
and relevant ordinary-chat recall. Kept them separate from fact memories to preserve
provenance without retrofitting the relational memory schema. Source/history deletion
does not remove a separately saved snapshot; users can delete notes explicitly.

Timeline merges one event with its reviewed note. Original event time and note-save
time stay distinct. Date grouping uses the configured journal timezone. Current bond
and affection are displayed as fictional current stats; no historical curve is invented.

Manual screenshots showed a saved thought, v21 design draft and v21 preview win
(23 turns), then an episodic note tagged json and a special moment tagged game.
Timeline special-moment filtering and thought search returned the expected rows.
One recall example retrieved the 23-turn win, but also blurred draft Fireball data
with preview capability. Recorded this as grounding risk, not proof of all factual recall.

## 2026-10-09 — Themes, lessons and proposed beliefs

Added model drafts from selected reviewed moments with editable review, explicit
save, evidence snapshots and revision history. Revisions preserve earlier versions;
source deletion does not break the saved evidence. Stop/failure/discard/close does not
save a generated interpretation. Shared model lock prevents conflicting generation.

First live lesson inferred preferences, strategic pacing and JSON comfort from one
preview result. Tuned toward practical lessons and topic-based themes. Second version
still overstated verification of JSON transitions and preserving outcomes. Added
recorded-result → proposed comparison/check → untested-scope guidance.

Belief interpretations propose a modest working outlook with evidence and limits,
not established traits, another person's feelings or relationship stages. A manual
example based on a saved simulated thought remained tentative and acknowledged
that one event did not establish a reflective pattern. This example passed review.

## 2026-10-09 — Explicit narrative reply approval and context debugging

Added per-version approval, disabled by default and not inherited by revisions.
Ordinary chat selects up to two relevant enabled versions. An enabled descendant
supersedes linked ancestors; missing deleted links limit lineage resolution. Approval
survives backup/restore. No automatic identity, mood or relationship-stat update occurs.

Live requests initially exceeded the local 8,192-token capacity (8,817 and 8,902 tokens).
Found current context duplicated in the system and latest user message; removed the
duplicate. Added bounded retries for explicit context-overflow errors by dropping
older request history only. Current evidence stays intact and saved chat is untouched.

Subsequent replies still substituted damage details for the lesson. Read-only SQLite
inspection confirmed Lesson v3 was enabled while older versions and the belief were
not. A reconstruction using saved state confirmed lesson selection and guidance, but
also showed two prior damage-focused answers, 4,566 characters of work context and
a final Detailed-style reminder encouraging values/examples. This was a reconstructed
request, not an exact captured historical wire payload; causation remained an inference.

Implemented a focused route for relevant approved lesson/revision questions: latest
user request instead of older conversation, no generic work excerpts or duplicate
episodic context, and task-specific guidance after general style rules. Ordinary
questions retain normal context. A saved v3 phrase about ensuring consistency still
encouraged an unchanged-result interpretation. The user reviewed and saved v4:

> The recorded battle preview ended in a win after 23 turns. We can compare future
> revisions' outcomes and battle logs to understand what changed; the turn count may
> legitimately differ. This result alone does not establish balance, and full-game
> behavior remains untested.

With v4 enabled and v3 disabled, the live reply mentioned changed outcomes and the
preview's limited scope. It still said outcomes/turn counts could reveal whether moves
were balanced. Approval/retrieval looks correct in this example; response grounding
is a partial pass. User agreed to defer this wording issue rather than continue tuning.

## Verification checkpoints

These are historical test results, not tests rerun when this log was created.

| Checkpoint | Frontend passed | Live-model tests skipped | Rust passed | Production build |
| --- | ---: | ---: | ---: | --- |
| Recorded events | 112 | 2 | 37 | Passed |
| Episodic memories | 113 | 2 | 38 | Passed |
| Timeline | 114 | 2 | Not rerun for this frontend change | Passed |
| Themes/lessons | 115 | 2 | 39 | Passed |
| Lesson prompt tuning | 116 | 2 | Not rerun | Passed |
| Belief interpretations | 117 | 2 | Not rerun | Passed |
| Approved narrative context | 118 | 2 | Not rerun | Passed |
| Context-overflow recovery | 120 | 2 | Not rerun | Passed |
| Lesson application guidance | 121 | 2 | Not rerun | Passed |
| Focused lesson requests | 122 | 2 | Not rerun | Passed |

Tests cover persistence/backup compatibility, source preservation, approval/relevance,
revision handling, timezone grouping and overflow recovery. Passing prompt assembly
tests does not prove live model adherence. Screenshots establish only the behaviors
actually visible; reload/restore/capacity behaviors need their own checks.

## Earlier development — dates not independently established here

Current docs record SQLite migration/recovery, identity/fact memory, decay/reinforcement,
state and fictional relationship stats, reflections/daily journals, opt-in initiative,
waiting/time/pause context, reviewed follow-ups, goals/interests, versioned work and
deterministic battle reports, shared activities, backup/safety recovery, archives,
exports, wardrobe looks, More navigation, personality controls and manual thoughts.

The user reviewed export examples across conversations, diary, all three activity
types, work and playtests, and tested More-menu Escape dismissal. Personality Brief
and Detailed examples eventually passed selected manual checks. These observations
are available in session history; this backfill does not reconstruct all intervening
code edits or certify every feature's complete test matrix.

## Deferred work and next checks

- Narrative grounding: outcomes/turn counts support investigating balance, not proving
  it. Check other topics and enabled belief/theme replies, not only repeated preview prompts.
- Personality: Detailed examples, low-playfulness consistency and mood/profile interaction.
- Activities: shared-story continuation can linger; challenge feedback can offer too many ideas.
- Reliability: long-session stability, exact request observability and proactive token budgeting.
- Product roadmap: skills/voice/multimodality, safer runnable work, meaningful V2 home,
  broader bounded routines and eventual Manaverse. No autonomous identity evolution promised.

## Future entry format

For each meaningful development session, add a verified date and record:

- Request/problem and resulting behavior.
- Decision and why it fits the current scope.
- Relevant files or feature area.
- Automated checks actually run; skipped checks and manual evidence separately.
- Remaining limitations and next action.

Keep CHANGELOG.md concise and user-facing. Update README.md and ManaAI.md when
behavior/scope changes. Preserve old findings when resolved, adding the resolution
instead of silently rewriting a historical failure into a pass.
