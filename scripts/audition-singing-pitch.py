"""Audition conservative pitch conditioning with unchanged source audio."""
from pathlib import Path
import importlib.util,json
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/1791666387755'
out=root/'exports/singing/pitch-stability-audition';out.mkdir(parents=True,exist_ok=True)
baseline=root/'exports/singing/cover-quality-audition/60-step-conversion/vc_guide-vocals_default-r2_1.0_60_0.7.wav'
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py');job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
info=sf.info(source/'guide-vocals.wav')
result=job.run(dict(repo=str(root/'data/seed-vc'),source=str(source/'guide-vocals.wav'),reference=str(root/'data/custom-voice/references/mana-v2/default-r2.wav'),start=0,seconds=info.duration,separate=False,output=str(out/'conversion'),diffusion_steps=60,pitch_smoothing=True,baseline_vocal=str(baseline)))
guide,sr=sf.read(source/'guide-vocals.wav',always_2d=True)
backing,back_sr=sf.read(source/'instrumental.wav',always_2d=True)
def write_mix(path,name):
    vocal,rate=sf.read(path,always_2d=True);assert sr==rate==back_sr
    n=min(len(vocal),len(backing),len(guide));vocal=vocal[:n]
    vocal*=np.sqrt(np.mean(guide[:n]**2))/max(np.sqrt(np.mean(vocal**2)),1e-8)
    mix=vocal+backing[:n]*.3
    for suffix,audio in [('vocal',vocal),('mix',mix)]:
        audio*=min(.1/max(float(np.sqrt(np.mean(audio**2))),1e-8),.95/max(float(np.max(np.abs(audio))),1e-8))
        target=out/(name+'-'+suffix+'.wav');sf.write(target,audio,rate,subtype='PCM_16')
        assert np.isfinite(audio).all() and np.max(np.abs(audio))<=.951
write_mix(baseline,'baseline-60-steps')
write_mix(result['vocal'],'gentler-pitch')
report={'source':str(source),'reference':'default-r2.wav','steps':60,'guideAudioUnchanged':True,'change':'Conservative smoothing of guide F0 conditioning only; no shift, no note quantization. Voicing boundaries and large transitions preserved.','backingGain':.3,'listeningApproved':False,'poolChanged':False}
(out/'manifest.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print((out/'conversion/pitch-comparison.json').read_text(encoding='utf-8'),flush=True)
