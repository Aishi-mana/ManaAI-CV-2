# Mana changelog

User-facing changes to the current Rust/Tauri and React/TypeScript Mana.
Started 2026-10-09, retrospectively from project docs, available chat evidence and
Git history. This is a substantial development record, not a complete transcript.
Dates below identify known development sessions, not packaged release dates.
Unreleased changes must not be mistaken for committed or shipped releases.

## Unreleased — current development

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
