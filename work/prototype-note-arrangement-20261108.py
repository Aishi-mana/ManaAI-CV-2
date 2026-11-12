"""Offline note/chord-based jazz audition. No production or saved-source changes."""
from pathlib import Path
import sys,json,math,hashlib,faulthandler,os
faulthandler.dump_traceback_later(60,repeat=True)
import numpy as np,soundfile as sf
from scipy.signal import resample_poly
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=str(root/'work');os.environ['TMP']=str(root/'work')
import librosa
from arrangement_replacement import render_soundfont,SR,piano_notes
out=root/'exports/singing/note-jazz-prototype-20261108';out.mkdir(exist_ok=True,parents=True)
source=root/'exports/singing/genre-controlled-20261107/source.wav'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
a,sr=sf.read(source,always_2d=True,dtype='float32');g=math.gcd(sr,SR);audio=resample_poly(a.mean(1),SR//g,sr//g)
seconds=len(audio)/SR
print('ANALYZE',flush=True)
harmonic=librosa.effects.harmonic(audio)
sys.path.insert(0,str(root/'data/transcription-packages'))
from basic_pitch import build_icassp_2022_model_path,FilenameSuffix
from basic_pitch.inference import predict
model=build_icassp_2022_model_path(FilenameSuffix.onnx)
assert Path(model).is_file(),'Only use the already-installed transcription model'
_,_,events=predict(str(source),model_or_model_path=model,minimum_note_length=60,minimum_frequency=130.81,maximum_frequency=2093,onset_threshold=.35,frame_threshold=.25)
melody=piano_notes(events,seconds)
assert len(melody)>=4,'Too few reliable melody notes; do not offer an unsupported arrangement'
chroma=librosa.feature.chroma_stft(y=harmonic,sr=SR,hop_length=256)
tempo,frames=librosa.beat.beat_track(y=audio,sr=SR,hop_length=256)
bpm=float(np.asarray(tempo).reshape(-1)[0])
while bpm>160:bpm/=2
while 0<bpm<65:bpm*=2
if bpm<=0:raise ValueError('No usable beat estimate')
beat=60/bpm
detected=librosa.frames_to_time(frames,sr=SR,hop_length=256)
origin=float(detected[0]) if len(detected) else 0
# Keep detected phase; anchor all generated accompaniment to one clock.
beats=np.arange(origin,seconds,beat)
boundaries=sorted(set([0.0,*[float(x) for x in beats[::4]],seconds]))
templates=[]
for pc in range(12):
 for third in (3,4):
  v=np.zeros(12);v[[pc,(pc+third)%12,(pc+7)%12]]=[1,.8,.7]
  templates.append((pc,third,v/np.linalg.norm(v)))
chords=[];comp=[];bass=[];drums=[]
def add(notes,t,d,p,v):
 if t<seconds and d>0:notes.append([max(0,float(t)),min(seconds,float(t+d)),int(p),float(v)])
for start,end in zip(boundaries,boundaries[1:]):
 if end-start<beat*.5:continue
 lo=int(start*SR/256);hi=max(lo+1,int(end*SR/256));energy=chroma[:,lo:hi].mean(1)
 pc,third,_=max(templates,key=lambda c:float(energy@c[2]))
 chords.append(dict(start=start,end=end,root=pc,third=third,estimated=True))
 hits=beats[(beats>=start)&(beats<end)]
 base=36+pc
 for i,t in enumerate(hits):
  for pitch in (base+12+third,base+19,base+22 if third==3 else base+23):
   if i%2==0:add(comp,t+beat*2/3,beat*.32,pitch,.3)
  add(bass,t,beat*.85,base+[0,third,7,9][i%4],.48)
for i,t in enumerate(beats):
 add(drums,t,.12,51,.25) # sampled ride, no generated noise
 if i%2:add(drums,t,.10,37,.22)
 if i%2==0:add(drums,t,.10,36,.22)
 if i%2:add(drums,t+beat*2/3,.08,51,.18)
(out/'notes-and-chords.json').write_text(json.dumps(dict(source=str(source),sourceSha256=digest,bpmEstimated=bpm,beatOrigin=origin,melody=melody,chords=chords,piano=comp,bass=bass,drums=drums),indent=2),encoding='utf-8')
print('RENDER',len(melody),'melody notes',len(chords),'chords',flush=True)
parts=[]
for name,notes,program,percussion,target in [('melody',melody,0,False,.065),('piano-comp',comp,0,False,.025),('upright-bass',bass,32,False,.038),('ride-and-drums',drums,0,True,.012)]:
 samples=render_soundfont(notes,seconds,root,program,0,percussion=percussion)
 rms=float(np.sqrt(np.mean(samples*samples)));assert rms>1e-6
 samples*=min(target/rms,.9/max(float(abs(samples).max()),1e-6))
 sf.write(out/(name+'.wav'),samples,SR,subtype='PCM_16');parts.append(samples)
mix=sum(parts);mix*=min(.07/float(np.sqrt(np.mean(mix*mix))),.95/max(float(abs(mix).max()),1e-6))
assert np.isfinite(mix).all() and len(mix)==round(seconds*SR)
sf.write(out/'Note based jazz - 12s.wav',mix,SR,subtype='PCM_16')
audio*=min(.07/float(np.sqrt(np.mean(audio*audio))),.95/max(float(abs(audio).max()),1e-6))
sf.write(out/'Original backing - 12s.wav',audio,SR,subtype='PCM_16')
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
(out/'checks.json').write_text(json.dumps(dict(seconds=seconds,peak=float(abs(mix).max()),melodyNotes=len(melody),chords=len(chords),bpmEstimated=bpm,sourceUnchanged=True,productionChanged=False,transcriptionVerified=False,listeningApproved=False),indent=2),encoding='utf-8')
print('AUDITION_READY',flush=True)
