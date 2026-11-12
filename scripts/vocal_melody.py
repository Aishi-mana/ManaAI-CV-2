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

def vocal_pitch(source):
 from arrangement_replacement import SR
 return librosa.pyin(source,sr=SR,fmin=librosa.note_to_hz('C3'),fmax=librosa.note_to_hz('C6'),frame_length=2048,hop_length=120,fill_na=np.nan)

def track_vocal_notes(source,seconds,instrument='harmonica',pitch_data=None):
 from arrangement_replacement import SR
 hop=120
 f0,voiced,prob=vocal_pitch(source) if pitch_data is None else pitch_data
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

def band_vocal_notes(source,seconds):
 """Recover quiet pitched notes between the stable notes used for the band lead."""
 from arrangement_replacement import SR
 hop=120/SR
 def rms(a,b):
  samples=source[round(a*SR):round(b*SR)]
  return float(np.sqrt(np.mean(samples**2))) if len(samples) else 0.
 # Track bounded, overlapping windows for whole songs. Keep notes by onset.
 tracked=[];candidates=[]
 for start in range(0,len(source),24*SR):
  left=max(0,start-2*SR);right=min(len(source),start+26*SR)
  segment=source[left:right]
  if np.max(np.abs(segment))<1e-6:continue
  # Peak normalization keeps quiet pitch candidates independent of stem gain.
  pitch_data=vocal_pitch(segment)
  normalized=segment*(.85/np.max(np.abs(segment)))
  recovery=vocal_pitch(normalized)
  offset=left/SR
  for a,b,p,v in track_vocal_notes(segment,len(segment)/SR,'electric-piano',pitch_data):
   a,b=a+offset,min(seconds,b+offset)
   if start/SR<=a<(start+24*SR)/SR and a<b:tracked.append([a,b,p,v])
  f0,voiced,prob=recovery
  valid=voiced & np.isfinite(f0) & (prob>=.42)
  pitch=np.zeros(len(f0),int)
  pitch[valid]=np.rint(librosa.hz_to_midi(f0[valid])).astype(int)
  pitch=median_filter(pitch,size=5)
  bounds=np.r_[0,np.flatnonzero(pitch[1:]!=pitch[:-1])+1,len(pitch)]
  for a,b in zip(bounds,bounds[1:]):
   begin=a*hop+offset
   if pitch[a]>0 and b-a>=11 and start/SR<=begin<(start+24*SR)/SR:
    candidates.append((begin,min(seconds,b*hop+offset),int(pitch[a]),prob,a))
 if not tracked:raise ValueError('No stable sung melody found. Choose a section with a clear lead vocal.')
 strengths=[rms(a,b) for a,b,_,_ in tracked]
 reference=max(float(np.percentile(strengths,85)),1e-9)
 melody=[]
 for (a,b,p,_),level in zip(tracked,strengths):
  if level<reference*.10:continue
  if melody and a<melody[-1][1]:
   if p==melody[-1][2]:
    melody[-1][1]=max(melody[-1][1],b);continue
   a=melody[-1][1]
  if a<b:melody.append([a,b,p,float(np.clip(level/reference,.15,1))])
 if not melody:raise ValueError('No audible lead notes found.')
 rests=[(0.,melody[0][0])]+[(a[1],b[0]) for a,b in zip(melody,melody[1:])]+[(melody[-1][1],seconds)]
 restored=[]
 for a,b,p,prob,frame in candidates:
  for start,end in rests:
   begin,finish=max(a,start,restored[-1][1] if restored else 0.),min(b,end)
   if finish-begin<.07:continue
   confidence=float(np.mean(prob[frame+round((begin-a)/hop):frame+round((finish-a)/hop)]))
   strength=rms(begin,finish)/reference
   if confidence>=.65 and strength>=.035:
    restored.append([begin,finish,p,float(np.clip(strength,.18,1))])
 return sorted(melody+restored)

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
