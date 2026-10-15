"""Non-destructive FCPE phrase fallback for the full Seed-VC cover."""
import os,sys,json,time,math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/1791861784048'
out=root/'exports/singing/whereabout-72s-fcpe-repair'
out.mkdir(parents=True,exist_ok=True)
sys.dont_write_bytecode=True
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['NUMBA_CACHE_DIR']=str(root/'data/applio-audition-cache')
os.chdir('C:/AI/Applio');sys.path.insert(0,'C:/AI/Applio')
import numpy as np,soundfile as sf
from scipy.signal import resample_poly
from rvc.infer.infer import VoiceConverter
guide=root/'exports/singing/whereabout-72s-diagnosis/lead-raw.wav'
vc=VoiceConverter()
model='C:/AI/ManaAI/models/rvc/ManaVoicev1.pth'
index='C:/AI/ManaAI/models/rvc/ManaVoicev1.index'
tick=time.perf_counter()
vc.convert_audio(audio_input_path=str(guide),audio_output_path=str(out/'fcpe-raw.wav'),
    model_path=model,index_path=index,pitch=0,f0_method='fcpe',index_rate=.70,
    volume_envelope=1.0,protect=.33,embedder_model='contentvec',f0_autotune=False,
    proposed_pitch=False,clean_audio=False,post_process=False,split_audio=False)
elapsed=time.perf_counter()-tick
fcpe,fcpe_sr=sf.read(out/'fcpe-raw.wav',always_2d=True)
assert np.isfinite(fcpe).all() and abs(len(fcpe)/fcpe_sr-20)<.1
result=json.loads((source/'result.json').read_text(encoding='utf-8'))
full,sr=sf.read(result['vocal'],always_2d=True)
assert sr==44100
gcd=math.gcd(sr,fcpe_sr)
candidate=resample_poly(fcpe,sr//gcd,fcpe_sr//gcd,axis=0)
candidate=np.pad(candidate,((0,max(0,20*sr-len(candidate))),(0,0)))[:20*sr]
start=62;left=70*sr;right=77*sr
replacement=candidate[left-start*sr:right-start*sr]
baseline=full[left:right]
gain=float(np.sqrt(np.mean(baseline**2)))/max(float(np.sqrt(np.mean(replacement**2))),1e-8)
gain=min(gain,.98/max(float(np.max(np.abs(replacement))),1e-8))
fade=round(.4*sr)
weight=np.ones((right-left,1));weight[:fade,0]=np.linspace(0,1,fade);weight[-fade:,0]=np.linspace(1,0,fade)
patched=full.copy();patched[left:right]=baseline*(1-weight)+replacement*gain*weight
assert np.array_equal(full[:left],patched[:left]) and np.array_equal(full[right:],patched[right:])
assert np.isfinite(patched).all() and np.max(np.abs(patched))<.999
sf.write(out/'full-vocal-candidate.wav',patched,sr,subtype='PCM_16')
levels=[]
def audition(name,data,rate):
    rms=float(np.sqrt(np.mean(data**2)));peak=float(np.max(np.abs(data)))
    level=min(.1/max(rms,1e-8),.95/max(peak,1e-8))
    sf.write(out/(name+'.wav'),data*level,rate,subtype='PCM_16')
    levels.append(dict(name=name,seconds=len(data)/rate,rms=rms,peak=peak,gain=level))
old=full[start*sr:(start+20)*sr];new=patched[start*sr:(start+20)*sr]
audition('current-seed-vc',old,sr)
audition('fcpe-only',fcpe,fcpe_sr)
audition('hybrid-repair',new,sr)
# Reuse saved mix levels for a listening preview; no published mix file is replaced.
with sf.SoundFile(result['mix']) as f:
    assert f.samplerate==sr;f.seek(start*sr);mix=f.read(20*sr,always_2d=True)
with sf.SoundFile(source/'instrumental.wav') as f:
    assert f.samplerate==sr;f.seek(start*sr);back=f.read(20*sr,always_2d=True)
vocal=np.repeat(old,2,axis=1) if old.shape[1]==1 else old
design=np.column_stack([vocal.reshape(-1),back.reshape(-1)])
coeff=np.linalg.lstsq(design,mix.reshape(-1),rcond=None)[0]
fit=design@coeff
fit_rms=float(np.sqrt(np.mean((fit-mix.reshape(-1))**2)))
delta=np.repeat(new-old,2,axis=1) if old.shape[1]==1 else new-old
mix_candidate=mix+delta*coeff[0]
audition('mix-repair-preview',mix_candidate,sr)
report=dict(source=str(source),guide=str(guide),method='fcpe',model=model,index=index,
    pitch=0,indexRate=.70,protect=.33,conversionIncludingModelSeconds=elapsed,
    patchStart=70,patchEnd=77,fadeSeconds=.4,patchGain=gain,outsidePatchUnchanged=True,
    mixCoefficients=coeff.tolist(),mixFitResidualRms=fit_rms,levels=levels,
    productionChanged=False,listeningApproved=False)
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
