# Mana changelog

## Local picture generation — 2026-10-19

User chose installed stable-diffusion.cpp and requested standalone NetaYume, checkpoints at C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Shared/models/checkpoints. Added More → Create picture: checkpoint picker, prompt/negative, size/steps/guidance/seed, GPU/CPU option, manual Generate/Stop, preview and Save to existing image library. Native scans safetensor headers (no weights loaded during discovery), supports SD1/SDXL via C:/AI/stable-diffusion.cpp/build/bin/Release/sd-cli.exe and all-in-one Lumina2/Gemma NetaYume via installed Comfy Python tensor/conditioning libraries. Neta runs headlessly in one owned Python job; no ComfyUI window/server/custom nodes or downloads. Unsupported architectures (Flux/HiDream etc) disabled. Uses existing Comfy .venv Python; other image-generator repository/installed environments are unmodified. Each job exits/releases models; cancellation/close/app exit terminate only Mana-owned process tree, scoped job IDs protect replacement jobs. Models are never copied. Originals/JPEG previews, request and generation metadata saved in exports/images/image-*; explicit library Save stores a prepared JPEG in existing images backup key. No automatic avatar/self-recognition labels. UI suppresses idle/journal model work while open. Tests: both SD and Neta completed one128x128/one-step CPU connection check, not quality approval; Neta import preflight also passed. Native request/header tests passed. Live normal-resolution generation/save/Stop acceptance pending.

## Random morning/night outfit pools — 2026-10-19

User passed seasonal setup and requested random looks from user-set pools each morning/night. Added Wardrobe → Daily looks, opt-in enable, separate snapshot pools (max20 distinct combinations each), current-look/saved-look additions, removal and editable08:00/20:00 defaults in journal timezone. Scheduler checks once/minute and on resume/startup when visible/assets ready/persistence healthy, paused in wardrobe/background picker. Chooses latest due period only, remembers date:slot/choice/time in existing avatar config; no repeated reroll on reopen or missed-period replay, clock rollback guarded. Pools skip unavailable/locked items; empty pool retains current look. Prefer a different current combination when possible; one eligible look is allowed. No model/image generation, seasonal auto-switching or work while app closed. Background/view/seasonal settings and pool snapshots preserved. Pool additions do not change appearance until scheduler enabled and wardrobe closed. Tests255 passed,2 optional skipped. Live schedule acceptance pending.

## Seasonal look setup without new artwork — 2026-10-19

User requested seasonal outfits but has no new outfit assets. Confirmed only default outfit is currently installed. Added Wardrobe → Seasons: assign current look or a named saved look to spring/summer/autumn/winter, manually Apply, and clear assignments. Assignment is a snapshot of skin/outfit/hair/accessories; it does not change current clothes. Northern/southern calendar selector and current-season badge use journal timezone and explicit month labels (not assumed weather). No automatic selection or outfit switching. Existing defaults can be placeholders until actual new artwork is installed. Missing/locked selections apply safe defaults while preserving the assigned snapshot for later. View/background stay unchanged. Seasons/calendar persist in existing avatar config/backups and survive wardrobe resolution. No image/model generation or new asset files. Validation:252 tests passed,2 optional skipped. Live seasonal-setup acceptance pending; additional seasonal clothing artwork remains future work.

## Avatar backgrounds — 2026-10-19

Added Backgrounds control beside avatar view/Wardrobe buttons. Picker offers Original, Cozy room, Garden, Sunset and Starlight as fixed code-native SVG scenes, plus an optional local PNG/JPEG/WebP picture. Background fills only avatar area, separate from character zoom/blink/idle; chat/name text stays unchanged. Selection/custom image persist in existing avatar config and normal backups, survive wardrobe resolution/view changes; saved looks retain current background. Imports use temporary object URLs, bound input10MB/25MP, resize to1600px max dimension, encode JPEG <=450K chars, revoke URL; originals untouched, no external paths/network. Invalid or missing custom data falls back to Original. Remove saved picture supported. Background picker suppresses idle initiative while open. Game toolkit/star-placement acceptance recorded previously; no new game work. No AI generation used. Tests:249 passed,2 optional skipped; live background visual/reopen acceptance pending.

## Visual collectible-star placement — 2026-10-19

User passed combined game, noted missing star placement. Added Star brush/visible star cells for star-aware projects, drag painting, erase/floor removal and existing stroke undo/redo. Wall/spawn/goal replacement removes the star in that cell; stars cannot overlap spawn/goal. level.json now owns up to32 unique open-cell stars; route check requires goal and every star reachable. Combined game reads level.stars rather than fixed coordinates. New complete example includes its original three positions in JSON. Existing known combined projects offer Enable star placements, narrowly replacing the legacy coordinate expression and adding defaults while preserving modules/assets/custom level edits; no reload needed. Plain maze projects do not advertise unsupported star brush. Automated tests cover UI placement/undo, validation/routes, legacy upgrade and edited pickups in actual worker. No model generation used. Validation: 247 tests passed, 2 optional skipped. Live star-placement acceptance pending.

## Combined small-game milestone check — 2026-10-19

User passed visual level editing. Added Load complete game (Star maze) combining main.js/player.js modules, level.json visual editing, animation.json, existing character sheet/chime, menu/theme/reset buttons, wall collision, three collectible stars, goal/restart and persistent best/wins/unlock flag/theme. No generated assets or model calls. Automated real-worker route collects all three stars, wins with score50, saves progress, reboots with restored best/wins/theme, preserves progress through reset, and roundtrips normal backup. Edited level preserves all four files/two assets; standalone HTML includes source/assets and stays under250KB. The unlock value is a demonstrated progress flag; only one map is bundled. Load complete game is separate from individual examples. Validation: 245 tests passed, 2 optional skipped. Full small-game toolkit live milestone remains pending this combined test, not claimed accepted or broad V1 complete.

## Visual maze level editor — 2026-10-19

User passed saved-progress demo. Added visual editor alongside compatible maze level.json: Wall, Erase/floor, Spawn, Goal brushes; click/drag or keyboard button activation; 50-step stroke undo/redo; explicit Apply and Discard. Painting protects spawn/goal from walls and moves markers onto cleared cells. Structural validator requires rectangular #/. rows, <=256 cells, 16–64px tiles fitting canvas, valid spawn/goal, speed1–1000. Path check blocks Apply if goal unreachable. Local drafts do not alter executable source until Apply, which replaces only level.json and retains other files/assets/unknown level metadata. Existing Save version/backups/exports retain applied edits. Unsupported JSON gets explanatory text rather than rewritten. Editing disabled during run/generation/check. No visual resizing or general scene editor implied. No AI generation used. Validation: 243 tests passed, 2 optional skipped. Live visual-editor acceptance pending.

## Saved game progress — 2026-10-19

User passed maze/collision/goal/reset. Added api.loadProgress(defaultObject), api.saveProgress(object), api.progressStatus ready/pending/saved/error. Progress is bounded JSON (4096 chars, depth8, 64 entries per container, 256-char strings); host validates and limits writes, no worker filesystem/storage access. Mana stores up to 100 game scopes inside existing code_games backup section. Saved versions share rootId progress; draft source has deterministic scope; saving copies current progress to saved family. Library commits preserve live progress. Host acknowledges after persistence flush/error check. Smoke checks start from defaults and reject saves without writing. Offline exports use scoped browser localStorage, separate from Mana, with failure acknowledgement; file URL/private-browser storage behavior varies. Exported saved versions use root scope. Load progress example demonstrates best score, level unlock, theme, reset and visible save status. No model generation used. Validation: 240 tests passed, 2 optional skipped. Live progress acceptance pending.

## Tile maps and solid collision — 2026-10-19

User passed sprite animations. Added pure bounded tile tools serialized into the isolated worker: api.tileMap(rows,size,ox,oy), map.draw(color), map.move(box,dx,dy) returning a new box with hitX/hitY, and api.overlaps(a,b). # cells and outer map edges are solid. Movement sweeps X then Y to prevent tunnelling and allow wall sliding; initial boxes must fit clear of walls. Rectangular ASCII maps max 256 cells/32 per side, sizes 1–64. Drawing merges contiguous horizontal walls within existing command limits. No gravity/physics engine is implied; games may apply gravity to dy. Load maze example includes editable level.json (rows, spawn, goal, speed), arrows, goal detection and Space edge reset. Same fixed worker works in exports; save/report/backup retain full level. Model instructions include helpers. No AI generation used. Validation: 237 tests passed, 2 optional skipped. Live maze acceptance pending.

## Sprite-sheet animation — 2026-10-19

User passed mouse controls/buttons/menus/scoring. Added api.sprite(name,sx,sy,sw,sh,x,y,w,h) for cropped sheet frames and api.animationFrame(seconds,fps,count,loop=true) for looping or one-shot indices. Source rectangles require integer pixels and positive sizes, max 2048 sheet envelope; renderer also checks decoded sheet bounds. Pixel scaling disables smoothing for each sprite and restores it afterwards. Shared Mana/export renderer supports the same command; smoke checks validate sprite asset names/types. Model instructions include the API. Load sprite example has an embedded small code-drawn PNG, main.js and editable animation.json for idle/walk/react clips. Arrows walk, release idles, Space edge plays a one-shot reaction. Existing project saves/reports/backups/exports retain the sheet/config without extra storage keys. No AI generation used. Validation: 234 tests passed, 2 optional skipped; live sprite acceptance pending.

## Mouse controls and canvas buttons — 2026-10-19

User passed game image movement/sound asset demo. Added shared primary-pointer input for Mana and offline HTML games: scaled 480x280 x/y, inside, down, clicked/released pulses. Quick presses between frames remain queued until an input tick. Blur/cancel/stop clears input; pointer listeners are removed on stop/close. Worker supplies third onFrame argument and api.mouse; api.button(label,x,y,w,h) draws a hover button and returns a primary-press hit. Old two-argument callbacks remain compatible. Load mouse example demonstrates Start/menu buttons, aiming crosshair and click-target scoring. Host run report detail counts pointer-click pulses sent (not gameplay proof). Smoke checks include two simulated pointer presses. Model instructions include the new API. No model generation used. Tests: 230 passed, 2 optional skipped. Live mouse/button acceptance pending.

## Game image and sound assets — 2026-10-19

User accepted multi-file projects and editing level.json. Added import/remove/preview for PNG/JPEG and WAV/MP3, api.image(name,x,y,width,height), api.sound(name,volume), plus Load asset example (move yellow image with arrows; Space chime). Assets are embedded in canonical project source, retained by versions/run evidence/backups/HTML exports; no external paths/network. Up to 8 assets, 80,000 encoded characters combined (about 60 KB), 2048px images, 10s sounds. Code files remain 12/12,000 content characters; canonical projects may exceed 16K under a 180K envelope. Ordinary scripts stay at 16K. Native HTML export limit remains 250KB. Sounds are throttled to 250ms per name and 4 voices; Stop/hidden/close silence gameplay audio. Import decoding validates dimensions/duration without playing. Smoke checks validate referenced names/types but do not decode or play media. Project revision prompts include asset names, exclude binary data; App preserves existing assets after model output. No AI generation used. Validation: 227 tests passed, 2 optional skipped; frontend and native builds passed. New asset live acceptance pending.

## 2026-10-19 — Multi-file game projects

Added local JS/JSON project files, file tabs, project example and complete-project drafts/revisions. Existing saves, reports, backups and exports preserve full projects. Single-file compatibility retained. Live acceptance pending.

## Coding evidence and playable export accepted — 2026-10-19

User explicitly confirms coding evidence and export games both passed. Mark More → Skills coding-review workflow and standalone playable HTML export as live accepted for current scope. Previous skill-test deferral is resolved. Current game saving/report/revision foundation already accepted; broader multi-file coding and independent correctness assessment remain open. Do not repeat these manual checks or generate new examples absent a new issue.

## Standalone playable game export — 2026-10-19

User deferred coding skill live test and chose more coding/game tools. Added Export playable game to standalone Code playground (current editor source; allowed only while idle). Generates a self-contained HTML page with fixed Run/Stop/canvas/log/source UI, no app/chat/report data. Source is compile-checked and embedded as escaped JSON, title HTML-escaped; script-closing strings remain inert data. Exported page uses same opaque iframe/worker protocol, validated drawings, host watchdog, two-minute limit and hide/Stop cleanup. No user code runs before explicit Run; browser results do not feed Mana reports or skills. Native export_game writes unique create_new .html files under exports/games, bounded250KB; no user-selected path or overwrite. UI exposes selectable full saved path.

Generated exports/games/Star-collector-demo.html for direct user check without models.222 frontend tests passed/2 optional skipped; frontend/native builds passed; native export Unicode/nonoverwrite/size test passed. Export test parses/executes trusted bootstrap in mocked DOM, verifies escaping, no autorun, opaque frame, source message origin, input and Stop. Real standalone browser CSP/worker/render behavior remains user check pending (prior automation gate unresolved). Skill review remains explicitly deferred, not accepted. Next user test: load saved game → Export playable game → open HTML in browser → Run/arrows/Stop.

## Reviewed coding skill evidence foundation — 2026-10-19

User requested skill progress linked to games/reports. Added Coding evidence inside More → Skills: explicit review of movement, persistent state, scoring, restart and power-up behavior using exact-source saved game and reviewed manual report. Smoke/not-assessed/zero-frame reports excluded. Demonstrated results need Worked + normal end, with arrow/Space input for movement/restart. Needs-work can record reviewed failure. Written observation and confirmation required in UI; one review per report/check. Latest review per criterion drives summary, preserving history. This is user-assessed example evidence, not general competence, automatic mastery or model training. Ordinary practice count stages remain separate; no stats/goals/wardrobe changes.

Optional assessment snapshots inside existing mana.skills.v1 persist source code/game/version/run/observation through deletion, restart and backups; old records compatible.50 assessments within200 shared skill records, no pruning. Ordinary relevant skill/coding reply context gets bounded assessment summaries, not full code. See SKILLS.md.221 frontend tests passed/2 optional skipped; frontend/native builds passed. Tests cover eligibility, mismatch/smoke rejection, duplicate/key requirements, summary changes, practice separation and backup/delete survival. No model generation/browser automation. Next user test: choose saved Worked manual report in Skills → Coding evidence, review one behavior, save and check after reopening/restart. Live acceptance pending.

## Automatic game smoke checks implemented — 2026-10-19

User authorized automatic startup/frame/input checks. New gameSmoke.ts runs compile-checked source in existing opaque-frame worker, sends92 frames at simulated dt1/30: idle, four arrow directions, Space and release. Host validates drawing/log messages without rendering to active canvas. Runtime/invalid output/no drawings/timeouts fail; no drawing changes is a warning only. Setup/frame deadlines and8s total host budget, Stop/cancel/hidden cleanup; no shell/files/network expansion. Draft generation now performs check after syntax validation before replacing current editor source. Failure preserves previous source and rejected draft, exposes failed exact-source report; no automatic model retry. Passing check does not verify gameplay or imply full interactive run.

Manual Check game / Stop check in saved-game playground uses current source without model inference. Results enter explicit review/save report flow with optional checkKind=smoke metadata, default user assessment not-reviewed; label persists through backups and revision prompts. Save/discard pending report before new generation prevents losing feedback.219 frontend tests passed/2 skipped; frontend/native builds passed. Tests exercise actual example worker over mocked iframe transport, static-output warning, runtime failure, blank output, foreign-message rejection, stalls/abort cleanup and smoke-report backup metadata. Existing user-tested sandbox retained. No model generation or browser automation used. Live user check pending: load saved game → Check game → review/save smoke report; future draft/revision checked automatically.

## Saved game workflow accepted; incomplete power-up revision repaired — 2026-10-19

User passed save/restart/report/revision workflow checks1–4, but generated power-up revision failed at0 frames with SyntaxError Unexpected token ). Read app SQLite game key read-only: only workingv1 plus895-frame29.7s report saved; no broken revision persisted. User supplied source ends mid api.onFrame before player draw/closing brace and changes const speed; boost state also did not persist correctly. Shared streamChat used max_tokens700. Added bounded optional maxTokens; game drafts/revisions now2000 only, other callers retain700. Strict game requests reject finish_reason length or missing finish completion; no automatic retry. Generated source undergoes compile-only new Function syntax check without invocation before replacing editor source. Rejected draft retained visibly for review while previous source stays. Canvas clears at each Run so prior game's image does not masquerade as current output.

Added Load power-up example with repaired persistent5s boost and independent shield glow/reset/drawing. No hazards exist, so UI explicitly calls shield cosmetic glow. Corrected source exports/code-playground/collect-stars-powerups-fixed.js; saved userv1 unchanged.217 frontend tests passed/2 optional skipped; frontend/native builds passed. New tests cover no execution during syntax check, invalid draft leaving source intact, scoped output budget+truncation rejection, and boost persistence/expiry. No model call or generated retry used. Live repaired power-up/new draft quality pending; accepted persistence/report infrastructure remains passed.

## Saved game versions, run reports and report-based revisions — 2026-10-19

Implemented in More → Code playground. Manual Save as new game / Save new version retains immutable source versions;50 versions total. Stop-run report captures exact source, start/end, host frames/time/keys, end reason/detail and30 recent game-reported logs. User chooses result and writes feedback before explicit Save run report;100 reports max. No pruning or auto goals/skills. Reports link to version only for exact source and keep snapshot after version deletion. Unsaved report/source limitations stated; new run asks before replacing pending report. Revision button uses current source plus up to3 exact-source matching reports, distinguishing measured activity, game-provided text and user assessment. Generation shares existing lock/Stop; new source never autoruns and needs Save new version. Temporary Goals artifact runner directs to standalone saving/report workflow.

New validated mana.code_games.v1 SQLite key registered; backup validators/default for older backups and count preview updated.214 frontend tests passed/2 skipped; native SQLite reopen/deletion test passed; frontend/native builds passed. Tests include versions, source/report mismatch, backup migration, retained snapshots, invalid metrics, revision evidence exclusion and real host snapshot/frame/key/log capture with mocked transport. No new model generation or browser use. Existing live runner accepted; new save/restart/report/revision workflow awaits user check. Details CODE_PLAYGROUND.md. Next user test: Save game → Run/Stop → add feedback+Save report → reopen/restart+load → Draft revision from reports → Save new version+Run; old version stays available.

## Code playground live checks 1–4 accepted — 2026-10-19

User confirms perfect, it works now; tests1–4 passed after frame-state repair. Accept current V1.x playground foundation: Run, keyboard movement, Stop and repaired playable game workflow. First model draft failed due to per-frame state initialization; stronger prompt/example implemented, but this acceptance does not establish correctness of arbitrary future generated games. No further generation or repeated tests needed absent new issue. Source/logs remain session-only; broader projects, saved execution evidence, skill progression and stronger resource isolation stay open.

## Generated game state reset repaired — 2026-10-19

User passed Code playground Run/movement/Stop (checks1–3). First generated game drew but player did not move. User supplied full source: score, x/y and20 random stars were initialized inside api.onFrame, resetting every tick. Saved exact supplied reproduction as tests/fixtures/game-reset-every-frame.js. Repaired same20-star game with top-level state/init, dt-based movement, canvas bounds, non-mutating-length star replacement and Space press-edge restart. Repaired source at exports/code-playground/collect-stars-fixed.js; Load example now loads it, giving user direct no-generation access. Existing in-session draft is not silently overwritten; user presses Load example. Future model request adds explicit state-lifetime/reset guidance plus the tested complete example; this is prompt guidance, not proof every future generated game is playable.

Four sandbox tests passed, now including actual original snap-back reproduction versus repaired persistent movement, score retention, held reset and boundaries; bootstrap/watchdog checks still pass. Frontend/native builds passed. No model call or new generated draft. Live repaired game check pending. Previous full suite212 passed/2 skipped remains baseline; focused tests rerun for this repair.

## JavaScript code playground implemented — 2026-10-19

User authorized code sandbox then small runnable game. Added More → Code playground with editable JavaScript, built-in star collector, explicit Run/Stop, canvas and bounded logs, API help and model-assisted Draft game using existing shared generation lock/cancel. Generated source never autoruns; failed/stopped draft keeps previous source. Standalone source survives panel reopen only during current app session; no new persistence key. Saved code artifacts offer temporary game runner without changing artifact content. Worker runs inside opaque-origin sandbox iframe with restrictive CSP; host watchdog stops nonresponses and two-minute sessions; closing/hiding/collapsing terminates execution. No shell/filesystem/Tauri bridge given to game. No hard memory quota or blanket hostile-code guarantee. Saved goals/skills/verified run history remain unchanged. Corrected capability grounding to describe manual playground and existing saved music playback.

Validation:212 frontend tests passed/2 optional skipped; frontend/native builds passed. Four new tests cover worker/bootstrap source, example movement/scoring, error/output bounds, VM loop interruption and mocked host watchdog/cleanup/message source checks;11 focused capability/sandbox checks passed after grounding update. Actual WebView2 game Run/keys/Stop and optional model Draft game need user check. Browser gate from prior usage block remains unresolved; no browser bypass or model generation used. See CODE_PLAYGROUND.md for exact scope and live test. Current next: open More → Code playground → Run game → arrows → Stop; then optionally Draft game and manually Run.

## User-confirmed avatar image identity — 2026-10-18

Existing two-image avatar resemblance foundation was already accepted on 2026-10-10; do not repeat or claim a new vision model. Added opt-in This image depicts Mana (my confirmation) checkbox per image in More → Saved images. Optional depictsAvatar=true survives validation, deduplication/restart/backups; unchecking removes it. Fresh inspection of identical saved pixels snapshots userConfirmedAvatar=true into chat report. Final chat context acknowledges user-supplied identity while preserving reported visual uncertainty and explicitly avoiding authorship/shared-event claims. Unlabeled attachments retain existing cautious comparison; filenames/model guesses never set label. ImageReportView displays confirmation provenance. Labels do not automatically recognize new/different artwork, and old reports are historical snapshots. Reuse via existing chat Use image again action; no inference from merely checking the label.

Validation: frontend suite208 passed/2 optional skipped; frontend/native builds passed. New regression covers label backup roundtrip, exact-pixel dedupe with renamed filename, strict true validation, removal, report persistence, prompt grounding and absence of pixels in text chat payload. No model inference/download during implementation. Live test pending: attach image → label saved copy → Use image again → ask who it depicts; compare unlabeled image. Browser visual verification remains unavailable under prior usage gate. Broader automatic self-recognition/direct multimodal/provenance work remains open.

## Greeting and song recognition retest passed — 2026-10-18

After confirming recognition hints and both connected hums are wired into Mana, user confirms the requested live Hi Mana / Sing Sora checks are already done. Treat greeting/song-vocabulary hint retest as passed for this scope. Hands-free conversation, named songs, post-song listening resume and Stop already accepted. Both connected hums installed from user-selected candidates. No more voice/music generation or repeated checks needed absent a new issue. Recognition remains probabilistic; this is acceptance of tested phrases, not universal accuracy.

## Connected Sunny little hum accepted and installed — 2026-10-18

User selected the connected Sunny version. Installed humming-bright-connected-audition/bright-hum-connected.wav as musical-moments/bright-hum.wav, verified identical hashes; manifest duration4.59755s, source/revision and listening approval updated. Previous active clip retained as bright-hum-before-connected.wav. Both active hums now use user-selected connected phrasing; existing playback/request/initiative routes unchanged. No extra inference or build needed.

## Connected Soft little hum selected and installed — 2026-10-18

User prefers the previous connected candidate over the subsequent warmer EQ version. Installed exports/singing/humming-connected-audition/soft-hum-connected.wav as musical-moments/soft-hum.wav; hashes verified equal, manifest duration5.0039s and listening approval updated. Old soft hum retained as soft-hum-before-connected.wav. Existing soft-hum playback route now uses selected candidate in previews/requests/initiative. Sunny little hum unchanged. User described connected candidate as better with slight robotic quality; do not claim complete naturalness. No extra inference or build needed for external audio replacement.

## Greeting recognition hints — 2026-10-18

User reports Hi recognized as Ai. Added Hi, Hello, Hey, Good morning/afternoon/evening and How are you to Whisper vocabulary hints alongside names/song vocabulary. No forced AI-to-Hi replacement; ordinary transcripts remain unchanged. Existing 440-byte total bound retained. Frontend/native builds and vocabulary regression test passed; real greeting accuracy awaits user check.

## Song vocabulary hints for microphone recognition — 2026-10-18

User screenshots show repeated sing→Xing/Singh/Shing/Sin and Trails→Rails misrecognition; correctly recognized Sing Sora successfully plays configured song. Whisper previously received only character/user names. Added recognitionPrompt vocabulary context with sing/hum and current enabled Chat clip titles/aliases, prioritizing aliases per entry, deduplicating and bounding whole prompt to 440 UTF-8 bytes under native 500-byte cap. useWhisper receives live vocabulary via ref; regular transcript text remains unchanged, with no forced spelling replacements or fuzzy song playback. This may improve decoding but actual microphone accuracy needs user retest. No larger model, download, synthetic generation or extra recognition pass. Frontend/native builds and 10 focused recognition/noise/cancellation/parser checks passed, including multilingual byte bounds. Repeated-reply errors in screenshots are downstream chat failures after misrecognized commands, not evidence of microphone failure cause. Chat UI polish is visible in screenshots; no further layout request.

## Chat voice controls polish — 2026-10-18

Grouped hands-free and manual recording actions. During hands-free, hide manual recording/settings buttons and duplicate top Stop voice; primary Stop hands-free remains. Manual playback keeps Stop voice/Stop song. Renamed top Voice to Voice settings and lower Voice input to Input settings. Added textual state badge with distinct listening, speaking/music, work and error styling, plus compact meter and responsive wrapping. Recognition/playback behavior unchanged. Completed stale supported Music Studio roadmap entries and added accepted karaoke/hands-free song requests; deferred fine-tuning/high-note work stays open. Production frontend/native builds and 15 focused voice regression checks passed. Browser visual verification unavailable under prior usage gate; user layout acceptance pending.

## Hands-free song playback accepted — 2026-10-18

User confirms Mana can sing from hands-free requests. Screenshot shows successful saved-song playback notes for Trails v3 (Whereabout of the Stars v3) and Reach Out to the Truth, with Hands-free: playing song status. Spoken request routing and song playback accepted. Misrecognized phrases remain a speech-recognition limitation; exact enabled titles/aliases still apply. User subsequently confirms both remaining live checks passed: listening resumes after the song finishes, and Stop hands-free stops playback mid-song. Hands-free song-request workflow is fully accepted for this scope. No further generation or tuning needed.

## Hands-free song requests connected — 2026-10-18

User passed ordinary hands-free conversation, then screenshots confirmed song requests went to ordinary chat and were repeated instead of played. ChatPanel now intercepts recognized musical commands before onSend, resolves enabled saved Chat clips by exact normalized title/alias and plays existing audio through shared voice playback. Accepts character address and dictation commas (e.g. Mana, sing Trails / Sing, Reach Out to the Truth). No fuzzy guesses for misrecognized titles such as Sting trails; add aliases in Chat clips for short names. Generic sing/hum requests use existing selection. Unknown songs report available titles and stop hands-free with visible feedback instead of inventing a rendition.

Dedicated loading/playing song phases keep microphone closed and bypass only the hands-free music-stop guard; spontaneous music remains blocked. Playback completion uses existing cooldown before capture resumes. Stop/hidden app/error handling preserved; session counter suppresses obsolete completion callbacks. Successful requests use existing user-message/music-note history and replay path. No song generation or transcription model changes.

Validation: production frontend and native debug builds passed; 206 frontend tests passed, 2 optional skipped. New command parsing tests cover named address, punctuation, aliases, ordinary sentences and rejected misheard titles; existing cancellation/noise tests pass. Live song request/playback/resume and Stop during song await user check; browser verification remains unavailable under prior usage gate.

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

2026-10-18: User accepted separate Studio screens. Menu reordered: Song Player → Create Cover → Cover Builder → Original Song → Edit Tracks → Chat Clips. Default screen unchanged.

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


## 2026-10-11 — Reviewed excerpts from finished covers

Added 1–30 second WAV excerpt extraction without voice reconversion. Existing listen/approve/title workflow gates chat-pool inclusion; full covers remain unchanged. Compact-pool appearance was user approved. Excerpt manual acceptance is pending.

## 2026-10-11 — Compact chat song pool (unreleased)

- Replaced tall pool cards with searchable library-style rows, linked album thumbnails, expandable aliases and icon actions with tooltips/accessibility labels. Long lists scroll within the pool.
- User confirmed Music Studio acceptance tests 1–4 passed. The new pool appearance still needs a desktop visual check.

## 2026-10-11 — Full-size pastel Music Studio (unreleased)

- More → Songs opens a full-size main view with saved-cover discovery, searchable library, album artwork, mix/vocal/instrument player, seeking and volume. The existing whole-song/excerpt cover workflow and reviewed chat pool remain available.
- Projects retain settings, truthful completion/interruption status and duration. Metadata/artwork use existing backups; audio remains external. Returning to chat preserves form/selection and pauses playback; pending conversion continues.
- Stage 1 is implemented; reviewed excerpt extraction without reconversion and new arrangements/original songs remain pending. See [Music Studio](MUSIC_STUDIO.md).
- Production build passed; 166 frontend and 57 Rust tests passed (two optional live checks skipped). Browser layout checks covered standard and minimum-window layouts; desktop manual acceptance remains pending.

## 2026-10-11 — Whole-song covers (unreleased)

- Songs offers Whole song, converting uploaded audio from beginning to end without the 60-second excerpt limit. Excerpt controls are disabled in this mode, and Stop/Close still cancel processing.
- Full covers can be auditioned; the chat pool remains limited to approved 1–30 second excerpts. Preview reads support generated WAVs up to 256 MB. Whole-song processing has a two-hour timeout.
- A real 61.25-second guide conversion preserved the complete output duration while ignoring five-second excerpt settings. Production build and 55 Rust checks passed; manual full-cover review remains pending. Trembling quality work remains unresolved.

## 2026-10-11 — Songs menu and named short songs (unreleased)

- More → Songs now manages a persistent approved short-song pool with titles, aliases, enabled switches, audition and removal. Uploaded guides can be converted with adjustable original-backing volume; only listened-to, explicitly approved 1–30 second clips enter the pool.
- Typed named-song requests play matching enabled clips; unavailable songs get suggestions from the real pool. Generic requests and musical initiative select enabled songs. Existing backups migrate the starter cover metadata without embedding audio.
- See [Songs](SONGS.md) for workflow, limits and manual checks.
- Validation: production build, 164 frontend tests and 55 Rust tests passed; two optional live tests skipped. Manual menu checks remain pending.

## 2026-10-11 — Voice startup and musical replay (unreleased)

- GPT-SoVITS loads on app opening when custom voice is selected, and when switching to it. Existing services are reused; setup's manual Start shares the same startup operation.
- Humming/song chat notes show Replay and play their clip instead of speaking the descriptive note. Both vocal-only hums passed listening review; the wordless song remains provisional.
- Production build passed; 162 frontend tests passed and two optional live checks were skipped.

User-facing changes to the current Rust/Tauri and React/TypeScript Mana.
Started 2026-10-09, retrospectively from project docs, available chat evidence and
Git history. This is a substantial development record, not a complete transcript.
Dates below identify known development sessions, not packaged release dates.
Unreleased changes must not be mistaken for committed or shipped releases.

## Unreleased — current development

### Voice delivery selection acceptance — 2026-10-10

- User passed revised cheerful and gentle, completing approval of all four delivery selections. Runtime presets and exact transcript checks remain pending; active settings were not changed.

### Longer voice reference candidates — 2026-10-10

- Recorded approval of short style auditions and prepared four 7–9 second review references. Default rebuilt from the unclipped original phrase; cheerful/thoughtful use continuous separated excerpts, gentle uses a small phrase assembly.
- Preserved previous baseline and source comparisons; active settings remain unchanged. Longer candidates require listening/transcript checks before adoption.

### Voice reference collection review — 2026-10-10

- Prepared provisional labels, draft Japanese transcripts and four short audition references for the user-supplied collection; original files and runtime settings remain unchanged. Final style/speaker/transcript approval and selective cleanup are pending listening review.
- Recorded corrected feedback: conversion speed is acceptable without the concurrent ComfyUI workload; chat singing should have light guitar or piano accompaniment.

### Custom voice and singing acceptance — 2026-10-10

- User confirmed all four manual checks passed and liked the singing mix. Corrected Japanese reference transcript improved speech; voice consistency and generation speed remain tuning work.
- Recorded the requested chat humming/acoustic snippets and separate original-song/cover studio roadmap. This update documents plans without enabling spontaneous audio or claiming full-song generation.

### Custom speech and supplied-guide singing — 2026-10-10

- Add reference-conditioned GPT-SoVITS speech to Voice selection, preview, read-aloud, Stop, speed/volume and hands-free. CPU server uses existing pretrained weights/reference; no new training.
- Add More → Singing for bounded guide segments, vocal separation, pitch-conditioned conversion and vocal/backing WAV previews/exports.
- Persist custom setup in SQLite/backups, with defaults for older backups; exclude audio/models. Cancel late results and stop owned processes on normal app exit.
- Real speech/native HTTP proxy and five-second guide separation/conversion/remix smoke tests passed. 151 frontend checks, 55 Rust checks and production frontend build passed; two optional live checks skipped. Listening and live UI acceptance remain pending.

### Hands-free background noise handling — 2026-10-10

- User confirmed repaired background-noise test 4 passed, completing all four hands-free manual checks.

- User passed manual tests 1–3; fan noise exposed a failure in test 4.
- Calibrate background level briefly and block caption-only sound output from automatic sending. Background stop needs retesting.

### Hands-free voice mode — 2026-10-10

- Explicit Start/Stop for Whisper listen/pause/transcribe/send/read-aloud/resume. Review mode stays available.
- Stop on no detected speech, errors, model loss or hidden app; release microphone during reply generation/playback.
- Session stays off after restart; no saved automatic-voice preference changes. Live loop acceptance pending.

### Voice input layout polish — 2026-10-10

- User confirmed all four manual polish checks passed.

- Collapse recognition setup behind Voice input while keeping recording actions visible.
- Widen transcription review and show recording time/input level during Whisper capture.
- Show avatar comparison options only when an image is attached; bound expanded panel height to preserve chat space.

### Local Whisper speech recognition — 2026-10-10

- Add local English Whisper small.en on CPU, with Record/Transcribe/Review and a 15-second recording limit. Windows recognition stays available as fallback.
- Save executable/model setup paths; exclude audio and model/runtime files from backups. Delete temporary audio/transcripts after processing/cancel/normal exit.
- Synthetic greeting/sentence passed; user confirmed accurate live “Hello Mana, how are you today?” and “My name is Aishi” transcription.

### Dictation tuning — 2026-10-10

- Assist recognition of configured companion/user names and greetings alongside normal dictation.
- Review/edit recognized text and select Windows alternatives before Add to draft; uncertain recognition is labelled. No forced word substitutions.
- Basic live capture confirmed; tuned accuracy still needs retesting. Synthetic “Hello Mana” recognized correctly.

### Microphone draft input — 2026-10-10

- Explicit one-phrase local Windows dictation with installed language selection, cancellation and timeout. Transcripts append to the draft for review; nothing sends automatically or records audio files.
- Microphone and read-aloud playback avoid simultaneous use. Synthetic audio recognition checked; real microphone manual acceptance deferred by the user.

### Avatar comparison manual acceptance — 2026-10-10

- User confirmed repaired tests 1, 2 and 4 passed; with the earlier comparison-off pass, all four reference checks are accepted. Minor visual wording errors remain tuning items.

### Avatar comparison repair — 2026-10-10

- Require complete comparison sections from vision; incomplete output preserves the attachment for retry.
- Add final reply guidance for concrete similarities/differences, glasses, tentative resemblance and no unsupported user identity or invented past activity.
- Manual comparison-off test passed; comparison tests 1, 2 and 4 need retesting after reported failures.

### Current avatar reference — 2026-10-10

- Chat image inspection optionally compares the attachment against a neutral composite of the current avatar. The session checkbox defaults on and follows wardrobe changes, without stage zoom or animation.
- Vision receives attachment first, reference second, and reports similarities/differences with tentative resemblance. Reference pixels stay transient; saved comparison text remains uncertain. Manual acceptance pending.

### Saved image attachments — 2026-10-10

- User confirmed manual tests 1–4 passed: restart thumbnails, reuse, backup/restore and pixel deletion preserving descriptions.

- New composer attachments retain the inspected JPEG locally, display thumbnails after restart and in archives, and support Use image again for fresh inspection.
- More → Saved images searches and explicitly deletes pixels without deleting descriptions. Shared image references use one stored copy; older backups can retain deleted pixels.
- JSON backups include images; old backups restore an empty library. Text exports include descriptions only. Limits: 100 images, 8 MB encoded data, 1280 pixels on the long edge; no automatic pruning.
- Older description-only records and the separate image review panel do not gain saved pixels retroactively.


### Current image grounding fix — 2026-10-10

- Fresh attached-image replies now focus on the latest image description, excluding
  prior scenes and unrelated saved project context. Image filenames stay in the UI but
  are withheld from model context; explicit grounding discourages unconfirmed identity
  and shared-game claims. Stored history and normal text follow-ups remain available.

### Local image understanding foundation — 2026-10-09

- Attach image in the chat composer now sends a question through the saved separate
  vision setup and then normal Mana chat. Loading/inspection status, Stop and retained
  attachment on failure. Completed chat stores bounded description metadata with the
  original question; collapsible source details, search/archive/backup/export support.
- Pixel previews remain transient. Chat-owned vision server stops after inspection;
  existing external servers remain running. Reminder distinguishes cat-ear headset
  decoration from anatomy and keeps identity/authorship claims unverified.

- More → Images starts/connects a separate vision server while keeping the current chat
  model. Matching model/projector setup, CPU default, user-selected PNG/JPEG preview,
  bounded local resizing, explicit vision capability check, inspect/cancel and reviewed
  description-to-chat. Installed Qwen3-VL pair detection, saved setup and old-backup defaults.
- Image pixels stay transient; only explicitly shared description/question enters chat.
  No automatic memories, camera access or self-recognition. Owned vision server stops
  on panel close/app exit; external server stays untouched.

### Manual read-aloud foundation — 2026-10-09

- Saved speech speed (-10 to +10, normal 0) and volume (0–100%, default 100%) controls
  apply to the next manual/automatic playback. Older backups retain voice and automatic
  preferences while defaulting the new controls. Voice controls use a compact responsive
  layout; native timing continues to drive lipsync at the selected speed.

- Windows speech viseme events now drive the avatar mouth during manual and automatic
  playback. Five existing vowel images approximate articulation; silence/Stop/completion
  restore the resting expression. Playback IDs reject stale events. Text-only preview
  remains available; custom voice and refined articulation remain future work.

- Voice selection and opt-in automatic read-aloud now persist across restarts/backups.
  Old backups restore automatic playback off. New completed replies play once; no
  startup replay, error playback or queue. Missing saved voices require explicit selection.

- Chat Voice selection and Speak/Stop voice controls use installed Windows voices
  locally, including with the model off. Completed cleaned replies only; no automatic
  playback by default. Native helper cancellation and exit cleanup.
- Custom voice training and singing remain future work.

### Confirmed skill practice foundation — 2026-10-09

- Fixed singular/plural record wording in skill counts and next-milestone labels.

- More → Skills records user-confirmed coding, writing and creative practice linked
  to saved work/activities. Source snapshots, notes, deduplication, count milestones,
  search/delete, model-off use and backup compatibility. Counts are not proficiency
  assessments and do not raise wardrobe coding levels.

### Direct interpretation revision editing — 2026-10-09

- Edit as revision opens saved wording without generation, including with the model
  off. Saving preserves the original and evidence, creates a parent-linked new version
  and starts with reply approval disabled. Empty/unchanged revisions are blocked.
- Clarified continued V1.x development; V2 room work is not the next implied milestone.

### Documentation organization — 2026-10-09

- Updated the current repository reference to Aishi-mana/ManaAI-CV-2.
- Extracted the milestone checklist into ROADMAP.md and created PROJECT_STRUCTURE.md
  for source responsibilities, runtime data locations and the existing avatar layout.
  ManaAI.md links to these maintained documents instead of duplicating their content.

### Recorded continuity and narrative foundations — 2026-10-09

- Recorded event history for newly saved goals/status changes, reviewed work,
  playtests, activity sessions/status changes, diaries, thoughts and chat archives.
  Search/filter/delete controls; source IDs, timestamps and brief outcome snapshots.
  Existing data is not backfilled. Capture stops at 500 events without pruning.
- Reviewed episodic memories and special moments from events, with editable notes,
  tags, source snapshots and one note per event (up to 200). Relevant ordinary chat
  can recall up to three notes. Deleting history does not erase their snapshots.
- Our timeline groups events and reviewed moments by original event date using the
  journal timezone. Search, date ranges, special-moment filters and oldest-first
  ordering. Current fictional bond/affection is a snapshot, not invented score history.
- Themes, lessons and belief interpretations from one to four selected reviewed
  moments. Editable drafts, explicit saves, evidence snapshots, version links,
  search and deletion; up to 100 versions without automatic pruning.
- Per-version Use in replies approval, off by default. Ordinary chat can use up to
  two relevant enabled interpretations; enabled descendants supersede linked
  ancestors. Saving a new version does not approve it or rewrite identity.
- Backup/restore includes these records and approvals. Older backups receive empty
  defaults for new sections. Saved data/restore previews show their counts.

### Chat and personality improvements — 2026-10-09 session

- Optional saved voice controls for warmth, playfulness, curiosity, expressiveness
  and reply length, separate from identity facts and mood.
- Brief/Detailed and low-playfulness prompt tuning; explicit user instructions
  retain priority. Selected manual examples passed; consistency remains model-dependent.
- Optional manual simulated thoughts, reviewed before saving, with recorded chat
  sources. These are character reflections, not hidden reasoning or offline activity.
- Removed duplicated current-context inclusion in ordinary chat and corrective
  requests. Explicit context-overflow errors can retry twice with less old history,
  preserving current instructions/evidence and stored chat.
- Focused approved-lesson requests omit old conversation, generic work excerpts
  and duplicate episodic context for that request. Task guidance follows style guidance.
- Narrative grounding prompts distinguish measured outcomes, draft configuration,
  proposed checks and untested scope. Remaining balance overclaims are deferred tuning.

### Preservation and navigation — 2026-10-09 session

- Search current visible chat and navigate matches/latest messages.
- Archive & clear with searchable read-only saved conversations; archived chats stay
  separate from current recall/diary sources. Capacity is 50 archives.
- Categorized UTF-8 text exports under `exports/conversations`, `diary`, `activities`,
  `work` and `playtests`, with unique filenames and no overwriting.
- Conversation and diary exports; all three activity types' transcripts; reviewed
  work draft exports; saved deterministic playtest report exports.
- More menu collects secondary tools and supports Escape/outside/selection dismissal.
- Saved wardrobe looks, safe defaults for unavailable items and backup support.

### Earlier foundations — retrospectively documented, exact per-feature dates unknown

- Local streaming GGUF chat through llama-server; server startup/health/stop handling.
- SQLite persistence and legacy localStorage migration; startup hydration, pending
  save recovery and safe closing. Browser development retains localStorage.
- Editable identity and fact memories; importance, pinning, keyword recall,
  non-destructive decay, reinforcement and reviewed conservative memory suggestions.
- Persistent mood/needs and fictional relationship stats; elapsed-time state handling,
  simulated rest/sleep and avatar integration.
- Reviewed reflections and daily diary scheduling/catch-up, source evidence,
  Recently deleted recovery and replacement safeguards.
- Opt-in initiative, waiting/reply windows, quiet hours, cooldowns, pause/return
  context and user-reviewed follow-up notes.
- Reviewed goals, manually recorded status/progress and interest enthusiasm.
- Versioned design/writing/code text drafts, revision comparisons, JSON validation,
  deterministic battle previews and version-specific saved reports.
- Saved word chain, shared story and creative challenge sessions with pause/resume,
  explicit completion and incomplete-response recovery.
- Validated backup/restore, count previews, safety copies and saved-data checks.
- Layered avatar, expressions, blinking, basic lip sync, wardrobe and unlock foundation.
- Reply grounding/repetition checks and diagnostics; simpler-prompt comparisons.

## Repository baseline — 2026-10-08

Git records these early checkpoints; commit titles do not establish a complete
feature inventory or verification history:

| Commit | Recorded title |
| --- | --- |
| f05e1b9 | Initial commit |
| ef1efe7 | Update .gitignore |
| 185f000 | step3 |
| 6f6b507 | Create ManaAI.md |

## Known limitations and future work

- The scoped V1 foundation checklist is implemented; this is not exhaustive release
  verification, perfect model adherence or parity with every legacy Python feature.
- Approved narrative replies can still overstate what outcomes/turn counts show
  about balance. More measurements and human review are required.
- Shared story can linger on the prior scene; challenge feedback can exceed one idea.
- Context recovery is reactive, not a tokenizer-based budget. Oversized current
  evidence alone can still require a shorter request or less context.
- Voice, skill progression, runnable game/code sandbox, richer autonomous routines,
  persistent room and Manaverse remain future roadmap work.

See [dev log](DEVLOG.md), [current roadmap](ROADMAP.md), [project structure](PROJECT_STRUCTURE.md),
[legacy comparison](Legacy-comparison.md) and [reliability checks](Reliability-checks.md).

## Updating this file

Add concise user-visible changes under Unreleased with a verified date when known.
Keep implementation decisions and test detail in DEVLOG.md. Record limitations
without marking partial manual checks as universal passes. Introduce a release
heading only when an actual version/release is designated.
# 2026-10-10 — Voice presets (unreleased)

Added persistent Default/Cheerful/Thoughtful/Gentle reference selection with per-preset transcript editing and separate Japanese/English reference and reply languages. Singing uses the selected reference. Existing default paths and custom runtime settings are preserved; recognized incorrect main-reference English text is migrated to the user's confirmed Japanese words. Style transcript approval remains pending.
# 2026-10-11 — Musical initiative foundation (unreleased)

Added opt-in occasional musical moments with persistent cooldowns, journal-timezone quiet hours and initiative pause coordination. Three original wordless piano/guitar candidates are prepared locally through Seed-VC. Voice previews and simple typed humming/singing requests share Stop, volume and mouth playback. Drafts, microphone, hands-free, hidden app state and active work block or stop music. Old backups restore with musical initiative disabled. Listening approval remains pending; lyrics and requested-song covers are future work.

## 2026-10-11 — Edit pool titles and aliases

User passed all excerpt checks. Added a pencil-icon editor with Save/Cancel and cross-song name collision checks, preserving clip files and enabled state. Clarified excerpt duration labeling.

## 2026-10-11 — Mix balance and WAV export

Finished projects offer Mix balance & export below the player. Vocal/instrument gains preview existing aligned stems without conversion, with shared peak reduction to avoid clipping. Save new mix creates a separate library entry and retains gains in metadata; existing audio and pool clips are preserved. Export copies the saved selected mix/vocal/instrument version to a new WAV filename chosen in the save dialog; existing destinations are rejected. Audio stays external to JSON backups. Mixing needs both saved stems and uses browser decoding, so large songs can take memory/time. Pool metadata editing passed user acceptance.

Manual checks: (1) preview vocal-only and quieter backing, (2) save a new mix and check original and new version after restart, (3) export mix/vocal/instruments and listen externally, (4) cancel export or choose an existing file and check it stays unchanged.

## 2026-10-11 — Mix and export accepted

User confirmed all four mix/export acceptance tests passed. New arrangements and original song generation remain future work; existing singing distortion/trembling remains deferred.

## 2026-10-11 — Piano arrangement controls

User accepted the piano/guitar audition and preferred piano. Finished covers now offer New accompaniment with Piano and Gentle piano, start and 1–60 second duration. Uses the original saved instrument stem to estimate triads and beats, synthesizes piano and combines the existing cropped Mana vocal; no new voice conversion. Gentle piano uses fewer notes, softer filtering and lower backing level. Output is a separate library project with vocal, instrument and mix WAVs, compatible with mixing/export and explicit short-pool review. Existing owned job progress/Stop/cancellation and interrupted-project recovery apply. Original covers and approved pool audio are preserved. Jazz/rock and full-length arrangements are future work; chord estimation is approximate.

Manual acceptance: (1) restart, select a separated cover and render Piano at start 15/duration 12; (2) render Gentle piano and compare; (3) test Stop and invalid/out-of-song selections; (4) restart and check saved arrangements, export or review a short pool clip.

## 2026-10-12 — Arrangement range validation

User confirmed Piano and Gentle piano sound distinct and work. Fixed out-of-range attempts creating failed library entries: validate start/duration against known project length and both actual WAV stem durations before adding a project or launching Python. Show a role-alert message directly under Make arrangement. Native launch rechecks the range before creating its output folder. Existing failed entries remain removable manually. Stop/persistence/export acceptance is not inferred from this feedback.

## 2026-10-12 — Piano arrangements accepted

User confirmed arrangement acceptance tests 1–4 passed after the range-validation fix: Piano/Gentle piano rendering, invalid-range rejection and Stop, saved projects across restart and export/chat-pool workflow. Jazz and rock auditions remain pending; existing high-note distortion and trembling remain deferred.

## 2026-10-12 — Jazz and Rock controls

User approved revised sax-led Jazz and electric-guitar Rock auditions. Both styles now appear in New accompaniment beside Piano/Gentle piano. Production rendering uses the approved synthetic reed/formant sax and plucked-string amp/cabinet guitar model with bass/percussion, preserving saved vocal timing. Existing 1–60 second preflight, owned Stop/job lifecycle, separate library save, stems, mix/export and explicit pool approval apply. Arrangement helper is bundled with the desktop app. Manual checks pending: render both styles, reject invalid ranges without adding entries, Stop, and verify restart/export/pool review.

## 2026-10-12 — Arrangement preview and recognition limitation

User passed Jazz/Rock controls but reported an unrecognizable arrangement on Reach Out to the Truth. Current chord/beat estimates omit signature riffs and instrumental melody; recognizability is unresolved. Added Preview arrangement with no library entry, playback and Save this preview (exact files, no rerender). Unsaved preview files remain on disk but are excluded from discovery; preview approval does not add to chat pool. Saved preview metadata uses existing backups. Range validation and Stop apply. Manual checks: preview without song-count change, pause and save the exact preview, invalid-range/Stop, restart and check saved playback. Melody/riff-preserving rendering remains future work.

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

## 2026-10-14 — Cover Builder

Added clean-vocal-to-Mana conversion with individually imported instrument tracks, timing/volume/mute controls, replacement auditions and editable saved covers. Simplified Music Studio navigation and folded advanced cover settings. Build, 175 frontend and 63 native checks passed; desktop listening acceptance pending.

## 2026-10-14 — Backing voices and karaoke lyrics

Fixed direct-track replacement crashes caused by null companion stems. Added multiple backing-vocal imports with optional Mana conversion, and saved/editable timed lyrics in the main song player. Lyrics use local Whisper and highlight whole lines during playback.

## 2026-10-14 — Approved piano melody and dynamics

Prepared piano tracks using the Salamander library now retain polyphonic chords, repair unsupported repeat attacks and use source-guided soft-note dynamics. Integrated the user-approved Whereabout audition method; other sources and instruments retain their existing renderer.

- Added separate Bright room guitar · NAM · +2 replacement in Cover Builder and Edit tracks, using the approved brighter/small-room tone and local NAM capture. Bass remains independently controlled; existing guitars retained. Verified rendering, backups and builds.

- Added Warm crunch, Rock rhythm and Sustained lead NAM guitar options, using the existing local JCM800 capture with separate voicings/effects. Existing Bright room +2 retained; other instrument libraries unchanged.

- Cover Builder: added detected-note/hit previews for the selected original-instrument interpretation, selectable1–60s sections and a separate original-recording preview. Audition without applying a replacement.

- Cover Builder: whole-song detected-note previews with seeking; melodic instrument customizer for pitch and extra note hold, preset reset and saved per-track tuning. NAM +2 can now be overridden directly.

- Integrated bass-specific slow/fast tracking and refined attacks for Bass → Finger bass/Picked bass. Quick notes use shorter releases, sustained notes4× release; pitch/hold customizer retained. Added Picked bass to Builder and Edit tracks; updated bass detected-note preview and saved metadata.

- Added separate Live HQ Tenor sax and Weresax Alto sax choices with softer releases, source-supported overlap and conservative short-noise note rejection. Preferred melody method retained; pitch/hold customization and saved identities supported.

- Rock drums now uses approved source-following kick/snare dynamics and trimmed cymbal layer at −6 dB, with ringing tails retained. Other drum kits unchanged; preview/save workflow retained.
# 2026-10-16

- String ensemble replacements now use smoother connected holds and conservative cleanup of weak passing notes, with softer dynamics for uncertain notes. Existing saved audio is retained.

# 2026-10-16 — Flute

- Flute replacements now have softer entrances, smoother connections and conservative correction of isolated octave jumps. Saved songs remain unchanged until a new replacement is made.

# 2026-10-16 — Solo violin

- Violin replacements now use a melody-focused audio guide to reduce notes picked up from other layers, with softer phrase entrances. Pitch and extension controls remain available.

# 2026-10-16 — Trumpet

- Added Trumpet · Live HQ replacements with phrased attacks and sustain, pitch/extension customization, and saved-library support.

# 2026-10-16 — Vocal melody instruments

- Cover Builder can turn a clean vocal melody into harmonica, flute, trumpet, violin, strings, ocarina or piano as a separate track, with pitch/hold controls and smoother held vocals.
- Mute the source vocal to preview and save the instrumental melody mix without converting it to Mana’s voice.

# 2026-10-16 — Gentler ocarina and vocal instrument choices

- Ocarina now has gentler entrances and connected sustain.
- Vocal-to-instrument melody supports the other melodic Builder instruments, including guitars, bass, keyboards, synths and sax variants; original vocals remain separate.

# 2026-10-17 — Electric piano touch

- Electric piano replacements and vocal-melody tracks now use gentler source-following key strength, shorter decay on quick notes and longer decay on held notes. Pitch and extra-hold controls remain available.

# 2026-10-17 — Held vocal electric-piano notes

- Reduced repeated electric-piano strikes caused by vocal vibrato crossing pitch boundaries, while retaining sustained pitch changes and vocal rests. Applies to newly generated vocal-melody previews.

# 2026-10-17 — Synth lead articulation

- Synth lead/saw replacements and vocal melody now use clearer accents and tighter release. Warm pad keeps its existing plain sound.

# 2026-10-17 — Backing harmony

- Cover Builder can regenerate a short third-above harmony in Mana’s singing voice, with Auto or chosen song key, preview and a separate quiet backing-vocal track.
- Harmony tracks retain their own volume, mute and timing controls while preserving the lead.

# 2026-10-17 — Harmony range fix

- Fixed valid harmony sections being rejected as out of range because of one-sample resampling rounding.

# 2026-10-17 — Upper/lower harmony

- Cover Builder now offers Third above and Third below for regenerated backing harmonies, with the existing key, preview and separate-track controls.

# 2026-10-17 — Preview harmony blend

- Hear lead and harmony together and adjust backing volume before adding the track.
- Previously generated upper/lower harmony previews are reused for matching settings during the current Builder session.

# 2026-10-17 — Whole-song backing harmony

- Generate a full-length third-above or third-below backing track after auditioning a short section. Existing key, blend-preview, volume, mute and timing controls remain available.

# 2026-10-17 — Harmony only where wanted

- Choose start/end sections on backing-vocal tracks with adjustable edge fades. Preview and save chorus-only harmonies without regenerating voices; original recordings remain available.

# 2026-10-17 — Selected section preview

- Backing-section previews now play only the selected audio, skipping unselected gaps. Saved mixes keep the original timing.

# 2026-10-17 — Consistent audio ranges

- Music clip, harmony and extraction controls now consistently use Start and End positions. Enter seconds (`90`) or minutes:seconds (`1:30`).


## 2026-10-17 — Source-driven melody corrections, first pass

Bass sources now share the approved adaptive slow/fast fundamental detector across melodic replacement sounds, rather than falling back to generic guitar transcription when choosing harmonica, sax, keys or synths. Finger/picked bass retain their approved articulation, and acoustic bass now shares it. Selected sample-bank variants and user pitch/hold settings are retained.

Generic transcription frequency limits now depend on the original source: keyboard/piano retain their low/high register; estimated strings/winds and extracted brass/sax have appropriate wider candidate ranges. Extracted sax, trumpet and estimated strings/winds no longer go through guitar pick-based re-striking of held notes. Piano and guitar source articulation remains unchanged. These are routing/register corrections, not a claim that mixed-source separation or every detected note is accurate. Wider ranges can expose residual extraction noise; focused listening acceptance is still required, starting with sax/winds. No full songs or voice conversions regenerated.

Regression checks cover bass-to-multiple-destinations with identical supplied notes/levels, retained library variants, source ranges and sustained-source attack policy. Existing instrument regression checks remain required before delivery.

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

Local picture generation final validation (2026-10-19): 257 frontend tests passed, 2 optional skipped; 2 native image-generation tests passed; frontend production build and native debug build passed. Native executable replacement succeeded after the user closed Mana. Normal-resolution picture quality, library Save and Stop remain live user checks.


## NetaYume speed correction — 2026-10-19

User confirmed Photon generation/library Save, NetaYume generation and Stop work. NetaYume took roughly10–20min versus <=3min in their ComfyUI workflow. Found standalone launcher forced --lowvram, which can force Gemma text encoding to CPU. Removed forced lowvram on GPU jobs; retain explicit CPU option and normal automatic offloading. Added inference mode around conditioning, encoding status, INFO device/load logs and cumulative stage elapsed_seconds in generation.json. No server connection, custom nodes, downloads, sampler/quality changes, other-app edits or new image generation. Installed-library preflight confirms NORMAL_VRAM and text encoder cuda:0. Frontend build and257 tests passed(2 optional skipped). Actual speedup and comparable-quality timed run remain pending; do not promise <=3min. Prior checkpoint-size explanation was insufficient: combined checkpoint size alone does not establish required GPU memory.

## Image generation accepted — 2026-10-19

User passed local image generation: Photon generation and library Save, NetaYume generation, Stop, and corrected standalone NetaYume speed around3 minutes (previously10–20min), comparable to their ComfyUI experience. Keep current GPU normal-memory setup; no server connection. Manual Create picture workflow accepted; do not repeat costly generation tests. General visual quality still depends on prompt/model/settings; no blanket quality guarantee. Future request: Mana may design her own outfits. Record only for later: generated pictures are concepts, not automatically usable layered avatar assets; fitting/rigging/import and user approval would need a separate workflow. Do not implement outfit generation or automatic outfit installation now. Next image-generation scope to confirm: conversational picture requests through Mana versus additional manual editor features.

## Chat picture requests — 2026-10-19

Explicit leading requests (e.g. "draw me a moonlit garden" or "create an image of a cat using NetaYume") now open Create a picture and automatically start the existing local job once. Optional Mana address/polite phrasing supported. Backend suffix selects NetaYume or SD; default is Photon then supported SD fallback. Questions, negative instructions and ordinary image discussion stay chat. No model inference for routing, no server connection or extra image generation during verification. Drawer remains result/settings/Stop/explicit library Save UI; only successful result retrieval/preparation emits chat completion note. Attached-image inspection stays its existing path. Chat input/hands-free pauses while picture drawer open. Missing NetaYume is explained in panel; no silent backend substitution. New tests cover parser exclusions and one-shot auto-launch/selection/completion; existing pending-start cancellation check retained. Validation259 passed,2 optional skipped; frontend and native builds passed. Live chat-request acceptance pending; manual workflows and standalone speed already user accepted. Detailed standalone architecture/install paths/performance/limits in docs/NETAYUME_STANDALONE.md. Future Mana-designed outfits recorded only, not implemented.

## Inline chat pictures and reusable setup guide — 2026-10-19

User passed chat picture routing but expected the actual generation/result in chat. Chat jobs now use an inline progress/Stop card with no drawer or scrim; successful completion creates an assistant message containing a prepared JPEG and explicit Save to image library button. More → Create picture retains manual controls. Chat images persist through reload, archives and backups; archives display them. Validated assistant-only JPEG payloads, filename<=200, per-image<=3M and combined8M character budget per validated chat. Chat completion refuses exceeding budget and leaves the generated result available to Save in the inline card. Text exports include filename without pixels; search includes filename; model payloads remain text-only. No automatic library Save, avatar identity labels or outfit install. Cancel/error has no success note. Existing lifecycle cancellation remains scoped to owned job. Validation261 passed,2 optional skipped; frontend/native builds passed. New guide docs/NETAYUME_SETUP_FOR_OTHER_APPS.md includes dependency choices, installed paths, worker reuse, GPU preflight, JSON request, background child-process host example, cancellation/output/timing troubleshooting and official install references. Python examples compiled and JSON parsed only; no new image generation or fresh dependency installation. Inline live acceptance pending. Saved Images gallery redesign explicitly deferred by user, alongside future Mana-designed outfits.

## Animagine default and enlarged chat images — 2026-10-20

User passed inline chat generation and requested Animagine default, visible model identification, explicit Animagine chat selection and enlarge. Default selection now prefers installed Animagine SDXL, then Photon/SD fallback; explicit Animagine/Photon/NetaYume choices never silently substitute. Chat suffixes "using Animagine", "using Photon", "using NetaYume" supported. Inline progress shows model/checkpoint and seed. Completed chat/manual results show model and seed parsed from existing generated filenames, so previous generated pictures also identify their original model when encoded there. Unrecognized imported filenames do not claim a model. Shared GeneratedPictureView enables click-image or Enlarge image in chat and archives; native dialog escapes clipping, supports Close/Escape and restores focus. Uses existing prepared JPEG, no additional inference or original-file fetch. Fixed seed42 retained: same prompt/model/settings can reproduce earlier output; user may change seed in manual settings. User screenshot also shows separate conversation context-limit error, not addressed by these image UI changes. Validation262 tests passed,2 optional skipped; frontend build passed. Live Animagine/default/enlarge checks pending. Gallery redesign and generated avatar outfit assets stay deferred.

## Context budget, gallery and avatar-referenced outfit concepts — 2026-10-20

User passed Animagine/default/model labels/enlargement. Requested context-limit repair before deferred image gallery and Mana-designed outfits, then other V1.x. Found initiativePayload duplicated full application context plus grounding in both messages; removed duplicate. Automatic opener evidence now has a conservative char budget derived from settings.ctxSize, keeps complete evidence lines (no partial JSON), notes omission, and leaves saved source untouched. Opener output reserve160 tokens. Ordinary buildPayload now includes grounding once in system, not repeated in latest user. Latest user/evidence/history retry semantics otherwise unchanged. Extremely oversized custom system prompts or small configured contexts can still exceed runtime limits; no unconditional tokenizer guarantee. Tests cover duplication, budget, preserved source and existing older-history overflow recovery.

Saved Images is now Image gallery: full-width thumbnail grid, search, date sorting, selected-picture detail, existing label/delete controls and enlarged view. Uses existing saved-image store/backups. Clarified library deletion versus separate generated chat/disk copies. No gallery migration/new storage.

Added actual avatar starting-image conditioning, not automatic identity recognition: manual Create picture checkbox and explicit chat self-portrait requests prepare current neutral avatar layers (no background) through existing avatarReference helper. Host validates optional bounded JPEG data URI; worker pads reference to target size, SD uses --init-img/--strength0.65; Neta uses VAE encode of reference as latent and denoise0.65. A job-local reference.jpg and reference_used/denoise metadata preserve provenance. Uses same no-server backends, owned-job cancellation and no downloads. Avatar features can drift; this is image-to-image, not a trained identity adapter. Chat example: "Draw yourself in a summer outfit using Animagine". No reference is sent for ordinary cat/landscape requests. Preparing reference is abortable, stale prep cannot launch a job.

Wardrobe → Design an outfit opens manual generator with avatar reference checked and editable concept prompt. User explicitly presses Generate; no immediate model load or automatic outfit installation. Produces concept art only: turning art into layered/rigged wearable avatar assets remains separate required work and must not be claimed complete. No avatar config/assets modified by generation.

Validation:265 frontend tests passed,2 optional skipped;2 native image request/header tests passed; frontend/native builds passed. Mock Neta test validated reference decode/pad/VAE encode/latent/denoise flow with no weights loaded. No real new image generation; current reference resemblance/quality, gallery UI and context fix need live user checks. Initial mock temp/atomic-status writes hit sandbox permissions; rerun under workspace with mocked status/model passed (not evidence of production status failure). Setup/architecture docs updated for optional reference flow.

## Gallery workspace and user acceptance — 2026-10-21

User has not encountered context overflow again since fix; continue monitoring, not an exhaustive guarantee. Self-reference and outfit concepts passed but visual fidelity needs improvement. User clarified final outfit goal: generate clothing only, transparent PNG, fit/alignment so Mana can wear it; current full-character concept workflow does not fulfill this final asset pipeline. Do not claim automatic wearable asset generation. No further image regeneration/tuning done this turn.

User requested gallery as its own full app menu like Music Studio. Replaced scrim/modal drawer with music-studio-style full workspace header, MANA • PICTURES, gallery body and Back to chat. App hides stage/chat while gallery is open; existing chat stays mounted and retains draft/scroll. Music Studio is hidden if gallery active; hands-free/chat readiness pauses in gallery. Existing thumbnails/search/sort/detail/enlarge/label/delete/storage preserved. Validation265 passed,2 optional skipped; frontend/native builds passed. Live gallery-workspace acceptance pending. Screenshot's repeated-follow-up opener notice is a different rejection from context overflow; not addressed in this gallery change.

## Disk-backed gallery — 2026-10-21

User accepted full gallery workspace and requested removal of8MB/100-picture limits through disk storage. Added native gallery.rs scoped JPEG commands under app_data_dir()/gallery: validated opaque IDs, bounded JPEG bytes, serialized temp-file write/sync/verification then rename, immutable same-ID dedup, raw full-image read, deletion, folder path and preserved legacy JSON. No arbitrary filesystem paths or remote URLs. New diskGallery.ts makes280px JPEG thumbnails, SHA256 fingerprints, retains IDs/dates/Mana labels and migrates legacy images only after preserving original JSON and verifying each disk file. Metadata persists under existing mana.images.v1 only after all migration writes succeed; legacy recovery JSON remains. Failed migration leaves old database image records untouched with visible Retry. Existing files are reused after interrupted metadata commit; temporary .part files are not indexed. Migration is automatic on startup, not run against user data during development.

Disk records store thumbnail, diskId, byteSize, fingerprint and metadata, not full pixels. Legacy validator caps remain for old backups but verified disk metadata has no100-picture/8MB cap. Full saved-gallery JPEGs retain the previous prepared-picture resolution/quality; generation originals remain separately in exports/images. New saves/dedup/labels/deletes are serialized; async saves report Saved only after persistence flush. Image gallery loads full pixels only for selected details; chat vision attachments load full images only when expanded or reused. Missing files show an actionable load error. Generated chat pictures still have their separate existing8M character budget; this change is gallery-only.

Gallery UI shows count, actual gallery JPEG bytes and folder path without quota. Ordinary backups now contain gallery index+thumbnails+disk references, not external full JPEGs: copy the displayed gallery folder together with the backup to preserve/transfer full pictures. Updated BackupPanel/gallery copy. Deleting an entry commits metadata then deletes its gallery JPEG; generated originals/chat copies and legacy migration recovery JSON remain separate. Index-only backups cannot restore deleted full files. Existing historical backups with embedded JPEGs can restore/migrate. Other-app files/models unmodified; no image generation.

Validation267 frontend tests passed,2 optional skipped; native gallery scoped immutable/verified write test passed. Tests cover125 disk records/12.5MB metadata-referenced pixels, round-trip backups, path rejection, migration source preservation and failure, IDs/labels, dedup and full read. Frontend build passed; final native build status follows. User live migration/save/reload/detail/delete acceptance pending.

Disk gallery final verification: frontend267 passed/2 optional skipped; final native gallery test passed outside sandbox after Windows blocked its isolated temporary-file rename inside the sandbox (same test, no user gallery touched). Frontend and native debug builds passed. Automatic real-data migration awaits user restart/live check.

## Self-reference tuning — 2026-10-21

User passed disk-gallery migration and requested improved self-reference. Existing image-to-image variation0.65 allowed substantial feature drift and raw "yourself" text had no identity meaning to checkpoint. Added avatarPicturePrompt to anchor same single supplied-reference character, face/eye/hair colors/hairstyle/proportions/accessories while allowing explicitly requested changes; resolves "yourself"/"your outfit" to supplied character. Applied only with actual avatar reference enabled; ordinary prompts unchanged. No static silver/blue tags override different avatar choices.

Generation reference now requests1024px max edge/JPEG0.9 through existing compositor; vision comparisons retain640px/JPEG0.85 default. Neutral layers and no-background behavior unchanged. Self-reference initial output defaults to portrait768×1024 (SD1:512×768) rather than square, preserving more character detail. Manual dimensions remain adjustable. New Reference variation slider0.2–0.8, default0.45, lower for resemblance and higher for bigger clothing/pose changes. Optional referenceStrength field validated frontend/native; worker uses it for SD --strength and Neta denoise and records effective denoise. Old request files without field retain0.65 behavior. Native bounds tests and mocked Neta flow verify0.45 is used; no weights/image generations run. Mock face-quality checks do not prove actual resemblance; one live same-request comparison needed. Not an identity adapter/LoRA and outfit concepts still not wearable assets.

Validation268 frontend tests passed,2 optional skipped;2 native image tests passed; mock reference pipeline passed; final build status follows. User should restart and try previous "Draw yourself in a summer dress using Animagine" request once for comparison. Manual slider available in Create picture when avatar reference checked.

## Masked clothing changes — 2026-10-21

User reports self-reference0.45 improved quality but preserved hoodie instead of summer dress. Added clothing-specific masked image-to-image rather than raising full-frame variation. prepareAvatarClothingMask composites current outfit alpha, finds its bounds, adds20% horizontal space for new skirt shape and small lower margin, never expands upper edge into head, subtracts current hair/accessory silhouettes and exports a same-size JPEG mask. Region is approximate clothing bounds (may include limbs), not semantic garment segmentation. Actual default asset outfit begins below eyes; source alpha bounds inspected without generating/editing output assets. Fail explicitly if no separate outfit layer or reference; no silent full-frame fallback.

Clothing terms in explicit self-reference requests enable clothing-only mode by default; new manual checkbox can disable it. Initial clothing variation0.75 allows stronger redraw inside mask; general self-reference remains0.45. Prompt explicitly replaces original clothing while preserving reference identity. UI explains original pose retained. prepareReference/prepareClothingMask share the snapshot and cancellation token; no stale preparation can launch. Native validates bounded JPEG referenceMask and requires reference. Worker validates dimensions match, pads both identically, thresholds and softly feathers mask, saves clothing-mask.png. SD uses verified installed --mask flag; Neta uses existing comfy.sample noise_mask. Both composite generated pixels over supplied reference only inside mask, preserving outside areas. Metadata clothing_mask_used/effective denoise retained. No external models/downloads/server, no outfit layer installation.

Validation269 frontend tests passed,2 optional skipped;2 native request/header tests passed; frontend/native builds passed. Mock Neta integration checked mask reaches sampling and protected white/top pixels remain reference while editable region changes. No real generation run; dress adherence, seams and live face/hair preservation need one comparison. User should restart and repeat summer-dress request once. Existing portrait/appearance improvements not reverted.

## Animagine garment-target prompt correction — 2026-10-21

User confirms masked result preserves Mana very well but still copies hoodie. Inspected exact saved job image-1792526618643034700: mask active, denoise0.75, Animagine768x1024/20steps/CFG7/seed42. Garment request was buried after long instruction prose. Official Animagine4 model card says tag-based captions/order; natural-language instructions may be ineffective: https://huggingface.co/cagliostrolab/animagine-xl-4.0 . Added Animagine-only clothing prompt compiler: requested garment first, concise character/composition/quality tags; no long instruction preamble. For requested dresses, adds hoodie/sweatshirt/shorts as negative tags only if user has not explicitly requested those items. Other models/general self-reference prompts and mask/strength unchanged. UI compiles with selected model; test preserves red summer dress at prompt start and protects explicit hoodie combinations. No model downloads.

Validation270 frontend tests passed,2 optional skipped; frontend/native builds passed. Live saved-reference comparison attempted with exact reference/mask/seed/settings, prompt-only changes; first GPU attempts failed from memory pressure, user explicitly stopped chat model. One final unsandboxed comparison is running; do not claim it succeeded until output reviewed. Logs work/clothing-target-check.log and active path work/clothing-candidate-path.txt. Failed attempts not saved to library or chat; no unrelated process killed. Candidate output is for comparison, not automatically accepted.

Animagine candidate outcome: no completed image accepted. After user stopped model, a final host comparison still spilled to RAM (~39s/step). Stopped only exact-request-path-matched owned Python process tree to avoid a long run; no unrelated models/apps stopped. Two earlier GPU attempts failed memory checks. Prompt compiler is deployed and automated tests/builds passed, but visual dress adherence is pending one user run with sufficient free GPU memory. Do not repeat generation automatically or claim candidate quality verified.

2026-10-21: Added manual outfit PNG prototype with body preview/alignment and selection reload/export. Improved outfit framing and accessory omission; dress references use a neutral guide. See OUTFIT_PNG_PROTOTYPE.md.
