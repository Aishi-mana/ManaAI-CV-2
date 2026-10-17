"""Compare cached improved guitar notes on strings; no transcription rerun."""
import sys, json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import render_soundfont, SR

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'data/transcription-packages'))
import pretty_midi

out = root / 'exports/singing/strings-guitar-notes-2026-10-16'
out.mkdir(exist_ok=True)
cached = root / 'exports/singing/full-arrangement-2026-10-16/reach-guitar.mid'
midi = pretty_midi.PrettyMIDI(str(cached))
start, end = .8, 8.5
# The saved Bright-room MIDI includes its +2 preset. Undo that for source-pitch comparison.
selected = sorted([n for ins in midi.instruments for n in ins.notes if n.start < end and n.end > 0], key=lambda n:n.start)
notes = [[n.start, min(n.end,end), n.pitch-2, (n.velocity-48)/55] for n in selected]
velocities = [n.velocity for n in selected]
for i,n in enumerate(notes[:-1]):
    nxt = notes[i+1]
    if n[2] != nxt[2] and 0 <= nxt[0]-n[1] <= .1:
        n[1] = min(end,nxt[0]+.075)
audio = render_soundfont(notes,end,root,48,0,midi_velocities=velocities,release_scale=1.5)[round(start*SR):round(end*SR)]
source, rate = sf.read(root/'exports/singing/arrangement-1791744247383209600/guitar.wav')
assert rate == SR
source = source[round(start*SR):round(end*SR)]
if source.ndim > 1: source = source.mean(axis=1)
previous, rate = sf.read(root/'exports/singing/strings-connections-2026-10-16/connected.wav')
assert rate == SR
clips = {'original-guitar':source,'previous-strings':previous,'updated-strings':audio}
for name,x in clips.items():
    assert len(x)==round((end-start)*SR) and np.isfinite(x).all()
    clips[name] = x * (.12 / max(1e-9,float(np.sqrt(np.mean(x*x)))))
gain = min(1., .95/max(float(np.max(np.abs(x))) for x in clips.values()))
for name,x in clips.items(): sf.write(out/(name+'.wav'),x*gain,SR)
(out/'report.json').write_text(json.dumps({'cached_midi':str(cached),'passage':[start,end],'notes_in_context':len(notes),'pitch_correction':-2,'new_transcription':False,'method':'Cached improved guitar MIDI, source pitch restored, LiveHQ strings with connected release. RMS matched for listening. Original guitar is a separated stem, not the complete recording.'},indent=2))
print(out)
