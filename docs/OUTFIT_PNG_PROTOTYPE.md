# Outfit PNG prototype

Open **Wardrobe → Outfit PNG prototype**, or **Make outfit PNG** under a generated chat picture. The Create a picture result also has this button.

1. Choose the generated picture. A chat picture opens directly.
2. Click around one clothing piece and choose **Finish outline**. Repeat for separate pieces such as shoes. Only finished outlines enter the PNG.
3. To remove skin, hair, or background inside an outline, enable **Cut a hole / remove an area**, outline the unwanted area, and finish it. Undo point, Undo area, and Clear selection are available.
4. Review the checkerboard cutout and **Preview on body**. Drag the outfit directly in Preview on body to change its position. Arrow keys nudge by one body pixel; Shift + arrow moves ten. Numeric placement and size controls remain available. New clothing pictures use reference framing **.92**. Older pictures use **1**. The preview uses the real body layer and avatar layer order.
5. **Export transparent outfit PNG** writes a new folder under `C:\AI\ManaAI-CV-2\exports\outfits`. It contains `outfit.png` and `selection.json`. The PNG canvas has the exact native body dimensions (default 843 × 1264), with transparent pixels outside the selection.
6. To resume later, choose the same source picture and load its selection JSON. The source dimensions must match. Keep the source file along with the exported folder.

## Included example

`exports/outfits/prototype-summer-dress-v2/` contains:

- `outfit.png`: transparent dress on the default body canvas.
- `preview.png`: preview on her original body and hair.
- `source.jpg`: the generated source picture.
- `selection.json`: manual polygon outlines and alignment; load this after source.jpg.

The example is a manually traced prototype. Its edges can be refined in the editor. The earlier v1 example was rejected for retaining unwanted skin in its outline; use v2.

## Scope

This is a manual extraction and alignment prototype, not automatic clothing segmentation, warping, or a promise that every generated outfit fits. It does not redraw her body and does not install or equip the PNG automatically. It does not include hairstyle editing. Select clothing only; remove unwanted skin/hair/background before adding an exported asset to the wardrobe. The old avatar files and outfit pool are unchanged.

## Outfit-generation changes

- Clothing masks extend to the bottom of the source canvas, avoiding the old outfit's foot cutoff.
- Outfit jobs place both reference and edit mask inside a 92% frame so shoes have breathing room. `generation.json.reference_layout` records the exact resized source and offsets.
- Neck protection stays in the central neck column, avoiding preserved shoulder/strap silhouettes across redrawn shoulders.
- Current accessories are omitted by default for clothing designs. Enable **Keep current accessories in the outfit design** in Create a picture to retain them. The actual avatar's chosen accessories are unchanged.
- The plain gray dress guide was removed after the user reported worse results. Animagine outfit references return to redraw .8 with 28 steps and guidance 5.5. General artwork and vision references remain dressed.
- GPU jobs retain the tested 3 GiB engine memory budget and chat pause/restore handoff.

## Validation

The native exporter rejects non-RGBA PNG headers, oversized canvases, and mismatched selection metadata; it only writes new timestamped export folders. The example PNG was checked for native dimensions, RGBA alpha, transparent background, and inspected over her body layer. Foundation checks cover selection validation/reload, mapping, garment defaults, neck protection, and job cancellation. A mocked tensor route checks matching frame/mask placement without loading model weights. Live user interaction with the new editor still needs review.

## Clothing-only generation (2026-10-22)

Wardrobe → Design an outfit now starts with **Generate clothing only (no person)** enabled. You can also enable it in Create a picture, or ask in chat: **Draw a red summer dress, clothing only using Animagine.** This route skips the avatar reference and mask, requests an isolated complete garment on a plain background, and discourages people/mannequins/skin/hair. A checkpoint may still fail to follow the request; visual quality is pending a live check.

The generation result is a regular picture. Use Make outfit PNG to outline the garment, remove its background, and drag/resize it over her body. This route does not claim automatic transparency or automatic fitting.

## Brush cleanup and preview resizing (2026-10-22)

- **Remove edge background** selects the picture if needed, then removes similarly colored pixels connected to its corners. **Background click** removes a connected area you click, including holes inside an outfit. Lower Background tolerance when light fabric is being removed. This is connected-color cleanup, not AI clothing segmentation.
- **Eraser brush**: drag over unwanted background, hair or skin on the left picture. Brush size is measured in source pixels. **Restore brush** paints original source pixels back into the cutout. A stroke commits on pointer release; canceling a pointer drops the unfinished stroke.
- **Undo edit** removes one stroke, polygon, or complete edge-background action, including any automatic whole-picture selection. Legacy polygon-only selections still load. Brushes and background clicks are preserved in selection JSON.
- The right body preview has pink bounds and four corner handles. Drag a corner to scale uniformly while keeping the opposite corner fixed. Drag elsewhere to move. Arrow-key nudges and numeric controls still work. Outfit size now supports **.02–4** (2%–400%), replacing the old .25 minimum. **Reset position and size** recovers a misplaced outfit.
- Only the actual clothing pixels are exported. Bounds and handles belong to the preview; they do not enter outfit.png. Cutouts cache between alignment changes so background cleanup does not repeat during every drag.

Generation quality remains open. These editor tools improve cleanup and fitting; no new model-quality claim is made by this update.

## Separate tops, bottoms, and shoes (2026-10-22)

The editor now supports up to 12 selectable clothing pieces from the same source picture. Each piece has its own cleanup history, position, and scale.

1. For a generated outfit set, clean up the entire picture first.
2. Use Outline around the bottoms or a shoe and choose **Make outline a separate piece**. The new piece inherits the cleaned pixels inside the outline; those pixels are removed from the original piece. Background already removed stays removed. Rename the piece if needed.
3. Select by its piece button, use **Select piece** on the source picture, or click its visible pixels on the body preview. Drag and resize the selected piece independently.
4. You can also start blank pieces with **+ Top**, **+ Bottoms**, **+ Left shoe**, and **+ Right shoe**, then outline each item from the source. Remove selected piece deletes it. Cleanup undo in a split piece stops at its initial clipping boundary; Clear selection deliberately resets that piece.
5. The transparent view and exported outfit.png combine all pieces in creation order. Preview handles belong only to the active piece. Save/load selection.json retains every piece and the active selection. Old single-piece JSON opens as one piece.

Accessory layer depths remain deferred. All clothing pieces in this prototype share the same final outfit layer. Moving pieces to different avatar depths or automatically equipping them is not implemented.

## Repeated generation

The recent matching image jobs used the same fixed seed 42. New image requests now choose a fresh seed by default. Enable **Keep seed to repeat this result** in image settings to retain it; directly editing Seed also enables retention. The actual seed is shown and saved with the result. This provides variation, not a guarantee of better drawing quality. No new model generation was run to validate aesthetics for this change.
