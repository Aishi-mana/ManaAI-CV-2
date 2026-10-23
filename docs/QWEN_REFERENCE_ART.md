# Qwen reference-art candidate

This is an experimental standalone reproduction of the user's local `qwen_2511_character.json` workflow. It is now exposed in Mana as a separate Qwen model category; see the App integration section below. Existing Animagine, Photon and NetaYume defaults remain unchanged, and the outfit PNG editor remains paused.

## What the workflow actually uses

Read the active widget values, not the example model URLs inside node properties:

- Diffusion: `Qwen-Rapid-AIO-SFW-v23.safetensors` (approximately 28.4 GB on disk).
- Visual text encoder: `qwen_2.5_vl_7b_fp8_scaled.safetensors`.
- Decoder/encoder: `qwen_image_vae.safetensors`.
- Style LoRA: `modern-anime.safetensors`, strength 1. The Lightning filename in the node's model-link metadata is not its selected LoRA.
- Reference: `Mana Turnaround Sheet.png` in the shared Comfy input folder.
- Qwen Edit Plus conditioning on both positive and negative branches; reference latents method `index_timestep_zero`.
- AuraFlow sampling shift 3.1; CFGNorm strength 1.25 with pre-CFG enabled.
- Four steps, guidance 1, `res_multistep` sampler, `simple` scheduler, full denoise.
- 1280 x 720 fresh empty latent. The input scale node, extra reference images, Sage Attention patch and GGUF node are bypassed in the supplied workflow.

## Why this differs from the older avatar edit

The reference is encoded into both visual-language conditioning and reference latents. Sampling begins from an empty latent, rather than partially repainting the original avatar around a preserved head. This allows a different pose, outfit and scene. Character fidelity still requires visual review. The model's reference features do not imply guaranteed exact identity.

## Standalone implementation

`scripts/qwen_reference_candidate.py` calls the installed tensor library and selected core operations directly. It does not execute the supplied JSON as a program, initialize custom nodes, start a ComfyUI server, connect to a server, install packages, or download weights. The source workflow and shared models are read-only. Model paths are fixed to the installed local files.

The encoder is unloaded and released after reference conditioning, before diffusion weights are loaded, to reduce overlapping memory use. Automatic library offloading is retained. The candidate is a single owned Python process. Its models are released when that process exits.

The diagnostic saves `request.json`, `progress.json`, `generation.json` and `image.png` into a new `exports/images/qwen-reference-check-*` folder. The caller captures stdout/stderr in `work/qwen-reference-job.log`. `work/qwen-reference-path.txt` points at the latest candidate. Nothing is saved automatically to the user's gallery or wardrobe.

This script is a developer diagnostic with fixed installed paths and a fixed example request, not a general user interface or production backend. Before app integration it needs bounded native model discovery, job cancellation/status/error handling, the existing GPU chat lease, and reference/artwork controls. Do not silently change the default model or reuse the old clothing mask for this path.

Official background: [Qwen Image Edit 2511](https://qwen.ai/blog?id=qwen-image-edit-2511) describes its character-consistency work. The user's selected Rapid checkpoint is a separate installed derivative; the supplied workflow's settings are used for this diagnostic.

## Memory initialization required by the installed library

Importing the installed tensor library does not reproduce all of the desktop startup behavior. In this installed version, the desktop explicitly initializes `comfy_aimdo.control`, initializes the CUDA devices, assigns `CoreModelPatcher = ModelPatcherDynamic`, and enables `comfy.memory_management.aimdo_enabled`. The candidate now performs those steps directly, without importing `main.py` or starting a server.

The initial attempt completed reference encoding but exited during large diffusion-model loading without a Python traceback. A comparison of installed `main.py` and the standalone initialization found that the initial attempt had left the legacy loader active. This is a plausible memory-loading cause, not proof of the exact OS termination reason. Read-only OS diagnostics were unavailable under the current permissions; no settings were changed to access them. The corrected run logs allocator initialization and its final exit status.

Do not change NetaYume's accepted memory configuration based on this Qwen-specific diagnostic. If copying this to another installed library version, inspect that version's startup initialization and supported allocator API rather than assuming these internal APIs stay compatible.

## Completed candidate — 2026-10-22

Final job: `exports/images/qwen-reference-check-1792631848914`.

- Exit status 0; progress `ready`; 1280 x 720 RGB PNG saved.
- Total reported elapsed time 60.79 seconds; reference/model setup approximately 20 seconds, sampling finished at 60.32 seconds.
- Actual installed workflow settings retained: Rapid SFW, modern-anime LoRA 1, four res_multistep/simple steps, CFG 1, shift 3.1, pre-CFGNorm 1.25, index_timestep_zero reference conditioning. Prompt changed to Mana in a blue sundress walking in a flower garden.
- Visually inspected the saved PNG: one character, changed outfit and walking pose, coherent garden artwork, silver hair/blue eyes/X clip retained, both shoes in frame. Head/body are generated together; there is no pasted original head. Character proportions/style differ from the avatar and small details such as the clip/hands are not exact. User visual acceptance is pending.
- Qwen's VAE returns a single-frame video-shaped tensor. The standalone candidate matches core VAEDecode by flattening batch/time before converting the single RGB frame to PNG. The preceding attempt completed sampling but hit this save-shape error; the final run includes the correction.

This establishes a working local standalone reference-art candidate, not an integrated Mana backend. No native/frontend rebuild or default-model change was made. Source workflow, models, gallery and wardrobe were not modified.

## App integration — 2026-10-22

The developer candidate is now promoted to an app backend in `scripts/qwen_image.py`, dispatched by `scripts/image_job.py`. The diagnostic remains separately reproducible. Native discovery exposes exactly the installed Rapid SFW model with a `qwen` category and readiness flags for its dependencies and character sheet. Native payload construction owns all model/reference paths; the browser supplies only the supported model name and boolean character-reference choice. Masks, arbitrary reference paths and CPU mode are rejected for Qwen. SD/Neta validation bounds remain unchanged.

The UI groups models by family, recognizes `using Qwen`/`with Qwen` in chat, and defaults Qwen to1280x720/four steps/CFG1. The character sheet is attached only when self-reference is requested or explicitly checked. It does not use the live avatar clothing mask or image-to-image strength. Existing chat GPU lease, cancellation, status/result handling and gallery saving are reused. `image.jpg` serves the normal app result path; `image.png` preserves the original Qwen output.

Reference artwork is still generated, not a guaranteed exact avatar replica. Default model remains Animagine; Qwen is an explicit separate choice.

## Qwen integration validation

Frontend foundation:292 passed,2 optional skipped (294 total). New tests cover explicit Qwen selection, dependency readiness without SD/Neta engines, GPU-only and dimension/reference bounds, prompt routing, and a mocked inline generation that must not prepare avatar pixels or clothing masks. Existing lifecycle and persistence tests passed. Native image-generation tests:3 passed, including Qwen-specific bounds and request isolation. Python worker compilation passed.

The actual production dispatcher (`scripts/image_job.py` → `scripts/qwen_image.py`) completed a different reference-art request in63.67 seconds: `exports/images/qwen-integrated-check-1792633478346280000`. Both PNG and app-result JPEG were saved; the image was visually inspected (Mana reading in a library with a lavender cardigan, new seated pose). The native debug app was rebuilt through Tauri, and both packaged worker modules match source hashes. User live checks of model picker/chat launch, Stop, chat restoration and gallery Save are still pending. Existing owned-job mechanics are reused; these live interactions were not performed automatically.

## Current-avatar reference option

Qwen now accepts one of two mutually exclusive reference inputs: the native-owned fixed turnaround-sheet path (`characterReference: true`) or the existing bounded prepared JPEG (`reference`, with `characterReference: false`). The native layer rejects simultaneous sheet+JPEG and any Qwen clothing mask. Browser-provided filesystem paths are not accepted.

The manual picker exposes Character reference when Qwen/reference is enabled. Current avatar calls the existing prepareReference callback with clothingEdit=false and keepAccessories=true, so it composites the actual dressed neutral avatar without its scene background. The snapshot is prepared afresh for each generation. The worker decodes/validates the JPEG before model imports, saves reference.jpg in the job folder, then uses it in exactly the same Qwen visual/reference-latent conditioning as the sheet. generation.json records reference_source=avatar/sheet/none and omits embedded JPEG data; request.json retains the reproducible input as for other backends.

The prompt follows the supplied reference's face, hair and eye colors rather than hardcoding Mana's present colors, making replacement avatar models usable. Turnaround sheet remains default. Chat can opt into the snapshot with `Draw yourself reading using your current avatar using Qwen`. No extra generation was performed for this option; visual fidelity remains a user check. Validation:294 foundation pass/2 optional skip,3 native image tests,2 Python input tests.

Turnaround references can occasionally produce duplicate characters. The artwork prompt explicitly requests one subject and avoids repeated views; this is guidance rather than a guarantee. The current-avatar reference supplies one dressed view and is another option when this occurs.
