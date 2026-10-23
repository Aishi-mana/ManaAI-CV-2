# Code playground — V1.x

Open **More → Code playground**. **Load example → Run game** starts the accepted20-star collector. Focus the canvas and use arrows; Space resets. Stop, close, hide or the two-minute session limit ends a run. Unresponsive setup/frames are stopped by the host watchdog. Draft game uses the ready local chat model; returned code receives a bounded isolated smoke check before replacing editor source. Interactive play still requires Run game.

## Save games and test results

Give the source a title and click **Save as new game**. After editing or drafting a revision, **Save new version** preserves the selected original and creates a separate version. Load saved versions from the dropdown. Limits:50 saved versions total,100 reports; limits block additions without automatic pruning. Delete controls are explicit. Standalone unsaved source is still session-only; saved versions survive restart and are included in backups.

Run the game, then Stop. **Review latest run** shows measured frame count, elapsed time, keys sent and end reason. Choose Not assessed / Worked in my test / Needs a fix, add feedback, then **Save run report**. Reports keep exact run source, timestamps, up to30 recent game-reported messages and user feedback. Editing the source before saving a report does not alter its evidence. A report links to a saved version only if its source matches exactly. Deleting a saved version preserves report source snapshots. Reports are not autosaved; save before closing. Starting another run asks before replacing a pending report.

**Draft revision from reports** supplies the current source and up to three recent reports matching that exact source. Other-version reports are excluded. Runner measurements establish execution activity, not correct movement/scoring/playability. Game logs are unverified text; worked/needs-fix is the user's assessment. Review the replacement, save a new version and explicitly Run. Goal completion, skill levels and work artifacts are unchanged. Restore supports the new game library; older backups default to an empty library, and backup previews count versions/reports.

Saved code artifacts in Goals retain a temporary game runner; its edits don't change saved artifacts. Use the standalone playground for game versions/reports. JSON designs, Python, HTML and multi-file projects do not run here.

## Game API and boundary

Set `api.onFrame = (dt, keys) => { ... }`, keeping persistent variables outside the callback. Initialize once; update/draw each frame. `dt` is seconds capped0.1. Arrow and Space key booleans are sent while canvas is focused. The480×280 canvas supports `api.clear(hex)`, `api.rect(x,y,w,h,hex)`, `api.circle(x,y,r,hex)`, `api.text(text,x,y,hex)` and `api.log(text)`. Limits:16000 source characters,200 drawing calls and8 short logs per frame. Generated draft instructions include the repaired state-lifetime example; this does not guarantee arbitrary model code works.

Fixed bootstrap runs in an allow-scripts iframe without allow-same-origin. User JavaScript runs in a dedicated worker inside the opaque-origin frame. Restrictive CSP blocks network/remote scripts/frames/forms. No Tauri bridge, app DOM, shell or filesystem API is provided to games. Host checks message source and bounded draw/log data. Closing terminates worker and removes timers/listeners. This limited browser runner has no hard memory quota or independent hostile-code security audit.

## Validation and acceptance

User passed original runner live checks1–4 after generated-game frame-state repair. User passed saving/report/revision controls checks1–4. Generated-code quality remains variable.

2026-10-19:214 frontend tests passed/2 optional skipped; production frontend/native debug builds passed. SQLite reopen/deletion test passed for the new storage key. Tests cover immutable versions, report source matching, invalid evidence, backup roundtrip/old-backup defaults, retained report snapshots after version deletion, revision grounding and host-captured frame/key/log/error evidence. Existing sandbox/bootstrap/timeout checks passed. No model generation or browser automation used for this change. Prior browser usage approval gate remains unresolved; live UI check is delegated to the user.

2026-10-19 repair: incomplete power-up revision exposed chat700-token cap. Game-only cap is now2000; strict completion handling rejects cutoff, then compile-only syntax checking protects prior source. Rejected output remains visible without automatic retry. Load power-up example provides tested repaired source without a model call; speed lasts5s, shield is explicitly only a glow since there are no hazards.217 frontend tests passed/2 skipped, frontend/native builds passed. Live power-up retest pending.

## Automated smoke checks

Check game tests existing source without a model call. Future generated drafts/revisions receive this check automatically after completion/syntax validation. The isolated worker receives92 simulated frames with arrows and Space; no active canvas is changed. Runtime errors, invalid output, no drawing and unresponsiveness fail. Static drawing only warns; an animation or passing check does not prove correct movement, score or playability. Stop check, hiding or closing cancels/ends the check. Draft failure keeps previous source and rejected output for review, without automatic generation retry.

Smoke results appear in Review smoke check and can be explicitly saved. checkKind=smoke survives backup and appears in revision context, separate from manual runs and user assessments. Save/discard pending reports before drafting another game. Each check uses at most8s wall time and3.07s simulated game time; longer-term logic and other inputs are untested.219 frontend checks passed/2 optional skipped and both builds passed; live UI check pending.

## Export a playable game

While stopped, choose Export playable game to write current source as standalone HTML under exports/games. Syntax must compile first. The full path is selectable after saving. Open the HTML in a modern browser, press Run and focus the canvas. The file includes game source, Run/Stop, bounded logs, two-minute limit and isolated worker. It has no external assets, app data, model dependency or network requests. A passing syntax check does not establish gameplay correctness. Standalone results are not sent back to Mana or automatically counted as evidence. Original saved game/version is unchanged; each export has a unique timestamp filename.

Sample: exports/games/Star-collector-demo.html.222 frontend tests passed/2 skipped; both builds and native export test passed. Real standalone browser check is pending.

2026-10-19 acceptance: user confirms coding evidence and playable game export both passed. Current supported workflows accepted; broader proficiency/security guarantees remain out of scope.


### Multi-file projects

Make multi-file project keeps the current script as main.js. Load project example creates a star collector and level.json settings. Select file buttons to edit, Add file creates JS/JSON, Delete file removes non-entry files. Use require('./player') with module.exports, or require('./level.json') for data. Modules load once per run. No folders or packages.

Save before closing. Versions, reports, backups and playable exports retain all files. Project drafts/revisions request complete JSON under the existing model output limit. Limits: 12 files, 12,000 content characters and 16,000 bundled characters. Run or Check game reports syntax, JSON and missing-file errors.


### Images and sound effects

Load asset example starts a tiny demo: Run, move the image with arrows, press Space for a chime. In a project, Import asset adds a local PNG/JPEG image or WAV/MP3 effect. Assets show a preview and Remove button. Use `api.image('player.png', x, y, width, height)` per frame and `api.sound('chime.wav', 0.4)` on an event. Names match exactly.

Up to 8 assets, about 60 KB combined (80,000 encoded characters), images up to 2048px per side, sounds up to 10 seconds. Sound calls allow 0–1 volume, at most two per frame, four concurrent effects and 250ms between uses of the same name. Stop/hidden/close silence gameplay effects. Imports decode before saving, without playback. Browser sound permissions still apply.

Save a version to retain all files/assets before closing. Versions, tested-source reports, backups and offline playable exports include media. Project drafts/revisions receive asset names without binary data, and imported assets are preserved on replacement. Projects have a bounded larger source envelope for embedded assets; ordinary scripts remain limited to 16,000 characters. Checks validate asset names/types, but actual appearance/sound needs a manual run.


### Mouse controls and buttons

Load mouse example, Run game, click Start game, then click yellow targets to score; Menu returns to the start screen. Moving the pointer aims the crosshair. The same controls work in a playable HTML export.

Use `api.onFrame=(dt,keys,mouse)=>{...}`. Mouse fields: x/y in logical 480x280 canvas coordinates, inside, down, clicked and released. Click/release flags last one input tick, including quick clicks between frames. Only the primary pointer/left button activates clicks. Canvas resizing is mapped to game coordinates. Blur/cancel/stop clears input. `api.mouse` exposes the same state.

`if(api.button('Start',160,100,160,48)){playing=true;}` draws a button with hover feedback and returns true for a primary press inside it. Draw it each frame, keep scene state outside the callback. Mouse down is a held state; use clicked for one-shot actions. Older two-argument callbacks keep working.

Smoke checks now send simulated keyboard and pointer input, which does not establish button correctness. Manual run reports count pointer pulses sent, not successful game interactions.


### Sprite-sheet animation

Load sprite example, then Run game. Arrows move and animate walking, releasing returns to idle, and a fresh Space press plays a reaction. Edit animation.json to change each clip's row, fps or frame count. Rows and frames must fit the supplied 64x48 sheet (16x16 frames). Saves, backups and playable exports keep the sheet and settings.

`api.sprite('character.png',sx,sy,sw,sh,x,y,width,height)` draws one cropped image frame with crisp pixel scaling. Source coordinates/sizes are integers, sizes are positive, and rectangles must fit the decoded image. `api.animationFrame(elapsedSeconds,fps,frameCount,loop=true)` returns a frame index; use loop=false to hold the last frame of a one-shot reaction. Rates are positive and at most 60fps, counts are 1–256. Accumulate dt between frames and reset elapsed time when changing animations. Existing asset size/image dimension limits still apply.


### Tile maps and solid walls

Load maze example, Run, use arrows to find the green goal through the gap; Space resets. Edit level.json: rows use # for walls and . for open space; spawn/goal are column/row coordinates starting at zero. Keep the spawn clear of walls. Game settings include tileSize, offsetX/Y and speed.

`const map=api.tileMap(rows,size,ox=0,oy=0)` creates an immutable copy of a rectangular ASCII grid (max 256 cells, 32 per side; tile size 1–64). # is solid, other characters open. `map.draw('#546080')` draws merged wall rectangles. `player=map.move(player,dx,dy)` returns a new {x,y,w,h,hitX,hitY}, sweeping X then Y, stopping at walls/map edges and allowing sliding. Initial boxes need positive sizes and must fit inside the map without overlapping a wall. Movement does not mutate the old box.

`api.overlaps(a,b)` detects positive-area rectangle overlap; touching edges alone do not overlap. Use it for goals, pickups or hazards. The helpers do not add gravity automatically; platform games can update vertical velocity and pass velocity*dt to map.move, using hitY for landing. Maps, helpers and edited level data work in saved versions and offline exports.


### Saved game progress

Load progress example, Run, press Space to score, and toggle the theme. Stop then Run: current score resets, while best score, unlocked level and theme remain. Save a game version before closing to reopen it from Saved games. Reset progress clears the demo's scores/settings.

`const progress=api.loadProgress({best:0})` returns saved JSON or the default. `api.saveProgress(progress)` requests a save; use `api.progressStatus` to show ready/pending/saved/error. Only saved confirms host acceptance. Save on milestones/settings changes, not every frame; repeated calls within 20ms return false. Values must be JSON objects under 4096 characters, max depth8, 64 items/keys per container, 256 characters per string.

Mana saves progress per game family (shared by saved versions), with up to 100 game scopes in normal backups. Unsaved drafts use a source fingerprint; editing an unsaved source starts a separate scope. Saving copies its progress into the new saved family. Checks use default progress and never write it.

Exported games have their own browser saves, separate from Mana, keyed by saved family or source fingerprint. Existing Mana progress is not embedded in HTML exports. Reopen in the same browser/storage context to continue. Some browsers restrict storage for local HTML files/private sessions; save status shows error if writing fails. Clearing browser data removes export progress.


### Visual maze level editor

Load maze example to open the Visual level editor above the project assets/files. Choose Wall or Erase/floor, then click or drag across cells. Choose Spawn or Goal to move a marker; marker cells cannot be painted solid. Grid cells also work with Tab and Enter/Space. Undo paint and Redo paint operate on strokes, with up to 50 undo steps.

Apply level updates only level.json. Run game then uses the edited map. Save a new version to retain it after closing, or export the applied project. Discard edits reverts unapplied painting. Unapplied edits are temporary and are not played/saved/exported; apply first.

The editor checks for a route from spawn to goal and disables Apply if none exists. It supports the maze example schema (#/. rectangular rows, max256 cells, tile sizes16–64, map inside480x280, distinct open spawn/goal); other JSON remains editable as source. Existing non-level files, assets and extra level metadata are preserved. Editing is disabled while running, checking or generating.


### Combined game milestone check

Load complete game opens Star maze: four files (main.js, player.js, level.json, animation.json) with the existing character sheet and chime. Run and click Play. Use arrows to collect three stars and reach the green goal via the wall gap. Space restarts; Menu returns to the menu. Theme and best/wins/unlock flag persist; Reset saves clears them. Maximum score is50 (three10-point stars plus20 for the goal). One map is bundled; the unlock value demonstrates saved progress.

Stop/Run to verify restored best/wins/theme. For a permanent named copy, Save as new game, close/reopen and load the version. Paint a change in the visual editor, Apply level, then Run; Save new version preserves the edited map and its related files/assets. Export playable game to test the same project offline; browser progress is separate from Mana. Individual feature examples remain available.

Automated combined-route/backup/export checks passed; actual playback and listening in Mana are user acceptance checks. This milestone covers the current bounded small-game toolkit, not every possible engine/game feature.


### Placing collectible stars

The complete game now reads star positions from level.json's stars array ({col,row} objects). In an older combined project, choose Enable star placements to upgrade its known fixed-position code while keeping project edits/assets. Alternatively Load complete game for a fresh updated example.

Choose Star in the visual editor and click/drag to place stars. Erase/floor removes them; wall painting or moving spawn/goal onto a star replaces it. Undo/redo includes star edits. Apply level, then Run to play the placements; Save version keeps them in backups/exports. Stars must be unique, open, separate from spawn/goal and reachable from spawn, with up to32 total. Plain maze example has no collectible gameplay and does not show the Star brush. Three default stars score10 each; editing their count changes the possible score. Goal bonus remains20.
