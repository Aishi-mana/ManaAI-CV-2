# Project structure

Repository: [Aishi-mana/ManaAI-CV-2](https://github.com/Aishi-mana/ManaAI-CV-2.git)

Inspected 2026-10-09. This is a guide to the source layout, not an exhaustive file
listing. Update it when modules or storage responsibilities move.

## Main directories

```text
ManaAI-CV-2/
├── README.md                 # Setup and current behavior
├── docs/                     # Vision, roadmap, structure, history and checks
├── src/
│   ├── main.tsx              # Startup and persistence hydration
│   ├── App.tsx               # UI state and generation coordination
│   ├── components/           # Chat, avatar and feature panels
│   ├── core/                 # Domain logic, validation, prompts and persistence
│   └── styles.css
├── src-tauri/
│   ├── src/                  # Rust desktop commands and SQLite storage
│   ├── capabilities/         # Desktop permissions
│   ├── icons/
│   ├── Cargo.toml
│   └── tauri.conf.json       # Window/bundle configuration and bundled assets
├── assets/avatar/            # Layered character images/catalog
├── tests/foundation.test.cjs  # Production TypeScript tests with mocked boundaries
├── scripts/                  # Supporting development scripts
├── appsteps/                 # Existing development-step material
├── exports/                  # Generated user exports, not source code
├── Start Mana.bat
├── Build Mana exe.bat
├── package.json
├── tsconfig.json
└── vite.config.ts
```

`node_modules/`, `dist/` and `src-tauri/target/` are dependencies/build outputs.
Their contents are not a source architecture inventory.

## Frontend responsibilities

| Area | Main modules |
| --- | --- |
| Chat/server boundary | `llm.ts`, `useLlama.ts`, `settings.ts`, `conversation.ts`, `chatSearch.ts` |
| Identity/fact memory | `character.ts`, `memorySuggestions.ts`, `personality.ts` |
| State and initiative | `internalState.ts`, `useInternalState.ts`, `relationship.ts`, `activity.ts`, `useActivity.ts`, `initiative.ts`, `clock.ts`, `followups.ts` |
| Reflection/continuity | `diary.ts`, `dailyJournal.ts`, `thoughts.ts`, `events.ts`, `episodes.ts`, `timeline.ts`, `narratives.ts` |
| Reviewed work | `goals.ts`, `interests.ts`, `work.ts`, `workValidation.ts`, `battle.ts`, `playtests.ts` |
| Confirmed practice | `skills.ts`, `SkillsDrawer.tsx` (component; counts are not assessed proficiency) |
| Shared activities | `sharedActivities.ts` |
| Avatar/progression | `avatar.ts`, `wardrobe.ts`, `progress.ts`, avatar/progress/lip-sync hooks |
| Storage/recovery | `persistence.ts`, `backup.ts`, `dataHealth.ts`, `validation.ts` |
| Archives/exports | `chatArchives.ts`, category `*Export.ts` modules and export components |

The modules above live in `src/core/`. Feature drawers and controls live in
`src/components/`. `App.tsx` still coordinates shared model locking, generation,
review drafts and state updates; this is not yet a fully decomposed runtime/service layer.

## Rust responsibilities

- `src-tauri/src/lib.rs`: command registration, server/process handling and desktop
  backup/export integration.
- `store.rs` and `character.rs`: SQLite app state and relational identity/memories.
- `store_tests.rs`: native storage/migration regression tests.
- `avatar_files.rs`: asset scanning/reading and path checks.
- `conversation_export.rs`: categorized native text-export handling.
- `main.rs`: desktop entry point.

## Runtime data and exports

Windows desktop state lives outside the checkout at
`%APPDATA%\com.mana.companion\mana.sqlite3`. Safety backups live under that
application-data directory's `backups/` folder. Browser development uses localStorage.

Configured user-approved exports for this installation are under
`C:\AI\ManaAI-CV-2\exports`, categorized as conversations, diary, activities, work
and playtests. Model GGUF files and llama-server are configured external inputs,
not bundled source files or backup contents.

## Documentation responsibilities

- [ManaAI.md](ManaAI.md): vision, character design and detailed implementation notes.
- [ROADMAP.md](ROADMAP.md): authoritative milestone checklist and scope/status notes.
- [CHANGELOG.md](CHANGELOG.md): user-visible changes.
- [DEVLOG.md](DEVLOG.md): decisions, verification and deferred issues.
- [Legacy-comparison.md](Legacy-comparison.md): historical Python comparison.
- [Reliability-checks.md](Reliability-checks.md): manual verification steps.

## Avatar asset layout

The current avatar assets follow a modular structure similar to:

```text
assets/
└── avatar/
    ├── base/
    │   └── body.png
    ├── eyes/
    │   ├── eye_*.png
    ├── mouth/
    │   ├── mouth_*.png
    ├── hairstyles/
    │   └── default/
    │       ├── hair_back.png
    │       ├── hair_front.png
    │       └── hair_ahoge.png
    ├── outfits/
    │   └── default/
    │       └── outfit.png
    └── accessories/
        ├── ...
        └── <depth>/
            └── ...
```

The system is intended to grow naturally as additional visual content is added.

---

