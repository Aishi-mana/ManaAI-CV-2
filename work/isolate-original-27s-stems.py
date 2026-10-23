from pathlib import Path
import sys,os,json
import soundfile as sf
import numpy as np
from scipy.signal import resample_poly
root=Path.cwd();out=root/'exports/singing/original-direction-preview-2026-10-18/issue-27s-stems';out.mkdir(exist_ok=True)
if (out/'diagnostic.json').exists():raise SystemExit('Existing diagnostic: reuse it')
x,sr=sf.read(root/'exports/singing/original-direction-preview-2026-10-18/original-song.wav',always_2d=True,dtype='float32');x=x[24*sr:30*sr]
x=resample_poly(x,147,160,axis=0) if sr==48000 else x
assert sr==48000
sf.write(out/'source-24-30s.wav',x,44100,subtype='FLOAT')
os.environ['HF_HUB_OFFLINE']='1';sys.path.insert(0,str(root/'scripts'))
from cover_lead import extract
extract(root,out/'source-24-30s.wav',out)
lead,_=sf.read(out/'lead-extracted.wav',always_2d=True);backing,_=sf.read(out/'backing-extracted.wav',always_2d=True);voices=x-backing
peak=max(float(np.abs(a).max()) for a in [lead,backing,voices,x]);gain=min(1,.95/max(peak,1e-9))
for name,a in [('lead-vocal',lead),('all-vocals',voices),('instruments',backing)]:
 assert np.isfinite(a).all();sf.write(out/(name+'.wav'),a*gain,44100,subtype='PCM_16')
report=dict(start=24,end=30,reportedIssue=27,excerptIssue=3,commonGain=gain,sourceUnchanged=True,separator='existing Mega lead/vocal',listeningPending=True)
(out/'diagnostic.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
