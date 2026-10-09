# Project structure

Repository: [Aishi-mana/ManaAI-CV-2](https://github.com/Aishi-mana/ManaAI-CV-2.git)

Inspected 2026-10-09. This is a guide to the source layout, not an exhaustive file
listing. Update it when modules or storage responsibilities move.

Microphone input: `src-tauri/src/dictation.rs` owns the cancellable hidden System.Speech recognition helper and language enumeration. `src/core/useDictation.ts` controls launch/poll/cancel and suppresses late cancelled results; `src/core/dictation.ts` validates recognizer lists and draft transcription. ChatPanel appends accepted text to the current draft. No persisted audio or new storage key.

Local transcription: `src/core/whisper.ts` validates persisted CLI/model setup and encodes bounded 16 kHz PCM WAVs; `useWhisper.ts` owns WebView capture, track/context cleanup and cancellation tokens. `src-tauri/src/whisper.rs` validates audio, owns CPU CLI inference and temporary WAV/text cleanup. `mana.whisper.v1` stores setup in SQLite/backups. Runtime/model live under ignored `data/whisper`; audio exists only in memory or the app-data `transcription-temp` directory while CLI inference runs. Windows recognition and its review UI remain available.

## Main directories

`src/core/avatarReference.ts` renders current configured layers in neutral expression into a transient 640-pixel JPEG. ChatPanel offers session-only comparison; App passes the reference through visionChat to the two-image vision request. Saved reports mark reference comparison as resemblance evidence only.

Image understanding: `src/components/VisionDrawer.tsx` manages setup/preview/review;
`src/core/vision.ts` validates saved settings, prepares bounded inline images, checks
server vision capability and builds text discussion context. `src-tauri/src/vision.rs`
owns an independent hidden local server and detects the installed Qwen3-VL pair.
`mana.vision.v1` stores setup in SQLite/backups; the separate review panel is transient
until the user shares its report text. `scripts/vision-smoke.py` is a manual
CPU inference check that owns and cleans up a temporary server; its log is ignored.
`src/core/visionChat.ts` owns per-message startup/inference/cleanup for composer
attachments. ChatPanel prepares the transient preview; App serializes vision then chat.
`src/core/savedImages.ts` validates/deduplicates prepared JPEGs under 100-image/8 MB
encoded-data limits. `mana.images.v1` stores pixels in SQLite and JSON backups.
`SavedImagesDrawer` searches/deletes pixels; `ImageReportView` displays linked chat/archive
thumbnails and allows reuse in current chat. Deletion preserves source descriptions.
Optional `Msg.imageReport` stores filename/description and a saved-image ID, validated with chat and
retained in archives/backups/export. The request builder supplies uncertain report text.

Read-aloud: `src/core/useSpeech.ts` coordinates chat controls and native status;
`src-tauri/src/speech.rs` enumerates Windows voices and owns the cancellable hidden
System.Speech helper. `src/core/speechPreferences.ts` validates saved voice/automatic
preferences (`mana.speech.v1` in SQLite/backups) and tracks new replies for once-only playback.
Preferences include voice, automatic playback, integer speech rate and speech volume;
the native helper applies speed/volume before synthesis.
`src/core/speechMouth.ts` maps native visemes and rejects stale playback IDs; ChatPanel
passes mouth updates through App/StagePanel to Avatar. Text-timed useLipSync remains for
the avatar Test preview and browser/no-voice fallback.

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

