# Mana's Sketchbook — scheduled personal drawings

**Status:** Design proposal; no application code implemented  
**Date:** 2026-11-23  
**Workstream:** Mana's personal creativity; **independent of Codex's Manaverse work**  
**Initial cadence:** 3 drawings per week, opt-in

## Purpose

Give Mana a modest, recurring creative activity of her own. She imagines a small scene or doodle, generates it using the existing **local** image-generation tools, and saves it in **Mana's Sketchbook**. These are imagined artworks, not illustrations claiming something happened in the diary.

This is a first step toward Mana pursuing small personal interests. It deliberately does **not** include web search, music downloading, autonomous cover-song production, or Manaverse interaction.

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

For the MVP, choose small ideas with a bounded planner. Sources may include current mood, interests, season, curiosity and **user-approved existing** memories; include random whimsy so every drawing is not autobiographical. The model can optionally propose a compact title/concept, but validation must enforce output limits.

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
- `src/components/ImageGenerationDrawer.tsx` and `src/App.tsx`: user-driven generation flow, job ownership and cancellation. Reuse the underlying generation boundary rather than programmatically clicking the UI.
- `src/core/diskGallery.ts`, `src/core/savedImages.ts`, and the native gallery commands: durable images, thumbnails, deduplication and deletion.
- `src/core/diaryArtwork.ts`: **inspect only for separation**. Do not route sketchbook drawings into diary records.
- `src/core/initiative.ts`, `src/core/internalState.ts`, `src/core/clock.ts`: existing time zone, companion state and availability rules that may inform scheduling.
- `src/core/persistence.ts`, `src/core/backup.ts`, Rust storage paths and associated tests: storage, recovery and backup support.

Prefer a focused `src/core/sketchbook.ts` domain module, a scheduler hook/controller, and a separate `Sketchbook` component rather than growing `App.tsx` significantly. Align exact placement with existing code patterns.

## Implementation sequence

1. **Core/data tests first:** validate settings, slot computation, week boundaries, missed-slot policy, dedupe, suppression and failure handling, with injected clock and mocked generator.
2. **Storage:** sketchbook metadata + gallery reference; restart, backup/restore, deletion and failure recovery.
3. **Generation integration:** one isolated, cancellable scheduled generation job using an existing configured local model; block conflicts and release resources.
4. **UI:** opt-in setting, minimal sketchbook collection and status/errors.
5. **Optional announcement:** publish only for a confirmed saved drawing; never invent an event in chat/diary.

## Acceptance checklist

- [ ] Feature defaults OFF and setting survives restart.
- [ ] When enabled, generates **three or fewer scheduled drawings weekly** without duplicate slots or catch-up bursts.
- [ ] Works only when a suitable local image backend is configured and available; no internet search or remote download.
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
