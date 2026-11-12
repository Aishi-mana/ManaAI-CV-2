"""Four Pop lead auditions, one shared melody and identical rhythm section."""
from pathlib import Path
import os,sys,json,hashlib
root=Path.cwd();os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path[:0]=[str(root/'scripts'),str(root/'data/transcription-packages')]
import numpy as np,soundfile as sf
from arrangement_replacement import render_soundfont,render_separate,SR
out=root/'exports/singing/pop-lead-choices-20261108';out.mkdir(exist_ok=True)
source=root/'exports/singing/tsumugi-country-dynamics-20261108/checks.json'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
data=json.loads(source.read_text(encoding='utf-8'))
events=[[*n[:3],v/127] for n,v in zip(data['notes'],data['velocities'])]
lead=json.loads((root/'exports/singing/source-sax-jazz-20261108/checks.json').read_text(encoding='utf-8'))['sax_notes']
seconds=30;start=18;duration=12
rms=lambda x:float(np.sqrt(np.mean(x*x)))
def level(x,target):return x*min(target/max(rms(x),1e-8),.95/max(float(np.abs(x).max()),1e-8))
def render(notes,program,velocities=None):
 return render_soundfont(notes,seconds,root,program,0,midi_velocities=velocities or [max(1,round(n[3]*127)) for n in notes])
comp=[n for n in events if n[2]<60]
keys=level(render(comp,4),.018)
base=root/'exports/singing/source-jazz-pop-20261108'
pad,sr=sf.read(base/'Pop pad stem.wav',dtype='float32');assert sr==SR
bass,sr=sf.read(base/'Pop bass stem.wav',dtype='float32');assert sr==SR
drums,sr=sf.read(base/'Pop drums stem.wav',dtype='float32');assert sr==SR
backing=keys+pad+bass+drums
backing_hash=hashlib.sha256(backing.tobytes()).hexdigest()
velocities=[int(np.clip(round(n[3]*110),35,110)) for n in lead]
options=[('electric-piano','Electric piano',4),('acoustic-piano','Acoustic piano',0),('synth-lead','Synth lead',81),('clean-guitar','Clean electric guitar',None)]
report={'default_lead':'electric-piano','choices':[],'source_lead_notes':lead,
 'scope':'Lead-only comparison; same source-derived monophonic reduction and rhythm section for all choices.',
 'melody_reduction_not_fully_validated':True,'productionChanged':False,'listeningApproved':False}
for ident,label,program in options:
 print('Rendering Pop lead:',label,flush=True)
 if program is None:
  solo=render_separate(lead,seconds,root,'electric-guitar',0,'clean',midi_velocities=velocities,guitar_release=.25)
 else:solo=render(lead,program,velocities)
 solo=level(solo,.065)
 mix=solo+backing
 mix=level(mix,.07)
 assert len(mix)==seconds*SR and np.isfinite(mix).all()
 sf.write(out/('Pop - '+label+' - 30s.wav'),mix,SR,subtype='PCM_24')
 excerpt=mix[start*SR:(start+duration)*SR]
 sf.write(out/('Pop - '+label+' - 12s.wav'),excerpt,SR,subtype='PCM_24')
 assert len(excerpt)==duration*SR
 report['choices'].append({'id':ident,'label':label,'program':program,'excerpt_source_start':start,'excerpt_seconds':duration,
  'peak':float(np.abs(mix).max()),'rms':rms(mix),'shared_backing_sha256':backing_hash})
 assert hashlib.sha256(backing.tobytes()).hexdigest()==backing_hash
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
sf.write(out/'Shared Pop rhythm section.wav',backing,SR,subtype='FLOAT')
(out/'choices.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report['choices']),flush=True)
