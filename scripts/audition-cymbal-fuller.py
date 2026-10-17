"""More permissive cymbal coverage; accepted kick/snare untouched."""
import json
from pathlib import Path
from collections import Counter
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

def fuller(evidence,seconds):
    groups=[]
    for e in sorted(evidence,key=lambda e:e['time']):
        if groups and e['time']-groups[-1][0]['time']<=.025:groups[-1].append(e)
        else:groups.append([e])
    notes=[];last={}
    for group in groups:
        e=max(group,key=lambda e:e['score']);p=e['pitch'];time=e['time']
        # Drop the previous top15% crash filter, while retaining per-voice repeat limits.
        if e['share']<.22 or e['strength']<.10:continue
        spacing=.20 if p==49 else .065 if p==51 else .035
        if time-last.get(p,-10)<spacing:continue
        last[p]=time
        notes.append([time,min(seconds,time+{42:.08,46:.5,49:1.8,51:1.0}[p]),p,e['strength']])
    for i,n in enumerate(notes):n[1]=min(n[1],next((v[0] for v in notes[i+1:] if v[2]==n[2]),seconds))
    return notes

def main():
    base=ROOT/'exports/singing/cymbal-layer-2026-10-16'
    data=json.loads((base/'report.json').read_text(encoding='utf-8'))
    notes=fuller(data['evidence'],19)
    levels=[int(round(55+55*np.sqrt(n[3]))) for n in notes]
    cymbals=render_soundfont(notes,19,ROOT,16,0,percussion=True,midi_velocities=levels)
    low=render_soundfont(data['kick_snare'],19,ROOT,16,0,percussion=True)
    # Also expose crash/ride without hats to make missing crash detection easier to judge.
    indices=[i for i,n in enumerate(notes) if n[2] in [49,51]]
    crash_ride=render_soundfont([notes[i] for i in indices],19,ROOT,16,0,percussion=True,midi_velocities=[levels[i] for i in indices])
    out=ROOT/'exports/singing/cymbal-fuller-2026-10-16';out.mkdir(exist_ok=True)
    mix_gain=min(2.,max(.5,data['cymbal_mix_gain']))
    results=[]
    for name,x in [('fuller-cymbals',cymbals),('crash-ride-only',crash_ride),('combined-candidate',low+cymbals*mix_gain)]:
        assert x.shape==(456000,) and np.isfinite(x).all()
        gain=min(.065/max(float(np.sqrt(np.mean(x*x))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),x[216000:456000]*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    report=dict(notes=notes,velocities=levels,counts=dict(Counter(n[2] for n in notes)),kick_snare=data['kick_snare'],results=results,method='Same template evidence, previous strict crash score/strength selection removed. Keep dominant class per25ms group, crash spacing200ms/ride65ms/hats35ms. More audible velocities55+55sqrt(strength); longer note holds hat80ms/open500ms/crash1.8s/ride1s capped before same key. Same old kick/snare notes/strengths; separate cymbal layer only. No source blended. Permissive coverage can overdetect/mislabel crashes; audition not production.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(counts=report['counts'],results=results),indent=2))

if __name__=='__main__':main()
