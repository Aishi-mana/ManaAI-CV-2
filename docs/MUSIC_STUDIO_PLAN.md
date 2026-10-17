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

- Music Studio stage 1 tests 1–4 passed user acceptance on 2026-10-11. The chat pool now uses compact searchable library-style rows and icon actions with tooltips; reviewed excerpt extraction is now implemented and awaits manual acceptance. Remaining stage 2 mix/export controls and later generation work stay open.

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

## Instrument review workflow agreed 2026-10-12

Default: original accompaniment alongside Mana vocal. Upload/convert, separate and review estimated parts, then show an original-part label beside a replacement dropdown. Each row offers playback, mute and gain. Style-based recommendations are overridable suggestions (guitar→sax for jazz, guitar/piano→soft piano for gentle); confidence and mixed/other labels matter. Preview before saving a separate mix/arrangement. Preserve-notes/timing and freer rearrangement are distinct future replacement modes.

Current delivery: Instrument parts tab, aggregate backing review, 1–60 second six-stem preparation, estimated guitar/piano/bass/drums/other rows, individual playback/mute/gain, original mix preview/save, metadata persistence. Substitutions are displayed as unavailable experiments; sampled instruments/transcription need further listening improvement. No automatic instrument identity guarantees or production replacement pipeline yet.


Original-song stage 1 implemented 2026-10-13: local ACE-Step prompt/lyrics preview then full rendition up to180 seconds; generated guide singer has a separate action into the existing Mana cover workflow. See MUSIC_STUDIO.md for settings, limits, evidence and user acceptance.

2026-10-14: Cover Builder stage 1 implemented: clean vocal conversion, individual imported instrument tracks, manual timing/gain/mute, audition/apply replacements, saved editable mixes and clearer Create/Edit/Chat navigation. See MUSIC_STUDIO.md for limits and acceptance. Automatic tempo alignment and improved replacement expression remain future work.

2026-10-14: Backing-vocal tracks and local, editable line-level karaoke lyrics implemented. Timed lyrics persist in library metadata/backups. Word-level highlighting, automatic alignment and singing transcription quality improvements remain future work.

2026-10-14: Piano-first melody fidelity audition underway: preserve polyphonic detector events rather than a single melody. Whereabout 80–95s isolated comparison ready; wrong-note filtering and listening approval remain before integration.

2026-10-14: Balanced Whereabout piano audition accepted and wired for prepared piano/piano-banquet → Piano with Separate libraries. Existing mix loudness controls remain. Broader recordings and other instrument transcription quality remain future work.

2026-10-14: Guitar first pass audition ready on Reach Out to the Truth9–19s: source-supported sustain and picking dynamics with existing pitches/attacks unchanged. Clean audition approval and subsequent distorted rendering remain pending.

2026-10-15: Controlled Green/Black/Combo guitar patch auditions ready with identical performance and release, clean and distorted. User tone selection pending before additional guitar performance work.

2026-10-15: Brighter moderate-gain guitar amp-style and broad source-shaped EQ auditions ready. Uses transparent DSP speaker approximation; no measured cabinet IR/dedicated amp model installed. Listening approval pending.

2026-10-15: Real NAM Marshall amp+cab audition ready at two input levels using official locally built renderer. Input performance unchanged; listening selection pending. Local runtime commit: 0b3d3c97b0859a3a8c92a8628c4dd89a25eb5842. Capture kept local and excluded from app distribution.

2026-10-15: Approved brighter +2 / NAM small-room guitar integrated as its own replacement option. Guitar polish paused for user app listening; keep existing guitar choices and independent bass controls.

2026-10-15: Expanded local NAM guitar family with Warm crunch, Rock rhythm and Sustained lead. Separate amp/instrument captures are future work; current categories share one guitar full-rig capture. User listening pending.

2026-10-15: Implemented first instrument customizer (pitch and extra hold) and whole-song note auditions. Current NAM presets stay as tone shortcuts; broader effect controls can be added later.

2026-10-16: Bass method integrated with adaptive fast regions and fingered/picked timbres; app listening pending. Next proposed instrument pass is sax phrasing.

2026-10-16: SWAM declined. Integrated explicit LiveHQ tenor/Weresax sax options with approved phrasing direction, existing melody and narrow noise guard. App listening pending; source extraction errors remain separate.

2026-10-16: Approved Rock drum/cymbal method integrated; actual fixture matches audition. Manual app listening pending. Other kits preserved.
