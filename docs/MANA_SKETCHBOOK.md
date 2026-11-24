# Mana's Sketchbook — scheduled personal drawings

**Status:** Design proposal; no application code implemented  
**Date:** 2026-11-23  
**Workstream:** Mana's personal creativity; **independent of Codex's Manaverse work**  
**Initial cadence:** 3 drawings per week, opt-in  
**Implementation decision:** Reuse Mana's EXISTING local image generator; add scheduling and automatic saving, not a new drawing engine.

## Purpose

Give Mana a modest, recurring creative activity of her own. She imagines a small scene or doodle, generates it using the existing **local** image-generation tools, and saves it in **Mana's Sketchbook**. These are imagined artworks, not illustrations claiming something happened in the diary.

This is a first step toward Mana pursuing small personal interests. It deliberately does **not** include web search, music downloading, autonomous cover-song production, or Manaverse interaction.

## Confirmed implementation direction — smallest possible addition

**Do not build a new image generator.** Mana already generates images locally. The Sketchbook feature only adds an autonomous trigger and a different destination for completed pictures:

1. At one of the three scheduled weekly times, check whether the app is open, the feature is enabled, and existing media/model jobs are idle.
2. Ask **Mana's existing local chat model** for a small imagined drawing idea (title, concept, image prompt); validate and bound its response. If that model is not ready, postpone instead of claiming Mana chose an idea.
3. Submit the prompt through the **same installed local image-generation commands, checkpoints, GPU/CPU resource handoff, progress/polling, Stop and result preparation** already used by Create picture, chat-generated pictures and diary art.
4. On confirmed success, save the picture automatically using the existing disk-backed gallery facility, then persist separate Sketchbook metadata. Do not require the user to press Save and do not attach it to a diary entry.
5. Display the result in **Mana's Sketchbook**; optionally notify in chat only after storage succeeds.

What is **new**: a small schedule/state validator, a bounded idea prompt/response helper, an automatic job trigger (with whatever *minimal adapter* the current UI-coupled generation flow requires), and separate sketchbook records/view/settings. What is **reused**: the local image model, image generation process, image job ownership/cancellation, GPU coordination, image preparation, disk file write and backups.

**No new image backend, checkpoint download, Python pipeline, generation algorithm, separate renderer, or broad refactor.** In particular, do not create a parallel image-job runner by copying `ImageGenerationDrawer.tsx` logic. Prefer a minimal shared entry point that calls the already-existing generation lifecycle. A narrow extraction from the UI may be necessary, but preserve its behavior for the current manual/chat/diary callers. Avoid modifying `src-tauri/src/image_generation.rs` or generation scripts unless a verified integration blocker requires it.

## User experience

- New **Mana's Sketchbook** view reachable from the existing app (ideally More/Images). A drawing shows its image, title, brief idea, date, and optional inspiration.
- New opt-in **Make drawings automatically** setting, **off by default**. The initial schedule is **3 times per week**; frequency and manual triggering may be exposed later.
- A completed scheduled drawing appears in the sketchbook, never in a diary image slot. The user can inspect it and delete it.
- Optional **Tell me when a drawing is finished** control, off by default. Announce only after image bytes and metadata have actually been saved; do not send repeated reminders.
- Any concept inspired by mood, interest or a memory is labeled **imagined** or **inspired by**, not an eyewitness or factual activity record.
- Do not represent images as hand-drawn pixels: Mana uses local AI image generation in a sketch/doodle visual style. Conversation can use the natural shorthand “I made a doodle,” while UI provenance remains explicit.

## Scheduling and guardrails

- Start only when enabled, the app is open and ready, and no conflicting model/image generation or user action holds the necessary resources.
- Respect current quiet hours, busy states and visible user work; a scheduled job must **never preempt** a user-requested image, diary drawing, chat model, voice or Manaverse work.
- Use persisted due slots in the configured local time zone, spaced over the week (for example Tuesday/Thursday/Saturday during daytime). Store the actual upcoming slot(s) and completion IDs to ensure reloads and clock changes do not duplicate jobs.
- At most **one scheduled image per slot** and **three successful scheduled images per configured week**. A missed slot may yield **at most one** catch-up image on the next eligible app-open session; never queue a backlog. The precise time and catch-up policy can be user-adjustable later.
- If generation is unavailable or fails, record an attempt/error and retry with bounded backoff; do not record a success or announce one. A canceled job is not a completed drawing. Prevent accidental infinite retries and duplicate saves.
- If a job finishes after disabling the feature, closing the relevant flow or canceling, enforce ownership/cancellation rules before storing or announcing it.
- No network browsing, downloading reference images, silent installation or unknown service startup. Use only locally configured generation backends.

## Content and idea planning

For the MVP, **Mana's existing local language model chooses the drawing idea** through a bounded prompt (title, concept and image prompt), using current mood, interests, season, curiosity and optional **user-approved existing** memories as inspiration. The output must pass validation and length limits. Use variety guidance so every drawing is not autobiographical. If the chat model is unavailable, defer instead of inventing a model-authored idea.

Example themes: tiny moonlit garden, playful cat wizard, invented café in the clouds, cute stationery doodle, cozy room imagined on a rainy day.

Suggested concept payload:

```ts
type SketchbookIdea = {
  title: string;
  concept: string;
  prompt: string;
  inspiration: 'imagination' | 'mood' | 'interest' | 'memory' | 'season';
  relatedMemoryIds?: string[];
};
```

- Avoid accidental claims that the pictured character, location, achievement or event actually exists.
- Use sketchbook-like style instructions (simple, friendly, hand-drawn-looking, limited composition), without assuming this is a real manual drawing.
- Do not create or update a diary entry simply because the drawing was made.

## Persistence model

Keep metadata separate from diary data; artwork bytes may reuse the established disk-backed image gallery/storage where suitable.

```ts
type SketchbookEntry = {
  id: string;
  title: string;
  concept: string;
  prompt: string;
  createdAt: string;              // ISO
  imageId: string;                // stored image/gallery reference
  sourceType: 'scheduled-drawing';
  imagined: true;
  inspiration: 'imagination' | 'mood' | 'interest' | 'memory' | 'season';
  seed?: number;
  model?: string;
  slotId: string;                 // stable due-slot identity
};
type SketchbookSettings = {
  enabled: boolean;               // default false
  frequencyPerWeek: 3;
  announceInChat: boolean;        // default false
  catchUp: boolean;               // default true, at most one
  timeZone: string;
  lastHandledSlotId?: string;
  nextDueAt?: string;
};
```

The model is indicative: follow the project's existing persistence/validation and backup patterns, do not paste it as-is without integrating with them.

- Metadata must survive restart and JSON backup/restore; restored entries should not break when disk originals are missing. Prefer existing gallery-backed files and portable backup mechanisms, avoiding unbounded base64 copies in app state.
- Explicit deletion must remove the sketchbook record and safely manage artwork ownership; do not delete a shared gallery file still referenced elsewhere.
- Consider limits for retained images and metadata, clear storage-full errors, and recoverable failures. Avoid claiming content is saved until both image storage and metadata are durable.
- No migration should rewrite or replace existing diary illustrations, generated clothing, or user-requested images.

## Existing code integration points to examine

These names are existing repository modules, **not claims that the new feature already exists**:

- `src/core/imageGeneration.ts`: image-request validation, model selection and local backend helpers.
- `src/components/ImageGenerationDrawer.tsx`, `src/core/imageSession.ts` and `src/App.tsx`: existing image-generation lifecycle, Tauri invocation/polling, GPU lease, Stop and completion. Reuse this exact flow behind a narrow scheduled-trigger adapter instead of inventing a second pipeline or programmatically clicking buttons.
- `src/core/diskGallery.ts`, `src/core/savedImages.ts`, and the existing native gallery commands: durable images, thumbnails, deduplication and deletion. Auto-save completed drawings here and keep their separate Sketchbook identity as metadata. Normal JSON backup preserves the gallery index/thumbnails, not full disk image bytes: portable media backup or a gallery-folder copy is needed for full-resolution restoration.
- `src/core/diaryArtwork.ts`: **inspect only for separation**. Do not route sketchbook drawings into diary records.
- `src/core/initiative.ts`, `src/core/internalState.ts`, `src/core/clock.ts`: existing time zone, companion state and availability rules that may inform scheduling.
- `src/core/persistence.ts`, `src/core/backup.ts`, and `src-tauri/src/store.rs`: register a new Sketchbook metadata/settings key in the existing allowlist and backup validators; add backward-compatible defaults for old backups. Keep existing diary and saved-image records unchanged.
- `src/core/clock.ts` and scheduling patterns in `src/App.tsx`: respect Mana's configured time zone, app-open conditions and current media/busy gates. Use `src/core/initiative.ts` only as a scheduling pattern, not as a place to store Sketchbook state.
- `src/components/MoreTools.tsx` and the More menu entries in `src/App.tsx`: expose a minimal **Sketchbook** workspace.

Prefer a small `src/core/sketchbook.ts` (settings, entries and due slots), `src/core/sketchbookIdeas.ts` (bounded local idea prompt), and `src/components/SketchbookWorkspace.tsx` (view/settings), plus **minimal** integration into `src/App.tsx`. A separate large image runner, new Rust generation engine or changes to diary art are **not** part of the plan. Only extract the smallest reusable image-job helper if required by the existing UI-coupled lifecycle.

## Implementation sequence

1. **Core/data tests first:** validate settings, slot computation, week boundaries, missed-slot policy, dedupe, suppression and failure handling, with injected clock and mocked generator.
2. **Storage:** sketchbook metadata + gallery reference; restart, backup/restore, deletion and failure recovery.
3. **Generation integration:** hook a scheduled request into the existing local generation lifecycle and its selected installed model; block conflicts and release resources exactly as user-requested generation does. Extract only a small reusable adapter if necessary; do not duplicate the engine or generator.
4. **UI:** opt-in setting, minimal sketchbook collection and status/errors.
5. **Optional announcement:** publish only for a confirmed saved drawing; never invent an event in chat/diary.

## Acceptance checklist

- [ ] Feature defaults OFF and setting survives restart.
- [ ] When enabled, generates **three or fewer scheduled drawings weekly** without duplicate slots or catch-up bursts.
- [ ] Uses the **same existing local image generator** and an already-installed, configured model; no new engine, checkpoint, web search or remote download.
- [ ] Respects foreground image/diary/chat tasks and cancellation; never silently preempts the user.
- [ ] Generates, saves and displays one completed drawing and metadata in **Mana's Sketchbook**, separate from diary images.
- [ ] Restart and backup/restore preserve entries; failures, deletion and storage limits behave safely.
- [ ] Grounding/provenance identifies each as imagined artwork and only announces genuine successful saves.
- [ ] Regression checks pass for existing diary, gallery, user image generation and local model lifecycle.
- [ ] Existing Manaverse code, schedules, residents and asset work are unchanged.

## Coordination

- This design belongs to the **Mana herself** feature workstream. Leave **Manaverse** to Codex.
- Keep implementation on a **separate feature branch/PR**; do not merge into unfinished Codex work or silently merge this design PR.
- Separate CI/test failures involving ignored local artwork or Windows-only tests from actual code regression. See [project cross-check](PROJECT_CROSSCHECK_2026-11-23.md).
- The user has approved the *direction* (scheduled imaginative drawings, approximately 3/week), not the exact UI placement, image style or backend selection; retain easy defaults and avoid imposing irreversible decisions.
