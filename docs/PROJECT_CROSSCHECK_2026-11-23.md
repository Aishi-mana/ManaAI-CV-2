# ManaAI project cross-check — Codex handoff (2026-11-23)

> Documentation-only review. This is a snapshot of GitHub `main` at `22bb612b21477cf918f5376e2716e8f6b5192a38` (plus the CI results from separate PR #1). It is **not** a release sign-off or a claim that all functionality was run locally.
>
> **Ownership:** Manaverse development and its unfinished work are reserved for Codex to continue. This handoff records observations, not instructions to replace unfinished Manaverse code. Separate work on new features for Mana herself must not accidentally modify the Manaverse workstream.

## 1. Intent and primary sources

ManaAI's long-term goal is a local-first, persistent daughter-companion with a coherent identity, memories, emotional state, initiative, relationships, creative interests, an embodied room and eventually an autonomous shared world. It is character-first: new features should strengthen Mana's continuity rather than accumulate disconnected tools. Milestones should remain incrementally usable, with explicit permission/sandbox boundaries for autonomous actions.

- [Vision/design](ManaAI.md) — V1 local companion, V1.x agency/creativity, V2 room, V3 Manaverse; see its development principles and ultimate goal.
- [Roadmap](ROADMAP.md) — official milestone checklist, but several Manaverse items may now be stale.
- [Current status](CURRENT_STATUS.md) — dated 2026-11-12; do **not** assume its V2/V3 future-work statements reflect the newest code.
- [Manaverse layout](MANAVERSE_TOWN.md) — town topology, weather, schedules and interactions.
- [Project structure](PROJECT_STRUCTURE.md), [next handoff](NEXT_CHAT_HANDOFF.md), [changelog](CHANGELOG.md), [dev log](DEVLOG.md) — implementation history and evidence limitations.

## 2. Current-versus-goal snapshot

| Area | Evidence in current repository/documentation | Status / necessary distinction |
| --- | --- | --- |
| V1 core companion | Tauri + React, local llama.cpp/GGUF integration, SQLite chat/settings/identity/memory/state, avatar and wardrobe | Foundation implemented; live model reliability and long-session consistency require ongoing checks. |
| Memory and character continuity | Memory search, episodic records, diary, reflection, initiative and saved goals | Implemented foundations; verify that relevant memories affect future responses without invented events. |
| Mana's self-directed interests/creative work | Game Dev, code sandbox, image tools, music/cover studio, reviewed work and skills | Many features implemented. A *successfully demonstrated autonomous multi-day game/project lifecycle* remains an explicit open goal. |
| V2 embodied room | Room, furniture routing/editor, activities, day-night routine, visual reactions, saved position | Extensive implementation in roadmap; do not conflate documented/automated coverage with new end-to-end user acceptance. |
| V3 Manaverse | Streets, square, district, park, resident homes, town hall, office, café, workshop, visitors, weather, shared memories, invitations and routes represented in code | In active development; implementation of a route is not proof all paths, assets and social behavior work on the installed Windows build. |
| Autonomous AI world | Resident identities/routines, phone exchanges, shared memory, goals and social-meetup logic | Early world foundation. Present behavior is substantially scheduler/rule-driven, not evidence of a fully emergent AI society. |

Official [current status](CURRENT_STATUS.md) calls V1.x the current milestone even though V2/V3 modules exist. Maintain a clear difference between **designed**, **coded**, **automated-test passing**, **manually accepted** and **production-ready**.

## 3. Documentation drift to reconcile (Codex-owned Manaverse review)

1. [Roadmap V3](ROADMAP.md) still leaves the Street → Square → Second Street and office/café/workshop expansion unchecked. However, [manaversePassage.ts](../src/core/manaversePassage.ts) defines those doorway pairs, [manaverseNavigation.ts](../src/core/manaverseNavigation.ts) routes several floors, and [ManaverseMap.tsx](../src/components/ManaverseMap.tsx) lists and links these places. **Action for Codex:** validate behavior and tests before changing the checklist; do not mark as complete based on code presence alone.
2. The [Current status](CURRENT_STATUS.md) 'Later milestones' section still calls a persistent room and much of Manaverse future work, while newer [Roadmap V2](ROADMAP.md) has many room entries checked and the newest Manaverse commit added extensive code. Align the summary with actual acceptance evidence.
3. [Manaverse town layout](MANAVERSE_TOWN.md) distinguishes solid current links from a dotted planned Community Garden link. The Community Garden remains an explicit roadmap item; do not infer it is implemented merely from neighboring park functions.
4. [Resident relationships](../src/core/residentRelationships.ts) stores bounded shared-event facts; [social activities](../src/components/useSocialActivities.ts) and [room phone](../src/core/roomPhone.ts) implement rules/messages. These are useful foundations, but future relationship evolution, autonomous events and durable independent goals require behavior-level validation.
5. The newest Manaverse commit can contain partial work because Codex previously stopped mid-task. Avoid broad automated rewrites/refactors or declaring old content dead without checking the full pending workstream.

## 4. GitHub Actions / CI evidence (as of this review)

- [PR #1: TypeScript activity preference fixes](https://github.com/Aishi-mana/ManaAI-CV-2/pull/1) is **open, not merged**. It only modifies `src/core/activityPreferences.ts`; leave it available for Codex to recheck. `main` retains the original type errors until merged or addressed separately.
- [PR #1 workflow run](https://github.com/Aishi-mana/ManaAI-CV-2/actions/runs/45113327396): **TypeScript/Vite build passed**, **Rust cargo check passed**. The full workflow is **red because some tests fail**, so do not label CI green.
- Frontend `npm test`: **498 total, 493 passed, 3 failed, 2 skipped**. The three failures check for art files missing from the GitHub checkout: town Christmas tree, Luna visitor sprite, and autumn scenery asset. These are asset-presence failures, not automatically runtime source defects.
- Rust `cargo test`: **99 passed, 3 failed, 1 ignored**. `avatar_files::tests::bundled_resources_match_source_and_work_after_relocation` expects bundled avatar resources in a test executable-relative path that does not exist in this Linux CI test layout. `singing::library_tests::arrangement_preflight_checks_shorter_stem_before_launch` assumes a Windows local export path. `whisper::audio_tests::dropped_session_removes_temporary_audio_and_transcript` calls `powershell.exe`, not available on Linux.
- Possible CI improvement: separate universal logic tests from OS-specific/integration tests; run Windows-targeted tests on a suitable Windows runner or gate them by platform, and make resource-path tests use a controlled fixture/build context. Do not silence failures unconditionally.
- Real generated media, installed GGUF/runtime, speech hardware, and UI interactions are not verified by these Linux CI checks. Production functionality needs Windows/local smoke tests.

## 5. Asset and repository health

- `.gitignore` excludes `/assets/`, `/public/` and new `/work/**/*.png` / `/work/**/*.jpg` paths. Already tracked files can remain after an ignore rule is added; fresh GitHub checkouts do **not** include many later images referenced by the code. The local laptop may still have them.
- Examples of paths referenced in code but absent from the GitHub checkout: `public/companion-room/manaverse-town-map.png`, `public/companion-room/luna-visitor.png`, `public/companion-room/lyra-visitor-clean.png`. Missing art can break display even if TypeScript compiles.
- `work/` was found to contain roughly 2,803 tracked files totaling about 53.5 MiB in the inspected tree. Review before cleanup: generated files can include needed investigations or unfinished Codex inputs.
- Future optional WebP conversion may help art sizes, but if WebP is introduced under `work/`, remember an appropriate ignore rule. Do not bulk-convert, delete or unignore artwork without coordinating with the owner and checking the asset loader/renderer.

## 6. Recommended Codex follow-up (when available)

1. Re-review [PR #1](https://github.com/Aishi-mana/ManaAI-CV-2/pull/1) and separately distinguish type fixes from test harness/assets failures. Merge only after review, not automatically.
2. Reconcile only demonstrably stale Manaverse milestone statements after compiling and manually verifying location transitions, map art, resident interactions, schedule/quiet-hour behavior and persistence.
3. Establish a reproducible distinction between Windows-native tests, portable CI tests and tests requiring private/local media; keep meaningful checks rather than bypassing them wholesale.
4. Test shared memories and resident goals across restarts without treating generated dialogue or scheduled movement as verified autonomy.
5. Preserve the user's closed/deferred areas unless newly requested: covered music milestone, hands-free closed scope, and incomplete voice/wardrobe tuning. Do not automatically restart them from old logs.

## 7. Separate workstream: Mana herself

The user wants subsequent feature development to focus on **Mana as a companion**, while Codex owns Manaverse. A feature has **not yet been specified**; do not treat the examples below as approved work.

Good areas to explore with the user: (a) continuity of memory and personality; (b) meaningful initiative grounded in saved history; (c) interests/preferences that influence choices; (d) persistent small personal projects with explicit review and honest progress; (e) more natural conversation/affection without intrusive notifications. Prefer a small, testable improvement to the existing companion over an additional large feature surface.

Constraints for any chosen feature: local-first, explicit consent for external actions/files, no invented achievements or offline activity, bounded resource usage, compatible SQLite/backup migration, regression tests, no surprise edits to Manaverse, and no dependence on Codex availability.

## 8. Scope and handoff boundaries

- This document makes **no code changes** and does not change any acceptance checkbox.
- The user intends Codex to own/finish Manaverse and to revisit the isolated PR as needed.
- Check the latest `main`, open PRs and Codex's local uncommitted work before acting: this note is a **dated snapshot**, not a source of truth that overrides newer code or user decisions.
- When a candidate feature for Mana herself is selected, keep it in a **separate branch/PR** and agree on its acceptance criteria before integration.

