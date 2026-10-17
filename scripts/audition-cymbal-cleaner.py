"""Trim weak/near-duplicate metal triggers from the preferred fuller cymbal lane."""
import json
from pathlib import Path
from collections import Counter
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

def trim(notes,seconds):
    removed=[];eligible=[]
    for i,n in enumerate(notes):
        if n[2] in [49,51] and n[3]<.20:
            removed.append(dict(index=i,note=n,reason='weak crash/ride evidence'))
        else:eligible.append((i,list(n)))
    # Strongest metal event wins over a substantially weaker neighboring label.
    keep=[]
    for i,n in sorted(eligible,key=lambda item:item[1][3],reverse=True):
        reason=None
        if n[2] in [49,51]:
            for _,other in keep:
                delta=abs(n[0]-other[0])
                if other[2]==n[2] and delta<(.30 if n[2]==49 else .09):reason='same-voice retrigger';break
                if other[2] in [49,51] and delta<.10 and n[3]<other[3]*.65:reason='weaker neighboring metal label';break
        if reason:removed.append(dict(index=i,note=n,reason=reason))
        else:keep.append((i,n))
    keep.sort(key=lambda item:item[1][0]);result=[n for _,n in keep]
    # Restore ringing time when an intervening false trigger was removed.
    for i,n in enumerate(result):
        next_time=next((v[0] for v in result[i+1:] if v[2]==n[2]),seconds)
        n[1]=min(seconds,n[0]+{42:.08,46:.5,49:1.8,51:1.0}[n[2]],next_time)
    return result,removed

def main():
    base=ROOT/'exports/singing/cymbal-fuller-2026-10-16'
    old=json.loads((base/'report.json').read_text(encoding='utf-8'))
    notes,removed=trim(old['notes'],19)
    assert len(notes)<len(old['notes'])
    assert all(any(n[0]==o[0] and n[2:]==o[2:] for o in old['notes']) for n in notes)
    levels=[int(round(55+55*np.sqrt(n[3]))) for n in notes]
    cymbals=render_soundfont(notes,19,ROOT,16,0,percussion=True,midi_velocities=levels)
    low=render_soundfont(old['kick_snare'],19,ROOT,16,0,percussion=True)
    indices=[i for i,n in enumerate(notes) if n[2] in [49,51]]
    metal=render_soundfont([notes[i] for i in indices],19,ROOT,16,0,percussion=True,midi_velocities=[levels[i] for i in indices])
    balance=json.loads((ROOT/'exports/singing/cymbal-layer-2026-10-16/report.json').read_text(encoding='utf-8'))['cymbal_mix_gain']
    out=ROOT/'exports/singing/cymbal-cleaner-2026-10-16';out.mkdir(exist_ok=True);results=[]
    for name,x in [('cleaner-cymbals',cymbals),('cleaner-crash-ride',metal),('combined-candidate',low+cymbals*min(2.,max(.5,balance)))]:
        assert x.shape==(456000,) and np.isfinite(x).all()
        gain=min(.065/max(float(np.sqrt(np.mean(x*x))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),x[216000:456000]*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,gain=gain,peak=float(np.max(np.abs(x*gain)))))
    import shutil
    shutil.copyfile(base/'combined-candidate-9-19.wav',out/'previous-combined-9-19.wav')
    report=dict(notes=notes,velocities=levels,removed=removed,kick_snare=old['kick_snare'],old_counts=dict(Counter(n[2] for n in old['notes'])),counts=dict(Counter(n[2] for n in notes)),results=results,method='Preferred fuller lane trimmed: crash/ride evidence<.20 removed; strongest same-voice within300/90ms wins, weaker cross-metal within100ms suppressed only if<65%ofstronger. Hat lanes unchanged. Surviving onsets/pitches/strengths fixed, ringing restored up to prior hold lengths capped before nextsamekey. Previous kick/snare exactmetadata unchanged, no grid/sourceblending. Heuristic removal may lose quiet true cymbals; listening candidate, app unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(old=report['old_counts'],new=report['counts'],removed=len(removed),results=results),indent=2))

if __name__=='__main__':main()
