from pathlib import Path
import os,sys,json,hashlib,math
root=Path(__file__).resolve().parents[1]
for k,v in {'NUMBA_CACHE_DIR':root/'data/music-cache/numba','TEMP':root/'work','TMP':root/'work'}.items():os.environ[k]=str(v)
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
sys.path[:0]=[str(root/'data/piano-transcription-packages'),str(root/'scripts')]
sys.path.append(str(root/'data/transcription-packages'))
import torch,numpy as np,soundfile as sf
from scipy.signal import resample_poly
from piano_transcription_inference import PianoTranscription
from arrangement_replacement import render_separate,SR
torch.set_num_threads(4)
checkpoint=root/'data/piano-transcription-models/CRNN_note_F1=0.9677_pedal_F1=0.9186.pth'
assert checkpoint.is_file() and checkpoint.stat().st_size==171966578
source=root/'exports/singing/mega-piano-extraction-20261108/Extracted piano - 12s.wav'
if len(sys.argv)>1:source=Path(sys.argv[1])
digest=hashlib.sha256(source.read_bytes()).hexdigest()
a,sr=sf.read(source,dtype='float32',always_2d=True);g=math.gcd(sr,16000)
a=resample_poly(a.mean(1),16000//g,sr//g).astype(np.float32)
seconds=len(a)/16000
out=root/'exports/singing/piano-crnn-20261108';out.mkdir(parents=True,exist_ok=True)
if len(sys.argv)>2:out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
transcriber=PianoTranscription(device='cpu',checkpoint_path=str(checkpoint))
result=transcriber.transcribe(a,str(out/'model-notes.mid'))
notes=[];velocities=[]
for event in result['est_note_events']:
 start=max(0.,float(event['onset_time']));end=min(seconds,float(event['offset_time']))
 if start>=seconds or end<=start:continue
 velocity=max(1,min(127,int(event['velocity'])))
 notes.append([start,end,int(event['midi_note']),velocity/127]);velocities.append(velocity)
assert notes
audio=render_separate(notes,seconds,root,'piano',0,None,midi_velocities=velocities)
audio*=min(1.,.95/max(float(abs(audio).max()),1e-9))
assert np.isfinite(audio).all() and len(audio)==round(seconds*SR)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
sf.write(out/f'Piano specific model - {seconds:g}s.wav',audio,SR,subtype='PCM_16')
report=dict(modelSha256=hashlib.sha256(checkpoint.read_bytes()).hexdigest(),notes=notes,midiVelocities=velocities,peak=float(abs(audio).max()),rms=float(np.sqrt(np.mean(audio*audio))),sourceUnchanged=True,normalization=False,addedAccompaniment=False,productionChanged=False,listeningApproved=False)
(out/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('PIANO_CRNN_READY notes='+str(len(notes)),flush=True)
