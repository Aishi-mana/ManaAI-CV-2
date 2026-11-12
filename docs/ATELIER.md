# Atelier

<!-- current-status-2026-11-06 -->
## Current status — 2026-11-06

Current Atelier includes editable review projects/drafts, manual fill/background erasers, point selection, thinner selection lines, toolbar zoom/Ctrl-wheel, default wheel scrolling, front/behind-body placement and Save edits to review beside Continue to save. Setup/drafts can collapse. Do not treat the early session-only/flattened-export description below as a statement that the later project/draft features are missing. Full wardrobe edge-case and schedule acceptance is not implied; see [CURRENT_STATUS.md](CURRENT_STATUS.md).

Open **More → Atelier** or **Wardrobe → Atelier**. Generated chat pictures and Create picture results also offer **Open in Atelier**, beginning at Make with that picture.

Atelier combines the existing Qwen outfit designer and outfit PNG editor into one full-page workspace:

1. **Design** — describe clothing and Generate. Qwen clothing-only defaults are retained. Select **Use picture in Make** to start editing the result.
2. **Make** — choose a local picture or use the generated design. Remove background, outline clothing, erase/restore pixels and separate pieces.
3. **Edit** — select a piece, drag it on the body, resize its pink corners and adjust position/size. Return to Make for cleanup.
4. **Save** — review the transparent outfit and body preview, set the outfit name and select **Save outfit files**.

Changing steps keeps the designer and editor mounted: prompt, generation result, piece selections, cleanup and alignment remain in the current session. Choosing a new generated picture in Make starts a fresh editor draft; opening the Design step alone does not replace anything. The previous source file/selection JSON import still works. Closing Atelier ends this session; save the files to retain the edited version.

Save uses the existing validated outfit export. It creates a new folder under `C:/AI/ManaAI-CV-2/exports/outfits/` containing `outfit.png` and `selection.json`. All clothing pieces are combined on the transparent PNG at the body-canvas size. Keep the original source picture with the JSON when reopening edits. Save outfit files exports to disk. The separate Save to Wardrobe action adds a wearable inventory item; choose it in Wardrobe to equip it. Accessory depth remains future work.

The designer retains its existing image Stop/job ownership/GPU chat pause-and-restore. Switching steps does not cancel its job; closing Atelier unmounts the designer and stops an owned running job. Generation starts only on Generate. No extra generation was run to test the workspace consolidation.

Wardrobe now has its full-page inventory grid; see [WARDROBE_INVENTORY.md](WARDROBE_INVENTORY.md).

Validation:297 frontend foundation tests passed,2 optional skipped; two native real-PNG save/validation tests passed; frontend/Tauri debug build passed. The new navigation test verifies design-to-editor handoff, stable editor identity across steps, replacement only when another picture is explicitly selected, and closing. Live layout, cleanup and saving through the workspace remain user checks.

## Upload and wear your own outfit

In Atelier, **Upload your own outfit image** opens the file picker and switches to Make. The same upload control is available inside Make. Supported files are PNG, JPEG or WebP under10MB and4096px per side. Upload preserves PNG transparency and does not generate or alter the original image file. Isolated uploads begin with reference framing1 rather than the avatar-reference framing0.92.

Clean the image in Make, fit its pieces in Edit, then open Save:

- **Save outfit files** retains the existing transparent PNG and editable-selection export.
- **Save to Wardrobe** writes the fitted combined PNG as a new wearable inventory outfit and refreshes the loaded avatar assets. Open Wardrobe and select it to equip it. It does not change the currently worn outfit automatically.

User outfits are stored in Mana's application-data **wardrobe/outfits/** folder, with one uniquely named folder per saved version containing outfit.png and selection.json. The save status shows the exact folder. This library is merged into avatar discovery and survives application rebuilds; bundled assets, the original upload and existing wardrobe items are not overwritten. Friendly item labels are derived from the saved outfit name. The library is shared across avatar configurations; an outfit fitted for one body may need refitting for a different model.

Keep the original source picture for reopening its selection JSON. **Back up the application-data wardrobe folder separately:** normal settings/chat backups do not embed these wearable PNG files.

Validation:300 foundation tests passed,2 optional skipped;4 native export/import/rejection tests passed;8 avatar path/scan/read tests passed. Two Windows-junction fixtures initially could not be created inside the sandbox; the same asset tests passed outside the sandbox using isolated temporary folders. Tauri debug build passed. Live upload/fit/save/equip through Mana remains a user check. No user outfit or settings were installed/changed by the automated tests.

## Preview visibility and zoom

Use **Outfit visibility on body** or **See through outfit** to see Mana's body beneath the outfit while fitting. This changes the body preview only: exported and wardrobe PNGs retain their original opacity.

Use **Zoom in**, **Zoom out**, or the zoom slider (50-300%) to inspect the images. Scroll inside a zoomed image to reach its edges. Selection, erasing, dragging and corner resizing follow the displayed canvas coordinates. **Reset view** restores 100% zoom and full outfit visibility. Zoom does not resize the saved outfit.

## Direct editing on Mana

Edit uses one main body canvas. The left icon toolbar offers Move/resize, Hand, Eraser, Restore brush, Outline, Outline hole, Background click and Undo. Hover icons for names. Selecting a cleanup tool activates it directly on the fitted outfit: there is no separate Clean on body switch. Edits affect the selected outfit piece only, never the body image. Brush strokes preview live; a pink brush circle shows the affected area. Open outlines display on the body and use Finish outline above the canvas.

Use the piece buttons to choose which garment you are editing. Make still provides the source-image tools for initially separating garments. Edit hides that source canvas to give the body more room. Zoom and opacity remain preview-only. Hand, Space-drag and middle mouse pan the view; Move/resize changes the garment fit. The main Edit canvas starts at a comfortable portrait size rather than stretching to the entire window width. Precise numeric fitting remains expandable below.

Edit now places opacity and zoom together in a floating panel inside the body canvas. Zoom ranges from50% to1200%. Tool changes explicitly reset the native pointer, so a Move cursor cannot remain after choosing Eraser. The brush footprint uses a white/black outline for contrast over light or dark garments. Hand appears only for pan mode or temporary Space/middle-mouse panning. The controls remain outside the scrolling image pixels and are not exported.

## Tool dock, layers and saving (2026-10-23)

Edit has a fixed tool dock containing tool icons, brush size, background tolerance, zoom, opacity, precise fitting, outfit name and Save buttons. Mouse wheel zooms around the pointer; Space or middle mouse pans. Resize is a separate tool that always resizes the nearest corner instead of moving the outfit. Move still offers enlarged corner handles. Brush-pointer movement no longer redraws the entire image; tool-setting labels use a stable layout.

Outfit pieces serve as garment layers (up to12) from the same source image: select, duplicate, hide/show, send backward or bring forward. Each retains its own cleanup and transform. Hidden layers remain in selection.json but are excluded from the rendered outfit. This is garment-layer support, not a full Photoshop document or independently uploaded image layers.

Editable selections now accept up to16MB; the old200KB cap could reject ordinary brushing sessions. Saving no longer duplicates active regions in metadata. If history exceeds16MB, the finished transparent PNG still saves with a flattened selection and a clear message. In that case reopen the saved outfit.png as the matching source; original per-piece edit history is not included. Normal saves retain editable layers with the original source image. Both export and wardrobe install use the larger bounded metadata limit. Drafts are still session-only; save before closing Atelier. This update cannot recover a draft already discarded by an older version.

Ctrl+Z (also Cmd+Z) invokes cleanup Undo in Make/Edit. It removes the last pending outline point first; otherwise it undoes the last grouped cleanup operation on the selected garment. Typing fields keep native text undo. The shortcut does not undo moves, resizing or layer operations, and does not intercept Shift+Ctrl+Z.

## Selecting a skirt or shoe from an outfit sheet

Several items in one PNG initially belong to one layer. In Edit, choose **Outline an item**, click around the skirt or shoe (at least three points), then choose **Separate selected item**. The selected cleaned pixels become a new layer and are removed from the old layer. Choose that layer in **Layers** to move/resize it independently; rename it there if desired. Repeat for other items. **Select layer** picks existing layers only; it does not automatically segment a flat picture.

## Rectangle, freehand and magnetic selection

Edit's icon toolbar offers **Rectangle selection**, **Freehand lasso**, **Magnetic lasso**, and the existing point-by-point **Outline clothing**. Hover for names. Drag a rectangle around an item (Shift constrains it to a square), or drag a lasso around its perimeter and release. The outline closes automatically in the preview. Choose **Separate selected item** to make it an independent garment layer; Move becomes active immediately so you can drag it.

Magnetic lasso provides local assistance toward nearby color/alpha boundaries in the selected garment image, never the avatar below it. It requires tracing around the item; it does not automatically recognize clothing or guarantee a perfect cut along weak edges. Freehand paths are sampled and bounded to200 points for compatibility with existing saved selections. Cancelled pointer gestures restore the prior selection.

## Rotation, free stretch and layer ordering

Resize corners now stretch width and height independently; hold Shift during the drag for proportional scaling. **Fit selected layer**, beside the layer list, has Rotate, Width and Height sliders plus precise numeric values. These controls pivot around the selected garment's own center. Reset rotation/stretch keeps its current placement and overall scale. Rotation is stored in degrees; width/height use multipliers. Existing saved selections default to no rotation and 1x stretch.

Drag a layer row onto another row to reorder it. The top row draws in front. Duplicate, Hide/Show, Send backward and Bring forward now live directly inside the same layer panel; hidden layers remain in saved projects. Selection hit testing, cleanup coordinates and PNG export follow rotation/stretch. Stretch provides independent axes; perspective warping and mesh deformation are not implemented.

## Compact panels and mouse rotation

The tool dock has **Layers**, **Fit**, **View** and **Save** tabs. Selecting a tool opens its relevant settings. This keeps controls close without one long sidebar.

In Move/Resize mode, drag the small handle above the selection box to rotate, or hold Alt and drag. The Rotate tool also lets you click-drag around the garment. Shift snaps rotation to15-degree increments. Corner dragging remains stretch/resize. Rotation keeps the garment's own center fixed.

To arrange layers, drag the **six-dot grip** at the left of a layer row onto another layer. This uses captured pointer events instead of native HTML drag-and-drop, which was unreliable in the desktop webview. Existing forward/backward buttons remain available.

In Wardrobe, equip an outfit and choose **Rename equipped outfit**. Enter a name and Save name. This saves a display-name override in avatar settings, retaining the original outfit ID, PNG and saved-look references. The name survives restart and normal settings backup. The Atelier name field still names newly saved outfits.

## Hairstyle and accessory workspaces

Choose **Make → Hairstyle** or **Make → Accessory** in Atelier's category selector beside the upload button. You can generate an isolated asset in Design or upload your own image, then use Make/Edit's existing cleanup, lasso separation, layers, rotation and stretch. Category changes retain the current editor draft; switching the designer changes its prompt. Choose the matching category before reopening a selection JSON.

For **Hairstyle**, separate front bangs/front hair and back hair into pieces as needed. Select a piece in Layers and set **Selected hair piece → Front** or **Back**. The fitting preview removes the current hairstyle, retains Mana's face/outfit/accessories, and places the new back hair behind the body and front hair over the face. Save produces full body-canvas hair_front.png and hair_back.png plus selection.json. Save to Wardrobe adds a new hairstyle: open Wardrobe → Hair and equip it. All pieces default to Front; a single front-only hairstyle is supported.

For **Accessory**, set **Accessory layer depth** in Layers: Top/over hair, Behind front hair, Behind body or Behind everything. The preview and saved wearable use that depth. All pieces in one accessory share the chosen depth; save separate accessories for different depths. Open Wardrobe → Accessories to equip or remove it. Existing accessories remain visible in the fitting preview for comparison.

Save files for these categories goes under C:/AI/ManaAI-CV-2/exports/atelier/. Save to Wardrobe uses the same persistent app-data/wardrobe library as outfits, under hairstyles/ or accessories/<depth>/. Keep that library in your separate image backups; normal settings backup does not include imported PNGs. Saving does not auto-equip or overwrite bundled assets. Design prompts provide isolated hair/accessory assets; quality and cleanup still depend on the generated picture. No generation-quality claim is implied by the automated tests.

Outfit rename fix: resolved loadouts now preserve outfitNames, so names remain visible after equipping and refreshing instead of being dropped. Existing saved overrides are retained.

## What Make is for

Make prepares the source PNG before fitting it on Mana. If it is already one clean transparent piece, skip straight to Edit. For an isolated picture with background, Select entire picture then Remove edge background is a valid complete Make workflow. For a sheet containing several items, outline one item and apply Finish outline, or use Make outline a separate piece to split it from the other items. An unfinished outline is only a preview: Finish outline or separate it before expecting the transparent preview to change.

Hair placement can now be assigned directly in Make: choose a piece, then **Selected piece goes → In front of face / Behind body**. This updates the same Front/Back setting found in Edit's Layers panel. A piece name is only a label. Accessory depth is also available in Make. Continue to Edit to see the pieces in context and adjust their fitting.

## Undo and redo fitting

Ctrl+Z / Undo now restores fitting as well as cleanup: move, resize, rotation, independent stretch and layer state. Ctrl+Y or Ctrl+Shift+Z / Redo reapplies it. A pointer drag or slider drag is stored as one completed action. Selecting another layer or changing view zoom/opacity does not add an undo step. New edits clear the redo branch. Up to40 completed snapshots are kept for the current source image; choosing a new source starts a new history. Pending outline points still undo first. History is session-only and is not an autosave. Text fields retain native text undo.

## Simplified Make layout

Make now uses one bounded source canvas with the same dock/pan/zoom pattern as Edit. **Edit source** shows your working image; **Check transparent cutout** switches to the result without opening a second full-sized pane. The default source view starts compact; zoom in with the wheel when needed.

In the Layers panel, the short workflow is: Select entire picture → Remove background for one item, or outline/lasso → Apply selection / Separate selected item for several items. Select each hair piece and assign Front/Back in that same panel. View contains zoom/brush/background settings; Save contains upload/project and save controls. Long legacy tool rows and help paragraphs no longer push the source canvas below the fold. Layer settings stay in the dock while the source canvas remains in view.

## Reopen a saved outfit and add slippers

In **Wardrobe → Outfits**, find the saved item (for example kimono) and choose **Edit in Atelier**. This opens its finished transparent PNG as one already-fitted layer in Edit; it does not reconstruct the old source sheet or per-piece selections. The existing saved item remains unchanged.

Choose **Layers → Add image layer**, select your slipper/shoe PNG, then clean, separate the pair if necessary, move/resize/rotate the new layer as usual. Existing layer positions are preserved when the new image is added to the working source sheet. Save to Wardrobe creates a new copy; choose a name such as Kimono with slippers. A new source sheet starts a fresh undo history; keep saving completed versions. Reopening a finished PNG is also the fallback when the original source sheet needed by a saved selection.json is no longer available.

The original kimono currently exists in the app-data wardrobe library at C:/Users/Admin/AppData/Roaming/com.mana.companion/wardrobe/outfits/atelier_kimono-1792708072923964400/outfit.png, beside selection.json. No original was changed during this update.

Resize undo fix: completed fitting gestures are now committed directly with their before/after transforms, rather than depending only on an effect after pointer release. Undo no longer falls back to removing a cleanup selection when a fitting step was missing.

## Adding images without replacing your draft

The top **Add image layer** button and **Layers → Add image layer** now share the same upload action. Each selected image becomes another layer, keeping the current outfit and fitting in place. You can select the same file again to add another copy. Adding from Edit keeps you in Edit. Wait for an import to finish before adding another image.

**Replace source image** is a separate control in the source/project controls. It asks before replacing the working image and layers; it does not overwrite your saved wardrobe item. If an earlier draft was replaced, reopen the saved kimono through Wardrobe → Outfits → Edit in Atelier, then use Add image layer.

Edit now starts in Move mode when reopening an item. Adding an image or choosing a layer clears previous Resize/Rotate modes. Drag visible pixels to move; choose the four-arrow Move icon to return from a cleanup tool. Hand pans the view; eraser and outline act on pixels/selections instead of moving.


## Mana-generated outfits and review queue

Wardrobe → For review now supports local outfit-only creation, remembered review/immediate save modes, durable pending PNGs, previews on Mana, approval, Atelier editing and dismissal. See docs/GENERATED_OUTFITS.md. Initial fit remains editable; periodic weekly creation is not enabled.


## October 31 — fit-only outfits and body depth
New clothing-only generations retain fabric: automatic matte, underarm, collar and opening cleanup is disabled. Fitting, sizing, body-free source validation and fit warnings remain. Exterior background removal still prepares transparency. Legacy recovery preserves its older behavior.

In Atelier, outline a region without applying/erasing it, then choose **Send behind body**. The editor separates that selection into an editable back layer; **Bring in front of body** reverses its placement. Without an outline, the action moves the whole active layer. The original source is retained; front hair still draws over front clothing. Layer names show body placement.

Review projects and approved wardrobe outfits preserve front/back PNGs and editable source. Direct wardrobe exports also retain a project for reopening. Existing saved outfits are not modified.

Validation: 12 garment tests, 20 native outfit tests (including save/approval persistence), frontend regression suite and application build. Manual app visual acceptance remains for the user.

October 31: Atelier import, draft library/banner and category/upload controls now live in a collapsed Setup & drafts section. Its summary indicates available saved drafts; stage navigation stays visible. Expanded setup scrolls within 35% of the viewport and does not remount the editor.

October 31 editor follow-up: Edit uses the remaining workspace height. Save edits to review is rendered in the shared footer beside Continue to save. Zoom view is an explicit toolbar tool; wheel scrolling remains native for other tools. With Zoom view active, wheel zoom preserves the point under the pointer. Existing zoom slider/buttons and Space/middle-button pan remain.

October 31: added Polygonal Lasso toolbar tool. Click successive anchors; the next segment follows the cursor. Click within 10 screen pixels of the first anchor or press Enter / Close selection to close. Backspace undoes a point; Escape cancels. Closing does not apply an erasure: selection remains available for Send behind body / separation / Apply selection. Existing outline and magnetic/freehand tools remain.

October 31 precision controls: selection strokes now remain one screen pixel wide regardless of canvas zoom; anchor markers are smaller. Ctrl+wheel (also Meta+wheel) zooms under the pointer from any editor tool, while unmodified wheel scrolling remains native unless Zoom view is active.


## October 31 — occasional hair/accessories and review tools
- Separate persisted Off / weekly / twice-weekly schedules in each creation section under For review. Defaults are Off. Background runners live in App and work while the wardrobe is closed, Mana is idle for two minutes, chat model is ready, and the app is visible. All three occasional creation timers share a synchronous queue lease. Claims advance durably before generating: no missed-week backlog, failures wait for the next slot. Status/Stop appears during background work; last result is saved.
- Automatic hairstyles vary the style direction while using the original silver-hair reference and existing fitting pipeline. Accessories use Mana's chat idea generator. Both always enter review and never auto-equip or auto-approve.
- Hair/accessory review now offers search (including notes), category/status filters, sorting, rename, duplicate, needs-edits notes, batch approve/dismiss with confirmation, and Restore initial fit with confirmation. Restoring creates a new revision without regenerating; old revisions remain.
- Inspect / compare uses the roomy outfit comparison UI, with source / initial fit / current edits, linked scrolling, View alone, zoom, and hair/face close-ups. Source-generation metadata survives later editor saves. Older accessory items without raw source show their stored source image.
- Original saved wardrobe items are not changed. Existing review records default cleanly to empty notes and Needs edits off.

Testing to do in Mana: enable hair/accessory schedules independently; create one of each manually to test the same generation path; inspect initial/current, toggle On Mana and View alone; rename/add notes, filter, duplicate and edit the duplicate; restore initial fit; approve/dismiss selected reviews. The scheduler itself was tested with simulated due times, not a live multi-day wait. No fresh GPU generations were run for this UI/scheduling update.
