"""Identical FCPE settings for alternate vocal extractions."""
import os, sys, json, time, shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/'exports/singing/vocal-extraction-170s-2026-10-13'
sys.dont_write_bytecode=True
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['NUMBA_CACHE_DIR']=str(root/'data/applio-audition-cache')
os.chdir('C:/AI/Applio');sys.path.insert(0,'C:/AI/Applio')
import numpy as np
import soundfile as sf
from rvc.infer.infer import VoiceConverter
vc=VoiceConverter()
model='C:/AI/ManaAI/models/rvc/ManaVoicev1.pth'
index='C:/AI/ManaAI/models/rvc/ManaVoicev1.index'
vc.get_vc(model,0);vc.load_hubert('contentvec');vc.last_embedder_model='contentvec'
report=dict(method='fcpe',model=model,index=index,pitch=0,indexRate=.70,protect=.33,
    volumeEnvelope=1.0,productionChanged=False,listeningApproved=False,candidates=[])
for name in ['lead-vocal','vocal']:
    source=out/(name+'-raw.wav');target=out/('mana-'+name+'-raw.wav')
    tick=time.perf_counter()
    vc.convert_audio(audio_input_path=str(source),audio_output_path=str(target),
        model_path=model,index_path=index,pitch=0,f0_method='fcpe',index_rate=.70,
        volume_envelope=1.0,protect=.33,embedder_model='contentvec',f0_autotune=False,
        proposed_pitch=False,clean_audio=False,post_process=False,split_audio=False)
    elapsed=time.perf_counter()-tick
    samples,sr=sf.read(target,always_2d=True)
    assert np.isfinite(samples).all() and abs(len(samples)/sr-30)<.2
    rms=float(np.sqrt(np.mean(samples**2)));peak=float(np.max(np.abs(samples)))
    assert rms>.001
    gain=min(.1/rms,.95/max(peak,1e-8))
    sf.write(out/('mana-'+name+'.wav'),samples*gain,sr,subtype='PCM_16')
    report['candidates'].append(dict(extraction=name,seconds=len(samples)/sr,
        conversionSeconds=elapsed,rms=rms,peak=peak,gain=gain))
for source,name in [('mana-fcpe.wav','mana-demucs-control.wav'),('original-vocal.wav','demucs-vocal.wav')]:
    shutil.copyfile(root/'exports/singing/applio-whereabout-170s-2026-10-13'/source,out/name)
(out/'conversion.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
