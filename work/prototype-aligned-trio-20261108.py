from pathlib import Path
import sys,os,json,math,hashlib
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
import numpy as np,soundfile as sf,librosa
from scipy.signal import resample_poly
from arrangement_replacement import render_soundfont,SR
previous=root/'exports/singing/note-jazz-prototype-20261108'
out=root/'exports/singing/rhythm-aligned-trio-20261108';out.mkdir(exist_ok=True,parents=True)
saved=json.loads((previous/'notes-and-chords.json').read_text())
beat_report=json.loads((previous/'whole-source-beats.json').read_text())
source=Path(saved['source']);digest=hashlib.sha256(source.read_bytes()).hexdigest()
original,sr=sf.read(source,always_2d=True,dtype='float32');g=math.gcd(sr,SR);audio=resample_poly(original.mean(1),SR//g,sr//g);duration=len(audio)/SR
whole=np.asarray(beat_report['beatTimes'])-4
beats=whole[(whole>=0)&(whole<duration)]
barlines=whole[::4];bounds=sorted(set([0.,duration,*barlines[(barlines>0)&(barlines<duration)].tolist()]))
chroma=librosa.feature.chroma_stft(y=librosa.effects.harmonic(audio),sr=SR,hop_length=256)
templates=[]
for pc in range(12):
 for third in (3,4):
  v=np.zeros(12);v[[pc,(pc+third)%12,(pc+7)%12]]=[1,.8,.7];templates.append((pc,third,v/np.linalg.norm(v)))
chords=[]
for start,end in zip(bounds,bounds[1:]):
 lo=int(start*SR/256);hi=max(lo+1,int(end*SR/256));energy=chroma[:,lo:hi].mean(1)
 pc,third,_=max(templates,key=lambda c:float(energy@c[2]));chords.append(dict(start=start,end=end,root=pc,third=third))
bass=[];drums=[]
def add(notes,t,d,p,v):
 if 0<=t<duration:notes.append([float(t),min(duration,float(t+d)),int(p),float(v)])
for t in beats:
 idx=int(np.argmin(abs(whole-t)));step=float(whole[idx+1]-t) if idx+1<len(whole) else 60/beat_report['bpm']
 chord=next(c for c in chords if c['start']<=t<c['end']);pc=chord['root'];third=chord['third']
 # Same source beat clock for bass, ride and sidestick. No extra piano chords.
 add(bass,t,step*.85,36+pc+[0,7,third,7][idx%4],.5)
 add(drums,t,.10,51,.25)
 if idx%2:add(drums,t,.08,37,.18);add(drums,t+step*2/3,.07,51,.16)
 else:add(drums,t,.08,36,.16)
parts=[]
for name,notes,program,percussion,target in [('source-piano',saved['melody'],0,False,.065),('aligned-bass',bass,32,False,.032),('aligned-drums',drums,0,True,.010)]:
 a=render_soundfont(notes,duration,root,program,0,percussion=percussion);rms=float(np.sqrt(np.mean(a*a)));assert rms>1e-6
 a*=min(target/rms,.9/max(float(abs(a).max()),1e-6));sf.write(out/(name+'.wav'),a,SR,subtype='PCM_16');parts.append(a)
mix=sum(parts);mix*=min(.07/float(np.sqrt(np.mean(mix*mix))),.95/max(float(abs(mix).max()),1e-6))
assert np.isfinite(mix).all() and len(mix)==len(audio)
sf.write(out/'Source aligned trio - 12s.wav',mix,SR,subtype='PCM_16')
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
(out/'checks.json').write_text(json.dumps(dict(duration=duration,peak=float(abs(mix).max()),sourceSha256=digest,bpmEstimatedFrom90Seconds=beat_report['bpm'],previousShortEstimate=saved['bpmEstimated'],beatTimes=beats.tolist(),chords=chords,pianoNotesUnchanged=True,extraPianoComp=False,bassNotes=bass,drumNotes=drums,productionChanged=False,listeningApproved=False),indent=2),encoding='utf-8')
print('ALIGNED_TRIO_READY',flush=True)
