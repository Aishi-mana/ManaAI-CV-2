# Set up standalone NetaYume for another app

This is a reusable Windows integration guide based on Mana's working NetaYume35 all-in-one setup. The user confirmed about3 minutes per normal image on an RTX5070 Laptop GPU with8GB VRAM after the text-encoder speed fix. Other hardware, prompts and competing workloads may take longer.

## 1. Choose your dependency setup

**Reuse the installed environment first.** Your other app can invoke the same Python and load the same checkpoint without opening ComfyUI or connecting to its server. This is the tested approach. It needs the installed Comfy tensor libraries, not the running application.

Current machine paths:

```text
Python:
C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI/.venv/Scripts/python.exe

Library root (contains the comfy directory):
C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI

All-in-one checkpoint:
C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Shared/models/checkpoints/NetaYumev35_pretrained_all_in_one.safetensors
```

**For a separately installed runtime:** use a dedicated folder and Python environment, obtain the official [ComfyUI source](https://github.com/Comfy-Org/ComfyUI), and install the matching GPU PyTorch packages and source requirements into that environment. Follow the environment/dependency portions of the [official manual installation guide](https://docs.comfy.org/installation/manual_install). Skip starting `main.py`: this integration directly imports the library. Fresh installations are not validated by Mana's existing-environment tests; verify them before shipping another app.

Record the Python/PyTorch versions, library revision and dependency versions for your app. Internal library APIs can change, so avoid silently updating a working runtime. Mana's tested environment had PyTorch2.10.0+cu130. Do not install requirements into an unrelated app's existing environment.

## 2. Bring the worker into your app

Copy `scripts/image_job.py` from this repository into your app, for example:

```text
C:/AI/MyPictureApp/workers/image_job.py
```

The worker's Neta branch is independent of Mana's React/Tauri code. It takes exactly one argument: the absolute path of a trusted JSON request. Its output directory is the request file's parent. The same worker also contains an SD branch, but it is not used when `backend` is `neta`.

Do not copy the10GB checkpoint for each application; use its absolute path. The Neta branch expects the all-in-one file with embedded Gemma text encoder/tokenizer and VAE. A diffusion-only checkpoint needs a different loader and separately configured encoders/VAE.

## 3. Check the GPU without generating an image

Run this with the chosen environment's Python (save as `check_runtime.py`, then invoke that file):

```python
import sys
from pathlib import Path

library_root = Path(r"C:\Users\Admin\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI")
assert (library_root / "comfy").is_dir()
sys.path.insert(0, str(library_root))
sys.argv = [sys.argv[0]]  # Do not forward the host app's command-line flags.
import comfy.options
comfy.options.enable_args_parsing()
import torch
import comfy.model_management as memory

print("PyTorch:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
print("Memory mode:", memory.vram_state)
print("Text encoder:", memory.text_encoder_device())
assert torch.cuda.is_available(), "Install a compatible GPU PyTorch runtime first."
assert str(memory.text_encoder_device()).startswith("cuda"), "Text encoding is on CPU."
```

Mana verified normal memory mode and `cuda:0` for the text encoder. This check imports libraries and initializes the device; it does not load NetaYume or generate an image.

**Important speed detail:** do not automatically append `--lowvram` for GPU jobs. In the tested library it can force Gemma text encoding onto CPU. Normal mode still offloads parts when memory requires it. Explicit CPU mode is supported by the worker but slower. Do not use `--gpu-only` as a blanket fix on an8GB GPU.

## 4. Create a request in a unique job folder

Create a new directory for each generation. Save UTF-8 JSON as `request.json` with this shape, changing paths for the target installation:

```json
{
  "backend": "neta",
  "comfy": "C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI",
  "checkpoint": "C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Shared/models/checkpoints/NetaYumev35_pretrained_all_in_one.safetensors",
  "prompt": "anime illustration, a small white cat in a moonlit garden, soft lighting, clean linework",
  "negative": "blurry, low quality, watermark, text",
  "width": 1024,
  "height": 1024,
  "steps": 20,
  "cfg": 4,
  "seed": 42,
  "cpu": false
}
```

The host should validate these values before launching: nonempty prompt, bounded text, width/height128–1024 in multiples of64, steps1–50, guidance1–15 and integer seed0–4294967295. Keep executable, script, library, checkpoint and output paths host-controlled. Never interpret a prompt as a path or shell command. The worker itself is an inference script, not an untrusted-input API boundary.

## 5. Launch from your application

This Python host example also shows the process contract other languages should follow. It does not require the host Python to have PyTorch; the child uses the configured environment.

```python
import json
import subprocess
import time
from pathlib import Path

python_exe = r"C:\Users\Admin\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\.venv\Scripts\python.exe"
worker = Path(r"C:\AI\MyPictureApp\workers\image_job.py")
request_path = Path(r"C:\AI\MyPictureApp\jobs\example-001\request.json").resolve()
job_dir = request_path.parent
assert worker.is_file() and request_path.is_file()

with (job_dir / "job.log").open("w", encoding="utf-8") as log:
    child = subprocess.Popen(
        [python_exe, str(worker), str(request_path)],
        shell=False,
        stdout=log,
        stderr=subprocess.STDOUT,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )
    while child.poll() is None:
        progress_file = job_dir / "progress.json"
        try:
            progress = json.loads(progress_file.read_text(encoding="utf-8"))
            print(progress)  # Replace with your application's progress update.
        except (OSError, ValueError):
            pass  # The process may still be importing or replacing the file.
        time.sleep(1)

if child.returncode != 0:
    raise RuntimeError((job_dir / "job.log").read_text(encoding="utf-8", errors="replace")[-3000:])
image_path = job_dir / "image.jpg"
if not image_path.is_file():
    raise RuntimeError("The worker exited without an image.")
print("Finished:", image_path)
```

Run the loop in your app's background worker, not its UI thread. Host one job at a time. In Node, .NET or Rust use the equivalent argument-list process API, redirect logs, and keep the owned child handle/PID. Do not build a shell command from the user's prompt.

For Stop, terminate only your recorded child process tree and wait for it to exit. On Windows Mana uses `taskkill.exe /PID <owned PID> /T /F`; do not kill all Python processes. Associate callbacks and cleanup with a unique job ID so a late callback cannot stop or overwrite a newer job. A Windows Job Object is another host-level lifecycle option. Closing the app should clean up its owned worker too.

## 6. Display and preserve outputs

| File | Purpose |
| --- | --- |
| `request.json` | Original trusted job settings |
| `progress.json` | Atomic status updates: loading, encoding, sampling, decoding, ready or error |
| `job.log` | Library/device/loading diagnostics and cumulative timing lines |
| `image.jpg` | Finished JPEG |
| `generation.json` | Settings and cumulative elapsed seconds by stage |

Require both successful process exit and an existing image before reporting success. A `ready` progress file alone can precede process teardown. Allow startup/import time before the first progress file. When the UI closes or a newer job starts, ignore old-job results.

Load the image using your app's local file/byte mechanism. You do not need an HTTP server. Preserve original output and settings; make a separate smaller thumbnail/library copy if desired. Cancellation may leave partial files, so do not display them as completed images.

## 7. Diagnose before regenerating

- **Slow before sampling:** compare checkpoint and prompt-encoding cumulative times. Confirm GPU text encoding and that another model is not occupying most GPU memory.
- **Slow during sampling:** compare dimensions, steps and simultaneous workloads with your known working settings. This implementation uses Euler / normal scheduling; matching a different workflow requires matching its settings too.
- **Missing modules:** check that the launched Python is the intended environment and `comfy` points to the source root containing the package.
- **Missing encoder/VAE:** verify that the checkpoint is the supported all-in-one file.
- **Poor character resemblance:** describe the character explicitly. The image checkpoint does not inherit your chat companion's identity or see its avatar automatically.
- **Unexpected tensor warning:** Mana's installed loader reports `norm_final.weight` as unexpected for this file. Its visual impact has not been established; retain logs rather than assuming the prompt caused every quality issue.

No ComfyUI server, custom nodes, API port, Diffusers directory conversion or additional model download is needed for the tested existing-environment approach. This guide does not implement LoRA or conversion into wearable avatar assets.

## Optional image-to-image reference

The current worker also accepts `reference` in request.json as a JPEG data URI, e.g. the result of your application compositing its character/avatar layers. Omit it entirely for text-only generation. Bound the URI to1,000,000 characters and the source JPEG to1280×1280 maximum before sending. Do not accept arbitrary reference filesystem paths or remote URLs. The worker validates and pads the image to output dimensions, encodes it with the checkpoint VAE and uses denoise0.65. It writes reference.jpg next to the output and adds reference_used/denoise to generation.json. Use that to distinguish actual reference-conditioned jobs from prompt-only resemblance. This does not guarantee identity preservation and does not create a rigged/layered outfit asset. Mana’s reference path passed mocked integration checks; live visual review remains pending.

## Reference variation update

Optional request field referenceStrength now controls image-to-image denoise/SD strength, validated in0.2–0.8. Mana's UI supplies0.45 by default for stronger resemblance and allows adjustment. Requests that omit the field retain the earlier0.65 value. Text-only denoise stays1.0. Effective denoise is recorded in generation.json. Generation references can be prepared at1024px rather than the640px vision-comparison default. These controls are not an identity adapter and actual resemblance must be reviewed.

## Optional clothing edit mask

The current worker accepts referenceMask as a bounded JPEG data URI (maximum1,000,000 characters), requiring reference and matching its original pixel dimensions. White edits; black protects. Host creates the mask from its avatar clothing region and protects head/hair. Worker pads reference/mask identically, thresholds and softly feathers mask, passes a normalized pixel mask to comfy.sample noise_mask (or SD --mask), and composites unchanged reference outside the mask after decoding. Saved clothing-mask.png and clothing_mask_used metadata identify this mode. Mana uses referenceStrength0.75 for clothing changes,0.45 for general reference. This mode retains original pose and requires visual seam review; it is not a clothing segmentation or wearable PNG generator.
