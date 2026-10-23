# Standalone NetaYume in Mana

## What standalone means here

Mana runs a local Python image job directly. It does **not** connect to a ComfyUI server, open its interface, or load its custom nodes. It reuses the tensor, tokenizer, conditioning, sampling and VAE libraries already installed with ComfyUI. It is therefore independent of the running ComfyUI application, but not an independently packaged Python environment. Keep that installation and its environment available.

## Installed paths

- Python: `C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI/.venv/Scripts/python.exe`
- Library root: `C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI`
- Checkpoint: `C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Shared/models/checkpoints/NetaYumev35_pretrained_all_in_one.safetensors`
- Job script in this repository: `scripts/image_job.py` (also bundled as a native application resource).
- Native job controller: `src-tauri/src/image_generation.rs`.

These are the current fixed installation paths, not a portable discovery mechanism. No models are downloaded or copied. Offline environment flags prevent Hugging Face, Transformers and Diffusers downloads.

## Generation flow

1. More → Create picture scans bounded checkpoint headers without loading model weights. NetaYume is identified by its Lumina2 diffusion and Gemma text-encoder tensor keys.
2. Generate validates the prompt, checkpoint filename, size, steps, guidance and seed. Native code creates an owned `exports/images/image-*` folder, writes `request.json`, and starts the fixed Python script with its path.
3. The script imports `comfy.options`, `comfy.sd`, `comfy.sample` and PyTorch. `load_checkpoint_guess_config` loads the all-in-one checkpoint's diffusion model, embedded text encoder/tokenizer and VAE.
4. The text encoder tokenizes and encodes positive/negative prompts under inference mode. The job creates a 16-channel latent and seeded noise, then samples with Euler / normal scheduling. Current defaults are 1024×1024, 20 steps and guidance4 for NetaYume.
5. The VAE decodes the sampled latent and writes `image.jpg`. Atomic `progress.json` updates track loading, encoding, sampling and decoding. `generation.json` records settings and cumulative elapsed seconds for checkpoint loading, prompt encoding, sampling and saving. Device/loading messages go to `job.log`.
6. Mana polls only its matching job ID and accepts completion after successful process exit and an existing output image. It reads the JPEG through the native command and displays a prepared preview.

The checkpoint is loaded once per job and released on process exit. There is no persistent model server or warm model cache. Only one Mana image job runs at a time.

## GPU speed fix and observed result

The original launcher forced `--lowvram`. In this installed library that setting can force the Gemma text encoder onto CPU, making a GPU image request much slower. GPU jobs now use the library's normal automatic memory management instead. It may still offload model parts when needed; this does not force every component to remain in GPU memory.

The installed-library preflight verified `NORMAL_VRAM` and text-encoder device `cuda:0`. The user then confirmed a normal NetaYume image took approximately3 minutes, compared with roughly10–20 minutes before the change. This is an observed result on this machine, not a guarantee for every size, prompt, model or competing GPU workload. Explicit Use CPU still runs CPU mode and is slower. Mana does not terminate other applications or automatically unload the chat model.

For a slow run, inspect `generation.json` stage elapsed times and `job.log` before changing settings or generating repeatedly. The combined checkpoint's disk size alone does not establish the GPU memory required at one time.

## Stop, saving and chat requests

Stop, closing the picture drawer, or exiting Mana terminates the matching Mana-owned Python process tree. Job IDs prevent stale cleanup from stopping a replacement job. Other ComfyUI or image-tool processes are left alone.

Original output and settings remain together in the job folder. Save to image library separately saves a smaller JPEG in Mana's existing image store and backups. Disk originals and settings sidecars are not included in that library backup. Generation does not automatically label the depicted character as Mana or install an outfit.

Explicit chat requests such as `draw me a moonlit garden using NetaYume` start the same local job with inline chat progress and Stop controls. A request without a backend selects Animagine when available, then Photon/another supported SD checkpoint. The finished image appears in chat with an explicit Save button and persists with the conversation. More → Create picture remains the manual settings panel. Only successful completion produces the chat completion note; the chat model does not execute arbitrary code or choose filesystem paths.

## Validation and remaining limits

Photon generation/library Save, NetaYume generation, Stop and the NetaYume speed fix were user accepted on2026-10-19. Tiny backend connection checks and automated request/lifecycle checks supplement that acceptance; they do not prove every checkpoint's visual quality. The installed checkpoint loader reports an unexpected `norm_final.weight` key; its visual impact has not been established. Sampler tuning, LoRAs and conversion into wearable avatar assets remain separate work.

For a reusable setup walkthrough with request and host-process examples, see [NETAYUME_SETUP_FOR_OTHER_APPS.md](NETAYUME_SETUP_FOR_OTHER_APPS.md).

## Optional avatar starting image

The request now accepts optional `reference`: a bounded JPEG data URI (maximum1,000,000 characters), prepared from current avatar layers by the host. The worker validates JPEG dimensions (maximum1280 per side), pads to target canvas size and writes reference.jpg in the owned job folder. Neta uses VAE-encoded reference pixels as the initial latent and samples with denoise0.65. Text-only requests still use empty latents and denoise1.0. generation.json records reference_used and denoise. This is image-to-image conditioning, not an identity adapter; visual resemblance and new clothing quality require review. Optional input is backward compatible with existing requests.

## Reference variation update

Optional request field referenceStrength now controls image-to-image denoise/SD strength, validated in0.2–0.8. Mana's UI supplies0.45 by default for stronger resemblance and allows adjustment. Requests that omit the field retain the earlier0.65 value. Text-only denoise stays1.0. Effective denoise is recorded in generation.json. Generation references can be prepared at1024px rather than the640px vision-comparison default. These controls are not an identity adapter and actual resemblance must be reviewed.

## Optional clothing edit mask

The current worker accepts referenceMask as a bounded JPEG data URI (maximum1,000,000 characters), requiring reference and matching its original pixel dimensions. White edits; black protects. Host creates the mask from its avatar clothing region and protects head/hair. Worker pads reference/mask identically, thresholds and softly feathers mask, passes a normalized pixel mask to comfy.sample noise_mask (or SD --mask), and composites unchanged reference outside the mask after decoding. Saved clothing-mask.png and clothing_mask_used metadata identify this mode. Mana uses referenceStrength0.75 for clothing changes,0.45 for general reference. This mode retains original pose and requires visual seam review; it is not a clothing segmentation or wearable PNG generator.
