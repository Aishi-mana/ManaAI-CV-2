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

The **Chat song pool** tab preserves the existing 1–30 second approved-clip workflow and fills the Prepared WAV field from the selected project's mix/vocal. Expand **Make a short clip from selected cover**, choose a start and 1–30 second length, then **Extract & load preview**. Extraction copies WAV frames from the finished full mix (vocal if no mix exists), without reconversion or changing the full cover. Play the loaded preview, open **Add an approved short clip**, enter a unique title/aliases, approve and add. Excerpts are saved under `exports/singing/excerpts`; out-of-range selections are rejected. Original arrangements and prompt-generated songs remain future work. High-note distortion and trembling remain deferred and unresolved.

The pool uses compact library-style rows, matching artwork when its audio is linked to a library project. Search matches titles and aliases; aliases expand on demand. Icon buttons enable/disable chat availability, load a preview and remove an entry, with tooltips and accessible labels. The list scrolls independently as it grows. Removal keeps exported audio and chat history.

## Manual acceptance

1. Restart Mana for the native update; open More → Songs. Check the full-size layout and discovered covers. Rename an old cover if needed.
2. Select a song and test mix, vocal and instruments, Play/Pause, seeking, volume, Restart and Stop. Back to chat should pause studio playback without losing the chat draft or selected song.
3. Choose album artwork, rename a project and restart. Check artwork, title and selection persist. Library removal should leave exported files and the chat pool intact.
4. Create a cover, optionally return to chat while it renders, and check it becomes a ready library project. Stop should mark a pending project stopped. Check the Chat song pool tab still adds reviewed short clips and named chat requests still work.

The user confirmed tests 1–4 passed on 2026-10-11. Production build, 166 frontend tests, 57 Rust tests and browser layout checks cover the foundation. The user also approved the compact-pool appearance. Excerpt extraction needs the checks below.

## Excerpt acceptance

1. Restart for the native update. Select a full cover, open Chat song pool and extract a 10-second section from a nonzero start. Play the preview and check the correct part of the song.
2. Give it a unique title, listen, approve and add. Ask Mana to sing that title and check Replay.
3. Try a selection ending beyond the song, or a length over 30 seconds; it should show an error without adding a pool entry.
4. Restart and check the approved clip persists and the full cover still plays at its original length.

## Pool metadata editing

Use the pencil icon on an existing pool entry to edit its title and comma-separated aliases. Save persists the names in existing storage/backups; Cancel discards edits. Names already assigned to other songs are rejected. Audio, approval and enabled state are preserved. Aliases are alternate request names, not separate genre tags.

The user confirmed all excerpt acceptance checks passed. Duration labels now clarify that the second field is clip length rather than ending time. Pool metadata editing awaits manual acceptance.

## 2026-10-11 — Mix balance and WAV export

Finished projects offer Mix balance & export below the player. Vocal/instrument gains preview existing aligned stems without conversion, with shared peak reduction to avoid clipping. Save new mix creates a separate library entry and retains gains in metadata; existing audio and pool clips are preserved. Export copies the saved selected mix/vocal/instrument version to a new WAV filename chosen in the save dialog; existing destinations are rejected. Audio stays external to JSON backups. Mixing needs both saved stems and uses browser decoding, so large songs can take memory/time. Pool metadata editing passed user acceptance.

Manual checks: (1) preview vocal-only and quieter backing, (2) save a new mix and check original and new version after restart, (3) export mix/vocal/instruments and listen externally, (4) cancel export or choose an existing file and check it stays unchanged.

User acceptance: mix balance and WAV export tests 1–4 passed on 2026-10-11, covering stem balance preview, separate saved mixes/restart, WAV exports and cancel/existing-file protection.

## 2026-10-11 — Arrangement audition prototype

Mix/export manual tests 1–4 passed. Prepared a 12-second excerpt at 15 seconds from the saved Whereabout cover for piano and plucked-guitar backing auditions. The offline script estimates triads/beat timing from the saved instrumental and synthesizes instruments; it is not a learned full arrangement or an exact transcription. Mana vocal remains the existing saved conversion. Candidates stay outside the approved pool and library until listening review. Arrangement controls are not yet enabled.

## 2026-10-11 — Piano arrangement controls

User accepted the piano/guitar audition and preferred piano. Finished covers now offer New accompaniment with Piano and Gentle piano, start and 1–60 second duration. Uses the original saved instrument stem to estimate triads and beats, synthesizes piano and combines the existing cropped Mana vocal; no new voice conversion. Gentle piano uses fewer notes, softer filtering and lower backing level. Output is a separate library project with vocal, instrument and mix WAVs, compatible with mixing/export and explicit short-pool review. Existing owned job progress/Stop/cancellation and interrupted-project recovery apply. Original covers and approved pool audio are preserved. Jazz/rock and full-length arrangements are future work; chord estimation is approximate.

Manual acceptance: (1) restart, select a separated cover and render Piano at start 15/duration 12; (2) render Gentle piano and compare; (3) test Stop and invalid/out-of-song selections; (4) restart and check saved arrangements, export or review a short pool clip.

## 2026-10-12 — Arrangement range validation

User confirmed Piano and Gentle piano sound distinct and work. Fixed out-of-range attempts creating failed library entries: validate start/duration against known project length and both actual WAV stem durations before adding a project or launching Python. Show a role-alert message directly under Make arrangement. Native launch rechecks the range before creating its output folder. Existing failed entries remain removable manually. Stop/persistence/export acceptance is not inferred from this feedback.

## 2026-10-12 — Piano arrangements accepted

User confirmed arrangement acceptance tests 1–4 passed after the range-validation fix: Piano/Gentle piano rendering, invalid-range rejection and Stop, saved projects across restart and export/chat-pool workflow. Jazz and rock auditions remain pending; existing high-note distortion and trembling remain deferred.

## 2026-10-12 — Jazz and rock listening auditions

Prepared matching 12-second comparison clips using the saved vocal and prior chord/beat estimates. Jazz adds seventh piano voicings, chord-tone bass and light synthesized percussion; rock adds synthesized distorted power chords, bass and stronger percussion. Vocal timing is unchanged; no swing or new voice conversion. Duration/peak assertions passed. Files remain unapproved audition candidates outside the pool and library; style controls await listening review.

## 2026-10-12 — Sax and electric-guitar candidates

User liked jazz/rock drafts but expected sax and electric guitar. Prepared revised unapproved auditions with a synthetic reed/formant sax lead and plucked-string distortion/cabinet guitar model on the same 12-second comparison. These are synthesized approximations, not recorded instrument samples. Existing vocal and approved arrangements remain unchanged. Await listening feedback before UI integration.

## 2026-10-12 — Jazz and Rock controls

User approved revised sax-led Jazz and electric-guitar Rock auditions. Both styles now appear in New accompaniment beside Piano/Gentle piano. Production rendering uses the approved synthetic reed/formant sax and plucked-string amp/cabinet guitar model with bass/percussion, preserving saved vocal timing. Existing 1–60 second preflight, owned Stop/job lifecycle, separate library save, stems, mix/export and explicit pool approval apply. Arrangement helper is bundled with the desktop app. Manual checks pending: render both styles, reject invalid ranges without adding entries, Stop, and verify restart/export/pool review.

## 2026-10-12 — Arrangement preview and recognition limitation

User passed Jazz/Rock controls but reported an unrecognizable arrangement on Reach Out to the Truth. Current chord/beat estimates omit signature riffs and instrumental melody; recognizability is unresolved. Added Preview arrangement with no library entry, playback and Save this preview (exact files, no rerender). Unsaved preview files remain on disk but are excluded from discovery; preview approval does not add to chat pool. Saved preview metadata uses existing backups. Range validation and Stop apply. Manual checks: preview without song-count change, pause and save the exact preview, invalid-range/Stop, restart and check saved playback. Melody/riff-preserving rendering remains future work.

## 2026-10-12 — Recognition auditions

Preview passed user acceptance. Prepared 12-second Reach Out to the Truth comparisons using its saved vocal: original-backing reference, current rock, estimated prominent instrumental pitch line resynthesized as guitar, and hybrid retaining part of the original backing. Hybrid deliberately retains exact source riffs; it is not complete instrument replacement. Polyphonic melody estimates remain approximate. Duration/peak checks passed; recognizability awaits listening feedback. No production renderer or approved audio replaced.

## 2026-10-12 — Isolated guitar transcription experiment

Ran htdemucs_6s guitar separation and Basic Pitch 0.4.0 ONNX transcription on a 12-second saved Reach Out to the Truth instrumental. Transcription dependencies installed with --no-deps in separate data/transcription-packages; production music runtime not modified. Saved guitar MIDI/note events, original guitar reference, transcribed guitar check and sax replacement. Sax line thins polyphonic events to one voice; original non-guitar instruments are retained, making this an instrument-swap experiment rather than full jazz rearrangement. Listening review pending; no production UI or approved audio replaced.

## 2026-10-12 — Refined sax performance audition

User found isolated-guitar MIDI substitution recognizable but poorly played. Added an offline continuity-based melodic voice selection candidate, replacing first-arriving-note thinning. The candidate retains 18 sustained notes, uses a fixed octave shift into sax register, softer synthetic reed spectrum, smoother attack/release and delayed subtle vibrato. It does not use sampled sax, manually corrected transcription, or beat quantization. Fewer notes may lose riff detail; listening comparison is pending. Original non-guitar backing and Mana vocal stay in the mix. Duration/finite-sample/peak checks passed. Production styles remain unchanged.

## 2026-10-12 — Sample-based sax audition

Downloaded the FluidR3_GM alto-sax note bank from gleitz/midi-js-soundfonts into project data; recorded CC BY 3.0 source/attribution beside assets and exported auditions. Parsed embedded sample data without executing remote JavaScript. Compared prior 18-note melody through sample playback with a 22-note candidate using finer timing and isolated-guitar fundamental support. Both 12-second mixes retain Mana vocal and non-guitar backing; finite/duration/peak checks passed. No claim of corrected ground-truth transcription; listening approval pending. Production styles unchanged.

## 2026-10-12 — Instrument parts review

Added Instrument parts tab. Original combined accompaniment is usable immediately with Mana vocal; Prepare instrument parts creates a separate 1–60 second review project using six-stem Demucs. Estimated guitar/piano/bass/drums and residual Other/mixed rows offer playback, gain and mute. Their sum retains the saved accompaniment (residual includes unassigned/leaked material). Style recommendations sit beside Keep original replacement selectors; unapproved substitutions are disabled. Preview/save mixes use aligned stems and clipping protection; safe stem metadata persists with existing project backups. Original exports/pool clips remain intact. Manual checks: combined original mix; prepare and audition parts; mute/gain preview/save; restart/export and invalid range/Stop.

## 2026-10-12 — Checked-part preview and review refresh

User passed stem-review checks and noted piano-like material in Other; labels remain separator estimates, not instrument identification. Changed instrument mute checkboxes to Include in mix, added vocal inclusion, Preview checked and Preview all (all parts/vocal at current levels). Save uses checked parts and preserves selections via muted metadata. Review state now synchronizes on project readiness/media/settings changes, fixing stale rows when a project becomes ready or a saved mix is selected without switching tabs. Manual check pending for checked/all preview and immediate saved review refresh.

## 2026-10-12 — Experimental guitar-to-sax preview

Checked/all preview and review refresh passed user acceptance. Prepared projects now offer Guitar replacement → Sax (experimental). Preview transcribes the isolated guitar with project-local Basic Pitch ONNX, selects a continuous line, then renders attributed FluidR3_GM alto-sax samples. Original remaining stems and cropped Mana vocal are retained. This is a timbre-swap experiment, not a full jazz arrangement; uneven transcription remains unresolved. Current review checkbox/gain edits are separate from replacement preview. Save replacement preview retains exact files without regeneration; preview-only jobs do not appear in discovery. Native validates all input stem paths/durations before launch. Output carries instrument attribution. Requires existing data/transcription-packages and data/instrument-samples assets; no runtime install/download from UI. Production smoke verified 12s, safe peaks and unchanged non-guitar stems. Manual checks: preview/no new entry, Stop, save/restart/remaining stem playback, original selection still works.

## 2026-10-12 — Bundled replacement data-path fix

Desktop replacement failed with missing basic_pitch despite installed project-local dependencies. Python derived data paths from its script location, which changes when bundled. Native arrangement requests now pass explicit project data_root; replacement and separation cache lookup use it. Missing setup errors identify the actual folder. Regression copied scripts into a relocated resources directory and rendered a 12-second sax mix using the project data folder successfully; 59 native tests passed. Desktop replacement acceptance remains pending.

## 2026-10-12 — Solo replacement audition

User confirmed bundled dependency fix but expected isolated sax when previewing replacement. Preview sax only now loads the generated sax stem; Preview replacement mix separately loads the complete mix. Cached preview files are reused, with no regeneration or added library entry. Fixed explicit stem playback being intercepted by an existing arrangement preview. Saving still keeps the complete replacement project. Manual solo/full listening acceptance pending.

## 2026-10-12 — Unified replacement dropdown previews

User requested dropdown-driven playback instead of extra replacement buttons. Guitar → Sax now feeds row Preview, Preview checked, Preview all and Save mix. The first audible sax use generates/cache-resolves the replacement without adding a library entry; subsequent previews reuse it. Keep original returns to the original guitar path. Checked-part exclusions and current gains apply; Preview all includes all dropdown-selected parts. Removed separate sax/full/save-replacement controls. Save mix retains selected sax stem metadata alongside the complete mix, while the original project stays intact. Transcription quality remains experimental. Manual check: dropdown toggle changes checked/all/solo preview, excluded guitar does not play, saved mix/restart uses sax, Stop suppresses late playback.


### Guitar replacement options — 2026-10-12

Added sampled Piano and clean Electric guitar alongside Sax in the guitar replacement dropdown. All use the shared row Preview, Preview checked/all, and Save mix controls. The existing guitar melody transcription is retained; piano and electric guitar retain its register, while sax keeps its existing octave placement. These are experimental melody replacements, not full chord/strumming reconstruction. Existing vocal and other stems remain unchanged. Guitar-to-piano has a separate replacement-piano label and file to preserve an existing piano stem. Replacement paths and labels survive library backup validation. FluidR3_GM note-bank attribution is included with exports.

Validation: production build; frontend tests; 59 native tests; five-second real piano and electric-guitar renders with finite, audible, peak-bounded audio and unchanged other stems.

Manual checks after restarting Mana: choose Piano then row Preview; choose Electric guitar then Preview checked/all; Keep original returns to guitar; Save mix and reopen confirm the chosen replacement and original piano part remain.


### Replacement phrasing refinement — 2026-10-12

Refined Sax, Piano and Electric guitar playback: instrument-specific attacks/releases, ringing piano/guitar tails, softer sax phrase starts and shorter connected attacks, and crossfaded sax sustain extension when a note outlasts its sample. Conservatively repairs short low-confidence pitch detours surrounded by the same note, while retaining strong short notes and real rests. No rhythmic grid quantization or random timing changes. MIDI now exports the performed melody and register rather than the raw polyphonic transcription.

Generated matched-level 12-second before/after solo and full-mix auditions in exports/singing/phrasing-comparison. Real section retained 20 notes in both versions; improvements here concern articulation, not proven pitch-detection accuracy. Regression checks cover weak versus strong detours, preserved rests, release tails, finite exact-length audio and unchanged other stems. Listening approval remains pending. Existing saved mixes are unchanged; restart Mana to use the updated bundled renderer for new previews. Single-line transcription still cannot reconstruct full original guitar chord/strumming performance.


### Source-supported gap repair and guitar tone audition — 2026-10-12

Short detected rests (25–240 ms) now extend the preceding note only when its frequency band and RMS remain supported inside the gap relative to the source note's ending. Does not quantize note onsets or fill long rests. Sustained-tone/silent-gap/long-rest regression checks passed. The 12-second Reach Out comparison bridged eight source-supported gaps; this does not establish correctness of all transcription notes.

Generated matched-level solo and full-mix comparisons in exports/singing/gap-tone-comparison, including clean versus sampled distorted electric guitar. Distorted guitar is audition-only via the renderer tone argument; the UI/default clean guitar is unchanged pending listening approval. Existing saved mixes remain unchanged. Source: FluidR3_GM distortion_guitar-mp3.js, same CC BY 3.0 attribution as other banks.


### Live HQ Natural V3.0 single-bank audition — 2026-10-12

User supplied data/instrument-samples/LiveHQNatural/Live HQ Natural SoundFont GM.sf2 (945,937,616 bytes). README and embedded metadata identify V3.0, UnderxPipe1985, engineering credit Pipe Nacho, and source Musical Artifacts artifact 1176. User reports CC BY 4.0 from listing; README/embedded metadata have no explicit license. Retained attribution, copyright, source, license provenance and audition modifications; underlying keyboard/Zenology sample permissions not independently verified.

Installed official portable FluidSynth 2.6.1 Windows x64 runtime under data/fluidsynth/runtime for local auditions, without changing the production instrument renderer. Parsed 186 presets. Successfully rendered matched-level 12-second Concert Grand (GM 0), Alto Sax (65), Strat Clean Guitar (27), and Distortion Guitar (30), zero-based program numbers. All four use the same gap-repaired transcription and no added chorus/reverb for fair tone comparison. Solo/full mix files and bank-info.json are under exports/singing/livehq-audition. Existing source stems, app defaults and saved projects unchanged. Listening approval pending before integration.


### Live HQ trial integration and separate guitar tones — 2026-10-12

Instrument parts now offers an Instrument bank selector: Live HQ Natural (trial, initial selection) and FluidR3 (previous sounds). Guitar replacements include Sax, Piano, Clean electric guitar and Distorted electric guitar. The bank affects replacements only, never Keep original or existing chord-based New accompaniment. Row Preview, Preview checked/all and Save mix share the selection. Cache keys include bank and guitar tone to prevent stale comparison playback. Saved mixes retain actual rendered WAV paths and distinct electric-guitar-distorted labels through library/backup validation.

Live HQ uses in-process FluidSynth 2.6.1 via the portable DLL in data/fluidsynth/runtime, with no audio-device driver or detached subprocess. Owned-job Stop also terminates the renderer; soundfont and DLL are local dependencies, not embedded in the app. Missing dependencies show an error rather than silently playing another bank. Rendered replacements use bank-specific attribution files. Existing projects and pool clips remain unchanged.

Validation: production build; 59 native tests; frontend suite and metadata roundtrip test; real five-second production renders for all four Live HQ presets plus FluidR3 distorted guitar, with bounded finite audio, attribution present and unchanged other stems.

Manual checks after restarting: (1) Live HQ Piano/Sax row Preview, (2) Clean versus Distorted guitar Preview checked/all, (3) switch FluidR3/Live HQ and Keep original, (4) Save mix/reopen retains rendered tone, and Stop prevents late playback. Trial listening approval pending.


### Separate-library listening comparison — 2026-10-12

Located user's AccurateSalamander, BlackAndGreenGuitars, and nested Weresax/Weresax downloads. Installed official portable sfizz 1.2.3 Windows x64 under data/sfizz/runtime for auditions only. Rendered Accurate-Salamander recommended DAW flat piano, Weresax Sax.sfz, and Green twang guitar with identical MIDI to the Live HQ comparison. Added a driven/filtered guitar audition from the clean Karoryfer performance, not a separately recorded distorted patch.

All three SFZ jobs completed without renderer errors; audio verified finite and audible, trimmed to 12 seconds and matched to the same source guitar RMS with peak protection. Solo and original-minus-guitar replacement mixes, logs, render-info.json and instrument attribution are saved in exports/singing/separate-library-audition. Included licenses: Accurate-Salamander/Salamander CC BY 3.0; Karoryfer guitar and Weresax CC0. Production dropdown/defaults remain unchanged pending listening decision.


### Separate libraries added alongside retained banks — 2026-10-12

User approved the separate-library auditions. Added Separate libraries as the initial replacement bank choice, retaining Live HQ Natural and FluidR3 for comparison until final selection. Uses Accurate-Salamander recommended DAW flat piano, Weresax Sax.sfz and Karoryfer Green twang guitar. Distorted guitar applies the approved drive/filter processing to that guitar performance. Keep original bypasses replacements. Existing shared preview/checkbox/volume/save behavior and bank-aware cache keys apply.

Production SFZ rendering uses the local sfizz DLL in-process with offline sample streaming enabled, sample-accurate event offsets and 512-frame blocks. It does not launch a detached executable or install an audio driver. The downloaded libraries, runtimes and older bank files are all retained. Original saved projects remain unchanged; saved new mixes retain actual rendered audio paths.

Verification: build passed, 169 frontend tests passed (2 optional skipped), 59 native tests passed, all four real separate-bank production renders passed finite/audio-duration/peak checks, attribution copied and other stems unchanged. Manual checks after restart: separate-bank Piano/Sax previews; Clean/Distorted guitar; switch back to Live HQ/FluidR3 and Keep original; save/reopen and Stop.


### Melody selector comparison — 2026-10-12

Started melody fidelity work after separate-bank approval. Source analysis shows polyphonic guitar/chord candidates; independent pYIN tracking was mostly uncertain, so no pYIN corrections were forced. New selector discounts a lower octave only when a competing upper-octave candidate has sufficient detector confidence and direct spectral support, and increases pitch-transition penalties. Restored repeated pick attacks only where source onset detection and a same-pitch detector event agree. Does not quantize timing or invent notes in silent gaps.

Generated original guitar, before/after Karoryfer clean-guitar solos, and full mixes in exports/singing/melody-comparison. Current candidate has 28 articulated notes versus 20 previously; octave transition count increased from 2 to 5, so this is a listening candidate, not a verified melody correction. Synthetic checks preserve a clearly supported low note and silence while preferring a well-supported competing upper octave. Samples/voice/bank choices unchanged. Listening approval required to judge whether candidate improves melody fidelity; original implementation snapshot retained in data/arrangement_replacement_before_melody.py.

The melody candidate is retained in data/arrangement_replacement_melody_candidate.py for audition. Restored the approved production selector while listening is pending, because additional octave jumps make automatic replacement premature.


### Melody candidate v2 — 2026-10-12

User found first candidate better, requested further improvement. Kept production unchanged and refined audition module data/arrangement_replacement_melody_v2.py: raises competing upper-note confidence threshold and tracks detector event age so a fresh stronger lower pick is not overridden by an older upper sustain. Source-confirmed repeated attacks remain.

Matched 12-second Karoryfer comparison in exports/singing/melody-v2-comparison: previous candidate 28 articulated notes/5 large pitch transitions, v2 27 notes/2 large transitions. Finite audible exact-length renders and synthetic checks for fresh pick, supported upper octave, weak competing upper candidate, real low notes and silence passed. Fewer large jumps is diagnostic, not proof of correct transcription; listening approval pending. Approved production renderer and all instrument banks retained.


### Melody timing candidate v3 — 2026-10-12

Built on user-preferred v2 for another listening comparison; production remains unchanged. Aligns attacks by at most 45 ms only where source onset detection and a same-pitch detector event agree. Updates contiguous shared boundaries without reordering notes or removing real pauses. Conservative weak-detour repair requires a <=100 ms low-confidence note between matching neighbours plus weak source energy; strong short notes and rapid runs remain.

Matched 12-second Karoryfer solo/full mixes in exports/singing/melody-v3-comparison. Both baseline and v3 retain 27 notes and two large pitch transitions; seven attack times adjusted, with corresponding contiguous note lengths updated. Weak-detour filter changed none on this section. Finite audible exact-duration rendering and synthetic source-only/order/rest/fast-note/weak-versus-strong checks passed. Listening approval pending; v2 retained as baseline and all original sources/banks intact.


### Approved melody/timing pass wired into app — 2026-10-12

User requested in-app listening with all replacement instruments. Promoted data/arrangement_replacement_melody_v3.py into scripts/arrangement_replacement.py. Shared transcription now includes v2 octave competition/event freshness, source-confirmed repeated attacks and v3 bounded source alignment/conservative weak-detour filtering for Sax, Piano, Clean guitar and Distorted guitar across all banks. Existing vocal and non-replaced stems remain untouched. Preview checked/all renders the complete prepared-section mix; replacement sections retain their existing 1–60 second limit, not full-song processing. Saved old mixes remain unchanged; restart/repreview generates the updated selection.

All four Separate libraries production render checks passed: finite audible exact duration, peak bounded, attribution copied and unchanged other stems. Native tests/resource refresh passed. Manual checks: four instrument previews, full mix via Preview all, Keep original, Save mix/reopen.


### Source-supported riff tail extension — 2026-10-12

User reported hard stops compared with original riff endings. Shared replacement transcription now follows source energy at the detected pitch for up to 400 ms beyond detector note-off, bounded by the next attack and excerpt end. Ends at loss of pitch-band/RMS support rather than stretching across true silence. Applies to all replacement sounds/banks; samples and source attacks/pitches unchanged.

Matched comparison in exports/singing/riff-tail-comparison: three note tails extended, retaining 27 notes, two large pitch transitions and unchanged attacks. Added synthetic sustained-tail/silence/next-attack/input-preservation checks. Listening comparison pending; updates affect new previews/saved mixes only. Clip boundary still limits tails, so this does not add audio beyond the selected section.


### Guitar release-envelope listening candidate — 2026-10-12

User still hears hard stops after source-tail extension. Inspected Karoryfer Green twang mapping: main picked-note ampeg_release is 0.25 s. Prepared a candidate with 0.65 s main release using in-memory sfizz SFZ loading at original patch path (relative includes preserved). Release-noise and inactive feedback settings unchanged; source library files untouched. Production stays on current approved pipeline while auditioning.

Matched comparison in exports/singing/release-envelope-comparison keeps all 27 notes, note lengths/attack times and pitches identical. Finite exact-length audio and differing release waveform verified. This isolates sample release rather than further pitch edits. Fading ringing can continue into a pause, but no new picked notes or sustained holds are inserted. Selected section boundary still limits tails. Candidate is data/arrangement_replacement_release_candidate.py; listening approval pending.


### Release comparison on requested 9–19s passage — 2026-10-12

User requested the heavier 9–19-second passage rather than the earlier 12-second comparison. Located existing 19-second Reach Out prepared stems in arrangement-1791744247383209600, verified request source points to 1791717415984. Rendered full 19-second current and 0.65-second release candidate with Karoryfer distorted guitar, then cropped 9–19 seconds so ringing from preceding notes is retained. Same 48 notes/pitches/attacks in both releases. Original accompaniment with Mana vocal also supplied for comparison. Finite exact-duration audio verified; trimmed one padding frame from source stems. Files in exports/singing/release-19s-comparison; production unchanged pending listening.


### Guitar-only release pass 2 — 2026-10-12

User preferred longer release but requested the next pass without mix, focused on original 9–19s. Prepared data/arrangement_replacement_release_v2.py with 0.9-second main picked-note release and up to 30 ms held-note overlap at connected different-pitch picks. No overlap across real rests (>25 ms) or same-pitch retriggers; source pitch and attack sequence remain unchanged. No reverb, vocal or other instruments in auditions.

Guitar-only full 19-second and extracted 9–19s baseline/candidate WAVs are in exports/singing/release-solo-pass2. Both have 48 notes; 31 connected handoffs changed their end time. Verified unchanged pitches/attacks, finite exact-duration peak-bounded audio, and synthetic real-rest/same-pitch/input-preservation cases. Original separated guitar included for reference. Production remains unchanged while listening; previous 0.65-second candidate retained.


### Dry overlapping-note guitar audition — 2026-10-12

User requested polyphonic test and assessment of crossfades/fades/reverb/delay/sidechain suggestions. Kept 0.65-second picked-note release as listening baseline; no production changes. Generated original guitar, single-line baseline and overlapping-note Karoryfer distorted guitar-only 9–19s excerpts, cropping complete 19s renders. Same preset/release/gain target, no vocal/backing/reverb/delay.

Experimental polyphonic path retains raw Basic Pitch events >=90 ms and confidence >=0.4, prevents overlapping same-pitch note-offs, and caps concurrent candidates at six. 102 overlapping candidates versus 48 single-line notes. These may include harmonic/chord detection errors; retained candidates are not proven notes/physical fingering. Finite exact-duration audio and same-pitch/order/voice-count bounds checked. Files and note lists in exports/singing/polyphonic-guitar-comparison; script data/polyphonic_guitar_audition.py.

DAW suggestions assessed: small fades/crossfades help discontinuities and joins, but cannot reconstruct missing riffs. Reverb/delay can mask rests and are optional later polish, while sidechain changes the balance against backing and cannot fix a guitar-only transcription. Evaluating dry overlap first. Sources: iZotope Vocal Editing 101 and Ableton Live Audio Effect Reference. Listening approval pending.


### Direct riff-tail envelope comparison — 2026-10-12

User rejected polyphonic guitar and requested extend-then-fade on single melody. Compared original prepared guitar and matched single-line 0.65s-release output using local pre/post note RMS. Source still carries energy at multiple phrase ends while generated energy falls earlier. Generated dry audition extends only source-supported phrase gaps by continuing a captured ending-note cycle with continuous boundaries, smooth fade-in and cosine fade-out. No extra pitches, vocal/backing or reverb; artificial continuation can alter texture and requires listening review.

Treated ten endings over complete 19s, including eight in requested 9–19s passage. Each continuation ends before next source attack, within 450ms and within excerpt. Output finite, exact duration and peak-protected. Original, baseline and candidate guitar-only 19s/9–19s WAVs plus tail-report.json are in exports/singing/riff-extend-fade-comparison. Production unchanged; polyphonic and 0.9s release candidates rejected as listening defaults.


### Melody-preserving source-supported overlap audition — 2026-10-12

User identified likely original riff overlap versus generated serial handoff. Previous post-gap extrapolated fade was not helpful. Kept preferred single-line pitches/onsets and 0.65-second release, extending held notes underneath later attacks only when the source still supports the previous pitch. Bound 220ms beyond next attack, avoid real rests and same-pitch retriggers, cap at the next occurrence of the same pitch. Does not restore extra raw chord candidates or add effects.

48 original melody notes retained; 21 held endings overlapped across later attacks in the full 19s diagnostic. Guitar-only before/after 9–19s and full19s files are in exports/singing/riff-overlap-comparison; data/arrangement_replacement_riff_overlap.py is audition only. Finite exact-duration peak-protected audio, unchanged pitches/attacks, synthetic source-support/silence/rest/retrigger checks passed. Spectral support remains heuristic, not verified source fingering. Production unchanged pending listening.


### Source-supported overlap accepted as next candidate — 2026-10-12

User heard an improvement and approved the melody-preserving source-supported overlap version as the next candidate. Current listening baseline: data/arrangement_replacement_riff_overlap.py, with 0.65-second main guitar release, preferred single-line melody, and source-supported note carry beneath later attacks. Reference audio: exports/singing/riff-overlap-comparison/next-9-to-19-solo.wav. Preserve earlier candidates for comparison. Production renderer remains unchanged; candidate acceptance is recorded without implying in-app deployment or final approval of instrument reconstruction.


### Accepted overlap candidate with Mana and backing — 2026-10-12

User requested full-mix audition before app integration. Mixed accepted overlapping melody and previous baseline with identical original-minus-guitar backing at 30% and Mana vocal at 100%, then peak protected. Full 19s and cropped 9–19s WAVs stored in exports/singing/riff-overlap-fullmix, with attribution copied. Exact duration, sample-rate agreement, finite audio and peak checks passed. No new transcription or changes to sources/production renderer. Full-mix listening approval pending.


### Approved guitar overlap promoted to the app — 2026-10-12

User passed the full-mix audition. Promoted data/arrangement_replacement_riff_overlap.py to scripts/arrangement_replacement.py. Clean and distorted guitar now retain the preferred melody and attacks while source-supported endings ring beneath later attacks, bounded to 220ms and avoiding real rests and same-pitch retriggers. Separate Libraries uses the approved 0.65-second main guitar release through an in-memory SFZ adjustment; downloaded samples remain unchanged. Sax and piano retain the existing melody and timing path. All three instrument banks and previous auditions are retained.

All four Separate Libraries production replacement smoke checks passed (finite audible output, duration, peak bounds, attribution and unchanged other stems), and 59 Rust tests passed with bundled resources refreshed. Restart Mana and generate a new replacement preview to use this renderer; previously saved mixes stay unchanged. Replacement excerpts remain limited to 1–60 seconds. Reconstruction remains a candidate with heuristic source support, not exact recovery of the original performance.


### Independent melodic-part replacements — 2026-10-12

Added independent replacement dropdowns for piano, bass and Other/mixed beside guitar. Each can use sampled sax, piano, clean guitar or distorted guitar from any retained bank. Row Preview renders only that part; Preview checked/all and Save mix resolve every selected audible replacement sequentially. Cache keys include source name/path, project, target, range and bank; up to 50 generated previews are retained in memory. Saved mixes keep distinct source-row identities so two parts using the same target are not merged or dropped. Keep original bypasses reconstruction. Source selection is validated in Rust and Python, and rendering excludes exactly the selected source while keeping all other stems.

Uses the current melody reconstruction rather than full chord/instrument recovery. Other/mixed can lose chords or contain separation leakage; bass can move into the selected instrument range. Drums remain original because replacement needs rhythm/percussion detection. Existing guitar candidate and all banks retained; no further guitar tuning in this pass. Replacement previews remain 1–60 seconds.

Validation: frontend build passed; 169 frontend tests passed with two optional checks skipped; 59 Rust tests passed and bundled scripts refreshed. Real 3-second piano, bass and Other/mixed to sax jobs passed duration, finite audible output, peak bounds, source exclusion and unchanged-other-stem checks. Manual simultaneous replacement, save/reopen and listening checks remain for the user.


### Additional sampled instruments and drum-kit replacement — 2026-10-12

User passed independent melodic-part checks and requested drums plus more instruments. Added Live HQ steel and nylon acoustic guitars, finger and acoustic bass, violin, string ensemble, flute and harp to melodic replacement dropdowns. These explicitly use existing Live HQ presets regardless of the selected three-bank comparison choice; piano, sax and electric guitars retain their bank behavior. Bass-source detection permits lower notes, with fixed register placement for bass targets. No new downloads or sample-library changes.

Drums now have Keep original plus Standard, Rock/Power, Jazz, Brush and Electronic kit choices. Separate rhythm path estimates source-timed independent low/mid/high band attacks (kick/snare/closed-hat MIDI candidates) and renders the chosen bank-128 kit on percussion channel 10. It does not quantize onto a new beat grid, and retains simultaneous band candidates. This is approximate hit classification, not complete recovery of tom fills, open hats, cymbals or playing technique. Drum-kit/melodic-source mismatches are rejected in Rust and Python.

Row Preview, Preview checked/all and Save mix use the selected kit/instrument through the same sequential cache/mix flow. Keep original retains recorded drums; source-row identities and other stems remain intact. Excerpts remain 1–60 seconds. Guitar tuning is deferred per user request.

Validation: all eight added melodic presets and five drum kits rendered audible finite peak-bounded 3-second production audio with correct source exclusion, unchanged other stems and attribution. Drum kit output distinction, silence rejection, synthetic simultaneous kick/cymbal detection, and drums-first fresh-process dependency loading passed. Final frontend build and 59 Rust tests passed; frontend suite passed 169 checks with two optional checks skipped. In-app listening/save checks remain for the user.


### Synths, keyboards, harmonica and ocarina; finer extraction direction — 2026-10-12

User passed the new drum/instrument checks and requested synths, keyboards, harmonica, ocarina and more original instrument extraction. Added twelve existing Live HQ presets: Rhodes electric piano, FM electric piano, church organ, accordion, harpsichord, clavinet, harmonica, ocarina, square synth lead, saw synth lead, warm synth pad and polysynth. All work through existing per-part preview/cache/mix/save controls. No new downloads, sample edits or changes to approved drum/guitar reconstruction.

User chose strings and wind instruments as the priority for finer source extraction. Current htdemucs_6s has fixed vocal/drums/bass/other/guitar/piano outputs; additional replacement tones do not create new isolated source stems. Official Demucs documentation confirms the fixed six-source model and notes piano bleed/artifacts: https://github.com/facebookresearch/demucs . AudioSep is a candidate for text-guided musical instrument separation with CPU/CUDA and chunked inference support: https://github.com/Audio-AGI/AudioSep . It needs its own runtime/checkpoints and an audition; it is not installed or wired in this pass.

Next extraction experiment: isolate strings and selected winds on a short original-accompaniment excerpt, compare against current Other/mixed, and audition each estimate plus residual. If acceptable, add an optional finer-extraction workflow with target selection, cancellation/progress, solo previews and approval before adding estimated parts. Preserve source timing and duration; subtract accepted aligned estimates from the source residual to avoid double-counting, and retain a remainder stem so the complete unedited mix reconstructs the source. Sequential extraction from the remaining audio may reduce overlap but can accumulate errors. Label estimates honestly; do not infer definite instrument presence from a nonzero output, promise perfect separation, or automatically run it for every cover. No finer source extraction has been added yet.

Validation: all twelve presets passed real 3-second production audio checks for duration, finite audible output, peak bounds, attribution, correct source exclusion and unchanged other stems; electric piano/FM and square/saw outputs differ. Frontend build and 59 Rust tests passed, bundled scripts refreshed. Manual in-app listening remains for the user.


### Sample-source labels and additional installed SFZ variants — 2026-10-12

Replaced experimental-transcription suffixes on sax, piano, clean guitar and distorted guitar options with the actual selected bank: Weresax / Accurate-Salamander / Karoryfer when Separate Libraries is selected, or Live HQ / FluidR3 when those comparison banks are selected. Reconstruction limitations remain in the explanatory text.

Inspected installed READMEs and top-level SFZ patches. Added Weresax sxnth synthesizer and saxcordion (accordion-like sound made from sax samples), Karoryfer black-guitar and combined black/green-guitar twang patches, and Accurate-Salamander treble +2.5dB and bass +1.5dB variants. These are variations of the installed sax/guitar/grand-piano samples, not new isolated-source families. Named variants always load their stated separate library even if the comparison bank changes. Existing approved sax, piano and green-guitar defaults and downloaded files stay intact. Other guitar articulation/key-switch files and Salamander live/minimum configurations are not treated as additional instrument families.

Validation: six variants passed production renders using the same 3-second source melody, with finite audible duration/peak-bounded output, source exclusion, unchanged other stems and attribution. Each pair produced distinct audio. Frontend build and 59 Rust tests passed; bundled scripts refreshed. User listening and source-label switching checks remain.


### Strings and winds separator prototype connected — 2026-10-12

Installed official AudioSep source under data/AudioSep, retained MIT/CLAP notices, and downloaded the official AudioSep and CLAP checkpoints (about 3.6GB total), verifying both against official LFS SHA256 hashes. Additional dependencies are isolated in data/audiosep-packages. Existing music-tools PyTorch 2.7.0 CUDA 12.8 works on the RTX 5070 laptop GPU. Tokenizer/configuration files are cached in data/audiosep-model-cache; app jobs use offline cache and never upload audio. Official implementation/source: https://github.com/Audio-AGI/AudioSep .

Added scripts/fine_separator.py using upstream ResUNet30 and a strict-loaded text-only CLAP Roberta pooler/projection/normalization path. Ignores only the older checkpoint's obsolete position-ID buffer for Transformers compatibility. Five-second overlapping inference windows cover short inputs and tails. Queries are string-instrument family and wind-instrument family, applied sequentially to remaining source audio. FLOAT WAV output retains signed residual without clipping. This estimates requested sounds; audible output does not prove that an instrument is present, and leakage or musical artifacts remain possible.

Music Studio → Review instrument parts → Separate strings & winds accepts a 1–30 second excerpt and saves a separate library entry. Uses Other/mixed when prepared parts exist, otherwise original accompaniment. Adds Strings (estimated), Winds (estimated) and Other/mixed remainder; existing guitar/piano/bass/drums stay intact. Estimated parts support the same original/replacement dropdowns, solo/checked/all preview, volume/mute and save-mix flow. Repeating extraction retains prior estimates while further splitting the remaining Other part. Stem labels and levels persist through backup validation. Original covers stay intact. Standard owned singing-job cancellation and progress are reused; invalid duration is blocked before creating a project/job.

Validation: 10-second Whereabout accompaniment audition produced finite aligned strings, winds and remainder files in exports/singing/strings-winds-audition, with source reconstruction error below 1e-5. Production 3-second prepared-parts job passed seven-part alignment, exact source-part sum within 1e-5, unchanged guitar/piano/bass/drums and peak-protected mix checks. Frontend suite passed 169 checks (two optional skipped), plus the new finer-part backup/path test; 59 Rust tests and final build passed, bundled scripts refreshed. User listening, in-app extraction/replacement/save and Stop checks remain.


### Strings/winds listening failed; extraction demoted to audition — 2026-10-12

User tested Reach Out to the Truth and Whereabout of the Stars and reported quiet noise rather than recognizable strings/winds. Earlier file-integrity, alignment and exact-sum checks did not establish instrument separation quality. This supersedes the earlier prototype's listening-readiness implication. Original covers and user-saved outputs are preserved.

Checked standalone CLAP versus separator-checkpoint text projection/embedding weights: exact matches, so no observed encoder-weight mismatch. Known isolated violin/flute samples are nearly reconstructed, but that is a trivial one-source test. Specific piano/harp/violin/flute prompts on the same Whereabout excerpt return highly similar source-correlated outputs, providing no reliable instrument identity. A known simultaneous violin/flute mixture with distinct timing showed SI-SDR improvement of -0.116dB for violin and +0.102dB for flute: essentially no separation improvement for this test. Reports/audio are in exports/singing/separator-query-comparison and exports/singing/separator-mixture-check. These tests do not prove general model failure, but do not support useful strings/winds extraction in Mana yet.

Changed Music Studio finer extraction to an experimental audition. It creates preview-only outputs, provides separate strings/winds/remainder audition buttons, and requires an explicit Keep this audition in library action. It no longer automatically inserts a new library project on extraction success. Library cap checked before saving; changing the selected project or generating another preview clears the audition. Clear text warns about leakage/noise and unconfirmed instrument presence. Existing files, covers, voices, replacements and standard part separation remain available. Frontend build passed.

Next quality work must compare a more suitable separator or model on controlled mixtures plus real audible instrument sections, and obtain listening approval before treating finer source extraction as usable. Numerical file checks or louder normalization must not substitute for recognizable separated audio.

### Banquet separator candidate prepared — 2026-10-12

Prepared an offline Banquet/query-bandit audition using the official MIT source and recommended ev-pre-aug checkpoint from Zenodo record 13694558. Audio queries use our violin/flute samples; tests compare a known overlapping mixture against its true sources and audition a ten-second Whereabout accompaniment section at 80 seconds. Runner: data/banquet_audition.py; outputs: exports/singing/banquet-separator-audition. Strict checkpoint loading, official size/MD5 validation, finite aligned output and controlled SI-SDR reporting are required. Dependencies are isolated; current app behavior and saved library remain unchanged.

Official download attempts failed with gateway/time-out and certificate errors; TLS verification was retained. User is downloading the checkpoint manually and will notify when placed in data/query-bandit/checkpoints. No Banquet audio or quality result is available yet. Test and listening review must precede integration. SAM Audio was also considered, but official gated checkpoints require access not available in this session.

### Banquet verified and auditioned; quality gate not passed — 2026-10-12

User supplied the official ev-pre-aug.ckpt. Exact size and official MD5 matched; strict model loading passed, including all PaSST query-encoder weights. Local GPU inference completed for the controlled violin/flute mixture and Whereabout accompaniment at 80–90 seconds. Tested both raw tiled sample queries and trimmed/RMS-normalized queries.

Controlled SI-SDR improvement: raw violin +1.279dB; raw flute -8.045dB. Trimmed normalized queries: violin -0.859dB, flute -6.265dB. Flute outputs were nearly silent. Query preparation did not resolve the separation problem. Banquet is not ready for app integration with these references; these narrow synthetic-reference results do not establish general model failure. Real-song outputs are auditions, not confirmed instrument stems. Output report and audio: exports/singing/banquet-separator-audition. Listening copies apply level adjustment only, explicitly distinguished from raw results. Current app remains unchanged and finer extraction remains audition-only. Next investigation should use representative real instrument queries or an alternate separator before accepting strings/winds extraction.

### Recorded sax/piano controlled audition — 2026-10-12

Prepared a 10-second known mixture from recorded Weresax alto and Accurate-Salamander piano notes, retaining separate truth tracks and using separate query phrases. This is a sample-based controlled test, not a live performance or strings test. Banquet strict checkpoint loading passed. Piano SI-SDR improvement +7.376dB; sax -21.192dB with very weak output. This demonstrates useful piano selection in this case but does not support wind separation with the tested query. No app integration. Audio/report: exports/singing/banquet-recorded-samples-check; listening copies have level adjustment only. Runner: data/banquet_recorded_samples_check.py. Changed audition input resampling to scipy polyphase to avoid excessive memory consumption on recorded samples; app runtime unchanged.

### Sax-specific Demucs candidate audition — 2026-10-12

Kept Banquet piano as a separate candidate from existing Demucs piano extraction; Banquet sax remains rejected. Downloaded author Xavier Riley's MIT saxophone-specific checkpoint from https://huggingface.co/xavriley/demucs_v3_saxophone_separation . Verified SHA256 4a801bc00f0e21d476edef1d9fa25dbcb088e3bae0a4092e590167ae26dbe360. Strict loading worked with existing Demucs 4.1 runtime despite model card listing 3.0.6; outputs are Sax and BackingMono. Author notes high-register limitations. This targets sax, not all winds or strings.

Runner data/sax_demucs_audition.py produced aligned finite 10-second controlled-mixture and Whereabout 80–90 second auditions. Known recorded sax/piano mixture sax SI-SDR improvement +4.554dB, versus Banquet -21.192dB on the same mixture. Real-song extraction does not establish sax presence. Raw and level-adjusted listening files plus report saved under exports/singing/sax-demucs-audition. User listening review pending; no app or library changes.

### Real sax recording audition prepared — 2026-10-12

User had no local sax recording. Found composer Kevin MacLeod's Mystery Sax via the official Incompetech catalog (ISRC USUAN1700082), documented tenor sax/percussion/synths and actual musician performance. Downloaded the freely published MP3 from the composer site; stored CC BY 4.0 attribution and excerpt/separation changes in data/separator-test-recordings/ATTRIBUTION.md, copied beside audition outputs. No dataset access gates bypassed.

Extended sax_demucs_audition.py with validated local input/start/1–30 second arguments; invalid duration test blocks before checkpoint load. Ran 30–45 second song excerpt through verified sax-specific Demucs; finite aligned Sax and BackingMono output. Original and level-adjusted listening files in exports/singing/sax-demucs-song-audition. No ground-truth stem available for this recording, so no accuracy metric claimed. User listening pending; app/library/song pool unchanged. This follows the earlier controlled +4.554dB sax test, and does not validate broader winds or strings extraction.

### User-selected Elvis sax passage audition — 2026-10-12

Ran user-supplied Elvis Special Theme (Final Ver.) Bravely Default II OST.mp3 from 60–75 seconds through the verified sax-specific model. Finite aligned original/Sax/BackingMono files and level-adjusted listening copies saved separately in exports/singing/sax-demucs-elvis-audition, with source notes. Earlier Mystery Sax audition preserved. No accuracy claim without ground-truth stems; listening review pending. Not added to library/song pool and no license determination made. Runner now supports an explicit output directory for keeping song auditions separate.

### Whereabout matched sax/piano listening comparison — 2026-10-12

At user request, ran sax-specific Demucs and Banquet piano independently on the same original Whereabout accompaniment excerpt, 80–95 seconds. Banquet piano queried with recorded Accurate-Salamander piano phrase from the controlled check; output finite and aligned. Sax output finite and aligned. Original and separate level-adjusted auditions saved under exports/singing/whereabout-sax-piano-audition; raw outputs/reports retained. These are independent estimates, not non-overlapping stems suitable for summing. No ground-truth score or confirmed sax-presence claim. Listening review pending; no app/library changes.


### Optional sax and Banquet piano extraction connected — 2026-10-13

Music Studio → Review instrument parts → Optional instrument extraction now offers Audition sax and Audition Banquet piano for saved 1–30 second accompaniment sections. Both use the full saved accompaniment, including on a project with existing Demucs parts. Each generates an extracted part and a signed remainder that reconstruct the original accompaniment, rather than adding an overlapping estimate on top of original stems. Preview each part and Keep this audition in library to save a separate project. Existing covers/Demucs parts remain in their original projects. The saved extraction project has standard Include in mix checkboxes, volume, replacement choices, Preview checked/all and Save mix; sax-extracted and piano-banquet labels/mute/levels survive validation/backups and reviewed-mix saves.

Added bundled scripts/optional_separators.py: verified sax-specific Demucs checkpoint and strict-loaded Banquet piano checkpoint; local GPU when available, CPU fallback. Banquet uses isolated dependencies and a retained 10-second recorded piano query under data/separator-references/piano.wav. Bounded eight-second windows with overlap-add prevent large GPU allocation; output is aligned to the 24k job audio. No audio uploads or automatic model downloads. Backend rejects oversized ranges and missing model/query files before creating a job. Owned-job Stop behavior is reused. Existing strings/winds AudioSep audition remains experimental and separately available; broad winds/strings are not declared ready.

Validation: frontend build passed; existing frontend suite passed 170 checks with two optional skipped, and the new optional-extractor backup test passed. 59 Rust tests passed. Production sax and piano extraction modes on a three-second Whereabout section passed finite/aligned audio and exact extracted-plus-remainder reconstruction within 1e-6. Model hashes and strict loading verified. User in-app checks pending: audition/save sax, audition/save Banquet piano, checkbox previews/save/reopen, and invalid range/Stop.


### Unified separator menu; keyboard/trumpet research — 2026-10-13

Merged standard and optional extraction controls into one visible Separate instruments panel at the top of Review instrument parts. One Separator dropdown lists standard Demucs guitar/piano/bass/drums, alternate Banquet piano, dedicated sax Demucs, and AudioSep strings/winds explicitly experimental. Shared start/duration controls and one Audition selected separator action replace the scattered prepare/extract buttons. Standard Demucs now follows the same preview-only audition and explicit Save audition to library flow. Per-part preview buttons show all returned parts; audition title identifies which result is loaded. Original projects and mix-checkbox workflows remain unchanged. Standard limit 60 seconds; optional limit 30; existing preflight/backend validation retained.

Keyboard/trumpet research: official MVSep Mega 53 model release https://github.com/ZFTurbo/Music-Source-Separation-Training/releases/tag/v1.0.21 supports keys, digital-piano, piano, organ, synth, trumpet, brass and other families. Author recommends at least 16GB VRAM, warns individual-stem quality may be below specialized models and outputs can overlap. Laptop is 8GB, so do not declare compatibility or integration before bounded/CPU trial and listening review. The hosted newer version differs from public weights; no audio uploaded. Keyboard should be labeled by subtype rather than silently equated to acoustic piano. New targets remain next-stage auditions, not enabled menu entries.

Validation: build passed, frontend regression suite 171 passed with two optional skipped. UI checks pending: find all four choices in the one menu, audition/save standard parts, audition/save optional piano or sax, and verify duration errors/Stop and original project preservation.


### Mega-53 keyboard/trumpet candidate audition — 2026-10-13

Downloaded official MSST source and MVSep Mega-53 v1 release https://github.com/ZFTurbo/Music-Source-Separation-Training/releases/tag/v1.0.21 . Verified release SHA256: config 7e198062a251587088adb91215a4f44ab59e67bd62fcc805cf54d6e7dfc51103; checkpoint c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f. Checkpoint size 1368919887 bytes. Three inference dependencies isolated in data/mega-packages; existing runtimes unchanged. Strict model loading passed with official configuration; tuple tags safely converted to tuples without evaluating arbitrary YAML objects.

Runner data/mega_separator_audition.py uses upstream active_stem_ids to run only trumpet, digital-piano, keys, organ and synth outputs, four-second windows/three-second hop with overlap-add, inference/autocast float16 and batch one. RTX5070 laptop 8GB peak allocated memory about 2.858GB for this test. This validates short selected-output inference only, not official full 53-stem/long-window memory behavior.

Known four-second LiveHQ trumpet plus Rhodes/electric-piano mixture: SI-SDR improvement +17.668dB trumpet, +14.125dB digital-piano, +16.441dB keys. Organ nearly absent; synth not a correct target for this mixture. These are sample-based controls, not a live performance. Whereabout 80–90 second real accompaniment produced useful-audition-sized keys/digital-piano output and near-silent trumpet, without asserting instrument presence from amplitude. Raw/aligned finite results, truths, original, level-adjusted listening copies and report in exports/singing/mega-keyboard-trumpet-audition. Controlled test about 2.14s inference; song about .90s, excluding model loading/rendering/download. Keys/digital-piano overlap and are alternative estimates, not additive stems. Listening approval pending. No app/menu integration or audio upload.


### Keyboard, electric piano and trumpet wired — 2026-10-13

Added Keyboard / keys, Electric piano and Trumpet choices to unified Review instrument parts → Separate instruments. Uses approved Mega-53 model locally with one selected output, four-second/three-second-hop overlap-add, GPU autocast and CPU fallback. Existing verified models/dependencies remain in project data; no downloads/audio uploads during extraction. Each 1–30 second audition creates its named extracted part and a signed remainder preserving the saved accompaniment. Explicit preview/save remains required; originals kept. Saved parts support checkbox/volume, replacement instruments, preview checked/all, reviewed-mix saving and backup labels. Keyboard and electric piano are alternatives with possible overlap, explained in menu.

Backend preflight checks range and model/config presence before spawning a job. Production verifies checkpoint SHA256 and strict weights load. New labels: keyboard-extracted, electric-piano-extracted, trumpet-extracted. Bundled optional separator script refreshed via Rust build.

Validation: frontend build passed; 171 frontend checks passed with two optional skipped; 59 Rust tests passed. Extended backup test preserves new labels alongside sax/piano with muted state/levels. All three production modes on a three-second Whereabout section passed finite aligned audio and extracted-plus-remainder reconstruction within 1e-6. Listening approval was obtained on earlier Mega-53 auditions; in-app control/save checks remain: all three appear and audition, save with original retained, checkbox/volume preview then save/reopen, invalid range and Stop.


### Original-song generation stage 1 — 2026-10-13

Added Original song tab to the full-size Music Studio. Inputs: title, 1–2000 character prompt, Gentle piano/Light acoustic guitar/Jazz/Anime-inspired rock/Synth-pop, instrumental toggle, optional English lyrics up to 6000 characters, 10–180 second full duration, seed 0–2147483647. First make an approximately 15-second preview; full generation is enabled only for matching prompt/lyrics/style/instrumental/seed. Duration and title can change without invalidating the creative settings. Longer song is a newly generated rendition, not an exact extension of the preview. Actual generated duration is read from the WAV.

Reuses existing read-only C:/AI/acestep.cpp/build/Release/ace-lm.exe and ace-synth.exe plus installed GGUF models in C:/AI/Manaverse-BGM-Generator/models. No new model downloads or changes to the other projects. New bundled scripts/original_song_job.py plans caption/lyrics/audio codes then renders with base Q8 model at 50 steps. Original generated audio and request/enriched plan/seed metadata live in exports/singing/original-*; preview jobs are excluded from discovery and do not enter library automatically. Full songs persist as original projects and are rediscovered with actual title/duration/prompt/seed/lyrics. Audio stays external to JSON backups.

Instrumental is the default. Lyrical generation uses a generated guide singer, explicitly not Mana voice. Play generated audio/Generated lyrics are available after generation. Create Mana cover opens the existing cover form with generated audio, voice separation and whole-song conversion selected; the user reviews conversion settings and starts the established Mana voice pipeline. Saved lyrical originals expose the same action under Song details. No silent voice conversion or claim that ACE-Step output is Mana. Original instrumentals play/export directly; source review/mix needs separated singing stems. Chat pool approval remains separate.

New original_song_start native command validates inputs/runtime/model presence before job creation and shares the owned singing-job slot. Cancellation kills only the original job's owned process tree on Windows, covering the native child; other singing job behavior remains unchanged. Frontend timeout is 30 minutes. No local web server required. Original-only draft actions do not edit library metadata before a saved project exists.

Validation: local 15-second instrumental native audition rendered 14.24s stereo48k WAV; production lyrical draft with original test lyrics rendered 14.24s finite WAV; production 60-second instrumental rendered exactly60s and retained request/results. Frontend build passed; 172 frontend checks passed, two optional skipped. 61 Rust tests passed, including original request boundary validation, actual owned child-process cancellation, and original mix-only discovery compatibility. Metadata/seed/lyrics backup and preview fingerprint test passed. Listening quality and manual UI acceptance remain for the user. High-note/trembling voice conversion issue remains deferred.

Manual checks: (1) restart Mana, Original song tab, make/play short preview; (2) create 30–60 second full song, reopen/restart and verify metadata/play/export; (3) turn off Instrumental, use own lyrics or blank for automatic English lyrics, preview then open Create Mana cover; (4) change prompt/seed to require a new preview, reject invalid duration/seed, and Stop during generation.

### Cover vocal diagnosis auditions — 2026-10-13
Prepared `exports/singing/cover-diagnosis-2026-10-13` using the same existing 12-second extracted guide, approved default-r2 reference, seed 42 and guidance 0.7. Vocal-only comparisons: extracted guide, 30 steps, 50 steps, and 50 steps with the existing conservative F0 smoothing. Listening exports use common RMS target 0.10 with peak ceiling 0.95; no backing, reverb, pitch shift or note quantization. Converted duration is 11.993 seconds versus 12-second guide. All generated samples were finite. App defaults and approved song pool remain unchanged. Listening approval is pending.
Earlier smoothing metrics barely changed guide pitch (adjacent-change median 5.924 to 5.878 cents); this does not establish that pitch tracking is the source of the perceived trembling. Compare guide versus conversion first, then isolate step-count and smoothing changes. Next reference comparison or fine-tuning depends on that audition; no promised quality improvement from additional diffusion steps.
Reproducible runner: `scripts/audition-cover-diagnosis.py`; manifest `comparison.json` records settings and levels. The initial sandbox attempt stalled in audio loading; the owned worker was stopped and successfully rerun with native-library access.

### Singing-reference comparison — 2026-10-13
User preferred the 50-step pitch-smoothed candidate but still heard trembling. Prepared `exports/singing/singing-reference-audition-2026-10-13`: previous candidate versus the same 12-second guide converted with an eight-second isolated vocal from the previously approved current-voice cover `1791658128634-current-voice`. Both use seed 42, guidance 0.7, 50 steps and conservative pitch smoothing, with matched RMS and no accompaniment. Both outputs are 11.993 seconds and finite. This reference is itself converted audio, so it may recycle artifacts; it is an exploratory conditioning test, not a clean ground-truth singing dataset or approved training material. App defaults and pool unchanged. Listening approval pending. Reproducible runner: `scripts/audition-singing-reference.py`.

### Lower-key vocal auditions — 2026-10-13
Prepared `exports/singing/cover-key-audition-2026-10-13` comparing original key, -2 and -4 semitones. Same 12-second guide, derived Mana singing reference, seed 42, 50 steps, guidance 0.7, F0 conditioning and conservative pitch smoothing; automatic F0 adjustment disabled. All audition WAVs are vocal-only, common RMS target 0.10/peak ceiling 0.95, finite, and 11.993 seconds long. Original-key control reuses the identical previous conversion. No production UI/defaults or approved clips changed. Optional worker parameter `semi_tone_shift` defaults to zero and rejects booleans, non-integers and values outside -12..12 before loading audio. Runner: `scripts/audition-cover-key.py`. Listening approval pending; key changes do not establish a cure for trembling. A finished transposed mix would also require matching accompaniment transposition.

### Legacy Applio singing comparison — 2026-10-13
Read existing `C:/AI/Applio` and `C:/AI/ManaAI` without changing their configurations or models. Legacy core/rvc.py uses VoiceConverter, ContentVec, FCPE, volume envelope 1.0, protect 0.33; affinity profiles choose index 0.70–0.85 and speech pitch +6..+9. Singing audition deliberately preserves original key (pitch 0) with index 0.70, no autotune, denoise or postprocessing. Existing model/index: `C:/AI/ManaAI/models/rvc/ManaVoicev1.pth` and `.index`; detected F0-enabled RVC v2, 40 kHz HiFi-GAN.
Applio's bundled env failed importing copyreg; used legacy Mana's configured `.venv/Scripts/python.exe` successfully instead. No installation repair attempted. Offline model loading and disabled bytecode; output and Numba cache stay in current project. Runner `scripts/audition-applio-cover.py`.
Outputs `exports/singing/applio-cover-audition-2026-10-13`: same 12-second extracted guide converted with FCPE and RMVPE, matched RMS target 0.10/peak cap 0.95, vocal-only, previous Seed-VC candidate copied as control. Both outputs finite, audible and 11.98 seconds. CPU startup/import/model preparation 19.39s; FCPE conversion 13.93s, RMVPE 4.25s. Timing includes extractor setup and sequence cache effects: RMVPE runs second with shared voice/embedder models warm; not a controlled speed benchmark. Listening approval pending; no app integration/default or approved song changes.

### Whereabout FCPE audition at 2:50 — 2026-10-13
User preferred FCPE's lesser trembling and requested a longer Whereabout test starting 2:50. Used saved full-song guide vocal `exports/singing/1791669063502/guide-vocals.wav`, 170–200 seconds, with existing legacy Mana model/index, original key, FCPE, index 0.70, protect 0.33, volume envelope 1.0, ContentVec; no autotune, denoise or postprocessing. Saved `exports/singing/applio-whereabout-170s-2026-10-13/original-vocal.wav` and `mana-fcpe.wav`, common RMS 0.10/peak ceiling 0.95, vocal-only. Finite audio and duration verified: guide 30s, Mana 29.98s. CPU conversion 11.05s plus startup/model loading 4.77s in this run. Full download English Whereabouts cover duration is 288.078s matching saved stem's 288.044s; the other similarly named download is only 12.024s. App, legacy configurations and approved pool unchanged; listening approval pending. Runner `scripts/audition-applio-whereabout.py`.

### Alternate vocal extraction at 2:50 — 2026-10-13
After user heard echo/doubling in the Demucs guide where FCPE trembles, extracted original downloaded Whereabouts English cover at 170–200s with installed Mega 53-stem BS-Roformer: lead-vocal, back-vocal and combined vocal outputs. Local GPU, verified checkpoint SHA256, 4s windows/3s hop overlap-add; no new downloads. Raw estimates stored as FLOAT (lead peak 1.098 remains unclipped); listening copies normalized independently to RMS 0.10 with peak cap 0.95. Independent heads are estimates, not additive ground-truth parts. Backing-track audition amplification is documented (gain 2.095); its apparent loudness is not evidence of original balance.
Converted lead-only and combined-vocal estimates using unchanged legacy Mana model/index, FCPE, pitch 0, index 0.70, protection 0.33, ContentVec, no autotune/denoise/postprocessing. Both finite and 29.98s; CPU conversion 10.12s/9.40s respectively. Previous Demucs-FCPE control copied without regeneration. Outputs `exports/singing/vocal-extraction-170s-2026-10-13`; extraction and conversion manifests preserve settings and levels. Original mix and extracted tracks available for listening to distinguish harmonies/reverb from separator artifacts. No claim that alternate extraction is cleaner until listening; no app defaults/configurations, legacy installations or pool changed. Runners `scripts/audition-vocal-extraction.py`, `scripts/audition-applio-extractions.py`. Initial checksum helper updated for existing Python3.10 before successful extraction. Listening approval pending.

### Lead-only FCPE versus Seed-VC — 2026-10-13
User selected Mega lead-only extraction and requested engine comparison. Same raw 170–200s lead-only stem supplied to existing RVC FCPE candidate and Seed-VC (50 steps, guidance .7, seed42, pitch smoothing, original key, previously derived eight-second Mana singing reference). RVC result reused exactly; Seed-VC newly generated. Vocal-only RMS-matched 0.10/peak cap .95 auditions at `exports/singing/lead-engine-comparison-2026-10-13/1-fcpe.wav` and `2-seed-vc.wav`. Finite sample checks and duration checks passed: 29.98s FCPE /29.989s Seed-VC. Seed-VC worker total40.05s including loading, so not directly comparable with FCPE's earlier conversion-only10.12s. This compares whole engine candidates and their established conditioning, not pitch trackers in isolation. Production defaults, pool and legacy installations unchanged. Listening approval pending. Runner `scripts/audition-lead-engines.py`; manifest records source, reference, levels and timing.

### Approved lead-only → zero-shot Seed-VC cover flow — 2026-10-13
New Music Studio covers default to Mega lead-only extraction, Seed-VC's F0-enabled 44.1 kHz singing model, 50 steps, guidance 0.7, seed42 and conservative guide pitch smoothing at original key. The approved eight-second derived singing reference is copied to stable `data/custom-voice/references/mana-v2/singing.wav` with provenance; chat voice configuration is unchanged. Create-cover form exposes Lead only (recommended) / Voice & harmonies (Demucs), plus a checkbox to use Mana's singing reference or the selected chat reference. Dry vocal input can skip separation.
Lead extraction runs in a hidden owned subprocess using the installed Mega checkpoint and short overlapping windows; its GPU model exits before CPU Seed-VC conversion. Stop now terminates the cover worker's owned process tree. Missing separator setup is rejected before native job folder creation; worker verifies the checkpoint checksum and refuses silent fallback. Resource bundle includes cover_lead.py and singing_pitch.py; explicit project data root supports packaged workers. Lead and backing are scaled together if necessary before PCM encoding to prevent clipping. Backing is original mix minus the combined-vocal estimate, rather than original mix minus lead, to avoid deliberately retaining the original singer's backing harmonies. Extraction remains estimated and can contain artifacts. Input files and old cover audio remain unchanged.
Cover metadata/backups/discovery preserve extractor choice; old entries without this field retain Demucs metadata. FCPE remains an audition fallback and is not integrated or selected as production default. Original-song guide-to-cover uses the same Create cover flow.
Validation: 173 frontend tests passed, two optional skipped; build passed; 61 Rust tests passed including owned-process-tree termination. Production 30s whole-input smoke verified GPU extraction → CPU conversion, valid duration and finite/unclipped guide, backing, vocal and mix. Output `exports/singing/production-lead-cover-smoke-2026-10-13`. Listening approval of this production run remains a manual check.
Manual acceptance after restarting Mana:
1. Create a Whereabout excerpt starting170s, length30s, Lead only and Mana singing reference enabled; listen to Mana vocal for the approved stability.
2. Play Full mix and Instruments; confirm alignment, backing volume and absence of obvious doubled original lead.
3. Test Whole song or a dry sung guide with separation disabled, then reopen Music Studio and verify older covers still play.
4. Stop while extracting; confirm processing stops and another cover can start. Demucs remains selectable for comparison.

### Local trembling report near 1:12 — 2026-10-13
User's new full Whereabout cover is `exports/singing/1791861784048` (Mega lead, Seed-VC50, pitch smoothing, seed42, singing reference). Extracted original mix, actual guide and full converted vocal at 62–82s into `exports/singing/whereabout-72s-diagnosis`; normalized listening copies with no accompaniment for vocal stages. Rerendered the same saved lead with identical voice settings as a separate20s conversion; original full output preserved. Rerender changes sequence context/RNG progression and is a candidate, not proof of a chunk-boundary defect.
Guide RMVPE trace at70–75s:454 voiced frames,2 voicing transitions, no adjacent voiced pitch jumps over600cents; range228.79–414.26Hz. Existing smoothing leaves this range effectively unchanged. No evidence from these checks for an octave-jump or rapid voicing-flicker correction; they do not rule out extraction/timbre artifacts or finer pitch instability. Input and candidate audio finite; loudness matched for audition. App settings and pool unchanged. Await comparison of full-cover vocal vs local rerender (1:12 occurs10s into clips) before selecting a repair or changing pipeline. Runner `scripts/diagnose-cover-72s.py`; pitch trace and manifest saved.

### Combined-vocal local repair candidate near1:12 — 2026-10-13
Following user's observation of echo in the lead at clip11s (~73s song), recovered the saved combined-vocal estimate as source-segment minus backing-extracted (both raw FLOAT, saved before production PCM scaling). No new model extraction needed. Compared normalized lead and combined guides at62–82s, and converted combined guide with unchanged Seed-VC50, guidance.7, seed42, pitch smoothing and singing reference. A separate full vocal candidate replaces only70–77s with this local conversion and400ms linear crossfades. All floating samples outside that patch are exactly unchanged; original full cover and mix are untouched. The combined estimate may still contain backing voices/reverb; no assertion of cleaner sound or solved echo without listening. Files finite, unclipped and valid duration; output `exports/singing/whereabout-72s-combined-candidate`. Manifest records recovery method, patch region/gain and listening approval=false. Full repair candidate is vocal-only; approved integration/remix is pending listening. Runner `scripts/audition-cover-local-repair.py`.

### Dedicated vocal de-reverb audition — 2026-10-13
Combined-vocal alternative still retained echo according to user; tested author anvuew's mono Mel-Band Roformer de-reverb checkpoint (SDR20.4029), source https://huggingface.co/anvuew/dereverb_mel_band_roformer, author-listedGPL3.0, revisioncef05ad. Downloaded913097978bytes into data/vocal-dereverb; SHA256 verifiedf099ee717eb57fb0ad5eb0e7c9ad6787c36168140b61ce2b158b90c2c4ecee79. Existing MSST code/dependencies reused, checkpoint loaded weights_only=True and strict state validation. No downloads to legacy installations; no recording uploaded.
Cleaned only existing62–82s lead with GPU8s/6s overlap-add; saved original, cleaned and removed-material auditions at exports/singing/whereabout-72s-dereverb-audition. Removed-material RMS0.0180 vs original lead0.1436; separately normalized removed-material audition gain5.547, so its listening loudness does not represent original balance. Small removed energy does not establish successful echo removal. Author notes mono variant stronger on reverb but less able to remove harmonies and instrument leftovers; avoid assuming it handles a doubled lead.
Converted cleaned guide with unchanged Seed-VC50/guidance.7/seed42/pitch-smoothing/singing-reference. Baseline is the previous uncleaned20s local rerender with the same context, not the entire-song conversion, to isolate input cleanup. Finite samples and duration verified. App defaults, original cover, pool and legacy models untouched; listening approval pending. Runners scripts/audition-vocal-dereverb.py and scripts/audition-dereverb-conversion.py; cleanup.json/conversion.json preserve provenance and levels.

### Harmony-suppression alternative at1:12 — 2026-10-13
User rejected mono de-reverb: echo persisted. Tested author's original anvuew Mel-Band Roformer SDR19.1729 weights, which the author reports can partially suppress noncentral harmonies and separation leftovers; this is an alternate cleanup model, not a guaranteed dedicated double-track separator. Downloaded from author revisioncef05ad to data/vocal-dereverb/harmony-model.ckpt,913107578bytes, SHA2569262877b87e9ebb0fb808a456b0a411fa677f5df31c8383c1254af531c078970 verified; GPL3.0 author label recorded. No audio uploaded. Reused existing MSST dependencies and strict weights-only checkpoint loading.
Cleaned same62–82s lead, GPU8s/6s windows. Original RMS0.1436, cleaned0.1378, removed0.0220; separately normalized removed-material gain4.554 is for audition, not original balance. Seed-VC conversion uses same20s context/reference/50steps/guidance.7/seed42/pitch smoothing. All processed audio finite with valid duration; listening approval pending, no quality claim based on energy alone. Files at exports/singing/whereabout-72s-harmony-audition: before-lead/clean-lead/removed-material/before-mana/clean-mana plus manifests. Source/full cover/app defaults unchanged. Existing audition runners now accept explicit mono/harmony variant; previous outputs preserved. If the echo remains, this model has not isolated the problematic overlapping voice and should not be adopted globally.

### FCPE local fallback audition at1:12 — 2026-10-13
After lead/combined swaps and both cleanup weights failed listening checks, user authorized FCPE fallback on the same problematic lead. Ran existing legacy Mana runtime/model/index with FCPE, original key, index0.70, protection0.33, ContentVec, no cleanup/autotune/postprocessing, on the identical saved62–82s lead. Output19.98s, CPU conversion9.86s (model preparation+conversion10.40s). Independent candidate uses resampled FCPE only at70–77s,400ms crossfades, level matching with peak cap. Full vocal outside patch exactly unchanged in floating validation; original user's cover and mix files preserved.
At exports/singing/whereabout-72s-fcpe-repair: current-seed-vc.wav, fcpe-only.wav, hybrid-repair.wav, mix-repair-preview.wav, full-vocal-candidate.wav. Audition RMS0.10/peak0.95, finite/duration checked. Mix preview reuses saved backing balance via least-squares fitted coefficients (vocal0.45243/backing0.80000; fit residualRMS1.17e-5), adding only local vocal delta. No full mixed cover replaced, no app defaults/integration changed. Listening approval=false; do not claim this resolves the distorted note before review. Runner scripts/audition-fcpe-local-repair.py; comparison.json preserves settings, timing and patch scope.

## 2026-10-14 — Cover Builder and clearer navigation

Music Studio now separates Create (Cover a song, Cover Builder, Original song), Edit tracks and Chat clips. Advanced extraction settings are folded away; player and track icons include tooltips and accessible labels. Cover Builder uses the wider workspace alongside the library.

Add one clean sung vocal, convert it to Mana with the current zero-shot Seed-VC singing reference, and add instrument recordings individually. Up to 16 tracks support names, volume, mute and signed timing offsets (positive delays, negative trims). Import copies WAV/MP3/FLAC/OGG/M4A into a 44.1 kHz stereo WAV under exports/singing; source recordings are unchanged. Tracks can be up to one hour, subject to the existing 256 MB mix limit. Alignment is manual; this does not automatically match tempos.

Keep original instrument audio or choose a melodic replacement/drum kit. Make a replacement preview, listen, then apply it; Restore original remains available. Longer replacements render in sections of at most 60 seconds and are assembled into a complete track. Transcription still estimates notes and expression, so listening is required.

Preview the mix, then save it to the library. Saved builder projects retain track paths, gains, mute, timing, original paths and applied replacements. Open in Cover Builder restores editable tracks. Unsaved drafts survive tool/chat switches within the current app session; save before restarting. JSON backups contain metadata and paths, not audio files. The existing player receives aligned vocal/instrument stems for playback and mix controls.

Verification: production build passed; 175 frontend tests passed (2 optional checks skipped), 63 native tests passed. Native import verified resampling and unchanged source bytes. Browser inspection verified navigation, wide builder layout and draft-title retention across tool switches. Desktop conversion, replacement listening and save/reopen acceptance remain for the user.

Manual acceptance:
1. Open Songs → Create → Cover Builder. Check navigation, folded settings and icon tooltips; switch tools and confirm your draft remains.
2. Add a clean vocal and convert to Mana. Add two instrument tracks; adjust timing, volume and mute, then preview the mix.
3. Choose an instrument replacement, listen, apply it and restore the original. Save the mix to the library.
4. Open that saved cover in Cover Builder and confirm its tracks/settings return. Check older covers and Chat clips still play normally.

## 2026-10-14 — Backing vocals, karaoke lyrics and direct-track replacement fix

Fixed Cover Builder replacement jobs receiving a null companion-stem list: the native request now sends an empty list and the Python job accepts null/empty lists defensively. Verified a real three-second electric-piano replacement from the user's saved upload request, plus a deterministic regression covering both null and empty companion stems. Existing generated files and user sources are unchanged.

Cover Builder now offers Add backing vocal. Multiple backing voices count within the existing 16-track limit, each with its own gain, mute and timing. Keep the uploaded voice or convert it to Mana independently. Saved projects retain backing roles; the player vocal stem combines lead and backing voices, while the instrument stem excludes all voices. One lead vocal is still required.

The main Music Studio player has Generate lyrics and Edit / paste controls. Local Whisper transcribes the saved vocal (full mix fallback) into timed lines, saved in library metadata and JSON backups. Current English Whisper model supports English; multilingual models use automatic language detection. Lyrics highlight a whole line during playback and follow seeking, pause and restart. This is line-level karaoke, not word-level animation or new lyric composition. Wording and timing are estimates, especially for singing; paste/edit [mm:ss.xx] lines to correct them. Empty timed text clears the lyrics.

Lyrics jobs support cancellation, clean temporary WAV/JSON/log files on completion or stop, run locally without uploads, and reject audio beyond one hour before starting. Generation is explicit and only in the main Songs player; no chat lyrics feature was added.

Verification: production build passed; 177 frontend tests passed with 2 optional skips; 65 native tests passed. Installed Whisper produced timestamped JSON from the actual Mana singing reference; words were imperfect, confirming the need for editing. Browser layout confirms the backing-vocal control. Desktop listening and karaoke playback acceptance remain for the user.

Manual acceptance:
1. Retry Electric piano replacement in Cover Builder: preview should complete without the NoneType error.
2. Add backing vocals, adjust gain/mute/timing, optionally convert one to Mana, then preview/save/reopen the mix.
3. Select a finished song in the main player and Generate lyrics. Play, pause, restart and seek; line highlights should follow the song.
4. Correct words/times using Edit / paste, save, then reopen the song. Check saved lyrics persist and Stop cancels generation.

Additional verification: backups without lyrics remain compatible. Saved accompaniment excerpts trim/rebase lyric timestamps; instrument-only replacement auditions do not highlight the full song's lyrics.

## 2026-10-14 — Whereabout piano melody audition

User requested piano-first melody preservation for Whereabout. Found that the shared replacement renderer reduces Basic Pitch's polyphonic detections to a single Viterbi melody for all instruments, discarding piano chords/independent overlaps. Added an audition-only piano path using independent detector events and the installed Accurate Salamander SFZ piano. Same-key re-strikes trim the earlier key's note-off; separate pitches keep their overlaps. Production render/defaults remain unchanged pending listening.

Audition uses the previously approved Banquet piano extraction at song 80–95 seconds (exports/singing/whereabout-sax-piano-audition/piano-raw.wav). Exports at exports/singing/whereabout-piano-polyphonic-audition: original-piano.wav, previous-monophonic.wav, candidate-polyphonic.wav, candidate/previous MIDI, notes.json and report.json. Matched listening RMS target .07 with peak cap .9; no original audio is mixed into either recreated candidate.

Verification: synthetic three-note chord/overlap and repeated-key ownership checks passed; real 15-second inference/render completed with finite samples. Old line31 notes, polyphonic245 notes, maximum11 simultaneous keys. These counts show retained polyphony, not accurate transcription; noise/harmonics from the extracted source may remain as extra notes. User melody/phrasing acceptance pending. No external model downloads or app setting changes.

2026-10-14 follow-up: auditioned the user-supplied UVR Piano MP3, first0–15 seconds, with the same polyphonic path and Accurate Salamander samples. Files: exports/singing/whereabout-uvr-piano-0-15-audition/original-piano.wav and candidate-polyphonic.wav (also prior mono recreation, guide WAV, MIDI, notes and report). Input MP3 read only. All listening files finite and15s, separately level-matched to .07RMS/.9peak cap, no original layered into the candidate.25 previous mono notes versus188 polyphonic notes, maximum8 simultaneous keys; note counts are not accuracy evidence. Listening approval pending; app defaults unchanged. Audition runner now accepts explicit source/start/duration/output folder.

2026-10-14: UVR piano0–15s note-filter audition at exports/singing/whereabout-uvr-piano-filtered-audition/filtered-piano.wav. Filters confidence below.40, weak notes shorter than.105s (strong short attacks retained), and weaker coincident octave/fifth harmonics. Retained notes keep pitches/onsets/ends unchanged, with full chord overlaps. Uses same Salamander samples and listening target as the preceding188-note candidate, no original mixed in. Synthetic chord, independent octave attack, short strong attack and weak coincident harmonic tests passed; finite15s audio/MIDI/report produced. This is an audition heuristic and can remove real soft notes; listening acceptance pending and production defaults unchanged.

2026-10-14: User preferred the188-note UVR polyphonic take to the97-note broad filter; retain that earlier take as baseline. New audition in exports/singing/whereabout-uvr-piano-attack-repair/attack-repaired-piano.wav merges36 weaker same-key repeat attacks into their prior sustains (152 events remain), instead of deleting quiet pitches/chords. Requires gap<=.16s, confidence<.55 and<=90% of prior attack, and no>=1.4x median key-energy rise in original CQT around that onset. Merged notes extend the prior end, preserving their entire sounding interval; other note pitches/onsets/ends unchanged. Same Salamander samples and listening-level target; no original layered into render. Synthetic chord preservation, source-supported re-strike protection, input immutability and merged sustain checks passed; rendered audio finite and15s. MIDI, notes and heuristic decisions saved in report. Listening acceptance pending, app defaults unchanged. This heuristic may still mistake soft real re-strikes for decay fragments.

2026-10-14: User requested removing weak detections only from the preferred188-note UVR piano take. Audition at exports/singing/whereabout-uvr-piano-weak-only-audition/weak-removed-piano.wav removes74 events with confidence<.40 and retains114. No duration/harmonic filters, merging, pitch changes or retiming. Same Salamander patch, velocity mapping and exact playback gain as preferred take; no post-filter loudness boost. Assertions verify retained notes unchanged, exact counts,15s finite audio and no clipping. MIDI/notes/report saved. Lower confidence is not proof a note is false; listening acceptance pending. Prior candidates and app defaults unchanged.

2026-10-14: User accepted weak-only114-note candidate but flagged extra strong notes around4s. Source CQT check showed near-contiguous repeat D#3 at3.949s and B3 at4.438s without a fresh key-energy rise (.92x/.83x respectively); nearby E4 at3.914s had3.23x rise and was retained. Targeted audition merges only these two repeat attacks into prior sustains (112 events), preserving other notes, playback gain and samples. Output exports/singing/whereabout-uvr-piano-4s-repair/targeted-piano.wav plus MIDI/notes/report. Assertions verify exact two merges, other pitches/onsets/confidence unchanged, no shortened ends, finite15s/no clipping. Decay/no-rise is evidence for a suspect attack, not proof of note truth; listening acceptance pending. App defaults and prior candidates untouched.

2026-10-14: User accepted targeted4s correction as closer and approved extending approach across the remaining0–15s passage. New audition exports/singing/whereabout-uvr-piano-full-passage-repair/passage-repaired-piano.wav applies identical near-contiguous same-key source-energy rule across15s, starting from accepted weak-only114-note candidate.43 suspected repeat attacks merged into earlier sustains,71 events retained. All original sounding intervals/pitches retained via same-key merges; no retiming or fresh pitch additions. Assertions ensure accepted3.95s/4.44s repairs retained, unmerged notes unchanged except extended ends, finite15s audio/no clipping, exact prior playback gain. MIDI/notes/report saved. Fresh rise protection usesCQT median1.1x threshold; source evidence is heuristic and may suppress real soft re-strikes, so listening approval remains required. Best targeted4s candidate and app defaults preserved.

2026-10-14: User accepted full-passage melody but reported soft original notes rendered too strongly. Dynamics audition exports/singing/whereabout-uvr-piano-dynamics-audition/dynamic-piano.wav uses identical71 approved notes/pitches/onsets/ends. Estimates key strength via source CQT75th percentile15–140ms after attack and maps relative to90th percentile into MIDI15–95; actual range21–95 versus old70–94. Same Salamander patch, global listening RMS matched to preceding candidate(.0541468) with.9peak cap; no per-note count/timing changes. Per-note velocities now an optional validated renderer argument; normal app calls/default dynamics unchanged. Monotonic loudness/invalid velocity checks, exact note persistence, finite15s/no clipping and existing direct-track replacement regression passed. MIDI/strengths/velocities/report saved. Spectral strength is an estimate, not measured original MIDI velocity; listening approval pending.

2026-10-14: User requested weak original notes also sound weak. Soft-dynamics audition exports/singing/whereabout-uvr-piano-soft-dynamics/soft-dynamic-piano.wav uses the same71 approved notes and cached source attack strengths. Replaces15–95 curved mapping with linear MIDI1–95 (MIDI1 minimum nonzero note-on), removing the artificial velocity15 floor and weak-note-lifting power curve. Reuses previous playback gain with peak-reduction-only cap; no upward RMS normalization. Tests assert all new velocities <=previous, monotonic strength mapping, exact note preservation, finite15s and gain not increased. MIDI/notes/report saved. Weak detections removed in prior accepted pass are not reintroduced; source dynamics remain estimated from CQT. Listening acceptance pending; app defaults unchanged.

2026-10-14: User still heard weak notes too strongly after soft MIDI mapping. SFZ inspection confirms amp_veltrack98.5 and velocity layers; do not claim the patch ignores velocity. New direct-attenuation audition exports/singing/whereabout-uvr-piano-direct-dynamics/direct-soft-piano.wav preserves71 notes/times and prior MIDI velocities, uses minimum of normalized source-derived velocity and detection confidence above.40 to choose direct layer gains1/.5/.25/.125 (0/-6/-12/-18dB). Independent sampled layers are summed, no note dropped, no source mixed in, no upward RMS boost. Groups are heuristic estimates of weakness, not known original MIDI dynamics. Assertions verify each note rendered once, exact note persistence, finite15s/no clipping and gain not increased. Report saves per-note gains/counts; listening approval pending and app defaults unchanged.

2026-10-14: User requested a small overall boost while further softening weak piano notes. Balanced audition exports/singing/whereabout-uvr-piano-balanced-dynamics/balanced-piano.wav preserves71 notes/timing and prior MIDI velocities, uses layer gains1/.4/.18/.08 versus preceding1/.5/.25/.125, then applies requested+1.5dB global gain with.9peak cap. Main group unchanged before global boost; softer groups remain lower even after boost. Finite15s, exact note persistence and cap assertions passed. Report records requested/applied boost and peak. Prior auditions and app defaults retained; listening approval pending.

## 2026-10-14 — Approved piano recreation integrated

User approved balanced piano candidate (softer weak notes plus1.5dB boost). Prepared source piano/piano-banquet → Piano with Separate libraries now uses render_piano_preserving: polyphonic piano detection, confidence>=.40 filtering, source-key no-rise repeat merging with preserved sustain, linear source MIDI dynamics and direct1/.4/.18/.08 audio layers plus1.5dB. Existing piano SFZ variants retain their selected patch. Guitar/other source parts and other instrument destinations/banks retain prior routes.

Automated check on the same UVR0–15s guide reproduces all71 approved note events exactly; rendered waveform at comparison gain differs by at most.0000305176 from the approved PCM16 audition (one quantization step). Existing mix-stage loudness matching and volume controls remain; app absolute playback loudness may differ from the level-matched audition. Routing regression verifies piano/piano-banquet select the new method and guitar does not. Existing null/empty companion-stem regression passed. Native tests/build refresh verified separately. The approved audition remains at exports/singing/whereabout-uvr-piano-balanced-dynamics/balanced-piano.wav.

Manual checks after restarting Mana:
1. Cover Builder: import isolated piano, Original instrument=Piano, Try a replacement=Piano, then Make replacement preview. Use the same0–15s source for direct comparison.
2. Confirm melody, sustained overlaps and soft-note balance, especially around4s.
3. Apply/save/reopen the mix; adjust piano volume independently of Mana vocal.
4. Existing guitar/sax/drum replacements and original-track restore still work.

This is an estimated transcription/dynamics method approved on one passage, not a guarantee of exact notes on every recording. Remaining sources/instruments still need quality work.

## 2026-10-14 — Guitar performance first audition

User moved on from approved piano and authorized guitar work, starting clean then distorted. Reused existing isolated Reach Out to the Truth guitar at exports/singing/arrangement-1791744247383209600/guitar.wav. New clean-guitar audition in exports/singing/guitar-performance-9-19-audition covers9–19s, rendered with full19s context. Files: original-guitar.wav (distorted source), current-clean-guitar.wav, candidate-clean-guitar.wav; full-context MIDI/notes/report retained.

First pass holds current48 melody pitches and attack timing unchanged. Extends26 note ends by source CQT/RMS evidence, up to450ms beyond existing ends, stopping before same-key re-strikes or weak/silent source energy. Picking velocities derive from source-key attack strength, range17–100, using installed BlackAndGreenGuitars clean patch. No new notes added and no source mixed into recreation. Baseline/candidate share playback gain; original separately matched for listening. Synthetic tests preserve input, pitches/onsets, same-key boundaries and silence; real render finite with exact10s exported clips. MIDI events retain full19s reference timing.

This audition targets ringing/picking first; it retains existing note-estimation errors. Source has distortion, while both recreated comparison tracks are clean to judge note performance independently of distortion. User listening acceptance pending; guitar production settings unchanged and approved piano retained. Distorted candidate follows after clean performance review.

2026-10-14: User requested guitar holds/ringing closer to original; melody present but clean-vs-distorted tone makes judging difficult. Audition exports/singing/guitar-longer-sustain-9-19-audition/longer-clean-guitar.wav and longer-distorted-guitar.wav uses same48 pitches/onsets/picking velocities as previous guitar candidate. Further source-supported extension on14 notes, up to.64s observed; permits up to1.2s additional with quieter pitch-evidence threshold and source RMS stop. Same-key re-strikes remain boundaries. Main sample release changes.65→1.1s only for this audition through optional validated renderer parameter; production default.65 unchanged. Clean listening gain identical to preceding candidate; distorted clip uses identical notes/holds with RMS matched to clean. No source mixed in. Assertions cover unchanged pitches/attacks/velocities, no shorter ends or new same-key crossing, finite19s render/exact10s clips and no clipping. Existing replacement/piano routing regression passed. MIDI/notes/report saved. Listening acceptance pending; piano and app guitar defaults preserved.

## 2026-10-15 — Controlled guitar patch comparison

User approved comparing available guitar patches because extensions/melody still differ from distorted source. Rendered installed Green twang, Black twang and Combo twang using the identical48 note pitches/onsets/held ends/picking velocities from the longer-sustain candidate. Both clean and distorted versions at exports/singing/guitar-patch-comparison-2026-10-15 (green-clean/distorted, black-clean/distorted, combo-clean/distorted). Each clip covers9–19s with full19s rendering context, RMS.065 subject to.9peak cap. Original isolated guitar copied alongside for reference; no source layered into recreations.

Main sampled release1.1s and the same distortion algorithm are used in all patches. Combo has two main guitar globals, so explicit-release rendering now updates both; default app release behavior is unchanged. Tests assert exact input-note persistence, finite/exact10s audio and loudness/peak bounds. Existing replacement/piano routing regression passed. This comparison changes sampled tone while holding the estimated performance constant; bends/vibrato/slides/feedback and possible transcription mistakes remain unresolved. Listening selection pending; no guitar production default changed and approved piano preserved.

## 2026-10-15 — Moderate-gain amp-style tone auditions

User supplied bright mid-gain J-Rock tone description and approved a new tone pass. Specific Ibanez/FGN/Marshall/Mesa recording claims were not verified; primary2022 Meguro AMA names a Stratocaster and Empress Heavy in a general equipment answer, not the historical recording chain (https://www.reddit.com/r/IAmA/comments/xxkws6/i_am_shoji_meguro_lead_composer_on_the_persona/). Treat gear specifics as unknown.

No local recorded cabinet IR or dedicated amp model was found. Transparent DSP approximation audition created at exports/singing/guitar-amp-tone-2026-10-15: bright-midgain.wav and source-shaped-midgain.wav, plus original-guitar.wav and previous-distortion.wav. Same Green clean48-note performance/holds/dynamics from9–19s patch comparison. Processing uses4x oversampled gentler asymmetric saturation, synthetic speaker-like midrange/rolloff FIR, and optional broad original-informed EQ bounded±6dB after removing global level offset. No source audio blended in; not a named amplifier emulation or measured cabinet response.

Tests verify silence remains silent, FIR delay compensation preserves impulse position, exact10s finite outputs, identical source note metadata, and matched.065RMS with peaks<.9. Output peaks.240/.368. Prior auditions and production defaults preserved; listening acceptance pending. Original-derived spectrum is only a broad timbre target and cannot correct missing bends/notes/playing techniques.

2026-10-15: User preferred source-shaped tone and approved subtle effects comparison. Auditions at exports/singing/guitar-effects-2026-10-15: source-shaped-dry.wav, subtle-chorus-doubling.wav and subtle-short-delay.wav, stereo10s(9–19s). Source performance/note metadata unchanged. Chorus adds12/17ms delays modulated±2ms at.6Hz, wet.12 per side. Short delay adds75ms wet.10/.075 and150ms wet.025, no feedback. Separate effects tests, not stacked; dry center retained. All RMS matched to dry and peaks capped.9, no original audio blended in. Silence/impulse timing/finite-shape checks passed, metadata copied. Ending tails trimmed to10s for comparison. These are candidate effects, not identification of the original chain; stereo headphone listening useful. No production default changes; listening acceptance pending.

## 2026-10-15 — Real NAM Marshall amp+cab audition

User authorized preparing a real NAM audition. Downloaded official NeuralAmpModelerCore and submodules into data/nam/core, built local Release/render.exe with installed MSVC/CMake. Upstream tools/CMakeLists.txt applies GCC-only -Wno-error source flags unconditionally; local compatibility patch guards all three source properties when NOT MSVC. This is a local audition runtime, not an app/global plugin installation.

Downloaded creator honkkis's JCM800 full-rig capture through the normal TONE3000 Download model → Just download tone controls: https://www.tone3000.com/tones/jcm800-with-cab-upsampled-48khz-96khz-600-epochs-5340. Copied the downloaded .nam into ignored data/nam/models/jcm800-cab.nam. Page title refers to older96k capture; actual downloaded A2 SlimmableContainer metadata declares48000Hz, gear_type full-rig, Marshall JCM800, so renderer input is resampled to48k. Both amplifier and cabinet are included; no additional cabinet approximation/IR/EQ/distortion/chorus/delay is applied. This capture is not claimed to be the original song's recording rig or moderate knob settings. Input-level sweep provides two responses from the fixed capture.

Auditions at exports/singing/guitar-nam-jcm800-2026-10-15: nam-lighter-input.wav(-6dB input), nam-normal-input.wav(0dB input), original-guitar.wav and previous-source-shaped.wav. Same Green48-note longer-sustain clean performance9–19s is fed to real NAM. Added.5s silence before/after for processing context, excluded from exports. Outputs resampled to24k and matched.065RMS with.9peak cap. Original source is not layered into NAM outputs.

Verification: official renderer build succeeded after compatibility fix; both real A2 runs returned success, valid exact-length mono output at model sample rate and finite samples. Exported clips exact10s, peaks.216/.226, no clipping. Report stores capture SHA256/metadata, input levels, output gains and method; renderer logs retained. No original files or app settings changed. Creator/platform attribution and local-only capture distribution note saved in data/nam/models/ATTRIBUTION.txt. T3K page permits outputs but restricts redistributing the model; capture remains ignored and excluded from distributable app resources. User listening acceptance pending; missing chord/bend/playing information remains separate from amp tone.

2026-10-15: User preferred real NAM tone as closer and requested missing-effects comparisons. Auditions at exports/singing/guitar-nam-effects-2026-10-15: dry.wav, small-room.wav, stereo-width.wav, short-delay.wav and original-guitar.wav. Fixed NAM normal-input baseline (user had not selected one input level; choice recorded). Independent subtle effects, not stacked: small room10%wet11–37ms early reflections/280ms decaying tail; quiet11/18ms doubles with±.7ms slow modulation; darkened85ms delay9%/7%wet and170ms quiet right echo. Dry center retained, no original blended in, same performance/note metadata. Assertions verify silence, finite/exact10s stereo and RMS matched to dry/no clipping. Tails cut at audition end for comparison. Effects are listening candidates, not verified original processing. Production defaults unchanged; user selection pending.

2026-10-15: User prefers NAM small-room effect and hears a higher-pitched original riff with low backing/sustained sound. Retain NAM+small room as leading effects candidate. Inspection of prior source detector candidates in9–19s shows40 of44 retained polyphonic candidates belowMIDI57(A3), only4 at/above57; current reconstruction still follows one estimated melody. This supports investigating register/layer coverage but does not prove the missing layer's instrument or correct pitches. Do not blindly transpose every note or assert a separate bass/guitar recording. Next proposed audit: original guitar and available bass/support stems, then independently transcribe upper lead and lower support before combining. No new audio/pitch changes or production integration made on this feedback turn.

2026-10-15: Guitar layer audit at exports/singing/guitar-layer-audit-2026-10-15, source 9–19s. Source has bass.wav separately; bass/guitar RMS ratio1.025 (separator estimates, not proof of recording identity). Exported original guitar/bass, guitar upper/lower330Hz listening bands, original guitar+bass, current NAM+small room and current+original bass. Support comparison retains source stem RMS ratio before matching complete clips to.065RMS; all exact10s, finite, peak below.9. The upper band includes harmonics and is not an independently extracted lead. Added bass is explicitly original audio, not recreated. No pitch changes or production integration; listening audit precedes upper-line transcription changes.

2026-10-15: User hears closer upper-range source and useful bass support. Controlled next audition exports/singing/guitar-upper-balance-2026-10-15 compares existing NAM+small room with brighter (45%dry+55%330Hz highpass) and upper-focused highpass, solo and with original separated bass. Same notes; no octave shifts or new transcription. Guitar levels matched before mixing; source guitar:bass RMS ratio retained, final.065RMS/peak<.9. All six exact10s stereo finite. This tests spectral balance only and does not recover missing upper notes. Original bass explicitly labelled. Production unchanged; user listening pending.

2026-10-15: User requested brighter/higher pitch without bass, recognizing bass will help later. Auditions exports/singing/guitar-brighter-higher-2026-10-15: brighter-plus-2/5/12.wav. Same48-note source-derived timing, velocities and extended holds; transpose MIDI before Green SFZ synthesis, then real NAM normal-level capture, preferred small room and45%dry/55%330Hz upper-range blend. No bass or original layered in. All exact10s stereo finite, level matched. Pitch variants are listening experiments, not verified correction to original melody. App defaults unchanged; results/report/logs retained.

2026-10-15: Integrated approved brighter +2 / small-room NAM guitar as separate replacement guitar-bright-room, labelled Bright room guitar · NAM · +2 in Cover Builder and Edit tracks. Existing clean/distorted and library sounds retain their routes. New route forces Karoryfer Green SFZ, source-supported two-stage holds (.45s then1.2s), source dynamics15–100,1.1s release,+2 semitones, actual local NAM JCM800 full-rig capture,10%small room and45%dry/55%330Hz upper balance. No bass added automatically; existing mix controls govern bass. App instrument pipeline is mono: room channels averaged before brighter balance, unlike stereo auditions. Input/output levels normalized over selected excerpt, so loudness can differ from normalized9–19s listening examples. MIDI exports shifted notes; detection remains estimated and no cleaner transcription promised.

Local NAM renderer/capture are required; actionable missing-setup error before transcription. Capture remains local and not redistributed; NAM attribution copied into generated replacement output alongside instrument attribution. Native style/stem allowlists, frontend persistence, builder dropdown and review/save validation include the new option. Resource mapping already bundles arrangement_replacement.py; no new runtime script required.

Verification: frontend179 tests,177passed2optional skipped; native65passed; production build and local native build successful. Updated replacement backup persistence test passed; null/empty companion-stem regression and missing-NAM preflight passed. Actual source19s render produced48 finite notes with +2 MIDI, exact456000 samples and peak<.901. Integration-check output at exports/singing/bright-room-integration-check (audition only). Manual checks pending: new option in both menus; solo preview without bass; checked preview/save follows choice; reopen saved mix retains metadata, existing clean/distorted remain selectable.

2026-10-15: Added three additional NAM guitar replacement categories in Cover Builder and Edit tracks: Warm crunch (guitar-nam-warm), Rock rhythm (guitar-nam-rhythm), Sustained lead (guitar-nam-lead). Available local capture remains honkkis JCM800 full-rig48k; these are voicing/performance/effect presets of that one capture, not new amp captures or sax/piano/bass instrument models. Warm:0 pitch shift,-6dB input,.85s release,no upper boost,8%room. Rhythm:0shift,normal input,.65s release,20%upper balance,4%room. Lead:0shift,normal input,1.25s release,35%upper balance,10%room,8%dark85msdelay. Existing approved Bright room +2 parameters unchanged. No new downloads, no automatic bass. Local capture excluded from redistribution; output attribution included for every NAM variant. All preserve the estimated underlying melody; no improved transcription claimed.

Native/Python style routing, replacement dropdowns, readable saved-stem labels, save filtering and backup validation support all variants. Missing local NAM assets reject before transcription for all four. Test results: frontend178passed/2optional skipped(180total), native65passed, builds successful. Direct/null-stem regression passed. Real renderer verified all four on19s source: exact finite mono output, no clipping,10s9–19s auditions in exports/singing/nam-guitar-categories-2026-10-15. Waveforms distinct with pairwise RMS difference>.001; Bright room matches previous integration result within one PCM16 step. Manual listening/preview/save checks pending user availability.

2026-10-15: Cover Builder now offers Preview detected notes (drums: Preview detected hits) under Original instrument, plus Preview original recording. Per-track start/duration defaults0–15s and validates1–60s within source length before launch. Uses originalPath and selected source role through existing arrangement pipeline, rendering melodic interpretations with the same separate-library piano sound for comparison; Piano uses approved71-note preserving path, Other/melody uses estimated single line. Drums use standard kit. Loads only requested instrument stem into shared player, not vocal/mix; no change to track.path, applied replacement, original file or pending replacement candidate. Native poll/stop flow reused. These are rendered interpretations rather than isolated source instruments or a replacement-tone preview.

Verification: production build passed, frontend178passed2optional skipped. Real15s prepared-piano check produced71notes in Piano mode and25notes in Other/melody, exact finite360000samples each. Exports at exports/singing/detected-notes-preview-check. No native implementation change. Manual checks: compare same section under Piano/Other; original recording plays solo; applied replacement stays unchanged; invalid preview bounds reject before generation.

2026-10-15: Added Whole song detected-note preview in Cover Builder. Source is rendered in contiguous evenly sized1–60s sections then combined into one seekable audio preview. Default short preview remains15s; Whole song disables section controls. Validation before work rejects invalid/nonfinite/out-of-source ranges; bounded1s–1h source supported. Sectioned transcription can differ at boundaries; holds stop at section ends. Preview is an audition only, no automatic apply or library entry.

Added Instrument customizer to melodic replacement choices: pitch -12..+12 whole semitones and extra note hold0..1.5s, Reset to preset. Pitch edits rendered notes before synthesis/NAM, not a post-audio speed change. NAM pitch is an absolute override of preset register (Bright room defaults+2, can now set0); other instrument options retain their existing automatic register placement plus chosen semitone offset. Hold extends until next same-pitch attack/section end, retaining overlaps across different pitches; sample decay still limits sustain. Native and Python validate settings before processing. Drums hide melodic controls and reject nonzero tuning. Detected-note previews remain untuned source-method comparisons. Existing presets retained as shortcuts; no category migration/removal.

Settings travel with the generated preview candidate and only persist on Use replacement. Applied track.custom survives builder library saves/backups; reopening restores selected applied replacement and settings. Pitch/hold or replacement changes invalidate pending candidate. Keep original recording safe; Restore original clears applied custom metadata. Old tracks without settings keep prior preset defaults. Piano approved dynamics/timing chain unchanged at default; NAM profile defaults copied before override, never mutated.

Verification: frontend180passed2optional skipped(182total), native66passed, production build successful. Regression checks cover invalid tuning (native/Python), hold boundaries and input immutability, saved settings and defaults, whole-song288s contiguous bounded coverage and invalid excerpts. Real prepared-piano15s render retains71notes with+2MIDI and extended ends; NAM19s render honors pitch0 override of+2, finite exact-length output and defaults unchanged. First new test failed on cross-VM object prototypes, fixed test comparison to use serialized values; no runtime failure. Native build/resource refresh completed. Manual tests pending: whole song scrub late section; Piano/Other same-section comparison; pitch/hold generate then apply; reopen saved builder and reset/restore.
