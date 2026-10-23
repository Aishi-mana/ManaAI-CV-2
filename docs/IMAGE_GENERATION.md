# Local image generation

Open More → Create picture. Pick a local checkpoint, describe the picture and Generate. Image settings expose negative prompt, dimensions128–1024 (multiples64), steps1–50, guidance1–15 and seed. Default selection is Animagine SDXL if installed, then Photon/another supported SD checkpoint. SD1 defaults512px; selecting SDXL/Neta switches to1024px. Neta uses guidance4. A fixed seed repeats settings; change seed for a variation.

Use CPU leaves GPU memory for chat, with slower generation. GPU jobs share resources with other local models; the tool does not stop another app or unload your chat model. Only one image job runs at a time. Stop or closing the drawer cancels Mana's owned job tree; no external Comfy/other application processes are killed. No model loads until Generate.

## Installed backends

- Stable Diffusion: C:/AI/stable-diffusion.cpp/build/bin/Release/sd-cli.exe, compiled installed engine, for supported SD1/SDXL full checkpoints.
- NetaYume: installed Comfy Python environment and Lumina2/Gemma tensor/conditioning library, invoked as a standalone script. This avoids opening ComfyUI or running its server; it still depends on those installed libraries. Uses all-in-one checkpoint embedded text encoder/tokenizer/VAE. No custom nodes are loaded.
- Model directory: C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Shared/models/checkpoints. Files remain in place. Discovery reads bounded headers to classify models; unsupported Flux/HiDream/other layouts are disabled rather than guessed. No dependency/model downloads are performed.

Generated originals and request/generation JSON metadata are saved under exports/images/image-*. The drawer displays the original JPEG path. Save to image library adds a smaller prepared JPEG to More → Saved images and normal backups. The separate disk-original files/sidecar metadata are not embedded in library backups. No automatic depiction/identity/provenance claims are assigned to the character in the image. Existing library limits apply.

Backend connection tests: one128x128, one-step CPU generation succeeded for Photon/SD and NetaYume35 all-in-one. These tiny outputs are diagnostic, not quality samples; no normal/full generation was run for acceptance. Neta import preflight passed. Native request bounds/tensor-header classification and frontend request/cancellation tests cover the integration. Live check: generate a normal picture, save it, inspect Saved images, and test Stop.

Local picture generation final validation (2026-10-19): 257 frontend tests passed, 2 optional skipped; 2 native image-generation tests passed; frontend production build and native debug build passed. Native executable replacement succeeded after the user closed Mana. Normal-resolution picture quality, library Save and Stop remain live user checks.


## NetaYume speed correction — 2026-10-19

User confirmed Photon generation/library Save, NetaYume generation and Stop work. NetaYume took roughly10–20min versus <=3min in their ComfyUI workflow. Found standalone launcher forced --lowvram, which can force Gemma text encoding to CPU. Removed forced lowvram on GPU jobs; retain explicit CPU option and normal automatic offloading. Added inference mode around conditioning, encoding status, INFO device/load logs and cumulative stage elapsed_seconds in generation.json. No server connection, custom nodes, downloads, sampler/quality changes, other-app edits or new image generation. Installed-library preflight confirms NORMAL_VRAM and text encoder cuda:0. Frontend build and257 tests passed(2 optional skipped). Actual speedup and comparable-quality timed run remain pending; do not promise <=3min. Prior checkpoint-size explanation was insufficient: combined checkpoint size alone does not establish required GPU memory.

## Image generation accepted — 2026-10-19

User passed local image generation: Photon generation and library Save, NetaYume generation, Stop, and corrected standalone NetaYume speed around3 minutes (previously10–20min), comparable to their ComfyUI experience. Keep current GPU normal-memory setup; no server connection. Manual Create picture workflow accepted; do not repeat costly generation tests. General visual quality still depends on prompt/model/settings; no blanket quality guarantee. Future request: Mana may design her own outfits. Record only for later: generated pictures are concepts, not automatically usable layered avatar assets; fitting/rigging/import and user approval would need a separate workflow. Do not implement outfit generation or automatic outfit installation now. Next image-generation scope to confirm: conversational picture requests through Mana versus additional manual editor features.

## Request a picture in chat

After reopening Mana, try `draw me a moonlit garden`, or `create an image of a cat using NetaYume`. The application opens Create a picture and starts one local generation. Use that panel to view the result, Stop, adjust settings or explicitly Save to image library. Without a backend suffix, Animagine is preferred. Questions about image generation do not launch a job. Image attachments still use the existing vision-inspection path. Hands-free pauses while the picture panel is open.

The standalone implementation and its dependencies are documented in [NETAYUME_STANDALONE.md](NETAYUME_STANDALONE.md). Chat launch passed automated checks; live chat-request acceptance is pending. Manual generation, library Save, Stop and NetaYume speed around3 minutes have already passed user checks.

## Current chat display — inline pictures

Chat picture requests now show a progress/Stop card directly in the conversation, followed by the actual generated image and Save to image library. They no longer open the drawer. More → Create picture still opens the manual settings drawer. Completed chat pictures survive reload and archiving and are included in backups; library Save is separate. A bounded prepared JPEG is retained in the assistant message. Text exports omit pixels. The actual Saved Images gallery redesign is deferred.

For reuse in another application, see [Standalone setup for other apps](NETAYUME_SETUP_FOR_OTHER_APPS.md). This is distinct from [Mana implementation notes](NETAYUME_STANDALONE.md).

## Model selection and enlargement

Animagine is now the default when installed. Use `draw me a cat using Animagine`, `using Photon` or `using NetaYume` to select explicitly. Progress and completed generated pictures show their checkpoint/model and seed. Same seed/prompt/model/settings can repeat the same image; change Seed in the manual Image settings for a variation. Click a chat picture or Enlarge image to open its prepared JPEG in a larger native dialog; Close image or Escape returns to chat. Archived generated pictures also support this viewer. The viewer enlarges the saved preview, not a new generation or upscale.

## Gallery and avatar/outfit references

More → Image gallery now shows a thumbnail grid with search and date sorting. Select a picture to inspect, enlarge, label or delete its library copy. Its storage/backups are unchanged. Separate generated chat pictures and disk originals remain when a library copy is deleted.

Manual Create picture offers Use Mana’s current avatar as a starting image. Explicit chat requests such as `Draw yourself in a summer outfit using Animagine` enable it too. It composites her current neutral avatar layers, pads them to the output canvas and runs image-to-image at strength/denoise0.65. Both SD/Animagine and standalone NetaYume support this path. This can retain some appearance/composition; resemblance is not guaranteed. No avatar is silently sent for unrelated requests. More detail: [standalone setup guide](NETAYUME_SETUP_FOR_OTHER_APPS.md).

Wardrobe → Design an outfit opens an editable outfit-concept prompt with avatar reference enabled. Press Generate to create a concept. These are pictures, not wearable avatar layers: no rigging, layer slicing or automatic installation is performed. Avatar-referenced quality and resemblance need live review.

## Full gallery workspace (2026-10-21)

Image gallery now occupies its own full app workspace, matching Music Studio navigation. Back to chat returns to the existing conversation. Thumbnail search, date sorting, detail/enlarge, labels and deletion keep the same saved library. User passed self-reference and outfit concepts with fidelity improvements still desired. Final requested outfit workflow is clothing-only transparent PNGs aligned to the avatar so they can be worn; that asset conversion pipeline remains unfinished.

## Disk gallery storage (2026-10-21)

The current gallery no longer has an8MB total or100-picture limit. Full saved-gallery JPEGs are in Mana's application-data gallery folder, whose exact path appears at the top of Image gallery. The app keeps metadata, SHA256 fingerprints and280px thumbnails in its existing saved-data store. Selecting a picture loads its larger saved copy from disk. The existing saved-copy resolution/quality is retained; original generated outputs remain separately in exports/images.

On first startup, legacy embedded pictures migrate automatically. Original legacy JSON is preserved as legacy-images-v1.json (or a timestamped recovery file) in the gallery folder before migration. IDs, dates and Mana-confirmation labels remain. Only after all image writes are verified does the app commit the compact index. If migration fails, old records stay and Retry gallery setup is available. Do not delete recovery JSON while checking the migration.

**Back up both the normal Mana backup and the gallery folder.** The normal backup contains thumbnails, metadata and disk references; it does not embed full disk-gallery pictures. Put the folder in the equivalent app-data location when transferring to another computer. Missing full files display an error rather than pretending a thumbnail is the original. Old backups with embedded JPEGs remain importable and migrate after restore.

Deleting a gallery picture removes its indexed gallery file. Metadata-only backups cannot recover that full file. Separate generated originals, generated-chat copies and migration recovery files are not deleted. The old separate chat-image budget is unchanged. Disk capacity and per-picture prepared-JPEG limits still apply; unlimited image size is not implied.

Disk gallery final verification: frontend267 passed/2 optional skipped; final native gallery test passed outside sandbox after Windows blocked its isolated temporary-file rename inside the sandbox (same test, no user gallery touched). Frontend and native debug builds passed. Automatic real-data migration awaits user restart/live check.

## Self-reference controls (2026-10-21)

New avatar-referenced requests use1024px reference preparation, portrait output framing and explicit instructions to preserve the supplied character's identity while allowing your requested changes. Reference variation defaults to0.45 rather than0.65. In manual Create picture, check the avatar reference option to expose the0.2–0.8 slider: lower preserves more of the reference; higher allows larger outfit/pose changes. This remains image-to-image; visual resemblance is not guaranteed. Existing requests lacking referenceStrength still use0.65 when rerun directly. Compare one generation with your prior prompt before running a batch.

## Clothing-only reference edits

A self-reference request mentioning a dress/outfit or other clothing now enables a clothing edit region and uses0.75 variation inside it. General self-reference keeps0.45. The region comes from the current outfit layer's alpha bounds, widened for clothing changes, with hair/accessory silhouettes protected. This is approximate region editing, not garment segmentation. Face/head above the outfit region stay from the reference; the original pose remains. Manual Create picture exposes Edit clothing region only when avatar reference is checked. Disable it for broader pose/appearance changes.

Both backends apply the edit mask during sampling and retain reference pixels outside its soft boundary. Original request/result/mask are kept in the job folder. Live dress quality and seams still need user review. This remains full-character concept art, not a clothing-only transparent PNG or wearable asset.

## Animagine clothing prompts

Animagine clothing edits now put the actual requested garment first in a concise tag prompt instead of burying it in instruction prose. This follows the [official model's tag-based guidance](https://huggingface.co/cagliostrolab/animagine-xl-4.0). Dress requests exclude hoodie/sweatshirt/shorts unless those garments were explicitly requested too. The protective clothing mask and other models' prompt behavior remain unchanged. This improves instruction routing; garment adherence still requires visual review.

Animagine candidate outcome: no completed image accepted. After user stopped model, a final host comparison still spilled to RAM (~39s/step). Stopped only exact-request-path-matched owned Python process tree to avoid a long run; no unrelated models/apps stopped. Two earlier GPU attempts failed memory checks. Prompt compiler is deployed and automated tests/builds passed, but visual dress adherence is pending one user run with sufficient free GPU memory. Do not repeat generation automatically or claim candidate quality verified.


## 2026-10-21 — GPU image/chat handoff (built; live validation pending)

GPU picture jobs now temporarily unload only the chat server started by Mana, then restore it after completion, Stop, startup failure, or closing the image panel. An explicit Stop model prevents automatic restoration. CPU images keep chat loaded. Externally started chat servers are left untouched and produce an actionable message before a GPU image starts. Job ownership and GPU leases also cover cancellation during startup.

Worker GPU-memory errors now have a short message; complete diagnostics remain in the image job’s `job.log`. Native polling preserves the worker’s structured error instead of replacing it with a traceback. The Animagine garment-tag prompt remains included; clothing quality is still awaiting live validation.

Validation: frontend build passed; 4 focused handoff/lifecycle tests passed; 2 native image tests passed; Python syntax passed. Full foundation result recorded in work/image-memory-final-tests.txt. No model generation was repeated. `npm run tauri build -- --debug --no-bundle` reached native linking but Windows denied replacement of the open target/debug/mana.exe. After the user closed Mana, the same Tauri build succeeded and replaced target/debug/mana.exe. The bundled scripts/image_job.py SHA256 matches source. Foundation suite: 274 passed, 2 optional skipped. User live image test remains pending.


## 2026-10-21 — SD GPU budget follow-up
The user's rebuilt app reached the new friendly error, but image-1792587000062818200 still exhausted VRAM with 4900 MB of resident UNet weights and no workspace. Read-only process inspection found another Qwen server on port 8090 alongside Mana's own 8080 server (plus CPU Gemma servers on 8766). None were terminated. Current GPU usage after chat restoration is not evidence of usage during image sampling.

SD worker now uses explicit --max-vram -1 (reserve 1 GiB of live free memory), sequential CFG, tiled VAE, and CPU text encoding. Confirmed flag semantics in the installed sd-cli help and local engine source; this enables graph segmentation under an explicit budget rather than an unlimited budget. CPU and NetaYume settings remain unchanged. Two Python memory-policy tests passed. Updated worker copied to target/debug/scripts/image_job.py; SHA256 matches source. No executable/frontend change needed, so no close/rebuild needed for this worker-only fix. No fresh generation run; user live validation pending. Unrelated servers are left alone.


## 2026-10-21 — SD memory budget verified with a real diagnostic
The next user attempt image-1792588110450445500 confirmed --max-vram -1 still allowed ~5989 MB managed residency and failed with 4900 MB UNet weights / zero free device memory. Replaced the automatic reserve with an explicit 3 GiB cap; sequential CFG, CPU text encoder, and tiled VAE remain enabled.

After user pressed Stop model, ran ONE two-step diagnostic at the original 768x1024 with saved original prompt/reference/mask/strength using the updated source worker. exports/images/memory-diagnostic-1792588214704768000 reached ready and wrote output.png/image.jpg, ~19.74 seconds. This verifies allocation, sampling, decode, and masked output; two steps do not establish final image quality. No chat/library entries changed and no unrelated processes were stopped. Copied updated worker into target/debug/scripts/image_job.py; matching SHA256 190EF315A3BD5B2CEF1EBD6BEEFA298A3998F51B8CA8E43761F782A63556C3BE. No app restart required. Two Python policy tests pass. User full 20-step image test pending; chat was intentionally left stopped per the diagnostic request and can now be started normally.


## 2026-10-21 — Visible hair protection in clothing masks
User's full generation image-1792588340742550200 finished (GPU budget fix works) but retained hoodie torso above an edited skirt/lower body. Inspected saved clothing-mask.png and raw output.png: back-hair silhouette incorrectly protected the entire upper torso, even though body/outfit render above it.

prepareAvatarClothingMask now composites protection in actual avatar layer order: hair/accessories add protection; body, outfit, and other overlying layers remove occluded protection. Visible front hair is then protected again. Face remains outside the outfit bounds. This changes the edit mask rather than prompts or denoise. Source and frontend build pass. Added layer-order regression for opaque hidden back hair vs visible front hair. No new generation requested/performed. Native executable rebuild and live mask/image validation pending if Windows still holds mana.exe open.


## 2026-10-21 — Outfit quality review remains open
User requested finishing outfit editing before other features. User stopped chat for ONE real candidate: exports/images/outfit-quality-check-1792589119566383100/image.jpg. Saved same reference/mask at 768x1024, 28 steps, cfg 5.5, strength .8, seed42; simple sundress, wide shoulder straps, closed-toe shoes. Completed successfully. Visual review: feet and strap construction improved, but collar/neck edge and anatomy still need work. Do not mark outfit quality or wearable asset pipeline passed.

Frontend adds 28-step/cfg5.5/.8 defaults for initial Animagine clothing references, defaults closed-toe footwear unless user specifies footwear/bare feet, and wide summer-dress straps unless a construction is specified. Explicit strapless/sandals requests preserved. No changes to worker memory policy. Candidate also requested simple/knee-length clothing; those specifics were NOT made universal defaults. Full foundation 276 passed, 2 optional skipped; frontend build passed. Native packaging being attempted; if locked, close Mana and rerun npm run tauri build -- --debug --no-bundle. The next work is collar/neck edge and body consistency, not switching to artwork or claiming finished quality.


## 2026-10-21 — Preserve neck anatomy for outfit edits
User found pasted-head appearance on image-1792589410588803000. Raw output.png already contains over-dark red neck shadow: final composite alone is not the cause. First experiment removed outfit layer from conditioning; neck remained too red. Second experiment also protected original underlying body neck/shoulder transition with a soft ~1.3%-height lower fade. exports/images/neck-skin-check-1792589802696287400/image.jpg completed in 48.71s; visible neck connection improved and red band removed. Two total test images in this turn, no automatic batch/retry. Diagnostic manually composed default body/hair/eyes/mouth; last candidate omitted optional headset/hairclip, so it is a neck test rather than a complete selected-accessory fidelity test.

Implementation: prepareAvatarReference receives clothingEdit flag, uses generationReferenceLayers to exclude old outfit only in clothing edits. Vision/general artwork references stay dressed as before. prepareAvatarClothingMask retains original visible-layer hair protection and adds a body-derived neck protection gradient. neckTransitionRow detects narrow neck widening into shoulders in the standing base layer; unsuitable silhouettes skip added neck protection. App passes clothing-edit mode to reference preparation. Selected actual app accessories remain in the real reference via buildLayers. This is concept editing, not wearable PNG export.

Frontend build and focused reference/neck tests passed. Full foundation result: work/neck-preservation-tests.txt. Tauri debug rebuild succeeded after user closed Mana; updated target/debug/mana.exe. Full foundation: 278 passed, 2 optional skipped. User live review remains pending; do not call all anatomy or outfit quality solved.


## 2026-10-21 — Outfit framing, accessories, and transparent PNG prototype
User explicitly authorized work while Mana is closed and a transparent outfit PNG prototype. Added OutfitPrototype workspace from Wardrobe and Make outfit PNG in chat/manual generation. Manual multi-polygon keep/remove masks, source picture import, body preview in avatar layer order, alignment/frame controls, transparent body-sized RGBA PNG export, matching source+selection JSON reload. Native fixed-root exporter writes only new folders under exports/outfits and validates header/dimensions/metadata. No auto-install/equip or avatar asset replacement. Daily outfit/initiative work pauses while prototype workspace is open.

Generation: clothing edit bounds now reach source bottom; worker applies matching 92% framing to reference/mask and records layout. Central neck-column protection avoids preserving original shoulder/strap silhouettes. Current accessories omitted by default for clothing reference/mask (manual checkbox retains them); real avatar config unchanged. Dress-only references draw a neutral gray dress guide after base body and before foreground hair; Animagine dress variation .72, 28 steps, cfg5.5; explicit feet-visible/arms-at-sides tags. Other garments keep their prior reference behavior.

Three real candidates: outfit-framing-check-1792590725720991400 (feet visible, rejected arm crossing), outfit-pose-check-1792590825351979300 (.6 variation, rejected for retaining base garment), outfit-guide-check-1792590965963960800 (plain new dress, feet inside frame, no old accessories; garment/pose still stochastic). No infinite batch, downloads, ComfyUI server, unrelated process kills, or gallery/chat writes. Diagnostic references manually composed default layers; not evidence of all wardrobe combinations.

Produced a manually traced transparent sample exports/outfits/prototype-summer-dress-v2/{outfit.png,preview.png,source.jpg,selection.json}; checked 843x1264 RGBA alpha and visually inspected on default base. v1 sample retained skin triangles and is rejected; v2 is primary. Outlines can be refined. Documentation docs/OUTFIT_PNG_PROTOTYPE.md explains usage and limitations. Automatic segmentation/warping and perfect garment anatomy are NOT finished. Full foundation log work/outfit-prototype-final-tests.txt; native exporter unit test and two Python memory tests passed; mocked reference encode/mask route passed. Native packaging in progress; final status below.


## 2026-10-22 — Prototype build completion
Tauri debug build succeeded at src-tauri/target/debug/mana.exe with all new UI/native export routing. Bundled scripts/image_job.py SHA256 matches source (00A969CECD4B906E75F1A5666621C12C44FBDE17B7D0FA749F1673D424C47972). Foundation: 282 passed, 2 optional skipped. Python worker memory-policy tests: 2 passed. Mock tensor reference/mask framing route passed. Native prototype validation/export tests recorded in final run. Actual example PNG and original-body preview inspected; user interactive editor review remains pending. Mana left closed; no outfit installed or equipped. Main guide docs/OUTFIT_PNG_PROTOTYPE.md; main sample exports/outfits/prototype-summer-dress-v2. No new work should be inferred as approved beyond these completed improvements/prototype.


## 2026-10-22 — User rejected flat-guide generation; drag and garment-only route
User reported the gray dress-guide result was worse, accepted manual PNG prototype and requested dragging on body preview plus clothing-only generation. Removed the neutral gray dress guide from reference preparation and reverted dress redraw .72 → .8. Keep prior feet framing, neck column protection, accessory omission and GPU memory policy. Removed unused guide drawing helper. Do not call old guide candidate a quality pass.

Added pointer-captured dragging on body preview (responsive display → body-pixel conversion, bounded offsets), cancellation/lost-capture cleanup, keyboard arrow nudges with Shift increments. Preview layer images now cache across drag updates instead of asynchronously reloading/flickering each move. Numeric controls/export use the same transform.

Added Generate clothing only (no person) in Create a picture; Wardrobe Design an outfit defaults to this mode. Explicit chat requests containing clothing/outfit/garment only or without person route to it. It compiles garment-only prompt/negatives and skips avatar/mask preparation. Still a regular image on plain background; manual outline is needed for alpha. No new image generation was run this turn, so actual checkpoint adherence/quality remains unverified.

Frontend build passed; foundation 284 passed, 2 optional skipped. Tauri debug build succeeded and replaced src-tauri/target/debug/mana.exe. User can reopen Mana; live drag and garment generation review remain pending. No unrelated systems or existing outfit files changed. Guide updated: docs/OUTFIT_PNG_PROTOTYPE.md.


## 2026-10-22 — Eraser/background cleanup and corner scaling
User reported retained background, difficult hole polygons, .25 minimum too large, and wanted preview resize dragging. Reworked outfit editor: eraser/restore brush strokes with size control, connected-color corner cleanup and background-click tool with tolerance, grouped Undo edit, full-picture selection, and sticky cleanup toolbar. Masks cache independently of placement; preview resize/move no longer reflood background. New actions survive selection.json reload and old polygon history remains compatible. Native export command unchanged.

Pink alpha-content bounds and four resize handles now draw on body preview only. Uniform opposite-corner anchoring, pointer capture/cancel, display-to-body coordinate conversion, .02–4 scale range, hover cursors, keyboard movement, numeric controls, Reset position and size. Export uses raw transformed cutout without control handles. No new image generation this turn; model quality remains unresolved.

Validation: frontend build passes; 287 foundation tests passed, 2 optional skipped. Tests cover pale enclosed fabric vs connected background, clicked holes, brush/history validation and grouped undo, opposite-corner anchoring and smaller scaling. Final Tauri debug rebuild succeeded, including cursor/reset controls, at src-tauri/target/debug/mana.exe. Live UI brush/handle review still pending; user can reopen Mana.


## 2026-10-22 — Selectable clothing pieces and fresh request seeds
User accepted easier editor, requested selection for sets with bottoms/shoes, deferred accessory depth, reported identical generation. Implemented up to 12 named pieces sharing one source image, each with independent cleanup/position/scale. Blank Top/Bottoms/Left shoe/Right shoe buttons; Select piece source tool; click opaque preview pixels to select/move; active-only bounds/resize. Combined transparent PNG exports all pieces in order. Parts/active ID persist in selection.json; legacy single-piece import supported. Source-file replacement resets pieces intentionally.

Make outline a separate piece snapshots active cleanup and clips new piece to outline, subtracting the same area from original. Removed backgrounds stay removed. Split clipping is a cleanup-undo floor; further edits can undo to that floor. Accessories remain deferred and no depth/layer changes or wardrobe installation are included.

Inspected recent saved requests: matching isolated-garment jobs both seed42/same prompt. New requests now get fresh cryptographic seed (Math.random fallback in non-crypto test/browser contexts), collision with prior seed avoided. Keep seed checkbox restores repeatability, direct seed editing enables it, actual seed updates UI/job/filename. No real generation run this turn, no aesthetic quality claim.

Validation: frontend build passed; foundation 290 passed, 2 optional skipped. Tests cover independent piece snapshots, multi-piece reload/legacy compatibility, split cleanup/clipping retention, and deterministic fresh-seed collision behavior. Full log work/outfit-pieces-tests.txt. Tauri debug build succeeded and replaced src-tauri/target/debug/mana.exe; user can reopen Mana. Interactive multi-piece selection/composition needs user validation.

## Qwen in Mana — 2026-10-22

Qwen is now a separate model-picker category: **Qwen - reference artwork**, alongside NetaYume, SDXL/Animagine and Stable Diffusion/Photon. Select `Qwen-Rapid-AIO-SFW-v23.safetensors` in More → Create picture, or request a picture in chat ending with `using Qwen`. Explicit unavailable choices report an error rather than falling back to another model. Animagine remains the default when no model is specified.

Examples:

- `Draw yourself reading in a magical library using Qwen`
- `Draw yourself in a blue summer dress in a flower garden using Qwen`
- `Create an image of a moonlit castle using Qwen`

Self-reference requests use the installed **Mana Turnaround Sheet.png** from the shared input folder, matching the accepted diagnostic. This is a fixed character sheet, not the currently selected avatar outfit. In manual generation, check **Use Mana’s turnaround sheet as character reference** to enable it. Unrelated requests do not automatically attach her sheet. Qwen generates a fresh complete artwork, not a protected-head clothing edit; the clothing mask and variation slider do not apply. Changes such as removing headphones must be requested in the picture description. Exact details can still vary.

Defaults are1280x720, four steps and guidance1. The modern-anime LoRA, reference-latent method, shift and CFG normalization match the accepted workflow. Advanced sizes use multiples of16, edges128–1280 and at most1,310,720 pixels. Qwen currently requires the NVIDIA GPU; CPU mode is disabled for this model. Its dependency files remain in their existing shared-model folders.

Qwen uses Mana's existing owned-job lifecycle: inline progress, Stop, generated-chat image, enlargement, explicit gallery Save, job logs and temporary pause/restore of Mana's owned chat model. No ComfyUI server is started or contacted. No dependencies are downloaded. The app packages `scripts/qwen_image.py` alongside `scripts/image_job.py`. See [Qwen implementation and reference notes](QWEN_REFERENCE_ART.md).

## Qwen reference choice — current avatar or sheet

With Qwen selected and **Use a character reference** checked, choose:

- **Mana turnaround sheet** — the original multi-view reference used by the accepted test; still the default.
- **Current avatar (selected outfit and accessories)** — a fresh neutral snapshot composited from her currently selected avatar layers. It includes her clothes, hair and accessories, excludes the scene background, and follows a replacement avatar model when that model is loaded.

Qwen generates a new artwork from either source. The current-avatar path does not remove the outfit, use a clothing mask or lock the original pose. The reference prompt describes her supplied features instead of hardcoding silver hair or blue eyes. Requested changes can still override those features, and generated fidelity requires visual review.

For a chat request, say `Draw yourself reading using your current avatar using Qwen`. Ordinary `Draw yourself reading using Qwen` continues to use the turnaround sheet. If the current avatar is unavailable, that choice reports an error rather than silently switching references. The choice is per request; it is not a new persistent global default.

Validation:294 foundation tests passed,2 optional skipped;3 native image tests passed;2 Python reference-input tests passed. No additional GPU generation was run for this change; user visual testing is pending.

## Outfit generation with Qwen — 2026-10-22

Wardrobe → Design an outfit now selects Qwen and starts in clothing-only mode, with an editable concrete example: lavender cardigan, white skirt and matching pair of flats. Press Generate after describing the set you want. This is a separate entry-point default; ordinary picture requests still default to Animagine.

Qwen's clothing prompt asks for only the requested clothing objects, separate complete pieces with gaps, front-facing arrangement, readable openings/seams, restrained styling and a simple light-gray background. It does not attach Mana's sheet or current avatar, even if character reference was previously enabled. The requested garments/colors remain editable; a dress request is not silently replaced with the default cardigan set. Text/labels are discouraged in clothing-only results.

Two controlled same-seed local tests used four steps/CFG1 at1280x720. First wording called the result a wardrobe design sheet and generated unwanted captions (`qwen-outfit-set-1792634559305369900`). Revised isolated-clothing wording produced separated cardigan/skirt/shoes with no wearer or captions in the inspected result (`qwen-outfit-set-1792634662005423700`), approximately51 seconds. PNG/JPEG originals and settings are saved in exports/images. Visual quality across other requests remains a user check, not guaranteed by this one example.

These are garment pictures with a background, not transparent fitted avatar layers. The existing outfit PNG editor is unchanged and remains paused for development. Background removal, holes, alignment and perspective may still need manual work before a garment can be worn. Accessory depth and automatic wardrobe installation remain deferred.

Validation:296 foundation tests passed,2 optional skipped (298 total), including routing without character references and requested-piece prompt behavior. Frontend and Tauri debug builds passed. No native policy or image-worker changes were required for this improvement.
