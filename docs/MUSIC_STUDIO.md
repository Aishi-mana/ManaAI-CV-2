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
