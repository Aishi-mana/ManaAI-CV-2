# Mana's Sketchbook — desktop acceptance checklist

This check must run on the user's **own Windows laptop** with the installed local
llama.cpp chat model, image checkpoints and actual disk gallery. GitHub Actions
cannot verify VRAM pressure, chat-model restart or the appearance of a generated
image. Run this only after the relevant Sketchbook PRs have been merged and
the updated application is installed.

## Before starting

- [ ] Record the app version/commit and **back up** Sketchbook metadata, saved
      gallery and original disk images. A JSON app backup may include metadata
      and a gallery preview, **not necessarily every original JPEG**.
- [ ] Confirm Mana starts her configured local chat model and answers a normal
      short message. Do not run another GPU-intensive job during the check.
- [ ] Verify **More → Sketchbook** shows the expected next drawing date and
      the saved images. Existing artwork must remain unchanged.
- [ ] The Manaverse artwork remains **local on the laptop** until WebP
      conversion. It does not need to be uploaded to GitHub for this check.

## Manual image generation and GPU recovery

1. [ ] In **More → Sketchbook**, click **Draw Now · Test** with the local model
       ready and all other jobs idle. It should work even if the automatic
       schedule is OFF. It must not consume a Tuesday/Thursday/Saturday slot.
2. [ ] The chat view should show one native **Creating your picture** job.
       Check which installed checkpoint it selected. No model should download.
       On a first run a ready SD1/Photon model may be preferred; if a
       previously successful Sketchbook model is installed and ready, it may
       be preferred instead.
3. [ ] Allow the image to finish. Confirm there is exactly one new Sketchbook
       entry with its image, prompt and recorded model/seed, and that the
       original image also remains available in Image Gallery.
4. [ ] Return to chat and send one short message. The chat model should
       restore/respond after its GPU lease is released. If it doesn't,
       capture the on-screen status and the native image job's `job.log`.
5. [ ] On a *separate* test drawing, press **Stop generation** while it runs.
       It must not add an incomplete Sketchbook record or stop someone else's
       image job. Verify chat can respond after cancellation.
6. [ ] While another image or chat activity is busy, check that **Draw Now**
       explains why it is unavailable, rather than launching overlapping work.

## Concept-only artistic reflection

1. [ ] Open one saved drawing and select **Reflect on this idea**.
       The local chat model should write **What I enjoyed** and
       **Next time I'd try** without launching a second image job.
2. [ ] The note must clearly say it is based on the **idea/prompt**, not
       on visual inspection of pixels. It must not claim a real visit/event.
3. [ ] Close and reopen Sketchbook or restart the application. The completed
       note should persist and must not create another gallery image.
4. [ ] Optionally close Sketchbook *during* a reflection on another entry.
       Cancellation must leave that entry unchanged.

## Schedule and recovery

- [ ] Verify automatic drawings remain **opt-in**, Tuesday/Thursday/Saturday
      at **12:00 in the configured timezone**, with no backlog burst.
- [ ] Check the **Next scheduled drawing** display and any postponed reason.
      Manual tests and concept reflections must not count as scheduled art.
- [ ] If an image job genuinely fails or runs out of VRAM, do **not** repeatedly
      retry blindly. Record its message, installed checkpoint, GPU mode and
      `job.log`; leave other heavy jobs idle before trying another supported
      locally installed checkpoint or CPU mode.
- [ ] Preserve the existing gallery and backup before reporting issues.

## CI-only asset verification

The unit tests validate Manaverse rules even when untracked PNG/WebP art files
are absent from GitHub. On a local checkout with those files, run tests with
`MANA_REQUIRE_LOCAL_ART=1` to also require their presence. The exact paths
and future WebP conversion remain under the owner's and Codex's control.

**Acceptance outcome:** Record the application commit, checkpoint, a successful
manual drawing, successful chat-model recovery, cancellation behavior, and
reflection persistence. Do not mark live GPU behavior verified based on CI alone.
