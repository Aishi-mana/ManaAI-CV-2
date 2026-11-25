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


## English Anime Cover preference (translation is a later phase)

- [ ] Open **More → Songbook → Mana's Weekly Covers**. Set **Her cover-song preference**
      to **English anime-opening covers**. Close and reopen Mana; verify the selection
      persists without enabling Tuesday or Friday automatically.
- [ ] On Tuesday, choose a folder of permitted recordings, ideally with descriptive
      file names such as `Anime Opening - English Cover.wav`. Mana should prefer
      anime-opening/English-version *title hints*. This is filename-only selection:
      she cannot detect whether the recording really contains English vocals.
      No new folder traversal, audio analysis, or automatic downloads are introduced.
- [ ] On Friday, use **Find a cover idea** with the preference enabled. Confirm that
      the SearXNG query favors anime-opening English-cover source pages, but that
      the rights review and owner-supplied recording steps are **unchanged**.
      With an approved English cover WAV queued, Mana can use the existing trained
      singing-voice converter. The converter **does not translate Japanese vocals**
      or rewrite lyrics.
- [ ] Confirm existing saved cover ideas, approved local audio, weekly reservations,
      Studio projects, WAVs, Sunday original songs, and both cover schedules
      survive switching **Any music she likes ↔ English anime-opening covers**.
- [ ] Select **Write original anime-style opening**. Mana's local chat model should
      write completely original English lyrics and a new anime-opening-*inspired*
      arrangement, without naming an anime/franchise/song, translating any
      protected lyrics, borrowing a melody, or consuming a scheduled weekly slot.
      Confirm the usual ACE-Step guide and Mana-voice conversion behavior.
- [ ] Confirm preferences do not verify an English-language recording, change the
      underlying cover's lyrics, or authorize unauthorized uses. Translation of
      an existing anime opening is an explicitly **unimplemented future feature**
      requiring review of adaptation rights and a usable English singing guide.


## Phase 3A — Japanese → English lyric translation workbench (text only)

- [ ] Pull/rebuild the new code, then open **More → Songbook → English Lyric Translation Workbench**. Existing original songs, Tuesday local covers, Friday web covers, approved recordings, schedule toggles and Music Studio remain unchanged.
- [ ] Create a project using **only your own original Japanese test lyrics or lyrics for which you have permission to translate/adapt**. Enter a working title, a 1–16-line excerpt, select a valid adaptation-rights basis and explicitly acknowledge permission.
- [ ] Confirm creating a project without acknowledgment or without source lyrics is blocked. Paste 17+ lines, an empty excerpt, or a line over 220 characters; creation should reject invalid source without deleting what you typed.
- [ ] Start Mana's **local chat model**, press **Ask Mana for English draft**, and verify that exactly one English suggestion is produced for each supplied Japanese line, in the same order. Source lines remain read-only and unchanged.
- [ ] Edit a line into natural singable English, add a phrasing/rhyme note and an optional syllable target. An approximate English syllable count and difference should appear; **this is not timing, pitch detection or proof a melody fits**.
- [ ] Save **Version 1**, change the wording, save **Version 2**, and restore Version 1 after the explicit confirmation. Verify Version 2 and the Japanese source remain untouched.
- [ ] Close/reopen Songbook and restart Mana. Verify each project's source lines, working English copy, rights basis, and all saved versions persist in the existing **local** Songbook storage. No automatic lyrics retrieval or web request should occur.
- [ ] Run the model with malformed or incomplete JSON, cancel in progress, and try again while editing. A failed, stopped or stale proposal should not overwrite the working text or saved versions.
- [ ] Confirm the editor cannot generate WAVs, MIDI, translated vocals, an English singing guide or any cover audio yet. These belong to later phases 3B–3C. Permission to adapt and to use any backing recording must be verified separately by the owner.


## Phase 3B — reviewed MIDI melody & English singing guide (OpenUtau handoff)

This phase does not extract melody automatically from arbitrary MP3/WAV, download
third-party music or render a singing guide inside Mana. It prepares editable
note data and an unrendered OpenUtau .ustx project. A compatible OpenUtau
installation, **English-capable singer, phonemizer and renderer** are external
requirements for guide WAV synthesis. See:
- [OpenUtau Getting Started](https://openutau.com/Getting-Started/)
- [OpenUtau USTX file specification](https://github.com/openutau/OpenUtau/wiki/USTX-file-format)

1. [ ] Start with your own original Japanese/English lyric test project from
       Phase 3A, and your own small **monophonic MIDI file** with 1–128 lead
       notes; a type-0 or type-1 .mid / .midi, standard PPQ timing, <=1 MB.
       No need to use copyrighted anime music for this first test.
2. [ ] In **More → Songbook → Translation Workbench → Give the English lyrics a
       melody**, choose the MIDI file. Verify only **monophonic** tracks are
       offered, with their actual note count. Confirm the correct lead track
       yourself; Mana does not identify the singer or auto-transcribe audio.
3. [ ] Select the separate **composition/melody rights basis** and confirm it.
       The original Japanese text and current English draft must remain
       unchanged after import. Replacing the melody requires confirmation.
4. [ ] Check detected MIDI note starts/durations/pitches, BPM events and meter.
       Input a new pitch, time, note lyric or source line. Overlap with a
       neighboring note must be rejected without corrupting the guide.
5. [ ] Click **Seed English words (rough)** for a chosen lyric-line range.
       Verify that it does not mark the mapping as reviewed or synthesize
       English pronunciation automatically. Adjust each note's words,
       syllables and + / +~ holds manually. Confirm every note is filled.
6. [ ] Press **Confirm note lyrics and timing reviewed**. Export should now be
       available. Change an English line or restore a saved translation
       revision: export must become unavailable until you explicitly resync
       and re-review the note assignments.
7. [ ] Use **Save OpenUtau guide (.ustx)**, choose a **new filename**, and
       verify the exported UTF-8 YAML 0.6 contains 480-tick notes, tempo events,
       note lyrics, and no source Japanese lyrics or auto-rendered WAV.
       Reusing an existing filename must not overwrite its contents.
8. [ ] Open the .ustx in an installed version of **OpenUtau**. Choose an
       English-capable singing voicebank and compatible phonemizer, correct
       pronunciation and timing in its piano roll, then export a real WAV
       using **File → Export Audio**. Listen and verify that the guide is
       intelligible. The project is deliberately exported without choosing
       or installing any third-party voicebank on your behalf.
9. [ ] Confirm projects and MIDI note edits survive a restart and appear in
       the existing Songbook backup; the Tuesday/Friday cover schedules,
       Sunday originals and existing Music Studio projects remain untouched.
10. [ ] After WAV export succeeds on Windows, record the OpenUtau version,
        voicebank, phonemizer, and note mismatches. **Phase 3C** will import the
        approved English guide and convert it to Mana's trained singing voice.

Known limitations: no direct recording-to-note extraction; only 1–128-note
monophonic MIDI tracks; one stable meter per phrase; tempos between 30–300 BPM;
rough word seeding is not pronunciation, phonemization, or reliable syllable
alignment. Owner rights declaration is not independent license verification.
