"""Short fixed-note flute phrasing audition; no model or transcription runs."""
import json,sys
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import render_soundfont, SR

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/arrangement-1791794488093338000'
pitch_check='--pitch-check' in sys.argv
out=root/('exports/singing/flute-pitch-check-2026-10-16' if pitch_check else 'exports/singing/flute-phrasing-2026-10-16')
out.mkdir(exist_ok=True)
start,end=.8,8.5
raw=[n for n in json.loads((base/'notes.json').read_text()) if n[0]<end]
corrections=[]
if pitch_check:
    from scipy.signal import stft
    source,rate=sf.read(base/'guitar-guide.wav')
    assert rate==SR
    if source.ndim>1:source=source.mean(axis=1)
    freq,times,z=stft(source[:round(end*SR)],fs=SR,nperseg=4096,noverlap=4096-240)
    spectrum=np.abs(z)
    original=[list(n) for n in raw]
    for i,n in enumerate(raw):
        neighbours=[x[2] for j,x in enumerate(original) if j!=i and abs(x[0]-n[0])<1.1]
        if len(neighbours)<2:continue
        centre=float(np.median(neighbours));pitch=n[2]
        alternate=min([pitch-12,pitch+12],key=lambda p:abs(p-centre))
        if abs(pitch-centre)<9 or abs(alternate-centre)>4:continue
        mask=(times>=n[0])&(times<n[1])
        def support(p):
            hz=440*2**((p-69)/12)
            return float(np.median(spectrum[np.abs(freq-hz)<max(7,hz*.025)][:,mask].max(axis=0)))
        current,other=support(pitch),support(alternate)
        # This is a register-continuity audition, not a claim to recover ground truth:
        # allow the octave alternative only when it also has substantial source energy.
        if other>current*.5 and other>1e-7:
            corrections.append(dict(start=n[0],before=pitch,after=alternate,support_ratio=other/max(current,1e-9)))
            n[2]=alternate
notes=[list(n) for n in raw]
velocities=[]
for i,n in enumerate(notes):
    # Ease phrase entrances; keep original pitch/attack and leave existing rests intact.
    entrance=i==0 or n[0]-raw[i-1][1]>.12
    level=int(48+55*np.clip(n[3],0,1))
    velocities.append(max(1,round(level*(.85 if entrance else .94))))
    n[1]=min(n[1],end)
    if i+1<len(notes):
        nxt=raw[i+1]
        if n[2]!=nxt[2] and 0<=nxt[0]-n[1]<=.06:
            n[1]=min(end,nxt[0]+.035)
assert all(a[0]==b[0] and a[2]==b[2] for a,b in zip(raw,notes))
shift=12 if np.median([n[2] for n in raw])<58 else 0
candidate=render_soundfont(notes,end,root,73,shift,midi_velocities=velocities,release_scale=1.3)
# Gentle 18ms entrance fades only after rests, not between connected notes.
for i,n in enumerate(notes):
    if i==0 or n[0]-raw[i-1][1]>.12:
        first=round(n[0]*SR);count=min(round(.018*SR),len(candidate)-first)
        if count>0:candidate[first:first+count]*=np.sin(np.linspace(0,np.pi/2,count))**2
candidate=candidate[round(start*SR):round(end*SR)]
previous,rate=sf.read(root/'exports/singing/flute-phrasing-2026-10-16/softer-connected.wav' if pitch_check else base/'flute.wav')
assert rate==SR
if not pitch_check:previous=previous[round(start*SR):round(end*SR)]
if previous.ndim>1:previous=previous.mean(axis=1)
candidate*=np.sqrt(np.mean(previous**2))/max(1e-9,np.sqrt(np.mean(candidate**2)))
assert len(candidate)==len(previous) and np.isfinite(candidate).all()
gain=min(1.,.95/max(np.max(np.abs(candidate)),np.max(np.abs(previous)),1e-9))
sf.write(out/'previous.wav',previous*gain,SR)
sf.write(out/'softer-connected.wav',candidate*gain,SR)
(out/'report.json').write_text(json.dumps(dict(source=str(base),passage=[start,end],notes=len(notes),pitch_shift=shift,corrections=corrections,pitches_and_attacks_preserved=not bool(corrections),new_transcription=False,method='LiveHQ flute, cached notes. Optional register-continuity trial: octave alternative within four semitones of local neighbours and at least half the source spectral support of original. Harmonic ambiguity remains; not verified correct transcription. Same connected phrasing and release. RMS matched. Mixed source, not extracted original flute.'),indent=2))
print(json.dumps(dict(output=str(out),corrections=corrections)))
