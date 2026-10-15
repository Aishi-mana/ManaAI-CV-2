"""Thirty-second FCPE audition from the saved full Whereabout cover stems."""
import os, sys, time, json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/applio-whereabout-170s-2026-10-13'
out.mkdir(parents=True,exist_ok=True)
sys.dont_write_bytecode=True
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['NUMBA_CACHE_DIR']=str(root/'data/applio-audition-cache')
os.chdir('C:/AI/Applio');sys.path.insert(0,'C:/AI/Applio')
started=time.perf_counter()
import numpy as np
import soundfile as sf
from rvc.infer.infer import VoiceConverter
source=root/'exports/singing/1791669063502/guide-vocals.wav'
with sf.SoundFile(source) as f:
    sr=f.samplerate
    f.seek(170*sr)
    guide=f.read(30*sr,always_2d=True)
assert len(guide)==30*sr and np.isfinite(guide).all()
sf.write(out/'guide.wav',guide,sr,subtype='PCM_16')
vc=VoiceConverter()
model='C:/AI/ManaAI/models/rvc/ManaVoicev1.pth'
index='C:/AI/ManaAI/models/rvc/ManaVoicev1.index'
vc.get_vc(model,0);vc.load_hubert('contentvec');vc.last_embedder_model='contentvec'
load_seconds=time.perf_counter()-started
tick=time.perf_counter()
target=out/'fcpe-raw.wav'
vc.convert_audio(audio_input_path=str(out/'guide.wav'),audio_output_path=str(target),
    model_path=model,index_path=index,pitch=0,f0_method='fcpe',index_rate=.70,
    volume_envelope=1.0,protect=.33,embedder_model='contentvec',f0_autotune=False,
    proposed_pitch=False,clean_audio=False,post_process=False,split_audio=False)
elapsed=time.perf_counter()-tick
vocal,rate=sf.read(target,always_2d=True)
assert np.isfinite(vocal).all() and abs(len(vocal)/rate-30)<.2
levels=[]
for name,samples,sample_rate in [('original-vocal',guide,sr),('mana-fcpe',vocal,rate)]:
    rms=float(np.sqrt(np.mean(samples**2)));peak=float(np.max(np.abs(samples)))
    assert rms>.001
    gain=min(.10/rms,.95/max(peak,1e-8))
    sf.write(out/(name+'.wav'),samples*gain,sample_rate,subtype='PCM_16')
    levels.append(dict(name=name,seconds=len(samples)/sample_rate,rms=rms,peak=peak,gain=gain))
report=dict(source=str(source),start=170,duration=30,model=model,index=index,
    method='fcpe',pitch=0,indexRate=.70,protect=.33,device=vc.config.device,
    startupAndModelSeconds=load_seconds,conversionSeconds=elapsed,levels=levels,
    productionChanged=False,listeningApproved=False)
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
