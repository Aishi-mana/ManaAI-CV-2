"""Offline musical-map prerequisite, no genre rendering or production changes."""
from pathlib import Path
import os,sys,json
root=Path.cwd();model=root/'data/arrangement-models/beat-this/final0.ckpt'
assert model.is_file() and model.stat().st_size==81058141, f'User-supplied final0.ckpt required: {model}'
os.environ['HF_HUB_OFFLINE']='1';os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path[:0]=[str(root/'work/beat-this'),str(root/'data/mega-packages')]
import torch,numpy as np,soundfile as sf
torch.set_num_threads(4)
def blocked(*args,**kwargs):raise RuntimeError('Automatic model downloads disabled.')
torch.hub.load_state_dict_from_url=blocked
torch.hub.download_url_to_file=blocked
from beat_this.inference import File2Beats
tracker=File2Beats(checkpoint_path=str(model),device='cpu',dbn=False)
out=root/'exports/singing/source-beat-grid-20261108';out.mkdir(exist_ok=True)
report={}
for name,source,start in [('Country Roads','1794090410615',0),('Reach Out to the Truth','1791866715929',9)]:
    path=root/'exports/singing'/source/'backing-extracted.wav'
    beats,downbeats=tracker(str(path))
    beats=np.asarray(beats);downbeats=np.asarray(downbeats)
    assert np.isfinite(beats).all() and np.all(np.diff(beats)>0)
    chosen=beats[(beats>=start)&(beats<start+30)]-start
    bars=downbeats[(downbeats>=start)&(downbeats<start+30)]-start
    assert len(chosen)>=10 and len(bars)>=2,'Too little stable beat evidence; do not invent a grid.'
    a,sr=sf.read(path,always_2d=True,dtype='float32');a=a[start*sr:(start+30)*sr]
    a*=.07/max(float(np.sqrt(np.mean(a*a))),1e-8)
    for beat in chosen:
        # Raw downbeat detections vary between two/four beats; do not accent unverified bars.
        n=round(sr*.035);t=np.arange(n)/sr
        cue=np.sin(2*np.pi*1000*t)*np.exp(-t/.008)*.11
        p=round(beat*sr);n=min(n,len(a)-p);a[p:p+n]+=cue[:n,None]
    a*=min(1.,.95/max(float(np.abs(a).max()),1e-8))
    sf.write(out/(name+' - beat check.wav'),a,sr,subtype='PCM_24')
    report[name]={'source':str(path),'source_start':start,'beats':chosen.tolist(),'downbeats':bars.tolist(),
        'median_bpm':float(60/np.median(np.diff(chosen))),'bar_starts_validated':False,'purpose':'Check beat pulse only. Raw bar starts are inconsistent and not accented; not a Rock/Jazz/Pop result.'}
(out/'beat-analysis.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
