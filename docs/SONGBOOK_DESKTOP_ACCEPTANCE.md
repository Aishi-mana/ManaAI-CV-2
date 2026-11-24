# Mana's Songbook — local Windows acceptance checklist

This is for the owner's **local Windows laptop**, after this Songbook feature is
merged and the app is rebuilt. GitHub Actions can validate logic and build the
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
      60–120-second full preview**. It uses a **guide singer**, not Mana's
      trained singing voice. No other song should be generated automatically.
- [ ] If the local model/binaries or GPU are unavailable, the draft should
      remain in Songbook, with an honest **Audio unavailable** state.
      Do not claim a WAV exists until a valid file has been returned.
- [ ] After success, confirm Songbook shows **Recorded**, the WAV plays
      when requested, and the same original appears in **Music Studio**.
      Compare title, duration, seed, and generated lyrics to the saved draft.
- [ ] Return to regular chat and send one brief message to confirm the
      chat model recovers after ACE-Step gives back the shared GPU lease.

## Cancellation and weekly limits

- [ ] On another manual test, press **Stop composing** during generation.
      It should stop its own job, release the GPU and never create a fake
      recorded entry. If the lyrics were already saved, they must survive.
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

Record the app commit, model and ACE-Step setup, generated WAV duration,
whether the guide singer rendered, chat recovery after GPU use and any
native `exports/singing/original-*/job.log` errors before marking this
feature accepted on the laptop.
