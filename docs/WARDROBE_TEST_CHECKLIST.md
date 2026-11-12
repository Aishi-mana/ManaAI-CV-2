# Wardrobe and Atelier testing checklist

<!-- current-status-2026-11-06 -->
## Current status — 2026-11-06

Retain unchecked items as unverified; earlier user acceptance of individual fits/tools does not pass every case here. Current automation performs clothing generation/fitting and leaves garment cleanup/occlusion to manual review. Hair/accessory creation and schedules exist. Do not run new wardrobe experiments as part of the music/doc audit. See [CURRENT_STATUS.md](CURRENT_STATUS.md) for the latest music test queue.

Start with existing pending designs and drafts. Most checks below need no new generation. These are user acceptance checks; automated tests do not establish visual quality for every generated design.

## October28 follow-up

The partial user test found a blocker: socks/shoes fit misses prevented review and recovery repeated the same error. The updated fitter now retains these drafts with warnings rather than aborting. A copied replay of the failed source produced a PNG with shoe and cuff warnings. After updating, try Resume fitting without regeneration to bring that design into manual review. This does not claim the imperfect fit itself is automatically repaired. Other checklist items remain unconfirmed unless you checked them.

## First: review tools (no generation needed)

- [ ] In Wardrobe → For review, rename a pending outfit. Search for its new name; sort newest/oldest/name. Reopen Mana and verify the name remains.
- [ ] Add review notes, tick Needs edits, click Save notes. Filter Needs edits; restart and verify both persist. Untick and save to remove the label. Notes must not change the outfit pixels or undo history.
- [ ] Open Inspect / compare. Try Whole, Collar, Shoulders, Cuffs and Shoes, zoom and On Mana. Compare Generated → Initial fit → Current edits. Older designs can legitimately lack an earlier stage; the UI should say unavailable.
- [ ] With On Mana enabled, toggle Show front hair off/on. Clothing behind front hair becomes visible, back hair stays, and the garment does not change. Close/reopen inspector and confirm the outfit is intact.
- [ ] Edit a pending outfit in Atelier, save edits to review, then compare again. Current edits should change; Initial fit should retain its original appearance for designs created after snapshots were added.
- [ ] Select two disposable pending designs. Test Cancel first. Confirm Save selected to Wardrobe; both appear as separate items and Mana's equipped look stays unchanged. Test Dismiss selected on disposable items. Needs edits selections show a reminder before batch saving. A failed item should report an error rather than hide failures behind a success count.

## Comparison and precision controls (no generation needed)

- [ ] Open Inspect / compare in a wide window. Pick left/right stages, zoom, linked scrolling and View alone / return. Reduce window width: panels should stack at widths below1100px, stay large, and remain scrollable. Expand Close-ups and view controls when needed; Fit width resets magnification.
- [ ] Duplicate a pending review. Change the copy in Atelier and verify original pixels/notes/history remain unchanged. Initial fit and original generated preview should remain available if the original had them. Save or dismiss the copy independently.
- [ ] Lock a layer, then try dragging, resizing, arrows, numeric fitting and brush cleanup. Its pixels/position should stay unchanged. Unlock and repeat. Undo/redo should also restore the lock flag.
- [ ] Solo a selected layer and enable guides. Switch between layers to inspect them; guides and solo must not be baked into saved or exported images. Hidden layers still follow their normal export visibility.
- [ ] Try1/5/10pixel nudge buttons and arrow keys; Shift-arrows use10times the selected distance. Size/aspect/rotation should stay unchanged. Center layer horizontally should only move it sideways.
- [ ] Export editable project from Layers panel or Save step. The status gives its new file in exports/atelier-projects. Import that .mana-project.json from Atelier's Import editable project control. Verify source PNG, separate layers, lock flags, brush edits, depth and undo/redo. Imported backups are standalone working copies, not authority to overwrite the old review.

## Next: drafts and editing (no generation needed)

- [ ] Open an outfit in Atelier. Move, resize and erase a small area. Undo/redo each change; resize undo must restore size rather than remove the outfit. Add another image layer and verify existing pieces remain in place and history still works.
- [ ] Wait for “Draft saved on this computer.” Close Mana normally, reopen Atelier, and resume. Check layers, source image, fitting, brush edits, depth and undo/redo. A crash before an autosave finishes is not guaranteed recoverable.
- [ ] Make a second separate project. Open Draft library, Refresh drafts, search by name and filter Outfits/Hair/Accessories. Resume each project and confirm one has not replaced the other. Discard a closed disposable draft and verify the others remain. Discarding the currently open draft does not disable its autosave.
- [ ] For a linked pending-review draft, save edits to review. An older draft must be rejected if the review revision has since changed; the saved review must remain intact. Saved/dismissed reviews also cannot be overwritten from old drafts.
- [ ] Approve an edited outfit, then use its Wardrobe Edit in Atelier button. Retained projects should reopen as an editable new copy. Older PNG-only items cannot recover history that was never saved.

## Then: one new outfit end to end

- [ ] Use For review mode and a custom design description first. Watch Load → Generate → Fit → Resize → Check fit → Clean → Save. If it fails, the failed step and actual error should appear. If a reusable image exists, Resume fitting without regeneration should reuse it.
- [ ] Inspect collar, both shoulders, sleeves/cuffs, torso, sock rims and shoes. Covered areas should not show unintended skin. Clothing under front hair must remain intact; no hair or skin should be baked into the clothing layer. Expected collar/short-sleeve skin openings are not errors.
- [ ] Check fit warnings, make any needed manual adjustment, save edits to review, reopen and approve. It should produce one separate wardrobe item with the chosen name. Generation still needs visual review; the checks are bounded, not a universal quality guarantee.
- [ ] With chat model ready, leave description blank so Mana invents an idea. Try a chosen season. A custom description should override invention. A stopped/invalid chat model should report an error before generating an invented outfit.
- [ ] For immediate-save preference, a clean passing result should save as a separate wardrobe item; a result with fit warnings should remain pending. Equipped look should stay unchanged.

## Later, when convenient

- [ ] Leave weekly scheduling enabled and confirm one outfit is created while Mana is open/visible/idle when due, respecting the review/save preference. Missed weeks should not create a backlog.
- [ ] Generate one hairstyle and one accessory if you still want to test those earlier additions. Hair should contain independently editable front/back pieces with uniform fitting; accessory should reopen with its chosen depth. Both remain review items until approved. Art style/edge quality still require visual checking.
- [ ] Verify Daily looks still has separate Morning/Night grids and Seasons has Spring/Summer/Autumn/Winter grids, with assignments preserved.

For any failure, retain the pending item/source and note the item name, failed step, and what you expected. A close-up screenshot helps diagnose fitting without generating again.

## Hair landmark fitting acceptance (October28)

- [ ] Create a fresh hairstyle with the updated build. Check scalp coverage, bangs near the brow/eye line, visible pupils, natural side-hair placement and common front/back top. Whole-layer uniform fitting should require little or no positioning work on the tested types.
- [ ] Alternatively import one of exports/atelier-projects/hair-landmarks-42-20261028.mana-project.json, hair-landmarks-1729-20261028.mana-project.json or hair-landmarks-6841-20261028.mana-project.json; these are ready test sources/layers, no new image generation needed.
- [ ] Check fit warnings persist on generated hair review cards. Unusual source shapes or missing eye landmarks should ask for review rather than imply a guaranteed fit.
- [ ] Compare with exports/images/hair-landmarks-20261028/contact.jpg. Art style may still vary, and these hair checks do not validate every outfit design.


### October 29 generation checks
- Fresh hair: enclosed lower outer curl gaps should show the background; silver crown highlights stay opaque.
- Fresh outfit: check sock sides/toes, long-hem designs with separate socks, long-sleeve inner-arm coverage and cuffs.
- Shoulder fabric hidden by front hair must remain intact. Hand/neck/shoulder regions are not resized by sleeve adjustment.
- Inspect for faint duplicate outlines at old garment positions after fitting.
- Cuff/torso warnings still require review; do not assume every generated design fits without edits.
- Older saved designs remain unchanged. Cached recovery repeats fitting without new image generation.


### Arm / separation / hair edges follow-up
- Retry fitting on an unfinished generated outfit; wrist corrections should continue through cuffs.
- Open a prepared outfit in Atelier: Main clothing, Left footwear, Right footwear should move independently, preserving socks and buckles.
- Separation is for editing within an outfit, not independent wardrobe shoe equipping.
- Hair edges on a colored background should have less white jagged fringe. Interior linework/highlights stay intact.
- Some torso/cuff/design cases may still require review. Shoulder cloth hidden behind front hair must remain untouched.

### Fresh production cleanup validation — 2026-10-30
- Generate a NEW long-sleeve outfit; inspect automatic result before any manual brushing.
- Inspect collar/back rim and cloth under front hair; no fixed V cut or shoulder erasure.
- Inspect cuff ends and inner arms, then skirt sides: smooth continuous outlines without duplicated slivers or patches.
- Inspect both socks/shoes for toe/calf coverage, and verify three editor groups (main/left footwear/right footwear).
- Review remains necessary for designs outside bounded fit; coverage metrics alone do not establish visual quality.
- Reference newly generated automatic example: exports/images/fresh-production-20261030/final-clean-confirmation/composite.jpg and collar-arms.jpg. This source was generated fresh under frozen production hashes, without manual pixel edits.

### Worn fit acceptance — 2026-10-30
- Judge wearing appearance, not coverage alone: shoulder seam follows shoulder slope, torso fits actual body, cuffs enclose wrists without broad boxes over hands.
- Check both armpit gaps for opaque white background; retain white cuffs and collar.
- Inspect a fresh long-sleeve blouse and a loose dress; ambiguous sleeve/skirt joins must stay review-only instead of getting forced patches.
- Check shoulder cloth behind front hair remains complete; collar center, skirt and footwear must not move during shoulder correction.
- Diagnostics must flag oversized cuffs even when inner-arm skin is entirely covered.
- Current automatic fresh sample: exports/images/worn-fit-20261030/fresh-blue-blouse/composite.jpg; closeup collar-arms.jpg. Previous lavender final-clean-confirmation was rejected by user and must not be cited as accepted.

Final frozen-code fresh source for visual review: exports/images/worn-fit-20261030/final-blue-confirmation/composite.jpg and collar-arms.jpg; seed18122; no hand edits. Future generations updated, final acceptance is visual.


### Clothing-only source generation — 2026-10-30
- Inspect the RAW generated image before any fit: no neck, hands, legs or other body parts. Hollow openings must remain background.
- Generation reference must show only a clothing layer, never Mana's body/hair; body pixels are used only for fitting afterward.
- An invalid anatomy-containing source must stop before fitting with source-validation accepted=false. It must not be repaired into a passing example.
- First new body-free source: exports/images/clothing-only-20261030/body-free-blue/image.jpg. Source validation accepted; zero body-removal cleanup. Its cuff fit is still warned and must NOT count as full automatic fitting acceptance.

### Automatic wearing fit — 2026-10-31
- Use new body-free source policy; no anatomy salvage or saved-outfit replacement.
- Check sleeve ends/cuffs at wrists, hands clear, smooth continuous sleeve outlines and no floating scraps or skirt notches.
- Collar opening must show Mana's original neck; retain actual collar/back rim and complete shoulders under front hair.
- Review automatic example exports/images/wear-cleanup-20261030/body-free-blue/composite.jpg and collar-arms.jpg. No regeneration or hand painting. User acceptance still pending.

### Manual color cleanup tools — 2026-10-31
- Atelier > Edit: choose Fill, Background Eraser, or Magic Background Eraser in toolbar; settings are under View.
- Fill: choose color and click a connected area; test an enclosed transparent hole too.
- Background Eraser: begin on background color and brush across the edge; differently colored fabric should stay.
- Magic Background Eraser: click one connected area and adjust tolerance for the edge.
- Undo/redo, save/reopen editable project, and locked-layer protection should preserve these edits.
- Collar: rear rim should be hidden under real neck at center, retain visible sides/front collar and shoulder fabric.


## October 31 — occasional hair/accessories and review tools
- Separate persisted Off / weekly / twice-weekly schedules in each creation section under For review. Defaults are Off. Background runners live in App and work while the wardrobe is closed, Mana is idle for two minutes, chat model is ready, and the app is visible. All three occasional creation timers share a synchronous queue lease. Claims advance durably before generating: no missed-week backlog, failures wait for the next slot. Status/Stop appears during background work; last result is saved.
- Automatic hairstyles vary the style direction while using the original silver-hair reference and existing fitting pipeline. Accessories use Mana's chat idea generator. Both always enter review and never auto-equip or auto-approve.
- Hair/accessory review now offers search (including notes), category/status filters, sorting, rename, duplicate, needs-edits notes, batch approve/dismiss with confirmation, and Restore initial fit with confirmation. Restoring creates a new revision without regenerating; old revisions remain.
- Inspect / compare uses the roomy outfit comparison UI, with source / initial fit / current edits, linked scrolling, View alone, zoom, and hair/face close-ups. Source-generation metadata survives later editor saves. Older accessory items without raw source show their stored source image.
- Original saved wardrobe items are not changed. Existing review records default cleanly to empty notes and Needs edits off.

Testing to do in Mana: enable hair/accessory schedules independently; create one of each manually to test the same generation path; inspect initial/current, toggle On Mana and View alone; rename/add notes, filter, duplicate and edit the duplicate; restore initial fit; approve/dismiss selected reviews. The scheduler itself was tested with simulated due times, not a live multi-day wait. No fresh GPU generations were run for this UI/scheduling update.
