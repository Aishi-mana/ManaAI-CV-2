# Humming and little songs

Voice → Humming and little songs contains previews and the opt-in Occasional musical moments toggle. Spontaneous playback is disabled by default. Settings are saved inside initiative state and included in backups; older backups default to disabled.

The active library contains Soft little hum and Sunny little hum (approved, unaccompanied, about five seconds each), and Mana cover excerpt (approved, about ten seconds with lyrics and quieter original backing). The cover uses the actual sung guide from `exports/singing/1791658128634/`, converted through Seed-VC using Mana's approved `default-r2.wav` reference. Its mix is copied to `exports/singing/musical-moments/cover-excerpt.wav`. It is a cover excerpt, not an original composition or an acoustic remake. The earlier wordless song remains on disk and old chat Replay buttons still resolve it, but it is no longer selected for new singing requests or initiative.

Clips are prepared once, rather than generated when initiative fires. They live under `exports/singing/musical-moments/` and survive restart while those files remain present. Audio is not embedded in JSON backups. Missing clips turn musical initiative off after a failed attempt; they do not produce repeated retries.

Spontaneous opportunities use initiative's journal timezone, 08:00–22:00 quiet-hour boundary, at least two minutes since opening and five minutes without chat activity, sufficient energy, and existing user-requested pauses. Musical initiative has a separate 15–240 minute cooldown, with one random delay between one and two cooldowns per attempt. Enabling does not play immediately. Pending conversation starters and recent initiative attempts block music. Mood selects bright/soft motifs; neutral moods vary the clip. Ordinary conversation initiative also waits while audio or the microphone is occupied.

Shared playback uses voice volume, energy-based mouth motion and Stop. Draft entry, chat work, hidden app state, microphone use and hands-free stop or block music. Muting stops music immediately. Controls and simple typed requests work independently of the spontaneous toggle: `hum for me` and `sing a short song`. Singing plays the approved prepared cover excerpt; arbitrary requested songs and new melody generation are not supported here yet. Hands-free suppresses musical initiative; musical requests through its speech-to-chat loop are not intercepted yet.

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
