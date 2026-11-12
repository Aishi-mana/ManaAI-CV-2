"""Diagnostic only: isolate pitch flutter versus loudness flutter. No app defaults change."""
from pathlib import Path
import os,sys,json
root=Path.cwd();os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1';os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path.insert(0,str(root/'scripts'))
import numpy as np,soundfile as sf
from scipy.ndimage import uniform_filter1d
from scipy.signal import medfilt
import singing_pitch
from singing_job import run
out=root/'exports/singing/country-roads-stability-20261101';out.mkdir(parents=True,exist_ok=True)
baseline=root/'exports/singing/country-roads-consistency-20261101/baseline-50-steps.wav'
a,sr=sf.read(baseline,always_2d=True);assert np.isfinite(a).all()
sf.write(out/'A-current.wav',a,sr,subtype='PCM_16')
# Diagnostic C: reduce short-term level fluctuations, without changing pitch or timing.
power=np.mean(a*a,axis=1);fast=np.sqrt(np.maximum(uniform_filter1d(power,max(3,round(sr*.025))),1e-12));slow=np.sqrt(np.maximum(uniform_filter1d(power,max(3,round(sr*.25))),1e-12))
gain=np.clip(slow/np.maximum(fast,1e-6),.75,1.35)
# Leave rests and quiet consonants alone; use smooth gain transitions.
gate=np.clip((fast-.012)/.025,0,1);gain=1+(gain-1)*gate;gain=uniform_filter1d(gain,max(3,round(sr*.025)))
c=a*gain[:,None]
def audition(path,x,rate):
 assert np.isfinite(x).all();rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));g=min(.1/max(rms,1e-8),.95/max(peak,1e-8));sf.write(path,x*g,rate,subtype='PCM_16');return {'seconds':len(x)/rate,'rmsBefore':rms,'peakBefore':peak,'gain':g}
checks={'C-level-stability':audition(out/'C-level-stability.wav',c,sr)}
condition={}
def stable_pitch(values):
 original=np.asarray(values);result=original.astype(float).copy();v=np.isfinite(result)&(result>1)
 for begin,end in np.flatnonzero(np.diff(np.r_[False,v,False])).reshape(-1,2):
  cents=1200*np.log2(result[begin:end]);cuts=np.r_[0,np.flatnonzero(np.abs(np.diff(cents))>90)+1,len(cents)]
  for left,right in zip(cuts[:-1],cuts[1:]):
   section=cents[left:right]
   if len(section)<15:continue
   window=min(31,len(section) if len(section)%2 else len(section)-1)
   filtered=medfilt(np.pad(section,window//2,mode='edge'),window)[window//2:-window//2+1]
   assert len(filtered)==len(section)
   weight=np.ones(len(section))*.95;edge=min(5,len(section)//3);weight[:edge]=np.linspace(0,.95,edge);weight[-edge:]=np.linspace(.95,0,edge)
   result[begin+left:begin+right]=2**((section*(1-weight)+filtered*weight)/1200)
 assert np.array_equal(result[~v],original[~v]);assert np.isfinite(result).all()
 condition.update(input=singing_pitch.pitch_stats(original),output=singing_pitch.pitch_stats(result))
 return result.astype(original.dtype)
singing_pitch.smooth_pitch=stable_pitch
print('A and C prepared; converting diagnostic B with stronger pitch stability only.',flush=True)
result=run(dict(data_root=str(root),repo=str(root/'data/seed-vc'),source=str(root/'exports/singing/country-roads-reference-comparison-20261026/guide.wav'),reference=str(root/'data/custom-voice/references/mana-v2/singing-stable-v1.wav'),start=0,seconds=12,separate=False,output=str(out/'pitch-test'),diffusion_steps=50,guidance=.7,seed=42,pitch_smoothing=True))
b,br=sf.read(result['vocal'],always_2d=True);assert br==sr and abs(len(b)-len(a))<sr*.05
checks['B-pitch-stability']=audition(out/'B-pitch-stability.wav',b,br)
report={'purpose':'Isolate pitch vs level flutter; diagnostic only','sourceSeconds':[36,48],'reference':'singing-stable-v1.wav','sameReferenceContentAsBaseline':True,'seed':42,'steps':50,'guidance':.7,'pitchShift':0,'A':'Current approved-reference conversion','B':'Stronger guide pitch stabilization; no level processing','C':'Current conversion with gentle level stabilization; no pitch changes','condition':condition,'audioChecks':checks,'productionChanged':False,'listeningApproved':False}
(out/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print('DONE: '+str(out),flush=True)
