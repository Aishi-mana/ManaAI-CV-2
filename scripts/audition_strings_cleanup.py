"""Conservative cached-note cleanup audition, no new transcription."""
import sys, json
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import stft
from arrangement_replacement import render_soundfont, SR

root = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'data/transcription-packages'))
import pretty_midi

out = root/'exports/singing/strings-cleanup-2026-10-16'
out.mkdir(exist_ok=True)
start,end=.8,8.5
source,rate=sf.read(root/'exports/singing/arrangement-1791744247383209600/guitar.wav')
assert rate==SR
if source.ndim>1:source=source.mean(axis=1)
midi=pretty_midi.PrettyMIDI(str(root/'exports/singing/full-arrangement-2026-10-16/reach-guitar.mid'))
raw=sorted([n for ins in midi.instruments for n in ins.notes if n.start<end],key=lambda n:n.start)
freq,times,z=stft(source[:round(end*SR)],fs=SR,nperseg=4096,noverlap=4096-240)
power=np.abs(z)
pitches=np.arange(40,89)
bands=np.array([power[np.abs(freq-440*2**((p-69)/12))<max(7,440*2**((p-69)/12)*.025)].max(axis=0) for p in pitches])
relative=bands/np.maximum(bands.max(axis=0),1e-9)
kept=[];removed=[];scores=[]
for index,n in enumerate(raw):
    pitch=n.pitch-2
    frames=(times>=n.start)&(times<min(n.end,end))
    support=float(np.median(relative[pitch-40,frames])) if 40<=pitch<=88 and frames.any() else 0.
    record=dict(start=n.start,end=n.end,pitch=pitch,velocity=n.velocity,support=support)
    # Short and weakly supported only; do not invent substitute pitches.
    # Cached guitar tails overlap: use the next attack to measure a brief detour.
    prior=raw[index-1] if index else None
    following=raw[index+1] if index+1<len(raw) else None
    detour=prior is not None and following is not None and prior.pitch==following.pitch and prior.pitch!=n.pitch and following.start-n.start<.14
    reject=bool(detour and support<.4)
    (removed if reject else scores).append(record)
    if not reject:
        # Keep uncertain sustained pitches, but avoid making them as loud as supported melody.
        n.velocity=max(1,round(n.velocity*(.65 if support<.5 else 1)))
        kept.append(n)
notes=[[n.start,min(n.end,end),n.pitch-2,0] for n in kept]
for i,n in enumerate(notes[:-1]):
    nxt=notes[i+1]
    if n[2]!=nxt[2] and 0<=nxt[0]-n[1]<=.1:n[1]=min(end,nxt[0]+.075)
candidate=render_soundfont(notes,end,root,48,0,midi_velocities=[n.velocity for n in kept],release_scale=1.5)[round(start*SR):round(end*SR)]
baseline,rate=sf.read(root/'exports/singing/strings-guitar-notes-2026-10-16/updated-strings.wav')
assert rate==SR and len(candidate)==len(baseline) and np.isfinite(candidate).all()
candidate*=np.sqrt(np.mean(baseline**2))/max(1e-9,np.sqrt(np.mean(candidate**2)))
gain=min(1.,.95/max(np.max(np.abs(candidate)),np.max(np.abs(baseline)),1e-9))
sf.write(out/'previous.wav',baseline*gain,SR)
sf.write(out/'cleaner.wav',candidate*gain,SR)
(out/'report.json').write_text(json.dumps(dict(removed=removed,kept=scores,method='Remove only brief under-140ms attack detours between matching neighbouring pitches with fundamental support below .4. Attenuate retained notes below .5 support to 65% MIDI velocity. No re-pitching or transcription; remaining attacks preserved. Audition only; spectral support is not proof of correct notes.'),indent=2))
print(json.dumps(dict(removed=removed,kept=len(kept),output=str(out))))
