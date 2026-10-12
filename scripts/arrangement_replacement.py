"""Experimental isolated guitar transcription and sample-based instrument playback."""
import json,re,base64,io,sys
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from scipy.ndimage import median_filter
SR=24000
EXTRA_PROGRAMS={'acoustic-guitar':25,'nylon-guitar':24,'finger-bass':33,'acoustic-bass':32,'violin':40,'strings':48,'flute':73,'harp':46,'electric-piano':4,'fm-piano':5,'organ':19,'accordion':21,'harpsichord':6,'clavinet':7,'harmonica':22,'ocarina':79,'synth-square':80,'synth-saw':81,'synth-pad':89,'synth-poly':90}
SEPARATE_VARIANTS={
 'weresax-synth':('sax','Weresax/Weresax/Programs/sxnth.sfz'),
 'weresax-saxcordion':('sax','Weresax/Weresax/Programs/saxcordion.sfz'),
 'guitar-black':('electric-guitar','BlackAndGreenGuitars/Programs/07-black_twang.sfz'),
 'guitar-combo':('electric-guitar','BlackAndGreenGuitars/Programs/10-combo_twang.sfz'),
 'piano-treble':('piano','AccurateSalamander/sfz_daw/Accurate-SalamanderGrandPiano_treble2.5db.sfz'),
 'piano-bass':('piano','AccurateSalamander/sfz_daw/Accurate-SalamanderGrandPiano_bass1.5db.sfz')}

DRUM_PROGRAMS={'drums-standard':0,'drums-rock':16,'drums-jazz':32,'drums-brush':40,'drums-electronic':24}


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

def render_soundfont(notes,seconds,root,program,shift,percussion=False):
 """Offline in-process FluidSynth: no audio device or detached helper process."""
 import ctypes as c,os
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
  frames=round(seconds*SR);audio=np.zeros(frames,dtype=np.float32);events=[]
  for begin,end,pitch,velocity in notes:
   events.extend([(max(0,round(begin*SR)),1,int(pitch+shift),int(48+55*np.clip(velocity,0,1))), (min(frames,round(end*SR)),0,int(pitch+shift),0)])
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

def render_separate(notes,seconds,root,instrument,shift,tone,patch_name=None):
 """Render the supplied SFZ patches in-process, including their sample mappings."""
 import ctypes as c,os
 from scipy.signal import butter,sosfilt
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
   patch_text=patch.read_text(encoding='utf-8').replace('ampeg_release=0.25','ampeg_release=0.65',1)
   loaded=load_text(synth,str(patch).encode('utf-8'),patch_text.encode('utf-8'))
  else:loaded=load(synth,str(patch).encode('utf-8'))
  if not loaded:raise ValueError('Cannot load the selected SFZ instrument.')
  frames=round(seconds*SR);audio=np.zeros(frames,dtype=np.float32);events=[]
  for begin,end,pitch,velocity in notes:
   events.extend([(max(0,round(begin*SR)),1,int(pitch+shift),int(48+55*np.clip(velocity,0,1))), (min(frames,round(end*SR)),0,int(pitch+shift),0)])
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

def render(guitar_path,seconds,root,instrument="sax",tone=None,bank="fluidr3",source_name="guitar"):
 patch_name=None
 if instrument in SEPARATE_VARIANTS:
  instrument,patch_name=SEPARATE_VARIANTS[instrument];bank='separate'
 banks={"sax":"alto_sax","piano":"acoustic_grand_piano","electric-guitar":"electric_guitar_clean"}
 if instrument in DRUM_PROGRAMS:return render_drums(guitar_path,seconds,root,instrument)
 if instrument in EXTRA_PROGRAMS:bank="livehq"
 if instrument not in banks and instrument not in EXTRA_PROGRAMS:raise ValueError("Unsupported replacement instrument.")
 if bank not in ['fluidr3','livehq','separate']:raise ValueError('Choose a supported instrument bank.')
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
 _,midi,events=predict(guitar_path,model_or_model_path=build_icassp_2022_model_path(FilenameSuffix.onnx),minimum_note_length=90,minimum_frequency=40 if source_name=='bass' or instrument in ['finger-bass','acoustic-bass'] else 100,maximum_frequency=1500,onset_threshold=.55,frame_threshold=.35)
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
 attacks=librosa.onset.onset_detect(y=guitar,sr=SR,hop_length=240,units='time',backtrack=False)
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
 if instrument=='electric-guitar':notes=source_supported_overlap(notes,guitar,seconds)
 # One fixed octave placement for sax; no per-note octave folding.
 shift=12 if instrument in ['sax','flute','violin'] and notes and np.median([n[2] for n in notes])<58 else 0
 if instrument in ['finger-bass','acoustic-bass'] and notes:
  while np.median([n[2]+shift for n in notes])>55:shift-=12
 if bank=='separate':
  melody=render_separate(notes,seconds,root,instrument,shift,tone,patch_name)
 elif bank=='livehq':
  program={**EXTRA_PROGRAMS,'sax':65,'piano':0,'electric-guitar':30 if tone=='distorted' else 27}[instrument]
  melody=render_soundfont(notes,seconds,root,program,shift)
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
 # Export the melody actually performed, rather than the original polyphonic detection.
 import pretty_midi
 performed=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program={**EXTRA_PROGRAMS,'sax':65,'piano':0,'electric-guitar':30 if tone=='distorted' else 27}[instrument])
 for begin,end,pitch,velocity in notes:
  track.notes.append(pretty_midi.Note(velocity=int(48+55*np.clip(velocity,0,1)),pitch=int(pitch+shift),start=begin,end=end))
 performed.instruments.append(track)
 return melody,performed,notes
