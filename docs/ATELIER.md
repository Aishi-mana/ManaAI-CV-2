# Atelier

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
