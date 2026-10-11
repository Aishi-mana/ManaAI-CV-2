# Music Studio — stage 1

Open **More → Songs** for the full-size pastel Music Studio. The library is on the left, artwork/player in the center and cover controls on the right. At smaller window sizes, creation controls move below the player. **Back to chat** preserves the chat draft, studio form and selected project. Playback pauses when leaving the studio. A running conversion continues and chat generation waits while that CPU job is active.

## Library and artwork

Completed covers are discovered from safe generated files under `exports/singing`; **Find saved covers** repeats discovery without duplicating already-known media. Old jobs without source metadata use a Saved cover title; rename them under **Song details & artwork**. Newly converted projects retain their title, source, reference, conversion settings, duration and render status.

Choose PNG/JPEG/WebP album artwork under Song details. Images are center-cropped, resized to 384×384 JPEG and bounded to 150,000 data-URL characters. A pastel placeholder is used until artwork is chosen. Library removal preserves audio files and chat-pool entries. Discovery may re-add a removed entry because its exported files are intentionally retained.

The library holds up to 50 projects. Metadata, selection and resized artwork persist inside `mana.initiative.v1` and are included in existing JSON backups; older backups gain an empty studio. Audio/model files stay external. A rendering project encountered after app restart is marked interrupted, not falsely ready. Completed files can then be discovered.

## Player

Select a song and press Play. The player offers full mix, Mana vocal and separated instruments, plus pause, restart, stop, seeking and volume. Missing versions are disabled. A mix-less dry-vocal project uses its vocal for Full mix. Switching versions stops playback and starts the chosen version on the next Play.

Generated preview WAVs remain limited to 256 MB; exports can remain on disk when too large for in-app decoding. Ready means conversion completed, not that singing quality passed listening review. Missing/deleted files show a playback error without modifying approved chat-pool media.

## Creation and chat pool

Create whole-song covers or 1–60 second excerpts using the existing supplied-guide workflow. Separation and original-backing volume are available. Completed outputs become library projects automatically; chat-pool approval remains explicit and separate.

The **Chat song pool** tab preserves the existing 1–30 second approved-clip workflow and fills the Prepared WAV field from the selected project's mix/vocal. Full-song excerpt extraction without reconversion is the next stage; it is not implemented yet. Original arrangements and prompt-generated songs remain future work. High-note distortion and trembling remain deferred and unresolved.

The pool uses compact library-style rows, matching artwork when its audio is linked to a library project. Search matches titles and aliases; aliases expand on demand. Icon buttons enable/disable chat availability, load a preview and remove an entry, with tooltips and accessible labels. The list scrolls independently as it grows. Removal keeps exported audio and chat history.

## Manual acceptance

1. Restart Mana for the native update; open More → Songs. Check the full-size layout and discovered covers. Rename an old cover if needed.
2. Select a song and test mix, vocal and instruments, Play/Pause, seeking, volume, Restart and Stop. Back to chat should pause studio playback without losing the chat draft or selected song.
3. Choose album artwork, rename a project and restart. Check artwork, title and selection persist. Library removal should leave exported files and the chat pool intact.
4. Create a cover, optionally return to chat while it renders, and check it becomes a ready library project. Stop should mark a pending project stopped. Check the Chat song pool tab still adds reviewed short clips and named chat requests still work.

The user confirmed tests 1–4 passed on 2026-10-11. Production build, 166 frontend tests, 57 Rust tests and browser layout checks cover the foundation. The subsequent compact-pool appearance update needs a desktop visual check.
