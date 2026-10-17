"""Fixed kick/snare pattern; compare source-driven dynamics and kit timbres."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.signal import butter,sosfilt
from arrangement_replacement import SR,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

def levels_from_source(source,notes):
    levels=[0]*len(notes)
    for pitch,lo,hi,floor in [(36,35,170,50),(38,180,4000,35)]:
        band=sosfilt(butter(3,[lo,hi],'bandpass',fs=SR,output='sos'),source)
        indices=[i for i,n in enumerate(notes) if n[2]==pitch];strengths=[]
        if not indices:continue
        for i in indices:
            start=round(notes[i][0]*SR);end=min(len(band),start+round(.055*SR))
            segment=band[start:end]
            strengths.append(float(np.sqrt(np.mean(segment**2))) if len(segment) else 0)
        ref=max(float(np.percentile(strengths,90)),1e-9)
        for i,value in zip(indices,strengths):levels[i]=int(round(floor+(115-floor)*np.clip(value/ref,0,1)**.8))
    return levels

def main():
    data=json.loads((ROOT/'exports/singing/cymbal-cleaner-2026-10-16/report.json').read_text(encoding='utf-8'))
    balance=json.loads((ROOT/'exports/singing/drum-balance-2026-10-16/report.json').read_text(encoding='utf-8'))
    accepted=next(r for r in balance['results'] if r['cymbal_db']==-6)
    source,_=librosa.load(ROOT/'exports/singing/arrangement-1791744247383209600/drums.wav',sr=SR,duration=19)
    notes=data['kick_snare'];snapshot=json.dumps(notes);velocities=levels_from_source(source,notes)
    cymbals=render_soundfont(data['notes'],19,ROOT,16,0,percussion=True,midi_velocities=data['velocities'])
    old=render_soundfont(notes,19,ROOT,16,0,percussion=True)
    target=float(np.sqrt(np.mean(old**2)))
    out=ROOT/'exports/singing/kick-snare-dynamics-2026-10-16';out.mkdir(exist_ok=True)
    report=dict(notes=notes,velocities=velocities,cymbal_db=-6,results=[])
    candidates={'previous':old}
    for name,program in [('rock-source-dynamics',16),('standard-source-dynamics',0)]:
        x=render_soundfont(notes,19,ROOT,program,0,percussion=True,midi_velocities=velocities)
        adjustment=target/max(float(np.sqrt(np.mean(x*x))),1e-9)
        candidates[name]=x*adjustment
        report['results'].append(dict(name=name,drum_level_match=adjustment,program=program))
    assert snapshot==json.dumps(notes)
    # Keep accepted cymbal samples/level and master gain unchanged; peak safety shared if needed.
    master=accepted['shared_master_gain'];cg=accepted['cymbal_gain']
    peak=max(float(np.max(np.abs((x+cymbals*cg)*master))) for x in candidates.values())
    safety=min(1,.9/max(peak,1e-9));master*=safety
    for name,x in candidates.items():
        combined=(x+cymbals*cg)*master
        assert combined.shape==(456000,) and np.isfinite(combined).all() and np.max(np.abs(combined))<.901
        for suffix,audio in [('kick-snare',x*master),('combined',combined)]:
            sf.write(out/(name+'-'+suffix+'.wav'),audio,SR,subtype='PCM_16')
            sf.write(out/(name+'-'+suffix+'-9-19.wav'),audio[216000:456000],SR,subtype='PCM_16')
    report.update(master=master,shared_peak_safety=safety,cymbal_gain=cg,method='Previous153kick/snare note positions and lengths fixed. Source band RMS first55ms maps pervoice to MIDI50–115kick/35–115snare with.8exponent, no new hits. Rock16/standard0 share same new velocities and matched average drum RMS to old rock. Accepted cleaner cymbal lane and -6dB relative choice fixed, shared master safety only if needed. No EQ/compression/source blending. Audition only; source bleed can affect strength estimates, app unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(hits=len(notes),velocity_range=[min(velocities),max(velocities)],shared_peak_safety=safety,results=report['results']),indent=2))

if __name__=='__main__':main()
