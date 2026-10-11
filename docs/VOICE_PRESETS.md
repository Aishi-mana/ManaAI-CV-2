# Mana voice presets

## Automatic reply emotion (Mana v2)

Default 2 was approved on 2026-10-11 and replaces the story-reading automatic fallback. Its full 9.76-second recording is preserved unchanged as `default-r2.wav`, paired with its English transcript draft. Matching saved story-reference path/transcript pairs migrate together; custom edits and other emotion references remain intact. Neutral/thinking/surprised/missing tags and automatic-mode singing now use this brighter fallback. Speed and volume settings are unchanged.

Chat now recognizes `cheerful` and `gentle` as full emotion tags, alongside `angry`, `sad`, `worried` and the existing tags. Tags are removed from display/synthesis text and forwarded to voice routing and companion state. The runtime formatting instructions list all supported tags even for older custom prompts, and distinguish tone demonstrations from claims about actual feelings. Avatar Cheerful/Gentle use existing happy/neutral artwork; Angry uses existing thoughtful/sad artwork until dedicated angry art is supplied.

Automatic mode does not slow speech: rate 0 maps to speed factor 1.0, and voice volume is unchanged. Its Default fallback is the supplied Mana v2 story-reading excerpt, rather than the older legacy-generated reference. That change in reference delivery can affect energy even at the same speed. Reference conditioning is not an exact recording replay or a trained guarantee of voice identity.

The replacement Cheerful audition was approved on 2026-10-11. Automatic now uses `cheerful-r2.wav`, the 5.25-second excerpt of the updated source, with its matching English transcript. Saved settings/backups migrate the exact old path/transcript pair together; custom reference edits remain intact. Earlier reference and audition files are retained for comparison.

As of 2026-10-11, Automatic is the new custom-voice mode. It routes each completed reply's emotion tag to the supplied English Mana v2 references: happy/excited → Cheerful; worried → Worried; sad → Sad; angry → Angry; sleepy/embarrassed → Gentle. Neutral, thinking, surprised and missing/unknown tags use Default. The selection happens per request; it does not overwrite a reference or rewrite chat text. Manual Speak, automatic read-aloud and hands-free all forward the reply's emotion. New settings and settings predating these references initially use Automatic; a saved manual selection remains available.

Default is cut at a quiet phrase boundary to 6.50 seconds and Gentle to 6.85 seconds. The remaining references are 5.68–9.92 seconds. Originals in `assets/voice/` remain intact. Prepared copies, English transcript drafts and hashes are under `data/custom-voice/references/mana-v2/`. The current automatic reference editor displays and edits Default; other reference entries are preserved in settings/backups. Automatic always uses English reference conditioning, applies the provisional Eye-shee pronunciation for English replies, and uses the normal rate. Singing uses the Default fallback because singing conversion has no reply emotion tag.

All six identical-text synthesis checks returned non-silent WAVs under `exports/mana-v2-audition/`; this does not establish emotional quality. Listening approval and exact transcript verification remain pending. These recordings condition the existing GPT-SoVITS model; no new emotion model has been trained.

The user approved Mana Legacy's neutral, thoughtful and gentle sentence auditions, followed by the brisker cheerful audition, on 2026-10-10. All four deliveries are usable. The cheerful reference still limits emotional range; richer expression remains future reference/training work. This approval covers generated delivery, not a verified training transcript or a trained emotion model.

Mana Legacy is an additional preset using the user-approved 4.66-second legacy-generated English recording, copied unchanged to `data/custom-voice/references/mana-legacy.wav`. It uses an editable English reference transcript, currently ASR-derived. Existing Default selection is preserved. English custom speech with this preset substitutes `Eye-shee` for the whole word `Aishi` only in the synthesis request; chat, history and exports retain the original spelling. This pronunciation is provisional and needs listening approval. Other presets are unaffected.

Run `scripts/voice-preset-smoke.py --emotions` for neutral, cheerful, thoughtful and gentle sentence auditions using the same Mana Legacy reference. These are sentence-delivery comparisons, not four newly trained emotion models. Their output is in `exports/legacy-emotion-audition/`.

Mana Legacy also has a persistent manual delivery selector. Cheerful adds two rate steps (1.08x synthesis speed at the standard rate), with the final rate bounded to the existing slider limits. Neutral, thoughtful and gentle retain the approved pace and reference; their expression follows the reply text. This is a modest pacing experiment, not a trained cheerful voice. It does not rewrite reply words or automatically switch based on chat mood. `--upbeat` generates the matching cheerful audition under `exports/legacy-cheerful-upbeat/`.

Custom voice setup provides Default, Cheerful, Thoughtful and Gentle. Selection is manual and saved across restarts and backups. Each preset keeps its own recording and editable transcript; selecting a style does not overwrite the Default reference. Singing uses the selected recording as well, through Seed-VC.

Default retains the Japanese main recording already configured in Mana. The user's preferred combination is that recording, the confirmed romaji transcript, and English GPT-SoVITS prompt/reply conditioning. The previous automatic Japanese-script conversion is reversed for the recognized main-reference transcript. Other user-entered paths and transcripts are preserved.

Reference language and reply language are independent. All four approved presets now use romaji transcripts with English reference conditioning and English replies, following the user's listening preference. The reference-language control describes how GPT-SoVITS processes the transcript, not the language spoken in the WAV. Recognized old Japanese-script style drafts migrate to romaji without changing their recordings or overwriting custom transcript edits. The uncertain wording in those drafts remains uncertain after romanization. These controls do not translate the message.

The three approved style recordings are copied unchanged to `data/custom-voice/references/`. `provenance.json` records their source files and SHA-256 hashes. These local WAVs and external model files are not embedded in backups; settings, paths, selection and transcripts are included. Preserve the audio files when moving Mana to another computer.

Delivery approval does not verify every transcript word. The style transcripts are draft ASR transcriptions with spelling/punctuation cleanup. Check Thoughtful's opening and Gentle's HP phrase against the audio before treating them as exact. Editing a selected transcript changes only that preset. No automatic mood switching or fine-tuning is introduced.

## Acceptance checks

1. Select Default, then speak a short English sentence with English reference conditioning, romaji transcript and English reply. Confirm the delivery sounds appropriate.
2. Speak the same sentence with Cheerful, Thoughtful and Gentle. Confirm each delivery sounds appropriate; references guide delivery but do not guarantee an exact emotion.
3. Return to Default and confirm its path/transcript remain intact. Restart Mana and confirm the selected preset and language controls persist.
4. Create and restore a backup, then confirm preset selection and reference edits survive. Switch back to the preferred preset after testing.

The automated smoke script `scripts/voice-preset-smoke.py` starts an isolated CPU service on port 9883, generates one English sentence from each Japanese reference, checks for non-silent WAV output and stops its owned service. Output goes to `exports/voice-preset-smoke/`. Listening checks remain necessary for voice quality.
