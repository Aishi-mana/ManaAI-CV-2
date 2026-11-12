from pathlib import Path
root=Path(__file__).resolve().parents[1]
docs=root/'docs'

def current_note(name,text):
 p=(root/'README.md') if name=='README.md' else docs/name
 s=p.read_text(encoding='utf-8-sig')
 marker='<!-- current-status-2026-11-06 -->'
 if marker in s:return
 first,sep,rest=s.partition('\n')
 note=f'\n{marker}\n## Current status — 2026-11-06\n\n{text}\n\n'
 p.write_text(first+'\n'+note+rest.lstrip('\n'),encoding='utf-8')

current_note('README.md','See [current status and remaining work](docs/CURRENT_STATUS.md) for the reconciled roadmap, known defects and user test queue. The current development milestone remains V1.x. The latest Create Cover preview/player fix is installed and awaits user testing; no installation or generation job is pending.')
current_note('ROADMAP.md','See [CURRENT_STATUS.md](CURRENT_STATUS.md) for the cross-checked installed/accepted/pending distinction and current test queue. Trained Mana and Mousey voices, wearable generation/review, 1,000-song storage capacity and optional genre backing are implemented. Cover distortion, recognition edge cases and latest preview/genre listening acceptance remain open. Historical tuning notes below retain their original dates and evidence limits.')
current_note('MUSIC_STUDIO.md','The authoritative music snapshot and return-test queue are in [CURRENT_STATUS.md](CURRENT_STATUS.md). Create Cover now has local preview playback/seeking and explicit Save of the same audio; no automatic library save. Genre backing offers Original/Rock/Jazz/Pop, with short auditions and a 180-second genre limit. Shared library capacity is 1,000, including Cover Builder. Disk recovery is manual. Mana/Mousey trained voices use RVC; reference voices use Seed-VC. Latest installation succeeded on 2026-11-06. Vocal distortion remains unresolved. Older limits, default backing levels, pending-install notices and Seed-VC-only descriptions below are historical.')
current_note('MUSIC_STUDIO_PLAN.md','Stages 1–3 are implemented within their accepted scope. This document is a chronological plan/evidence history, not the current backlog. See [CURRENT_STATUS.md](CURRENT_STATUS.md): latest preview/player and genre flows are installed, with user tests pending; vocal quality remains open. The user reauthorized singing-quality work in November, superseding older blanket deferrals. Do not regenerate candidates without a current request.')
current_note('VOICE_PRESETS.md','The current voice choices are Mana trained v1, Mousey v2 trained, and Mana reference voice. Chat and singing select independently. Both trained voices have user-approved 50-pass RVC checkpoints; English chat generates a GPT-SoVITS speech guide then applies the selected converter. Emotion references guide delivery, not a separately trained emotion model. Japanese chat retains the reference route. Voice settings now open a dedicated modal; the user accepted this presentation. Older audition/transcript notes below remain historical or optional validation. See [CURRENT_STATUS.md](CURRENT_STATUS.md).')
current_note('SONGS.md','Current covers separate lead vocal/backing, convert with the selected trained Mana/Mousey RVC model or reference Seed-VC route, then remix; original backing defaults to 100% for new forms. Optional genres restyle only the accompaniment. Create Cover previews require explicit Save. Whisper is amplitude-endpointed (about 1.2-second pause, eight-second no-speech stop, 15-second turn cap); hints no longer include song titles or example greetings. Successive hands-free turns were user-confirmed; silent hallucination and dropped song-command words remain retests. See [CURRENT_STATUS.md](CURRENT_STATUS.md); older single-route/default-reference notes below are historical.')
current_note('MANA_TRAINING_PILOT.md','This is the archived optional legacy GPT-SoVITS pilot, not the current production voice-training path or a blocker. Approved Mana and Mousey voices were subsequently trained separately with RVC using their reviewed datasets. Dedicated GPT-SoVITS fine-tuning and older exact pilot transcript approval have not been completed. See [VOICE_PRESETS.md](VOICE_PRESETS.md) and [CURRENT_STATUS.md](CURRENT_STATUS.md).')
current_note('PROJECT_STRUCTURE.md','Current music routing is in src/core/voiceProfiles.ts, scripts/trained_voice.py, scripts/trained_chat_worker.py, scripts/singing_job.py and scripts/cover_genre.py; Create Cover/Builder UI is in src/components/SingingDrawer.tsx and CoverBuilder.tsx. CURRENT_STATUS.md owns the status audit and NEXT_CHAT_HANDOFF.md the compact next-session state. Older handoff history is retained under docs/archive. No model/media files are embedded in ordinary JSON backups.')
current_note('DEFERRED_WARDROBE.md','See [CURRENT_STATUS.md](CURRENT_STATUS.md). Editable layers/history, recovery, creative clothing generation, bangs/back-hair generation, accessory creation and their schedules are implemented; earlier deferrals of these features are superseded. Automatic garment cleanup remains OFF by user choice. Manual behind-body occlusion and review are the accepted workflow. Complex accessories, broader style/fit consistency and unobserved live schedule tests remain open; do not resume saved-outfit edits or automatic cleanup experiments.')
current_note('GENERATED_OUTFITS.md','The accepted production scope is clothing-only generation → fit/size/check → editable review/save. Automatic garment cleanup is off by user choice; manual Atelier occlusion preserves garment pixels. Hair/accessory creation, independent schedules and review tools are implemented. Historical cleanup experiments below are not the current instruction. Broader fit/style reliability remains a limitation; see [DEFERRED_WARDROBE.md](DEFERRED_WARDROBE.md) and [CURRENT_STATUS.md](CURRENT_STATUS.md).')
current_note('ATELIER.md','Current Atelier includes editable review projects/drafts, manual fill/background erasers, point selection, thinner selection lines, toolbar zoom/Ctrl-wheel, default wheel scrolling, front/behind-body placement and Save edits to review beside Continue to save. Setup/drafts can collapse. Do not treat the early session-only/flattened-export description below as a statement that the later project/draft features are missing. Full wardrobe edge-case and schedule acceptance is not implied; see [CURRENT_STATUS.md](CURRENT_STATUS.md).')
current_note('WARDROBE_TEST_CHECKLIST.md','Retain unchecked items as unverified; earlier user acceptance of individual fits/tools does not pass every case here. Current automation performs clothing generation/fitting and leaves garment cleanup/occlusion to manual review. Hair/accessory creation and schedules exist. Do not run new wardrobe experiments as part of the music/doc audit. See [CURRENT_STATUS.md](CURRENT_STATUS.md) for the latest music test queue.')
current_note('CHANGELOG.md','2026-11-06 reconciliation: approved independent Mana/Mousey voice choices; clarified speech-guide versus final identity; hands-free pause/silence guards and reduced prompt echo hints; library capacity 1,000 and manual discovery; corrected Builder Save gate/Stop status; added optional instrumental-only genre remix; installed Create Cover Play/seek/Stop plus explicit exact-preview Save. These are implemented changes, not proof of universal vocal quality. See [CURRENT_STATUS.md](CURRENT_STATUS.md) for remaining defects and verification provenance.')
current_note('DEVLOG.md','2026-11-06 documentation-only audit reconciled the roadmap with source, build/test logs and user reports. Added CURRENT_STATUS.md, corrected obsolete voice/wearable roadmap entries, recorded open vocal/recognition/draft/backup gaps, and compacted NEXT_CHAT_HANDOFF.md while preserving its full history in docs/archive. No generations, model downloads, saved-data edits or new feature changes were performed during this audit.')

p=docs/'ROADMAP.md';s=p.read_text(encoding='utf-8')
changes={
 '- [ ] Custom trained Mana voice and singing quality/timing refinement':'- [x] Separate approved trained Mana v1 and Mousey v2 RVC voice profiles for chat and songs\n- [ ] Broader singing articulation, distortion and timing refinement (known defects remain)',
 '- [ ] Stable Mana voice profile and expression references; optional dedicated speech/singing fine-tuning':'- [x] Approved trained voice identities and independent persistent chat/singing selection\n- [ ] Broader expression consistency; optional dedicated speech/singing fine-tuning beyond the installed RVC models',
 "- [ ] Resolve sung high-note distortion and trembling (deferred at the user's request; see MUSIC_STUDIO_PLAN.md)":"- [ ] Resolve remaining sung-word distortion, sharp notes and trembling; November work reauthorized, cause not yet isolated (see CURRENT_STATUS.md)",
 '- [ ] Listening approval and exact transcript verification for the pilot, followed by GPT-SoVITS fine-tuning and held-out sentence evaluation':'- [ ] Optional archived legacy GPT-SoVITS pilot: exact transcript/listening approval, fine-tuning and held-out evaluation; not a prerequisite for the approved RVC voices',
 '- [ ] Future: Mana-designed outfit concepts, with a separate reviewed process to turn artwork into usable avatar assets (requested2026-10-19; deferred).':'- [x] Mana-designed clothing concepts and clothing-only PNG fitting/editable review workflow (implemented October 2026; quality remains review-dependent).',
 '- [ ] Convert generated outfit concepts into usable layered/rigged avatar assets; no automatic installation.':'- [x] Editable layered transparent PNG wearable generation and reviewed installation\n- [ ] General rigged/animated avatar-asset export beyond the current PNG layer workflow',
 '- [ ] Clothing-only transparent PNG generation with avatar-fit/alignment and reviewed installation; preserve character layers (clarified2026-10-21).':'- [x] Clothing-only transparent PNG generation with avatar-fit/alignment and reviewed installation; preserve character layers (implemented; automatic cleanup remains off).',
 '- [ ] Additional seasonal clothing artwork (user has no new outfit assets yet)':'- [ ] Broader seasonal artwork variety and visual acceptance; generation and seasonal inventory assignments already exist',
}
for before,after in changes.items():
 assert before in s,before
 s=s.replace(before,after)
p.write_text(s,encoding='utf-8')

history=docs/'archive/NEXT_CHAT_HANDOFF_through_2026-11-06.md'
history.parent.mkdir(parents=True,exist_ok=True)
if not history.exists():history.write_text((docs/'NEXT_CHAT_HANDOFF.md').read_text(encoding='utf-8-sig'),encoding='utf-8')
(docs/'NEXT_CHAT_HANDOFF.md').write_text('''# Next chat handoff — 2026-11-06

Start with [CURRENT_STATUS.md](CURRENT_STATUS.md) for the reconciled roadmap, known defects and return-test queue. Full prior session history is preserved in [the handoff archive](archive/NEXT_CHAT_HANDOFF_through_2026-11-06.md). Do not treat old blocked-install or cleanup notes there as current instructions.

## Latest request and completed work

The user asked to update docs, cross-check the roadmap, and list remaining work while they are away. This pass changes documentation only. The user will test the last music UI changes on return; do not run more music/image/training experiments now.

Create Cover preview/player fix is installed successfully. It renders an unsaved preview, offers Play/Pause/seek/Stop on Create Cover, and explicitly saves that exact audio without another conversion. Native `previewOnly` requests stay out of disk recovery. Existing already-saved results are untouched. Actual Tauri build/install succeeded on 2026-11-06 (`work/cover-preview-flow-install.log`); no app-close approval or installation is pending.

## Current production facts

- Library capacity is 1,000 in validator, native recovery and Cover Builder Save; opening Studio no longer auto-imports old disk results. Remove from library keeps audio files.
- Chat/song selections independently offer approved Mana trained v1 and Mousey trained v2. Trained conversion is RVC; reference covers use Seed-VC. English trained chat uses GPT-SoVITS guide → selected RVC converter. A Mana guide under Mousey is expected. Japanese chat uses the reference route.
- Mana checkpoint: `data/applio-training/engine/logs/mana-current-trial-v1/mana-current-trial-v1_50e_2800s.pth`, SHA256 `e810e3f7a8f948ba42bf459f847b8af66b2c56f042ca975b879bc317cfe9cd77`.
- Mousey checkpoint: `data/applio-training/engine/logs/mousey-v2-trial-v1/mousey-v2-trial-v1_50e_8300s.pth`, SHA256 `3a137ce384ea31ff341ead94ec4f71ae7e45e49077aabd5b0a65a6ee9f510efd`. User approved voice/squeak at 50 passes. Neither trained model/profile is to be silently replaced.
- Genre covers: separated accompaniment only → ACE-Step cover-nofsq → remix with separately converted singer. Rock/Jazz/Pop installed, 20-second excerpt default, 180-second genre limit. No lyric/singer regeneration by ACE-Step in this flow. Rock real pipeline passed; phrase alignment and Jazz/Pop listening are pending.
- Hands-free successive turns were user-confirmed working. Keep about 1.2-second quiet cutoff, eight-second no-speech discard and 15-second turn cap. Proper-name-only hints replaced example greetings/song titles after a reported silent-input hallucination. Live silent/song-command retests remain open; do not synthesize commands from bare titles.
- Wardrobe automation fits clothing and leaves cleanup/occlusion to manual review. Do not restart automatic garment cleanup or edit saved outfits. Hair/accessory generation/schedules and editable review already exist.

## Pending work / constraints

1. Await user tests of inline cover preview playback, explicit save/no regeneration, persistence of saved preview, genre sound/alignment and hands-free silence/song requests.
2. Cover vocal quality is NOT fixed. User reports distorted/unclear “happen” at comparison 6s and 15s, sharp “do” at 22s (full source ~24s/33s/40s). Compare source, extracted guide and converted vocal before further changes. Restored backing alone did not solve it. Assistant has no direct audio-listening capability in this runtime; do not claim to hear results.
3. Repetitive replies/invented game context were explicitly deferred by the user. Do not conflate reply-model behavior with voice conversion.
4. Cover Builder draft and Create Cover unsaved preview are memory-only. Save before closing. Durable draft/restart recovery remains missing.
5. Backups are metadata/settings, not all media/models; JSON restore has a 20 MB guard. The new 1,000-item capacity does not prove artwork-heavy backups fit.
6. GPU scheduling, stronger genre timing/long-song support, broader speech expression/articulation, wardrobe style/edge consistency, semantic recall and broader coding competence remain open. V2 room and V3 Manaverse are future milestones.

## Verification and working rules

- Latest full foundation run before preview fix: 340 passed / 2 optional skipped. Subsequent actual SingingDrawer hook/JSX preview/save integration test passed (`work/cover-preview-flow-tests.log`). Two genre Python tests, native checks and packaged frontend/native builds passed. User acceptance of the last UI is pending.
- Workspace is very dirty from authorized prior work; never reset it. No active jobs/goals/agents. No subagents unless explicitly authorized.
- Do not download models; user wants links/destinations if a download becomes necessary. Existing music-tools Python, installed ACE-Step and pinned RVC assets are available.
- No app termination. If future executable installation is locked, finish tests first and ask user to save/close; current install is already complete.
''',encoding='utf-8')
print('Updated 14 documentation entry points, reconciled roadmap items, archived prior handoff and wrote compact current handoff.')
