from pathlib import Path
p=Path('docs/ROADMAP.md');s=p.read_text(encoding='utf-8')
changes={
'- [ ] Music Studio stage 2: artwork, saved project settings, mix/export controls and reviewed chat excerpts without reconversion':'- [x] Music Studio stage 2: artwork, saved project settings, mix/export controls and reviewed chat excerpts without reconversion (implemented; see MUSIC_STUDIO.md)',
'- [ ] Music Studio stage 3: local instrument-recreation workflow, followed by prompt-driven original songs after tool evaluation':'- [x] Music Studio stage 3: instrument melody workflow and prompt-driven original songs (user accepted)',
'- [ ] Separate music studio: prompt-based original songs and uploaded-song covers':'- [x] Separate Music Studio: original songs, uploaded-song covers and dedicated player/editor menus (user accepted)',
'- [ ] Cover vocal extraction, Mana vocal conversion and regenerated Mana-style instrumentation':'- [x] Cover vocal extraction, Mana conversion and instrument replacement workflow (user accepted)',
'- [ ] Anime-style short arrangements and full-length songs; editable lyrics/style, progress/cancel, preview and export':'- [x] Short/full-song workflows, editable lyrics/style, progress/cancel, preview and export (current supported workflows accepted)'}
for a,b in changes.items():
 assert a in s,a
 s=s.replace(a,b)
s=s.replace('- [x] Explicit hands-free Whisper conversation loop', '- [x] Saved-song requests through hands-free, microphone pause during songs, automatic resume and Stop (user passed all checks, 2026-10-18)\n- [x] Cover Builder clip fades and instrument note editor with compact dark tools dock (implemented; UI improved with user feedback)\n- [x] Word-by-word karaoke with editable lyrics (user accepted)\n- [x] Explicit hands-free Whisper conversation loop')
p.write_text(s,encoding='utf-8')
