"""Paired conversion-guidance audition with a fixed random seed and guide."""
from pathlib import Path
import importlib.util,json
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/1791666387755'
out=root/'exports/singing/conversion-stability-audition';out.mkdir(parents=True,exist_ok=True)
guide,sr=sf.read(source/'guide-vocals.wav',always_2d=True)
backing,back_sr=sf.read(source/'instrumental.wav',always_2d=True);assert sr==back_sr
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py');job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
rows=[]
for name,guidance in [('control',.7),('lighter-guidance',.4)]:
    folder=out/name;existing=list(folder.glob('vc_*.wav'))
    result={'vocal':str(existing[0])} if len(existing)==1 else job.run(dict(repo=str(root/'data/seed-vc'),source=str(source/'guide-vocals.wav'),reference=str(root/'data/custom-voice/references/mana-v2/default-r2.wav'),start=0,seconds=len(guide)/sr,separate=False,output=str(folder),diffusion_steps=60,pitch_smoothing=True,guidance=guidance,seed=42))
    vocal,rate=sf.read(result['vocal'],always_2d=True);assert rate==sr
    n=min(len(vocal),len(backing),len(guide));vocal=vocal[:n]
    vocal*=np.sqrt(np.mean(guide[:n]**2))/max(np.sqrt(np.mean(vocal**2)),1e-8)
    mixed=vocal+backing[:n]*.3
    for kind,audio in [('vocal',vocal),('mix',mixed)]:
        scaled=audio*min(.1/max(float(np.sqrt(np.mean(audio**2))),1e-8),.95/max(float(np.max(np.abs(audio))),1e-8))
        target=out/(name+'-'+kind+'.wav');sf.write(target,scaled,sr,subtype='PCM_16')
        assert np.isfinite(scaled).all() and np.max(np.abs(scaled))<=.951 and np.sqrt(np.mean(scaled**2))>.001
    rows.append(dict(name=name,guidance=guidance,seed=42,steps=60,pitchSmoothing=True,reference='default-r2.wav',seconds=n/sr,listeningApproved=False))
    print('Saved '+name,flush=True)
(out/'comparison.json').write_text(json.dumps(dict(candidates=rows,poolChanged=False,productionDefaultsChanged=False,preferredBaseline=str(root/'exports/singing/pitch-stability-audition/gentler-pitch-mix.wav')),indent=2),encoding='utf-8')
