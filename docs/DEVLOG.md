# Mana development log

## 2026-10-11 — Finished-cover excerpt extraction

Implemented frame-aligned native WAV slicing with range checks, safe generated paths, separate excerpt files and a blocking-worker task. Pool controls load the result into the existing audition/approval flow. Tests cover exact audio frames, truncated WAVs and invalid ranges. No voice model or conversion settings changed.

## 2026-10-11 — Studio accepted; compact song pool

User passed studio tests 1–4 and requested a denser pool for larger collections. Added title/alias search, compact artwork rows, expandable aliases, enabled counts and accessible enable/preview/remove icon buttons with native tooltips. Existing approval, playback and persistence paths remain in use. Singing-quality tuning remains deferred.

## 2026-10-11 — Music Studio stage 1

Replaced the narrow cover drawer with a full-size pastel main view, keeping ChatPanel mounted to preserve chat state. Added nested studio project metadata to existing initiative storage/backups, bounded resized JPEG artwork, safe completed-cover discovery, request metadata for new jobs, and WAV-header duration inspection. The center player owns cancelable WAV loading/Blob cleanup and shared preview occupancy; mix/vocal/instrument selection, seeking, pause/stop and volume are available. Returning to chat pauses media but retains forms and permits the existing conversion job to complete. Deferred distortion and trembling work remains untouched. Browser checks at 1280×720 and 820×560 found and fixed a small-window grid overlap; user acceptance of desktop playback/artwork/conversion remains pending.

## 2026-10-11 — Pastel Music Studio plan agreed

The user confirmed whole-song conversion works but reported high-note distortion. They chose to defer singing-quality tuning and agreed to a full-size, music-player-style studio in Mana's pastel colors. Recorded the library/player layout, album artwork, cover workflow, reviewed chat excerpts without reconversion, saved project settings, export, and later instrument recreation/original generation in [MUSIC_STUDIO_PLAN.md](MUSIC_STUDIO_PLAN.md). This step updates documentation only; no studio implementation was requested yet.

## 2026-10-11 — Whole-song conversion

Added explicit whole-song mode through the Songs UI, native singing job arguments and Python decoding (`offset=0`, no duration crop). Existing Seed-VC chunking handles the longer guide. Complete-vocal outputs are checked for duration and padded only for sub-second tail differences before remix. Demucs stem/model references are released before conversion to reduce concurrent memory use. Long covers can be previewed without becoming eligible for the short chat pool; preview reads are capped at 256 MB. Tested a repeated real-vocal guide of 61.25 seconds with deliberately conflicting start/length inputs: complete output duration passed. Build and 55 native tests passed. No singing quality defaults were changed.

## 2026-10-11 — Conversion stability audition

The user preferred the gentler-pitch cover but still heard trembling. Prepared paired fixed-seed guidance 0.7/0.4 auditions while retaining 60 steps, guide smoothing, Default 2 and quieter backing. The shared Python job accepts optional bounded guidance and seed arguments for offline experiments; UI defaults and approved pool audio are unchanged. Listening quality and voice-identity tradeoffs remain pending.

## 2026-10-11 — Trembling diagnostic and conservative F0 audition

The user found the 60-step cover slightly better but still shaky. Prepared an optional guide-only F0 smoother, preserving source audio, silence and large note boundaries. Synthetic checks retained vibrato and reduced rapid jitter; the actual guide changed minimally and converted-pitch metrics showed no stability improvement. Kept a separate baseline/candidate audition and recorded this negative result instead of replacing approved clips. Production still uses no smoothing. Further timbre/conversion investigation remains open.

## 2026-10-11 — Cover quality comparison

Following successful song-pool manual testing, the user reported that cover singing needs refinement. Prepared matched-RMS guide/vocal/mix comparisons for the latest twelve-second cover, plus a 60-step Seed-VC candidate with the same Default 2 reference and pitch settings. Outputs are finite, audible and unclipped; perceptual quality and separation fidelity remain listening questions. No approved pool audio or production quality default was replaced. `singing_job.py` accepts an optional bounded offline diffusion-step setting, defaulting to the existing 30 steps.

## 2026-10-11 — Song pool and grounded named requests

The user approved the current-reference ten-second sung cover and requested additional songs plus named selection. More → Songs extends the supplied-guide converter with a reviewed short-song pool, case/punctuation-normalized titles and aliases, enable/remove controls and backing gain. Pool metadata lives inside musical initiative state, with backward-compatible backup migration. Generated audio stays external. Unknown titles offer available entries instead of invented performances. Original songwriting and acoustic instrument recreation remain future scope; the speech-derived lyric audition did not pass listening review. See SONGS.md for acceptance checks.

Started 2026-10-09. Backfilled from current project documentation, available session
evidence and Git. This records decisions and verification, not every tool call or
a complete historical audit. Older details without reliable dates are grouped rather
than assigned invented timestamps. No legacy data was migrated by writing this log.

## 2026-10-10 — Four voice delivery selections accepted

User confirmed revised cheerful and gentle both passed. Accepted selections are the current configured main reference for default, the longer thoughtful clip, and revised combined cheerful/gentle files. Updated review manifest with delivery approval while retaining unverified transcript status. No active settings or audio changed. Next runtime work is independent Japanese reference/English reply language support, verified per-preset transcripts and selectable presets.

## 2026-10-10 — User-directed reference revisions

User rejected the rebuilt default because of remaining BGM and explicitly chose the main reference currently configured in Mana. Rejected the longer cheerful delivery; requested earlier audition-cheerful followed by audition-default. Passed the longer thoughtful. Requested earlier audition-gentle followed by audition-thoughtful; clarified via question that this combination belongs to Gentle.

Created ignored exports/voice-review/revised-references with cheerful (8.443 s) and gentle (8.461 s), each with one 250 ms joining pause. Source samples/order preserved; no extra denoising, gain or pitch change. Duration, finite samples and non-clipping checks passed. Previous files and active settings are unchanged. The new combinations need listening/transcript checks; thoughtful remains the passed longer clip. Selection provenance is recorded in manifest.json.

## 2026-10-10 — Approved styles and longer reference candidates

User approved the short style auditions and the approximately eight-second target. Prepared exports/voice-review/references-8s: default 8.136 seconds, cheerful 7.680, thoughtful 8.100 and gentle 8.289. The earlier short audition manifest records style approval separately from unverified transcripts.

Default was reconstructed from the original Fight! MP3 using the same team-play phrase. Measurement found about 3.86% of samples above 0.999 in the existing main_reference.wav, consistent with prior clipping; attenuation cannot restore that waveform. Its original MP3 segment had no such clipping. Kept a byte-preserved previous reference for comparison; the active setting/file remains untouched. Automatic Japanese transcription of the rebuilt default matches the user's corrected wording.

Cheerful/thoughtful candidates are single continuous excerpts from the Bike Ride source at offsets 152.38–160.06 and 311.96–320.06 seconds, with Demucs vocal separation. Gentle uses six complete caring phrases (014/268/048/107/155/159) with 250 ms gaps because a confidently gentle continuous passage was not established. New excerpts/additions need listening comparison; draft ASR has errors and does not certify speaker identity or expression. Originals are available for assessing separation artifacts.

Level-matched candidates toward RMS 0.1 with a 0.95 peak cap; no pitch shifting/time stretching or extra denoising. All candidates measured 7–9 seconds and zero full-scale clipped samples; peaks below 0.57. Source hashes remain unchanged. This is review/export work, not runtime preset installation. Japanese reference-language control, user-verified transcripts and a selectable preset interface remain the next runtime step.

## 2026-10-10 — Voice collection triage and corrected performance feedback

User clarified that slow conversion occurred while ComfyUI was running; after restart a ten-second song generated quickly enough. Generation speed is currently acceptable, so optimization remains optional rather than a reported standalone failure. Chat acoustic singing preference is light guitar or piano accompaniment.

Inspected the supplied Downloads/Yuuki Voice folder: six MP3 sources plus 269 stereo 44.1 kHz WAV cuts, totaling 229.4 seconds. Every WAV cut is below the current GPT-SoVITS 3–10 second reference range (0.221–2.691 seconds). All have roughly 0.1 RMS, suggesting prior normalization; none showed measured full-scale clipping or byte-identical duplicates. These measurements do not establish freedom from background music, artifacts or mixed speakers.

Prepared ignored exports/voice-review with a CSV/JSON catalogue, unchanged copies grouped by provisional styles/content, local Japanese Whisper-small draft transcripts, longer-source review excerpts and four 3.787–4.424 second audition references. Provisional counts: cheerful 43, thoughtful 38, gentle 18, neutral 20, names 31, battle context 43 and reactions/unclear 76. Style labels are based on draft phrase content and acoustic triage, not listening-certified emotional delivery or identity. Short-clip ASR errors/repetitions remain explicitly unverified. Four auditions join only a few complete matching phrases with 250 ms gaps; no denoising/pitch/gain change and no runtime adoption. A single naturally continuous phrase remains preferable when available. Current user-approved reference remains the baseline.

Verified all 269 source hashes remain unchanged, all categorized copies match, and audition WAVs meet duration/finite-sample/non-clipping bounds. Original audio stayed in Downloads; no audio upload. Cached multilingual Whisper-small was used locally, with CUDA for short-clip batches where memory was available. Review needs human listening before final labels/transcripts or cleanup. Cleanup should be selective and compared against originals; training utterances stay separate rather than one WAV per category. Reference/reply language controls remain the next runtime implementation task.

## 2026-10-10 — Custom voice and singing manual acceptance; next direction

User confirmed all four manual checks passed. Five-second singing conversion feels slow. Correcting the main reference transcript improved custom speech; the earlier exported speech sample sounded sleepy. User liked the generated guide backing mix. The confirmed romanized transcript is: “Chiimu purei wa tokui na hou da yo. Shinrai dekiru minna to issho ni nanika o suru no tte sugoku tanoshii shi ne.” This supersedes the automatically guessed English reference transcript for future tuning; do not overwrite the user's runtime settings while documenting it.

Inspection found `prompt_lang` and `text_lang` both hardcoded to English. Next priority is independent Japanese reference / English reply language controls and a verified Japanese-script transcript. Singing currently launches a fresh Python process, reloads separation/conversion models, forces CPU and uses 30 diffusion steps. Warm workers, reference/stem/result caching, measured preview/final quality presets and a VRAM-aware GPU option are proposed, not yet implemented or benchmarked.

User requested two singing surfaces: short occasional humming/acoustic singing in chat, including short renditions of requested songs; and a separate studio for prompt-based original songs or uploaded-song covers with vocals extracted and instrumentation regenerated toward Mana's style. Studio should offer anime-style short arrangements and full-length versions. Chat spontaneity should be explicitly enabled, infrequent and interruptible, with cached approved motifs for responsive playback and no singing over microphone capture or other audio. Voice-only versus light acoustic accompaniment remains a preference to resolve; retain the user's word “acoustic” rather than silently choosing one.

Voice identity plan: a stable default reference, deliberate expression presets from the same speaker, fixed model versions and comparison phrases, then optional dedicated Mana fine-tuning with clean consistent recordings. Speech and singing may need separately tuned models tied to the same voice identity. Pitch/effects alone do not establish a unique speaker identity. Prompt music generation and arrangement changes need a music backend beyond GPT-SoVITS/Seed-VC; the installed ACE-Step setup is a candidate to benchmark, not a verified full-song integration. No new runtime/code change in this acceptance/planning update.

## 2026-10-10 — GPT-SoVITS speech and supplied-guide singing

User chose the existing GPT-SoVITS setup and singing to a supplied guide, then supplied the soundtrack MP3 in Downloads. Inspected local APIs and selected the existing main_reference.wav plus v2 pretrained weights for speech. The draft reference transcript comes from automatic transcription and has not been user-verified. No training or original song composition was performed.

Integrated an owned hidden CPU service, loopback HTTP WAV generation, selectable custom voice, preview, shared preferences, cancellation and approximate audio-energy mouth animation. Generation keeps hands-free in its playback-launch phase until real audio starts. Found and corrected two integration hazards: a full stdout pipe can prevent polling completion, so WAV base64 responses use bounded temporary files; Windows cp1252 logs caused GPT-SoVITS to return silent WAVs after a Unicode print failure, so Python starts with UTF-8 and playback rejects silent samples.

The supplied file includes backing music. Installed Demucs 4.1.0 in a project-local venv inheriting Seed-VC packages, copied Seed-VC sources into ignored project data, and used the same reference for F0-conditioned conversion. Separation and conversion run in a single owned Python process so Stop cannot leave a child conversion process behind. Source files stay unchanged; stems, converted vocals, backing remix and logs are exported. First run downloads weights. CPU conversion is bounded to a selected 1–60 second segment and a 30-minute UI timeout.

Verification: 151 frontend checks passed with two optional live checks skipped; 55 Rust checks passed; frontend build and cargo check passed. Tests cover backup defaults/canonical validation, WAV bounds, silence mouth rest, cancellation during custom launch, and large result-file cleanup. Actual CPU speech produced 5.3 seconds of non-silent 32 kHz audio; native proxy returned 310,672 base64 characters without error. The first segment at offset ten seconds completed technically but its separated vocal was nearly silent, so it was not accepted as a meaningful singing test. Analyzed the 19.87-second guide and selected five seconds starting at one second (separated vocal RMS about 0.14). This vocal segment produced 44.1 kHz converted vocal and backing mix. Added a near-silent vocal guard before conversion and verified that the ten-second segment is rejected. An initial vocal render clipped about 4.4% of samples at PCM encoding; intercepted upstream WAV saving to normalize before encoding, then matched the guide vocal RMS for the backing remix. Final vocal and mix each measured 4.992 seconds, peak at most 0.98 and zero samples above 0.999. Model similarity, music quality and live custom hands-free still require user listening/acceptance. The reference speech, isolated guide and converted audio are available under ignored exports for comparison. Build retains the existing large-chunk advisory.

## 2026-10-10 — Future icon-button enhancement

User requested a future switch from word-heavy buttons to icons, with tooltips. Added a deferred
V1.x interface-polish checklist to the roadmap: consistent recognizable icons, hover/focus tooltips,
accessible action names and clear state indicators. Text can remain where an icon would be ambiguous.
Documentation only; no buttons converted in this update.

## 2026-10-10 — Hands-free manual acceptance complete

User confirmed repaired test 4 passed, completing the earlier tests 1–3. Screenshot shows
“No speech detected” and the hands-free session stopped with background fan noise; earlier sound-caption
chat entries remain historical messages. This accepts all four manual foundation checks, not all possible
noise environments. The repeated stop notice visible in the screenshot remains a minor UI polish item.
No code changed in this acceptance update.

## 2026-10-10 — Hands-free background noise repair

User confirmed loop tests 1, 2 and 3 passed (automatic send, reply/resume, Stop). Test 4 could
not pass with fan/background audio: Whisper produced [Music] and [XBOX SOUND], sent into chat.
User currently has no headphones. Added 700 ms initial background calibration, requiring signal
above 2.5 times the measured floor (minimum RMS threshold unchanged). UI asks the user to wait
briefly during calibration. Caption-only bracketed/parenthesized noise and musical symbols are
blocked before automatic send, stopping the loop with feedback. Ordinary speech mentioning music
remains allowed. This is heuristic noise handling; real voice-like background or hallucinated plain
words can still fool it. Build passes; 148 frontend tests pass, 2 optional live tests skipped.
Retest background-only stop and spoken greeting above the fan is pending. Earlier noisy messages
are left untouched as chat history. No native or model change.

## 2026-10-10 — Hands-free voice loop

User authorized explicit hands-free mode. Start requires ready chat, available audible voice and no current
draft/image/review/busy microphone. Whisper input uses amplitude-based SpeechEndpoint: 300 ms sustained
signal, 1.2 s quiet endpoint, 8 s no-voice timeout, existing 15 s maximum capture. This is heuristic pause
detection, not a learned VAD. Transcripts automatically call the normal chat send path; the current assistant
ID baseline prevents replaying history. Chat waits for a new completed assistant reply, starts speech,
then resumes capture after playback with a 700 ms cooldown. Standard automatic speech is suppressed for
the session to avoid double playback; saved automatic preference is unchanged. Stop cancels capture/CLI,
playback and a pending session reply. Hidden app/model loss/errors stop the loop. Session is never persisted.
Voice input review remains the default outside hands-free; failures to send preserve transcript for review.

Production build and frontend tests pass (147 passed, 2 optional live tests skipped). Endpoint tests cover
pause, sustained voice, short noise, silence and continuous speech; existing cancellation tests remain.
No native code change. Full live loop/playback feedback/Stop acceptance is pending; no real microphone
or synthesized endless conversation was initiated by the agent.

## 2026-10-10 — Voice input layout polish

User authorized de-crowding the growing voice/image controls. Added compact voice-input toolbar with
collapsed-by-default recognizer/language/path setup, full-width transcription review and bounded scrolling
for expanded settings/review. Record/Transcribe/Cancel stay accessible while setup is collapsed; errors
remain visible. Avatar comparison toggle appears only while an image is attached. Whisper capture
provides a 100 ms display timer and RMS-derived input meter using audio already captured for transcription;
no additional recording or persistence. Meter clears outside recording, capped timer shows 15 seconds;
this is signal level, not voice detection or transcription confidence. Windows recognition has no input meter.

Production build passes; 146 frontend tests passed, 2 optional live tests skipped. Existing cancellation test
updated for the additional meter effect; meaningful signal tests cover silence, invalid samples and clipping.
No native behavior changed. User subsequently confirmed all four voice-input polish checks passed. Screenshot shows the compact collapsed toolbar and restored chat space; timer/meter and review checks are accepted based on the user report.

## 2026-10-10 — Whisper live recognition confirmed

User reports accurate real-microphone transcription. Screenshots show “Hello Mana, how are you today?”
and “My name is Aishi” correctly in review, with the first greeting subsequently visible in chat.
This confirms microphone permissions/capture, local recognition for those phrases and review-to-chat use.
Record this as successful live phrase recognition, not a measured general accuracy rate. Cancellation,
silence handling and the automatic 15-second limit remain covered by implementation/automated checks
rather than a reported complete manual test set. No code changed for this acceptance update.

## 2026-10-10 — Local Whisper transcription

Windows name tuning still misheard live Hello Mana as All were with uncertain alternatives. User authorized a stronger local transcription model. Installed whisper.cpp CPU x64 release b5454 (CLI version 1.9.5) and ggml-small.en.bin (487,614,201 bytes) under ignored data/whisper; model SHA256 verified against publisher metadata: c6138d6d58ecc8322097e0f987c32f1be8bb0a18532a3f88f734d1bbf9c41e5d.

Added explicit WebView microphone capture with permission handling, 15-second cap, 16 kHz mono WAV encoding and silence check. Native Whisper owns one hidden CPU CLI process, a 180-second inference timeout and temporary input/output deletion through session Drop. Normal app exit cleans up; hard crashes can leave temp files. Cancel while permission/launch is pending invalidates late results and closes streams. Review uses the existing edit/add/discard flow; Windows remains a selectable fallback. Whisper paths persist as mana.whisper.v1 and old backups gain default paths; audio/runtime/model are excluded from backup. Installed English model is not automatic language detection or voice training.

Synthetic 3.4-second TTS WAV produced Hello Mana How are you today? in about five seconds on CPU, both console and production-style output-txt paths checked; smoke files deleted. No live microphone was opened during agent checks. Build passes with existing nonfatal chunk-size advisory; frontend 145 pass, 2 optional live tests skipped; Rust 53 pass. Tests cover WAV format/resampling/clipping/silence, old backup compatibility, cancellation during pending microphone permission and session temp cleanup. Real microphone accuracy, permissions and record/transcribe/cancel UI acceptance pending.

## 2026-10-10 — Dictation names and review improvements

User tested live capture successfully but reported Mana becoming Mantle and Hello becoming Pedal.
This confirms capture-to-draft, not recognition accuracy or the cause of errors. User authorized tuning.
Added a companion-name/greeting grammar alongside unrestricted dictation, using configured character/user
names sent as bounded JSON data. No global replacements or automatic corrections. Native result includes
confidence and up to four alternatives. Frontend keeps recognition in an editable review box; Add to draft
is explicit and Send is blocked until review is accepted/discarded. Scores are not accuracy percentages.
This grammar primarily assists isolated names and greetings; arbitrary speech may still struggle.
Synthetic in-memory “Hello Mana” tested through the production helper with its microphone input replaced
by a WAV stream yielded exact “Hello Mana”, confidence 0.985, no competing alternative. No microphone
opened or audio file saved by the check. Build passes, 142 frontend tests passed (2 live tests skipped),
49 Rust tests passed. Live retest needed for names, ordinary sentences, alternatives and discard.

## 2026-10-10 — Microphone draft input (manual acceptance deferred)

User authorized implementation but cannot test the microphone currently. Added local Windows System.Speech dictation using a hidden owned PowerShell helper; installed recognizers enumerate without listening. Explicit Microphone starts one-phrase recognition from the default device; Cancel discards pending results and kills the helper. Recognition appends to the current draft, preserving edits made while listening; Send remains manual. Native polling enforces a 30-second wall limit and process cleanup on exit, frontend cleanup on unmount. Speech playback is gated while listening. No audio storage or new backup keys; language is session-only.

Read-only inventory found MS-1033-80-DESK (en-US). Synthetic speech generated into an in-memory WAV and transcribed through installed dictation yielded “Hello world” (first phrase); no microphone or speaker used and no audio file created. Frontend tests cover validation, preserving typed text and cancellation during pending launch; native tests cover input validation and idle stop. Real microphone permissions, accuracy and device cancellation remain unverified. Do not mark manual tests passed. Build succeeds with a nonfatal Vite chunk-size advisory; 141 frontend tests pass, 2 optional live tests skipped; 48 Rust tests pass.

## 2026-10-10 — Avatar comparison manual acceptance

User confirmed repaired tests 1, 2 and 4 passed, alongside the prior comparison-off test 3.
Screenshots show tentative resemblance for Mana artwork, the glasses difference, hair/clothing
comparison for the cardigan character, and headset/clothing differences for the dark-uniform character.
All four manual checks are accepted for the avatar-reference foundation. This does not establish
perfect visual accuracy or verified identity. Remaining tuning examples: the X hair clip is called
a forehead mark, and a plain white background is called a room. These are recorded limitations,
not reasons to undo the accepted reference feature. No code changed for this acceptance update.

## 2026-10-10 — Avatar comparison acceptance failures and prompt repair

User reports only test 3 (comparison off) passed. Test 1 falsely called the attached character Aishi;
test 2 discussed the book without appearance differences; test 4 omitted glasses and invented prior reading.
The screenshots do not establish whether the underlying vision report compared the reference accurately.
Code review confirms the reference argument reaches vision; there was no required comparison format or
comparison-specific final chat instruction. Vision now requests five nonempty sections: Attachment,
Avatar reference, Similarities, Differences, Resemblance, explicitly checking glasses and headset ornaments.
Incomplete reports fail visibly and preserve the attachment instead of silently accepting description-only output.
A marked comparison report adds final chat guidance after brief style: include resemblance plus concrete
comparison evidence, never infer Aishi identity or invent previous activities. These are model instructions,
not a guarantee of visual accuracy or compliance. Build passes; frontend 139 passed, 2 optional live tests
skipped. Retest 1, 2 and 4 remains pending; no live two-image inference was run in this repair.

## 2026-10-10 — Current avatar reference

User requested avatar reference next. Added avatarReference.ts to composite current wardrobe layers with neutral eyes/mouth on white at 640 pixels maximum. Chat checkbox defaults on for the session; missing avatar disables it. Attachment remains first in the two-image vision request, reference second. Comparison asks for similarities/differences and separates headset decorations from anatomy; it cannot prove identity or authorship. Current avatar is regenerated on inspection, not stored as a library entry or affected by stage zoom/blinks/speech. Comparison reports are retained with ordinary image descriptions. Production build and frontend tests pass; manual two-image model acceptance remains pending.

## 2026-10-10 — Saved image attachments

User accepted local image persistence as the next V1.x item after confirming inline test 2 passed.
Prepared JPEGs now live in SQLite app_state under mana.images.v1, included in validated JSON backups.
Image reports reference deduplicated pixels by ID; chat and archives show thumbnails. Use image again
attaches the stored copy for fresh vision inspection. More → Saved images provides search and explicit
deletion, preserving descriptions and earlier backup copies. Images are saved after successful vision
inspection and flushed before handing the report to chat. Aborted inspection retains the composer attachment.
A stop during the persistence flush can leave an unlinked library image, which can be deleted explicitly.
Limits are 100 images and 8 MB encoded JPEG data; originals are resized to 1280 pixels maximum.
No automatic pruning, identity recognition or direct pixel input to the chat model is introduced.
Older backups default to an empty image library; older reports and review-panel text remain description-only.

Validation: production build passes; frontend 136 passed with 2 optional live tests skipped; Rust 46 passed,
including SQLite reopen and pixel deletion preserving chat links. User confirmed manual desktop tests 1–4 passed: restart retains the thumbnail; Use image again
performs fresh inspection; backup/restore retains pixels; deleting pixels preserves descriptions.
Screenshots show the library dropping from one image to zero and restore preview finding one
image in the backup. Identity recognition remains unverified: Mana describes the library scene
but remains uncertain after the user identifies the character as Mana. Headset ears are still
sometimes described as anatomical cat ears; this acceptance covers persistence, not visual accuracy.

## 2026-10-10 — Current image scene grounding

User passed inline attachment tests 1, 3 and 4. Image-only test 2 failed: the stored
vision report correctly described a brown-haired character in a wedding dress by a
stone church with petals, but the chat reply described the prior controller/game image.
The earlier gaming-image reply also falsely identified the character as Aishi and
invented “our game.” Self-recognition is still unverified; filename influence is possible,
not established as the sole cause.

Fresh attached-image requests now send only the latest user image turn, omitting earlier
image/chat guesses. App context keeps identity/current mood/clock but omits unrelated
work, goals, memory and narrative evidence. Filenames remain in stored UI metadata but
are excluded from model image context. A final grounding instruction prioritizes current
description and forbids unconfirmed person/self identity or shared-game claims. Both
initial and corrective requests use this focus. Normal text follow-ups retain history;
cross-image comparisons are not a verified feature of this focused path.

Validation: production build and 134 frontend tests passed (two live-model tests skipped).
Regression uses the gaming→wedding sequence and checks the old scene/filename are absent
without changing stored history. Native code unchanged. User reported manual re-test #2
passed: image-only wedding submission now describes brown hair, purple bow, white lace
dress, pink blossoms and arched windows. A subsequent image-only submission describes
a character beside a robot in a futuristic workshop rather than carrying over the wedding
scene. All four inline-attachment checks are now user-passed. Fine detail interpretation
(such as decorative versus anatomical cat ears) remains a tuning limitation.
Pixel retention is future work, not added here;
current restart retention remains question/description only.

## 2026-10-09 — Establish the historical record

### Local image understanding foundation

Inline attachment follow-up: user authorized moving image entry into chat after the panel
flow passed. Added Attach image/preview/remove alongside the composer. Sending invokes
saved vision configuration, verifies capability, starts a separate server when needed,
then passes bounded report metadata into the existing chat request. Original question
remains visible; description is collapsible and retained in chat/archive/backup/export.
History payload includes report text as uncertain source evidence, never image pixels.
Cancellation/failure keeps the attachment and draft; no chat turn is added before successful
inspection. Image-only submissions get a default question. The pipeline has a four-minute
timeout, uses normal generation lock, and stops only its own vision process in finally.
Existing external servers remain untouched. Normal chat still drives voice/lipsync.

User noted the earlier report confused headset cat-ear decoration with anatomical ears;
added a grounding reminder without claiming this fully fixes model inference. No confirmed
self-recognition/reference matching yet. Frontend tests cover history/archive/backup/export
roundtrip and rejecting pixel fields, existing-server adoption, wrong-port rejection and
owned cleanup on cancellation. Production build and 133 frontend tests passed (two live
checks skipped); native commands unchanged from the 45-test validated vision foundation.
Manual pending: attach/question/Send with automatic vision startup; image-only Send;
Stop during startup/inference and retry; restart with retained description and no pixels.

User chose to preserve Qwen3 chat and use a separate vision model. Read-only inspection
found the chat server reports vision false, RTX 5070 Laptop 8 GB with about 3 GB free,
and an installed Qwen3-VL-8B Q4_K_M plus matching F16 projector. Implemented More → Images
with independent hidden llama-server ownership, port 8081, CPU/default projector offload
disabled, local PNG/JPEG decoding/downsize, transient preview, capability check and image
inference. Discussion explicitly shares uncertain description text with normal chat; it
does not imply direct vision in the chat model or picture-based identity/authorship.
Owned server stops on close/exit; existing external servers are disconnected only. Opening
the panel pauses initiative and automatic journal generation. Settings persist in the
new generic app_state key mana.vision.v1 and backups; old backups default empty setup.

Live smoke: scripts/vision-smoke.py launched a separate owned CPU server on port 18081
with the installed pair, verified vision capability, then sent a generated red/blue test
image. Reply: “Two vertical rectangles side by side: left is red, right is blue.” Passed;
smoke server was terminated/reaped and chat server remained unchanged. No downloads or
changes to user's app settings/chat. Runtime log is ignored by Git.

Validation: production build, 130 frontend tests (two live-model checks skipped) and
45 Rust tests passed. Tests cover inline
image payload/capability gating, configuration/old backups, bounds and local resizing.
User reported manual checks 1–4 passed: detected pair startup, real PNG inspection,
review/Discuss with Mana, and restart with retained setup and cleared image. Shared
description and conversation correctly remained in saved chat. Screenshots show a
detailed character/outfit description of Mana Full.png and the subsequent spoken chat
reply. That reply calls the character “me”; this is an identity inference from textual
context (including the filename), not verified visual self-recognition. Reference-based
recognition/provenance remains open. User expressed interest in future inline chat
attachments. Cancel/close during loading or inference remains a separate manual check;
CPU inference may be slow and detailed OCR remains unverified.
Sources: official llama.cpp server and multimodal documentation (GET /props, image_url,
--mmproj and --no-mmproj-offload).

### Manual read-aloud foundation

Speed/volume follow-up: added integer-bounded rate (-10..10) and volume (0..100) to
`mana.speech.v1`, passed as JSON into System.Speech before playback. Defaults preserve
existing behavior (rate 0, volume 100). Old backups missing these two fields are upgraded
with defaults without changing voice/automatic settings; explicitly invalid values still
reject restore. Both manual and automatic playback use the preferences captured at start;
edits apply to the next playback. Volume 0 mutes speech without changing system volume.
Native viseme timing naturally follows speech rate. Voice controls now use a responsive
grid and checkbox-specific styling to avoid the generic chat search input's large width.

Validation: 127 frontend tests passed (two live checks skipped), 44 Rust tests passed,
production build passed. Added preference roundtrip/old-backup/range checks and native
control rejection; WAV+viseme smoke test uses rate +2 and volume 40. User reported
manual checks 1–4 passed: normal/slower/faster playback, volume 100/30/0, lipsync/Stop,
and restart retention with automatic playback using saved controls. User also tried
speed +10. Screenshot shows Zira Desktop, automatic playback enabled, normal speed
and volume 100%. Backup restore with these controls remains a separate manual check.
Sources: Microsoft SpeechSynthesizer Rate and Volume properties.

Lipsync follow-up: the hidden speech helper attaches a C# VisemeReached handler and
writes bounded numeric timing events on stdout. A Rust reader forwards events with a
playback ID to the frontend. Current playback alone controls five existing vowel images;
silence and completion reset the mouth, and Stop invalidates the ID immediately. Older
events and stale status checks cannot move/reset a newer playback. With a usable Windows
voice, ordinary chat streaming no longer drives the text-timed mouth; Test/browser fallback
keep the original preview behavior. Existing artwork limits articulation, and native helper
startup/device buffering can affect perceived timing. No audio upload or new saved data.

Validation: native WAV synthesis test also verifies nonzero viseme events; all 43 Rust
tests and 127 frontend tests pass (two live-model tests skipped). Production build passed.
User reported manual lipsync checks 1–4 passed: Speak on an existing reply animates
the mouth, automatic playback animates a new reply, Stop voice restores the resting
mouth, and Speak works with the model off. Restart without replaying mouth motion
remains a separate manual check. Source: Microsoft System.Speech VisemeReached docs.

Follow-up: added validated `mana.speech.v1` preferences to SQLite and backups; older
backups default automatic playback off. Voice selection is preserved even if unavailable,
with an explicit notice rather than substitution. Opt-in automatic playback observes new
assistant IDs, waits for generation to complete, cleans reply text and consumes each once.
Loaded history, failed/interrupted replies and occupied/unavailable playback are skipped;
no delayed queue. Turning the option off stops playback. Frontend checks cover preference
roundtrip, old backup defaults, streaming completion, replay prevention and skipped replies.
126 frontend tests passed (two live-model checks skipped), production build and 43
Rust tests passed. User reported manual follow-up steps 1–4 passed: selected Zira and
enabled automatic playback, heard a new completed reply, stopped voice playback, and
restarted with both settings retained and no old-chat replay. Screenshot shows Microsoft
Zira Desktop selected and automatic read-aloud checked. Backup restore and unavailable
saved-voice handling remain separate manual checks.

Implemented Windows System.Speech through a hidden, owned PowerShell process. Text
and voice are JSON on UTF-8 stdin, never interpolated into executable script. Speak
uses cleaned completed assistant text; errors/debug attempts are excluded. Voice
enumeration is independent of llama-server. Stop kills/reaps the helper; app exit does
the same. Browser preview reports desktop-only availability. Kept selection session-only
for the original slice; the follow-up above adds saved preferences and automatic playback.

Installed voices enumerated (David/Zira Desktop and David/Mark/Zira); local WAV synthesis
smoke check passed. Frontend: 124 passed, two live tests skipped. Production build passed.
All 42 Rust tests passed, including Unicode JSON-to-WAV synthesis and owned helper
cancellation. User reported manual steps 1–3 passed: voice selection, audible Speak
and Stop voice. Screenshot shows Microsoft Zira Desktop selected; the desktop app
lists David Desktop and Zira Desktop (voice availability can differ by process).
Model-off playback, every available voice and app-exit cleanup remain separate manual
checks. At that stage avatar lipsync was still text-timed; the follow-up above connects
native speech timing to the mouth.

### Skill practice foundation

Manual follow-up passed model-off save (one coding record/stage 1), restart retention
and duplicate rejection on the same v21 work source under coding. Corrected “1 records”
to singular in counts/milestones. Deletion/recalculation and live count recall remain
separate manual checks; no new behavioral tests are needed for this text-only fix.

User selected skills as the next V1.x item. Implemented explicit practice confirmation
from saved work or activities with user contributions, categorized coding/writing/
creativity. Kept practice-count stages separate from the legacy wardrobe coding
stat: draft generation is not executed work or demonstrated competence. One source
can count once per area, with a snapshot surviving source deletion. Milestones are
derived from counts and reversible on deletion. Added native storage key, backward
compatible backup default/count preview and count-only ordinary-chat context.
No automatic grants, model generation or personality/relationship changes. Manual
checks still needed: model-off save, duplicate rejection, reopen persistence and deletion.

Validation: 124 frontend tests passed, two live-model tests skipped, 40 Rust tests
passed, and production build passed. Tests cover deduplication, reversible count
milestones, source snapshots and old-backup defaults without coding-stat changes.

### Direct interpretation revisions and scope correction

The user requested direct editing and challenged the premature suggestion of moving
to V2. Added Edit as revision, independent of model availability, with the same
review editor and preserved source snapshots. A new version links to its parent and
does not inherit reply approval. Saving rejects empty/unchanged drafts, missing parents
and full capacity. Original versions remain untouched; opening a draft does not persist
anything. Editor focus/scroll brings the draft into view. Save/delete/approval use a
storage/editability guard separate from model readiness. Both generated and manual
revision saves require changed wording. Current work remains V1.x; voice, skills,
multimodality and runnable work are still unfinished. Automated checks below verify
revision invariants; model-off editor behavior still needs manual review.

Validation: 123 frontend tests passed, two live-model tests skipped, production build
passed. Rust tests were not rerun because this change has no native storage changes.

Documentation follow-up: updated the current repository to
[Aishi-mana/ManaAI-CV-2](https://github.com/Aishi-mana/ManaAI-CV-2.git). Extracted
the existing roadmap/checklist into ROADMAP.md without resetting progress. Created
PROJECT_STRUCTURE.md from inspected source layout, moving the avatar-layout section
there. ManaAI.md retains vision/design/implementation detail and links to both guides.
README and changelog navigation now use the new locations. This was documentation
work; Git remotes were not changed. Verified local link targets and section extraction;
application tests were not rerun for document-only changes.

Created CHANGELOG.md for user-facing changes and this file for engineering decisions,
manual findings, validation and deferred work. Git currently contains four early
2026-10-08 commits; substantial later development remains uncommitted. A working-tree
feature entry does not mean a release was shipped or a commit was created.

## 2026-10-09 — Legacy Python cross-check

Read the legacy manifest, Living Mana vision and roadmap in `C:/AI/ManaAI/docs`.
Recorded the mapping in [Legacy-comparison.md](Legacy-comparison.md). Legacy
completion labels were not verified by auditing Python runtime/code.

The current app covers much of the companion foundation and has explicit reviewed
preservation flows. The legacy vision adds a richer experience → memory → reflection
→ meaning → identity → behavior thread, plus a persistent home and social world.
Legacy v3.3/v3.7 labels are independent of this project's V1/V2/V3 scopes. Kept V1
foundation completion scoped to the current roadmap; added continuity work to V1.x.
Legacy files/data remained untouched.

## 2026-10-09 — Event history, episodic memories and timeline

Built recorded events from changes in saved application records. Mounted existing
state is the baseline, so opening the app does not invent past events. Unchanged
saves/deletions do not become achievements. Snapshot outcomes distinguish reviewed
drafts, deterministic previews, user-recorded completion and simulated reflections.

Added reviewed episodic notes/special moments with source snapshots, tags, limits
and relevant ordinary-chat recall. Kept them separate from fact memories to preserve
provenance without retrofitting the relational memory schema. Source/history deletion
does not remove a separately saved snapshot; users can delete notes explicitly.

Timeline merges one event with its reviewed note. Original event time and note-save
time stay distinct. Date grouping uses the configured journal timezone. Current bond
and affection are displayed as fictional current stats; no historical curve is invented.

Manual screenshots showed a saved thought, v21 design draft and v21 preview win
(23 turns), then an episodic note tagged json and a special moment tagged game.
Timeline special-moment filtering and thought search returned the expected rows.
One recall example retrieved the 23-turn win, but also blurred draft Fireball data
with preview capability. Recorded this as grounding risk, not proof of all factual recall.

## 2026-10-09 — Themes, lessons and proposed beliefs

Added model drafts from selected reviewed moments with editable review, explicit
save, evidence snapshots and revision history. Revisions preserve earlier versions;
source deletion does not break the saved evidence. Stop/failure/discard/close does not
save a generated interpretation. Shared model lock prevents conflicting generation.

First live lesson inferred preferences, strategic pacing and JSON comfort from one
preview result. Tuned toward practical lessons and topic-based themes. Second version
still overstated verification of JSON transitions and preserving outcomes. Added
recorded-result → proposed comparison/check → untested-scope guidance.

Belief interpretations propose a modest working outlook with evidence and limits,
not established traits, another person's feelings or relationship stages. A manual
example based on a saved simulated thought remained tentative and acknowledged
that one event did not establish a reflective pattern. This example passed review.

## 2026-10-09 — Explicit narrative reply approval and context debugging

Added per-version approval, disabled by default and not inherited by revisions.
Ordinary chat selects up to two relevant enabled versions. An enabled descendant
supersedes linked ancestors; missing deleted links limit lineage resolution. Approval
survives backup/restore. No automatic identity, mood or relationship-stat update occurs.

Live requests initially exceeded the local 8,192-token capacity (8,817 and 8,902 tokens).
Found current context duplicated in the system and latest user message; removed the
duplicate. Added bounded retries for explicit context-overflow errors by dropping
older request history only. Current evidence stays intact and saved chat is untouched.

Subsequent replies still substituted damage details for the lesson. Read-only SQLite
inspection confirmed Lesson v3 was enabled while older versions and the belief were
not. A reconstruction using saved state confirmed lesson selection and guidance, but
also showed two prior damage-focused answers, 4,566 characters of work context and
a final Detailed-style reminder encouraging values/examples. This was a reconstructed
request, not an exact captured historical wire payload; causation remained an inference.

Implemented a focused route for relevant approved lesson/revision questions: latest
user request instead of older conversation, no generic work excerpts or duplicate
episodic context, and task-specific guidance after general style rules. Ordinary
questions retain normal context. A saved v3 phrase about ensuring consistency still
encouraged an unchanged-result interpretation. The user reviewed and saved v4:

> The recorded battle preview ended in a win after 23 turns. We can compare future
> revisions' outcomes and battle logs to understand what changed; the turn count may
> legitimately differ. This result alone does not establish balance, and full-game
> behavior remains untested.

With v4 enabled and v3 disabled, the live reply mentioned changed outcomes and the
preview's limited scope. It still said outcomes/turn counts could reveal whether moves
were balanced. Approval/retrieval looks correct in this example; response grounding
is a partial pass. User agreed to defer this wording issue rather than continue tuning.

## Verification checkpoints

These are historical test results, not tests rerun when this log was created.

| Checkpoint | Frontend passed | Live-model tests skipped | Rust passed | Production build |
| --- | ---: | ---: | ---: | --- |
| Recorded events | 112 | 2 | 37 | Passed |
| Episodic memories | 113 | 2 | 38 | Passed |
| Timeline | 114 | 2 | Not rerun for this frontend change | Passed |
| Themes/lessons | 115 | 2 | 39 | Passed |
| Lesson prompt tuning | 116 | 2 | Not rerun | Passed |
| Belief interpretations | 117 | 2 | Not rerun | Passed |
| Approved narrative context | 118 | 2 | Not rerun | Passed |
| Context-overflow recovery | 120 | 2 | Not rerun | Passed |
| Lesson application guidance | 121 | 2 | Not rerun | Passed |
| Focused lesson requests | 122 | 2 | Not rerun | Passed |

Tests cover persistence/backup compatibility, source preservation, approval/relevance,
revision handling, timezone grouping and overflow recovery. Passing prompt assembly
tests does not prove live model adherence. Screenshots establish only the behaviors
actually visible; reload/restore/capacity behaviors need their own checks.

## Earlier development — dates not independently established here

Current docs record SQLite migration/recovery, identity/fact memory, decay/reinforcement,
state and fictional relationship stats, reflections/daily journals, opt-in initiative,
waiting/time/pause context, reviewed follow-ups, goals/interests, versioned work and
deterministic battle reports, shared activities, backup/safety recovery, archives,
exports, wardrobe looks, More navigation, personality controls and manual thoughts.

The user reviewed export examples across conversations, diary, all three activity
types, work and playtests, and tested More-menu Escape dismissal. Personality Brief
and Detailed examples eventually passed selected manual checks. These observations
are available in session history; this backfill does not reconstruct all intervening
code edits or certify every feature's complete test matrix.

## Deferred work and next checks

- Narrative grounding: outcomes/turn counts support investigating balance, not proving
  it. Check other topics and enabled belief/theme replies, not only repeated preview prompts.
- Personality: Detailed examples, low-playfulness consistency and mood/profile interaction.
- Activities: shared-story continuation can linger; challenge feedback can offer too many ideas.
- Reliability: long-session stability, exact request observability and proactive token budgeting.
- Product roadmap: skills/voice/multimodality, safer runnable work, meaningful V2 home,
  broader bounded routines and eventual Manaverse. No autonomous identity evolution promised.

## Future entry format

For each meaningful development session, add a verified date and record:

- Request/problem and resulting behavior.
- Decision and why it fits the current scope.
- Relevant files or feature area.
- Automated checks actually run; skipped checks and manual evidence separately.
- Remaining limitations and next action.

Keep CHANGELOG.md concise and user-facing. Update README.md and ManaAI.md when
behavior/scope changes. Preserve old findings when resolved, adding the resolution
instead of silently rewriting a historical failure into a pass.
# 2026-10-10 — Runtime reference profiles

Connected approved recordings with matching editable transcript drafts. Copied the three style WAVs unchanged into project data and recorded source hashes. Added legacy backup schema expansion, enum validation and independent language arguments through the native request. Production build, 152 frontend checks and 55 Rust checks passed; two optional live checks skipped. Japanese synthesis revealed a missing fastText language model; downloaded the official model and verified its expected MD5. All four Japanese-reference/English-reply synthesis checks then produced non-silent WAVs. Generated delivery quality still needs the user's listening check.
# 2026-10-11 — Musical moments

Rendered three original synthetic humming/open-vowel guides through the installed Seed-VC pipeline with approved Mana reference recordings and quiet additive acoustic backing. Verified non-silent WAVs with no detected clipping. Added shared custom-audio playback and late-load cancellation, saved musical settings inside initiative state, backward-compatible backups, idle/quiet-hours/pause/mute guards and direct typed requests. Production build and 160 frontend tests passed; two optional live tests skipped. Generated voice identity and musical naturalness still require user listening approval. No singing model was trained.

## 2026-10-11 — Excerpt handoff feedback

User passed check 1 only; remaining excerpt checks are pending. A 38-second input was correctly rejected by native validation, but the error was below the controls and the approval path still pointed to the full cover. Added local visible validation/status, cleared the full-cover default and failed-attempt audition, and automatically opened approval after successful extraction.

## 2026-10-11 — Edit pool titles and aliases

User passed all excerpt checks. Added a pencil-icon editor with Save/Cancel and cross-song name collision checks, preserving clip files and enabled state. Clarified excerpt duration labeling.

## 2026-10-11 — Mix balance and WAV export

Finished projects offer Mix balance & export below the player. Vocal/instrument gains preview existing aligned stems without conversion, with shared peak reduction to avoid clipping. Save new mix creates a separate library entry and retains gains in metadata; existing audio and pool clips are preserved. Export copies the saved selected mix/vocal/instrument version to a new WAV filename chosen in the save dialog; existing destinations are rejected. Audio stays external to JSON backups. Mixing needs both saved stems and uses browser decoding, so large songs can take memory/time. Pool metadata editing passed user acceptance.

Manual checks: (1) preview vocal-only and quieter backing, (2) save a new mix and check original and new version after restart, (3) export mix/vocal/instruments and listen externally, (4) cancel export or choose an existing file and check it stays unchanged.

## 2026-10-11 — Mix and export accepted

User confirmed all four mix/export acceptance tests passed. New arrangements and original song generation remain future work; existing singing distortion/trembling remains deferred.

## 2026-10-11 — Arrangement audition prototype

Mix/export manual tests 1–4 passed. Prepared a 12-second excerpt at 15 seconds from the saved Whereabout cover for piano and plucked-guitar backing auditions. The offline script estimates triads/beat timing from the saved instrumental and synthesizes instruments; it is not a learned full arrangement or an exact transcription. Mana vocal remains the existing saved conversion. Candidates stay outside the approved pool and library until listening review. Arrangement controls are not yet enabled.

## 2026-10-11 — Piano arrangement controls

User accepted the piano/guitar audition and preferred piano. Finished covers now offer New accompaniment with Piano and Gentle piano, start and 1–60 second duration. Uses the original saved instrument stem to estimate triads and beats, synthesizes piano and combines the existing cropped Mana vocal; no new voice conversion. Gentle piano uses fewer notes, softer filtering and lower backing level. Output is a separate library project with vocal, instrument and mix WAVs, compatible with mixing/export and explicit short-pool review. Existing owned job progress/Stop/cancellation and interrupted-project recovery apply. Original covers and approved pool audio are preserved. Jazz/rock and full-length arrangements are future work; chord estimation is approximate.

Manual acceptance: (1) restart, select a separated cover and render Piano at start 15/duration 12; (2) render Gentle piano and compare; (3) test Stop and invalid/out-of-song selections; (4) restart and check saved arrangements, export or review a short pool clip.

## 2026-10-12 — Arrangement range validation

User confirmed Piano and Gentle piano sound distinct and work. Fixed out-of-range attempts creating failed library entries: validate start/duration against known project length and both actual WAV stem durations before adding a project or launching Python. Show a role-alert message directly under Make arrangement. Native launch rechecks the range before creating its output folder. Existing failed entries remain removable manually. Stop/persistence/export acceptance is not inferred from this feedback.

## 2026-10-12 — Piano arrangements accepted

User confirmed arrangement acceptance tests 1–4 passed after the range-validation fix: Piano/Gentle piano rendering, invalid-range rejection and Stop, saved projects across restart and export/chat-pool workflow. Jazz and rock auditions remain pending; existing high-note distortion and trembling remain deferred.

## 2026-10-12 — Jazz and rock listening auditions

Prepared matching 12-second comparison clips using the saved vocal and prior chord/beat estimates. Jazz adds seventh piano voicings, chord-tone bass and light synthesized percussion; rock adds synthesized distorted power chords, bass and stronger percussion. Vocal timing is unchanged; no swing or new voice conversion. Duration/peak assertions passed. Files remain unapproved audition candidates outside the pool and library; style controls await listening review.

## 2026-10-12 — Sax and electric-guitar candidates

User liked jazz/rock drafts but expected sax and electric guitar. Prepared revised unapproved auditions with a synthetic reed/formant sax lead and plucked-string distortion/cabinet guitar model on the same 12-second comparison. These are synthesized approximations, not recorded instrument samples. Existing vocal and approved arrangements remain unchanged. Await listening feedback before UI integration.

## 2026-10-12 — Jazz and Rock controls

User approved revised sax-led Jazz and electric-guitar Rock auditions. Both styles now appear in New accompaniment beside Piano/Gentle piano. Production rendering uses the approved synthetic reed/formant sax and plucked-string amp/cabinet guitar model with bass/percussion, preserving saved vocal timing. Existing 1–60 second preflight, owned Stop/job lifecycle, separate library save, stems, mix/export and explicit pool approval apply. Arrangement helper is bundled with the desktop app. Manual checks pending: render both styles, reject invalid ranges without adding entries, Stop, and verify restart/export/pool review.

## 2026-10-12 — Arrangement preview and recognition limitation

User passed Jazz/Rock controls but reported an unrecognizable arrangement on Reach Out to the Truth. Current chord/beat estimates omit signature riffs and instrumental melody; recognizability is unresolved. Added Preview arrangement with no library entry, playback and Save this preview (exact files, no rerender). Unsaved preview files remain on disk but are excluded from discovery; preview approval does not add to chat pool. Saved preview metadata uses existing backups. Range validation and Stop apply. Manual checks: preview without song-count change, pause and save the exact preview, invalid-range/Stop, restart and check saved playback. Melody/riff-preserving rendering remains future work.

## 2026-10-12 — Recognition auditions

Preview passed user acceptance. Prepared 12-second Reach Out to the Truth comparisons using its saved vocal: original-backing reference, current rock, estimated prominent instrumental pitch line resynthesized as guitar, and hybrid retaining part of the original backing. Hybrid deliberately retains exact source riffs; it is not complete instrument replacement. Polyphonic melody estimates remain approximate. Duration/peak checks passed; recognizability awaits listening feedback. No production renderer or approved audio replaced.

## 2026-10-12 — Isolated guitar transcription experiment

Ran htdemucs_6s guitar separation and Basic Pitch 0.4.0 ONNX transcription on a 12-second saved Reach Out to the Truth instrumental. Transcription dependencies installed with --no-deps in separate data/transcription-packages; production music runtime not modified. Saved guitar MIDI/note events, original guitar reference, transcribed guitar check and sax replacement. Sax line thins polyphonic events to one voice; original non-guitar instruments are retained, making this an instrument-swap experiment rather than full jazz rearrangement. Listening review pending; no production UI or approved audio replaced.

## 2026-10-12 — Refined sax performance audition

User found isolated-guitar MIDI substitution recognizable but poorly played. Added an offline continuity-based melodic voice selection candidate, replacing first-arriving-note thinning. The candidate retains 18 sustained notes, uses a fixed octave shift into sax register, softer synthetic reed spectrum, smoother attack/release and delayed subtle vibrato. It does not use sampled sax, manually corrected transcription, or beat quantization. Fewer notes may lose riff detail; listening comparison is pending. Original non-guitar backing and Mana vocal stay in the mix. Duration/finite-sample/peak checks passed. Production styles remain unchanged.

## 2026-10-12 — Sample-based sax audition

Downloaded the FluidR3_GM alto-sax note bank from gleitz/midi-js-soundfonts into project data; recorded CC BY 3.0 source/attribution beside assets and exported auditions. Parsed embedded sample data without executing remote JavaScript. Compared prior 18-note melody through sample playback with a 22-note candidate using finer timing and isolated-guitar fundamental support. Both 12-second mixes retain Mana vocal and non-guitar backing; finite/duration/peak checks passed. No claim of corrected ground-truth transcription; listening approval pending. Production styles unchanged.

## 2026-10-12 — Instrument parts review

Added Instrument parts tab. Original combined accompaniment is usable immediately with Mana vocal; Prepare instrument parts creates a separate 1–60 second review project using six-stem Demucs. Estimated guitar/piano/bass/drums and residual Other/mixed rows offer playback, gain and mute. Their sum retains the saved accompaniment (residual includes unassigned/leaked material). Style recommendations sit beside Keep original replacement selectors; unapproved substitutions are disabled. Preview/save mixes use aligned stems and clipping protection; safe stem metadata persists with existing project backups. Original exports/pool clips remain intact. Manual checks: combined original mix; prepare and audition parts; mute/gain preview/save; restart/export and invalid range/Stop.

## 2026-10-12 — Checked-part preview and review refresh

User passed stem-review checks and noted piano-like material in Other; labels remain separator estimates, not instrument identification. Changed instrument mute checkboxes to Include in mix, added vocal inclusion, Preview checked and Preview all (all parts/vocal at current levels). Save uses checked parts and preserves selections via muted metadata. Review state now synchronizes on project readiness/media/settings changes, fixing stale rows when a project becomes ready or a saved mix is selected without switching tabs. Manual check pending for checked/all preview and immediate saved review refresh.

## 2026-10-12 — Experimental guitar-to-sax preview

Checked/all preview and review refresh passed user acceptance. Prepared projects now offer Guitar replacement → Sax (experimental). Preview transcribes the isolated guitar with project-local Basic Pitch ONNX, selects a continuous line, then renders attributed FluidR3_GM alto-sax samples. Original remaining stems and cropped Mana vocal are retained. This is a timbre-swap experiment, not a full jazz arrangement; uneven transcription remains unresolved. Current review checkbox/gain edits are separate from replacement preview. Save replacement preview retains exact files without regeneration; preview-only jobs do not appear in discovery. Native validates all input stem paths/durations before launch. Output carries instrument attribution. Requires existing data/transcription-packages and data/instrument-samples assets; no runtime install/download from UI. Production smoke verified 12s, safe peaks and unchanged non-guitar stems. Manual checks: preview/no new entry, Stop, save/restart/remaining stem playback, original selection still works.

## 2026-10-12 — Bundled replacement data-path fix

Desktop replacement failed with missing basic_pitch despite installed project-local dependencies. Python derived data paths from its script location, which changes when bundled. Native arrangement requests now pass explicit project data_root; replacement and separation cache lookup use it. Missing setup errors identify the actual folder. Regression copied scripts into a relocated resources directory and rendered a 12-second sax mix using the project data folder successfully; 59 native tests passed. Desktop replacement acceptance remains pending.

## 2026-10-12 — Solo replacement audition

User confirmed bundled dependency fix but expected isolated sax when previewing replacement. Preview sax only now loads the generated sax stem; Preview replacement mix separately loads the complete mix. Cached preview files are reused, with no regeneration or added library entry. Fixed explicit stem playback being intercepted by an existing arrangement preview. Saving still keeps the complete replacement project. Manual solo/full listening acceptance pending.

## 2026-10-12 — Unified replacement dropdown previews

User requested dropdown-driven playback instead of extra replacement buttons. Guitar → Sax now feeds row Preview, Preview checked, Preview all and Save mix. The first audible sax use generates/cache-resolves the replacement without adding a library entry; subsequent previews reuse it. Keep original returns to the original guitar path. Checked-part exclusions and current gains apply; Preview all includes all dropdown-selected parts. Removed separate sax/full/save-replacement controls. Save mix retains selected sax stem metadata alongside the complete mix, while the original project stays intact. Transcription quality remains experimental. Manual check: dropdown toggle changes checked/all/solo preview, excluded guitar does not play, saved mix/restart uses sax, Stop suppresses late playback.


### Guitar replacement options — 2026-10-12

Added sampled Piano and clean Electric guitar alongside Sax in the guitar replacement dropdown. All use the shared row Preview, Preview checked/all, and Save mix controls. The existing guitar melody transcription is retained; piano and electric guitar retain its register, while sax keeps its existing octave placement. These are experimental melody replacements, not full chord/strumming reconstruction. Existing vocal and other stems remain unchanged. Guitar-to-piano has a separate replacement-piano label and file to preserve an existing piano stem. Replacement paths and labels survive library backup validation. FluidR3_GM note-bank attribution is included with exports.

Validation: production build; frontend tests; 59 native tests; five-second real piano and electric-guitar renders with finite, audible, peak-bounded audio and unchanged other stems.

Manual checks after restarting Mana: choose Piano then row Preview; choose Electric guitar then Preview checked/all; Keep original returns to guitar; Save mix and reopen confirm the chosen replacement and original piano part remain.


### Replacement phrasing refinement — 2026-10-12

Refined Sax, Piano and Electric guitar playback: instrument-specific attacks/releases, ringing piano/guitar tails, softer sax phrase starts and shorter connected attacks, and crossfaded sax sustain extension when a note outlasts its sample. Conservatively repairs short low-confidence pitch detours surrounded by the same note, while retaining strong short notes and real rests. No rhythmic grid quantization or random timing changes. MIDI now exports the performed melody and register rather than the raw polyphonic transcription.

Generated matched-level 12-second before/after solo and full-mix auditions in exports/singing/phrasing-comparison. Real section retained 20 notes in both versions; improvements here concern articulation, not proven pitch-detection accuracy. Regression checks cover weak versus strong detours, preserved rests, release tails, finite exact-length audio and unchanged other stems. Listening approval remains pending. Existing saved mixes are unchanged; restart Mana to use the updated bundled renderer for new previews. Single-line transcription still cannot reconstruct full original guitar chord/strumming performance.


### Source-supported gap repair and guitar tone audition — 2026-10-12

Short detected rests (25–240 ms) now extend the preceding note only when its frequency band and RMS remain supported inside the gap relative to the source note's ending. Does not quantize note onsets or fill long rests. Sustained-tone/silent-gap/long-rest regression checks passed. The 12-second Reach Out comparison bridged eight source-supported gaps; this does not establish correctness of all transcription notes.

Generated matched-level solo and full-mix comparisons in exports/singing/gap-tone-comparison, including clean versus sampled distorted electric guitar. Distorted guitar is audition-only via the renderer tone argument; the UI/default clean guitar is unchanged pending listening approval. Existing saved mixes remain unchanged. Source: FluidR3_GM distortion_guitar-mp3.js, same CC BY 3.0 attribution as other banks.


### Live HQ Natural V3.0 single-bank audition — 2026-10-12

User supplied data/instrument-samples/LiveHQNatural/Live HQ Natural SoundFont GM.sf2 (945,937,616 bytes). README and embedded metadata identify V3.0, UnderxPipe1985, engineering credit Pipe Nacho, and source Musical Artifacts artifact 1176. User reports CC BY 4.0 from listing; README/embedded metadata have no explicit license. Retained attribution, copyright, source, license provenance and audition modifications; underlying keyboard/Zenology sample permissions not independently verified.

Installed official portable FluidSynth 2.6.1 Windows x64 runtime under data/fluidsynth/runtime for local auditions, without changing the production instrument renderer. Parsed 186 presets. Successfully rendered matched-level 12-second Concert Grand (GM 0), Alto Sax (65), Strat Clean Guitar (27), and Distortion Guitar (30), zero-based program numbers. All four use the same gap-repaired transcription and no added chorus/reverb for fair tone comparison. Solo/full mix files and bank-info.json are under exports/singing/livehq-audition. Existing source stems, app defaults and saved projects unchanged. Listening approval pending before integration.


### Live HQ trial integration and separate guitar tones — 2026-10-12

Instrument parts now offers an Instrument bank selector: Live HQ Natural (trial, initial selection) and FluidR3 (previous sounds). Guitar replacements include Sax, Piano, Clean electric guitar and Distorted electric guitar. The bank affects replacements only, never Keep original or existing chord-based New accompaniment. Row Preview, Preview checked/all and Save mix share the selection. Cache keys include bank and guitar tone to prevent stale comparison playback. Saved mixes retain actual rendered WAV paths and distinct electric-guitar-distorted labels through library/backup validation.

Live HQ uses in-process FluidSynth 2.6.1 via the portable DLL in data/fluidsynth/runtime, with no audio-device driver or detached subprocess. Owned-job Stop also terminates the renderer; soundfont and DLL are local dependencies, not embedded in the app. Missing dependencies show an error rather than silently playing another bank. Rendered replacements use bank-specific attribution files. Existing projects and pool clips remain unchanged.

Validation: production build; 59 native tests; frontend suite and metadata roundtrip test; real five-second production renders for all four Live HQ presets plus FluidR3 distorted guitar, with bounded finite audio, attribution present and unchanged other stems.

Manual checks after restarting: (1) Live HQ Piano/Sax row Preview, (2) Clean versus Distorted guitar Preview checked/all, (3) switch FluidR3/Live HQ and Keep original, (4) Save mix/reopen retains rendered tone, and Stop prevents late playback. Trial listening approval pending.


### Separate-library listening comparison — 2026-10-12

Located user's AccurateSalamander, BlackAndGreenGuitars, and nested Weresax/Weresax downloads. Installed official portable sfizz 1.2.3 Windows x64 under data/sfizz/runtime for auditions only. Rendered Accurate-Salamander recommended DAW flat piano, Weresax Sax.sfz, and Green twang guitar with identical MIDI to the Live HQ comparison. Added a driven/filtered guitar audition from the clean Karoryfer performance, not a separately recorded distorted patch.

All three SFZ jobs completed without renderer errors; audio verified finite and audible, trimmed to 12 seconds and matched to the same source guitar RMS with peak protection. Solo and original-minus-guitar replacement mixes, logs, render-info.json and instrument attribution are saved in exports/singing/separate-library-audition. Included licenses: Accurate-Salamander/Salamander CC BY 3.0; Karoryfer guitar and Weresax CC0. Production dropdown/defaults remain unchanged pending listening decision.


### Separate libraries added alongside retained banks — 2026-10-12

User approved the separate-library auditions. Added Separate libraries as the initial replacement bank choice, retaining Live HQ Natural and FluidR3 for comparison until final selection. Uses Accurate-Salamander recommended DAW flat piano, Weresax Sax.sfz and Karoryfer Green twang guitar. Distorted guitar applies the approved drive/filter processing to that guitar performance. Keep original bypasses replacements. Existing shared preview/checkbox/volume/save behavior and bank-aware cache keys apply.

Production SFZ rendering uses the local sfizz DLL in-process with offline sample streaming enabled, sample-accurate event offsets and 512-frame blocks. It does not launch a detached executable or install an audio driver. The downloaded libraries, runtimes and older bank files are all retained. Original saved projects remain unchanged; saved new mixes retain actual rendered audio paths.

Verification: build passed, 169 frontend tests passed (2 optional skipped), 59 native tests passed, all four real separate-bank production renders passed finite/audio-duration/peak checks, attribution copied and other stems unchanged. Manual checks after restart: separate-bank Piano/Sax previews; Clean/Distorted guitar; switch back to Live HQ/FluidR3 and Keep original; save/reopen and Stop.


### Melody selector comparison — 2026-10-12

Started melody fidelity work after separate-bank approval. Source analysis shows polyphonic guitar/chord candidates; independent pYIN tracking was mostly uncertain, so no pYIN corrections were forced. New selector discounts a lower octave only when a competing upper-octave candidate has sufficient detector confidence and direct spectral support, and increases pitch-transition penalties. Restored repeated pick attacks only where source onset detection and a same-pitch detector event agree. Does not quantize timing or invent notes in silent gaps.

Generated original guitar, before/after Karoryfer clean-guitar solos, and full mixes in exports/singing/melody-comparison. Current candidate has 28 articulated notes versus 20 previously; octave transition count increased from 2 to 5, so this is a listening candidate, not a verified melody correction. Synthetic checks preserve a clearly supported low note and silence while preferring a well-supported competing upper octave. Samples/voice/bank choices unchanged. Listening approval required to judge whether candidate improves melody fidelity; original implementation snapshot retained in data/arrangement_replacement_before_melody.py.

The melody candidate is retained in data/arrangement_replacement_melody_candidate.py for audition. Restored the approved production selector while listening is pending, because additional octave jumps make automatic replacement premature.


### Melody candidate v2 — 2026-10-12

User found first candidate better, requested further improvement. Kept production unchanged and refined audition module data/arrangement_replacement_melody_v2.py: raises competing upper-note confidence threshold and tracks detector event age so a fresh stronger lower pick is not overridden by an older upper sustain. Source-confirmed repeated attacks remain.

Matched 12-second Karoryfer comparison in exports/singing/melody-v2-comparison: previous candidate 28 articulated notes/5 large pitch transitions, v2 27 notes/2 large transitions. Finite audible exact-length renders and synthetic checks for fresh pick, supported upper octave, weak competing upper candidate, real low notes and silence passed. Fewer large jumps is diagnostic, not proof of correct transcription; listening approval pending. Approved production renderer and all instrument banks retained.


### Melody timing candidate v3 — 2026-10-12

Built on user-preferred v2 for another listening comparison; production remains unchanged. Aligns attacks by at most 45 ms only where source onset detection and a same-pitch detector event agree. Updates contiguous shared boundaries without reordering notes or removing real pauses. Conservative weak-detour repair requires a <=100 ms low-confidence note between matching neighbours plus weak source energy; strong short notes and rapid runs remain.

Matched 12-second Karoryfer solo/full mixes in exports/singing/melody-v3-comparison. Both baseline and v3 retain 27 notes and two large pitch transitions; seven attack times adjusted, with corresponding contiguous note lengths updated. Weak-detour filter changed none on this section. Finite audible exact-duration rendering and synthetic source-only/order/rest/fast-note/weak-versus-strong checks passed. Listening approval pending; v2 retained as baseline and all original sources/banks intact.


### Approved melody/timing pass wired into app — 2026-10-12

User requested in-app listening with all replacement instruments. Promoted data/arrangement_replacement_melody_v3.py into scripts/arrangement_replacement.py. Shared transcription now includes v2 octave competition/event freshness, source-confirmed repeated attacks and v3 bounded source alignment/conservative weak-detour filtering for Sax, Piano, Clean guitar and Distorted guitar across all banks. Existing vocal and non-replaced stems remain untouched. Preview checked/all renders the complete prepared-section mix; replacement sections retain their existing 1–60 second limit, not full-song processing. Saved old mixes remain unchanged; restart/repreview generates the updated selection.

All four Separate libraries production render checks passed: finite audible exact duration, peak bounded, attribution copied and unchanged other stems. Native tests/resource refresh passed. Manual checks: four instrument previews, full mix via Preview all, Keep original, Save mix/reopen.


### Source-supported riff tail extension — 2026-10-12

User reported hard stops compared with original riff endings. Shared replacement transcription now follows source energy at the detected pitch for up to 400 ms beyond detector note-off, bounded by the next attack and excerpt end. Ends at loss of pitch-band/RMS support rather than stretching across true silence. Applies to all replacement sounds/banks; samples and source attacks/pitches unchanged.

Matched comparison in exports/singing/riff-tail-comparison: three note tails extended, retaining 27 notes, two large pitch transitions and unchanged attacks. Added synthetic sustained-tail/silence/next-attack/input-preservation checks. Listening comparison pending; updates affect new previews/saved mixes only. Clip boundary still limits tails, so this does not add audio beyond the selected section.


### Guitar release-envelope listening candidate — 2026-10-12

User still hears hard stops after source-tail extension. Inspected Karoryfer Green twang mapping: main picked-note ampeg_release is 0.25 s. Prepared a candidate with 0.65 s main release using in-memory sfizz SFZ loading at original patch path (relative includes preserved). Release-noise and inactive feedback settings unchanged; source library files untouched. Production stays on current approved pipeline while auditioning.

Matched comparison in exports/singing/release-envelope-comparison keeps all 27 notes, note lengths/attack times and pitches identical. Finite exact-length audio and differing release waveform verified. This isolates sample release rather than further pitch edits. Fading ringing can continue into a pause, but no new picked notes or sustained holds are inserted. Selected section boundary still limits tails. Candidate is data/arrangement_replacement_release_candidate.py; listening approval pending.


### Release comparison on requested 9–19s passage — 2026-10-12

User requested the heavier 9–19-second passage rather than the earlier 12-second comparison. Located existing 19-second Reach Out prepared stems in arrangement-1791744247383209600, verified request source points to 1791717415984. Rendered full 19-second current and 0.65-second release candidate with Karoryfer distorted guitar, then cropped 9–19 seconds so ringing from preceding notes is retained. Same 48 notes/pitches/attacks in both releases. Original accompaniment with Mana vocal also supplied for comparison. Finite exact-duration audio verified; trimmed one padding frame from source stems. Files in exports/singing/release-19s-comparison; production unchanged pending listening.


### Guitar-only release pass 2 — 2026-10-12

User preferred longer release but requested the next pass without mix, focused on original 9–19s. Prepared data/arrangement_replacement_release_v2.py with 0.9-second main picked-note release and up to 30 ms held-note overlap at connected different-pitch picks. No overlap across real rests (>25 ms) or same-pitch retriggers; source pitch and attack sequence remain unchanged. No reverb, vocal or other instruments in auditions.

Guitar-only full 19-second and extracted 9–19s baseline/candidate WAVs are in exports/singing/release-solo-pass2. Both have 48 notes; 31 connected handoffs changed their end time. Verified unchanged pitches/attacks, finite exact-duration peak-bounded audio, and synthetic real-rest/same-pitch/input-preservation cases. Original separated guitar included for reference. Production remains unchanged while listening; previous 0.65-second candidate retained.


### Dry overlapping-note guitar audition — 2026-10-12

User requested polyphonic test and assessment of crossfades/fades/reverb/delay/sidechain suggestions. Kept 0.65-second picked-note release as listening baseline; no production changes. Generated original guitar, single-line baseline and overlapping-note Karoryfer distorted guitar-only 9–19s excerpts, cropping complete 19s renders. Same preset/release/gain target, no vocal/backing/reverb/delay.

Experimental polyphonic path retains raw Basic Pitch events >=90 ms and confidence >=0.4, prevents overlapping same-pitch note-offs, and caps concurrent candidates at six. 102 overlapping candidates versus 48 single-line notes. These may include harmonic/chord detection errors; retained candidates are not proven notes/physical fingering. Finite exact-duration audio and same-pitch/order/voice-count bounds checked. Files and note lists in exports/singing/polyphonic-guitar-comparison; script data/polyphonic_guitar_audition.py.

DAW suggestions assessed: small fades/crossfades help discontinuities and joins, but cannot reconstruct missing riffs. Reverb/delay can mask rests and are optional later polish, while sidechain changes the balance against backing and cannot fix a guitar-only transcription. Evaluating dry overlap first. Sources: iZotope Vocal Editing 101 and Ableton Live Audio Effect Reference. Listening approval pending.


### Direct riff-tail envelope comparison — 2026-10-12

User rejected polyphonic guitar and requested extend-then-fade on single melody. Compared original prepared guitar and matched single-line 0.65s-release output using local pre/post note RMS. Source still carries energy at multiple phrase ends while generated energy falls earlier. Generated dry audition extends only source-supported phrase gaps by continuing a captured ending-note cycle with continuous boundaries, smooth fade-in and cosine fade-out. No extra pitches, vocal/backing or reverb; artificial continuation can alter texture and requires listening review.

Treated ten endings over complete 19s, including eight in requested 9–19s passage. Each continuation ends before next source attack, within 450ms and within excerpt. Output finite, exact duration and peak-protected. Original, baseline and candidate guitar-only 19s/9–19s WAVs plus tail-report.json are in exports/singing/riff-extend-fade-comparison. Production unchanged; polyphonic and 0.9s release candidates rejected as listening defaults.


### Melody-preserving source-supported overlap audition — 2026-10-12

User identified likely original riff overlap versus generated serial handoff. Previous post-gap extrapolated fade was not helpful. Kept preferred single-line pitches/onsets and 0.65-second release, extending held notes underneath later attacks only when the source still supports the previous pitch. Bound 220ms beyond next attack, avoid real rests and same-pitch retriggers, cap at the next occurrence of the same pitch. Does not restore extra raw chord candidates or add effects.

48 original melody notes retained; 21 held endings overlapped across later attacks in the full 19s diagnostic. Guitar-only before/after 9–19s and full19s files are in exports/singing/riff-overlap-comparison; data/arrangement_replacement_riff_overlap.py is audition only. Finite exact-duration peak-protected audio, unchanged pitches/attacks, synthetic source-support/silence/rest/retrigger checks passed. Spectral support remains heuristic, not verified source fingering. Production unchanged pending listening.


### Source-supported overlap accepted as next candidate — 2026-10-12

User heard an improvement and approved the melody-preserving source-supported overlap version as the next candidate. Current listening baseline: data/arrangement_replacement_riff_overlap.py, with 0.65-second main guitar release, preferred single-line melody, and source-supported note carry beneath later attacks. Reference audio: exports/singing/riff-overlap-comparison/next-9-to-19-solo.wav. Preserve earlier candidates for comparison. Production renderer remains unchanged; candidate acceptance is recorded without implying in-app deployment or final approval of instrument reconstruction.


### Accepted overlap candidate with Mana and backing — 2026-10-12

User requested full-mix audition before app integration. Mixed accepted overlapping melody and previous baseline with identical original-minus-guitar backing at 30% and Mana vocal at 100%, then peak protected. Full 19s and cropped 9–19s WAVs stored in exports/singing/riff-overlap-fullmix, with attribution copied. Exact duration, sample-rate agreement, finite audio and peak checks passed. No new transcription or changes to sources/production renderer. Full-mix listening approval pending.


### Approved guitar overlap promoted to the app — 2026-10-12

User passed the full-mix audition. Promoted data/arrangement_replacement_riff_overlap.py to scripts/arrangement_replacement.py. Clean and distorted guitar now retain the preferred melody and attacks while source-supported endings ring beneath later attacks, bounded to 220ms and avoiding real rests and same-pitch retriggers. Separate Libraries uses the approved 0.65-second main guitar release through an in-memory SFZ adjustment; downloaded samples remain unchanged. Sax and piano retain the existing melody and timing path. All three instrument banks and previous auditions are retained.

All four Separate Libraries production replacement smoke checks passed (finite audible output, duration, peak bounds, attribution and unchanged other stems), and 59 Rust tests passed with bundled resources refreshed. Restart Mana and generate a new replacement preview to use this renderer; previously saved mixes stay unchanged. Replacement excerpts remain limited to 1–60 seconds. Reconstruction remains a candidate with heuristic source support, not exact recovery of the original performance.


### Independent melodic-part replacements — 2026-10-12

Added independent replacement dropdowns for piano, bass and Other/mixed beside guitar. Each can use sampled sax, piano, clean guitar or distorted guitar from any retained bank. Row Preview renders only that part; Preview checked/all and Save mix resolve every selected audible replacement sequentially. Cache keys include source name/path, project, target, range and bank; up to 50 generated previews are retained in memory. Saved mixes keep distinct source-row identities so two parts using the same target are not merged or dropped. Keep original bypasses reconstruction. Source selection is validated in Rust and Python, and rendering excludes exactly the selected source while keeping all other stems.

Uses the current melody reconstruction rather than full chord/instrument recovery. Other/mixed can lose chords or contain separation leakage; bass can move into the selected instrument range. Drums remain original because replacement needs rhythm/percussion detection. Existing guitar candidate and all banks retained; no further guitar tuning in this pass. Replacement previews remain 1–60 seconds.

Validation: frontend build passed; 169 frontend tests passed with two optional checks skipped; 59 Rust tests passed and bundled scripts refreshed. Real 3-second piano, bass and Other/mixed to sax jobs passed duration, finite audible output, peak bounds, source exclusion and unchanged-other-stem checks. Manual simultaneous replacement, save/reopen and listening checks remain for the user.


### Additional sampled instruments and drum-kit replacement — 2026-10-12

User passed independent melodic-part checks and requested drums plus more instruments. Added Live HQ steel and nylon acoustic guitars, finger and acoustic bass, violin, string ensemble, flute and harp to melodic replacement dropdowns. These explicitly use existing Live HQ presets regardless of the selected three-bank comparison choice; piano, sax and electric guitars retain their bank behavior. Bass-source detection permits lower notes, with fixed register placement for bass targets. No new downloads or sample-library changes.

Drums now have Keep original plus Standard, Rock/Power, Jazz, Brush and Electronic kit choices. Separate rhythm path estimates source-timed independent low/mid/high band attacks (kick/snare/closed-hat MIDI candidates) and renders the chosen bank-128 kit on percussion channel 10. It does not quantize onto a new beat grid, and retains simultaneous band candidates. This is approximate hit classification, not complete recovery of tom fills, open hats, cymbals or playing technique. Drum-kit/melodic-source mismatches are rejected in Rust and Python.

Row Preview, Preview checked/all and Save mix use the selected kit/instrument through the same sequential cache/mix flow. Keep original retains recorded drums; source-row identities and other stems remain intact. Excerpts remain 1–60 seconds. Guitar tuning is deferred per user request.

Validation: all eight added melodic presets and five drum kits rendered audible finite peak-bounded 3-second production audio with correct source exclusion, unchanged other stems and attribution. Drum kit output distinction, silence rejection, synthetic simultaneous kick/cymbal detection, and drums-first fresh-process dependency loading passed. Final frontend build and 59 Rust tests passed; frontend suite passed 169 checks with two optional checks skipped. In-app listening/save checks remain for the user.


### Synths, keyboards, harmonica and ocarina; finer extraction direction — 2026-10-12

User passed the new drum/instrument checks and requested synths, keyboards, harmonica, ocarina and more original instrument extraction. Added twelve existing Live HQ presets: Rhodes electric piano, FM electric piano, church organ, accordion, harpsichord, clavinet, harmonica, ocarina, square synth lead, saw synth lead, warm synth pad and polysynth. All work through existing per-part preview/cache/mix/save controls. No new downloads, sample edits or changes to approved drum/guitar reconstruction.

User chose strings and wind instruments as the priority for finer source extraction. Current htdemucs_6s has fixed vocal/drums/bass/other/guitar/piano outputs; additional replacement tones do not create new isolated source stems. Official Demucs documentation confirms the fixed six-source model and notes piano bleed/artifacts: https://github.com/facebookresearch/demucs . AudioSep is a candidate for text-guided musical instrument separation with CPU/CUDA and chunked inference support: https://github.com/Audio-AGI/AudioSep . It needs its own runtime/checkpoints and an audition; it is not installed or wired in this pass.

Next extraction experiment: isolate strings and selected winds on a short original-accompaniment excerpt, compare against current Other/mixed, and audition each estimate plus residual. If acceptable, add an optional finer-extraction workflow with target selection, cancellation/progress, solo previews and approval before adding estimated parts. Preserve source timing and duration; subtract accepted aligned estimates from the source residual to avoid double-counting, and retain a remainder stem so the complete unedited mix reconstructs the source. Sequential extraction from the remaining audio may reduce overlap but can accumulate errors. Label estimates honestly; do not infer definite instrument presence from a nonzero output, promise perfect separation, or automatically run it for every cover. No finer source extraction has been added yet.

Validation: all twelve presets passed real 3-second production audio checks for duration, finite audible output, peak bounds, attribution, correct source exclusion and unchanged other stems; electric piano/FM and square/saw outputs differ. Frontend build and 59 Rust tests passed, bundled scripts refreshed. Manual in-app listening remains for the user.


### Sample-source labels and additional installed SFZ variants — 2026-10-12

Replaced experimental-transcription suffixes on sax, piano, clean guitar and distorted guitar options with the actual selected bank: Weresax / Accurate-Salamander / Karoryfer when Separate Libraries is selected, or Live HQ / FluidR3 when those comparison banks are selected. Reconstruction limitations remain in the explanatory text.

Inspected installed READMEs and top-level SFZ patches. Added Weresax sxnth synthesizer and saxcordion (accordion-like sound made from sax samples), Karoryfer black-guitar and combined black/green-guitar twang patches, and Accurate-Salamander treble +2.5dB and bass +1.5dB variants. These are variations of the installed sax/guitar/grand-piano samples, not new isolated-source families. Named variants always load their stated separate library even if the comparison bank changes. Existing approved sax, piano and green-guitar defaults and downloaded files stay intact. Other guitar articulation/key-switch files and Salamander live/minimum configurations are not treated as additional instrument families.

Validation: six variants passed production renders using the same 3-second source melody, with finite audible duration/peak-bounded output, source exclusion, unchanged other stems and attribution. Each pair produced distinct audio. Frontend build and 59 Rust tests passed; bundled scripts refreshed. User listening and source-label switching checks remain.


### Strings and winds separator prototype connected — 2026-10-12

Installed official AudioSep source under data/AudioSep, retained MIT/CLAP notices, and downloaded the official AudioSep and CLAP checkpoints (about 3.6GB total), verifying both against official LFS SHA256 hashes. Additional dependencies are isolated in data/audiosep-packages. Existing music-tools PyTorch 2.7.0 CUDA 12.8 works on the RTX 5070 laptop GPU. Tokenizer/configuration files are cached in data/audiosep-model-cache; app jobs use offline cache and never upload audio. Official implementation/source: https://github.com/Audio-AGI/AudioSep .

Added scripts/fine_separator.py using upstream ResUNet30 and a strict-loaded text-only CLAP Roberta pooler/projection/normalization path. Ignores only the older checkpoint's obsolete position-ID buffer for Transformers compatibility. Five-second overlapping inference windows cover short inputs and tails. Queries are string-instrument family and wind-instrument family, applied sequentially to remaining source audio. FLOAT WAV output retains signed residual without clipping. This estimates requested sounds; audible output does not prove that an instrument is present, and leakage or musical artifacts remain possible.

Music Studio → Review instrument parts → Separate strings & winds accepts a 1–30 second excerpt and saves a separate library entry. Uses Other/mixed when prepared parts exist, otherwise original accompaniment. Adds Strings (estimated), Winds (estimated) and Other/mixed remainder; existing guitar/piano/bass/drums stay intact. Estimated parts support the same original/replacement dropdowns, solo/checked/all preview, volume/mute and save-mix flow. Repeating extraction retains prior estimates while further splitting the remaining Other part. Stem labels and levels persist through backup validation. Original covers stay intact. Standard owned singing-job cancellation and progress are reused; invalid duration is blocked before creating a project/job.

Validation: 10-second Whereabout accompaniment audition produced finite aligned strings, winds and remainder files in exports/singing/strings-winds-audition, with source reconstruction error below 1e-5. Production 3-second prepared-parts job passed seven-part alignment, exact source-part sum within 1e-5, unchanged guitar/piano/bass/drums and peak-protected mix checks. Frontend suite passed 169 checks (two optional skipped), plus the new finer-part backup/path test; 59 Rust tests and final build passed, bundled scripts refreshed. User listening, in-app extraction/replacement/save and Stop checks remain.


### Strings/winds listening failed; extraction demoted to audition — 2026-10-12

User tested Reach Out to the Truth and Whereabout of the Stars and reported quiet noise rather than recognizable strings/winds. Earlier file-integrity, alignment and exact-sum checks did not establish instrument separation quality. This supersedes the earlier prototype's listening-readiness implication. Original covers and user-saved outputs are preserved.

Checked standalone CLAP versus separator-checkpoint text projection/embedding weights: exact matches, so no observed encoder-weight mismatch. Known isolated violin/flute samples are nearly reconstructed, but that is a trivial one-source test. Specific piano/harp/violin/flute prompts on the same Whereabout excerpt return highly similar source-correlated outputs, providing no reliable instrument identity. A known simultaneous violin/flute mixture with distinct timing showed SI-SDR improvement of -0.116dB for violin and +0.102dB for flute: essentially no separation improvement for this test. Reports/audio are in exports/singing/separator-query-comparison and exports/singing/separator-mixture-check. These tests do not prove general model failure, but do not support useful strings/winds extraction in Mana yet.

Changed Music Studio finer extraction to an experimental audition. It creates preview-only outputs, provides separate strings/winds/remainder audition buttons, and requires an explicit Keep this audition in library action. It no longer automatically inserts a new library project on extraction success. Library cap checked before saving; changing the selected project or generating another preview clears the audition. Clear text warns about leakage/noise and unconfirmed instrument presence. Existing files, covers, voices, replacements and standard part separation remain available. Frontend build passed.

Next quality work must compare a more suitable separator or model on controlled mixtures plus real audible instrument sections, and obtain listening approval before treating finer source extraction as usable. Numerical file checks or louder normalization must not substitute for recognizable separated audio.

### Banquet separator candidate prepared — 2026-10-12

Prepared an offline Banquet/query-bandit audition using the official MIT source and recommended ev-pre-aug checkpoint from Zenodo record 13694558. Audio queries use our violin/flute samples; tests compare a known overlapping mixture against its true sources and audition a ten-second Whereabout accompaniment section at 80 seconds. Runner: data/banquet_audition.py; outputs: exports/singing/banquet-separator-audition. Strict checkpoint loading, official size/MD5 validation, finite aligned output and controlled SI-SDR reporting are required. Dependencies are isolated; current app behavior and saved library remain unchanged.

Official download attempts failed with gateway/time-out and certificate errors; TLS verification was retained. User is downloading the checkpoint manually and will notify when placed in data/query-bandit/checkpoints. No Banquet audio or quality result is available yet. Test and listening review must precede integration. SAM Audio was also considered, but official gated checkpoints require access not available in this session.

### Banquet verified and auditioned; quality gate not passed — 2026-10-12

User supplied the official ev-pre-aug.ckpt. Exact size and official MD5 matched; strict model loading passed, including all PaSST query-encoder weights. Local GPU inference completed for the controlled violin/flute mixture and Whereabout accompaniment at 80–90 seconds. Tested both raw tiled sample queries and trimmed/RMS-normalized queries.

Controlled SI-SDR improvement: raw violin +1.279dB; raw flute -8.045dB. Trimmed normalized queries: violin -0.859dB, flute -6.265dB. Flute outputs were nearly silent. Query preparation did not resolve the separation problem. Banquet is not ready for app integration with these references; these narrow synthetic-reference results do not establish general model failure. Real-song outputs are auditions, not confirmed instrument stems. Output report and audio: exports/singing/banquet-separator-audition. Listening copies apply level adjustment only, explicitly distinguished from raw results. Current app remains unchanged and finer extraction remains audition-only. Next investigation should use representative real instrument queries or an alternate separator before accepting strings/winds extraction.

### Recorded sax/piano controlled audition — 2026-10-12

Prepared a 10-second known mixture from recorded Weresax alto and Accurate-Salamander piano notes, retaining separate truth tracks and using separate query phrases. This is a sample-based controlled test, not a live performance or strings test. Banquet strict checkpoint loading passed. Piano SI-SDR improvement +7.376dB; sax -21.192dB with very weak output. This demonstrates useful piano selection in this case but does not support wind separation with the tested query. No app integration. Audio/report: exports/singing/banquet-recorded-samples-check; listening copies have level adjustment only. Runner: data/banquet_recorded_samples_check.py. Changed audition input resampling to scipy polyphase to avoid excessive memory consumption on recorded samples; app runtime unchanged.

### Sax-specific Demucs candidate audition — 2026-10-12

Kept Banquet piano as a separate candidate from existing Demucs piano extraction; Banquet sax remains rejected. Downloaded author Xavier Riley's MIT saxophone-specific checkpoint from https://huggingface.co/xavriley/demucs_v3_saxophone_separation . Verified SHA256 4a801bc00f0e21d476edef1d9fa25dbcb088e3bae0a4092e590167ae26dbe360. Strict loading worked with existing Demucs 4.1 runtime despite model card listing 3.0.6; outputs are Sax and BackingMono. Author notes high-register limitations. This targets sax, not all winds or strings.

Runner data/sax_demucs_audition.py produced aligned finite 10-second controlled-mixture and Whereabout 80–90 second auditions. Known recorded sax/piano mixture sax SI-SDR improvement +4.554dB, versus Banquet -21.192dB on the same mixture. Real-song extraction does not establish sax presence. Raw and level-adjusted listening files plus report saved under exports/singing/sax-demucs-audition. User listening review pending; no app or library changes.

### Real sax recording audition prepared — 2026-10-12

User had no local sax recording. Found composer Kevin MacLeod's Mystery Sax via the official Incompetech catalog (ISRC USUAN1700082), documented tenor sax/percussion/synths and actual musician performance. Downloaded the freely published MP3 from the composer site; stored CC BY 4.0 attribution and excerpt/separation changes in data/separator-test-recordings/ATTRIBUTION.md, copied beside audition outputs. No dataset access gates bypassed.

Extended sax_demucs_audition.py with validated local input/start/1–30 second arguments; invalid duration test blocks before checkpoint load. Ran 30–45 second song excerpt through verified sax-specific Demucs; finite aligned Sax and BackingMono output. Original and level-adjusted listening files in exports/singing/sax-demucs-song-audition. No ground-truth stem available for this recording, so no accuracy metric claimed. User listening pending; app/library/song pool unchanged. This follows the earlier controlled +4.554dB sax test, and does not validate broader winds or strings extraction.

### User-selected Elvis sax passage audition — 2026-10-12

Ran user-supplied Elvis Special Theme (Final Ver.) Bravely Default II OST.mp3 from 60–75 seconds through the verified sax-specific model. Finite aligned original/Sax/BackingMono files and level-adjusted listening copies saved separately in exports/singing/sax-demucs-elvis-audition, with source notes. Earlier Mystery Sax audition preserved. No accuracy claim without ground-truth stems; listening review pending. Not added to library/song pool and no license determination made. Runner now supports an explicit output directory for keeping song auditions separate.

### Whereabout matched sax/piano listening comparison — 2026-10-12

At user request, ran sax-specific Demucs and Banquet piano independently on the same original Whereabout accompaniment excerpt, 80–95 seconds. Banquet piano queried with recorded Accurate-Salamander piano phrase from the controlled check; output finite and aligned. Sax output finite and aligned. Original and separate level-adjusted auditions saved under exports/singing/whereabout-sax-piano-audition; raw outputs/reports retained. These are independent estimates, not non-overlapping stems suitable for summing. No ground-truth score or confirmed sax-presence claim. Listening review pending; no app/library changes.


### Optional sax and Banquet piano extraction connected — 2026-10-13

Music Studio → Review instrument parts → Optional instrument extraction now offers Audition sax and Audition Banquet piano for saved 1–30 second accompaniment sections. Both use the full saved accompaniment, including on a project with existing Demucs parts. Each generates an extracted part and a signed remainder that reconstruct the original accompaniment, rather than adding an overlapping estimate on top of original stems. Preview each part and Keep this audition in library to save a separate project. Existing covers/Demucs parts remain in their original projects. The saved extraction project has standard Include in mix checkboxes, volume, replacement choices, Preview checked/all and Save mix; sax-extracted and piano-banquet labels/mute/levels survive validation/backups and reviewed-mix saves.

Added bundled scripts/optional_separators.py: verified sax-specific Demucs checkpoint and strict-loaded Banquet piano checkpoint; local GPU when available, CPU fallback. Banquet uses isolated dependencies and a retained 10-second recorded piano query under data/separator-references/piano.wav. Bounded eight-second windows with overlap-add prevent large GPU allocation; output is aligned to the 24k job audio. No audio uploads or automatic model downloads. Backend rejects oversized ranges and missing model/query files before creating a job. Owned-job Stop behavior is reused. Existing strings/winds AudioSep audition remains experimental and separately available; broad winds/strings are not declared ready.

Validation: frontend build passed; existing frontend suite passed 170 checks with two optional skipped, and the new optional-extractor backup test passed. 59 Rust tests passed. Production sax and piano extraction modes on a three-second Whereabout section passed finite/aligned audio and exact extracted-plus-remainder reconstruction within 1e-6. Model hashes and strict loading verified. User in-app checks pending: audition/save sax, audition/save Banquet piano, checkbox previews/save/reopen, and invalid range/Stop.


### Unified separator menu; keyboard/trumpet research — 2026-10-13

Merged standard and optional extraction controls into one visible Separate instruments panel at the top of Review instrument parts. One Separator dropdown lists standard Demucs guitar/piano/bass/drums, alternate Banquet piano, dedicated sax Demucs, and AudioSep strings/winds explicitly experimental. Shared start/duration controls and one Audition selected separator action replace the scattered prepare/extract buttons. Standard Demucs now follows the same preview-only audition and explicit Save audition to library flow. Per-part preview buttons show all returned parts; audition title identifies which result is loaded. Original projects and mix-checkbox workflows remain unchanged. Standard limit 60 seconds; optional limit 30; existing preflight/backend validation retained.

Keyboard/trumpet research: official MVSep Mega 53 model release https://github.com/ZFTurbo/Music-Source-Separation-Training/releases/tag/v1.0.21 supports keys, digital-piano, piano, organ, synth, trumpet, brass and other families. Author recommends at least 16GB VRAM, warns individual-stem quality may be below specialized models and outputs can overlap. Laptop is 8GB, so do not declare compatibility or integration before bounded/CPU trial and listening review. The hosted newer version differs from public weights; no audio uploaded. Keyboard should be labeled by subtype rather than silently equated to acoustic piano. New targets remain next-stage auditions, not enabled menu entries.

Validation: build passed, frontend regression suite 171 passed with two optional skipped. UI checks pending: find all four choices in the one menu, audition/save standard parts, audition/save optional piano or sax, and verify duration errors/Stop and original project preservation.


### Mega-53 keyboard/trumpet candidate audition — 2026-10-13

Downloaded official MSST source and MVSep Mega-53 v1 release https://github.com/ZFTurbo/Music-Source-Separation-Training/releases/tag/v1.0.21 . Verified release SHA256: config 7e198062a251587088adb91215a4f44ab59e67bd62fcc805cf54d6e7dfc51103; checkpoint c62820893bbf86d4e734f966bd142d9157cfc8bb8e79e9d8f9ea553f3ff3519f. Checkpoint size 1368919887 bytes. Three inference dependencies isolated in data/mega-packages; existing runtimes unchanged. Strict model loading passed with official configuration; tuple tags safely converted to tuples without evaluating arbitrary YAML objects.

Runner data/mega_separator_audition.py uses upstream active_stem_ids to run only trumpet, digital-piano, keys, organ and synth outputs, four-second windows/three-second hop with overlap-add, inference/autocast float16 and batch one. RTX5070 laptop 8GB peak allocated memory about 2.858GB for this test. This validates short selected-output inference only, not official full 53-stem/long-window memory behavior.

Known four-second LiveHQ trumpet plus Rhodes/electric-piano mixture: SI-SDR improvement +17.668dB trumpet, +14.125dB digital-piano, +16.441dB keys. Organ nearly absent; synth not a correct target for this mixture. These are sample-based controls, not a live performance. Whereabout 80–90 second real accompaniment produced useful-audition-sized keys/digital-piano output and near-silent trumpet, without asserting instrument presence from amplitude. Raw/aligned finite results, truths, original, level-adjusted listening copies and report in exports/singing/mega-keyboard-trumpet-audition. Controlled test about 2.14s inference; song about .90s, excluding model loading/rendering/download. Keys/digital-piano overlap and are alternative estimates, not additive stems. Listening approval pending. No app/menu integration or audio upload.


### Keyboard, electric piano and trumpet wired — 2026-10-13

Added Keyboard / keys, Electric piano and Trumpet choices to unified Review instrument parts → Separate instruments. Uses approved Mega-53 model locally with one selected output, four-second/three-second-hop overlap-add, GPU autocast and CPU fallback. Existing verified models/dependencies remain in project data; no downloads/audio uploads during extraction. Each 1–30 second audition creates its named extracted part and a signed remainder preserving the saved accompaniment. Explicit preview/save remains required; originals kept. Saved parts support checkbox/volume, replacement instruments, preview checked/all, reviewed-mix saving and backup labels. Keyboard and electric piano are alternatives with possible overlap, explained in menu.

Backend preflight checks range and model/config presence before spawning a job. Production verifies checkpoint SHA256 and strict weights load. New labels: keyboard-extracted, electric-piano-extracted, trumpet-extracted. Bundled optional separator script refreshed via Rust build.

Validation: frontend build passed; 171 frontend checks passed with two optional skipped; 59 Rust tests passed. Extended backup test preserves new labels alongside sax/piano with muted state/levels. All three production modes on a three-second Whereabout section passed finite aligned audio and extracted-plus-remainder reconstruction within 1e-6. Listening approval was obtained on earlier Mega-53 auditions; in-app control/save checks remain: all three appear and audition, save with original retained, checkbox/volume preview then save/reopen, invalid range and Stop.


### Original-song generation stage 1 — 2026-10-13

Added Original song tab to the full-size Music Studio. Inputs: title, 1–2000 character prompt, Gentle piano/Light acoustic guitar/Jazz/Anime-inspired rock/Synth-pop, instrumental toggle, optional English lyrics up to 6000 characters, 10–180 second full duration, seed 0–2147483647. First make an approximately 15-second preview; full generation is enabled only for matching prompt/lyrics/style/instrumental/seed. Duration and title can change without invalidating the creative settings. Longer song is a newly generated rendition, not an exact extension of the preview. Actual generated duration is read from the WAV.

Reuses existing read-only C:/AI/acestep.cpp/build/Release/ace-lm.exe and ace-synth.exe plus installed GGUF models in C:/AI/Manaverse-BGM-Generator/models. No new model downloads or changes to the other projects. New bundled scripts/original_song_job.py plans caption/lyrics/audio codes then renders with base Q8 model at 50 steps. Original generated audio and request/enriched plan/seed metadata live in exports/singing/original-*; preview jobs are excluded from discovery and do not enter library automatically. Full songs persist as original projects and are rediscovered with actual title/duration/prompt/seed/lyrics. Audio stays external to JSON backups.

Instrumental is the default. Lyrical generation uses a generated guide singer, explicitly not Mana voice. Play generated audio/Generated lyrics are available after generation. Create Mana cover opens the existing cover form with generated audio, voice separation and whole-song conversion selected; the user reviews conversion settings and starts the established Mana voice pipeline. Saved lyrical originals expose the same action under Song details. No silent voice conversion or claim that ACE-Step output is Mana. Original instrumentals play/export directly; source review/mix needs separated singing stems. Chat pool approval remains separate.

New original_song_start native command validates inputs/runtime/model presence before job creation and shares the owned singing-job slot. Cancellation kills only the original job's owned process tree on Windows, covering the native child; other singing job behavior remains unchanged. Frontend timeout is 30 minutes. No local web server required. Original-only draft actions do not edit library metadata before a saved project exists.

Validation: local 15-second instrumental native audition rendered 14.24s stereo48k WAV; production lyrical draft with original test lyrics rendered 14.24s finite WAV; production 60-second instrumental rendered exactly60s and retained request/results. Frontend build passed; 172 frontend checks passed, two optional skipped. 61 Rust tests passed, including original request boundary validation, actual owned child-process cancellation, and original mix-only discovery compatibility. Metadata/seed/lyrics backup and preview fingerprint test passed. Listening quality and manual UI acceptance remain for the user. High-note/trembling voice conversion issue remains deferred.

Manual checks: (1) restart Mana, Original song tab, make/play short preview; (2) create 30–60 second full song, reopen/restart and verify metadata/play/export; (3) turn off Instrumental, use own lyrics or blank for automatic English lyrics, preview then open Create Mana cover; (4) change prompt/seed to require a new preview, reject invalid duration/seed, and Stop during generation.

### Cover vocal diagnosis auditions — 2026-10-13
Prepared `exports/singing/cover-diagnosis-2026-10-13` using the same existing 12-second extracted guide, approved default-r2 reference, seed 42 and guidance 0.7. Vocal-only comparisons: extracted guide, 30 steps, 50 steps, and 50 steps with the existing conservative F0 smoothing. Listening exports use common RMS target 0.10 with peak ceiling 0.95; no backing, reverb, pitch shift or note quantization. Converted duration is 11.993 seconds versus 12-second guide. All generated samples were finite. App defaults and approved song pool remain unchanged. Listening approval is pending.
Earlier smoothing metrics barely changed guide pitch (adjacent-change median 5.924 to 5.878 cents); this does not establish that pitch tracking is the source of the perceived trembling. Compare guide versus conversion first, then isolate step-count and smoothing changes. Next reference comparison or fine-tuning depends on that audition; no promised quality improvement from additional diffusion steps.
Reproducible runner: `scripts/audition-cover-diagnosis.py`; manifest `comparison.json` records settings and levels. The initial sandbox attempt stalled in audio loading; the owned worker was stopped and successfully rerun with native-library access.

### Singing-reference comparison — 2026-10-13
User preferred the 50-step pitch-smoothed candidate but still heard trembling. Prepared `exports/singing/singing-reference-audition-2026-10-13`: previous candidate versus the same 12-second guide converted with an eight-second isolated vocal from the previously approved current-voice cover `1791658128634-current-voice`. Both use seed 42, guidance 0.7, 50 steps and conservative pitch smoothing, with matched RMS and no accompaniment. Both outputs are 11.993 seconds and finite. This reference is itself converted audio, so it may recycle artifacts; it is an exploratory conditioning test, not a clean ground-truth singing dataset or approved training material. App defaults and pool unchanged. Listening approval pending. Reproducible runner: `scripts/audition-singing-reference.py`.

### Lower-key vocal auditions — 2026-10-13
Prepared `exports/singing/cover-key-audition-2026-10-13` comparing original key, -2 and -4 semitones. Same 12-second guide, derived Mana singing reference, seed 42, 50 steps, guidance 0.7, F0 conditioning and conservative pitch smoothing; automatic F0 adjustment disabled. All audition WAVs are vocal-only, common RMS target 0.10/peak ceiling 0.95, finite, and 11.993 seconds long. Original-key control reuses the identical previous conversion. No production UI/defaults or approved clips changed. Optional worker parameter `semi_tone_shift` defaults to zero and rejects booleans, non-integers and values outside -12..12 before loading audio. Runner: `scripts/audition-cover-key.py`. Listening approval pending; key changes do not establish a cure for trembling. A finished transposed mix would also require matching accompaniment transposition.

### Legacy Applio singing comparison — 2026-10-13
Read existing `C:/AI/Applio` and `C:/AI/ManaAI` without changing their configurations or models. Legacy core/rvc.py uses VoiceConverter, ContentVec, FCPE, volume envelope 1.0, protect 0.33; affinity profiles choose index 0.70–0.85 and speech pitch +6..+9. Singing audition deliberately preserves original key (pitch 0) with index 0.70, no autotune, denoise or postprocessing. Existing model/index: `C:/AI/ManaAI/models/rvc/ManaVoicev1.pth` and `.index`; detected F0-enabled RVC v2, 40 kHz HiFi-GAN.
Applio's bundled env failed importing copyreg; used legacy Mana's configured `.venv/Scripts/python.exe` successfully instead. No installation repair attempted. Offline model loading and disabled bytecode; output and Numba cache stay in current project. Runner `scripts/audition-applio-cover.py`.
Outputs `exports/singing/applio-cover-audition-2026-10-13`: same 12-second extracted guide converted with FCPE and RMVPE, matched RMS target 0.10/peak cap 0.95, vocal-only, previous Seed-VC candidate copied as control. Both outputs finite, audible and 11.98 seconds. CPU startup/import/model preparation 19.39s; FCPE conversion 13.93s, RMVPE 4.25s. Timing includes extractor setup and sequence cache effects: RMVPE runs second with shared voice/embedder models warm; not a controlled speed benchmark. Listening approval pending; no app integration/default or approved song changes.

### Whereabout FCPE audition at 2:50 — 2026-10-13
User preferred FCPE's lesser trembling and requested a longer Whereabout test starting 2:50. Used saved full-song guide vocal `exports/singing/1791669063502/guide-vocals.wav`, 170–200 seconds, with existing legacy Mana model/index, original key, FCPE, index 0.70, protect 0.33, volume envelope 1.0, ContentVec; no autotune, denoise or postprocessing. Saved `exports/singing/applio-whereabout-170s-2026-10-13/original-vocal.wav` and `mana-fcpe.wav`, common RMS 0.10/peak ceiling 0.95, vocal-only. Finite audio and duration verified: guide 30s, Mana 29.98s. CPU conversion 11.05s plus startup/model loading 4.77s in this run. Full download English Whereabouts cover duration is 288.078s matching saved stem's 288.044s; the other similarly named download is only 12.024s. App, legacy configurations and approved pool unchanged; listening approval pending. Runner `scripts/audition-applio-whereabout.py`.

### Alternate vocal extraction at 2:50 — 2026-10-13
After user heard echo/doubling in the Demucs guide where FCPE trembles, extracted original downloaded Whereabouts English cover at 170–200s with installed Mega 53-stem BS-Roformer: lead-vocal, back-vocal and combined vocal outputs. Local GPU, verified checkpoint SHA256, 4s windows/3s hop overlap-add; no new downloads. Raw estimates stored as FLOAT (lead peak 1.098 remains unclipped); listening copies normalized independently to RMS 0.10 with peak cap 0.95. Independent heads are estimates, not additive ground-truth parts. Backing-track audition amplification is documented (gain 2.095); its apparent loudness is not evidence of original balance.
Converted lead-only and combined-vocal estimates using unchanged legacy Mana model/index, FCPE, pitch 0, index 0.70, protection 0.33, ContentVec, no autotune/denoise/postprocessing. Both finite and 29.98s; CPU conversion 10.12s/9.40s respectively. Previous Demucs-FCPE control copied without regeneration. Outputs `exports/singing/vocal-extraction-170s-2026-10-13`; extraction and conversion manifests preserve settings and levels. Original mix and extracted tracks available for listening to distinguish harmonies/reverb from separator artifacts. No claim that alternate extraction is cleaner until listening; no app defaults/configurations, legacy installations or pool changed. Runners `scripts/audition-vocal-extraction.py`, `scripts/audition-applio-extractions.py`. Initial checksum helper updated for existing Python3.10 before successful extraction. Listening approval pending.

### Lead-only FCPE versus Seed-VC — 2026-10-13
User selected Mega lead-only extraction and requested engine comparison. Same raw 170–200s lead-only stem supplied to existing RVC FCPE candidate and Seed-VC (50 steps, guidance .7, seed42, pitch smoothing, original key, previously derived eight-second Mana singing reference). RVC result reused exactly; Seed-VC newly generated. Vocal-only RMS-matched 0.10/peak cap .95 auditions at `exports/singing/lead-engine-comparison-2026-10-13/1-fcpe.wav` and `2-seed-vc.wav`. Finite sample checks and duration checks passed: 29.98s FCPE /29.989s Seed-VC. Seed-VC worker total40.05s including loading, so not directly comparable with FCPE's earlier conversion-only10.12s. This compares whole engine candidates and their established conditioning, not pitch trackers in isolation. Production defaults, pool and legacy installations unchanged. Listening approval pending. Runner `scripts/audition-lead-engines.py`; manifest records source, reference, levels and timing.

### Approved lead-only → zero-shot Seed-VC cover flow — 2026-10-13
New Music Studio covers default to Mega lead-only extraction, Seed-VC's F0-enabled 44.1 kHz singing model, 50 steps, guidance 0.7, seed42 and conservative guide pitch smoothing at original key. The approved eight-second derived singing reference is copied to stable `data/custom-voice/references/mana-v2/singing.wav` with provenance; chat voice configuration is unchanged. Create-cover form exposes Lead only (recommended) / Voice & harmonies (Demucs), plus a checkbox to use Mana's singing reference or the selected chat reference. Dry vocal input can skip separation.
Lead extraction runs in a hidden owned subprocess using the installed Mega checkpoint and short overlapping windows; its GPU model exits before CPU Seed-VC conversion. Stop now terminates the cover worker's owned process tree. Missing separator setup is rejected before native job folder creation; worker verifies the checkpoint checksum and refuses silent fallback. Resource bundle includes cover_lead.py and singing_pitch.py; explicit project data root supports packaged workers. Lead and backing are scaled together if necessary before PCM encoding to prevent clipping. Backing is original mix minus the combined-vocal estimate, rather than original mix minus lead, to avoid deliberately retaining the original singer's backing harmonies. Extraction remains estimated and can contain artifacts. Input files and old cover audio remain unchanged.
Cover metadata/backups/discovery preserve extractor choice; old entries without this field retain Demucs metadata. FCPE remains an audition fallback and is not integrated or selected as production default. Original-song guide-to-cover uses the same Create cover flow.
Validation: 173 frontend tests passed, two optional skipped; build passed; 61 Rust tests passed including owned-process-tree termination. Production 30s whole-input smoke verified GPU extraction → CPU conversion, valid duration and finite/unclipped guide, backing, vocal and mix. Output `exports/singing/production-lead-cover-smoke-2026-10-13`. Listening approval of this production run remains a manual check.
Manual acceptance after restarting Mana:
1. Create a Whereabout excerpt starting170s, length30s, Lead only and Mana singing reference enabled; listen to Mana vocal for the approved stability.
2. Play Full mix and Instruments; confirm alignment, backing volume and absence of obvious doubled original lead.
3. Test Whole song or a dry sung guide with separation disabled, then reopen Music Studio and verify older covers still play.
4. Stop while extracting; confirm processing stops and another cover can start. Demucs remains selectable for comparison.

### Local trembling report near 1:12 — 2026-10-13
User's new full Whereabout cover is `exports/singing/1791861784048` (Mega lead, Seed-VC50, pitch smoothing, seed42, singing reference). Extracted original mix, actual guide and full converted vocal at 62–82s into `exports/singing/whereabout-72s-diagnosis`; normalized listening copies with no accompaniment for vocal stages. Rerendered the same saved lead with identical voice settings as a separate20s conversion; original full output preserved. Rerender changes sequence context/RNG progression and is a candidate, not proof of a chunk-boundary defect.
Guide RMVPE trace at70–75s:454 voiced frames,2 voicing transitions, no adjacent voiced pitch jumps over600cents; range228.79–414.26Hz. Existing smoothing leaves this range effectively unchanged. No evidence from these checks for an octave-jump or rapid voicing-flicker correction; they do not rule out extraction/timbre artifacts or finer pitch instability. Input and candidate audio finite; loudness matched for audition. App settings and pool unchanged. Await comparison of full-cover vocal vs local rerender (1:12 occurs10s into clips) before selecting a repair or changing pipeline. Runner `scripts/diagnose-cover-72s.py`; pitch trace and manifest saved.

### Combined-vocal local repair candidate near1:12 — 2026-10-13
Following user's observation of echo in the lead at clip11s (~73s song), recovered the saved combined-vocal estimate as source-segment minus backing-extracted (both raw FLOAT, saved before production PCM scaling). No new model extraction needed. Compared normalized lead and combined guides at62–82s, and converted combined guide with unchanged Seed-VC50, guidance.7, seed42, pitch smoothing and singing reference. A separate full vocal candidate replaces only70–77s with this local conversion and400ms linear crossfades. All floating samples outside that patch are exactly unchanged; original full cover and mix are untouched. The combined estimate may still contain backing voices/reverb; no assertion of cleaner sound or solved echo without listening. Files finite, unclipped and valid duration; output `exports/singing/whereabout-72s-combined-candidate`. Manifest records recovery method, patch region/gain and listening approval=false. Full repair candidate is vocal-only; approved integration/remix is pending listening. Runner `scripts/audition-cover-local-repair.py`.

### Dedicated vocal de-reverb audition — 2026-10-13
Combined-vocal alternative still retained echo according to user; tested author anvuew's mono Mel-Band Roformer de-reverb checkpoint (SDR20.4029), source https://huggingface.co/anvuew/dereverb_mel_band_roformer, author-listedGPL3.0, revisioncef05ad. Downloaded913097978bytes into data/vocal-dereverb; SHA256 verifiedf099ee717eb57fb0ad5eb0e7c9ad6787c36168140b61ce2b158b90c2c4ecee79. Existing MSST code/dependencies reused, checkpoint loaded weights_only=True and strict state validation. No downloads to legacy installations; no recording uploaded.
Cleaned only existing62–82s lead with GPU8s/6s overlap-add; saved original, cleaned and removed-material auditions at exports/singing/whereabout-72s-dereverb-audition. Removed-material RMS0.0180 vs original lead0.1436; separately normalized removed-material audition gain5.547, so its listening loudness does not represent original balance. Small removed energy does not establish successful echo removal. Author notes mono variant stronger on reverb but less able to remove harmonies and instrument leftovers; avoid assuming it handles a doubled lead.
Converted cleaned guide with unchanged Seed-VC50/guidance.7/seed42/pitch-smoothing/singing-reference. Baseline is the previous uncleaned20s local rerender with the same context, not the entire-song conversion, to isolate input cleanup. Finite samples and duration verified. App defaults, original cover, pool and legacy models untouched; listening approval pending. Runners scripts/audition-vocal-dereverb.py and scripts/audition-dereverb-conversion.py; cleanup.json/conversion.json preserve provenance and levels.

### Harmony-suppression alternative at1:12 — 2026-10-13
User rejected mono de-reverb: echo persisted. Tested author's original anvuew Mel-Band Roformer SDR19.1729 weights, which the author reports can partially suppress noncentral harmonies and separation leftovers; this is an alternate cleanup model, not a guaranteed dedicated double-track separator. Downloaded from author revisioncef05ad to data/vocal-dereverb/harmony-model.ckpt,913107578bytes, SHA2569262877b87e9ebb0fb808a456b0a411fa677f5df31c8383c1254af531c078970 verified; GPL3.0 author label recorded. No audio uploaded. Reused existing MSST dependencies and strict weights-only checkpoint loading.
Cleaned same62–82s lead, GPU8s/6s windows. Original RMS0.1436, cleaned0.1378, removed0.0220; separately normalized removed-material gain4.554 is for audition, not original balance. Seed-VC conversion uses same20s context/reference/50steps/guidance.7/seed42/pitch smoothing. All processed audio finite with valid duration; listening approval pending, no quality claim based on energy alone. Files at exports/singing/whereabout-72s-harmony-audition: before-lead/clean-lead/removed-material/before-mana/clean-mana plus manifests. Source/full cover/app defaults unchanged. Existing audition runners now accept explicit mono/harmony variant; previous outputs preserved. If the echo remains, this model has not isolated the problematic overlapping voice and should not be adopted globally.

### FCPE local fallback audition at1:12 — 2026-10-13
After lead/combined swaps and both cleanup weights failed listening checks, user authorized FCPE fallback on the same problematic lead. Ran existing legacy Mana runtime/model/index with FCPE, original key, index0.70, protection0.33, ContentVec, no cleanup/autotune/postprocessing, on the identical saved62–82s lead. Output19.98s, CPU conversion9.86s (model preparation+conversion10.40s). Independent candidate uses resampled FCPE only at70–77s,400ms crossfades, level matching with peak cap. Full vocal outside patch exactly unchanged in floating validation; original user's cover and mix files preserved.
At exports/singing/whereabout-72s-fcpe-repair: current-seed-vc.wav, fcpe-only.wav, hybrid-repair.wav, mix-repair-preview.wav, full-vocal-candidate.wav. Audition RMS0.10/peak0.95, finite/duration checked. Mix preview reuses saved backing balance via least-squares fitted coefficients (vocal0.45243/backing0.80000; fit residualRMS1.17e-5), adding only local vocal delta. No full mixed cover replaced, no app defaults/integration changed. Listening approval=false; do not claim this resolves the distorted note before review. Runner scripts/audition-fcpe-local-repair.py; comparison.json preserves settings, timing and patch scope.

## 2026-10-14 — Cover Builder and clearer navigation

Music Studio now separates Create (Cover a song, Cover Builder, Original song), Edit tracks and Chat clips. Advanced extraction settings are folded away; player and track icons include tooltips and accessible labels. Cover Builder uses the wider workspace alongside the library.

Add one clean sung vocal, convert it to Mana with the current zero-shot Seed-VC singing reference, and add instrument recordings individually. Up to 16 tracks support names, volume, mute and signed timing offsets (positive delays, negative trims). Import copies WAV/MP3/FLAC/OGG/M4A into a 44.1 kHz stereo WAV under exports/singing; source recordings are unchanged. Tracks can be up to one hour, subject to the existing 256 MB mix limit. Alignment is manual; this does not automatically match tempos.

Keep original instrument audio or choose a melodic replacement/drum kit. Make a replacement preview, listen, then apply it; Restore original remains available. Longer replacements render in sections of at most 60 seconds and are assembled into a complete track. Transcription still estimates notes and expression, so listening is required.

Preview the mix, then save it to the library. Saved builder projects retain track paths, gains, mute, timing, original paths and applied replacements. Open in Cover Builder restores editable tracks. Unsaved drafts survive tool/chat switches within the current app session; save before restarting. JSON backups contain metadata and paths, not audio files. The existing player receives aligned vocal/instrument stems for playback and mix controls.

Verification: production build passed; 175 frontend tests passed (2 optional checks skipped), 63 native tests passed. Native import verified resampling and unchanged source bytes. Browser inspection verified navigation, wide builder layout and draft-title retention across tool switches. Desktop conversion, replacement listening and save/reopen acceptance remain for the user.

Manual acceptance:
1. Open Songs → Create → Cover Builder. Check navigation, folded settings and icon tooltips; switch tools and confirm your draft remains.
2. Add a clean vocal and convert to Mana. Add two instrument tracks; adjust timing, volume and mute, then preview the mix.
3. Choose an instrument replacement, listen, apply it and restore the original. Save the mix to the library.
4. Open that saved cover in Cover Builder and confirm its tracks/settings return. Check older covers and Chat clips still play normally.

## 2026-10-14 — Backing vocals, karaoke lyrics and direct-track replacement fix

Fixed Cover Builder replacement jobs receiving a null companion-stem list: the native request now sends an empty list and the Python job accepts null/empty lists defensively. Verified a real three-second electric-piano replacement from the user's saved upload request, plus a deterministic regression covering both null and empty companion stems. Existing generated files and user sources are unchanged.

Cover Builder now offers Add backing vocal. Multiple backing voices count within the existing 16-track limit, each with its own gain, mute and timing. Keep the uploaded voice or convert it to Mana independently. Saved projects retain backing roles; the player vocal stem combines lead and backing voices, while the instrument stem excludes all voices. One lead vocal is still required.

The main Music Studio player has Generate lyrics and Edit / paste controls. Local Whisper transcribes the saved vocal (full mix fallback) into timed lines, saved in library metadata and JSON backups. Current English Whisper model supports English; multilingual models use automatic language detection. Lyrics highlight a whole line during playback and follow seeking, pause and restart. This is line-level karaoke, not word-level animation or new lyric composition. Wording and timing are estimates, especially for singing; paste/edit [mm:ss.xx] lines to correct them. Empty timed text clears the lyrics.

Lyrics jobs support cancellation, clean temporary WAV/JSON/log files on completion or stop, run locally without uploads, and reject audio beyond one hour before starting. Generation is explicit and only in the main Songs player; no chat lyrics feature was added.

Verification: production build passed; 177 frontend tests passed with 2 optional skips; 65 native tests passed. Installed Whisper produced timestamped JSON from the actual Mana singing reference; words were imperfect, confirming the need for editing. Browser layout confirms the backing-vocal control. Desktop listening and karaoke playback acceptance remain for the user.

Manual acceptance:
1. Retry Electric piano replacement in Cover Builder: preview should complete without the NoneType error.
2. Add backing vocals, adjust gain/mute/timing, optionally convert one to Mana, then preview/save/reopen the mix.
3. Select a finished song in the main player and Generate lyrics. Play, pause, restart and seek; line highlights should follow the song.
4. Correct words/times using Edit / paste, save, then reopen the song. Check saved lyrics persist and Stop cancels generation.

## 2026-10-14 — Whereabout piano melody audition

User requested piano-first melody preservation for Whereabout. Found that the shared replacement renderer reduces Basic Pitch's polyphonic detections to a single Viterbi melody for all instruments, discarding piano chords/independent overlaps. Added an audition-only piano path using independent detector events and the installed Accurate Salamander SFZ piano. Same-key re-strikes trim the earlier key's note-off; separate pitches keep their overlaps. Production render/defaults remain unchanged pending listening.

Audition uses the previously approved Banquet piano extraction at song 80–95 seconds (exports/singing/whereabout-sax-piano-audition/piano-raw.wav). Exports at exports/singing/whereabout-piano-polyphonic-audition: original-piano.wav, previous-monophonic.wav, candidate-polyphonic.wav, candidate/previous MIDI, notes.json and report.json. Matched listening RMS target .07 with peak cap .9; no original audio is mixed into either recreated candidate.

Verification: synthetic three-note chord/overlap and repeated-key ownership checks passed; real 15-second inference/render completed with finite samples. Old line31 notes, polyphonic245 notes, maximum11 simultaneous keys. These counts show retained polyphony, not accurate transcription; noise/harmonics from the extracted source may remain as extra notes. User melody/phrasing acceptance pending. No external model downloads or app setting changes.

2026-10-14 follow-up: auditioned the user-supplied UVR Piano MP3, first0–15 seconds, with the same polyphonic path and Accurate Salamander samples. Files: exports/singing/whereabout-uvr-piano-0-15-audition/original-piano.wav and candidate-polyphonic.wav (also prior mono recreation, guide WAV, MIDI, notes and report). Input MP3 read only. All listening files finite and15s, separately level-matched to .07RMS/.9peak cap, no original layered into the candidate.25 previous mono notes versus188 polyphonic notes, maximum8 simultaneous keys; note counts are not accuracy evidence. Listening approval pending; app defaults unchanged. Audition runner now accepts explicit source/start/duration/output folder.

2026-10-14: UVR piano0–15s note-filter audition at exports/singing/whereabout-uvr-piano-filtered-audition/filtered-piano.wav. Filters confidence below.40, weak notes shorter than.105s (strong short attacks retained), and weaker coincident octave/fifth harmonics. Retained notes keep pitches/onsets/ends unchanged, with full chord overlaps. Uses same Salamander samples and listening target as the preceding188-note candidate, no original mixed in. Synthetic chord, independent octave attack, short strong attack and weak coincident harmonic tests passed; finite15s audio/MIDI/report produced. This is an audition heuristic and can remove real soft notes; listening acceptance pending and production defaults unchanged.

2026-10-14: User preferred the188-note UVR polyphonic take to the97-note broad filter; retain that earlier take as baseline. New audition in exports/singing/whereabout-uvr-piano-attack-repair/attack-repaired-piano.wav merges36 weaker same-key repeat attacks into their prior sustains (152 events remain), instead of deleting quiet pitches/chords. Requires gap<=.16s, confidence<.55 and<=90% of prior attack, and no>=1.4x median key-energy rise in original CQT around that onset. Merged notes extend the prior end, preserving their entire sounding interval; other note pitches/onsets/ends unchanged. Same Salamander samples and listening-level target; no original layered into render. Synthetic chord preservation, source-supported re-strike protection, input immutability and merged sustain checks passed; rendered audio finite and15s. MIDI, notes and heuristic decisions saved in report. Listening acceptance pending, app defaults unchanged. This heuristic may still mistake soft real re-strikes for decay fragments.

2026-10-14: User requested removing weak detections only from the preferred188-note UVR piano take. Audition at exports/singing/whereabout-uvr-piano-weak-only-audition/weak-removed-piano.wav removes74 events with confidence<.40 and retains114. No duration/harmonic filters, merging, pitch changes or retiming. Same Salamander patch, velocity mapping and exact playback gain as preferred take; no post-filter loudness boost. Assertions verify retained notes unchanged, exact counts,15s finite audio and no clipping. MIDI/notes/report saved. Lower confidence is not proof a note is false; listening acceptance pending. Prior candidates and app defaults unchanged.

2026-10-14: User accepted weak-only114-note candidate but flagged extra strong notes around4s. Source CQT check showed near-contiguous repeat D#3 at3.949s and B3 at4.438s without a fresh key-energy rise (.92x/.83x respectively); nearby E4 at3.914s had3.23x rise and was retained. Targeted audition merges only these two repeat attacks into prior sustains (112 events), preserving other notes, playback gain and samples. Output exports/singing/whereabout-uvr-piano-4s-repair/targeted-piano.wav plus MIDI/notes/report. Assertions verify exact two merges, other pitches/onsets/confidence unchanged, no shortened ends, finite15s/no clipping. Decay/no-rise is evidence for a suspect attack, not proof of note truth; listening acceptance pending. App defaults and prior candidates untouched.

2026-10-14: User accepted targeted4s correction as closer and approved extending approach across the remaining0–15s passage. New audition exports/singing/whereabout-uvr-piano-full-passage-repair/passage-repaired-piano.wav applies identical near-contiguous same-key source-energy rule across15s, starting from accepted weak-only114-note candidate.43 suspected repeat attacks merged into earlier sustains,71 events retained. All original sounding intervals/pitches retained via same-key merges; no retiming or fresh pitch additions. Assertions ensure accepted3.95s/4.44s repairs retained, unmerged notes unchanged except extended ends, finite15s audio/no clipping, exact prior playback gain. MIDI/notes/report saved. Fresh rise protection usesCQT median1.1x threshold; source evidence is heuristic and may suppress real soft re-strikes, so listening approval remains required. Best targeted4s candidate and app defaults preserved.

2026-10-14: User accepted full-passage melody but reported soft original notes rendered too strongly. Dynamics audition exports/singing/whereabout-uvr-piano-dynamics-audition/dynamic-piano.wav uses identical71 approved notes/pitches/onsets/ends. Estimates key strength via source CQT75th percentile15–140ms after attack and maps relative to90th percentile into MIDI15–95; actual range21–95 versus old70–94. Same Salamander patch, global listening RMS matched to preceding candidate(.0541468) with.9peak cap; no per-note count/timing changes. Per-note velocities now an optional validated renderer argument; normal app calls/default dynamics unchanged. Monotonic loudness/invalid velocity checks, exact note persistence, finite15s/no clipping and existing direct-track replacement regression passed. MIDI/strengths/velocities/report saved. Spectral strength is an estimate, not measured original MIDI velocity; listening approval pending.

2026-10-14: User requested weak original notes also sound weak. Soft-dynamics audition exports/singing/whereabout-uvr-piano-soft-dynamics/soft-dynamic-piano.wav uses the same71 approved notes and cached source attack strengths. Replaces15–95 curved mapping with linear MIDI1–95 (MIDI1 minimum nonzero note-on), removing the artificial velocity15 floor and weak-note-lifting power curve. Reuses previous playback gain with peak-reduction-only cap; no upward RMS normalization. Tests assert all new velocities <=previous, monotonic strength mapping, exact note preservation, finite15s and gain not increased. MIDI/notes/report saved. Weak detections removed in prior accepted pass are not reintroduced; source dynamics remain estimated from CQT. Listening acceptance pending; app defaults unchanged.

2026-10-14: User still heard weak notes too strongly after soft MIDI mapping. SFZ inspection confirms amp_veltrack98.5 and velocity layers; do not claim the patch ignores velocity. New direct-attenuation audition exports/singing/whereabout-uvr-piano-direct-dynamics/direct-soft-piano.wav preserves71 notes/times and prior MIDI velocities, uses minimum of normalized source-derived velocity and detection confidence above.40 to choose direct layer gains1/.5/.25/.125 (0/-6/-12/-18dB). Independent sampled layers are summed, no note dropped, no source mixed in, no upward RMS boost. Groups are heuristic estimates of weakness, not known original MIDI dynamics. Assertions verify each note rendered once, exact note persistence, finite15s/no clipping and gain not increased. Report saves per-note gains/counts; listening approval pending and app defaults unchanged.

2026-10-14: User requested a small overall boost while further softening weak piano notes. Balanced audition exports/singing/whereabout-uvr-piano-balanced-dynamics/balanced-piano.wav preserves71 notes/timing and prior MIDI velocities, uses layer gains1/.4/.18/.08 versus preceding1/.5/.25/.125, then applies requested+1.5dB global gain with.9peak cap. Main group unchanged before global boost; softer groups remain lower even after boost. Finite15s, exact note persistence and cap assertions passed. Report records requested/applied boost and peak. Prior auditions and app defaults retained; listening approval pending.

## 2026-10-14 — Approved piano recreation integrated

User approved balanced piano candidate (softer weak notes plus1.5dB boost). Prepared source piano/piano-banquet → Piano with Separate libraries now uses render_piano_preserving: polyphonic piano detection, confidence>=.40 filtering, source-key no-rise repeat merging with preserved sustain, linear source MIDI dynamics and direct1/.4/.18/.08 audio layers plus1.5dB. Existing piano SFZ variants retain their selected patch. Guitar/other source parts and other instrument destinations/banks retain prior routes.

Automated check on the same UVR0–15s guide reproduces all71 approved note events exactly; rendered waveform at comparison gain differs by at most.0000305176 from the approved PCM16 audition (one quantization step). Existing mix-stage loudness matching and volume controls remain; app absolute playback loudness may differ from the level-matched audition. Routing regression verifies piano/piano-banquet select the new method and guitar does not. Existing null/empty companion-stem regression passed. Native tests/build refresh verified separately. The approved audition remains at exports/singing/whereabout-uvr-piano-balanced-dynamics/balanced-piano.wav.

Manual checks after restarting Mana:
1. Cover Builder: import isolated piano, Original instrument=Piano, Try a replacement=Piano, then Make replacement preview. Use the same0–15s source for direct comparison.
2. Confirm melody, sustained overlaps and soft-note balance, especially around4s.
3. Apply/save/reopen the mix; adjust piano volume independently of Mana vocal.
4. Existing guitar/sax/drum replacements and original-track restore still work.

This is an estimated transcription/dynamics method approved on one passage, not a guarantee of exact notes on every recording. Remaining sources/instruments still need quality work.

## 2026-10-14 — Guitar performance first audition

User moved on from approved piano and authorized guitar work, starting clean then distorted. Reused existing isolated Reach Out to the Truth guitar at exports/singing/arrangement-1791744247383209600/guitar.wav. New clean-guitar audition in exports/singing/guitar-performance-9-19-audition covers9–19s, rendered with full19s context. Files: original-guitar.wav (distorted source), current-clean-guitar.wav, candidate-clean-guitar.wav; full-context MIDI/notes/report retained.

First pass holds current48 melody pitches and attack timing unchanged. Extends26 note ends by source CQT/RMS evidence, up to450ms beyond existing ends, stopping before same-key re-strikes or weak/silent source energy. Picking velocities derive from source-key attack strength, range17–100, using installed BlackAndGreenGuitars clean patch. No new notes added and no source mixed into recreation. Baseline/candidate share playback gain; original separately matched for listening. Synthetic tests preserve input, pitches/onsets, same-key boundaries and silence; real render finite with exact10s exported clips. MIDI events retain full19s reference timing.

This audition targets ringing/picking first; it retains existing note-estimation errors. Source has distortion, while both recreated comparison tracks are clean to judge note performance independently of distortion. User listening acceptance pending; guitar production settings unchanged and approved piano retained. Distorted candidate follows after clean performance review.

2026-10-14: User requested guitar holds/ringing closer to original; melody present but clean-vs-distorted tone makes judging difficult. Audition exports/singing/guitar-longer-sustain-9-19-audition/longer-clean-guitar.wav and longer-distorted-guitar.wav uses same48 pitches/onsets/picking velocities as previous guitar candidate. Further source-supported extension on14 notes, up to.64s observed; permits up to1.2s additional with quieter pitch-evidence threshold and source RMS stop. Same-key re-strikes remain boundaries. Main sample release changes.65→1.1s only for this audition through optional validated renderer parameter; production default.65 unchanged. Clean listening gain identical to preceding candidate; distorted clip uses identical notes/holds with RMS matched to clean. No source mixed in. Assertions cover unchanged pitches/attacks/velocities, no shorter ends or new same-key crossing, finite19s render/exact10s clips and no clipping. Existing replacement/piano routing regression passed. MIDI/notes/report saved. Listening acceptance pending; piano and app guitar defaults preserved.

## 2026-10-15 — Controlled guitar patch comparison

User approved comparing available guitar patches because extensions/melody still differ from distorted source. Rendered installed Green twang, Black twang and Combo twang using the identical48 note pitches/onsets/held ends/picking velocities from the longer-sustain candidate. Both clean and distorted versions at exports/singing/guitar-patch-comparison-2026-10-15 (green-clean/distorted, black-clean/distorted, combo-clean/distorted). Each clip covers9–19s with full19s rendering context, RMS.065 subject to.9peak cap. Original isolated guitar copied alongside for reference; no source layered into recreations.

Main sampled release1.1s and the same distortion algorithm are used in all patches. Combo has two main guitar globals, so explicit-release rendering now updates both; default app release behavior is unchanged. Tests assert exact input-note persistence, finite/exact10s audio and loudness/peak bounds. Existing replacement/piano routing regression passed. This comparison changes sampled tone while holding the estimated performance constant; bends/vibrato/slides/feedback and possible transcription mistakes remain unresolved. Listening selection pending; no guitar production default changed and approved piano preserved.

## 2026-10-15 — Moderate-gain amp-style tone auditions

User supplied bright mid-gain J-Rock tone description and approved a new tone pass. Specific Ibanez/FGN/Marshall/Mesa recording claims were not verified; primary2022 Meguro AMA names a Stratocaster and Empress Heavy in a general equipment answer, not the historical recording chain (https://www.reddit.com/r/IAmA/comments/xxkws6/i_am_shoji_meguro_lead_composer_on_the_persona/). Treat gear specifics as unknown.

No local recorded cabinet IR or dedicated amp model was found. Transparent DSP approximation audition created at exports/singing/guitar-amp-tone-2026-10-15: bright-midgain.wav and source-shaped-midgain.wav, plus original-guitar.wav and previous-distortion.wav. Same Green clean48-note performance/holds/dynamics from9–19s patch comparison. Processing uses4x oversampled gentler asymmetric saturation, synthetic speaker-like midrange/rolloff FIR, and optional broad original-informed EQ bounded±6dB after removing global level offset. No source audio blended in; not a named amplifier emulation or measured cabinet response.

Tests verify silence remains silent, FIR delay compensation preserves impulse position, exact10s finite outputs, identical source note metadata, and matched.065RMS with peaks<.9. Output peaks.240/.368. Prior auditions and production defaults preserved; listening acceptance pending. Original-derived spectrum is only a broad timbre target and cannot correct missing bends/notes/playing techniques.

2026-10-15: User preferred source-shaped tone and approved subtle effects comparison. Auditions at exports/singing/guitar-effects-2026-10-15: source-shaped-dry.wav, subtle-chorus-doubling.wav and subtle-short-delay.wav, stereo10s(9–19s). Source performance/note metadata unchanged. Chorus adds12/17ms delays modulated±2ms at.6Hz, wet.12 per side. Short delay adds75ms wet.10/.075 and150ms wet.025, no feedback. Separate effects tests, not stacked; dry center retained. All RMS matched to dry and peaks capped.9, no original audio blended in. Silence/impulse timing/finite-shape checks passed, metadata copied. Ending tails trimmed to10s for comparison. These are candidate effects, not identification of the original chain; stereo headphone listening useful. No production default changes; listening acceptance pending.

## 2026-10-15 — Real NAM Marshall amp+cab audition

User authorized preparing a real NAM audition. Downloaded official NeuralAmpModelerCore and submodules into data/nam/core, built local Release/render.exe with installed MSVC/CMake. Upstream tools/CMakeLists.txt applies GCC-only -Wno-error source flags unconditionally; local compatibility patch guards all three source properties when NOT MSVC. This is a local audition runtime, not an app/global plugin installation.

Downloaded creator honkkis's JCM800 full-rig capture through the normal TONE3000 Download model → Just download tone controls: https://www.tone3000.com/tones/jcm800-with-cab-upsampled-48khz-96khz-600-epochs-5340. Copied the downloaded .nam into ignored data/nam/models/jcm800-cab.nam. Page title refers to older96k capture; actual downloaded A2 SlimmableContainer metadata declares48000Hz, gear_type full-rig, Marshall JCM800, so renderer input is resampled to48k. Both amplifier and cabinet are included; no additional cabinet approximation/IR/EQ/distortion/chorus/delay is applied. This capture is not claimed to be the original song's recording rig or moderate knob settings. Input-level sweep provides two responses from the fixed capture.

Auditions at exports/singing/guitar-nam-jcm800-2026-10-15: nam-lighter-input.wav(-6dB input), nam-normal-input.wav(0dB input), original-guitar.wav and previous-source-shaped.wav. Same Green48-note longer-sustain clean performance9–19s is fed to real NAM. Added.5s silence before/after for processing context, excluded from exports. Outputs resampled to24k and matched.065RMS with.9peak cap. Original source is not layered into NAM outputs.

Verification: official renderer build succeeded after compatibility fix; both real A2 runs returned success, valid exact-length mono output at model sample rate and finite samples. Exported clips exact10s, peaks.216/.226, no clipping. Report stores capture SHA256/metadata, input levels, output gains and method; renderer logs retained. No original files or app settings changed. Creator/platform attribution and local-only capture distribution note saved in data/nam/models/ATTRIBUTION.txt. T3K page permits outputs but restricts redistributing the model; capture remains ignored and excluded from distributable app resources. User listening acceptance pending; missing chord/bend/playing information remains separate from amp tone.

2026-10-15: User preferred real NAM tone as closer and requested missing-effects comparisons. Auditions at exports/singing/guitar-nam-effects-2026-10-15: dry.wav, small-room.wav, stereo-width.wav, short-delay.wav and original-guitar.wav. Fixed NAM normal-input baseline (user had not selected one input level; choice recorded). Independent subtle effects, not stacked: small room10%wet11–37ms early reflections/280ms decaying tail; quiet11/18ms doubles with±.7ms slow modulation; darkened85ms delay9%/7%wet and170ms quiet right echo. Dry center retained, no original blended in, same performance/note metadata. Assertions verify silence, finite/exact10s stereo and RMS matched to dry/no clipping. Tails cut at audition end for comparison. Effects are listening candidates, not verified original processing. Production defaults unchanged; user selection pending.

2026-10-15: User prefers NAM small-room effect and hears a higher-pitched original riff with low backing/sustained sound. Retain NAM+small room as leading effects candidate. Inspection of prior source detector candidates in9–19s shows40 of44 retained polyphonic candidates belowMIDI57(A3), only4 at/above57; current reconstruction still follows one estimated melody. This supports investigating register/layer coverage but does not prove the missing layer's instrument or correct pitches. Do not blindly transpose every note or assert a separate bass/guitar recording. Next proposed audit: original guitar and available bass/support stems, then independently transcribe upper lead and lower support before combining. No new audio/pitch changes or production integration made on this feedback turn.

2026-10-15: Guitar layer audit at exports/singing/guitar-layer-audit-2026-10-15, source 9–19s. Source has bass.wav separately; bass/guitar RMS ratio1.025 (separator estimates, not proof of recording identity). Exported original guitar/bass, guitar upper/lower330Hz listening bands, original guitar+bass, current NAM+small room and current+original bass. Support comparison retains source stem RMS ratio before matching complete clips to.065RMS; all exact10s, finite, peak below.9. The upper band includes harmonics and is not an independently extracted lead. Added bass is explicitly original audio, not recreated. No pitch changes or production integration; listening audit precedes upper-line transcription changes.

2026-10-15: User hears closer upper-range source and useful bass support. Controlled next audition exports/singing/guitar-upper-balance-2026-10-15 compares existing NAM+small room with brighter (45%dry+55%330Hz highpass) and upper-focused highpass, solo and with original separated bass. Same notes; no octave shifts or new transcription. Guitar levels matched before mixing; source guitar:bass RMS ratio retained, final.065RMS/peak<.9. All six exact10s stereo finite. This tests spectral balance only and does not recover missing upper notes. Original bass explicitly labelled. Production unchanged; user listening pending.

2026-10-15: User requested brighter/higher pitch without bass, recognizing bass will help later. Auditions exports/singing/guitar-brighter-higher-2026-10-15: brighter-plus-2/5/12.wav. Same48-note source-derived timing, velocities and extended holds; transpose MIDI before Green SFZ synthesis, then real NAM normal-level capture, preferred small room and45%dry/55%330Hz upper-range blend. No bass or original layered in. All exact10s stereo finite, level matched. Pitch variants are listening experiments, not verified correction to original melody. App defaults unchanged; results/report/logs retained.

2026-10-15: Integrated approved brighter +2 / small-room NAM guitar as separate replacement guitar-bright-room, labelled Bright room guitar · NAM · +2 in Cover Builder and Edit tracks. Existing clean/distorted and library sounds retain their routes. New route forces Karoryfer Green SFZ, source-supported two-stage holds (.45s then1.2s), source dynamics15–100,1.1s release,+2 semitones, actual local NAM JCM800 full-rig capture,10%small room and45%dry/55%330Hz upper balance. No bass added automatically; existing mix controls govern bass. App instrument pipeline is mono: room channels averaged before brighter balance, unlike stereo auditions. Input/output levels normalized over selected excerpt, so loudness can differ from normalized9–19s listening examples. MIDI exports shifted notes; detection remains estimated and no cleaner transcription promised.

Local NAM renderer/capture are required; actionable missing-setup error before transcription. Capture remains local and not redistributed; NAM attribution copied into generated replacement output alongside instrument attribution. Native style/stem allowlists, frontend persistence, builder dropdown and review/save validation include the new option. Resource mapping already bundles arrangement_replacement.py; no new runtime script required.

Verification: frontend179 tests,177passed2optional skipped; native65passed; production build and local native build successful. Updated replacement backup persistence test passed; null/empty companion-stem regression and missing-NAM preflight passed. Actual source19s render produced48 finite notes with +2 MIDI, exact456000 samples and peak<.901. Integration-check output at exports/singing/bright-room-integration-check (audition only). Manual checks pending: new option in both menus; solo preview without bass; checked preview/save follows choice; reopen saved mix retains metadata, existing clean/distorted remain selectable.

2026-10-15: Added three additional NAM guitar replacement categories in Cover Builder and Edit tracks: Warm crunch (guitar-nam-warm), Rock rhythm (guitar-nam-rhythm), Sustained lead (guitar-nam-lead). Available local capture remains honkkis JCM800 full-rig48k; these are voicing/performance/effect presets of that one capture, not new amp captures or sax/piano/bass instrument models. Warm:0 pitch shift,-6dB input,.85s release,no upper boost,8%room. Rhythm:0shift,normal input,.65s release,20%upper balance,4%room. Lead:0shift,normal input,1.25s release,35%upper balance,10%room,8%dark85msdelay. Existing approved Bright room +2 parameters unchanged. No new downloads, no automatic bass. Local capture excluded from redistribution; output attribution included for every NAM variant. All preserve the estimated underlying melody; no improved transcription claimed.

Native/Python style routing, replacement dropdowns, readable saved-stem labels, save filtering and backup validation support all variants. Missing local NAM assets reject before transcription for all four. Test results: frontend178passed/2optional skipped(180total), native65passed, builds successful. Direct/null-stem regression passed. Real renderer verified all four on19s source: exact finite mono output, no clipping,10s9–19s auditions in exports/singing/nam-guitar-categories-2026-10-15. Waveforms distinct with pairwise RMS difference>.001; Bright room matches previous integration result within one PCM16 step. Manual listening/preview/save checks pending user availability.

2026-10-15: Cover Builder now offers Preview detected notes (drums: Preview detected hits) under Original instrument, plus Preview original recording. Per-track start/duration defaults0–15s and validates1–60s within source length before launch. Uses originalPath and selected source role through existing arrangement pipeline, rendering melodic interpretations with the same separate-library piano sound for comparison; Piano uses approved71-note preserving path, Other/melody uses estimated single line. Drums use standard kit. Loads only requested instrument stem into shared player, not vocal/mix; no change to track.path, applied replacement, original file or pending replacement candidate. Native poll/stop flow reused. These are rendered interpretations rather than isolated source instruments or a replacement-tone preview.

Verification: production build passed, frontend178passed2optional skipped. Real15s prepared-piano check produced71notes in Piano mode and25notes in Other/melody, exact finite360000samples each. Exports at exports/singing/detected-notes-preview-check. No native implementation change. Manual checks: compare same section under Piano/Other; original recording plays solo; applied replacement stays unchanged; invalid preview bounds reject before generation.

2026-10-15: Added Whole song detected-note preview in Cover Builder. Source is rendered in contiguous evenly sized1–60s sections then combined into one seekable audio preview. Default short preview remains15s; Whole song disables section controls. Validation before work rejects invalid/nonfinite/out-of-source ranges; bounded1s–1h source supported. Sectioned transcription can differ at boundaries; holds stop at section ends. Preview is an audition only, no automatic apply or library entry.

Added Instrument customizer to melodic replacement choices: pitch -12..+12 whole semitones and extra note hold0..1.5s, Reset to preset. Pitch edits rendered notes before synthesis/NAM, not a post-audio speed change. NAM pitch is an absolute override of preset register (Bright room defaults+2, can now set0); other instrument options retain their existing automatic register placement plus chosen semitone offset. Hold extends until next same-pitch attack/section end, retaining overlaps across different pitches; sample decay still limits sustain. Native and Python validate settings before processing. Drums hide melodic controls and reject nonzero tuning. Detected-note previews remain untuned source-method comparisons. Existing presets retained as shortcuts; no category migration/removal.

Settings travel with the generated preview candidate and only persist on Use replacement. Applied track.custom survives builder library saves/backups; reopening restores selected applied replacement and settings. Pitch/hold or replacement changes invalidate pending candidate. Keep original recording safe; Restore original clears applied custom metadata. Old tracks without settings keep prior preset defaults. Piano approved dynamics/timing chain unchanged at default; NAM profile defaults copied before override, never mutated.

Verification: frontend180passed2optional skipped(182total), native66passed, production build successful. Regression checks cover invalid tuning (native/Python), hold boundaries and input immutability, saved settings and defaults, whole-song288s contiguous bounded coverage and invalid excerpts. Real prepared-piano15s render retains71notes with+2MIDI and extended ends; NAM19s render honors pitch0 override of+2, finite exact-length output and defaults unchanged. First new test failed on cross-VM object prototypes, fixed test comparison to use serialized values; no runtime failure. Native build/resource refresh completed. Manual tests pending: whole song scrub late section; Piano/Other same-section comparison; pitch/hold generate then apply; reopen saved builder and reset/restore.
