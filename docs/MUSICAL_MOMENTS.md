# Humming and little songs

## Connected Sunny little hum accepted and installed — 2026-10-18

User selected the connected Sunny version. Installed humming-bright-connected-audition/bright-hum-connected.wav as musical-moments/bright-hum.wav, verified identical hashes; manifest duration4.59755s, source/revision and listening approval updated. Previous active clip retained as bright-hum-before-connected.wav. Both active hums now use user-selected connected phrasing; existing playback/request/initiative routes unchanged. No extra inference or build needed.

## Sunny little hum connected audition — 2026-10-18

User authorized one Sunny candidate using accepted connected phrasing approach. Extended audition_humming.py with --bright: existing seven-note bright melody, varied durations/continuous phase/portamento/phrase dynamics, same cheerful-r2 reference as old bright hum. One 4.6s guide converted through cached offline CPU Seed-VC30 steps. Candidate exports/singing/humming-bright-connected-audition/bright-hum-connected.wav; finite/non-silent and RMS matched to current bright hum, comparison.json records peak/duration/hash. Current active bright-hum.wav unchanged; compare once and await preference. No EQ polish, full song, model download or app build.

## Connected Soft little hum selected and installed — 2026-10-18

User prefers the previous connected candidate over the subsequent warmer EQ version. Installed exports/singing/humming-connected-audition/soft-hum-connected.wav as musical-moments/soft-hum.wav; hashes verified equal, manifest duration5.0039s and listening approval updated. Old soft hum retained as soft-hum-before-connected.wav. Existing soft-hum playback route now uses selected candidate in previews/requests/initiative. Sunny little hum unchanged. User described connected candidate as better with slight robotic quality; do not claim complete naturalness. No extra inference or build needed for external audio replacement.

## Humming naturalness audition — 2026-10-18

User reports robotic humming. Inspected original generator: additive synthetic guide uses uniform note timing, gaps and oscillator restarts. Created scripts/audition_humming.py, a bounded audition-only tool: same six-note soft melody with varied durations, continuous phase, short pitch transitions, gentle vibrato/dynamics and one phrase break. One 5.01s guide converted using existing CPU Seed-VC, 30 steps and default-r2 reference, offline cached models only. Output exports/singing/humming-connected-audition/soft-hum-connected.wav (5.004s). Level matched to original RMS0.22147, peak0.657, finite/non-silent; comparison.json records values. Original soft-hum hash unchanged (a23b43f3...). Active clips/routes/manifests untouched. Synthetic guide remains a limitation; naturalness is unproven until listening. Present original vs candidate once; no further renders pending user feedback. This is a short audition, not a full song or approved replacement.

## Hands-free song playback accepted — 2026-10-18

User confirms Mana can sing from hands-free requests. Screenshot shows successful saved-song playback notes for Trails v3 (Whereabout of the Stars v3) and Reach Out to the Truth, with Hands-free: playing song status. Spoken request routing and song playback accepted. Misrecognized phrases remain a speech-recognition limitation; exact enabled titles/aliases still apply. User subsequently confirms both remaining live checks passed: listening resumes after the song finishes, and Stop hands-free stops playback mid-song. Hands-free song-request workflow is fully accepted for this scope. No further generation or tuning needed.

## Hands-free song requests connected — 2026-10-18

User passed ordinary hands-free conversation, then screenshots confirmed song requests went to ordinary chat and were repeated instead of played. ChatPanel now intercepts recognized musical commands before onSend, resolves enabled saved Chat clips by exact normalized title/alias and plays existing audio through shared voice playback. Accepts character address and dictation commas (e.g. Mana, sing Trails / Sing, Reach Out to the Truth). No fuzzy guesses for misrecognized titles such as Sting trails; add aliases in Chat clips for short names. Generic sing/hum requests use existing selection. Unknown songs report available titles and stop hands-free with visible feedback instead of inventing a rendition.

Dedicated loading/playing song phases keep microphone closed and bypass only the hands-free music-stop guard; spontaneous music remains blocked. Playback completion uses existing cooldown before capture resumes. Stop/hidden app/error handling preserved; session counter suppresses obsolete completion callbacks. Successful requests use existing user-message/music-note history and replay path. No song generation or transcription model changes.

Validation: production frontend and native debug builds passed; 206 frontend tests passed, 2 optional skipped. New command parsing tests cover named address, punctuation, aliases, ordinary sentences and rejected misheard titles; existing cancellation/noise tests pass. Live song request/playback/resume and Stop during song await user check; browser verification remains unavailable under prior usage gate.

Voice → Humming and little songs contains previews and the opt-in Occasional musical moments toggle. Spontaneous playback is disabled by default. Settings are saved inside initiative state and included in backups; older backups default to disabled.

The active library contains Soft little hum and Sunny little hum (approved, unaccompanied, about five seconds each), and Mana cover excerpt (approved, about ten seconds with lyrics and quieter original backing). The cover uses the actual sung guide from `exports/singing/1791658128634/`, converted through Seed-VC using Mana's approved `default-r2.wav` reference. Its mix is copied to `exports/singing/musical-moments/cover-excerpt.wav`. It is a cover excerpt, not an original composition or an acoustic remake. The earlier wordless song remains on disk and old chat Replay buttons still resolve it, but it is no longer selected for new singing requests or initiative.

Clips are prepared once, rather than generated when initiative fires. They live under `exports/singing/musical-moments/` and survive restart while those files remain present. Audio is not embedded in JSON backups. Missing clips turn musical initiative off after a failed attempt; they do not produce repeated retries.

Spontaneous opportunities use initiative's journal timezone, 08:00–22:00 quiet-hour boundary, at least two minutes since opening and five minutes without chat activity, sufficient energy, and existing user-requested pauses. Musical initiative has a separate 15–240 minute cooldown, with one random delay between one and two cooldowns per attempt. Enabling does not play immediately. Pending conversation starters and recent initiative attempts block music. Mood selects bright/soft motifs; neutral moods vary the clip. Ordinary conversation initiative also waits while audio or the microphone is occupied.

Shared playback uses voice volume, energy-based mouth motion and Stop. Draft entry, chat work, hidden app state, microphone use and hands-free stop or block music. Muting stops music immediately. Controls and simple typed requests work independently of the spontaneous toggle: `hum for me` and `sing a short song`. Singing plays the approved prepared cover excerpt; arbitrary requested songs and new melody generation are not supported here yet. Hands-free suppresses spontaneous musical initiative; explicit spoken song/hum requests use saved audio and resume listening afterward.

A chat note is recorded only after playback starts. It records a start, not a completed performance, because Stop may interrupt it. Failed explicit requests are restored to the draft. No affinity reward is applied for musical playback.

## Acceptance checks

1. Preview all three active clips under Voice. Confirm both hums are vocal-only and the song is the approved ten-second cover with quieter backing.
2. Send `hum for me` and `sing a short song`; confirm a clip plays and a start note appears.
3. Stop a clip, mute during playback, or begin typing; confirm playback stops. Confirm microphone/hands-free prevents previews and spontaneous playback.
4. Enable occasional moments, choose a cooldown and restart. Confirm settings persist and that user pauses, quiet hours and ongoing conversation are respected. The scheduler guards and cooldown are also covered by automated tests.

Later work includes expressive natural singing guides, lyrics, requested acoustic excerpts, additional original motifs and the full music workbench. The current integration does not train a singing model.

## Original lyric audition: Little Light

`scripts/make-lyrical-audition.py` prepares a roughly ten-second original verse:

> Little light, shining bright.
> Stay with me, through the night.

The outputs live in `exports/singing/little-light-audition/`: `little-light-vocal.wav` for isolated listening and `little-light-piano.wav` with quiet piano entering after the voice. The accompaniment RMS is 15% of the vocal RMS before final peak limiting. Guides and source speech are retained for diagnosis.

This is a provisional prototype made by stretching/pitch-shaping GPT-SoVITS speech into a melodic guide, then converting it through Seed-VC. It may sound like melodic speech or chanting; it is not evidence of natural lyric-to-song generation. It remains outside the initiative library until the user approves delivery, intelligibility, voice identity and accompaniment. The approved humming and provisional wordless song remain available.

Musical chat notes offer Replay, which plays the prepared clip instead of reading the note aloud. Both unaccompanied hums passed user listening review; the wordless song remains provisional. GPT-SoVITS loads automatically on app opening when the saved speech voice is Mana · GPT-SoVITS, and when selecting it. Startup checks reuse a running service; errors remain visible and manual Start can retry.

The active singing pool is now managed in **More → Songs**, with titled additional approved clips and named requests. See [Songs](SONGS.md). The built-in cover is titled Reach Out to the Truth and retains Mana cover excerpt as an alias.
