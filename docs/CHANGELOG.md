# Mana changelog

## 2026-10-11 — Reviewed excerpts from finished covers

Added 1–30 second WAV excerpt extraction without voice reconversion. Existing listen/approve/title workflow gates chat-pool inclusion; full covers remain unchanged. Compact-pool appearance was user approved. Excerpt manual acceptance is pending.

## 2026-10-11 — Compact chat song pool (unreleased)

- Replaced tall pool cards with searchable library-style rows, linked album thumbnails, expandable aliases and icon actions with tooltips/accessibility labels. Long lists scroll within the pool.
- User confirmed Music Studio acceptance tests 1–4 passed. The new pool appearance still needs a desktop visual check.

## 2026-10-11 — Full-size pastel Music Studio (unreleased)

- More → Songs opens a full-size main view with saved-cover discovery, searchable library, album artwork, mix/vocal/instrument player, seeking and volume. The existing whole-song/excerpt cover workflow and reviewed chat pool remain available.
- Projects retain settings, truthful completion/interruption status and duration. Metadata/artwork use existing backups; audio remains external. Returning to chat preserves form/selection and pauses playback; pending conversion continues.
- Stage 1 is implemented; reviewed excerpt extraction without reconversion and new arrangements/original songs remain pending. See [Music Studio](MUSIC_STUDIO.md).
- Production build passed; 166 frontend and 57 Rust tests passed (two optional live checks skipped). Browser layout checks covered standard and minimum-window layouts; desktop manual acceptance remains pending.

## 2026-10-11 — Whole-song covers (unreleased)

- Songs offers Whole song, converting uploaded audio from beginning to end without the 60-second excerpt limit. Excerpt controls are disabled in this mode, and Stop/Close still cancel processing.
- Full covers can be auditioned; the chat pool remains limited to approved 1–30 second excerpts. Preview reads support generated WAVs up to 256 MB. Whole-song processing has a two-hour timeout.
- A real 61.25-second guide conversion preserved the complete output duration while ignoring five-second excerpt settings. Production build and 55 Rust checks passed; manual full-cover review remains pending. Trembling quality work remains unresolved.

## 2026-10-11 — Songs menu and named short songs (unreleased)

- More → Songs now manages a persistent approved short-song pool with titles, aliases, enabled switches, audition and removal. Uploaded guides can be converted with adjustable original-backing volume; only listened-to, explicitly approved 1–30 second clips enter the pool.
- Typed named-song requests play matching enabled clips; unavailable songs get suggestions from the real pool. Generic requests and musical initiative select enabled songs. Existing backups migrate the starter cover metadata without embedding audio.
- See [Songs](SONGS.md) for workflow, limits and manual checks.
- Validation: production build, 164 frontend tests and 55 Rust tests passed; two optional live tests skipped. Manual menu checks remain pending.

## 2026-10-11 — Voice startup and musical replay (unreleased)

- GPT-SoVITS loads on app opening when custom voice is selected, and when switching to it. Existing services are reused; setup's manual Start shares the same startup operation.
- Humming/song chat notes show Replay and play their clip instead of speaking the descriptive note. Both vocal-only hums passed listening review; the wordless song remains provisional.
- Production build passed; 162 frontend tests passed and two optional live checks were skipped.

User-facing changes to the current Rust/Tauri and React/TypeScript Mana.
Started 2026-10-09, retrospectively from project docs, available chat evidence and
Git history. This is a substantial development record, not a complete transcript.
Dates below identify known development sessions, not packaged release dates.
Unreleased changes must not be mistaken for committed or shipped releases.

## Unreleased — current development

### Voice delivery selection acceptance — 2026-10-10

- User passed revised cheerful and gentle, completing approval of all four delivery selections. Runtime presets and exact transcript checks remain pending; active settings were not changed.

### Longer voice reference candidates — 2026-10-10

- Recorded approval of short style auditions and prepared four 7–9 second review references. Default rebuilt from the unclipped original phrase; cheerful/thoughtful use continuous separated excerpts, gentle uses a small phrase assembly.
- Preserved previous baseline and source comparisons; active settings remain unchanged. Longer candidates require listening/transcript checks before adoption.

### Voice reference collection review — 2026-10-10

- Prepared provisional labels, draft Japanese transcripts and four short audition references for the user-supplied collection; original files and runtime settings remain unchanged. Final style/speaker/transcript approval and selective cleanup are pending listening review.
- Recorded corrected feedback: conversion speed is acceptable without the concurrent ComfyUI workload; chat singing should have light guitar or piano accompaniment.

### Custom voice and singing acceptance — 2026-10-10

- User confirmed all four manual checks passed and liked the singing mix. Corrected Japanese reference transcript improved speech; voice consistency and generation speed remain tuning work.
- Recorded the requested chat humming/acoustic snippets and separate original-song/cover studio roadmap. This update documents plans without enabling spontaneous audio or claiming full-song generation.

### Custom speech and supplied-guide singing — 2026-10-10

- Add reference-conditioned GPT-SoVITS speech to Voice selection, preview, read-aloud, Stop, speed/volume and hands-free. CPU server uses existing pretrained weights/reference; no new training.
- Add More → Singing for bounded guide segments, vocal separation, pitch-conditioned conversion and vocal/backing WAV previews/exports.
- Persist custom setup in SQLite/backups, with defaults for older backups; exclude audio/models. Cancel late results and stop owned processes on normal app exit.
- Real speech/native HTTP proxy and five-second guide separation/conversion/remix smoke tests passed. 151 frontend checks, 55 Rust checks and production frontend build passed; two optional live checks skipped. Listening and live UI acceptance remain pending.

### Hands-free background noise handling — 2026-10-10

- User confirmed repaired background-noise test 4 passed, completing all four hands-free manual checks.

- User passed manual tests 1–3; fan noise exposed a failure in test 4.
- Calibrate background level briefly and block caption-only sound output from automatic sending. Background stop needs retesting.

### Hands-free voice mode — 2026-10-10

- Explicit Start/Stop for Whisper listen/pause/transcribe/send/read-aloud/resume. Review mode stays available.
- Stop on no detected speech, errors, model loss or hidden app; release microphone during reply generation/playback.
- Session stays off after restart; no saved automatic-voice preference changes. Live loop acceptance pending.

### Voice input layout polish — 2026-10-10

- User confirmed all four manual polish checks passed.

- Collapse recognition setup behind Voice input while keeping recording actions visible.
- Widen transcription review and show recording time/input level during Whisper capture.
- Show avatar comparison options only when an image is attached; bound expanded panel height to preserve chat space.

### Local Whisper speech recognition — 2026-10-10

- Add local English Whisper small.en on CPU, with Record/Transcribe/Review and a 15-second recording limit. Windows recognition stays available as fallback.
- Save executable/model setup paths; exclude audio and model/runtime files from backups. Delete temporary audio/transcripts after processing/cancel/normal exit.
- Synthetic greeting/sentence passed; user confirmed accurate live “Hello Mana, how are you today?” and “My name is Aishi” transcription.

### Dictation tuning — 2026-10-10

- Assist recognition of configured companion/user names and greetings alongside normal dictation.
- Review/edit recognized text and select Windows alternatives before Add to draft; uncertain recognition is labelled. No forced word substitutions.
- Basic live capture confirmed; tuned accuracy still needs retesting. Synthetic “Hello Mana” recognized correctly.

### Microphone draft input — 2026-10-10

- Explicit one-phrase local Windows dictation with installed language selection, cancellation and timeout. Transcripts append to the draft for review; nothing sends automatically or records audio files.
- Microphone and read-aloud playback avoid simultaneous use. Synthetic audio recognition checked; real microphone manual acceptance deferred by the user.

### Avatar comparison manual acceptance — 2026-10-10

- User confirmed repaired tests 1, 2 and 4 passed; with the earlier comparison-off pass, all four reference checks are accepted. Minor visual wording errors remain tuning items.

### Avatar comparison repair — 2026-10-10

- Require complete comparison sections from vision; incomplete output preserves the attachment for retry.
- Add final reply guidance for concrete similarities/differences, glasses, tentative resemblance and no unsupported user identity or invented past activity.
- Manual comparison-off test passed; comparison tests 1, 2 and 4 need retesting after reported failures.

### Current avatar reference — 2026-10-10

- Chat image inspection optionally compares the attachment against a neutral composite of the current avatar. The session checkbox defaults on and follows wardrobe changes, without stage zoom or animation.
- Vision receives attachment first, reference second, and reports similarities/differences with tentative resemblance. Reference pixels stay transient; saved comparison text remains uncertain. Manual acceptance pending.

### Saved image attachments — 2026-10-10

- User confirmed manual tests 1–4 passed: restart thumbnails, reuse, backup/restore and pixel deletion preserving descriptions.

- New composer attachments retain the inspected JPEG locally, display thumbnails after restart and in archives, and support Use image again for fresh inspection.
- More → Saved images searches and explicitly deletes pixels without deleting descriptions. Shared image references use one stored copy; older backups can retain deleted pixels.
- JSON backups include images; old backups restore an empty library. Text exports include descriptions only. Limits: 100 images, 8 MB encoded data, 1280 pixels on the long edge; no automatic pruning.
- Older description-only records and the separate image review panel do not gain saved pixels retroactively.


### Current image grounding fix — 2026-10-10

- Fresh attached-image replies now focus on the latest image description, excluding
  prior scenes and unrelated saved project context. Image filenames stay in the UI but
  are withheld from model context; explicit grounding discourages unconfirmed identity
  and shared-game claims. Stored history and normal text follow-ups remain available.

### Local image understanding foundation — 2026-10-09

- Attach image in the chat composer now sends a question through the saved separate
  vision setup and then normal Mana chat. Loading/inspection status, Stop and retained
  attachment on failure. Completed chat stores bounded description metadata with the
  original question; collapsible source details, search/archive/backup/export support.
- Pixel previews remain transient. Chat-owned vision server stops after inspection;
  existing external servers remain running. Reminder distinguishes cat-ear headset
  decoration from anatomy and keeps identity/authorship claims unverified.

- More → Images starts/connects a separate vision server while keeping the current chat
  model. Matching model/projector setup, CPU default, user-selected PNG/JPEG preview,
  bounded local resizing, explicit vision capability check, inspect/cancel and reviewed
  description-to-chat. Installed Qwen3-VL pair detection, saved setup and old-backup defaults.
- Image pixels stay transient; only explicitly shared description/question enters chat.
  No automatic memories, camera access or self-recognition. Owned vision server stops
  on panel close/app exit; external server stays untouched.

### Manual read-aloud foundation — 2026-10-09

- Saved speech speed (-10 to +10, normal 0) and volume (0–100%, default 100%) controls
  apply to the next manual/automatic playback. Older backups retain voice and automatic
  preferences while defaulting the new controls. Voice controls use a compact responsive
  layout; native timing continues to drive lipsync at the selected speed.

- Windows speech viseme events now drive the avatar mouth during manual and automatic
  playback. Five existing vowel images approximate articulation; silence/Stop/completion
  restore the resting expression. Playback IDs reject stale events. Text-only preview
  remains available; custom voice and refined articulation remain future work.

- Voice selection and opt-in automatic read-aloud now persist across restarts/backups.
  Old backups restore automatic playback off. New completed replies play once; no
  startup replay, error playback or queue. Missing saved voices require explicit selection.

- Chat Voice selection and Speak/Stop voice controls use installed Windows voices
  locally, including with the model off. Completed cleaned replies only; no automatic
  playback by default. Native helper cancellation and exit cleanup.
- Custom voice training and singing remain future work.

### Confirmed skill practice foundation — 2026-10-09

- Fixed singular/plural record wording in skill counts and next-milestone labels.

- More → Skills records user-confirmed coding, writing and creative practice linked
  to saved work/activities. Source snapshots, notes, deduplication, count milestones,
  search/delete, model-off use and backup compatibility. Counts are not proficiency
  assessments and do not raise wardrobe coding levels.

### Direct interpretation revision editing — 2026-10-09

- Edit as revision opens saved wording without generation, including with the model
  off. Saving preserves the original and evidence, creates a parent-linked new version
  and starts with reply approval disabled. Empty/unchanged revisions are blocked.
- Clarified continued V1.x development; V2 room work is not the next implied milestone.

### Documentation organization — 2026-10-09

- Updated the current repository reference to Aishi-mana/ManaAI-CV-2.
- Extracted the milestone checklist into ROADMAP.md and created PROJECT_STRUCTURE.md
  for source responsibilities, runtime data locations and the existing avatar layout.
  ManaAI.md links to these maintained documents instead of duplicating their content.

### Recorded continuity and narrative foundations — 2026-10-09

- Recorded event history for newly saved goals/status changes, reviewed work,
  playtests, activity sessions/status changes, diaries, thoughts and chat archives.
  Search/filter/delete controls; source IDs, timestamps and brief outcome snapshots.
  Existing data is not backfilled. Capture stops at 500 events without pruning.
- Reviewed episodic memories and special moments from events, with editable notes,
  tags, source snapshots and one note per event (up to 200). Relevant ordinary chat
  can recall up to three notes. Deleting history does not erase their snapshots.
- Our timeline groups events and reviewed moments by original event date using the
  journal timezone. Search, date ranges, special-moment filters and oldest-first
  ordering. Current fictional bond/affection is a snapshot, not invented score history.
- Themes, lessons and belief interpretations from one to four selected reviewed
  moments. Editable drafts, explicit saves, evidence snapshots, version links,
  search and deletion; up to 100 versions without automatic pruning.
- Per-version Use in replies approval, off by default. Ordinary chat can use up to
  two relevant enabled interpretations; enabled descendants supersede linked
  ancestors. Saving a new version does not approve it or rewrite identity.
- Backup/restore includes these records and approvals. Older backups receive empty
  defaults for new sections. Saved data/restore previews show their counts.

### Chat and personality improvements — 2026-10-09 session

- Optional saved voice controls for warmth, playfulness, curiosity, expressiveness
  and reply length, separate from identity facts and mood.
- Brief/Detailed and low-playfulness prompt tuning; explicit user instructions
  retain priority. Selected manual examples passed; consistency remains model-dependent.
- Optional manual simulated thoughts, reviewed before saving, with recorded chat
  sources. These are character reflections, not hidden reasoning or offline activity.
- Removed duplicated current-context inclusion in ordinary chat and corrective
  requests. Explicit context-overflow errors can retry twice with less old history,
  preserving current instructions/evidence and stored chat.
- Focused approved-lesson requests omit old conversation, generic work excerpts
  and duplicate episodic context for that request. Task guidance follows style guidance.
- Narrative grounding prompts distinguish measured outcomes, draft configuration,
  proposed checks and untested scope. Remaining balance overclaims are deferred tuning.

### Preservation and navigation — 2026-10-09 session

- Search current visible chat and navigate matches/latest messages.
- Archive & clear with searchable read-only saved conversations; archived chats stay
  separate from current recall/diary sources. Capacity is 50 archives.
- Categorized UTF-8 text exports under `exports/conversations`, `diary`, `activities`,
  `work` and `playtests`, with unique filenames and no overwriting.
- Conversation and diary exports; all three activity types' transcripts; reviewed
  work draft exports; saved deterministic playtest report exports.
- More menu collects secondary tools and supports Escape/outside/selection dismissal.
- Saved wardrobe looks, safe defaults for unavailable items and backup support.

### Earlier foundations — retrospectively documented, exact per-feature dates unknown

- Local streaming GGUF chat through llama-server; server startup/health/stop handling.
- SQLite persistence and legacy localStorage migration; startup hydration, pending
  save recovery and safe closing. Browser development retains localStorage.
- Editable identity and fact memories; importance, pinning, keyword recall,
  non-destructive decay, reinforcement and reviewed conservative memory suggestions.
- Persistent mood/needs and fictional relationship stats; elapsed-time state handling,
  simulated rest/sleep and avatar integration.
- Reviewed reflections and daily diary scheduling/catch-up, source evidence,
  Recently deleted recovery and replacement safeguards.
- Opt-in initiative, waiting/reply windows, quiet hours, cooldowns, pause/return
  context and user-reviewed follow-up notes.
- Reviewed goals, manually recorded status/progress and interest enthusiasm.
- Versioned design/writing/code text drafts, revision comparisons, JSON validation,
  deterministic battle previews and version-specific saved reports.
- Saved word chain, shared story and creative challenge sessions with pause/resume,
  explicit completion and incomplete-response recovery.
- Validated backup/restore, count previews, safety copies and saved-data checks.
- Layered avatar, expressions, blinking, basic lip sync, wardrobe and unlock foundation.
- Reply grounding/repetition checks and diagnostics; simpler-prompt comparisons.

## Repository baseline — 2026-10-08

Git records these early checkpoints; commit titles do not establish a complete
feature inventory or verification history:

| Commit | Recorded title |
| --- | --- |
| f05e1b9 | Initial commit |
| ef1efe7 | Update .gitignore |
| 185f000 | step3 |
| 6f6b507 | Create ManaAI.md |

## Known limitations and future work

- The scoped V1 foundation checklist is implemented; this is not exhaustive release
  verification, perfect model adherence or parity with every legacy Python feature.
- Approved narrative replies can still overstate what outcomes/turn counts show
  about balance. More measurements and human review are required.
- Shared story can linger on the prior scene; challenge feedback can exceed one idea.
- Context recovery is reactive, not a tokenizer-based budget. Oversized current
  evidence alone can still require a shorter request or less context.
- Voice, skill progression, runnable game/code sandbox, richer autonomous routines,
  persistent room and Manaverse remain future roadmap work.

See [dev log](DEVLOG.md), [current roadmap](ROADMAP.md), [project structure](PROJECT_STRUCTURE.md),
[legacy comparison](Legacy-comparison.md) and [reliability checks](Reliability-checks.md).

## Updating this file

Add concise user-visible changes under Unreleased with a verified date when known.
Keep implementation decisions and test detail in DEVLOG.md. Record limitations
without marking partial manual checks as universal passes. Introduce a release
heading only when an actual version/release is designated.
# 2026-10-10 — Voice presets (unreleased)

Added persistent Default/Cheerful/Thoughtful/Gentle reference selection with per-preset transcript editing and separate Japanese/English reference and reply languages. Singing uses the selected reference. Existing default paths and custom runtime settings are preserved; recognized incorrect main-reference English text is migrated to the user's confirmed Japanese words. Style transcript approval remains pending.
# 2026-10-11 — Musical initiative foundation (unreleased)

Added opt-in occasional musical moments with persistent cooldowns, journal-timezone quiet hours and initiative pause coordination. Three original wordless piano/guitar candidates are prepared locally through Seed-VC. Voice previews and simple typed humming/singing requests share Stop, volume and mouth playback. Drafts, microphone, hands-free, hidden app state and active work block or stop music. Old backups restore with musical initiative disabled. Listening approval remains pending; lyrics and requested-song covers are future work.

## 2026-10-11 — Edit pool titles and aliases

User passed all excerpt checks. Added a pencil-icon editor with Save/Cancel and cross-song name collision checks, preserving clip files and enabled state. Clarified excerpt duration labeling.

## 2026-10-11 — Mix balance and WAV export

Finished projects offer Mix balance & export below the player. Vocal/instrument gains preview existing aligned stems without conversion, with shared peak reduction to avoid clipping. Save new mix creates a separate library entry and retains gains in metadata; existing audio and pool clips are preserved. Export copies the saved selected mix/vocal/instrument version to a new WAV filename chosen in the save dialog; existing destinations are rejected. Audio stays external to JSON backups. Mixing needs both saved stems and uses browser decoding, so large songs can take memory/time. Pool metadata editing passed user acceptance.

Manual checks: (1) preview vocal-only and quieter backing, (2) save a new mix and check original and new version after restart, (3) export mix/vocal/instruments and listen externally, (4) cancel export or choose an existing file and check it stays unchanged.

## 2026-10-11 — Mix and export accepted

User confirmed all four mix/export acceptance tests passed. New arrangements and original song generation remain future work; existing singing distortion/trembling remains deferred.

## 2026-10-11 — Piano arrangement controls

User accepted the piano/guitar audition and preferred piano. Finished covers now offer New accompaniment with Piano and Gentle piano, start and 1–60 second duration. Uses the original saved instrument stem to estimate triads and beats, synthesizes piano and combines the existing cropped Mana vocal; no new voice conversion. Gentle piano uses fewer notes, softer filtering and lower backing level. Output is a separate library project with vocal, instrument and mix WAVs, compatible with mixing/export and explicit short-pool review. Existing owned job progress/Stop/cancellation and interrupted-project recovery apply. Original covers and approved pool audio are preserved. Jazz/rock and full-length arrangements are future work; chord estimation is approximate.

Manual acceptance: (1) restart, select a separated cover and render Piano at start 15/duration 12; (2) render Gentle piano and compare; (3) test Stop and invalid/out-of-song selections; (4) restart and check saved arrangements, export or review a short pool clip.

## 2026-10-12 — Arrangement range validation

User confirmed Piano and Gentle piano sound distinct and work. Fixed out-of-range attempts creating failed library entries: validate start/duration against known project length and both actual WAV stem durations before adding a project or launching Python. Show a role-alert message directly under Make arrangement. Native launch rechecks the range before creating its output folder. Existing failed entries remain removable manually. Stop/persistence/export acceptance is not inferred from this feedback.

## 2026-10-12 — Piano arrangements accepted

User confirmed arrangement acceptance tests 1–4 passed after the range-validation fix: Piano/Gentle piano rendering, invalid-range rejection and Stop, saved projects across restart and export/chat-pool workflow. Jazz and rock auditions remain pending; existing high-note distortion and trembling remain deferred.

## 2026-10-12 — Jazz and Rock controls

User approved revised sax-led Jazz and electric-guitar Rock auditions. Both styles now appear in New accompaniment beside Piano/Gentle piano. Production rendering uses the approved synthetic reed/formant sax and plucked-string amp/cabinet guitar model with bass/percussion, preserving saved vocal timing. Existing 1–60 second preflight, owned Stop/job lifecycle, separate library save, stems, mix/export and explicit pool approval apply. Arrangement helper is bundled with the desktop app. Manual checks pending: render both styles, reject invalid ranges without adding entries, Stop, and verify restart/export/pool review.

## 2026-10-12 — Arrangement preview and recognition limitation

User passed Jazz/Rock controls but reported an unrecognizable arrangement on Reach Out to the Truth. Current chord/beat estimates omit signature riffs and instrumental melody; recognizability is unresolved. Added Preview arrangement with no library entry, playback and Save this preview (exact files, no rerender). Unsaved preview files remain on disk but are excluded from discovery; preview approval does not add to chat pool. Saved preview metadata uses existing backups. Range validation and Stop apply. Manual checks: preview without song-count change, pause and save the exact preview, invalid-range/Stop, restart and check saved playback. Melody/riff-preserving rendering remains future work.

## 2026-10-12 — Instrument parts review

Added Instrument parts tab. Original combined accompaniment is usable immediately with Mana vocal; Prepare instrument parts creates a separate 1–60 second review project using six-stem Demucs. Estimated guitar/piano/bass/drums and residual Other/mixed rows offer playback, gain and mute. Their sum retains the saved accompaniment (residual includes unassigned/leaked material). Style recommendations sit beside Keep original replacement selectors; unapproved substitutions are disabled. Preview/save mixes use aligned stems and clipping protection; safe stem metadata persists with existing project backups. Original exports/pool clips remain intact. Manual checks: combined original mix; prepare and audition parts; mute/gain preview/save; restart/export and invalid range/Stop.

## 2026-10-12 — Checked-part preview and review refresh

User passed stem-review checks and noted piano-like material in Other; labels remain separator estimates, not instrument identification. Changed instrument mute checkboxes to Include in mix, added vocal inclusion, Preview checked and Preview all (all parts/vocal at current levels). Save uses checked parts and preserves selections via muted metadata. Review state now synchronizes on project readiness/media/settings changes, fixing stale rows when a project becomes ready or a saved mix is selected without switching tabs. Manual check pending for checked/all preview and immediate saved review refresh.

## 2026-10-12 — Experimental guitar-to-sax preview

Checked/all preview and review refresh passed user acceptance. Prepared projects now offer Guitar replacement → Sax (experimental). Preview transcribes the isolated guitar with project-local Basic Pitch ONNX, selects a continuous line, then renders attributed FluidR3_GM alto-sax samples. Original remaining stems and cropped Mana vocal are retained. This is a timbre-swap experiment, not a full jazz arrangement; uneven transcription remains unresolved. Current review checkbox/gain edits are separate from replacement preview. Save replacement preview retains exact files without regeneration; preview-only jobs do not appear in discovery. Native validates all input stem paths/durations before launch. Output carries instrument attribution. Requires existing data/transcription-packages and data/instrument-samples assets; no runtime install/download from UI. Production smoke verified 12s, safe peaks and unchanged non-guitar stems. Manual checks: preview/no new entry, Stop, save/restart/remaining stem playback, original selection still works.

## 2026-10-12 — Bundled replacement data-path fix

Desktop replacement failed with missing basic_pitch despite installed project-local dependencies. Python derived data paths from its script location, which changes when bundled. Native arrangement requests now pass explicit project data_root; replacement and separation cache lookup use it. Missing setup errors identify the actual folder. Regression copied scripts into a relocated resources directory and rendered a 12-second sax mix using the project data folder successfully; 59 native tests passed. Desktop replacement acceptance remains pending.

## 2026-10-12 — Solo replacement audition

User confirmed bundled dependency fix but expected isolated sax when previewing replacement. Preview sax only now loads the generated sax stem; Preview replacement mix separately loads the complete mix. Cached preview files are reused, with no regeneration or added library entry. Fixed explicit stem playback being intercepted by an existing arrangement preview. Saving still keeps the complete replacement project. Manual solo/full listening acceptance pending.

## 2026-10-12 — Unified replacement dropdown previews

User requested dropdown-driven playback instead of extra replacement buttons. Guitar → Sax now feeds row Preview, Preview checked, Preview all and Save mix. The first audible sax use generates/cache-resolves the replacement without adding a library entry; subsequent previews reuse it. Keep original returns to the original guitar path. Checked-part exclusions and current gains apply; Preview all includes all dropdown-selected parts. Removed separate sax/full/save-replacement controls. Save mix retains selected sax stem metadata alongside the complete mix, while the original project stays intact. Transcription quality remains experimental. Manual check: dropdown toggle changes checked/all/solo preview, excluded guitar does not play, saved mix/restart uses sax, Stop suppresses late playback.


### Guitar replacement options — 2026-10-12

Added sampled Piano and clean Electric guitar alongside Sax in the guitar replacement dropdown. All use the shared row Preview, Preview checked/all, and Save mix controls. The existing guitar melody transcription is retained; piano and electric guitar retain its register, while sax keeps its existing octave placement. These are experimental melody replacements, not full chord/strumming reconstruction. Existing vocal and other stems remain unchanged. Guitar-to-piano has a separate replacement-piano label and file to preserve an existing piano stem. Replacement paths and labels survive library backup validation. FluidR3_GM note-bank attribution is included with exports.

Validation: production build; frontend tests; 59 native tests; five-second real piano and electric-guitar renders with finite, audible, peak-bounded audio and unchanged other stems.

Manual checks after restarting Mana: choose Piano then row Preview; choose Electric guitar then Preview checked/all; Keep original returns to guitar; Save mix and reopen confirm the chosen replacement and original piano part remain.


### Replacement phrasing refinement — 2026-10-12

Refined Sax, Piano and Electric guitar playback: instrument-specific attacks/releases, ringing piano/guitar tails, softer sax phrase starts and shorter connected attacks, and crossfaded sax sustain extension when a note outlasts its sample. Conservatively repairs short low-confidence pitch detours surrounded by the same note, while retaining strong short notes and real rests. No rhythmic grid quantization or random timing changes. MIDI now exports the performed melody and register rather than the raw polyphonic transcription.

Generated matched-level 12-second before/after solo and full-mix auditions in exports/singing/phrasing-comparison. Real section retained 20 notes in both versions; improvements here concern articulation, not proven pitch-detection accuracy. Regression checks cover weak versus strong detours, preserved rests, release tails, finite exact-length audio and unchanged other stems. Listening approval remains pending. Existing saved mixes are unchanged; restart Mana to use the updated bundled renderer for new previews. Single-line transcription still cannot reconstruct full original guitar chord/strumming performance.


### Source-supported gap repair and guitar tone audition — 2026-10-12

Short detected rests (25–240 ms) now extend the preceding note only when its frequency band and RMS remain supported inside the gap relative to the source note's ending. Does not quantize note onsets or fill long rests. Sustained-tone/silent-gap/long-rest regression checks passed. The 12-second Reach Out comparison bridged eight source-supported gaps; this does not establish correctness of all transcription notes.

Generated matched-level solo and full-mix comparisons in exports/singing/gap-tone-comparison, including clean versus sampled distorted electric guitar. Distorted guitar is audition-only via the renderer tone argument; the UI/default clean guitar is unchanged pending listening approval. Existing saved mixes remain unchanged. Source: FluidR3_GM distortion_guitar-mp3.js, same CC BY 3.0 attribution as other banks.


### Live HQ Natural V3.0 single-bank audition — 2026-10-12

User supplied data/instrument-samples/LiveHQNatural/Live HQ Natural SoundFont GM.sf2 (945,937,616 bytes). README and embedded metadata identify V3.0, UnderxPipe1985, engineering credit Pipe Nacho, and source Musical Artifacts artifact 1176. User reports CC BY 4.0 from listing; README/embedded metadata have no explicit license. Retained attribution, copyright, source, license provenance and audition modifications; underlying keyboard/Zenology sample permissions not independently verified.

Installed official portable FluidSynth 2.6.1 Windows x64 runtime under data/fluidsynth/runtime for local auditions, without changing the production instrument renderer. Parsed 186 presets. Successfully rendered matched-level 12-second Concert Grand (GM 0), Alto Sax (65), Strat Clean Guitar (27), and Distortion Guitar (30), zero-based program numbers. All four use the same gap-repaired transcription and no added chorus/reverb for fair tone comparison. Solo/full mix files and bank-info.json are under exports/singing/livehq-audition. Existing source stems, app defaults and saved projects unchanged. Listening approval pending before integration.


### Live HQ trial integration and separate guitar tones — 2026-10-12

Instrument parts now offers an Instrument bank selector: Live HQ Natural (trial, initial selection) and FluidR3 (previous sounds). Guitar replacements include Sax, Piano, Clean electric guitar and Distorted electric guitar. The bank affects replacements only, never Keep original or existing chord-based New accompaniment. Row Preview, Preview checked/all and Save mix share the selection. Cache keys include bank and guitar tone to prevent stale comparison playback. Saved mixes retain actual rendered WAV paths and distinct electric-guitar-distorted labels through library/backup validation.

Live HQ uses in-process FluidSynth 2.6.1 via the portable DLL in data/fluidsynth/runtime, with no audio-device driver or detached subprocess. Owned-job Stop also terminates the renderer; soundfont and DLL are local dependencies, not embedded in the app. Missing dependencies show an error rather than silently playing another bank. Rendered replacements use bank-specific attribution files. Existing projects and pool clips remain unchanged.

Validation: production build; 59 native tests; frontend suite and metadata roundtrip test; real five-second production renders for all four Live HQ presets plus FluidR3 distorted guitar, with bounded finite audio, attribution present and unchanged other stems.

Manual checks after restarting: (1) Live HQ Piano/Sax row Preview, (2) Clean versus Distorted guitar Preview checked/all, (3) switch FluidR3/Live HQ and Keep original, (4) Save mix/reopen retains rendered tone, and Stop prevents late playback. Trial listening approval pending.


### Separate-library listening comparison — 2026-10-12

Located user's AccurateSalamander, BlackAndGreenGuitars, and nested Weresax/Weresax downloads. Installed official portable sfizz 1.2.3 Windows x64 under data/sfizz/runtime for auditions only. Rendered Accurate-Salamander recommended DAW flat piano, Weresax Sax.sfz, and Green twang guitar with identical MIDI to the Live HQ comparison. Added a driven/filtered guitar audition from the clean Karoryfer performance, not a separately recorded distorted patch.

All three SFZ jobs completed without renderer errors; audio verified finite and audible, trimmed to 12 seconds and matched to the same source guitar RMS with peak protection. Solo and original-minus-guitar replacement mixes, logs, render-info.json and instrument attribution are saved in exports/singing/separate-library-audition. Included licenses: Accurate-Salamander/Salamander CC BY 3.0; Karoryfer guitar and Weresax CC0. Production dropdown/defaults remain unchanged pending listening decision.


### Separate libraries added alongside retained banks — 2026-10-12

User approved the separate-library auditions. Added Separate libraries as the initial replacement bank choice, retaining Live HQ Natural and FluidR3 for comparison until final selection. Uses Accurate-Salamander recommended DAW flat piano, Weresax Sax.sfz and Karoryfer Green twang guitar. Distorted guitar applies the approved drive/filter processing to that guitar performance. Keep original bypasses replacements. Existing shared preview/checkbox/volume/save behavior and bank-aware cache keys apply.

Production SFZ rendering uses the local sfizz DLL in-process with offline sample streaming enabled, sample-accurate event offsets and 512-frame blocks. It does not launch a detached executable or install an audio driver. The downloaded libraries, runtimes and older bank files are all retained. Original saved projects remain unchanged; saved new mixes retain actual rendered audio paths.

Verification: build passed, 169 frontend tests passed (2 optional skipped), 59 native tests passed, all four real separate-bank production renders passed finite/audio-duration/peak checks, attribution copied and other stems unchanged. Manual checks after restart: separate-bank Piano/Sax previews; Clean/Distorted guitar; switch back to Live HQ/FluidR3 and Keep original; save/reopen and Stop.


### Melody selector comparison — 2026-10-12

Started melody fidelity work after separate-bank approval. Source analysis shows polyphonic guitar/chord candidates; independent pYIN tracking was mostly uncertain, so no pYIN corrections were forced. New selector discounts a lower octave only when a competing upper-octave candidate has sufficient detector confidence and direct spectral support, and increases pitch-transition penalties. Restored repeated pick attacks only where source onset detection and a same-pitch detector event agree. Does not quantize timing or invent notes in silent gaps.

Generated original guitar, before/after Karoryfer clean-guitar solos, and full mixes in exports/singing/melody-comparison. Current candidate has 28 articulated notes versus 20 previously; octave transition count increased from 2 to 5, so this is a listening candidate, not a verified melody correction. Synthetic checks preserve a clearly supported low note and silence while preferring a well-supported competing upper octave. Samples/voice/bank choices unchanged. Listening approval required to judge whether candidate improves melody fidelity; original implementation snapshot retained in data/arrangement_replacement_before_melody.py.

The melody candidate is retained in data/arrangement_replacement_melody_candidate.py for audition. Restored the approved production selector while listening is pending, because additional octave jumps make automatic replacement premature.


### Melody candidate v2 — 2026-10-12

User found first candidate better, requested further improvement. Kept production unchanged and refined audition module data/arrangement_replacement_melody_v2.py: raises competing upper-note confidence threshold and tracks detector event age so a fresh stronger lower pick is not overridden by an older upper sustain. Source-confirmed repeated attacks remain.

Matched 12-second Karoryfer comparison in exports/singing/melody-v2-comparison: previous candidate 28 articulated notes/5 large pitch transitions, v2 27 notes/2 large transitions. Finite audible exact-length renders and synthetic checks for fresh pick, supported upper octave, weak competing upper candidate, real low notes and silence passed. Fewer large jumps is diagnostic, not proof of correct transcription; listening approval pending. Approved production renderer and all instrument banks retained.


### Melody timing candidate v3 — 2026-10-12

Built on user-preferred v2 for another listening comparison; production remains unchanged. Aligns attacks by at most 45 ms only where source onset detection and a same-pitch detector event agree. Updates contiguous shared boundaries without reordering notes or removing real pauses. Conservative weak-detour repair requires a <=100 ms low-confidence note between matching neighbours plus weak source energy; strong short notes and rapid runs remain.

Matched 12-second Karoryfer solo/full mixes in exports/singing/melody-v3-comparison. Both baseline and v3 retain 27 notes and two large pitch transitions; seven attack times adjusted, with corresponding contiguous note lengths updated. Weak-detour filter changed none on this section. Finite audible exact-duration rendering and synthetic source-only/order/rest/fast-note/weak-versus-strong checks passed. Listening approval pending; v2 retained as baseline and all original sources/banks intact.


### Approved melody/timing pass wired into app — 2026-10-12

User requested in-app listening with all replacement instruments. Promoted data/arrangement_replacement_melody_v3.py into scripts/arrangement_replacement.py. Shared transcription now includes v2 octave competition/event freshness, source-confirmed repeated attacks and v3 bounded source alignment/conservative weak-detour filtering for Sax, Piano, Clean guitar and Distorted guitar across all banks. Existing vocal and non-replaced stems remain untouched. Preview checked/all renders the complete prepared-section mix; replacement sections retain their existing 1–60 second limit, not full-song processing. Saved old mixes remain unchanged; restart/repreview generates the updated selection.

All four Separate libraries production render checks passed: finite audible exact duration, peak bounded, attribution copied and unchanged other stems. Native tests/resource refresh passed. Manual checks: four instrument previews, full mix via Preview all, Keep original, Save mix/reopen.


### Source-supported riff tail extension — 2026-10-12

User reported hard stops compared with original riff endings. Shared replacement transcription now follows source energy at the detected pitch for up to 400 ms beyond detector note-off, bounded by the next attack and excerpt end. Ends at loss of pitch-band/RMS support rather than stretching across true silence. Applies to all replacement sounds/banks; samples and source attacks/pitches unchanged.

Matched comparison in exports/singing/riff-tail-comparison: three note tails extended, retaining 27 notes, two large pitch transitions and unchanged attacks. Added synthetic sustained-tail/silence/next-attack/input-preservation checks. Listening comparison pending; updates affect new previews/saved mixes only. Clip boundary still limits tails, so this does not add audio beyond the selected section.


### Guitar release-envelope listening candidate — 2026-10-12

User still hears hard stops after source-tail extension. Inspected Karoryfer Green twang mapping: main picked-note ampeg_release is 0.25 s. Prepared a candidate with 0.65 s main release using in-memory sfizz SFZ loading at original patch path (relative includes preserved). Release-noise and inactive feedback settings unchanged; source library files untouched. Production stays on current approved pipeline while auditioning.

Matched comparison in exports/singing/release-envelope-comparison keeps all 27 notes, note lengths/attack times and pitches identical. Finite exact-length audio and differing release waveform verified. This isolates sample release rather than further pitch edits. Fading ringing can continue into a pause, but no new picked notes or sustained holds are inserted. Selected section boundary still limits tails. Candidate is data/arrangement_replacement_release_candidate.py; listening approval pending.


### Release comparison on requested 9–19s passage — 2026-10-12

User requested the heavier 9–19-second passage rather than the earlier 12-second comparison. Located existing 19-second Reach Out prepared stems in arrangement-1791744247383209600, verified request source points to 1791717415984. Rendered full 19-second current and 0.65-second release candidate with Karoryfer distorted guitar, then cropped 9–19 seconds so ringing from preceding notes is retained. Same 48 notes/pitches/attacks in both releases. Original accompaniment with Mana vocal also supplied for comparison. Finite exact-duration audio verified; trimmed one padding frame from source stems. Files in exports/singing/release-19s-comparison; production unchanged pending listening.


### Guitar-only release pass 2 — 2026-10-12

User preferred longer release but requested the next pass without mix, focused on original 9–19s. Prepared data/arrangement_replacement_release_v2.py with 0.9-second main picked-note release and up to 30 ms held-note overlap at connected different-pitch picks. No overlap across real rests (>25 ms) or same-pitch retriggers; source pitch and attack sequence remain unchanged. No reverb, vocal or other instruments in auditions.

Guitar-only full 19-second and extracted 9–19s baseline/candidate WAVs are in exports/singing/release-solo-pass2. Both have 48 notes; 31 connected handoffs changed their end time. Verified unchanged pitches/attacks, finite exact-duration peak-bounded audio, and synthetic real-rest/same-pitch/input-preservation cases. Original separated guitar included for reference. Production remains unchanged while listening; previous 0.65-second candidate retained.


### Dry overlapping-note guitar audition — 2026-10-12

User requested polyphonic test and assessment of crossfades/fades/reverb/delay/sidechain suggestions. Kept 0.65-second picked-note release as listening baseline; no production changes. Generated original guitar, single-line baseline and overlapping-note Karoryfer distorted guitar-only 9–19s excerpts, cropping complete 19s renders. Same preset/release/gain target, no vocal/backing/reverb/delay.

Experimental polyphonic path retains raw Basic Pitch events >=90 ms and confidence >=0.4, prevents overlapping same-pitch note-offs, and caps concurrent candidates at six. 102 overlapping candidates versus 48 single-line notes. These may include harmonic/chord detection errors; retained candidates are not proven notes/physical fingering. Finite exact-duration audio and same-pitch/order/voice-count bounds checked. Files and note lists in exports/singing/polyphonic-guitar-comparison; script data/polyphonic_guitar_audition.py.

DAW suggestions assessed: small fades/crossfades help discontinuities and joins, but cannot reconstruct missing riffs. Reverb/delay can mask rests and are optional later polish, while sidechain changes the balance against backing and cannot fix a guitar-only transcription. Evaluating dry overlap first. Sources: iZotope Vocal Editing 101 and Ableton Live Audio Effect Reference. Listening approval pending.


### Direct riff-tail envelope comparison — 2026-10-12

User rejected polyphonic guitar and requested extend-then-fade on single melody. Compared original prepared guitar and matched single-line 0.65s-release output using local pre/post note RMS. Source still carries energy at multiple phrase ends while generated energy falls earlier. Generated dry audition extends only source-supported phrase gaps by continuing a captured ending-note cycle with continuous boundaries, smooth fade-in and cosine fade-out. No extra pitches, vocal/backing or reverb; artificial continuation can alter texture and requires listening review.

Treated ten endings over complete 19s, including eight in requested 9–19s passage. Each continuation ends before next source attack, within 450ms and within excerpt. Output finite, exact duration and peak-protected. Original, baseline and candidate guitar-only 19s/9–19s WAVs plus tail-report.json are in exports/singing/riff-extend-fade-comparison. Production unchanged; polyphonic and 0.9s release candidates rejected as listening defaults.


### Melody-preserving source-supported overlap audition — 2026-10-12

User identified likely original riff overlap versus generated serial handoff. Previous post-gap extrapolated fade was not helpful. Kept preferred single-line pitches/onsets and 0.65-second release, extending held notes underneath later attacks only when the source still supports the previous pitch. Bound 220ms beyond next attack, avoid real rests and same-pitch retriggers, cap at the next occurrence of the same pitch. Does not restore extra raw chord candidates or add effects.

48 original melody notes retained; 21 held endings overlapped across later attacks in the full 19s diagnostic. Guitar-only before/after 9–19s and full19s files are in exports/singing/riff-overlap-comparison; data/arrangement_replacement_riff_overlap.py is audition only. Finite exact-duration peak-protected audio, unchanged pitches/attacks, synthetic source-support/silence/rest/retrigger checks passed. Spectral support remains heuristic, not verified source fingering. Production unchanged pending listening.


### Source-supported overlap accepted as next candidate — 2026-10-12

User heard an improvement and approved the melody-preserving source-supported overlap version as the next candidate. Current listening baseline: data/arrangement_replacement_riff_overlap.py, with 0.65-second main guitar release, preferred single-line melody, and source-supported note carry beneath later attacks. Reference audio: exports/singing/riff-overlap-comparison/next-9-to-19-solo.wav. Preserve earlier candidates for comparison. Production renderer remains unchanged; candidate acceptance is recorded without implying in-app deployment or final approval of instrument reconstruction.


### Accepted overlap candidate with Mana and backing — 2026-10-12

User requested full-mix audition before app integration. Mixed accepted overlapping melody and previous baseline with identical original-minus-guitar backing at 30% and Mana vocal at 100%, then peak protected. Full 19s and cropped 9–19s WAVs stored in exports/singing/riff-overlap-fullmix, with attribution copied. Exact duration, sample-rate agreement, finite audio and peak checks passed. No new transcription or changes to sources/production renderer. Full-mix listening approval pending.


### Approved guitar overlap promoted to the app — 2026-10-12

User passed the full-mix audition. Promoted data/arrangement_replacement_riff_overlap.py to scripts/arrangement_replacement.py. Clean and distorted guitar now retain the preferred melody and attacks while source-supported endings ring beneath later attacks, bounded to 220ms and avoiding real rests and same-pitch retriggers. Separate Libraries uses the approved 0.65-second main guitar release through an in-memory SFZ adjustment; downloaded samples remain unchanged. Sax and piano retain the existing melody and timing path. All three instrument banks and previous auditions are retained.

All four Separate Libraries production replacement smoke checks passed (finite audible output, duration, peak bounds, attribution and unchanged other stems), and 59 Rust tests passed with bundled resources refreshed. Restart Mana and generate a new replacement preview to use this renderer; previously saved mixes stay unchanged. Replacement excerpts remain limited to 1–60 seconds. Reconstruction remains a candidate with heuristic source support, not exact recovery of the original performance.


### Independent melodic-part replacements — 2026-10-12

Added independent replacement dropdowns for piano, bass and Other/mixed beside guitar. Each can use sampled sax, piano, clean guitar or distorted guitar from any retained bank. Row Preview renders only that part; Preview checked/all and Save mix resolve every selected audible replacement sequentially. Cache keys include source name/path, project, target, range and bank; up to 50 generated previews are retained in memory. Saved mixes keep distinct source-row identities so two parts using the same target are not merged or dropped. Keep original bypasses reconstruction. Source selection is validated in Rust and Python, and rendering excludes exactly the selected source while keeping all other stems.

Uses the current melody reconstruction rather than full chord/instrument recovery. Other/mixed can lose chords or contain separation leakage; bass can move into the selected instrument range. Drums remain original because replacement needs rhythm/percussion detection. Existing guitar candidate and all banks retained; no further guitar tuning in this pass. Replacement previews remain 1–60 seconds.

Validation: frontend build passed; 169 frontend tests passed with two optional checks skipped; 59 Rust tests passed and bundled scripts refreshed. Real 3-second piano, bass and Other/mixed to sax jobs passed duration, finite audible output, peak bounds, source exclusion and unchanged-other-stem checks. Manual simultaneous replacement, save/reopen and listening checks remain for the user.


### Additional sampled instruments and drum-kit replacement — 2026-10-12

User passed independent melodic-part checks and requested drums plus more instruments. Added Live HQ steel and nylon acoustic guitars, finger and acoustic bass, violin, string ensemble, flute and harp to melodic replacement dropdowns. These explicitly use existing Live HQ presets regardless of the selected three-bank comparison choice; piano, sax and electric guitars retain their bank behavior. Bass-source detection permits lower notes, with fixed register placement for bass targets. No new downloads or sample-library changes.

Drums now have Keep original plus Standard, Rock/Power, Jazz, Brush and Electronic kit choices. Separate rhythm path estimates source-timed independent low/mid/high band attacks (kick/snare/closed-hat MIDI candidates) and renders the chosen bank-128 kit on percussion channel 10. It does not quantize onto a new beat grid, and retains simultaneous band candidates. This is approximate hit classification, not complete recovery of tom fills, open hats, cymbals or playing technique. Drum-kit/melodic-source mismatches are rejected in Rust and Python.

Row Preview, Preview checked/all and Save mix use the selected kit/instrument through the same sequential cache/mix flow. Keep original retains recorded drums; source-row identities and other stems remain intact. Excerpts remain 1–60 seconds. Guitar tuning is deferred per user request.

Validation: all eight added melodic presets and five drum kits rendered audible finite peak-bounded 3-second production audio with correct source exclusion, unchanged other stems and attribution. Drum kit output distinction, silence rejection, synthetic simultaneous kick/cymbal detection, and drums-first fresh-process dependency loading passed. Final frontend build and 59 Rust tests passed; frontend suite passed 169 checks with two optional checks skipped. In-app listening/save checks remain for the user.


### Synths, keyboards, harmonica and ocarina; finer extraction direction — 2026-10-12

User passed the new drum/instrument checks and requested synths, keyboards, harmonica, ocarina and more original instrument extraction. Added twelve existing Live HQ presets: Rhodes electric piano, FM electric piano, church organ, accordion, harpsichord, clavinet, harmonica, ocarina, square synth lead, saw synth lead, warm synth pad and polysynth. All work through existing per-part preview/cache/mix/save controls. No new downloads, sample edits or changes to approved drum/guitar reconstruction.

User chose strings and wind instruments as the priority for finer source extraction. Current htdemucs_6s has fixed vocal/drums/bass/other/guitar/piano outputs; additional replacement tones do not create new isolated source stems. Official Demucs documentation confirms the fixed six-source model and notes piano bleed/artifacts: https://github.com/facebookresearch/demucs . AudioSep is a candidate for text-guided musical instrument separation with CPU/CUDA and chunked inference support: https://github.com/Audio-AGI/AudioSep . It needs its own runtime/checkpoints and an audition; it is not installed or wired in this pass.

Next extraction experiment: isolate strings and selected winds on a short original-accompaniment excerpt, compare against current Other/mixed, and audition each estimate plus residual. If acceptable, add an optional finer-extraction workflow with target selection, cancellation/progress, solo previews and approval before adding estimated parts. Preserve source timing and duration; subtract accepted aligned estimates from the source residual to avoid double-counting, and retain a remainder stem so the complete unedited mix reconstructs the source. Sequential extraction from the remaining audio may reduce overlap but can accumulate errors. Label estimates honestly; do not infer definite instrument presence from a nonzero output, promise perfect separation, or automatically run it for every cover. No finer source extraction has been added yet.

Validation: all twelve presets passed real 3-second production audio checks for duration, finite audible output, peak bounds, attribution, correct source exclusion and unchanged other stems; electric piano/FM and square/saw outputs differ. Frontend build and 59 Rust tests passed, bundled scripts refreshed. Manual in-app listening remains for the user.


### Sample-source labels and additional installed SFZ variants — 2026-10-12

Replaced experimental-transcription suffixes on sax, piano, clean guitar and distorted guitar options with the actual selected bank: Weresax / Accurate-Salamander / Karoryfer when Separate Libraries is selected, or Live HQ / FluidR3 when those comparison banks are selected. Reconstruction limitations remain in the explanatory text.

Inspected installed READMEs and top-level SFZ patches. Added Weresax sxnth synthesizer and saxcordion (accordion-like sound made from sax samples), Karoryfer black-guitar and combined black/green-guitar twang patches, and Accurate-Salamander treble +2.5dB and bass +1.5dB variants. These are variations of the installed sax/guitar/grand-piano samples, not new isolated-source families. Named variants always load their stated separate library even if the comparison bank changes. Existing approved sax, piano and green-guitar defaults and downloaded files stay intact. Other guitar articulation/key-switch files and Salamander live/minimum configurations are not treated as additional instrument families.

Validation: six variants passed production renders using the same 3-second source melody, with finite audible duration/peak-bounded output, source exclusion, unchanged other stems and attribution. Each pair produced distinct audio. Frontend build and 59 Rust tests passed; bundled scripts refreshed. User listening and source-label switching checks remain.


### Strings and winds separator prototype connected — 2026-10-12

Installed official AudioSep source under data/AudioSep, retained MIT/CLAP notices, and downloaded the official AudioSep and CLAP checkpoints (about 3.6GB total), verifying both against official LFS SHA256 hashes. Additional dependencies are isolated in data/audiosep-packages. Existing music-tools PyTorch 2.7.0 CUDA 12.8 works on the RTX 5070 laptop GPU. Tokenizer/configuration files are cached in data/audiosep-model-cache; app jobs use offline cache and never upload audio. Official implementation/source: https://github.com/Audio-AGI/AudioSep .

Added scripts/fine_separator.py using upstream ResUNet30 and a strict-loaded text-only CLAP Roberta pooler/projection/normalization path. Ignores only the older checkpoint's obsolete position-ID buffer for Transformers compatibility. Five-second overlapping inference windows cover short inputs and tails. Queries are string-instrument family and wind-instrument family, applied sequentially to remaining source audio. FLOAT WAV output retains signed residual without clipping. This estimates requested sounds; audible output does not prove that an instrument is present, and leakage or musical artifacts remain possible.

Music Studio → Review instrument parts → Separate strings & winds accepts a 1–30 second excerpt and saves a separate library entry. Uses Other/mixed when prepared parts exist, otherwise original accompaniment. Adds Strings (estimated), Winds (estimated) and Other/mixed remainder; existing guitar/piano/bass/drums stay intact. Estimated parts support the same original/replacement dropdowns, solo/checked/all preview, volume/mute and save-mix flow. Repeating extraction retains prior estimates while further splitting the remaining Other part. Stem labels and levels persist through backup validation. Original covers stay intact. Standard owned singing-job cancellation and progress are reused; invalid duration is blocked before creating a project/job.

Validation: 10-second Whereabout accompaniment audition produced finite aligned strings, winds and remainder files in exports/singing/strings-winds-audition, with source reconstruction error below 1e-5. Production 3-second prepared-parts job passed seven-part alignment, exact source-part sum within 1e-5, unchanged guitar/piano/bass/drums and peak-protected mix checks. Frontend suite passed 169 checks (two optional skipped), plus the new finer-part backup/path test; 59 Rust tests and final build passed, bundled scripts refreshed. User listening, in-app extraction/replacement/save and Stop checks remain.


### Strings/winds listening failed; extraction demoted to audition — 2026-10-12

User tested Reach Out to the Truth and Whereabout of the Stars and reported quiet noise rather than recognizable strings/winds. Earlier file-integrity, alignment and exact-sum checks did not establish instrument separation quality. This supersedes the earlier prototype's listening-readiness implication. Original covers and user-saved outputs are preserved.

Checked standalone CLAP versus separator-checkpoint text projection/embedding weights: exact matches, so no observed encoder-weight mismatch. Known isolated violin/flute samples are nearly reconstructed, but that is a trivial one-source test. Specific piano/harp/violin/flute prompts on the same Whereabout excerpt return highly similar source-correlated outputs, providing no reliable instrument identity. A known simultaneous violin/flute mixture with distinct timing showed SI-SDR improvement of -0.116dB for violin and +0.102dB for flute: essentially no separation improvement for this test. Reports/audio are in exports/singing/separator-query-comparison and exports/singing/separator-mixture-check. These tests do not prove general model failure, but do not support useful strings/winds extraction in Mana yet.

Changed Music Studio finer extraction to an experimental audition. It creates preview-only outputs, provides separate strings/winds/remainder audition buttons, and requires an explicit Keep this audition in library action. It no longer automatically inserts a new library project on extraction success. Library cap checked before saving; changing the selected project or generating another preview clears the audition. Clear text warns about leakage/noise and unconfirmed instrument presence. Existing files, covers, voices, replacements and standard part separation remain available. Frontend build passed.

Next quality work must compare a more suitable separator or model on controlled mixtures plus real audible instrument sections, and obtain listening approval before treating finer source extraction as usable. Numerical file checks or louder normalization must not substitute for recognizable separated audio.


### Optional sax and Banquet piano extraction connected — 2026-10-13

Music Studio → Review instrument parts → Optional instrument extraction now offers Audition sax and Audition Banquet piano for saved 1–30 second accompaniment sections. Both use the full saved accompaniment, including on a project with existing Demucs parts. Each generates an extracted part and a signed remainder that reconstruct the original accompaniment, rather than adding an overlapping estimate on top of original stems. Preview each part and Keep this audition in library to save a separate project. Existing covers/Demucs parts remain in their original projects. The saved extraction project has standard Include in mix checkboxes, volume, replacement choices, Preview checked/all and Save mix; sax-extracted and piano-banquet labels/mute/levels survive validation/backups and reviewed-mix saves.

Added bundled scripts/optional_separators.py: verified sax-specific Demucs checkpoint and strict-loaded Banquet piano checkpoint; local GPU when available, CPU fallback. Banquet uses isolated dependencies and a retained 10-second recorded piano query under data/separator-references/piano.wav. Bounded eight-second windows with overlap-add prevent large GPU allocation; output is aligned to the 24k job audio. No audio uploads or automatic model downloads. Backend rejects oversized ranges and missing model/query files before creating a job. Owned-job Stop behavior is reused. Existing strings/winds AudioSep audition remains experimental and separately available; broad winds/strings are not declared ready.

Validation: frontend build passed; existing frontend suite passed 170 checks with two optional skipped, and the new optional-extractor backup test passed. 59 Rust tests passed. Production sax and piano extraction modes on a three-second Whereabout section passed finite/aligned audio and exact extracted-plus-remainder reconstruction within 1e-6. Model hashes and strict loading verified. User in-app checks pending: audition/save sax, audition/save Banquet piano, checkbox previews/save/reopen, and invalid range/Stop.


### Unified separator menu; keyboard/trumpet research — 2026-10-13

Merged standard and optional extraction controls into one visible Separate instruments panel at the top of Review instrument parts. One Separator dropdown lists standard Demucs guitar/piano/bass/drums, alternate Banquet piano, dedicated sax Demucs, and AudioSep strings/winds explicitly experimental. Shared start/duration controls and one Audition selected separator action replace the scattered prepare/extract buttons. Standard Demucs now follows the same preview-only audition and explicit Save audition to library flow. Per-part preview buttons show all returned parts; audition title identifies which result is loaded. Original projects and mix-checkbox workflows remain unchanged. Standard limit 60 seconds; optional limit 30; existing preflight/backend validation retained.

Keyboard/trumpet research: official MVSep Mega 53 model release https://github.com/ZFTurbo/Music-Source-Separation-Training/releases/tag/v1.0.21 supports keys, digital-piano, piano, organ, synth, trumpet, brass and other families. Author recommends at least 16GB VRAM, warns individual-stem quality may be below specialized models and outputs can overlap. Laptop is 8GB, so do not declare compatibility or integration before bounded/CPU trial and listening review. The hosted newer version differs from public weights; no audio uploaded. Keyboard should be labeled by subtype rather than silently equated to acoustic piano. New targets remain next-stage auditions, not enabled menu entries.

Validation: build passed, frontend regression suite 171 passed with two optional skipped. UI checks pending: find all four choices in the one menu, audition/save standard parts, audition/save optional piano or sax, and verify duration errors/Stop and original project preservation.


### Mega-53 keyboard/trumpet candidate audition — 2026-10-13

Downloaded official MSST source and MVSep Mega-53 v1 release https://github.com/ZFTurbo/Music-Source-Separation-Training/releases/tag/v1.0.21 . Verified release SHA256: config 7e198062a251587088adb91215a4f44ab59e67bd62fcc805cf54d6e7dfc51103; checkpoint c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f. Checkpoint size 1368919887 bytes. Three inference dependencies isolated in data/mega-packages; existing runtimes unchanged. Strict model loading passed with official configuration; tuple tags safely converted to tuples without evaluating arbitrary YAML objects.

Runner data/mega_separator_audition.py uses upstream active_stem_ids to run only trumpet, digital-piano, keys, organ and synth outputs, four-second windows/three-second hop with overlap-add, inference/autocast float16 and batch one. RTX5070 laptop 8GB peak allocated memory about 2.858GB for this test. This validates short selected-output inference only, not official full 53-stem/long-window memory behavior.

Known four-second LiveHQ trumpet plus Rhodes/electric-piano mixture: SI-SDR improvement +17.668dB trumpet, +14.125dB digital-piano, +16.441dB keys. Organ nearly absent; synth not a correct target for this mixture. These are sample-based controls, not a live performance. Whereabout 80–90 second real accompaniment produced useful-audition-sized keys/digital-piano output and near-silent trumpet, without asserting instrument presence from amplitude. Raw/aligned finite results, truths, original, level-adjusted listening copies and report in exports/singing/mega-keyboard-trumpet-audition. Controlled test about 2.14s inference; song about .90s, excluding model loading/rendering/download. Keys/digital-piano overlap and are alternative estimates, not additive stems. Listening approval pending. No app/menu integration or audio upload.


### Keyboard, electric piano and trumpet wired — 2026-10-13

Added Keyboard / keys, Electric piano and Trumpet choices to unified Review instrument parts → Separate instruments. Uses approved Mega-53 model locally with one selected output, four-second/three-second-hop overlap-add, GPU autocast and CPU fallback. Existing verified models/dependencies remain in project data; no downloads/audio uploads during extraction. Each 1–30 second audition creates its named extracted part and a signed remainder preserving the saved accompaniment. Explicit preview/save remains required; originals kept. Saved parts support checkbox/volume, replacement instruments, preview checked/all, reviewed-mix saving and backup labels. Keyboard and electric piano are alternatives with possible overlap, explained in menu.

Backend preflight checks range and model/config presence before spawning a job. Production verifies checkpoint SHA256 and strict weights load. New labels: keyboard-extracted, electric-piano-extracted, trumpet-extracted. Bundled optional separator script refreshed via Rust build.

Validation: frontend build passed; 171 frontend checks passed with two optional skipped; 59 Rust tests passed. Extended backup test preserves new labels alongside sax/piano with muted state/levels. All three production modes on a three-second Whereabout section passed finite aligned audio and extracted-plus-remainder reconstruction within 1e-6. Listening approval was obtained on earlier Mega-53 auditions; in-app control/save checks remain: all three appear and audition, save with original retained, checkbox/volume preview then save/reopen, invalid range and Stop.


### Original-song generation stage 1 — 2026-10-13

Added Original song tab to the full-size Music Studio. Inputs: title, 1–2000 character prompt, Gentle piano/Light acoustic guitar/Jazz/Anime-inspired rock/Synth-pop, instrumental toggle, optional English lyrics up to 6000 characters, 10–180 second full duration, seed 0–2147483647. First make an approximately 15-second preview; full generation is enabled only for matching prompt/lyrics/style/instrumental/seed. Duration and title can change without invalidating the creative settings. Longer song is a newly generated rendition, not an exact extension of the preview. Actual generated duration is read from the WAV.

Reuses existing read-only C:/AI/acestep.cpp/build/Release/ace-lm.exe and ace-synth.exe plus installed GGUF models in C:/AI/Manaverse-BGM-Generator/models. No new model downloads or changes to the other projects. New bundled scripts/original_song_job.py plans caption/lyrics/audio codes then renders with base Q8 model at 50 steps. Original generated audio and request/enriched plan/seed metadata live in exports/singing/original-*; preview jobs are excluded from discovery and do not enter library automatically. Full songs persist as original projects and are rediscovered with actual title/duration/prompt/seed/lyrics. Audio stays external to JSON backups.

Instrumental is the default. Lyrical generation uses a generated guide singer, explicitly not Mana voice. Play generated audio/Generated lyrics are available after generation. Create Mana cover opens the existing cover form with generated audio, voice separation and whole-song conversion selected; the user reviews conversion settings and starts the established Mana voice pipeline. Saved lyrical originals expose the same action under Song details. No silent voice conversion or claim that ACE-Step output is Mana. Original instrumentals play/export directly; source review/mix needs separated singing stems. Chat pool approval remains separate.

New original_song_start native command validates inputs/runtime/model presence before job creation and shares the owned singing-job slot. Cancellation kills only the original job's owned process tree on Windows, covering the native child; other singing job behavior remains unchanged. Frontend timeout is 30 minutes. No local web server required. Original-only draft actions do not edit library metadata before a saved project exists.

Validation: local 15-second instrumental native audition rendered 14.24s stereo48k WAV; production lyrical draft with original test lyrics rendered 14.24s finite WAV; production 60-second instrumental rendered exactly60s and retained request/results. Frontend build passed; 172 frontend checks passed, two optional skipped. 61 Rust tests passed, including original request boundary validation, actual owned child-process cancellation, and original mix-only discovery compatibility. Metadata/seed/lyrics backup and preview fingerprint test passed. Listening quality and manual UI acceptance remain for the user. High-note/trembling voice conversion issue remains deferred.

Manual checks: (1) restart Mana, Original song tab, make/play short preview; (2) create 30–60 second full song, reopen/restart and verify metadata/play/export; (3) turn off Instrumental, use own lyrics or blank for automatic English lyrics, preview then open Create Mana cover; (4) change prompt/seed to require a new preview, reject invalid duration/seed, and Stop during generation.

### Approved lead-only → zero-shot Seed-VC cover flow — 2026-10-13
New Music Studio covers default to Mega lead-only extraction, Seed-VC's F0-enabled 44.1 kHz singing model, 50 steps, guidance 0.7, seed42 and conservative guide pitch smoothing at original key. The approved eight-second derived singing reference is copied to stable `data/custom-voice/references/mana-v2/singing.wav` with provenance; chat voice configuration is unchanged. Create-cover form exposes Lead only (recommended) / Voice & harmonies (Demucs), plus a checkbox to use Mana's singing reference or the selected chat reference. Dry vocal input can skip separation.
Lead extraction runs in a hidden owned subprocess using the installed Mega checkpoint and short overlapping windows; its GPU model exits before CPU Seed-VC conversion. Stop now terminates the cover worker's owned process tree. Missing separator setup is rejected before native job folder creation; worker verifies the checkpoint checksum and refuses silent fallback. Resource bundle includes cover_lead.py and singing_pitch.py; explicit project data root supports packaged workers. Lead and backing are scaled together if necessary before PCM encoding to prevent clipping. Backing is original mix minus the combined-vocal estimate, rather than original mix minus lead, to avoid deliberately retaining the original singer's backing harmonies. Extraction remains estimated and can contain artifacts. Input files and old cover audio remain unchanged.
Cover metadata/backups/discovery preserve extractor choice; old entries without this field retain Demucs metadata. FCPE remains an audition fallback and is not integrated or selected as production default. Original-song guide-to-cover uses the same Create cover flow.
Validation: 173 frontend tests passed, two optional skipped; build passed; 61 Rust tests passed including owned-process-tree termination. Production 30s whole-input smoke verified GPU extraction → CPU conversion, valid duration and finite/unclipped guide, backing, vocal and mix. Output `exports/singing/production-lead-cover-smoke-2026-10-13`. Listening approval of this production run remains a manual check.
Manual acceptance after restarting Mana:
1. Create a Whereabout excerpt starting170s, length30s, Lead only and Mana singing reference enabled; listen to Mana vocal for the approved stability.
2. Play Full mix and Instruments; confirm alignment, backing volume and absence of obvious doubled original lead.
3. Test Whole song or a dry sung guide with separation disabled, then reopen Music Studio and verify older covers still play.
4. Stop while extracting; confirm processing stops and another cover can start. Demucs remains selectable for comparison.

## 2026-10-14 — Cover Builder

Added clean-vocal-to-Mana conversion with individually imported instrument tracks, timing/volume/mute controls, replacement auditions and editable saved covers. Simplified Music Studio navigation and folded advanced cover settings. Build, 175 frontend and 63 native checks passed; desktop listening acceptance pending.

## 2026-10-14 — Backing voices and karaoke lyrics

Fixed direct-track replacement crashes caused by null companion stems. Added multiple backing-vocal imports with optional Mana conversion, and saved/editable timed lyrics in the main song player. Lyrics use local Whisper and highlight whole lines during playback.

## 2026-10-14 — Approved piano melody and dynamics

Prepared piano tracks using the Salamander library now retain polyphonic chords, repair unsupported repeat attacks and use source-guided soft-note dynamics. Integrated the user-approved Whereabout audition method; other sources and instruments retain their existing renderer.

- Added separate Bright room guitar · NAM · +2 replacement in Cover Builder and Edit tracks, using the approved brighter/small-room tone and local NAM capture. Bass remains independently controlled; existing guitars retained. Verified rendering, backups and builds.

- Added Warm crunch, Rock rhythm and Sustained lead NAM guitar options, using the existing local JCM800 capture with separate voicings/effects. Existing Bright room +2 retained; other instrument libraries unchanged.

- Cover Builder: added detected-note/hit previews for the selected original-instrument interpretation, selectable1–60s sections and a separate original-recording preview. Audition without applying a replacement.

- Cover Builder: whole-song detected-note previews with seeking; melodic instrument customizer for pitch and extra note hold, preset reset and saved per-track tuning. NAM +2 can now be overridden directly.

- Integrated bass-specific slow/fast tracking and refined attacks for Bass → Finger bass/Picked bass. Quick notes use shorter releases, sustained notes4× release; pitch/hold customizer retained. Added Picked bass to Builder and Edit tracks; updated bass detected-note preview and saved metadata.

- Added separate Live HQ Tenor sax and Weresax Alto sax choices with softer releases, source-supported overlap and conservative short-noise note rejection. Preferred melody method retained; pitch/hold customization and saved identities supported.

- Rock drums now uses approved source-following kick/snare dynamics and trimmed cymbal layer at −6 dB, with ringing tails retained. Other drum kits unchanged; preview/save workflow retained.
# 2026-10-16

- String ensemble replacements now use smoother connected holds and conservative cleanup of weak passing notes, with softer dynamics for uncertain notes. Existing saved audio is retained.

# 2026-10-16 — Flute

- Flute replacements now have softer entrances, smoother connections and conservative correction of isolated octave jumps. Saved songs remain unchanged until a new replacement is made.

# 2026-10-16 — Solo violin

- Violin replacements now use a melody-focused audio guide to reduce notes picked up from other layers, with softer phrase entrances. Pitch and extension controls remain available.

# 2026-10-16 — Trumpet

- Added Trumpet · Live HQ replacements with phrased attacks and sustain, pitch/extension customization, and saved-library support.

# 2026-10-16 — Vocal melody instruments

- Cover Builder can turn a clean vocal melody into harmonica, flute, trumpet, violin, strings, ocarina or piano as a separate track, with pitch/hold controls and smoother held vocals.
- Mute the source vocal to preview and save the instrumental melody mix without converting it to Mana’s voice.

# 2026-10-16 — Gentler ocarina and vocal instrument choices

- Ocarina now has gentler entrances and connected sustain.
- Vocal-to-instrument melody supports the other melodic Builder instruments, including guitars, bass, keyboards, synths and sax variants; original vocals remain separate.

# 2026-10-17 — Electric piano touch

- Electric piano replacements and vocal-melody tracks now use gentler source-following key strength, shorter decay on quick notes and longer decay on held notes. Pitch and extra-hold controls remain available.

# 2026-10-17 — Held vocal electric-piano notes

- Reduced repeated electric-piano strikes caused by vocal vibrato crossing pitch boundaries, while retaining sustained pitch changes and vocal rests. Applies to newly generated vocal-melody previews.

# 2026-10-17 — Synth lead articulation

- Synth lead/saw replacements and vocal melody now use clearer accents and tighter release. Warm pad keeps its existing plain sound.

# 2026-10-17 — Backing harmony

- Cover Builder can regenerate a short third-above harmony in Mana’s singing voice, with Auto or chosen song key, preview and a separate quiet backing-vocal track.
- Harmony tracks retain their own volume, mute and timing controls while preserving the lead.

# 2026-10-17 — Harmony range fix

- Fixed valid harmony sections being rejected as out of range because of one-sample resampling rounding.

# 2026-10-17 — Upper/lower harmony

- Cover Builder now offers Third above and Third below for regenerated backing harmonies, with the existing key, preview and separate-track controls.

# 2026-10-17 — Preview harmony blend

- Hear lead and harmony together and adjust backing volume before adding the track.
- Previously generated upper/lower harmony previews are reused for matching settings during the current Builder session.

