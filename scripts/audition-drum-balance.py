"""Approved drum/cymbal events; lower cymbals with fixed kick/snare level."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_soundfont
ROOT=Path('C:/AI/ManaAI-CV-2')

def main():
    base=ROOT/'exports/singing/cymbal-cleaner-2026-10-16'
    data=json.loads((base/'report.json').read_text(encoding='utf-8'))
    cymbals=render_soundfont(data['notes'],19,ROOT,16,0,percussion=True,midi_velocities=data['velocities'])
    drums=render_soundfont(data['kick_snare'],19,ROOT,16,0,percussion=True)
    balance=json.loads((ROOT/'exports/singing/cymbal-layer-2026-10-16/report.json').read_text(encoding='utf-8'))['cymbal_mix_gain']
    balance=min(2.,max(.5,balance))
    gain=next(r['gain'] for r in data['results'] if r['name']=='combined-candidate')
    out=ROOT/'exports/singing/drum-balance-2026-10-16';out.mkdir(exist_ok=True);results=[]
    for db in [0,-3,-6]:
        cymbal_gain=balance*10**(db/20)
        x=(drums+cymbals*cymbal_gain)*gain
        assert x.shape==(456000,) and np.isfinite(x).all() and np.max(np.abs(x))<.901
        name='previous-balance' if db==0 else f'cymbals-minus-{abs(db)}db'
        sf.write(out/(name+'.wav'),x,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),x[216000:456000],SR,subtype='PCM_16')
        results.append(dict(name=name,cymbal_db=db,cymbal_gain=cymbal_gain,shared_master_gain=gain,peak=float(np.max(np.abs(x))),rms=float(np.sqrt(np.mean(x*x)))))
    original,_=sf.read(base/'combined-candidate.wav');repeated,_=sf.read(out/'previous-balance.wav')
    assert np.max(np.abs(original-repeated))<=1/32768
    report=dict(cymbals=data['notes'],velocities=data['velocities'],kick_snare=data['kick_snare'],results=results,method='User approved cleaner cymbal pattern. Only relative mix changed: cymbal lane incl hats -3/-6dB vs previous. Kick/snare samples/events/velocity and shared master gain fixed; no per-version RMS normalization or compression. Ringing times unchanged. No source blended; app unchanged pending balance choice.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(results,indent=2))

if __name__=='__main__':main()
