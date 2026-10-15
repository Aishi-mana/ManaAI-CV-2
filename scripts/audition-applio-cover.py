"""Read existing local Applio/legacy Mana; write only audition outputs here."""
import os, sys, time, json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/applio-cover-audition-2026-10-13'
out.mkdir(parents=True,exist_ok=True)
sys.dont_write_bytecode=True
os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['NUMBA_CACHE_DIR']=str(root/'data/applio-audition-cache')
os.chdir('C:/AI/Applio')
sys.path.insert(0,'C:/AI/Applio')
started=time.perf_counter()
import numpy as np
import soundfile as sf
from rvc.infer.infer import VoiceConverter
vc=VoiceConverter()
model='C:/AI/ManaAI/models/rvc/ManaVoicev1.pth'
index='C:/AI/ManaAI/models/rvc/ManaVoicev1.index'
vc.get_vc(model,0)
vc.load_hubert('contentvec')
vc.last_embedder_model='contentvec'
load_seconds=time.perf_counter()-started
report=dict(model=model,index=index,device=vc.config.device,
    version=vc.version,sampleRate=vc.tgt_sr,useF0=vc.use_f0,
    startupAndModelSeconds=load_seconds,pitch=0,indexRate=.70,protect=.33,
    volumeEnvelope=1.0,embedder='contentvec',productionChanged=False,
    listeningApproved=False,candidates=[])
for method in ['fcpe','rmvpe']:
    target=out/(method+'-raw.wav')
    tick=time.perf_counter()
    vc.convert_audio(audio_input_path=str(root/'exports/singing/cover-diagnosis-2026-10-13/guide.wav'),
        audio_output_path=str(target),model_path=model,index_path=index,pitch=0,
        f0_method=method,index_rate=.70,volume_envelope=1.0,protect=.33,
        embedder_model='contentvec',f0_autotune=False,proposed_pitch=False,
        clean_audio=False,post_process=False,split_audio=False)
    elapsed=time.perf_counter()-tick
    samples,sr=sf.read(target,always_2d=True)
    assert np.isfinite(samples).all() and abs(len(samples)/sr-12)<.2
    rms=float(np.sqrt(np.mean(samples**2))); peak=float(np.max(np.abs(samples)))
    assert rms>.001
    gain=min(.1/rms,.95/max(peak,1e-8))
    sf.write(out/(method+'.wav'),samples*gain,sr,subtype='PCM_16')
    report['candidates'].append(dict(method=method,seconds=len(samples)/sr,
        conversionSeconds=elapsed,rawRms=rms,rawPeak=peak,gain=gain))
baseline=root/'exports/singing/singing-reference-audition-2026-10-13/2-singing-reference-candidate.wav'
import shutil
shutil.copyfile(baseline,out/'seed-vc-control.wav')
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
