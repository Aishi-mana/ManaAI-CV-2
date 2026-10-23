"""Experimental isolated guitar transcription and sample-based instrument playback."""
import json,re,base64,io,sys
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from scipy.ndimage import median_filter
SR=24000
NAM_GUITARS={
 'guitar-bright-room':dict(shift=2,input_db=0,release=1.1,brightness=.55,room=.10,delay=0),
 'guitar-nam-warm':dict(shift=0,input_db=-6,release=.85,brightness=0,room=.08,delay=0),
 'guitar-nam-rhythm':dict(shift=0,input_db=0,release=.65,brightness=.20,room=.04,delay=0),
 'guitar-nam-lead':dict(shift=0,input_db=0,release=1.25,brightness=.35,room=.10,delay=.08)}
EXTRA_PROGRAMS={'acoustic-guitar':25,'nylon-guitar':24,'finger-bass':33,'picked-bass':34,'acoustic-bass':32,'trumpet':56,'violin':40,'strings':48,'flute':73,'harp':46,'electric-piano':4,'fm-piano':5,'organ':19,'accordion':21,'harpsichord':6,'clavinet':7,'harmonica':22,'ocarina':79,'synth-square':80,'synth-saw':81,'synth-pad':89,'synth-poly':90}
SEPARATE_VARIANTS={
 'sax-tenor':('sax',None),
 'sax-weresax':('sax',None),
 'guitar-bright-room':('electric-guitar','BlackAndGreenGuitars/Programs/04-green_twang.sfz'),
 'guitar-nam-warm':('electric-guitar','BlackAndGreenGuitars/Programs/04-green_twang.sfz'),
 'guitar-nam-rhythm':('electric-guitar','BlackAndGreenGuitars/Programs/04-green_twang.sfz'),
 'guitar-nam-lead':('electric-guitar','BlackAndGreenGuitars/Programs/04-green_twang.sfz'),
 'weresax-synth':('sax','Weresax/Weresax/Programs/sxnth.sfz'),
 'weresax-saxcordion':('sax','Weresax/Weresax/Programs/saxcordion.sfz'),
 'guitar-black':('electric-guitar','BlackAndGreenGuitars/Programs/07-black_twang.sfz'),
 'guitar-combo':('electric-guitar','BlackAndGreenGuitars/Programs/10-combo_twang.sfz'),
 'piano-treble':('piano','AccurateSalamander/sfz_daw/Accurate-SalamanderGrandPiano_treble2.5db.sfz'),
 'piano-bass':('piano','AccurateSalamander/sfz_daw/Accurate-SalamanderGrandPiano_bass1.5db.sfz')}

DRUM_PROGRAMS={'drums-standard':0,'drums-rock':16,'drums-jazz':32,'drums-brush':40,'drums-electronic':24}

def validate_custom(custom):
 if custom is None:return {}
 if not isinstance(custom,dict) or set(custom)-{'pitch','extension'}:raise ValueError('Invalid instrument customizer settings.')
 for key,value in custom.items():
  if isinstance(value,bool) or not isinstance(value,(int,float)) or not np.isfinite(value):raise ValueError('Use finite instrument settings.')
  if key=='pitch' and (int(value)!=value or not -12<=value<=12):raise ValueError('Pitch must be -12 to +12 semitones.')
  if key=='extension' and not 0<=value<=1.5:raise ValueError('Note extension must be 0–1.5 seconds.')
 return dict(custom)

def customize_notes(notes,seconds,extension=0):
 result=[list(n) for n in notes]
 if not extension:return result
 for i,n in enumerate(result):
  next_key=min((v[0] for v in notes[i+1:] if v[2]==n[2] and v[0]>n[0]),default=seconds)
  n[1]=max(n[1],min(seconds,next_key,n[1]+extension))
 return result


def refine_notes(notes):
 """Repair brief low-confidence detours without quantizing the source rhythm."""
 cleaned=[list(n) for n in notes]
 for i in range(1,len(cleaned)-1):
  previous,note,following=cleaned[i-1:i+2]
  if (previous[2]==following[2] and note[1]-note[0]<.12 and note[3]<.5
      and note[0]-previous[1]<=.025 and following[0]-note[1]<=.025):
   note[2]=previous[2]
 merged=[]
 for note in cleaned:
  if merged and note[2]==merged[-1][2] and note[0]-merged[-1][1]<=.025:
   prior=merged[-1];a=prior[1]-prior[0];b=note[1]-note[0]
   prior[3]=(prior[3]*a+note[3]*b)/max(a+b,.001);prior[1]=note[1]
  else:merged.append(note)
 return merged


def repair_source_gaps(notes,guitar,sample_rate=SR):
 """Extend only short gaps with sustained source energy at the preceding pitch."""
 repaired=[list(n) for n in notes]
 if len(repaired)<2:return repaired
 hop=max(1,round(sample_rate*.01))
 spectrum=np.abs(librosa.stft(guitar,n_fft=2048,hop_length=hop))
 freqs=librosa.fft_frequencies(sr=sample_rate,n_fft=2048)
 rms=librosa.feature.rms(y=guitar,frame_length=2048,hop_length=hop)[0]
 for previous,following in zip(repaired,repaired[1:]):
  gap=following[0]-previous[1]
  if not .025<gap<=.24:continue
  a=round(previous[1]*sample_rate/hop);b=round(following[0]*sample_rate/hop)
  if b-a<2:continue
  frequency=librosa.midi_to_hz(previous[2])
  bins=np.where(abs(freqs-frequency)<=max(18,frequency*.035))[0]
  if not len(bins):continue
  energy=spectrum[bins].max(axis=0)
  shoulder=max(0,a-8);reference=np.percentile(energy[shoulder:a+1],60)
  level=np.percentile(rms[shoulder:a+1],60)
  # Ignore STFT boundary smear: evidence must hold inside the gap as well.
  interior=slice(a+1,b-1)
  supported=(energy[interior]>=max(reference*.3,1e-5))&(rms[interior]>=max(level*.3,1e-5))
  if len(supported) and supported.mean()>=.8:
   previous[1]=following[0]
 return repaired


def shape_note(sample,held,velocity,instrument,legato=False):
 """Retain sampled attacks, give plucked notes tails and wind notes soft releases."""
 release={'sax':.055,'piano':.24,'electric-guitar':.14}[instrument]
 count=max(1,round((held+release)*SR));signal=np.zeros(count)
 n=min(count,len(sample));signal[:n]=sample[:n]
 # Sustain sax only when a note outlasts its sample. Crossfade loop joins.
 if instrument=='sax' and count>len(sample) and len(sample)>int(.25*SR):
  first=int(.16*SR);last=min(len(sample)-int(.06*SR),int(.42*SR));loop=sample[first:last]
  fade=min(int(.015*SR),len(loop)//4)
  if len(loop)>2*fade:
   position=max(0,n-fade)
   while position<count:
    size=min(len(loop),count-position);chunk=loop[:size].copy()
    overlap=min(fade,size)
    ramp=np.linspace(0,1,overlap)
    signal[position:position+overlap]=signal[position:position+overlap]*(1-ramp)+chunk[:overlap]*ramp
    signal[position+overlap:position+size]=chunk[overlap:]
    position+=max(1,size-overlap)
 t=np.arange(count)/SR
 attack=(.008 if legato else .025) if instrument=='sax' else .004
 envelope=np.minimum(t/attack,1)
 if instrument=='sax':
  envelope*=np.where(t<=held,1,np.clip(1-(t-held)/release,0,1))
 else:
  # Key/pick release rings across the next attack rather than cutting abruptly.
  envelope*=np.exp(-np.maximum(t-held,0)/(release/3))
 envelope[-min(count,120):]*=np.linspace(1,0,min(count,120))
 loudness=.48+.52*np.clip(velocity,0,1)
 return signal*envelope*loudness

def playback_notes(notes):
 """End each key before its next attack so stale note-offs cannot cut re-strikes."""
 played=[list(n) for n in notes]
 next_start={}
 for note in sorted(played,key=lambda n:n[0],reverse=True):
  pitch=note[2]
  if pitch in next_start:note[1]=min(note[1],next_start[pitch])
  next_start[pitch]=note[0]
 return played


def render_soundfont(notes,seconds,root,program,shift,percussion=False,midi_velocities=None,release_scale=1):
 """Offline in-process FluidSynth: no audio device or detached helper process."""
 import ctypes as c,os
 if not np.isfinite(release_scale) or not 1<=release_scale<=8:raise ValueError('Use a release scale from 1–8.')
 if midi_velocities is not None and (len(midi_velocities)!=len(notes) or any(not isinstance(v,(int,np.integer)) or not 1<=v<=127 for v in midi_velocities)):
  raise ValueError('Supply one MIDI velocity from 1–127 per note.')
 sf2=root/'data/instrument-samples/LiveHQNatural/Live HQ Natural SoundFont GM.sf2'
 dlls=list((root/'data/fluidsynth/runtime').rglob('libfluidsynth-3.dll'))
 if not sf2.is_file() or not dlls:raise ValueError('Live HQ bank or FluidSynth runtime is missing. Choose FluidR3 instead.')
 directory=os.add_dll_directory(str(dlls[0].parent))
 settings=None;synth=None
 try:
  lib=c.CDLL(str(dlls[0]))
  def bind(name,returns,*args):
   fn=getattr(lib,name);fn.restype=returns;fn.argtypes=list(args);return fn
  new_settings=bind('new_fluid_settings',c.c_void_p)
  number=bind('fluid_settings_setnum',c.c_int,c.c_void_p,c.c_char_p,c.c_double)
  integer=bind('fluid_settings_setint',c.c_int,c.c_void_p,c.c_char_p,c.c_int)
  create=bind('new_fluid_synth',c.c_void_p,c.c_void_p)
  load=bind('fluid_synth_sfload',c.c_int,c.c_void_p,c.c_char_p,c.c_int)
  select=bind('fluid_synth_program_select',c.c_int,c.c_void_p,c.c_int,c.c_int,c.c_int,c.c_int)
  on=bind('fluid_synth_noteon',c.c_int,c.c_void_p,c.c_int,c.c_int,c.c_int)
  off=bind('fluid_synth_noteoff',c.c_int,c.c_void_p,c.c_int,c.c_int)
  write=bind('fluid_synth_write_float',c.c_int,c.c_void_p,c.c_int,c.c_void_p,c.c_int,c.c_int,c.c_void_p,c.c_int,c.c_int)
  delete_synth=bind('delete_fluid_synth',None,c.c_void_p)
  delete_settings=bind('delete_fluid_settings',None,c.c_void_p)
  settings=new_settings()
  if not settings:raise ValueError('Cannot create FluidSynth settings.')
  number(settings,b'synth.sample-rate',SR);number(settings,b'synth.gain',.7)
  integer(settings,b'synth.reverb.active',0);integer(settings,b'synth.chorus.active',0)
  synth=create(settings)
  if not synth:raise ValueError('Cannot create SoundFont renderer.')
  sfid=load(synth,str(sf2).encode('utf-8'),0)
  channel=9 if percussion else 0
  if sfid<0 or select(synth,channel,sfid,128 if percussion else 0,program)<0:raise ValueError('Cannot load the selected Live HQ preset.')
  if release_scale!=1:
   # SoundFont generator38 is volume-envelope release. Channel value is a timecents offset.
   set_gen=bind('fluid_synth_set_gen',c.c_int,c.c_void_p,c.c_int,c.c_int,c.c_float)
   if set_gen(synth,channel,38,float(1200*np.log2(release_scale)))<0:raise ValueError('Cannot set instrument release.')
  frames=round(seconds*SR);audio=np.zeros(frames,dtype=np.float32);events=[]
  for i,(begin,end,pitch,velocity) in enumerate(playback_notes(notes)):
   level=int(midi_velocities[i]) if midi_velocities is not None else int(48+55*np.clip(velocity,0,1))
   events.extend([(max(0,round(begin*SR)),1,int(pitch+shift),level), (min(frames,round(end*SR)),0,int(pitch+shift),0)])
  events.sort();position=0
  for frame,kind,pitch,velocity in events+[(frames,2,0,0)]:
   frame=min(frame,frames)
   if frame>position:
    size=frame-position;left=np.zeros(size,dtype=np.float32);right=np.zeros(size,dtype=np.float32)
    if write(synth,size,left.ctypes.data,0,1,right.ctypes.data,0,1)<0:raise ValueError('SoundFont rendering failed.')
    audio[position:frame]=(left+right)*.5;position=frame
   if kind==1:on(synth,channel,pitch,velocity)
   elif kind==0:off(synth,channel,pitch)
  return audio
 finally:
  if synth:delete_synth(synth)
  if settings:delete_settings(settings)
  directory.close()

def render_separate(notes,seconds,root,instrument,shift,tone,patch_name=None,midi_velocities=None,guitar_release=None,sax_release_cc=None,sax_controls=None):
 """Render the supplied SFZ patches in-process, including their sample mappings."""
 import ctypes as c,os
 from scipy.signal import butter,sosfilt
 if midi_velocities is not None and (len(midi_velocities)!=len(notes) or any(not isinstance(v,(int,np.integer)) or not 1<=v<=127 for v in midi_velocities)):
  raise ValueError('Supply one MIDI velocity from 1–127 per note.')
 if guitar_release is not None and (not np.isfinite(guitar_release) or not .1<=guitar_release<=2.):
  raise ValueError('Use a guitar release between .1 and 2 seconds.')
 if sax_release_cc is not None and (instrument!='sax' or not isinstance(sax_release_cc,int) or not 0<=sax_release_cc<=127):
  raise ValueError('Use a sax release control from 0–127.')
 if sax_controls is not None and (instrument!='sax' or not isinstance(sax_controls,dict) or any(k not in [110,111,112,113,116,122] or not isinstance(v,int) or not 0<=v<=127 for k,v in sax_controls.items())):
  raise ValueError('Use supported sax expression controls from 0–127.')
 patches={'piano':'AccurateSalamander/sfz_daw/Accurate-SalamanderGrandPiano_flat.Recommended.sfz',
 'sax':'Weresax/Weresax/Programs/Sax.sfz','electric-guitar':'BlackAndGreenGuitars/Programs/04-green_twang.sfz'}
 patch=root/'data/instrument-samples'/(patch_name or patches[instrument])
 dll=root/'data/sfizz/runtime/bin/Release/sfizz.dll'
 if not patch.is_file() or not dll.is_file():raise ValueError('Separate library or sfizz runtime is missing. Choose another bank.')
 directory=os.add_dll_directory(str(dll.parent));synth=None
 try:
  lib=c.CDLL(str(dll))
  def bind(name,result,*args):
   fn=getattr(lib,name);fn.restype=result;fn.argtypes=list(args);return fn
  create=bind('sfizz_create_synth',c.c_void_p)
  free=bind('sfizz_free',None,c.c_void_p)
  rate=bind('sfizz_set_sample_rate',None,c.c_void_p,c.c_float)
  block=bind('sfizz_set_samples_per_block',None,c.c_void_p,c.c_int)
  load=bind('sfizz_load_file',c.c_bool,c.c_void_p,c.c_char_p)
  load_text=bind('sfizz_load_string',c.c_bool,c.c_void_p,c.c_char_p,c.c_char_p)
  offline=bind('sfizz_enable_freewheeling',None,c.c_void_p)
  on=bind('sfizz_send_note_on',None,c.c_void_p,c.c_int,c.c_int,c.c_int)
  off=bind('sfizz_send_note_off',None,c.c_void_p,c.c_int,c.c_int,c.c_int)
  write=bind('sfizz_render_block',None,c.c_void_p,c.POINTER(c.POINTER(c.c_float)),c.c_int,c.c_int)
  synth=create()
  if not synth:raise ValueError('Cannot create the SFZ renderer.')
  rate(synth,SR);block(synth,512);offline(synth)
  if instrument=='electric-guitar':
   # Extend the main picked-note release, leaving release noises/feedback settings alone.
   release=.65 if guitar_release is None else guitar_release
   # Combo contains two main guitar globals; explicit auditions set both equally.
   release_count=2 if guitar_release is not None and patch.name=='10-combo_twang.sfz' else 1
   patch_text=patch.read_text(encoding='utf-8').replace('ampeg_release=0.25',f'ampeg_release={release}',release_count)
   loaded=load_text(synth,str(patch).encode('utf-8'),patch_text.encode('utf-8'))
  elif sax_release_cc is not None or sax_controls is not None:
   patch_text=patch.read_text(encoding='utf-8')
   if sax_release_cc is not None:patch_text=patch_text.replace('set_cc104=20',f'set_cc104={sax_release_cc}',1)
   for key,value in (sax_controls or {}).items():
    pattern=rf'(?m)^set_cc{key}=\d+'
    if re.search(pattern,patch_text):patch_text=re.sub(pattern,f'set_cc{key}={value}',patch_text,count=1)
    else:patch_text=patch_text.replace('<control>',f'<control>\nset_cc{key}={value}',1)
   loaded=load_text(synth,str(patch).encode('utf-8'),patch_text.encode('utf-8'))
  else:loaded=load(synth,str(patch).encode('utf-8'))
  if not loaded:raise ValueError('Cannot load the selected SFZ instrument.')
  frames=round(seconds*SR);audio=np.zeros(frames,dtype=np.float32);events=[]
  for index,(begin,end,pitch,velocity) in enumerate(playback_notes(notes)):
   strike=midi_velocities[index] if midi_velocities is not None else int(48+55*np.clip(velocity,0,1))
   events.extend([(max(0,round(begin*SR)),1,int(pitch+shift),int(strike)), (min(frames,round(end*SR)),0,int(pitch+shift),0)])
  events.sort();index=0
  for start in range(0,frames,512):
   size=min(512,frames-start)
   while index<len(events) and events[index][0]<start+size:
    frame,kind,pitch,velocity=events[index];delay=max(0,frame-start)
    if kind:on(synth,delay,pitch,velocity)
    else:off(synth,delay,pitch,0)
    index+=1
   left=np.zeros(size,dtype=np.float32);right=np.zeros(size,dtype=np.float32)
   channels=(c.POINTER(c.c_float)*2)(left.ctypes.data_as(c.POINTER(c.c_float)),right.ctypes.data_as(c.POINTER(c.c_float)))
   write(synth,channels,2,size);audio[start:start+size]=(left+right)*.5
  if instrument=='electric-guitar' and tone=='distorted':
   dry=sosfilt(butter(2,90,'highpass',fs=SR,output='sos'),audio)
   driven=np.tanh(dry/max(np.sqrt(np.mean(dry**2)),.001)*1.8)
   audio=sosfilt(butter(3,5000,'lowpass',fs=SR,output='sos'),driven)
  return audio
 finally:
  if synth:free(synth)
  directory.close()

def melody_emission(energy,support,pitches,ages=None):
 """Resolve competing octave candidates only when the upper note is well supported."""
 adjusted=energy.copy()
 for k,pitch in enumerate(pitches):
  if pitch==0:continue
  upper=np.where(pitches==pitch+12)[0]
  if not len(upper):continue
  j=int(upper[0])
  competing=(energy[:,j]>=.46)&(energy[:,j]>=energy[:,k]*.75)&(support[:,j]>=.18)
  if ages is not None:
   # A fresh, stronger lower pick should beat an older overlapping upper sustain.
   fresh_lower=(ages[:,k]<.14)&(ages[:,j]>.45)&(energy[:,k]>=energy[:,j]*1.15)
   competing&=~fresh_lower
  adjusted[competing,k]*=.72
 emission=adjusted*3-.7+support*.35*(energy>0)
 emission[:,0]=np.where(energy.max(axis=1)>.3,-.7,.3)
 emission[:,1:]+=np.clip((pitches[1:]-48)/24,0,1)*.2
 return emission

def align_source_attacks(notes,attacks,events,duration):
 """Small source-supported timing adjustments, preserving order and real pauses."""
 aligned=[list(note) for note in notes]
 original=[list(note) for note in notes]
 for i,note in enumerate(aligned):
  begin,end,pitch,confidence=original[i]
  candidates=[float(a) for a in attacks if abs(float(a)-begin)<=.045
   and any(int(e[2])==pitch and abs(float(e[0])-float(a))<=.06 and float(e[3])>=.4 for e in events)]
  if not candidates:continue
  target=min(candidates,key=lambda a:abs(a-begin))
  # Do not consume a real rest, reorder attacks, or erase a rapid melodic note.
  earliest=aligned[i-1][0]+.075 if i else 0
  latest=end-.075
  if not earliest<=target<=latest:continue
  if i and begin-original[i-1][1]>.025:
   target=max(target,original[i-1][1]+.025)
  note[0]=max(0,min(duration,target))
  if i and abs(begin-original[i-1][1])<=.025:
   aligned[i-1][1]=note[0]
 return aligned


def remove_weak_detours(notes,guitar):
 """Reject a brief weak detour only with matching neighbours and weak source energy."""
 cleaned=[list(n) for n in notes]
 for i in range(1,len(cleaned)-1):
  prior,note,following=cleaned[i-1:i+2]
  if prior[2]!=following[2] or note[1]-note[0]>.1 or note[3]>=.45:continue
  if note[0]-prior[1]>.025 or following[0]-note[1]>.025:continue
  a=round(note[0]*SR);b=round(note[1]*SR)
  section=guitar[a:b];surround=guitar[max(0,a-round(.08*SR)):min(len(guitar),b+round(.08*SR))]
  if len(section) and np.sqrt(np.mean(section**2))<np.sqrt(np.mean(surround**2))*.3:
   note[2]=prior[2]
 return cleaned

def extend_source_tails(notes,guitar,duration):
 """Follow sustained source pitch beyond detector ends, stopping at silence/next attack."""
 extended=[list(n) for n in notes]
 spectrum=np.abs(librosa.stft(guitar,n_fft=2048,hop_length=240))
 freqs=librosa.fft_frequencies(sr=SR,n_fft=2048)
 rms=librosa.feature.rms(y=guitar,frame_length=2048,hop_length=240)[0]
 for i,note in enumerate(extended):
  begin,end,pitch,_=note
  limit=min(duration,end+.4,notes[i+1][0] if i+1<len(notes) else duration)
  if limit-end<.03:continue
  frequency=librosa.midi_to_hz(pitch)
  bins=np.where(abs(freqs-frequency)<=max(18,frequency*.035))[0]
  if not len(bins):continue
  power=spectrum[bins].max(axis=0)
  first=round(end*100);last=min(round(limit*100),len(power),len(rms))
  shoulder=max(round(begin*100),first-10)
  reference=np.percentile(power[shoulder:first+1],60)
  level=np.percentile(rms[shoulder:first+1],60)
  stop=first
  for frame in range(first+1,last):
   if power[frame]<max(reference*.35,1e-5) or rms[frame]<max(level*.3,1e-5):break
   stop=frame
  if stop-first>=3:note[1]=min(limit,stop*.01)
 return extended

def source_supported_overlap(notes,guitar,duration):
 """Keep the accepted melody, allowing source-supported ringing under later attacks."""
 played=[list(n) for n in notes]
 spectrum=np.abs(librosa.stft(guitar,n_fft=2048,hop_length=240))
 freqs=librosa.fft_frequencies(sr=SR,n_fft=2048)
 for i,note in enumerate(played[:-1]):
  begin,end,pitch,_=note;following=notes[i+1]
  if following[2]==pitch or following[0]-end>.04:continue
  limit=min(duration,following[0]+.22)
  repeat=next((n[0] for n in notes[i+1:] if n[2]==pitch),duration)
  limit=min(limit,repeat)
  frequency=librosa.midi_to_hz(pitch);bins=np.where(abs(freqs-frequency)<=max(18,frequency*.035))[0]
  if not len(bins):continue
  power=spectrum[bins].max(axis=0);first=round(following[0]*100)
  shoulder=max(round(begin*100),round(end*100)-8)
  reference=np.percentile(power[shoulder:round(end*100)+1],60)
  stop=first
  for frame in range(first+2,min(round(limit*100),len(power))):
   if power[frame]<max(reference*.4,1e-5):break
   stop=frame
  if stop-first>=5:note[1]=max(end,min(limit,stop*.01))
 return played

def drum_hits(source,seconds):
 """Approximate independent low/mid/high-band hits without imposing a new beat grid."""
 from scipy.signal import butter,sosfilt,find_peaks
 if not np.isfinite(source).all() or np.sqrt(np.mean(source**2))<1e-5:raise ValueError('No audible drum hits in this section.')
 hop=120;events=[]
 # Independent bands retain simultaneous kick/snare/cymbal candidates.
 for low,high,pitch in [(35,160,36),(180,2500,38),(5000,10000,42)]:
  band=sosfilt(butter(3,[low,high],'bandpass',fs=SR,output='sos'),source)
  frames=len(band)//hop
  if frames<3:continue
  level=np.sqrt(np.mean(band[:frames*hop].reshape(frames,hop)**2,axis=1))
  envelope=median_filter(level,size=3)
  attack=np.maximum(envelope-np.r_[0,envelope[:-1]],0)
  if attack.max()<1e-5:continue
  peaks,_=find_peaks(attack,height=max(attack.max()*.12,1e-5),prominence=attack.max()*.07,distance=12)
  for frame in peaks:
   begin=max(0,frame*hop/SR-.005)
   if begin>=seconds-.02:continue
   strength=float(np.clip(attack[frame]/attack.max(),.15,1))
   events.append([begin,min(seconds,begin+.045),pitch,strength])
 events.sort(key=lambda n:(n[0],n[2]))
 if not events:raise ValueError('No usable drum hits detected. Keep original or choose another section.')
 return events

def render_drums(path,seconds,root,instrument):
 if instrument=='drums-rock':
  from drum_replacement import render_rock
  return render_rock(path,seconds,root)
 sys.path.insert(0,str(root/'data/transcription-packages'))
 import pretty_midi
 source,_=librosa.load(path,sr=SR,duration=seconds)
 notes=drum_hits(source,seconds)
 audio=render_soundfont(notes,seconds,root,DRUM_PROGRAMS[instrument],0,percussion=True)
 if not np.isfinite(audio).all() or np.sqrt(np.mean(audio**2))<1e-5:raise ValueError('The drum kit returned no usable audio.')
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=DRUM_PROGRAMS[instrument],is_drum=True)
 for begin,end,pitch,strength in notes:track.notes.append(pretty_midi.Note(velocity=int(48+55*strength),pitch=pitch,start=begin,end=end))
 midi.instruments.append(track)
 return audio,midi,notes

def piano_notes(events,seconds):
 """Keep independent piano voices instead of reducing chords to one melody."""
 notes=[]
 for begin,end,pitch,amplitude,*_ in events:
  begin=max(0,float(begin));end=min(seconds,float(end));pitch=int(pitch);amplitude=float(amplitude)
  if not all(np.isfinite(v) for v in [begin,end,amplitude]) or not 21<=pitch<=108 or end-begin<.06 or amplitude<.22:continue
  notes.append([begin,end,pitch,amplitude])
 notes.sort(key=lambda n:(n[0],n[2]))
 # A re-strike takes ownership of the same key; its older note-off must not cut it.
 for i,note in enumerate(notes):
  following=next((n for n in notes[i+1:] if n[2]==note[2]),None)
  if following and note[1]>following[0]:note[1]=following[0]
 return [n for n in notes if n[1]-n[0]>=.04]


def filter_piano_notes(notes):
 """Conservative audition filter; retain polyphony and independent re-strikes."""
 candidates=[list(n) for n in notes if n[3]>=.40 and (n[1]-n[0]>=.105 or n[3]>=.65)]
 kept=[]
 for note in candidates:
  begin,end,pitch,confidence=note
  # Weak octave/fifth harmonics at the exact same attack can masquerade as keys.
  harmonic=any(pitch-low[2] in [12,19,24] and abs(begin-low[0])<=.035
      and min(end,low[1])-max(begin,low[0])>=.08
      and low[3]>=.62 and confidence<low[3]*.65 for low in candidates)
  if not harmonic:kept.append(note)
 return kept


def render_piano_polyphonic(path,seconds,root):
 """Audition-only piano path preserving overlapping detector events."""
 sys.path.insert(0,str(root/'data/transcription-packages'))
 from basic_pitch import build_icassp_2022_model_path,FilenameSuffix
 from basic_pitch.inference import predict
 import pretty_midi
 _,_,events=predict(path,model_or_model_path=build_icassp_2022_model_path(FilenameSuffix.onnx),minimum_note_length=60,minimum_frequency=27.5,maximum_frequency=4186,onset_threshold=.35,frame_threshold=.25)
 notes=piano_notes(events,seconds)
 if not notes:raise ValueError('No piano notes detected in this section.')
 audio=render_separate(notes,seconds,root,'piano',0,None)
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=0)
 for begin,end,pitch,velocity in notes:
  track.notes.append(pretty_midi.Note(velocity=int(48+55*np.clip(velocity,0,1)),pitch=pitch,start=begin,end=end))
 midi.instruments.append(track)
 return audio,midi,notes


def render_piano_preserving(path,seconds,root,patch_name=None,custom=None):
 """Approved piano path: polyphony, decay-aware attacks and source dynamics."""
 sys.path.insert(0,str(root/'data/transcription-packages'))
 from basic_pitch import build_icassp_2022_model_path,FilenameSuffix
 from basic_pitch.inference import predict
 import pretty_midi
 _,_,events=predict(path,model_or_model_path=build_icassp_2022_model_path(FilenameSuffix.onnx),minimum_note_length=60,minimum_frequency=27.5,maximum_frequency=4186,onset_threshold=.35,frame_threshold=.25)
 detected=[n for n in piano_notes(events,seconds) if n[3]>=.40]
 if not detected:raise ValueError('No usable piano notes detected. Try another section.')
 source,_=librosa.load(path,sr=SR,duration=seconds);hop=120
 spectrum=np.abs(librosa.cqt(source,sr=SR,hop_length=hop,fmin=librosa.midi_to_hz(21),n_bins=88))
 def level(pitch,start,end,percentile=50):
  first=max(0,round(start*SR/hop));last=min(spectrum.shape[1],max(first+1,round(end*SR/hop)))
  return float(np.percentile(spectrum[pitch-21,first:last],percentile)) if last>first else 0.
 notes=[];last={}
 for row in detected:
  note=list(row);a,b,p,_=note;previous=last.get(p)
  pre=level(p,a-.09,a-.025);post=level(p,a+.005,a+.06)
  if previous is not None and abs(a-previous[1])<=.04 and pre>1e-7 and post/pre<1.1:
   previous[1]=max(previous[1],b)
  else:notes.append(note);last[p]=note
 strengths=[level(p,a+.015,min(b,a+.14),75) for a,b,p,_ in notes]
 reference=max(float(np.percentile(strengths,90)),1e-9)
 velocities=[int(round(1+94*float(np.clip(s/reference,0,1)))) for s in strengths]
 groups={1.:[],.4:[],.18:[],.08:[]}
 for i,(note,velocity) in enumerate(zip(notes,velocities)):
  score=min(velocity/95,float(np.clip((note[3]-.4)/.3,0,1)))
  gain=1. if score>=.75 else .4 if score>=.45 else .18 if score>=.25 else .08
  groups[gain].append(i)
 custom=validate_custom(custom);shift=int(custom.get('pitch',0))
 notes=customize_notes(notes,seconds,custom.get('extension',0))
 audio=np.zeros(round(seconds*SR),dtype=np.float32)
 for gain,indices in groups.items():
  if indices:audio+=render_separate([notes[i] for i in indices],seconds,root,'piano',shift,None,patch_name,midi_velocities=[velocities[i] for i in indices])*gain
 audio*=10**(1.5/20)
 if not np.isfinite(audio).all() or np.sqrt(np.mean(audio**2))<1e-6:raise ValueError('No usable piano performance returned.')
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=0)
 for (a,b,p,_),v in zip(notes,velocities):track.notes.append(pretty_midi.Note(velocity=v,pitch=p+shift,start=a,end=b))
 midi.instruments.append(track)
 return audio,midi,notes


def prepare_source_holds(notes,guitar,seconds):
 """Shared source-supported holds; no instrument rendering or pitch changes."""
 hop=120
 spectrum=np.abs(librosa.cqt(guitar,sr=SR,hop_length=hop,fmin=librosa.midi_to_hz(40),n_bins=49))
 rms=librosa.feature.rms(y=guitar,frame_length=1024,hop_length=hop)[0]
 performed=[list(n) for n in notes]
 strengths=[]
 for stage,(extra,relative,peak) in enumerate([(.45,.28,.035),(1.2,.18,.025)]):
  before=[list(n) for n in performed]
  for i,n in enumerate(performed):
   a,b,p,_=n
   if not 40<=p<=88:continue
   next_key=min((v[0] for v in before[i+1:] if v[2]==p),default=seconds)
   limit=min(seconds,b+extra,next_key);first=max(0,round(b*SR/hop))
   shoulder=max(0,round(max(a,b-.10)*SR/hop))
   reference=float(np.percentile(spectrum[p-40,shoulder:max(shoulder+1,first+1)],65))
   floor=max(reference*relative,float(spectrum[p-40].max())*peak,1e-7);stop=first
   for frame in range(first+1,min(spectrum.shape[1],len(rms),round(limit*SR/hop))):
    if spectrum[p-40,frame]<floor or rms[frame]<max(float(rms.max())*.025,1e-7):break
    stop=frame
   if stop-first>=5:n[1]=max(b,min(limit,stop*hop/SR))
  if stage==0:
   for a,b,p,_ in performed:
    first=max(0,round((a+.015)*SR/hop));last=min(spectrum.shape[1],max(first+1,round(min(b,a+.12)*SR/hop)))
    strengths.append(float(np.percentile(spectrum[p-40,first:last],75)) if 40<=p<=88 and last>first else 0)
 reference=max(float(np.percentile(strengths,90)),1e-9)
 velocities=[int(round(15+85*float(np.clip(s/reference,0,1)))) for s in strengths]
 return performed,velocities

def render_bright_room(notes,guitar,seconds,root,variant='guitar-bright-room',custom=None):
 """Local NAM guitar presets; default preserves approved brighter +2 profile."""
 profile=dict(NAM_GUITARS[variant]);custom=validate_custom(custom)
 if 'pitch' in custom:profile['shift']=int(custom['pitch'])
 import subprocess,tempfile
 from scipy.signal import resample_poly,butter,sosfilt,sosfiltfilt,fftconvolve
 performed,velocities=prepare_source_holds(notes,guitar,seconds)
 performed=customize_notes(performed,seconds,custom.get('extension',0))
 clean=render_separate(performed,seconds,root,'electric-guitar',profile['shift'],'clean',midi_velocities=velocities,guitar_release=profile['release'])
 clean*=min(.065/max(float(np.sqrt(np.mean(clean**2))),1e-9),.9/max(float(np.max(np.abs(clean))),1e-9))
 clean*=10**(profile['input_db']/20)
 with tempfile.TemporaryDirectory(prefix='mana-nam-') as folder:
  folder=Path(folder);input_path=folder/'input.wav';output_path=folder/'output.wav'
  padded=np.pad(resample_poly(clean,2,1),(24000,24000));sf.write(input_path,padded,48000,subtype='PCM_16')
  job=subprocess.run([str(root/'data/nam/build/tools/Release/render.exe'),str(root/'data/nam/models/jcm800-cab.nam'),str(input_path),str(output_path)],capture_output=True,text=True,errors='replace',timeout=300)
  if job.returncode:raise ValueError('NAM guitar rendering failed: '+job.stderr[-500:])
  x,sr=sf.read(output_path)
  if sr!=48000 or x.shape!=padded.shape or not np.isfinite(x).all():raise ValueError('NAM returned invalid guitar audio.')
  x=resample_poly(x[24000:24000+len(clean)*2],1,2)
 rng=np.random.default_rng(42);length=round(.28*SR);t=np.arange(length)/SR;layers=[]
 for taps in [[(.011,.55),(.019,.38),(.031,.24)],[(.014,.55),(.023,.38),(.037,.24)]]:
  impulse=rng.normal(0,.0025,length)*np.exp(-t/.055);impulse[:round(.012*SR)]=0
  for delay,gain in taps:impulse[round(delay*SR)]+=gain
  wet=sosfilt(butter(2,4500,'lowpass',fs=SR,output='sos'),fftconvolve(x,impulse)[:len(x)])
  layers.append(x+wet*profile['room'])
 x=np.mean(layers,axis=0)
 brightness=profile['brightness']
 x=x*(1-brightness)+sosfiltfilt(butter(4,330,'highpass',fs=SR,output='sos'),x)*brightness
 if profile['delay']:
  delayed=np.zeros_like(x);offset=round(.085*SR)
  if len(x)>offset:delayed[offset:]=x[:-offset]
  x+=sosfilt(butter(2,3800,'lowpass',fs=SR,output='sos'),delayed)*profile['delay']
 x*=min(.065/max(float(np.sqrt(np.mean(x**2))),1e-9),.9/max(float(np.max(np.abs(x))),1e-9))
 return x,performed

def prepare_trumpet(notes,seconds):
 """Approved light phrase accents and short legato, preserving rests and pitches."""
 played=[list(n) for n in notes];levels=[]
 for i,n in enumerate(played):
  entrance=i==0 or n[0]-notes[i-1][1]>.12
  level=int(48+55*np.clip(n[3],0,1))
  levels.append(max(1,min(127,round(level*(1.04 if entrance else .96)))))
  n[1]=min(n[1],seconds)
  if i+1<len(played):
   following=played[i+1]
   if n[2]!=following[2] and 0<=following[0]-n[1]<=.06:n[1]=min(seconds,following[0]+.035)
 return played,levels

def source_frequency_range(source_name):
 """Detect the source register independently of the chosen replacement sound."""
 if source_name=='bass':return (30.87,500)
 if source_name in ['piano','piano-banquet','keyboard-extracted','electric-piano-extracted']:return (27.5,4186)
 if source_name=='strings-estimate':return (65.4,4186)
 if source_name=='winds-estimate':return (100,4186)
 if source_name in ['sax-extracted','trumpet-extracted']:return (100,2093)
 return (100,1500)


def source_note_attacks(source_name,attacks):
 """Wind/string sustain is not a sequence of guitar pick attacks."""
 return [] if source_name in ['sax-extracted','trumpet-extracted','winds-estimate','strings-estimate'] else attacks


def render(guitar_path,seconds,root,instrument="sax",tone=None,bank="fluidr3",source_name="guitar",custom=None,_violin_focused=False):
 custom=validate_custom(custom)
 if source_name=='vocal':
  from vocal_melody import render_vocal
  return render_vocal(guitar_path,seconds,root,instrument,custom)
 sax_variant=instrument if instrument in ['sax-tenor','sax-weresax'] else None
 nam_variant=instrument if instrument in NAM_GUITARS else None
 bright_room=nam_variant is not None
 if bright_room:
  for path in [root/'data/nam/build/tools/Release/render.exe',root/'data/nam/models/jcm800-cab.nam']:
   if not path.is_file():raise ValueError('NAM guitar needs the local NAM renderer and JCM800 capture. Keep original or choose another guitar.')
 patch_name=None
 if instrument in SEPARATE_VARIANTS:
  instrument,patch_name=SEPARATE_VARIANTS[instrument];bank='separate'
 banks={"sax":"alto_sax","piano":"acoustic_grand_piano","electric-guitar":"electric_guitar_clean"}
 if instrument in DRUM_PROGRAMS:
  if custom.get('pitch',0) or custom.get('extension',0):raise ValueError('Pitch and note extension apply to melodic instruments.')
  return render_drums(guitar_path,seconds,root,instrument)
 if source_name=='bass':
  from bass_replacement import render_bass,track_bass_notes
  if instrument in ['finger-bass','picked-bass','acoustic-bass']:
   return render_bass(guitar_path,seconds,root,EXTRA_PROGRAMS[instrument],custom)
  from vocal_melody import render_vocal_notes,PROGRAMS
  # Instrument was normalized above; preserve the selected sample library/NAM variant.
  target=nam_variant or sax_variant or next((name for name,(kind,patch) in SEPARATE_VARIANTS.items() if patch_name and patch==patch_name),instrument)
  if target not in PROGRAMS:raise ValueError('Choose a supported bass melody instrument.')
  source,_=librosa.load(guitar_path,sr=SR,duration=seconds)
  notes,levels=track_bass_notes(source,seconds)
  if tone=='distorted':target='electric-guitar-distorted'
  return render_vocal_notes(notes,levels,source,seconds,root,target,custom)
 if instrument in EXTRA_PROGRAMS:bank="livehq"
 if instrument not in banks and instrument not in EXTRA_PROGRAMS:raise ValueError("Unsupported replacement instrument.")
 if bank not in ['fluidr3','livehq','separate']:raise ValueError('Choose a supported instrument bank.')
 if instrument=='piano' and bank=='separate' and source_name in ['piano','piano-banquet']:
  print('Preserving piano chords, sustained overlaps and source dynamics…',flush=True)
  return render_piano_preserving(guitar_path,seconds,root,patch_name,custom) if custom else render_piano_preserving(guitar_path,seconds,root,patch_name)
 bank_name=banks.get(instrument,'')
 if tone is not None:
  if instrument!='electric-guitar' or tone not in ['clean','distorted']:raise ValueError('Unsupported guitar tone.')
  bank_name='distortion_guitar' if tone=='distorted' else 'electric_guitar_clean' 
 packages=root/'data/transcription-packages'
 bank_path=root/('data/instrument-samples/FluidR3_GM/'+bank_name+'-mp3.js')
 if not (packages/'basic_pitch').is_dir():raise ValueError('Transcription setup is missing at '+str(packages))
 if bank=='fluidr3' and not bank_path.is_file():raise ValueError('Instrument note bank is missing at '+str(bank_path))
 sys.path.insert(0,str(packages))
 from basic_pitch import build_icassp_2022_model_path,FilenameSuffix
 from basic_pitch.inference import predict
 low,high=source_frequency_range(source_name)
 _,midi,events=predict(guitar_path,model_or_model_path=build_icassp_2022_model_path(FilenameSuffix.onnx),minimum_note_length=90,minimum_frequency=low,maximum_frequency=high,onset_threshold=.55,frame_threshold=.35)
 if not events:raise ValueError('No melody notes detected. Choose another section.')
 duration=seconds;hop=.01;frames=round(duration/hop)
 pitches=np.array([0]+sorted({int(e[2]) for e in events}))
 energy=np.zeros((frames,len(pitches)))
 ages=np.full_like(energy,100.)
 for begin,end,pitch,amplitude,*_ in events:
     if end-begin<.075 or amplitude<.32:continue
     a=max(0,round(begin/hop));b=min(frames,round(end/hop))
     k=int(np.where(pitches==pitch)[0][0]);energy[a:b,k]=np.maximum(energy[a:b,k],amplitude)
     ages[a:b,k]=np.minimum(ages[a:b,k],np.arange(b-a)*hop)
 # Add direct fundamental support from the isolated guitar to discourage octave harmonics.
 guitar,_=librosa.load(guitar_path,sr=SR,duration=duration)
 spectrum=np.abs(librosa.stft(guitar,n_fft=2048,hop_length=240))
 freqs=librosa.fft_frequencies(sr=SR,n_fft=2048)
 support=np.zeros_like(energy)
 for k,pitch in enumerate(pitches[1:],1):
  frequency=librosa.midi_to_hz(int(pitch));bins=np.where(np.abs(freqs-frequency)<max(18,frequency*.035))[0]
  if len(bins):
   values=spectrum[bins].max(axis=0);count=min(frames,len(values));support[:count,k]=values[:count]
 support/=np.maximum(support.max(axis=1,keepdims=True),.001)
 # Prefer sustained, confident notes with a continuous register over first-arriving chord notes.
 emission=melody_emission(energy,support,pitches,ages)
 distance=np.abs(pitches[:,None]-pitches[None,:])
 transition=np.minimum(distance*.08,1.8)
 transition+=np.where(distance>=10,.9,0)
 transition[0,:]=.18;transition[:,0]=.18;np.fill_diagonal(transition,0)
 scores=emission[0].copy();history=np.zeros((frames,len(pitches)),dtype=int)
 for frame in range(1,frames):
     candidates=scores[:,None]-transition
     history[frame]=candidates.argmax(axis=0)
     scores=candidates.max(axis=0)+emission[frame]
 path=np.zeros(frames,dtype=int);path[-1]=scores.argmax()
 for frame in range(frames-1,0,-1):path[frame-1]=history[frame,path[frame]]
 line=median_filter(pitches[path],size=5)
 notes=[];first=0
 for frame in range(1,frames+1):
     if frame<frames and line[frame]==line[first]:continue
     if line[first]>0 and (frame-first)*hop>=.075:
         confidence=float(energy[first:frame,int(np.where(pitches==line[first])[0][0])].mean())
         notes.append([first*hop,frame*hop,int(line[first]),confidence])
     first=frame
 notes=repair_source_gaps(refine_notes(notes),guitar)
 # Restore source pick attacks that were lost when contiguous same-pitch frames merged.
 attacks=source_note_attacks(source_name,librosa.onset.onset_detect(y=guitar,sr=SR,hop_length=240,units='time',backtrack=False))
 articulated=[]
 for begin,end,pitch,confidence in notes:
  cuts=[begin]
  for attack in attacks:
   if begin+.09<attack<end-.09 and attack-cuts[-1]>=.09:
    # Require a detector event onset at this pitch; chord/noise onsets alone do not split.
    if any(int(e[2])==pitch and abs(float(e[0])-attack)<.045 and float(e[3])>=.4 for e in events):cuts.append(float(attack))
  cuts.append(end)
  articulated.extend([[a,b,pitch,confidence] for a,b in zip(cuts,cuts[1:])])
 notes=extend_source_tails(align_source_attacks(remove_weak_detours(articulated,guitar),attacks,events,seconds),guitar,seconds)
 if instrument=='electric-piano':
  from electric_piano_replacement import render_electric_piano
  return render_electric_piano(notes,guitar,seconds,root,custom)
 if instrument=='violin' and not _violin_focused:
  from violin_replacement import render_focused_violin
  return render_focused_violin(notes,guitar,seconds,root,custom)
 if instrument in ['electric-guitar','strings']:notes=source_supported_overlap(notes,guitar,seconds)
 string_velocities=None
 flute_entrances=[]
 ocarina_entrances=[]
 if instrument=='synth-saw':
  from synth_lead_replacement import prepare_lead
  notes,string_velocities=prepare_lead(notes,seconds)
 if instrument=='ocarina':
  from ocarina_replacement import prepare_ocarina
  notes,string_velocities,ocarina_entrances=prepare_ocarina(notes,seconds)
 flute_shift=12 if instrument=='flute' and notes and np.median([n[2] for n in notes])<58 else 0
 trumpet_shift=12 if instrument=='trumpet' and notes and np.median([n[2] for n in notes])<60 else 0
 if instrument=='trumpet':
  notes,string_velocities=prepare_trumpet(notes,seconds)
 if instrument=='flute':
  from flute_replacement import prepare_flute
  notes,string_velocities,flute_entrances=prepare_flute(notes,guitar,seconds)
 if instrument=='strings':
  from strings_replacement import prepare_strings
  notes,_=prepare_source_holds(notes,guitar,seconds)
  notes,string_velocities=prepare_strings(notes,guitar,seconds)
 if sax_variant:
  from sax_replacement import prepare_sax
  notes=prepare_sax(notes,guitar,seconds)
 # One fixed octave placement for sax; no per-note octave folding.
 shift=12 if instrument in ['sax','flute','violin'] and notes and np.median([n[2] for n in notes])<58 else 0
 if instrument=='flute':shift=flute_shift
 if instrument=='trumpet':shift=trumpet_shift
 if instrument in ['finger-bass','picked-bass','acoustic-bass'] and notes:
  while np.median([n[2]+shift for n in notes])>55:shift-=12
 if not bright_room:
  notes=customize_notes(notes,seconds,custom.get('extension',0))
  shift+=int(custom.get('pitch',0))
 if bank=='separate':
  if sax_variant=='sax-tenor':melody=render_soundfont(notes,seconds,root,66,shift,release_scale=1.6)
  elif sax_variant=='sax-weresax':melody=render_separate(notes,seconds,root,'sax',shift,None,sax_release_cc=32)
  elif bright_room:
   melody,notes=render_bright_room(notes,guitar,seconds,root,nam_variant,custom)
   shift=int(custom.get('pitch',NAM_GUITARS[nam_variant]['shift']))
  else:melody=render_separate(notes,seconds,root,instrument,shift,tone,patch_name)
 elif bank=='livehq':
  program={**EXTRA_PROGRAMS,'sax':65,'piano':0,'electric-guitar':30 if tone=='distorted' else 27}[instrument]
  melody=render_soundfont(notes,seconds,root,program,shift,midi_velocities=string_velocities,release_scale=1.5 if instrument=='strings' else 1.3 if instrument=='flute' else 1.25 if instrument=='trumpet' else 1.35 if instrument=='ocarina' else 1)
  if instrument=='ocarina':
   from ocarina_replacement import soften_ocarina
   melody=soften_ocarina(melody,ocarina_entrances)
  if instrument=='flute':
   from flute_replacement import soften_entrances
   melody=soften_entrances(melody,flute_entrances)
 else:
  bank_text=(root/('data/instrument-samples/FluidR3_GM/'+bank_name+'-mp3.js')).read_text()
  match=re.search(r'MIDI\.Soundfont\.'+re.escape(bank_name)+r'\s*=\s*(\{.*\})',bank_text,re.S)
  if not match:raise ValueError('Instrument bank format is not recognized.')
  samples=json.loads(re.sub(r',\s*}', '}', match.group(1)))
  cache={}
  def sampled_note(pitch,held,velocity,legato):
   key=librosa.midi_to_note(int(pitch),unicode=False)
   for sharp,flat in [('C#','Db'),('D#','Eb'),('F#','Gb'),('G#','Ab'),('A#','Bb')]:key=key.replace(sharp,flat)
   if key not in cache:
    raw=base64.b64decode(samples[key].split(',',1)[1]);audio,rate=sf.read(io.BytesIO(raw))
    if audio.ndim>1:audio=audio.mean(axis=1)
    if rate!=SR:audio=librosa.resample(audio,orig_sr=rate,target_sr=SR)
    cache[key]=audio
   return shape_note(cache[key],held,velocity,instrument,legato)
  
  melody=np.zeros(round(seconds*SR))
  for index,(begin,end,pitch,velocity) in enumerate(notes):
   legato=index>0 and begin-notes[index-1][1]<.04
   signal=sampled_note(pitch+shift,end-begin,velocity,legato);offset=round(begin*SR);count=min(len(signal),len(melody)-offset)
   if count>0:melody[offset:offset+count]+=signal[:count]
 if not notes or np.sqrt(np.mean(melody**2))<.00001:raise ValueError('No usable replacement melody detected.')
 notes=playback_notes(notes)
 # Export the melody actually performed, rather than the original polyphonic detection.
 import pretty_midi
 performed=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=66 if sax_variant=='sax-tenor' else {**EXTRA_PROGRAMS,'sax':65,'piano':0,'electric-guitar':30 if tone=='distorted' else 27}[instrument])
 for index,(begin,end,pitch,velocity) in enumerate(notes):
  level=string_velocities[index] if string_velocities is not None else int(48+55*np.clip(velocity,0,1))
  track.notes.append(pretty_midi.Note(velocity=level,pitch=int(pitch+shift),start=begin,end=end))
 performed.instruments.append(track)
 return melody,performed,notes
