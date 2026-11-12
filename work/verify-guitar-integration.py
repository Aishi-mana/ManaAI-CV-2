from pathlib import Path
import sys,os,json,hashlib
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
import numpy as np,soundfile as sf
from guitar_arrangement import render_source
from cover_genre import restyle_backing
out=root/'exports/singing/guitar-production-verification-20261108';out.mkdir(exist_ok=True)
baseline=root/'exports/singing/tsumugi-country-smoother-20261108/Smoother electric guitar - 30s.wav'
old,sr=sf.read(baseline);audio,midi,notes=render_source(root/'exports/singing/tsumugi-country-dynamics-20261108/Original guitar.wav',30,root)
rms=lambda x:float(np.sqrt(np.mean(x*x)))
audio*=min(.07/max(rms(audio),1e-9),.95/max(float(abs(audio).max()),1e-9))
sf.write(out/'production-country-solo.wav',audio,24000,subtype='PCM_24')
report={'approved_audition_wave_correlation':float(np.corrcoef(old,audio)[0,1]),'notes':len(notes),'rendered_notes':sum(len(i.notes) for i in midi.instruments),'cases':[]}
assert len(audio)==len(old) and np.isfinite(audio).all() and report['approved_audition_wave_correlation']>.995
for name,source,start in [('country','1794090410615',18),('reach','1791866715929',9)]:
 path=root/'exports/singing'/source/'backing-extracted.wav';digest=hashlib.sha256(path.read_bytes()).hexdigest()
 a,rate=sf.read(path,always_2d=True,dtype='float32');a=a[start*rate:(start+10)*rate]
 b,meta=restyle_backing(a.T,rate,'rock',out/name,root)
 assert b.shape==a.T.shape and np.isfinite(b).all() and float(np.abs(b).max())<=.981
 assert hashlib.sha256(path.read_bytes()).hexdigest()==digest
 case={'name':name,'shape':list(b.shape),'seconds':b.shape[1]/rate,'engine':meta['engine'],'selected_guitar':meta['source']['selected'],'notes':len(meta['notes']),'source_unchanged':True}
 report['cases'].append(case);print(json.dumps(case),flush=True)
(out/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
