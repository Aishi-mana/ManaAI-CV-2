# Songs and the short song pool

## Song vocabulary hints for microphone recognition — 2026-10-18

User screenshots show repeated sing→Xing/Singh/Shing/Sin and Trails→Rails misrecognition; correctly recognized Sing Sora successfully plays configured song. Whisper previously received only character/user names. Added recognitionPrompt vocabulary context with sing/hum and current enabled Chat clip titles/aliases, prioritizing aliases per entry, deduplicating and bounding whole prompt to 440 UTF-8 bytes under native 500-byte cap. useWhisper receives live vocabulary via ref; regular transcript text remains unchanged, with no forced spelling replacements or fuzzy song playback. This may improve decoding but actual microphone accuracy needs user retest. No larger model, download, synthetic generation or extra recognition pass. Frontend/native builds and 10 focused recognition/noise/cancellation/parser checks passed, including multilingual byte bounds. Repeated-reply errors in screenshots are downstream chat failures after misrecognized commands, not evidence of microphone failure cause. Chat UI polish is visible in screenshots; no further layout request.

## Hands-free song playback accepted — 2026-10-18

User confirms Mana can sing from hands-free requests. Screenshot shows successful saved-song playback notes for Trails v3 (Whereabout of the Stars v3) and Reach Out to the Truth, with Hands-free: playing song status. Spoken request routing and song playback accepted. Misrecognized phrases remain a speech-recognition limitation; exact enabled titles/aliases still apply. User subsequently confirms both remaining live checks passed: listening resumes after the song finishes, and Stop hands-free stops playback mid-song. Hands-free song-request workflow is fully accepted for this scope. No further generation or tuning needed.

## Hands-free song requests connected — 2026-10-18

User passed ordinary hands-free conversation, then screenshots confirmed song requests went to ordinary chat and were repeated instead of played. ChatPanel now intercepts recognized musical commands before onSend, resolves enabled saved Chat clips by exact normalized title/alias and plays existing audio through shared voice playback. Accepts character address and dictation commas (e.g. Mana, sing Trails / Sing, Reach Out to the Truth). No fuzzy guesses for misrecognized titles such as Sting trails; add aliases in Chat clips for short names. Generic sing/hum requests use existing selection. Unknown songs report available titles and stop hands-free with visible feedback instead of inventing a rendition.

Dedicated loading/playing song phases keep microphone closed and bypass only the hands-free music-stop guard; spontaneous music remains blocked. Playback completion uses existing cooldown before capture resumes. Stop/hidden app/error handling preserved; session counter suppresses obsolete completion callbacks. Successful requests use existing user-message/music-note history and replay path. No song generation or transcription model changes.

Validation: production frontend and native debug builds passed; 206 frontend tests passed, 2 optional skipped. New command parsing tests cover named address, punctuation, aliases, ordinary sentences and rejected misheard titles; existing cancellation/noise tests pass. Live song request/playback/resume and Stop during song await user check; browser verification remains unavailable under prior usage gate.

## Word karaoke accepted — 2026-10-18

User confirms word-by-word karaoke works and explicitly passes it. Transcription can miss/misrecognize words; user accepts Edit / paste as the correction workflow. Defer recognition-quality improvements; do not run more transcription/audio tests or tune models unless requested. Existing playback/seek timing and editable word lyrics accepted.

## Word-by-word karaoke implemented — 2026-10-18

Song Player lyrics support optional per-word start/end/text while keeping legacy line-only lyrics compatible. Native Whisper CLI uses -oj -ml1 -sow for actual word timestamp segments; group up to8 words into readable lines, retain timing gaps, skip music-only symbols, clamp final words to audio duration and retain line fallback for multiword segments. No evenly-spaced guessed timings. Existing Generate/Regenerate lyrics explicitly transcribes the saved vocal/mix locally. Cancel/timeout/temp cleanup preserved; JSON bound16MB.

UI highlights current word, marks sung words and reads live audio clock at20Hz during playback; pause and native seeking update exact position. Word data validates, persists through studio metadata/backups and clips/rebases with excerpts. Edit/paste exports enhanced LRC word start/end markers, preserving gaps; plain LRC still works. Existing line-only songs need Regenerate lyrics once for word highlighting; no song audio regeneration needed.

Validation: actual installed Whisper small.en transcribed one6s saved B clarity sample in4s and returned individual offsets; wording remains an estimate (one extra word recognized). Committed sanitized timestamp fixture tests native parser. Full frontend suite203 passed/2 optional skipped (205 total);5 native lyric tests passed; production frontend and native debug builds passed. Native/TS tests cover timing boundaries, gaps, backward seeks, pause positions, validation fallback, editing, excerpts, metadata persistence and real CLI-shaped offsets. No model downloads/new song generation. Browser UI not checked because prior approval usage gate remains unresolved. User acceptance pending.

Next agreed direction: a full-size pastel [Music Studio](MUSIC_STUDIO_PLAN.md) with library/player, artwork, reviewed excerpts and later arrangement recreation. The user confirmed whole-song conversion works; high-note distortion and trembling remain open and are deferred while planning the studio.

Open **More → Songs**. The approved ten-second Reach Out to the Truth cover is the first pool entry. Humming remains unaccompanied and separate from this pool.

## Add another song

1. Choose uploaded guide audio in the cover section. It must contain the desired words and melody. For a full mix, leave vocal separation enabled; turn it off for a dry guide vocal.
2. Choose the start and segment length (1–60 seconds), or enable **Whole song** to convert the entire uploaded file from beginning to end. Whole-song mode ignores the excerpt fields and permits up to two hours of processing before timeout; Stop and Close remain available. Pool clips must still be 1–30 seconds, so full covers can be previewed/exported but need a separate short conversion for chat. Ten seconds is a useful first audition. Backing volume defaults to 30% of the original separated backing, after vocal level matching; 0 produces a mix without backing. This retains the original instruments, rather than creating acoustic replacements.
3. Convert, then choose vocal only or vocal with backing. The selected output fills Prepared WAV above. Existing generated WAVs under `exports/singing` can also be selected directly.
4. Load the audition and play it. Enter a unique title and optional comma-separated aliases. Check the listening approval box and add the clip to the pool. Converted clips are never added automatically.

The pool holds up to 50 approved clips. Each entry has an enabled switch, preview and removal control. Disabling excludes it from named requests, generic requests and occasional singing. Removal removes metadata only; it preserves files and chat history. Existing chat replay depends on the entry remaining in the pool, except the built-in and legacy clips.

## Chat requests

- `sing a short song` selects an enabled song, avoiding the immediately previous clip when alternatives exist.
- `sing Reach Out to the Truth` plays the matching song; `can you sing "Reach Out to the Truth" for me?` also works.
- Titles and aliases match after case/punctuation normalization. No fuzzy guessing is used.
- Unknown or disabled titles produce a grounded reply offering up to three enabled alternatives. If the pool is empty, Mana offers to hum or add a song. Nothing is generated for a missing title.

Typed requests use the existing playback guards: ready, visible, unmuted, no microphone/hands-free, no conflicting playback. Named requests through the hands-free speech loop are now connected; see latest status above. Chat Replay plays the prepared WAV rather than speaking its start note.

## Initiative, storage and limits

Enabled pool songs also participate in the opt-in musical initiative scheduler, with its existing cooldown, pauses, quiet hours and idle checks. Opening Songs stops chat musical playback and blocks new chat initiative. The drawer has one preview player; Stop and Close cancel conversion and clear previews.

Titles, aliases, enabled flags and WAV paths persist inside `mana.initiative.v1` and are included in JSON backups. Older backups gain the approved starter song. WAVs and models are not embedded in backups. Missing WAVs fail visibly and disable musical initiative instead of generating retry loops. Native preview reads remain constrained to generated WAVs under `exports/singing` (256 MB maximum); larger exports stay on disk even if the in-app preview rejects their size.

Current conversion uses the selected GPT-SoVITS speech reference as Seed-VC's target timbre; Seed-VC handles singing conversion. A real sung guide supplies phrasing, lyrics, pitch and timing. The melodic-speech original audition failed listening approval and remains outside the pool. Original songwriting, instrument recreation, acoustic arrangements and a warm singing worker remain future enhancements. Whole-song conversion is available, but cover trembling remains unresolved.

## Manual acceptance

User confirmed the menu, named requests, missing-title suggestions and adding a second song work. Cover quality still needs listening refinement.

1. Open More → Songs. Preview the starter clip; send `sing Reach Out to the Truth` and check Replay.
2. Add a different prepared short WAV with a title and alias after auditioning it. Ask for each name; confirm the correct clip plays.
3. Ask for an unavailable song, then disable a song and request it. Confirm suggestions reflect enabled entries. With all songs disabled, humming should still work.
4. Restart and check the pool persists. Test Stop/Close during audition or conversion. New conversions should honor the chosen backing volume and stay out of the pool until approved.

## Cover-quality audition

`scripts/compare-cover-quality.py` uses the twelve-second job in `exports/singing/1791666387755`. It exports common-RMS, peak-limited comparisons under `exports/singing/cover-quality-audition`: isolated guide, current Mana vocal, current mix, a 60-step Mana vocal and its mix. The candidate retains Default 2, guidance 0.7, F0 conditioning, no pitch shift and 30% original backing. Production remains at 30 steps and pool audio is unchanged.

Both source and converted WAVs have finite audible samples and no samples at the clipping threshold. That does not establish clean separation, accurate pitch, natural delivery or perceived similarity. Compare the guide first for separation damage, then the converted vocal for added artifacts, then the mix for masking. More diffusion steps are an audition variable, not a guaranteed quality improvement. The local upstream loader reports some checkpoint shape mismatches; those logs remain diagnostic evidence rather than proof of the audible cause.

The user heard a slight improvement at 60 steps but continued trembling. `scripts/audition-singing-pitch.py` prepares a separate conservative guide-F0-conditioning experiment in `exports/singing/pitch-stability-audition`. Source audio is unchanged; reference F0, voicing boundaries and large note transitions are preserved. Synthetic checks retained a 6 Hz vibrato while reducing rapid jitter. On this real guide, median adjacent voiced pitch movement changed only from about 5.92 to 5.88 cents; the converted baseline was about 6.96 cents and candidate about 7.50 cents. These extractor measurements do not demonstrate an improvement or establish the audible cause. The candidate remains unapproved, with production smoothing off and pool clips unchanged. Further work should consider conversion/timbre stability rather than assuming pitch smoothing alone will fix trembling.

The user preferred the gentler-pitch version despite unchanged trembling. It is the listening baseline for further experiments. `scripts/audition-conversion-stability.py` compares guidance 0.7 and 0.4 with a fixed seed of 42, 60 steps, the preferred guide smoothing, the same Default 2 reference and 30% backing. Volume-matched vocal/mix auditions are saved under `exports/singing/conversion-stability-audition`. The control is rerendered with the same seed as the candidate; it is not identical to the earlier unseeded preferred clip. Lighter guidance is an experiment and may alter voice similarity; no quality improvement is assumed. Production guidance remains 0.7 and pool files are unchanged.
