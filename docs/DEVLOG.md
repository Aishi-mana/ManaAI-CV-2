# Mana development log

Started 2026-10-09. Backfilled from current project documentation, available session
evidence and Git. This records decisions and verification, not every tool call or
a complete historical audit. Older details without reliable dates are grouped rather
than assigned invented timestamps. No legacy data was migrated by writing this log.

## 2026-10-09 — Establish the historical record

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
