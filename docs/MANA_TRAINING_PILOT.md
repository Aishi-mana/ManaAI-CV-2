# Mana GPT-SoVITS training pilot

The initial 20-recording generation completed on 2026-10-10. All WAVs load, file hashes are distinct, and the review flags remain false. Listening and exact transcript approval are the next gate before creating a verified training list.

The next experiment transfers legacy Mana's approved vocal identity through recordings, rather than loading RVC weights into GPT-SoVITS. New Mana continues to use GPT-SoVITS for playback. The old Kokoro/RVC pipeline is used offline to create candidate training material.

`scripts/prepare-mana-training.py` produces 16 English training candidates and four separate held-out lines under `data/custom-voice/training-pilot/`. Each sentence is plain text with no emojis. Unlike the old generation function, it concatenates every Kokoro audio chunk instead of retaining only the last one.

The source profile matches the legacy app's current partner profile: Kokoro `af_heart`, pitch +9, index rate 0.85, FCPE pitch extraction, ContentVec and protection 0.33. It uses the supplied `ManaVoicev1.pth` and `.index` files. These settings reproduce the legacy pipeline; they do not train a new emotion model. Sentence delivery labels describe intent and still require listening review.

The manifest records each exact generation prompt, source configuration, WAV duration, rate, clipping fraction, hash and review status. `candidate-annotations.list` uses GPT-SoVITS's `audio|speaker|language|text` format, but the text is not marked verified until the produced speech is checked. Held-out recordings remain outside this candidate list.

## Review before training

1. Listen for consistent Mana identity, complete words, natural openings and conversion artifacts.
2. Check every transcript against the produced audio. The generation prompt is not proof that every word was spoken correctly.
3. Reject or regenerate clipped, distorted, truncated or mispronounced samples. Do not automatically denoise clean synthetic recordings.
4. Keep the four held-out lines out of training. Compare their output from the fine-tune against the existing Mana Legacy reference on the same text.

No training is started by this preparation script, and no active voice selection or model weights are changed. Generated recordings may carry artifacts from the source pipeline, so this is a small pilot before building a larger corpus. English recordings use English transcripts and English language labels.
