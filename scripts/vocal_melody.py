"""Lead-vocal pitch to instrument, including approved held-vowel cleanup."""
import numpy as np
import librosa
from scipy.ndimage import median_filter

from arrangement_replacement import EXTRA_PROGRAMS,SEPARATE_VARIANTS,NAM_GUITARS
PROGRAMS={**EXTRA_PROGRAMS,'piano':0,'sax':65,'electric-guitar':27,'electric-guitar-distorted':30,
 **{name:(66 if name=='sax-tenor' else 65 if kind=='sax' else 0 if kind=='piano' else 27) for name,(kind,patch) in SEPARATE_VARIANTS.items()}}

def stable_vocal_line(midi_pitch,valid):
 """Keep vibrato around a held key from becoming new key strikes; preserve rests."""
 result=np.zeros(len(midi_pitch),dtype=int)
 first=0
 while first<len(result):
  if not valid[first]:first+=1;continue
  end=first+1
  while end<len(result) and valid[end]:end+=1
  values=median_filter(midi_pitch[first:end],size=21,mode='nearest')
  held=int(round(values[0]));result[first:end]=held
  pending=None;since=0
  for i,value in enumerate(values):
   target=int(round(value))
   if abs(value-held)<.8 or target==held:pending=None;result[first+i]=held;continue
   if pending!=target:pending=target;since=i
   result[first+i]=held
   if i-since+1>=16:
    held=target;result[first+since:first+i+1]=held;pending=None
  first=end
 return result

def clean_held_notes(raw,source,sr=24000):
 def rms(a,b):
  x=source[max(0,round(a*sr)):min(len(source),round(b*sr))]
  return float(np.sqrt(np.mean(x*x))) if len(x) else 0.
 notes=[]
 for row in raw:
  n=list(row)
  if notes:
   previous=notes[-1];gap=n[0]-previous[1]
   same=n[2]==previous[2] and 0<=gap<=.065
   drift=abs(n[2]-previous[2])==1 and n[1]-n[0]<=.12 and previous[1]-previous[0]>=.45 and 0<=gap<=.02
   shoulder=rms(previous[1]-.05,previous[1])
   connected=rms(previous[1]-.005,n[0]+.005)>=max(shoulder*.3,1e-6) and rms(n[0],n[0]+.035)<=max(shoulder*1.8,1e-6)
   if (same or drift) and connected:
    previous[1]=n[1];previous[3]=max(previous[3],n[3]);continue
  notes.append(n)
 return notes

def track_vocal_notes(source,seconds,instrument='harmonica'):
 from arrangement_replacement import SR
 hop=120
 f0,voiced,prob=librosa.pyin(source,sr=SR,fmin=librosa.note_to_hz('C3'),fmax=librosa.note_to_hz('C6'),frame_length=2048,hop_length=hop,fill_na=np.nan)
 valid=voiced & np.isfinite(f0) & (prob>=.45)
 pitch=np.zeros(len(f0),dtype=int);pitch[valid]=np.rint(librosa.hz_to_midi(f0[valid])).astype(int)
 for i in range(1,len(pitch)-1):
  if pitch[i]==0 and pitch[i-1]==pitch[i+1] and pitch[i-1]>0:pitch[i]=pitch[i-1]
 line=stable_vocal_line(librosa.hz_to_midi(f0),valid) if instrument=='electric-piano' else median_filter(pitch,size=5)
 raw=[];first=0
 for i in range(1,len(line)+1):
  if i<len(line) and line[i]==line[first]:continue
  a,b=first*hop/SR,min(seconds,i*hop/SR)
  if line[first]>0 and b-a>=.08:raw.append([a,b,int(line[first]),float(np.mean(prob[first:i]))])
  first=i
 notes=clean_held_notes(raw,source)
 return notes

def render_vocal(path,seconds,root,instrument,custom):
 from arrangement_replacement import SR,render_soundfont,customize_notes
 import sys
 sys.path.insert(0,str(root/'data/transcription-packages'))
 import pretty_midi
 if instrument not in PROGRAMS:raise ValueError('Choose a supported vocal melody instrument.')
 source,_=librosa.load(path,sr=SR,duration=seconds)
 if not len(source) or not np.isfinite(source).all() or np.sqrt(np.mean(source**2))<1e-6:raise ValueError('No audible lead vocal in this section.')
 notes=track_vocal_notes(source,seconds,instrument)
 if instrument=='electric-piano':
  from electric_piano_replacement import merge_vocal_holds
  notes=merge_vocal_holds(notes,source)
 if not notes:raise ValueError('No stable sung melody found. Try a cleaner lead vocal.')
 strengths=[float(np.sqrt(np.mean(source[round(a*SR):round(b*SR)]**2))) for a,b,p,c in notes]
 reference=max(float(np.percentile(strengths,85)),1e-9)
 levels=[int(round(35+55*np.clip(s/reference,0,1))) for s in strengths]
 return render_vocal_notes(notes,levels,source,seconds,root,instrument,custom)

def render_vocal_notes(notes,levels,source,seconds,root,instrument,custom):
 from arrangement_replacement import SR,render_soundfont,render_separate,render_bright_room,customize_notes
 import sys
 sys.path.insert(0,str(root/'data/transcription-packages'))
 import pretty_midi
 if instrument not in PROGRAMS:raise ValueError('Choose a supported vocal melody instrument.')
 if instrument=='electric-piano':
  from electric_piano_replacement import render_electric_piano
  return render_electric_piano(notes,source,seconds,root,custom)
 entrances=[]
 if instrument=='synth-saw':
  from synth_lead_replacement import prepare_lead
  notes,levels=prepare_lead(notes,seconds,levels)
 if instrument=='ocarina':
  from ocarina_replacement import prepare_ocarina
  notes,levels,entrances=prepare_ocarina(notes,seconds,levels)
 shift=int(custom.get('pitch',0))
 if instrument in NAM_GUITARS:
  audio,notes=render_bright_room(notes,source,seconds,root,instrument,custom)
  shift=int(custom.get('pitch',NAM_GUITARS[instrument]['shift']))
 else:
  notes=customize_notes(notes,seconds,custom.get('extension',0))
  if instrument=='sax-weresax':audio=render_separate(notes,seconds,root,'sax',shift,None,midi_velocities=levels,sax_release_cc=32)
  elif instrument in SEPARATE_VARIANTS and instrument!='sax-tenor':
   kind,patch=SEPARATE_VARIANTS[instrument]
   audio=render_separate(notes,seconds,root,kind,shift,None,patch_name=patch,midi_velocities=levels)
  elif instrument in ['electric-guitar','electric-guitar-distorted']:
   audio=render_separate(notes,seconds,root,'electric-guitar',shift,'distorted' if instrument.endswith('distorted') else 'clean',midi_velocities=levels)
  else:audio=render_soundfont(notes,seconds,root,PROGRAMS[instrument],shift,midi_velocities=levels,release_scale=1.35 if instrument=='ocarina' else 1 if instrument=='synth-saw' else 1.2)
 if instrument=='ocarina':
  from ocarina_replacement import soften_ocarina
  audio=soften_ocarina(audio,entrances)
 if not np.isfinite(audio).all() or len(audio)!=round(seconds*SR):raise ValueError('The vocal melody instrument returned invalid audio.')
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=PROGRAMS[instrument])
 for (a,b,p,c),v in zip(notes,levels):track.notes.append(pretty_midi.Note(velocity=v,pitch=p+shift,start=a,end=b))
 midi.instruments.append(track)
 return audio,midi,notes
