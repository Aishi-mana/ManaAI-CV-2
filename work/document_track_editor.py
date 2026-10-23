from pathlib import Path
p=Path('src/components/BuilderTimeline.tsx');s=p.read_text(encoding='utf-8').replace('<div className="editor-selection">','<div className="editor-selection" key={selected.id}>');p.write_text(s,encoding='utf-8')
p=Path('docs/MUSIC_STUDIO.md');s=p.read_text(encoding='utf-8');s+='''

## 2026-10-17 — Cover Builder waveform track editor, first stage

Added a shared song-time ruler and colored waveform lanes in Cover Builder, with selected-track sound/settings below. Existing pitch and extra-note-hold instrument controls remain in that inspector and still require preparing/applying a replacement; dragging/trimming does not trigger detection or generation. Waveforms are calculated locally from current saved audio and cached by path for the mounted editor.

Tracks support pointer/keyboard movement, source Start/End trims, trim handles, reset trim, volume, mute, solo and row reordering. Snap is 0.1 seconds (off allows finer dragging), with zoom and horizontal/vertical scrolling. Trims are non-destructive source coordinates: song position = source position + timing offset. Trimming the left edge leaves the remaining audio at its original song position. Negative offsets still crop material before song zero. Backing-section gates remain source-local and combine with trims; solo backing preview still concatenates selected ranges, whereas the mix preserves their song positions.

Prepare mix preview uses the current arrangement; the ruler seeks only a prepared full mix. Track/selected-section previews are labeled separately and do not drive the song playhead. Changing tracks invalidates a prepared mix so playback cannot silently use an old arrangement. Trim/solo metadata survives library save/reopen and backup validation; saved mix/vocal/instrument outputs honor it. Solo affects preview and saved mix, with mute taking precedence. Original files remain intact. One clip per track in this stage; split/copy/multiple clips, undo history, note editing and direct pitch processing of original audio are not implemented.

Verification: frontend 192 passed / 2 optional skipped; focused trim tests cover exact output samples, negative offsets, backing gates, validation and restored metadata. Browser fixture verified selection, keyboard and pointer movement, pointer trim, full-mix seek and stale preview removal. The browser fixture uses existing audio to test controls; labels are illustrative, not a new music rendering. Production/native build results are recorded in NEXT_CHAT_HANDOFF.md.

App checks: (1) Open a saved Builder project and select tracks; waveforms and sound controls match selection. (2) Move/trim a clip, prepare mix, seek and listen for correct placement; Reset trim restores source length. (3) Try mute/solo and existing pitch/hold replacement preview/apply. (4) Save/reopen, verify trim/offset/solo retention and unchanged original recording.
''';p.write_text(s,encoding='utf-8')
p=Path('docs/NEXT_CHAT_HANDOFF.md');s=p.read_text(encoding='utf-8');s+='''

## Current objective changed — waveform track editor, 2026-10-17

Instrument inventory listening batch completed (see above); user authorized moving to an Audacity-style Cover Builder. First stage implemented in BuilderTimeline.tsx/.css and core/builderTimeline.ts: waveform lanes, shared song ruler, zoom/snap, pointer/keyboard move/trim, exact source trim fields/reset, mute/solo/volume and row reorder. Only the selected track's existing sound controls are shown. Pitch/hold still uses replacement preview/apply. One clip per track; no split/copy, undo, piano roll or direct original-audio pitch effect yet.

mixTimeline honors source-local trims without moving retained audio. Library/backup metadata preserves trim/solo; backing gates combine with trims. Full-mix cursor is distinct from track/concatenated previews. Track edits invalidate mix previews. Waveform cache reuses current paths without model calls. All previous dirty files were preserved.

Frontend tests:192 passed,2 optional skipped. Browser fixture verified move via pointer and keyboard, pointer trim, selected-track settings, mix seek and clearing stale previews. Remaining: user's four app checks in MUSIC_STUDIO.md. No generation/separation/full-song model runs for this UI work.
''';p.write_text(s,encoding='utf-8')
