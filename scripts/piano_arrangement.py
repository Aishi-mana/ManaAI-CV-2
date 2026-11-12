"""Accepted source-note piano trio. No chord guessing or audio diffusion."""
from pathlib import Path
import os,sys,json,subprocess,math

def balance_gains(vocal,backing,gain=1.):
 import numpy as np
 if not math.isfinite(gain) or not 0<=gain<=1:raise ValueError('Backing volume must be between 0 and 1.')
 rms=lambda a:float(np.sqrt(np.mean(a*a)))
 vg=min(1.,rms(backing)/max(rms(vocal)*.65,1e-9)) if gain>0 else 1.
 mix=vocal*vg+backing*gain
 if not np.isfinite(mix).all():raise ValueError('Piano mix returned invalid audio.')
 return vg,min(.07/max(rms(mix),1e-9),.95/max(float(abs(mix).max()),1e-9))

def balance(vocal,backing,gain=1.):
 voice_gain,mix_gain=balance_gains(vocal,backing,gain)
 return (vocal*voice_gain+backing*gain)*mix_gain

def support_notes(notes):
 bass=[]
 for n in sorted([n for n in notes if n[2]<=56 and n[1]-n[0]>=.6],key=lambda n:(n[0],n[2])):
  if bass and n[0]-bass[-1][0]<1.2:continue
  pitch=int(n[2])
  while pitch>47:pitch-=12
  while pitch<36:pitch+=12
  bass.append([n[0],min(n[1],n[0]+1.2),pitch,n[3]])
 return bass

def extract_band_stem(backing,rate,root,out,source_kind="piano"):
 import soundfile as sf
 root=Path(root);out=Path(out);out.mkdir(parents=True,exist_ok=True)
 mono=backing.mean(0) if backing.ndim==2 else backing
 source=out/f'{source_kind}-source.wav';sf.write(source,backing.T if source_kind in ('keys','bass') else mono,rate,subtype='FLOAT')
 extracted=out/f'{source_kind}-extracted.wav'
 env=os.environ.copy();env.pop('CUDA_VISIBLE_DEVICES',None)
 subprocess.run([sys.executable,str(Path(__file__).resolve()),str(root),str(source),str(extracted),source_kind],env=env,check=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 return extracted

def arrange(backing,rate,root,out,percussion=False):
 import numpy as np,soundfile as sf
 from scipy.signal import resample_poly
 from arrangement_replacement import render_soundfont,SR
 from piano_transcription import transcribe,midi_for
 root=Path(root);out=Path(out);out.mkdir(parents=True,exist_ok=True)
 mono=backing.mean(0) if backing.ndim==2 else backing
 seconds=len(mono)/rate
 if not 1<=seconds<=60:raise ValueError('Piano trio supports 1–60 second previews. Choose a shorter section.')
 notes=transcribe(extract_band_stem(backing,rate,root,out),seconds,root)
 piano=render_soundfont(notes,seconds,root,4,0,midi_velocities=[max(1,round(n[3]*127*.9)) for n in notes])
 bass=support_notes(notes)
 low=render_soundfont(bass,seconds,root,32,0,midi_velocities=[max(1,round(n[3]*127*.65)) for n in bass])
 rms=lambda a:float(np.sqrt(np.mean(a*a)))
 low*=min(1.,rms(piano)*.25/max(rms(low),1e-9))
 taps=np.zeros_like(piano)
 if percussion and bass:
  taps=render_soundfont([[n[0],min(seconds,n[0]+.08),37,.2] for n in bass],seconds,root,0,0,percussion=True,midi_velocities=[30]*len(bass))
  taps*=min(1.,rms(piano+low)*.08/max(rms(taps),1e-9))
 mix=piano+low+taps
 if not np.isfinite(mix).all() or rms(mix)<1e-6:raise ValueError('No usable piano arrangement returned.')
 mix*=min(1.,.95/max(float(abs(mix).max()),1e-9))
 for name,a in [('warm-piano',piano),('upright-bass',low),('soft-taps',taps),('piano-trio',mix)]:sf.write(out/(name+'.wav'),a,SR,subtype='FLOAT')
 midi_for(notes,4).write(str(out/'piano-notes.mid'))
 metadata=dict(engine='piano-crnn-source-notes',seconds=seconds,percussion=bool(percussion),notes=notes,bassNotes=bass,timingVerified=False)
 (out/'piano-analysis.json').write_text(json.dumps(metadata),encoding='utf-8')
 return mix,metadata

if __name__=='__main__':
 import numpy as np,soundfile as sf
 from optional_separators import extract
 root,source,target=map(Path,sys.argv[1:4])
 kind={'piano':'piano-mega','keys':'keyboard-extract','bass':'bass-extract'}[sys.argv[4] if len(sys.argv)>4 else 'piano']
 audio,rate=sf.read(source,dtype='float32')
 sf.write(target,extract(audio,root,kind,input_rate=rate,output_rate=44100),44100,subtype='FLOAT')
