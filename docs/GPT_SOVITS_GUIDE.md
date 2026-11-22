# How Mana uses GPT-SoVITS

Checked against this project’s voice implementation on November 19, 2026.

Mana runs GPT-SoVITS locally to turn reply text into a reference-conditioned speech WAV. For an English trained voice, a second local worker applies the selected RVC voice model before playback. The same speech controls handle the resulting audio, volume, Stop button, and mouth animation.

The available chat profiles are **Mana · trained**, **Mousey v2 · trained**, and **Mana · reference voice**. The default configuration selects Mana’s trained profile. Chat and singing have independent profile selectors.

For everyday use, follow these steps.

1. Open **Voice settings** in the chat toolbar.
2. Select **Mana · GPT-SoVITS** as the speech voice.
3. Expand **Custom voice and singing setup**. Choose the **Chat voice** profile and delivery preset.
4. Keep **Automatic** selected for delivery to follow each reply’s emotion. A manually selected preset uses its own saved recording and transcript.
5. Click **Start custom voice** and wait for the Ready message. Selecting the custom speech voice also requests startup automatically.
6. Use **Speak** on a reply. Enable automatic read-aloud in the voice controls if desired.
7. Use **Stop** to interrupt speech. Use **Stop custom service** to shut down the managed GPT-SoVITS service and converter.

The setup’s **Runtime paths and model settings** section contains these project defaults. Saved settings can override them.

| Setting | Default |
| --- | --- |
| GPT-SoVITS Python | `C:/Users/Admin/miniconda3/envs/GPTSoVits/python.exe` |
| GPT-SoVITS folder | `C:/AI/GPT-SoVITS` |
| Local address | `127.0.0.1` |
| Local port | `9882` |
| Base speech reference | `C:/AI/GPT-SoVITS/main_reference.wav` |
| GPT weights | `GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt` inside the GPT-SoVITS folder |
| SoVITS weights | `GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s2G2333k.pth` inside the GPT-SoVITS folder |
| Trained conversion Python | `C:/AI/ManaAI-CV-2/data/music-tools/Scripts/python.exe` |

The Python executables, `api_v2.py`, and base reference WAV above existed when this guide was written. The installed service uses CPU inference, full precision, and the v2 configuration. Mana writes `mana-tts-config.json` in its app-data folder, then starts `api_v2.py` bound to loopback. Startup checks `/openapi.json` for the `/tts` route and waits up to three minutes for readiness.

Each synthesis request sends text, reply language, reference WAV path, matching transcript, reference language, and speed to `POST /tts`. The current request settings use WAV output, `streaming_mode=false`, `text_split_method=cut5`, `batch_size=1`, and seed `42`. The UI polls for completion before playing the resulting audio.

For trained English speech, `scripts/trained_chat_worker.py` obtains that GPT-SoVITS WAV and applies the selected RVC converter. It keeps the converter loaded between replies and reloads it when the selected voice changes. The installed checkpoints are defined in `src/core/voiceProfiles.ts`.

| Profile | RVC checkpoint under `C:/AI/ManaAI-CV-2/data/applio-training/engine/logs/` |
| --- | --- |
| Mana · trained | `mana-current-trial-v1/mana-current-trial-v1_50e_2800s.pth` |
| Mousey v2 · trained | `mousey-v2-trial-v1/mousey-v2-trial-v1_50e_8300s.pth` |

Japanese replies use the reference voice route. English trained generation has a five-minute UI deadline, while the reference route has a 190-second deadline. Initial loading can take longer than subsequent replies because the local models need to warm up.

The **Speech guide WAV** and **Matching speech guide transcript** fields describe the same recording. Accurate wording matters for pronunciation. In Automatic mode, the visible editor changes the Default fallback reference. The other emotion references remain in the saved configuration.

Automatic delivery maps happy, excited, and cheerful replies to Cheerful; worried to Worried; sad to Sad; angry to Angry; and sleepy, embarrassed, or gentle replies to Gentle. Other emotion tags use Default. Reference conditioning controls delivery, and the RVC selection controls the final trained voice. Reference language and reply language are separate settings. Automatic mode uses English reference conditioning. The legacy main recording has a project-specific romaji transcript approved for this setup.

English synthesis normalizes curly apostrophes so contractions reach GPT-SoVITS correctly. Automatic and Legacy presets also pronounce the whole name `Aishi` as `Eye-shee` in the synthesis request. The displayed chat text retains its original spelling.

If speech fails, use the following checks.

| Symptom | Check |
| --- | --- |
| Startup timeout | Confirm the Python, repository, and weights paths. Read `custom-voice.log` in Mana’s app-data folder. |
| Wrong voice | Check both the main speech voice and the Chat voice profile. The singing profile is configured separately. |
| Unexpected pronunciation | Check the selected reference transcript, reference language, and reply language together. |
| Trained conversion failure | Read `trained-chat.log`. Confirm the music-tools Python and selected RVC checkpoint exist. Select Mana · reference voice if you want to use the reference route. |
| Silence | Check reference audio and the service log. Mana checks returned WAV samples before playback. |
| Service or settings need a restart | Stop playback, click Stop custom service, then Start custom voice. |

Settings backups retain profile selections, file paths, presets, and transcripts. Keep the referenced WAV files, model checkpoints, Python environments, and GPT-SoVITS installation when moving the project to another computer.

Singing uses the project’s singing/conversion pipeline and its independent voice selection. The Singing Python and Seed-VC fields support that setup. The voice preset history and singing guide provide additional context.

The implementation entry points are [CustomVoiceSetup.tsx](C:/AI/ManaAI-CV-2/src/components/CustomVoiceSetup.tsx), [customVoice.ts](C:/AI/ManaAI-CV-2/src/core/customVoice.ts), [customVoiceService.ts](C:/AI/ManaAI-CV-2/src/core/customVoiceService.ts), [useSpeech.ts](C:/AI/ManaAI-CV-2/src/core/useSpeech.ts), [custom_voice.rs](C:/AI/ManaAI-CV-2/src-tauri/src/custom_voice.rs), and [trained_chat_worker.py](C:/AI/ManaAI-CV-2/scripts/trained_chat_worker.py). Related guides are [VOICE_PRESETS.md](C:/AI/ManaAI-CV-2/docs/VOICE_PRESETS.md) and [SONGS.md](C:/AI/ManaAI-CV-2/docs/SONGS.md).
