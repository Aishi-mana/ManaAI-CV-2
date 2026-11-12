"""Reference-guided feel comparison, not an imitation or transcription of its tune."""
from pathlib import Path
import os,sys,json,hashlib
root=Path.cwd();os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path[:0]=[str(root/'scripts'),str(root/'data/transcription-packages')]
import numpy as np,soundfile as sf
from arrangement_replacement import render_separate,render_soundfont,SR
base=root/'exports/singing/source-sax-jazz-20261108'
lead=json.loads((base/'checks.json').read_text(encoding='utf-8'))['sax_notes']
source=json.loads((root/'exports/singing/tsumugi-country-dynamics-20261108/checks.json').read_text(encoding='utf-8'))
events=[[*n[:3],v/127] for n,v in zip(source['notes'],source['velocities'])]
rock=json.loads((root/'exports/singing/source-rock-band-20261108/checks.json').read_text(encoding='utf-8'))
slow=np.asarray(rock['beat_times']);period=float(np.median(np.diff(slow)))
beats=sorted([float(v) for i,b in enumerate(slow) for v in [b,(b+(slow[i+1] if i+1<len(slow) else b+period))/2] if v<30])
seconds=30;out=root/'exports/singing/lively-reed-jazz-20261108';out.mkdir(exist_ok=True)
rms=lambda x:float(np.sqrt(np.mean(x*x)))
def level(x,target):return x*min(target/max(rms(x),1e-8),.95/max(float(np.abs(x).max()),1e-8))
def hit(a,t,p,v,hold):
 if 0<=t<seconds:a.append([float(t),float(min(seconds,t+hold)),int(p),v/127])
def low(p):
 while p>55:p-=12
 while p<36:p+=12
 return int(p)
bass=[];drums=[];piano_notes=[];evidence=[];previous=None
for i,b in enumerate(beats):
 end=beats[i+1] if i+1<len(beats) else min(30,b+period/2)
 active=[(k,n) for k,n in enumerate(events) if n[2]<=64 and n[3]>=.2 and n[0]<b+.10 and n[1]>b+.02]
 if not active:active=[(k,n) for k,n in enumerate(events) if n[2]<=56 and n[3]>=.2 and b<=n[0]<end]
 if active:
  if i%4==0:chosen=min(active,key=lambda x:x[1][2])
  else:
   alternatives=[v for v in active if low(v[1][2])!=previous] or active
   chosen=min(alternatives,key=lambda x:(abs(low(x[1][2])-(previous if previous is not None else 43)),-x[1][3]))
  pitch=low(chosen[1][2]);hit(bass,b,pitch,86 if i%4==0 else 73,(end-b)*.8);previous=pitch
  evidence.append({'time':b,'source_note_index':chosen[0],'source_pitch':chosen[1][2],'bass_pitch':pitch})
  # Low source notes make compact accompaniment stabs; sax/clarinet keeps melody.
  if i%2:
   chord=sorted([n for _,n in active if n[2]<60],key=lambda n:(-n[3],n[2]))[:3]
   for n in chord:hit(piano_notes,b+(end-b)*.08,n[2],65,.18)
 hit(drums,b,51,67 if i%2==0 else 57,.2)
 if i%2:hit(drums,b+(end-b)*2/3,51,49,.14)
 if i%2:
  hit(drums,b,44,48,.07)
  hit(drums,b,38,47,.07)
 if i%4==0:hit(drums,b,36,53,.08)
def render(notes,program,drum=False):
 return render_soundfont(notes,seconds,root,program,0,percussion=drum,midi_velocities=[max(1,round(n[3]*127)) for n in notes])
upright=level(render(bass,32),.036)
kit=level(render(drums,32,True),.027)
piano=level(render(piano_notes,0),.025)
velocities=[int(np.clip(78+n[3]*42,85,118)) for n in lead]
sax=render_separate(lead,seconds,root,'sax',0,None,midi_velocities=velocities,sax_release_cc=6)
clarinet=render_soundfont(lead,seconds,root,71,0,midi_velocities=velocities)
report={}
for name,solo in [('Punchier sax swing',sax),('Clarinet-led swing',clarinet)]:
 solo=level(solo,.07);mix=level(solo+upright+kit+piano,.07)
 assert len(mix)==SR*seconds and np.isfinite(mix).all()
 sf.write(out/(name+' - 30s.wav'),mix,SR,subtype='PCM_24')
 report[name]={'peak':float(np.abs(mix).max()),'rms':rms(mix),'seconds':seconds}
report.update(source='Country Roads0–30s',lead_notes=lead,lead_pitch_and_note_times_unchanged=True,
 melody_reduction_unvalidated=True,feel='Double-time swing accompaniment; source melody timing and duration unchanged',
 bass_notes=bass,bass_source_evidence=evidence,drum_notes=drums,piano_notes=piano_notes,
 reference='Elvis Special Theme (Final Ver.) Bravely Default II OST.mp3: style reference only, no melody/audio copied',
 instrument_estimates_are_provisional=True,productionChanged=False,listeningApproved=False)
(out/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k in ['Punchier sax swing','Clarinet-led swing']}),flush=True)
