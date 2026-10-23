# Music Studio — agreed plan

## Native editor build completed — 2026-10-18

Native debug build completed successfully after Mana was closed. Includes the compact dark tools dock, responsive piano roll, clip fades and instrument note editing. Bundled arrangement_job.py and builder_notes.py hashes match current source. Frontend production build previously passed; visual/user acceptance of the revised dock remains pending. No new audio generated.

## Compact editor tools dock — 2026-10-18

UI refinement after user screenshots: selected track tools now open in a bounded dark bottom dock inside the music editor, outside the scrolling track grid. Timeline retains at least 140px; tools have an explicit Close tools button and their own bounded scroll. Compact trim/fade, track and note controls use matching dark fields and buttons. Piano-roll width follows its container using ResizeObserver, removing the large unused area on wide windows while retaining horizontal scrolling for longer sections. Audio/render behavior unchanged. Production frontend build passed. Visual verification remains pending because the earlier browser usage approval gate is unresolved. Final native rebuild still requires Mana to be closed.

## Clip fades and instrument note editing — 2026-10-18

Implemented in Cover Builder's inline Track tools. Selected clips have Fade in/out seconds and visual fade shading; the same smooth envelope is applied during live playback and saved mixes, including seeks into fades. Fades persist with projects/backups and Undo/Redo. Splitting retains outer fades and removes fades on the newly split internal edges.

Instrument tracks have a piano roll for one editable 1–60 second source section per track: load cached conversion notes or import saved notes JSON, add/delete notes, drag pitch/time, edit start/end and strength, then Render edited section. Rendering uses existing local sample instruments directly, without transcription or song generation, and replaces only that source section. Existing original audio and Undo are retained. This is instrument-note editing, not recorded vocal pitch correction. Cached performed notes include conversion transposition/velocity; raw detection files remain available. Older tracks without a cache can use the existing explicit detected-note preview once or import notes; loading never silently retranscribes.

Validation: frontend suite 205 passed, 2 optional skipped; production frontend build passed. Three direct-note Python tests and existing replacement regression passed; native note validation test and an earlier native debug build passed. Final native rebuild is pending: Windows denied replacing mana.exe while Mana was open. Bundled Python scripts match current source hashes. Close Mana and rerun the native build before claiming final installation. A one-second local two-note render produced finite, non-silent audio without detection (one-sample resampling tolerance). No full songs generated or models downloaded. Browser visual verification remains unavailable because the earlier browser approval usage gate is unresolved; user acceptance of these new controls is pending.

## Word karaoke accepted — 2026-10-18

User confirms word-by-word karaoke works and explicitly passes it. Transcription can miss/misrecognize words; user accepts Edit / paste as the correction workflow. Defer recognition-quality improvements; do not run more transcription/audio tests or tune models unless requested. Existing playback/seek timing and editable word lyrics accepted.

## Word-by-word karaoke implemented — 2026-10-18

Song Player lyrics support optional per-word start/end/text while keeping legacy line-only lyrics compatible. Native Whisper CLI uses -oj -ml1 -sow for actual word timestamp segments; group up to8 words into readable lines, retain timing gaps, skip music-only symbols, clamp final words to audio duration and retain line fallback for multiword segments. No evenly-spaced guessed timings. Existing Generate/Regenerate lyrics explicitly transcribes the saved vocal/mix locally. Cancel/timeout/temp cleanup preserved; JSON bound16MB.

UI highlights current word, marks sung words and reads live audio clock at20Hz during playback; pause and native seeking update exact position. Word data validates, persists through studio metadata/backups and clips/rebases with excerpts. Edit/paste exports enhanced LRC word start/end markers, preserving gaps; plain LRC still works. Existing line-only songs need Regenerate lyrics once for word highlighting; no song audio regeneration needed.

Validation: actual installed Whisper small.en transcribed one6s saved B clarity sample in4s and returned individual offsets; wording remains an estimate (one extra word recognized). Committed sanitized timestamp fixture tests native parser. Full frontend suite203 passed/2 optional skipped (205 total);5 native lyric tests passed; production frontend and native debug builds passed. Native/TS tests cover timing boundaries, gaps, backward seeks, pause positions, validation fallback, editing, excerpts, metadata persistence and real CLI-shaped offsets. No model downloads/new song generation. Browser UI not checked because prior approval usage gate remains unresolved. User acceptance pending.

## Original Song workflow accepted — 2026-10-18

User confirms the song finishes and explicitly passes the workflow: Original Song → Mana cover → Save. Minor unclear words remain but user accepts them and requests leaving this feature as-is for now. Treat current original generation/clarity guidance, duration-aware lyric planning, full preview/seeking, cover conversion and saving as accepted for this scope. Do not continue vocal tuning, regenerate tests or propose more fixes absent a new user request. Cover Builder and separated Studio menus were previously accepted.

## Duration-aware lyric planning and actual length — 2026-10-18

User reports sung output understandable with some unclear words, but90s ends mid-Verse3. Implemented automatic-lyrics planning BEFORE audio-code generation: installed LM inspire mode returns text/metadata only, then conservative line/word budget uses target duration and requested BPM (90 fallback), reserving intro/outro time. Keep complete opening lines and a closing line under an Outro heading; reject missing lyrics/closing line too long. Then generate codes from fitted lyrics. No post-code lyric edits. Supplied lyrics remain unchanged. Existing code/WAV duration cap, explicit BPM and approved sung guidance3.0 retained. Caption requests brief intro/clear ending within target. Heuristic fitting is not measured singing alignment or guarantee of natural cadence.

Preview shows Requested vs Actual audio lengths using ready project WAV duration, indicates auto-lyric shortening and warns if code/final-audio cap reached (possible cut ending). Generated lyrics remain a plan, not timed proof all words were sung. Flags retained for current draft only; requested/actual durations already persist through original brief/project metadata.

Validation:6 focused Python tests pass, including mocked text-only planning → fitted-lyric code generation ordering, supplied-lyrics preservation, closing-line/line/word budget, duration/BPM regressions. Replayed saved90s sung plan original-1792317727993187200 without models:36lines →15lines, closing line reserved. Frontend production build passed. Native rebuild completed after the user closed Mana; bundled original_song_job.py hash matches source. No actual generation or new audio; end-to-end new LM path/audio ending and UI await acceptance.

## Vocal-mode mismatch found and form retention fixed — 2026-10-18

User resumed unclear-word work. Inspected9 recent numeric original-* app jobs: all instrumental=true, [Instrumental] lyrics, guidance1.0, seed42. Latest original-1792317109315880500 requested/returned90s. These do not exercise approved sung guidance3.0; this does not establish an explanation for every earlier vocal artifact. Form default was Instrumental only and conditional unmount on menu switch discarded vocal/lyrics/prompt choices.

Changed OriginalSongPanel initial mode to With guide singer and now keep the form mounted behind hidden wrapper across menu switches. Player slot only supplied on Original Song to avoid duplicate shared audio refs. Generation panel explicitly states whether output contains instruments only or English guide singing. User can still deliberately choose instrumental; backend1.0/3.0 routing unchanged. Form retained during app session only (no new restart persistence). No model generation or voice repair. Frontend/native builds and four focused generation-routing tests passed. New sung app output and any remaining word-level defects still need actual listening; no claim of complete clarity fix.

## Original preview player immediately visible — 2026-10-18

User screenshot showed ready full preview with only Play preview. Cause: player JSX depended on loaded URL, which was populated only after manual Play. Now mount native audio controls whenever originalDraft exists and automatically load saved preview bytes on ready/return to Original Song. Explicit autoplay flag keeps auto-loading paused; Play/native controls start playback. Native controls expose seek/time/volume without first requiring Play. Loading uses cancellation/token checks; navigation/replacement stops obsolete fetches. No generation or settings changes. Frontend build and native debug build passed; no browser claim (prior gate unresolved).

## Full Original Song preview and seeking — 2026-10-18

User requested full preview because15s often contains only instrumental intro, plus seek slider. Original Song now generates a full-length preview directly using selected10–180s duration; no short-preview prerequisite. Optional15s intro check remains folded away. Native original_song_start no longer rejects previewOnly duration>20; shared validated10–180s limit remains. All previews stay out of auto-discovery. Save this version to library adds the exact ready audio/brief/lyrics to persisted studio metadata without a second generation; requires matching creative settings+requested duration, a full preview, unsaved status and capacity. Latest title applied on save. Saved preview audio remains external; source request retains previewOnly=true, so normal library persistence/backup keeps saved entry but raw discovery does not independently restore it if metadata is lost.

Original Song has full-width native audio controls above the form (play/pause/time/scrub slider/volume); existing audio ref/time/volume/cancellation logic retained. Shared player mounts once per menu; legacy hidden player no longer owns original preview controls. New variation changes seed; explanation that same idea/seed can reproduce rendition. No model-setting changes: accepted lyrical guidance3.0 retained; partial word clarity remains an acknowledged limitation. No new audio generated.

Validation: production frontend build, two focused original-song frontend tests, native original_request_validation test and native debug build passed. No browser verification attempted because previous usage-related browser approval gate unresolved. UI acceptance pending.

## User-approved lyric clarity setting now production — 2026-10-18

User confirmed B-stronger-lyrics has understandable words. Wired only that tested setting into scripts/original_song_job.py: base-model synth guidance_scale3.0 for sung Original Song; instrumentals remain1.0. Preserve original vocal prompt/enrichment, BPM and duration fixes. Four focused tests passed, including lyrical3/instrumental1. No additional audio generated. Accepted evidence: exports/singing/original-word-clarity-ab-2026-10-18/B-stronger-lyrics/original-song.wav. This is guide-vocal intelligibility acceptance, not Mana identity, full-song quality or proof all pitch artifacts are gone.

Native build completed successfully after the user closed Mana. Bundled original_song_job.py SHA256 matches source; accepted lyrical guidance3.0 is included. No frontend change or extra generation.

## Separate Studio menus — 2026-10-18

User requested UI-only separation after screenshot showed Original Song squeezed beside library/player. Replaced Create dropdown with explicit Original Song, Create Cover, Cover Builder, Song Player, Edit Tracks and Chat Clips menu buttons. Default screen Original Song. Original Song/Create Cover/Edit Tracks/Chat Clips use full-width focused workspace; library and saved-song player are visible only in Song Player (two-column layout). Cover Builder retains accepted full-width editor. Create Cover has a centered form and its own menu. Navigation clears prior playback, preserves existing generation callbacks; no audio/backend/settings changes. Responsive narrow layouts added. Saved libraries retained.

Production frontend build (TypeScript/Vite) and native debug build passed. Browser visual verification was blocked by automatic approval review reporting usage limit; action not executed. Do not claim screenshots or visual acceptance. Do not bypass gate or repeat attempted browser checks while unresolved. Preview harness work/studio-menus-preview.html ready for a later permitted UI check. User has not yet accepted new menus. No generation, separation or new listening requests.

## Current scope: duration and BPM only — 2026-10-18

User explicitly stopped vocal-artifact work due usage (10% remaining). Do not continue vocal repairs, separation, prompting experiments or generate previews. Only requested issues are35s vs15s preview and71 vs92 requested BPM. Existing shipped helper fixes verified: composer tempo line reaches numeric bpm before LM; requested bpm restored in synth plan if planner drifts;5Hz codes capped to requested duration; final saved WAV cannot overrun requested duration. Shorter generator output remains shorter (no silent padding or time stretching); numeric BPM conditioning does not establish measured audible BPM. Source helper and built bundled helper hashes match; latest native build already succeeded.

Strengthened regression recreates the exact35.2s/71BPM failure with mocked CLI output, checks92BPM supplied to both LM and synth,75-code/15s cap before synth and exact15s saved WAV despite35.2s fake renderer output. Four tests passed in0.154s. No actual generation, no vocal code changes, no rebuild needed for test-only edits.

## Six-second artifact stem diagnostic — 2026-10-18

User asked next. Separated only original first preview24–30s using installed Mega lead/vocal extractor; no new song generation or full-song separation. Saved exports/singing/original-direction-preview-2026-10-18/issue-27s-stems/{source-24-30s.wav,lead-extracted.wav,backing-extracted.wav,lead-vocal.wav,all-vocals.wav,instruments.wav,diagnostic.json}. PCM listening files share gain0.94935; all6s finite stereo44.1k. Reported artifact at27s = excerpt3s. Separation is estimated and may leak/create artifacts; ask user whether reported squeal is in vocal or instruments before repair. Source remains unchanged; production code unchanged.

Diagnostic initially stalled during librosa import because Numba tried unwritable cache/temp locations under sandbox. Stopped only owned diagnostic python processes, traced the stack, reran successfully with NUMBA_CACHE_DIR set to resolved work/numba-cache. Reuse this cache setting for local audio diagnostics. CUDA extraction itself completed normally after cache fix. No downloads or additional generation.


## Restore first-preview vocal baseline — 2026-10-18

User clarified first35.2s preview was understandable apart from random high-pitched parts near27s; later plain/caption-locked trials worsened intelligibility. User agreed to return to first preview and asked next. Reverted speculative plain-midrange/no-harmonies prompt and use_cot_caption=false; restored original expressive female guide direction and LM enrichment. prepare_render_plan now preserves the planner caption that conditioned its audio codes rather than overwriting caption afterward. Keep independent duration/code cap and explicit BPM fixes. Four focused tests passed, including caption/code consistency. No new audio generated.

Saved mixed-audio STFT summary artifact-27s-analysis.json in original-direction-preview-2026-10-18: high-frequency energy bursts around26–27s, but mixture cannot establish voice vs instrument or exact cause. No claim that artifact is fixed. Existing24–30s excerpt remains diagnostic baseline. Do not switch models or rerun whole songs based on failed multivariable auditions. User original preview remains preferred baseline, with high-pitched sections unapproved.


## Caption-lock audition ready; native build completed — 2026-10-18

User closed Mana. Native cargo build now succeeded; bundled original_song_job.py hash matches source. One actual caption-locked short preview generated in exports/singing/original-caption-locked-preview-2026-10-18, reusing the previous plain-vocal test's prompt, English verse, seed42, requested15s and92BPM; caption lock is the changed condition. Output10.4s stereo48k finite/non-silent. Verified raw planner caption equals original request (lock actually honored), synth caption and supplied lyrics match, renderer BPM92. Actual measured musical tempo/intelligibility are not established by metadata. No full song/Mana conversion. Offer this clip for user vocal-clarity review; prior plain-vocal preview failed as unintelligible. Do not claim audible fix before acceptance.


## Guide-vocal clarity failure and caption-lock fix — 2026-10-18

User rejected the14.64s plain-vocal preview as unintelligible/apparently another language. Intended lyrics and vocal_language were English; do not treat metadata as intelligible-singing evidence. No original vocal has passed quality review. User said "next"; investigated existing files/settings only, no generation.

Found actual conditioning mismatch: saved LM plan rewrote the single-voice caption into layered harmonies/glockenspiel, generated codes for that caption, while our post-plan correction restored the original caption only for synth. Added native use_cot_caption=false in build_request so the installed LM locks caption before code generation (documented in installed docs/ARCHITECTURE.md and implemented pipeline-lm.cpp caption lock). Keep duration/BPM safety and raw planner evidence. Four focused tests pass, including caption-lock reaching the CLI request. Fix addresses a proven instruction mismatch; vocal clarity cause and audible improvement remain unconfirmed until a new user-reviewed test. Do not claim quality fixed or generate multiple candidates.


## Plain guide-vocal control test and generation fixes — 2026-10-18

After user asked "what now?", implemented scripts/original_song_job.py fixes: exact composer Tempo line maps to numeric native bpm; vocal direction defaults to one plain midrange singer without layered harmonies/falsetto/ad-libs. Keep requested caption/supplied lyrics/duration/BPM in synth plan; retain unmodified planner JSON as ace-planner-original.json. Limit5Hz audio codes to floor(duration*5) before synth and cap final WAV as fallback (20ms tail fade only if truncated). This limits preview duration; it does not guarantee a complete cadence or fix singing artifacts. External ACE installation untouched.

Four focused Python tests passed, including mocked end-to-end overlong WAV handling and raw-plan evidence retention. One actual controlled15s preview produced14.64s stereo48k finite/non-silent output with73 codes and renderer bpm92; supplied short verse retained. Saved exports/singing/original-plain-vocal-preview-2026-10-18/{request.json,ace-request.json,ace-planner-original.json,ace-request0.json,result.json,original-song.wav}. Guide singer only; no full song or Mana conversion. This changes multiple conditions, so it is a practical controlled audition rather than proof of which condition caused the earlier squeal. Audible improvement/user acceptance pending; do not regenerate without listening review. Render metadata BPM is not an independent measured-tempo verification.

Native rebuild compiled the code but failed replacing target/debug/mana.exe with Access denied while Mana was open. Do not kill app; finish native build after user closes Mana. No frontend changes/build needed this pass. Prior original fixture at27s remains failed.


## Original guide vocal failed listening review — 2026-10-18

User reports parts of original-direction-preview-2026-10-18 become a high-pitched sound. Treat guide-vocal quality as failed, not approved; do not make a full song or Mana conversion from it. Exact affected timestamps requested, pending. This is ACE-Step guide audio before Seed-VC, so do not alter the accepted Mana conversion/melody pipeline in response.

Read-only inspection: generated planner caption adds layered vocal harmonies and expressive ad-libs; possible contributor, not established cause. Near-full-scale samples only0.0011%, which does not establish broad clipping as the cause. Cannot diagnose exact audible artifact without the affected span. No new generation. Next controlled audition should use a short supplied verse, one plain midrange singer and no harmonies/ad-libs; make no claim this fixes it until user listens.

Duration investigation: LM produced176 audio codes at5Hz, exactly matching35.2s output despite15s metadata. Installed read-only pipeline-lm.cpp allows duration*5+100 tokens; suggests preview code-budget overrun, independent of vocal artifact. Tempo currently exists only in prose (native BPM field unset); installed docs support explicit bpm. These are identified integration issues to address separately before further costly generation.


## First new-direction listening test — 2026-10-18

User authorized one original-song preview. Ran production scripts/original_song_job.py once using the actual composeOriginalPrompt/validateOriginalBrief helpers: cozy hopeful quiet evening; warm/hopeful mood; warm piano, fingerpicked guitar, soft strings; requested92 BPM; verse/chorus structure; gentle-piano style; guide singer; automatic English lyrics; seed42; requested15 seconds. Saved exports/singing/original-direction-preview-2026-10-18/{request.json,ace-request.json,ace-request0.json,result.json,original-song.wav}. Preview-only, not a saved library song; no Mana conversion or full-song job.

Job succeeded; WAV finite/non-silent stereo48k, actual35.2 seconds (requested15). Planner returned71 BPM (requested92) and a much longer lyric/section plan than the request, with daytime/nature lyrics despite the quiet-evening idea. These are concrete prompt-adherence/duration issues; do not mark original prompting complete. No audible quality/user acceptance yet. Offer this existing output for listening; do not regenerate automatically. Next targeted work should investigate planner duration/audio-code length and explicit tempo control in the installed CLI, preserving its read-only installation and keeping short test usage low. No code changes/build required for this generation-only test.


## Original-song prompting controls — 2026-10-18

Cover Builder unified layout is user accepted ("perfect"); user moved back to unfinished original-song prompting. OriginalSongPanel now groups song idea/style/vocals/lyrics, optional musical direction (mood, featured instruments, tempo 40–240 whole BPM or Auto, song structure), and preview/full-song actions. The combined prompt is inspectable and capped at the existing 2000 characters; directions become part of the actual brief.prompt, so native requests, existing metadata/discovery/backups and preview fingerprints retain them without a schema/runtime change. Changing directions invalidates full-song preview matching; title/duration retain existing behavior. Style presets still add their existing palette in the generator. These are musical requests, not guaranteed exact tempo/instrument/section control.

No model jobs/audio generation ran. Existing saved fixtures inspected: original-generator-audition/request00.wav (14.24s instrumental), original-lyrical-production-check/original-song.wav (14.24s guide singer with supplied original lyrics), original-full-production-check/original-song.wav (60s instrumental), all stereo48k. Audio quality and new prompt adherence remain unapproved; offer the two short existing samples first. They predate the new controls and do not validate new-direction audio quality.

Verification: two focused original-song tests passed (request composition/fingerprint invalidation, length/tempo validation, saved prompt retention and prior backup compatibility). Browser mocked callback verified actual composed brief, full-song unlock on matching preview, lock on tempo/vocal changes, invalid-tempo block and lyrics visibility. No live generation invoked. Frontend and native debug builds passed. Screenshot: exports/singing/original-song-prompt-controls-2026-10-18.png. New original-song UI acceptance pending.


## Unified editor toolbar — 2026-10-18

All Cover Builder controls now live inside the music editor. The top project row contains the cover name, New draft and Save cover to library; the next row groups Undo/Redo and Add vocal/instrument/backing voice. Playback groups Play/Stop, cursor time, snap/zoom and master volume. Clip actions stay together, and editor help is collapsed by default. Project setup disclosure and external bottom save/volume bar are removed. Processing status/details and Stop processing are inside the editor. Empty projects retain the same toolbar and an add-track prompt.

Verified in the browser fixture: title edit, Undo/Redo, New draft and undo restoration, empty-state vocal availability, five restored lanes, master volume within editor, no Cover Builder buttons outside editor. Production frontend and native debug builds passed. No audio generation/model jobs. Previous full test result remains 200 passed / 2 optional skipped; not rerun for this reversible layout change. Screenshot: exports/singing/cover-builder-unified-toolbar-2026-10-18.png. User acceptance pending.


## Mixer-only track controls — 2026-10-18

The right inspector is removed. Each lane has source/target instrument dropdowns, Convert, collapsible pitch/extra note hold, Mana voice for vocal tracks, and Restore where applicable on its left header. Convert prepares a candidate; Listen and Use conversion explicitly audition/apply it. Vocal-to-instrument conversion retains the vocal and adds an instrument track. Choosing settings alone does not start processing.

Track tools opens exact clip trimming, naming, offset, source auditions, harmony/backing sections and advanced conversion tools inline below that track, within the same mixer scroll area. Direct full-mix Play, cursor, mute/solo and volume behavior are preserved. No right menu or separate inspector scroll panel remains.

Validation: production frontend and native debug builds passed. Browser fixture verified target selection, inline tools expansion/collapse and absence of the inspector. Existing saved audio was reused; no model/conversion jobs or full-song regeneration ran. Previous full regression result remains 200 passed / 2 optional skipped; not rerun for this layout change. Screenshot: exports/singing/cover-builder-inline-controls-2026-10-18.png. Native build completed; user has not yet accepted this new layout in Mana.


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

## 2026-10-17 — Handoff and verified correction status

Historical build blocker resolved: native build completed successfully on 2026-10-17. Instrument inventory listening subsequently completed; see INSTRUMENT_REVIEW_STATUS.md.

Current handoff: [NEXT_CHAT_HANDOFF.md](NEXT_CHAT_HANDOFF.md). The build and short instrument review are complete; the user has moved to the accepted track-editor workbench. Do not repeat those auditions.


## 2026-10-17 — Cover Builder track editor, first stage

User moved on from completed instrument listening to an Audacity-style arrangement editor. Added shared ruler, cached local waveforms, zoom/snap, pointer/keyboard clip move/trim, exact source trim fields/reset, mute/solo/volume, row reorder and selected-track sound controls. Mix/save/backup retain source-local trims and solo state; backing gates retain their song positions. Pitch/hold still uses existing replacement previews. One clip per track; split/copy/undo and direct audio pitch effects remain future work. Frontend192 passed/2optional skipped, production/native builds passed; browser controls checked. Four user app checks in MUSIC_STUDIO.md remain. No model generation/separation for this work.


## 2026-10-17 — Workbench layout accepted

User accepted the full-width Cover Builder workbench on 2026-10-17 as the layout to keep. Library hidden in Builder; project/title/import controls collapse above the workspace. Fixed toolbar and bottom actions, track viewport with one vertical scrollbar, horizontal scrolling only when zoomed, and a right-hand selected-track inspector with trim and existing sound controls. Inspector scrolls independently when needed. No outer Builder/page scroll. Pitch/hold still uses replacement preview/apply; one clip per track. Frontend production and native debug builds passed; earlier functional suite192 passed/2optional skipped. User confirmed the editor works and approved the final layout; individual four manual checks were not separately reported.

Proposed next work (not yet authorized): undo/redo first, then split/duplicate/move multiple clips per track, followed by short fades at clip edges. Keep current layout and approved instrument behavior. No audio regeneration for layout work.


## 2026-10-17 — Builder Undo/Redo implemented

Added Undo/Redo to the fixed Builder bottom bar, with Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y while focus is outside text-entry controls (text inputs retain native undo). Session history keeps up to50 metadata edits: title/name, movement, trimming, levels/mute/solo/order, track add/remove, new draft, source role, conversion/replacement paths and pending instrument/pitch/hold settings. Continuous same-field changes coalesce until focus or gesture boundaries. New edits discard redo. Opening an externally loaded project resets history; history is not saved in library/backups. Existing saved audio paths are reused; no model work or file deletion on undo. Candidates/previews clear after restoration. Candidate audition controls, preview range/key choices and generated output files themselves are not undone.

Verification:194 frontend tests passed/2 optional skipped. Core tests cover grouped edits, branching, audio-path restoration, pending tuning, track removal/new draft and history bounds. Browser checked trim buttons/shortcuts, removing/restoring a track and pending pitch undo/redo. User app acceptance pending. Four quick checks:1) Move/trim then Undo/Redo.2) Volume/mute and remove/restore a track.3) Pending pitch/hold Undo/Redo without rendering.4) Open another saved project and confirm history starts empty.

Next proposed work: split/duplicate/multiple clips per track, followed by clip-edge fades. Not implemented in this pass.


## 2026-10-17 — Split, duplicate and multiple clips

Builder tracks now support up to32 source-referencing clips on the same lane. Select a clip, place the song cursor inside it, and use Split at cursor (at least50ms from edges). Splitting preserves sample timing; duplicate appends the selected source window after the last clip on that track, then selects the copy. Individual clips move/trim independently; Track offset moves the entire lane. Delete clip removes only its draft metadata. Deleting the last leaves a silent lane; Undo or Restore full track recovers it. Clip overlaps are summed, with existing shared peak protection. Per-clip fades and dragging between tracks are not implemented.

Song position = track offset + clip offset + source position. Legacy single-track trims remain compatible until materialized into clips. Backing-section gates stay source-local and apply to each clip. Mix/save and edited-track previews honor clip placement, and clip arrays survive library save/reopen and backups. Empty/invalid clip collections stay silent rather than restoring full audio. Waveforms/decoded audio reuse the same source path; no new transcription, separation or instrument rendering. Split/duplicate/delete and per-clip edits use existing Undo/Redo.

Verification:196 frontend tests passed/2 optional skipped. Tests verify split output is byte-identical to unsplit mix, duplicated source samples, gaps/moves/trim isolation, backing gates, malformed clips, empty-lane silence and studio library roundtrip. Browser verified split at5s, duplication, independent move/trim, delete/undo and expected21s mix duration. Production/native builds run for this pass; user app checks pending. Four checks:1) Split inside a clip and listen for unchanged timing.2) Duplicate/move/trim the copy.3) Delete it and Undo/Redo.4) Save/reopen and verify all clip positions and original audio remain.

Next proposed work: short clip-edge fades. Not yet implemented.


## 2026-10-17 — Draggable cursor and full-mix transport

The song cursor can now be dragged on the ruler or its vertical line, before or during mix playback. Play from cursor automatically prepares the current full arrangement if needed, seeks to the song cursor and starts playback; a current prepared mix is reused. The same control becomes Pause mix. Time updates retain exact paused/ended position, and a lightweight animation-frame loop follows the actual audio clock for smooth cursor/clock motion and horizontal following when zoomed. The loop updates playhead elements without re-rendering the whole editor every frame. Individual track/concatenated previews remain separate from the full-mix cursor. Dragging/seeking adds no Undo entries and never regenerates instruments. Cursor at/beyond mix end asks for an earlier position rather than restarting at zero.

Browser fixture verified pointer dragging, automatic full-mix preparation/play from about5s, progression of audio/clock/playhead, seeking during playback, pause and cached resume. Frontend/native builds completed for this pass. No new core tests; prior functional suite196 passed/2 optional skipped. Four user checks:1) Drag the ruler/vertical cursor.2) Play from cursor and check the whole mix starts there.3) Drag while playing, then pause/resume.4) Zoom and watch the cursor remain in view. Clip-edge fades remain the next proposed feature.


## 2026-10-17 — Unified mixer playback and optional conversion

Fixed the legacy requirement that disabled Builder mix preview/save until a lead was converted to Mana. Original clean guides, converted vocals and instrumental-only drafts may now preview/save their current arrangement. Conversion is optional and explicit. canMixBuilder respects mute/solo/levels, empty clips, source section gates and audio before song zero; silent drafts show No audible tracks. Instrument-only saves no longer dereference a missing lead, and leave vocal output empty.

The mixer now has the single full-arrangement transport: Play from cursor / Pause mix and Stop (reset to song zero). Preparing the mix is automatic. Removed Prepare mix preview, bottom Preview mix and the separate native player above the timeline. The same underlying audio element is hidden during mix playback; source/instrument/harmony comparisons show a labeled Solo audition player in the right inspector only. Mixer Play can take over from an actively playing solo audition, stopping it and preparing the full arrangement. Playback volume in the footer affects listening, not saved levels. Cursor follows only the full mix.

Verification:197 frontend tests passed/2 optional skipped, including regression for unconverted and instrument-only playback eligibility plus silent/solo/section cases. Browser fixture used converted:false, verified enabled mixer Play/save, actual full-mix playback without conversion, no top player, and takeover from a playing side-panel solo audition. Frontend/native builds passed for this fix. No separation, conversion or instrument regeneration. User checks:1) Play imported original tracks before conversion.2) Seek/pause/Stop from the mixer.3) Compare a source in Solo audition, then return via mixer Play.4) Save/reopen an original or instrumental-only arrangement.


## 2026-10-18 — Direct multitrack editor playback

Replaced Play's offline full-song WAV creation with direct Web Audio scheduling of saved track buffers. Waveforms and live playback share a path-keyed decoded-audio cache. Play resumes the audio context inside the click gesture, then schedules all clips from the song cursor with track/clip offsets and source-local backing gates/fades. Cached replay/seek does not decode again or encode/copy a full mix. WAV rendering is now only for Save cover and explicit comparisons, not Play.

Transport labels are Play / Pause / Stop. Cursor and audio clock remain linked, Stop resets to zero, and seeking reschedules the existing buffers. Mute, Solo and track volume work live (both timeline and inspector where present); master playback volume also works live. M silences a track. S means only tracks with S enabled are heard; multiple solo tracks may play together, mute takes precedence, and disabling all S returns to the normal mix. Toolbar text reports the solo state and tooltips explain it. Loading uses an explicit Loading tracks status, not Stop processing; Stop cancels a pending start and prevents late audio from starting. Structural clip edits remain paused-only. No new model calls or regeneration.

Verification:200 frontend tests passed/2 optional skipped. Added playback-plan tests for offsets/clips/section gates, mock audio-context checks for gesture resume, cached seek and live mute, and pending-start cancellation. Browser fixture used the existing full4:48 recording on five illustrative lanes sharing that saved path; verified Play and clock progression, no HTML mix player or processing job, live M/S, seek, pause/resume and Stop at zero. This full-length fixture validates long-audio transport, not five distinct instrumental stems or subjective sound quality. Frontend/native builds completed for this pass. User acceptance still pending on their project. Four checks:1) Play the imported arrangement directly.2) Toggle M and S while playing.3) Change volume and drag cursor.4) Pause/resume and Stop, then confirm Save remains separate.
