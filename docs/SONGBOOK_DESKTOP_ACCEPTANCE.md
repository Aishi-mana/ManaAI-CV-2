# Mana's Songbook — local Windows acceptance checklist

This is for the owner's **local Windows laptop**, after Songbook and the automatic Mana-voice conversion feature are merged and the app is rebuilt. GitHub Actions can validate logic and build the
app, but cannot run the user's installed ACE-Step models, confirm GPU recovery
or listen to a rendered song. Do not mark those tests passed based on CI alone.

## Keep existing data safe

- [ ] Back up current Mana data and music metadata. Audio WAVs live under
      `C:/AI/ManaAI-CV-2/exports/singing`; a JSON application backup is
      **not a replacement** for the actual exported WAV files.
- [ ] Confirm the original-song generator works manually inside **Songs →
      Original Song** before enabling automatic weekly songs. If it cannot
      run, Songbook must still preserve the written draft.
- [ ] Original Songbook compositions do not need web searches or internet music.
      The separate Cover Inspirations flow uses Mana's existing local SearXNG.

## Compose Now smoke test

- [ ] Open **More → Songbook**. Automatic songwriting should be **OFF**
      initially. Enable it only when ready for weekly songs.
- [ ] Start Mana's usual local chat model, close other tools, choose
      **Compose Now · Test**, and leave the app open.
- [ ] Mana should write a new title, own lyrics, musical direction and a
      brief reason. A draft should be saved to Songbook **before** audio starts.
- [ ] The existing ACE-Step original-song generator should render **one
      60–120-second full preview**. First it uses a **guide singer**; then
      Songbook should automatically start converting that recording to Mana's
      **trained singing voice** with the local Music Studio converter.
      No other song should be generated automatically.
- [ ] If the local model/binaries or GPU are unavailable, the draft should
      remain in Songbook, with an honest **Audio unavailable** state.
      Do not claim a WAV exists until a valid file has been returned.
- [ ] After ACE-Step finishes, confirm the **original guide** is playable in
      Songbook and listed as an original in **Music Studio**. It must survive
      a missing or failing converter.
- [ ] On successful voice conversion, confirm Songbook shows **Mana voice ready**.
      **Load Mana's singing voice** should play the converted recording, while
      **Load original guide** plays the unchanged ACE-Step song. Music Studio
      should also have a separate **Mana voice** cover project.
      Compare title, duration, seed, generated lyrics, and exact source WAV.
- [ ] If the trained Mana model, separator, or converter is missing, Songbook
      must show a voice-conversion error **without** marking the guide WAV as
      unavailable or deleting it. Never show a fake converted audio path.
- [ ] Return to regular chat and send one brief message to confirm the
      chat model recovers after ACE-Step gives back the shared GPU lease.

## Cancellation and weekly limits

- [ ] On another manual test, press **Stop song job** during ACE-Step generation
      or Mana-voice conversion. It should stop its own job, release the GPU
      and never create fake recordings. Lyrics already saved must survive;
      if the guide was recorded, its playable WAV must survive too.
- [ ] For an older Songbook entry with only guide vocals (such as **Code and Stars**),
      use **Convert saved song to Mana's voice** or **Retry Mana voice conversion**.
      It must reuse the original WAV without regenerating lyrics or ACE-Step
      audio and without consuming the next weekly slot.
- [ ] Compose Now should not consume the weekly Sunday slot.
- [ ] Enable weekly songs and check the next scheduled **Sunday at noon**
      using the configured journal timezone. Scheduling only runs while Mana
      is visible, open, and idle for five minutes, with no overlapping jobs.
- [ ] Leave Mana closed during a scheduled slot, then reopen. Catch-up may
      attempt **only that week's Sunday** if enabled; no backlog flood.
- [ ] Reboot Mana after a reservation or failed audio job. It must not retry
      the same Sunday every minute or generate duplicate songs.

## Phase 2B — reviewed local cover handoff

- [ ] Start local SearXNG and Mana's chat model. In **Songbook → Cover Inspirations**,
      save an inspiration, then open its **Review source** link. Confirm search
      results are only source pages, never imported audio or verified licenses.
- [ ] Without choosing a rights basis and explicitly confirming permission for
      **both the musical composition and recording**, **Choose local audio & create cover**
      must remain disabled.
- [ ] Select a rights basis and acknowledge permission. Press **Choose local audio & create cover**,
      cancel the Windows picker, and confirm the cover idea remains saved with no
      Studio conversion started.
- [ ] Repeat, choosing a local WAV/MP3/FLAC/OGG/M4A file that you're permitted
      to use. Confirm the native importer creates a WAV in `exports/singing/import-*`
      and opens **Music Studio → Create Cover** with the imported WAV selected.
- [ ] Confirm **Mana · trained** is selected, original instruments and whole song
      are chosen, and the source review appears as **owner-declared**. The app must
      not claim that it checked a license itself. No cover is generated yet.
- [ ] Click **Generate full cover preview**. Listen to the generated version before
      saving. Save it, reopen Studio, and confirm its source title/URL, review date,
      rights basis and local audio source survive persistence.
- [ ] Select a different source audio file in Studio and confirm the previous
      inspiration's provenance is cleared rather than attached to unrelated audio.
- [ ] Attempt a second handoff while a Studio cover preview is unsaved; declining
      replacement must preserve that preview.
- [ ] Confirm regular chat and GPU access recover after conversion. If FFmpeg,
      extraction or the trained voice model is missing, the original cover idea
      and the user's local file must remain unaffected.

## Local-only assets and future covers

- [ ] Manaverse files remain local until the owner and Codex choose to
      convert them to WebP. Do not upload them to get Songbook working.
- [ ] Original Songbook entries remain separate from Cover Inspirations and
      saved Studio covers. Search results never download third-party audio.
      The owner picks only files they are permitted to use.

Record the app commit, ACE-Step and trained Mana voice setup, both WAV
paths and durations, guide-to-conversion handoff, chat recovery after GPU use
and any native `exports/singing/original-*/job.log` or conversion job errors
before marking this feature accepted on the laptop.


## Phase 2C — one local and one web cover each week

- [ ] Confirm **Tuesday local covers** and **Friday web covers** are **OFF**
      after update and that the old Sunday original-song schedule is unchanged.
- [ ] Choose an approved local audio folder. Confirm only top-level audio files
      appear, not subfolders, shortcuts, or linked files. Replacing the selected
      folder must revoke the earlier permissions and turn Tuesdays off.
- [ ] Enable Tuesday covers only after checking the acknowledgment that rights
      to BOTH compositions and recordings in the folder permit covers.
- [ ] Verify next Tuesday at **12:00 in the configured journal timezone** and
      that automatic processing waits for 5 idle minutes while the app is open
      and visible. Close the app and reopen it during the slot; only one attempt
      is allowed for that week.
- [ ] Listen to the chosen local recording and its generated **trained Mana**
      mix from Music Studio. Confirm the original source file is unchanged and
      the imported working WAV is stored under `exports/singing/import-*/track.wav`.
- [ ] Verify finished local covers appear in Music Studio and Songbook's weekly
      cover history; a failed converter must not invent a saved recording.
- [ ] Enable Friday web covers. Without a previously approved audio file, Mana
      should discover one **source page** using SearXNG and save it as an
      inspiration **awaiting review**, not a completed cover or downloaded WAV.
- [ ] Review one inspiration's source page, rights basis and check the
      acknowledgment; select a permitted local recording and press
      **Queue audio for Friday**. Verify the imported WAV and rights basis
      survive a restart; the source URL alone must not count as audio.
- [ ] On the next due Friday, verify Mana chooses from approved queued
      recordings, converts into her trained singing voice, and saves a real
      playable Studio cover with source attribution. Avoid re-covering the same
      reviewed web source in later weeks.
- [ ] With weekly local and web covers enabled, confirm neither competes with
      Sunday's original composition, Sketchbook, active chat, or other GPU work.
      Verify cancellation and the local chat model's GPU recovery.
- [ ] Record the real Windows app commit, model/reference paths, input/output
      WAV durations, local folder, reviewed web source, rights basis and any
      `exports/singing/*/job.log` errors. CI is not a substitute for listening.

