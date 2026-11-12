"""Shared offline acoustic-piano note inference; never downloads a checkpoint."""
from pathlib import Path
import os,sys,math,hashlib

PIANO_SOURCES={'piano','piano-banquet'}
MODEL_SHA256='c3fa9730725bf4a762f1c14bc80cd5986eacda01b026f5a4a2525cd607876141'

def transcribe(path,seconds,root):
 root=Path(root)
 if not math.isfinite(seconds) or not 0<seconds<=360:raise ValueError('Choose a piano section up to 360 seconds.')
 checkpoint=root/'data/piano-transcription-models/CRNN_note_F1=0.9677_pedal_F1=0.9186.pth'
 if not checkpoint.is_file() or hashlib.sha256(checkpoint.read_bytes()).hexdigest()!=MODEL_SHA256:
  raise ValueError('Restore the installed piano transcription model in data/piano-transcription-models.')
 packages=root/'data/piano-transcription-packages'
 if not (packages/'piano_transcription_inference').is_dir():raise ValueError('Piano transcription helper packages are missing.')
 os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
 os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
 sys.path[:0]=[str(packages)]
 sys.path.append(str(root/'data/transcription-packages'))
 import torch,numpy as np,soundfile as sf
 from scipy.signal import resample_poly
 from piano_transcription_inference import PianoTranscription
 torch.set_num_threads(4)
 audio,rate=sf.read(path,always_2d=True,dtype='float32')
 audio=audio[:round(seconds*rate)].mean(1)
 if not len(audio) or not np.isfinite(audio).all():raise ValueError('Use finite piano audio.')
 if float(np.sqrt(np.mean(audio*audio)))<1e-6:raise ValueError('No audible piano in this section.')
 g=math.gcd(rate,16000);audio=resample_poly(audio,16000//g,rate//g).astype(np.float32)
 model=PianoTranscription(device='cpu',checkpoint_path=str(checkpoint))
 result=model.transcribe(audio,None)
 notes=[]
 for event in result['est_note_events']:
  a=max(0.,float(event['onset_time']));b=min(seconds,float(event['offset_time']))
  if a>=b:continue
  velocity=max(1,min(127,int(event['velocity'])))
  notes.append([a,b,int(event['midi_note']),velocity/127])
 notes.sort(key=lambda n:(n[0],n[2]))
 if not notes:raise ValueError('No usable piano notes detected. Try another section.')
 return notes

def midi_for(notes,program=0,shift=0):
 import pretty_midi
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=program)
 for a,b,p,v in notes:
  if not 0<=p+shift<=127:raise ValueError('Shifted piano note is outside MIDI range.')
  track.notes.append(pretty_midi.Note(start=a,end=b,pitch=p+shift,velocity=max(1,min(127,round(v*127)))))
 midi.instruments.append(track);return midi
