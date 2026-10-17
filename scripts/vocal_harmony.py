"""Scale-aware third guide followed by Mana Seed-VC singing regeneration."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.ndimage import gaussian_filter1d

def choose_key(notes,choice):
 if choice!='auto':
  try:
   tonic,mode=choice.split(':');tonic=int(tonic)
   if not 0<=tonic<12 or mode not in ['major','minor']:raise ValueError()
   return tonic,mode
  except (ValueError,AttributeError):raise ValueError('Choose Auto or an available major/minor key.')
 hist=np.zeros(12)
 for a,b,p,c in notes:hist[p%12]+=(b-a)*c
 if not hist.any():raise ValueError('No melody found for harmony.')
 profiles={'major':[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],'minor':[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17]}
 scored=[(float(np.corrcoef(hist,np.roll(profile,t))[0,1]),t,m) for m,profile in profiles.items() for t in range(12)]
 _,tonic,mode=max(scored)
 return tonic,mode

def third_steps(pitch,tonic,mode,direction='above'):
 if direction not in ['above','below']:raise ValueError('Choose a third above or below.')
 scale=[0,2,4,5,7,9,11] if mode=='major' else [0,2,3,5,7,8,10]
 allowed={(tonic+p)%12 for p in scale}
 intervals=[3,4] if direction=='above' else [-3,-4]
 options=[d for d in intervals if (pitch+d)%12 in allowed]
 return options[0] if len(options)==1 else min(intervals,key=lambda d:min(min((pitch+d-q)%12,(q-pitch-d)%12) for q in allowed))

def load_section(path,start,seconds):
 # Validate against original file metadata, not a resampler's rounded frame count.
 info=sf.info(path)
 if start+seconds>info.frames/info.samplerate+1e-6:raise ValueError('Harmony section extends beyond the source vocal.')
 audio,sr=librosa.load(path,sr=24000,offset=start,duration=seconds)
 expected=round(seconds*sr)
 if abs(len(audio)-expected)>2:raise ValueError('Could not read the complete harmony section.')
 return librosa.util.fix_length(audio,size=expected),sr

def track_song(source,sr,tracker):
 """Bound pitch-tracking windows, retaining short context at joins."""
 notes=[];block=30*sr;context=round(.25*sr)
 for first in range(0,len(source),block):
  end=min(len(source),first+block);a=max(0,first-context);b=min(len(source),end+context)
  print(f'Tracking harmony melody {first/sr:.0f}–{end/sr:.0f}s…',flush=True)
  for start,stop,pitch,confidence in tracker(source[a:b],(b-a)/sr,'electric-piano'):
   begin=max(first/sr,start+a/sr);finish=min(end/sr,stop+a/sr)
   if finish-begin<.04:continue
   if notes and notes[-1][2]==pitch and abs(notes[-1][1]-begin)<.015:
    notes[-1][1]=finish;notes[-1][3]=max(notes[-1][3],confidence)
   else:notes.append([begin,finish,pitch,confidence])
 return notes

def harmony_guide(source,sr,decisions,direction):
 """Pitch shift bounded blocks with context; do not allocate whole-song STFTs."""
 guide=np.zeros(len(source));block=30*sr;context=round(.1*sr)
 for first in range(0,len(source),block):
  end=min(len(source),first+block);a=max(0,first-context);b=min(len(source),end+context)
  segment=source[a:b];mixed=np.zeros(len(segment))
  for delta in ([3,4] if direction=='above' else [-3,-4]):
   weight=np.zeros(len(segment))
   for start,stop,pitch,step in decisions:
    if step!=delta or stop<=a/sr or start>=b/sr:continue
    weight[max(0,round(start*sr)-a):min(len(segment),round(stop*sr)-a)]=1
   if weight.any():mixed+=librosa.effects.pitch_shift(segment,sr=sr,n_steps=delta)*gaussian_filter1d(weight,.015*sr)
  guide[first:end]=mixed[first-a:end-a]
 return guide

def run_harmony(p):
 from vocal_melody import track_vocal_notes
 from singing_job import run
 whole=bool(p.get('whole_song',False))
 start=0. if whole else float(p['start'])
 seconds=sf.info(p['source']).duration if whole else float(p['seconds'])
 direction=p.get('harmony_direction') or 'above'
 if direction not in ['above','below']:raise ValueError('Choose a third above or below.')
 choose_key([[0,1,60,1]],p['harmony_key'])
 if not np.isfinite(start) or start<0 or not np.isfinite(seconds) or not 1<=seconds<=(3600 if whole else 30) or p.get('separate'):raise ValueError('Choose a1–30second dry vocal section or a whole vocal up to one hour.')
 out=Path(p['output']).resolve();out.mkdir(parents=True,exist_ok=True)
 source,sr=load_section(p['source'],start,seconds)
 if not np.isfinite(source).all() or np.sqrt(np.mean(source**2))<1e-5:raise ValueError('No audible singing for harmony.')
 print('Tracking vocal melody and preparing a third '+direction+'…',flush=True)
 notes=track_song(source,sr,track_vocal_notes) if whole else track_vocal_notes(source,seconds,'electric-piano')
 if not notes:raise ValueError('No stable sung melody found. Try a cleaner lead section.')
 tonic,mode=choose_key(notes,p['harmony_key'])
 decisions=[]
 for a,b,pitch,c in notes:
  delta=third_steps(pitch,tonic,mode,direction)
  decisions.append([a,b,pitch,delta])
 guide=harmony_guide(source,sr,decisions,direction)
 if np.sqrt(np.mean(guide**2))<1e-6:raise ValueError('No audible harmony guide found.')
 guide*=min(1.,.95/max(float(np.max(np.abs(guide))),1e-9))
 guide_path=out/'harmony-guide.wav';sf.write(guide_path,guide,sr)
 conversion={**p,'source':str(guide_path),'start':0,'seconds':seconds,'whole_song':whole,'separate':False,'output':str(out/'conversion')}
 conversion.pop('harmony_key',None)
 conversion.pop('harmony_direction',None)
 result=run(conversion)
 audio,_=librosa.load(result['vocal'],sr=sr)
 if abs(len(audio)-len(source))/sr>.2 or not np.isfinite(audio).all() or np.sqrt(np.mean(audio**2))<1e-5:raise ValueError('Harmony conversion returned invalid audio.')
 audio=librosa.util.fix_length(audio,size=len(source))
 if whole:
  gate=np.zeros(len(source))
  for a,b,pitch,delta in decisions:gate[round(a*sr):round(min(b,seconds)*sr)]=1
  audio*=gaussian_filter1d(gate,.02*sr)
  if np.sqrt(np.mean(audio**2))<1e-6:raise ValueError('No audible regenerated harmony in the sung regions.')
 audio*=np.sqrt(np.mean(source**2))/np.sqrt(np.mean(audio**2))
 audio*=min(1.,.95/max(float(np.max(np.abs(audio))),1e-9))
 path=out/'mana-harmony.wav';sf.write(path,audio,sr)
 (out/'harmony.json').write_text(json.dumps(dict(tonic=tonic,mode=mode,direction=direction,wholeSong=whole,estimated=p['harmony_key']=='auto',decisions=decisions,start=start,seconds=seconds)),encoding='utf-8')
 return dict(vocal=str(path),mix='',seconds=seconds,wholeSong=whole,harmony=True,harmonyDirection=direction,harmonyKey=f'{tonic}:{mode}')
