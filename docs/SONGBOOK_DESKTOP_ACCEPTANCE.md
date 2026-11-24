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
- [ ] No web searches or internet music are needed. Covers are out of scope
      for the first version.

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

## Local-only assets and future covers

- [ ] Manaverse files remain local until the owner and Codex choose to
      convert them to WebP. Do not upload them to get Songbook working.
- [ ] Only original compositions should appear in this collection. A later
      web-search-and-cover feature will need a separate review of media
      sources, permitted rights, and the existing voice-conversion pipeline.

Record the app commit, ACE-Step and trained Mana voice setup, both WAV
paths and durations, guide-to-conversion handoff, chat recovery after GPU use
and any native `exports/singing/original-*/job.log` or conversion job errors
before marking this feature accepted on the laptop.
