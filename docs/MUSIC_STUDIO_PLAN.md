# Music Studio — agreed plan

Agreed with the user on 2026-10-11. Stage 1 is now built, with basic artwork selection and saved project settings included. See [MUSIC_STUDIO.md](MUSIC_STUDIO.md) for current behavior and manual acceptance. Excerpt extraction, additional export/mix tooling and instrument/original generation remain future work.

## Direction and appearance

Create a full-size main app view rather than a side drawer, with clear navigation back to chat. Keep Mana's existing pastel pink, lavender, soft blue and light surfaces. The experience should resemble a music-player app, with album artwork and a browsable library.

Proposed layout: library on the left, large artwork and player in the center, creation controls on the right. Adapt this arrangement for smaller windows while keeping playback and navigation accessible. This is the agreed starting layout, not a finalized visual specification.

## Library and player

- Store full covers and future original songs in a studio library, with artwork, title, duration and processing/review status.
- Provide a timeline, playback controls, volume and vocal/instrumental listening modes.
- Keep source audio, separated stems, converted vocals and mixes associated with their song project. Save project settings and exports so a restart does not lose the work.
- Support album-cover image selection; the exact artwork creation workflow remains to be designed.
- Keep full songs separate from the chat's short-song pool.

## Cover creation

Upload a song or sung guide, choose Mana's voice reference, configure accompaniment and review the rendered result. Reuse the working full-song conversion workflow as the foundation.

Two distinct accompaniment workflows:

| Workflow | Result |
| --- | --- |
| Keep original instruments | Separate the source, convert its vocal to Mana's voice and remix the existing backing. |
| Recreate the arrangement | Generate new instrumental backing in a chosen style, such as light piano, guitar or anime-inspired. |

Instrument recreation requires a separate generation workflow. Separation alone does not create a new arrangement. Preserving the source melody, chords, timing and vocal alignment needs tool evaluation and listening tests before this capability is presented as ready.

The user also wants original-song generation from a prompt and options for anime-style or full-length versions. These remain future scope until suitable local tools are selected and tested. Song structure and duration controls still need design.

## Chat excerpts

Add an **Add excerpt to chat pool** action on a completed song. Select a short section from the existing finished audio, audition it and explicitly approve it. Do not rerun voice conversion just to extract the section.

The current chat pool accepts 1–30 second clips with titles, aliases and enabled flags. Preserve named-song lookup, missing-song suggestions, Replay and opt-in occasional musical moments. Chat humming remains unaccompanied. Lyrical chat songs should have a clearly audible Mana vocal over light guitar or piano when that arrangement is available.

## Delivery stages

1. **Full-size library and player.** Replace the cover drawer experience with a pastel main app view, using the existing supplied-guide/full-song cover workflow.
2. **Excerpts, artwork and mix controls.** Add reviewed excerpt extraction, artwork management, saved project settings, vocal/backing balance and export controls.
3. **Instrument recreation, then originals.** Evaluate local tools for new arrangements, test alignment and quality, then implement prompt-driven original-song generation after selecting a suitable workflow.

Keep incomplete generation capabilities clearly described as future work. Do not silently replace working voice references, approved pool clips or existing exports.

## Current evidence and deferred work

- Music Studio stage 1 tests 1–4 passed user acceptance on 2026-10-11. The chat pool now uses compact searchable library-style rows and icon actions with tooltips; excerpt extraction remains the next delivery stage.

- The user confirmed the song menu/pool works, including adding a second song and named requests.
- The user confirmed an actual whole-song cover completed faster than expected. Full songs cannot currently enter the short chat pool; this is intentional.
- Higher sung notes can distort Mana's voice, and trembling persists. Sixty conversion steps helped slightly; the gentler pitch audition was preferred, but neither pitch smoothing nor lighter conversion guidance resolved the trembling.
- The user explicitly chose to defer singing-quality troubleshooting and prioritize the Music Studio experience. Keep the quality issue open; do not mark it fixed or resume tuning as part of the studio UI work without a new request.
- Existing JSON backups include pool metadata and settings, not audio/model files. The studio's library storage and media-backup strategy need design; do not imply that full-song media is already backed up.

## Initial acceptance goals

- Open the studio as a main app view and return to chat without losing work.
- Browse saved song projects with artwork, duration and truthful status; preview vocals and mixes.
- Convert an uploaded whole song using the established workflow, with progress and cancellation.
- Select a reviewed short excerpt from a finished cover and request it by title/alias in chat.
- Retain library/project metadata across restart and make export/media-storage behavior explicit.
- Validate new instrument-generation tools separately before enabling arrangement recreation or original-song creation.
