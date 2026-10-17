"""One short fixed-note violin comparison; no transcription or app mutation."""
import json,sys
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import render_soundfont, SR

root=Path(__file__).resolve().parents[1]
base=root/'exports/singing/arrangement-1791794436553863700'
melody_register='--melody-register' in sys.argv
soften='--soften-weak' in sys.argv
cleanup='--cleanup' in sys.argv or soften or melody_register
out=root/('exports/singing/violin-upper-melody-2026-10-16' if melody_register else 'exports/singing/violin-weak-notes-2026-10-16' if soften else 'exports/singing/violin-notes-2026-10-16' if cleanup else 'exports/singing/violin-bowing-2026-10-16')
out.mkdir(exist_ok=True)
start,end=.8,8.5
all_notes=json.loads((base/'notes.json').read_text())
raw=[n for n in all_notes if n[0]<end]
changes=[]
removed=[]
if cleanup:
    from flute_replacement import prepare_flute
    from strings_replacement import prepare_strings
    source,rate=sf.read(base/'guitar-guide.wav')
    assert rate==SR
    if source.ndim>1:source=source.mean(axis=1)
    source=source[:round(end*SR)]
    corrected,_,_=prepare_flute(raw,source,end)
    changes=[dict(start=a[0],before=a[2],after=b[2]) for a,b in zip(raw,corrected) if a[2]!=b[2]]
    # Reuse only the selected pitches; keep violin's own holds and dynamics below.
    raw=[[a,b,corrected[i][2],c] for i,(a,b,p,c) in enumerate(raw)]
    screened,_,=prepare_strings(raw,source,end)
    retained={n[0] for n in screened}
    removed=[dict(start=n[0],pitch=n[2]) for n in raw if n[0] not in retained]
    raw=[n for n in raw if n[0] in retained]
    if melody_register:
        from scipy.signal import stft
        freq,times,z=stft(source,fs=SR,nperseg=4096,noverlap=4096-240)
        power=np.abs(z)
        centre=float(np.median([n[2] for n in raw]))
        for n in raw:
            if centre-n[2]<9 or abs(n[2]+12-centre)>5:continue
            mask=(times>=n[0])&(times<n[1])
            def energy(p):
                hz=440*2**((p-69)/12)
                return float(np.median(power[np.abs(freq-hz)<max(7,hz*.025)][:,mask].max(axis=0))) if mask.any() else 0.
            low,upper=energy(n[2]),energy(n[2]+12)
            if upper>low*.25 and upper>1e-7:
                changes.append(dict(start=n[0],before=n[2],after=n[2]+12,reason='upper-melody register trial; source supports octave harmonic',support_ratio=upper/max(low,1e-9)))
                n[2]+=12
played=[list(n) for n in raw]
levels=[];entrances=[]
softened=[]
if soften:
    from scipy.signal import stft
    freq,times,z=stft(source,fs=SR,nperseg=4096,noverlap=4096-240)
    spectrum=np.abs(z)
    bands=[]
    for pitch in range(40,89):
        hz=440*2**((pitch-69)/12)
        bands.append(spectrum[np.abs(freq-hz)<max(7,hz*.025)].max(axis=0))
    bands=np.array(bands)
    relative=bands/np.maximum(bands.max(axis=0),1e-9)
for i,n in enumerate(played):
    entrance=i==0 or n[0]-raw[i-1][1]>.12
    if entrance:entrances.append(n[0])
    levels.append(max(1,round(int(48+55*np.clip(n[3],0,1))*(.82 if entrance else .93))))
    if soften and 40<=n[2]<=88:
        mask=(times>=n[0])&(times<min(n[1],end))
        support=float(np.median(relative[n[2]-40,mask])) if mask.any() else 1.
        if support<.55:
            before=levels[-1]
            levels[-1]=max(1,round(before*.60))
            softened.append(dict(start=n[0],pitch=n[2],support=support,before_velocity=before,after_velocity=levels[-1]))
    n[1]=min(n[1],end)
    if i+1<len(played):
        following=played[i+1]
        if following[2]!=n[2] and 0<=following[0]-n[1]<=.08:
            n[1]=min(end,following[0]+.055)
# Match the register used by the existing full-section violin replacement.
shift=12 if np.median([n[2] for n in all_notes])<58 else 0
audio=render_soundfont(played,end,root,40,shift,midi_velocities=levels,release_scale=1.4)
for onset in entrances:
    first=round(onset*SR);count=min(round(.028*SR),len(audio)-first)
    if count>0:audio[first:first+count]*=np.sin(np.linspace(0,np.pi/2,count))**2
audio=audio[round(start*SR):round(end*SR)]
baseline,rate=sf.read(root/'exports/singing/violin-notes-2026-10-16/softer-bowing.wav' if soften else root/'exports/singing/violin-bowing-2026-10-16/softer-bowing.wav' if cleanup else base/'violin.wav')
assert rate==SR
if not cleanup:baseline=baseline[round(start*SR):round(end*SR)]
if baseline.ndim>1:baseline=baseline.mean(axis=1)
assert len(audio)==len(baseline) and np.isfinite(audio).all()
assert all(a[0]==b[0] and a[2]==b[2] for a,b in zip(raw,played))
audio*=np.sqrt(np.mean(baseline**2))/max(1e-9,np.sqrt(np.mean(audio**2)))
gain=min(1.,.95/max(np.max(np.abs(audio)),np.max(np.abs(baseline)),1e-9))
sf.write(out/'previous.wav',baseline*gain,SR)
sf.write(out/'softer-bowing.wav',audio*gain,SR)
(out/'report.json').write_text(json.dumps(dict(source=str(base),passage=[start,end],notes=len(raw),shift=shift,corrections=changes,removed=removed,softened=softened,new_transcription=False,method=('Upper-melody register audition: lower outliers >=9 semitones below median moved up one octave only if within five semitones of median and upper fundamental energy >.25x lower. This intentionally chooses a melody register, not verified recovery of original pitches. No weak-note attenuation.' if melody_register else 'LiveHQ violin, same softer bowing and previous octave correction. Optional low-support velocity softening.')+' Same bowing, overall register and timing; RMS matched. Mixed source, not original violin performance.'),indent=2))
print(json.dumps(dict(output=str(out),corrections=changes,softened=softened)))
