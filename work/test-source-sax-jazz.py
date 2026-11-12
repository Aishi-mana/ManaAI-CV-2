"""Sax-led Jazz preference audition; source-derived monophonic line, no new solo."""
from pathlib import Path
import os,sys,json,hashlib
root=Path.cwd();os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path[:0]=[str(root/'scripts'),str(root/'data/transcription-packages')]
import numpy as np,soundfile as sf
from arrangement_replacement import render_separate,render_soundfont,SR
base=root/'exports/singing/source-jazz-pop-20261108'
source=root/'exports/singing/tsumugi-country-dynamics-20261108/checks.json'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
data=json.loads(source.read_text(encoding='utf-8'))
events=[[*n[:3],v/127] for n,v in zip(data['notes'],data['velocities'])]
seconds=30;hop=.01
line=np.zeros(3000,dtype=int);level=np.zeros(3000)
for i in range(len(line)):
    t=i*hop
    active=[n for n in events if n[0]<=t<n[1] and n[2]>=55 and n[3]>=.35]
    if active:
        note=max(active,key=lambda n:(n[2],n[3]));line[i]=note[2];level[i]=note[3]
notes=[];first=0
for i in range(1,len(line)+1):
    if i<len(line) and line[i]==line[first]:continue
    if line[first]>0 and i-first>=8:
        notes.append([first*hop,i*hop,int(line[first]),float(np.mean(level[first:i]))])
    first=i
assert notes
assert all(any(n[2]==e[2] and e[0]<n[1] and e[1]>n[0] for e in events) for n in notes)
# Never invent a second lead phrase: sax follows only this source upper-note line.
velocities=[int(np.clip(n[3]*100,40,90)) for n in notes]
print('Rendering',len(notes),'source upper-line sax notes',flush=True)
sax=render_separate(notes,seconds,root,'sax',0,None,midi_velocities=velocities,sax_release_cc=20)
comp=[n for n in events if n[2]<60]
piano=render_soundfont(comp,seconds,root,0,0,midi_velocities=[max(1,round(n[3]*127*.75)) for n in comp])
rms=lambda x:float(np.sqrt(np.mean(x*x)))
def level_to(a,target):return a*min(target/max(rms(a),1e-8),.95/max(float(np.abs(a).max()),1e-8))
sax=level_to(sax,.07);piano=level_to(piano,.022)
bass,br=sf.read(base/'Jazz bass stem.wav',dtype='float32');drums,dr=sf.read(base/'Jazz drums stem.wav',dtype='float32')
assert br==dr==SR
bass=level_to(bass,.030);drums=level_to(drums,.017)
mix=sax+piano+bass+drums
mix=level_to(mix,.07)
assert np.isfinite(mix).all() and len(mix)==30*SR
out=root/'exports/singing/source-sax-jazz-20261108';out.mkdir(exist_ok=True)
sf.write(out/'Sax-led jazz - 30s.wav',mix,SR,subtype='PCM_24')
sf.write(out/'Sax source melody.wav',sax,SR,subtype='FLOAT')
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
report={'seconds':30,'peak':float(np.abs(mix).max()),'rms':rms(mix),'sax_notes':notes,
    'sax_patch':'Weresax sampled alto','melody_method':'Highest active source guitar note >=55 and velocity>=.35; contiguous same pitches merged, events shorter80ms omitted; monophonic reduction is unvalidated.',
    'piano_role':'Quiet lower-source-note accompaniment; no independent lead',
    'source_note_file_unchanged':True,'source_sax_note_count':len(notes),'generated_new_solo':False,
    'productionChanged':False,'listeningApproved':False,'limitations':'Melody reduction and sax phrasing need listening validation; a tone preference does not validate the whole Jazz route.'}
(out/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='sax_notes'}),flush=True)
