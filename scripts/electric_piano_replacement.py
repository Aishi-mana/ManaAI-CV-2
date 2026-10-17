"""Approved gentle electric piano dynamics and duration-dependent decay."""
import sys
import numpy as np

def merge_vocal_holds(notes,source,sr=24000):
 """Join same-pitch tracker fragments only across continuous, unaccented vocal."""
 def rms(a,b):
  x=source[max(0,round(a*sr)):min(len(source),round(b*sr))]
  return float(np.sqrt(np.mean(x*x))) if len(x) else 0.
 played=[]
 for row in notes:
  n=list(row)
  if played:
   previous=played[-1];gap=n[0]-previous[1]
   if n[2]==previous[2] and 0<=gap<=.15 and max(previous[1]-previous[0],n[1]-n[0])>=.28:
    before=rms(previous[1]-.06,previous[1])
    after=rms(n[0],n[0]+.04)
    # A breath/real reattack has a trough or rise; do not bridge either.
    windows=np.arange(previous[1]-.01,n[0]+.01,.01)
    floor=min((rms(t,t+.02) for t in windows),default=0.)
    if floor>=max(before*.25,1e-6) and after<=max(before*1.3,1e-6):
     previous[1]=n[1];previous[3]=max(previous[3],n[3]);continue
  played.append(n)
 return played

def prepare_touch(notes,source,sr=24000):
 strengths=[]
 for a,b,p,c in notes:
  section=source[max(0,round(a*sr)):min(len(source),round(min(b,a+.15)*sr))]
  strengths.append(float(np.sqrt(np.mean(section**2))) if len(section) else 0.)
 reference=max(float(np.percentile(strengths,85)),1e-9) if strengths else 1e-9
 levels=[max(1,round(int(round(28+67*np.clip(s/reference,0,1)**.8))*.88)) for s in strengths]
 releases=[1.8 if b-a>=.4 else 1.05 for a,b,p,c in notes]
 return levels,releases

def render_electric_piano(notes,source,seconds,root,custom):
 from arrangement_replacement import SR,render_soundfont,customize_notes
 sys.path.insert(0,str(root/'data/transcription-packages'))
 import pretty_midi
 levels,releases=prepare_touch(notes,source)
 performed=customize_notes(notes,seconds,custom.get('extension',0))
 shift=int(custom.get('pitch',0));audio=np.zeros(round(seconds*SR),dtype=np.float32)
 for release in [1.05,1.8]:
  indices=[i for i,value in enumerate(releases) if value==release]
  if indices:audio+=render_soundfont([performed[i] for i in indices],seconds,root,4,shift,midi_velocities=[levels[i] for i in indices],release_scale=release)
 if not performed or not np.isfinite(audio).all() or np.sqrt(np.mean(audio**2))<1e-6:raise ValueError('No usable electric piano melody found.')
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=4)
 for (a,b,p,c),level in zip(performed,levels):track.notes.append(pretty_midi.Note(velocity=level,pitch=p+shift,start=a,end=b))
 midi.instruments.append(track)
 return audio,midi,performed
