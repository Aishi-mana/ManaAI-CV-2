"""Coordinated, source-note Rock/Jazz/Pop previews. No audio diffusion."""
from pathlib import Path
import math,json,shutil,subprocess,sys,tempfile

LEADS={'rock':('electric-guitar','crunch-guitar','rock-organ'),'jazz':('sax','clarinet','muted-trumpet'),'pop':('electric-piano','acoustic-piano','synth-lead','clean-guitar'),'country':('fiddle','clean-guitar','harmonica','banjo','pedal-steel','acoustic-guitar')}

def checked_lead(genre,lead=None):
 if genre not in LEADS:raise ValueError('Choose Rock, Jazz or Pop.')
 lead=lead or LEADS[genre][0]
 if lead not in LEADS[genre]:raise ValueError('Choose a lead offered for this genre.')
 return lead

def upper_line(events,seconds):
 import numpy as np
 line=np.zeros(math.ceil(seconds*100),int);levels=np.zeros(len(line))
 for i in range(len(line)):
  active=[n for n in events if n[0]<=i*.01<n[1] and n[2]>=55 and n[3]>=.35]
  if active:
   n=max(active,key=lambda n:(n[2],n[3]));line[i]=n[2];levels[i]=n[3]
 notes=[];first=0
 for i in range(1,len(line)+1):
  if i<len(line) and line[i]==line[first]:continue
  if line[first]>0 and i-first>=8:notes.append([first*.01,min(seconds,i*.01),int(line[first]),float(levels[first:i].mean())])
  first=i
 return notes

def plan(events,beat_map,seconds,genre,lead=None,source='guitar',melody_override=None,bass_override=None):
 import numpy as np
 lead=checked_lead(genre,lead)
 if not math.isfinite(seconds) or not 8<=seconds<=360:raise ValueError('Band arrangements need an 8–360 second section.')
 beats=np.asarray([float(b) for b in beat_map['beats'] if 0<=b<seconds])
 if len(beats)<4 or not np.isfinite(beats).all() or not np.all(np.diff(beats)>0):raise ValueError('No steady source beat found.')
 period=float(np.median(np.diff(beats)))
 if not .2<=period<=1.5:raise ValueError('The source pulse is outside the supported range. Use original instruments.')
 bars=[b for b in beat_map.get('downbeats',[]) if 0<=b<seconds]
 phase=int(np.argmin(abs(beats-bars[0])))%4 if bars else 0
 bass=[];bass_evidence=[]
 for i,b in enumerate(beats):
  end=float(beats[i+1]) if i+1<len(beats) else min(seconds,b+period)
  active=[(k,n) for k,n in enumerate(events) if n[2]<=56 and n[0]<b+.12 and n[1]>b+.025 and n[3]>=.2]
  if not active:active=[(k,n) for k,n in enumerate(events) if n[2]<=56 and b<=n[0]<end and n[3]>=.2]
  if not active:continue
  k,n=min(active,key=lambda item:(item[1][2],-item[1][3]));pitch=int(n[2])
  while pitch>47:pitch-=12
  while pitch<35:pitch+=12
  strength=int(np.clip(50+n[3]*35,50,85))
  attacks=[(float(b),1.)]
  if genre!='country':attacks.append((float((b+end)/2),.78))
  for t,accent in attacks:
   held=min(seconds-t,(end-b)*.42)
   if held>.02:
    bass.append([t,t+held,pitch,round(strength*accent)/127]);bass_evidence.append({'time':t,'source_note_index':k,'source_pitch':n[2]})
 if not bass and bass_override is None:raise ValueError(f'No reliable low {source} notes for the rhythm section. Try another section.')
 drums=[];pad=[];comp=[]
 def hit(rows,t,p,v,held=.08):
  if 0<=t<seconds:rows.append([float(t),float(min(seconds,t+held)),int(p),v/127])
 if genre in ('rock','pop','country'):
  for i,b in enumerate(beats):
   end=float(beats[i+1]) if i+1<len(beats) else min(seconds,b+period);p=(i-phase)%4
   if genre=='rock':
    if p in (0,2):hit(drums,b,36,94 if p==0 else 82)
    if p in (1,3):hit(drums,b,38,94 if p==1 else 88)
    if p==2:hit(drums,(b+end)/2,36,62)
    hit(drums,b,42,60);hit(drums,(b+end)/2,42,43)
    if i==phase:hit(drums,b,49,42,.7)
   elif genre=='country':
    if p%2==0:hit(drums,b,36,78 if p==0 else 65)
    else:hit(drums,b,37,76)
    hit(drums,b,42,49);hit(drums,(b+end)/2,42,34)
   else:
    hit(drums,b,36,85 if p==0 else 72)
    if p%2:hit(drums,b,38,86);hit(drums,b,39,48)
    hit(drums,b,42,59);hit(drums,(b+end)/2,42,43)
  if genre=='country':
   comp=[list(n) for n in events if n[2]<60]
  if genre=='pop':
   for n in bass:
    if not any(abs(n[0]-b)<.001 for b in beats):continue
    end=min(seconds,n[0]+period*1.05);pitch=n[2]+24
    if pad and pad[-1][2]==pitch and n[0]-pad[-1][1]<.05:pad[-1][1]=end
    else:pad.append([n[0],end,pitch,.35])
   comp=[list(n) for n in events if n[2]<60]
 else:
  fast=sorted(float(v) for i,b in enumerate(beats) for v in [b,(b+(beats[i+1] if i+1<len(beats) else b+period))/2] if v<seconds)
  bass=[];bass_evidence=[];previous=None
  def low(p):
   while p>55:p-=12
   while p<36:p+=12
   return int(p)
  for i,b in enumerate(fast):
   end=fast[i+1] if i+1<len(fast) else min(seconds,b+period/2);p=(i-phase*2)%4
   active=[(k,n) for k,n in enumerate(events) if n[2]<=64 and n[3]>=.2 and n[0]<b+.10 and n[1]>b+.02]
   if not active:active=[(k,n) for k,n in enumerate(events) if n[2]<=56 and n[3]>=.2 and b<=n[0]<end]
   if active:
    if p==0:chosen=min(active,key=lambda x:x[1][2])
    else:
     alternatives=[v for v in active if low(v[1][2])!=previous] or active
     chosen=min(alternatives,key=lambda x:(abs(low(x[1][2])-(previous if previous is not None else 43)),-x[1][3]))
    pitch=low(chosen[1][2]);hit(bass,b,pitch,86 if p==0 else 73,(end-b)*.8);previous=pitch
    bass_evidence.append({'time':b,'source_note_index':chosen[0],'source_pitch':chosen[1][2]})
    if p%2:
     for n in sorted([n for _,n in active if n[2]<60],key=lambda n:(-n[3],n[2]))[:3]:hit(comp,b+(end-b)*.08,n[2],65,.18)
   hit(drums,b,51,67 if p%2==0 else 57,.2)
   if p%2:
    hit(drums,b+(end-b)*2/3,51,49,.14);hit(drums,b,44,48,.07);hit(drums,b,38,47,.07)
   if p==0:hit(drums,b,36,53)
 melody=melody_override
 if melody is None:
  melody=events if source=='guitar' and genre=='rock' and lead!='rock-organ' else upper_line(events,seconds)
 if not melody:raise ValueError(f'No clear upper {source} melody found. Try another section or original instruments.')
 if bass_override is not None:bass,bass_evidence=bass_override,[]
 return dict(genre=genre,lead=lead,seconds=seconds,melody=melody,bass=bass,bassEvidence=bass_evidence,drums=drums,pad=pad,comp=comp,
  beat_map=beat_map,bar_phase_index=phase,meter='Arranged 4/4; bar phase estimated, not score-verified.')

def render_pedal_steel(melody,seconds,root,rate):
 import numpy as np
 import soundfile as sf
 sys.path.append(str(root/'data/transcription-packages'))
 import pretty_midi
 synth=next((root/'data/fluidsynth/runtime').rglob('fluidsynth.exe'),None)
 bank=root/'data/instrument-samples/LiveHQNatural/Live HQ Natural SoundFont GM.sf2'
 if synth is None or not bank.is_file():
  raise ValueError('Restore the local FluidSynth runtime and Live HQ sound bank for pedal steel.')
 midi=pretty_midi.PrettyMIDI()
 guitar=pretty_midi.Instrument(27)
 for index,(start,end,pitch,strength) in enumerate(melody):
  guitar.notes.append(pretty_midi.Note(round(52+46*strength),pitch,start,end))
  if end-start<.19 or index%3==2:continue
  previous=melody[index-1] if index else None
  interval=pitch-previous[2] if previous and start-previous[1]<.18 else 1
  bend=-interval if abs(interval) in (1,2) else -1
  duration=min(.145,(end-start)*.6)
  for step in range(17):
   progress=step/16
   value=int(np.clip(round(4096*bend*(1-progress)**2),-8192,8191))
   guitar.pitch_bends.append(pretty_midi.PitchBend(value,start+duration*progress))
 midi.instruments.append(guitar)
 cache=root/'data/music-cache'
 cache.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory(prefix='pedal-steel-',dir=cache) as folder:
  guide=Path(folder)/'lead.mid'
  wave=Path(folder)/'lead.wav'
  midi.write(str(guide))
  subprocess.run([str(synth),'-ni','-R','0','-C','0','-F',str(wave),'-r',str(rate),str(bank),str(guide)],
                 check=True,timeout=90,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
  audio,rendered_rate=sf.read(wave,always_2d=True)
 frames=round(seconds*rate)
 if rendered_rate!=rate or not np.isfinite(audio).all():
  raise ValueError('Pedal steel returned invalid audio.')
 return np.pad(audio.mean(1)[:frames],(0,max(0,frames-len(audio))))

def render(score,root,rock_guitar=None):
 import numpy as np
 from arrangement_replacement import render_soundfont,render_separate,SR
 root=Path(root);seconds=score['seconds'];genre=score['genre'];lead=checked_lead(genre,score['lead'])
 rms=lambda x:float(np.sqrt(np.mean(x*x)))
 def level(x,target):return x*min(target/max(rms(x),1e-8),.95/max(float(np.abs(x).max()),1e-8))
 def sample(notes,program,drums=False,velocities=None):
  if not notes:return np.zeros(round(seconds*SR))
  return render_soundfont(notes,seconds,root,program,0,percussion=drums,midi_velocities=velocities or [max(1,round(n[3]*127)) for n in notes])
 melody=score['melody']
 if genre=='rock':
  if lead=='rock-organ':
   main=level(sample(melody,18),.07)
  else:
   if rock_guitar is None:raise ValueError('Rock guitar requires the source guitar performance.')
   main=level(rock_guitar,.07)
  bass=level(sample(score['bass'],34),.07*.38);kit=level(sample(score['drums'],16,True),.07*.55)
  stems={'lead':main,'bass':bass,'drums':kit}
 elif genre=='jazz':
  velocities=[int(np.clip(78+n[3]*42,85,118)) for n in melody]
  if lead=='sax':main=render_separate(melody,seconds,root,'sax',0,None,midi_velocities=velocities,sax_release_cc=6)
  else:main=sample(melody,{'clarinet':71,'muted-trumpet':59}[lead],velocities=velocities)
  stems={'lead':level(main,.07),'piano':level(sample(score['comp'],0),.025),'bass':level(sample(score['bass'],32),.036),'drums':level(sample(score['drums'],32,True),.027)}
 elif genre=='country':
  if lead=='clean-guitar':
   velocities=[int(np.clip(round(n[3]*110),35,110)) for n in melody]
   main=render_separate(melody,seconds,root,'electric-guitar',0,'clean',midi_velocities=velocities,guitar_release=.25)
  elif lead=='pedal-steel':
   main=render_pedal_steel(melody,seconds,root,SR)
  else:
   main=sample(melody,{'fiddle':110,'harmonica':22,'banjo':105,'acoustic-guitar':25}[lead])
  stems={'lead':level(main,.044),'acoustic-guitar':level(sample(score['comp'],25),.042),
         'bass':level(sample(score['bass'],32),.028),'drums':level(sample(score['drums'],0,True),.022)}
 else:
  velocities=[int(np.clip(round(n[3]*110),35,110)) for n in melody]
  if lead=='clean-guitar':main=render_separate(melody,seconds,root,'electric-guitar',0,'clean',midi_velocities=velocities,guitar_release=.25)
  else:main=sample(melody,{'electric-piano':4,'acoustic-piano':0,'synth-lead':81}[lead],velocities=velocities)
  stems={'lead':level(main,.065),'keys':level(sample(score['comp'],4),.018),'pad':level(sample(score['pad'],89),.0084),'bass':level(sample(score['bass'],33),.0294),'drums':level(sample(score['drums'],0,True),.0315)}
 mix=sum(stems.values())
 if not np.isfinite(mix).all() or rms(mix)<1e-6:raise ValueError('No usable band arrangement returned.')
 return level(mix,.07),stems

def arrange(backing,rate,genre,lead,root,out,source='guitar',vocal=None,follow_bass=False):
 import numpy as np,soundfile as sf
 from scipy.signal import resample_poly
 from guitar_arrangement import extract,render_source
 from music_beats import detect
 root=Path(root);out=Path(out);out.mkdir(parents=True,exist_ok=True);lead=checked_lead(genre,lead)
 seconds=backing.shape[-1]/rate
 if not 8<=seconds<=360:raise ValueError('Band arrangements need an 8–360 second section.')
 print(f'Restyling instrumental backing: {genre} · {lead}…',flush=True)
 if source not in ('guitar','piano','keys','vocal'):raise ValueError('Choose guitar, piano, keys or vocal melody as the band source.')
 if source=='vocal' and vocal is None:raise ValueError('Follow vocal melody needs an isolated lead vocal.')
 tone={'electric-guitar':'distorted','crunch-guitar':'crunch'}.get(lead,'clean') if genre=='rock' else 'clean'
 performance=None
 if source in ('piano','keys'):
  from piano_arrangement import extract_band_stem
  from piano_transcription import transcribe,midi_for
  print(f'Following the extracted {source}…',flush=True)
  sf.write(out/'original-backing.wav',backing.T,rate,subtype='FLOAT')
  extracted=extract_band_stem(backing,rate,root,out,source)
  notes=transcribe(extracted,seconds,root)
  midi=midi_for(notes)
  extraction={'selected':'acoustic-piano' if source=='piano' else 'keys'}
 else:
  _,_,extraction=extract(backing,rate,root,out,max_seconds=360)
  details={}
  performance,midi,_=render_source(out/'guitar-extracted.wav',seconds,root,tone,analysis=details)
  notes=details['source_notes']
 beats=detect(out/'original-backing.wav',root)
 melody=None
 if source=='vocal':
  from vocal_melody import band_vocal_notes
  from piano_transcription import midi_for
  print('Following the isolated vocal melody…',flush=True)
  vocal_rate=24000
  divisor=math.gcd(rate,vocal_rate)
  guide=resample_poly(np.asarray(vocal).reshape(-1),vocal_rate//divisor,rate//divisor)[:round(seconds*vocal_rate)]
  melody=band_vocal_notes(guide,seconds)
  midi=midi_for(melody)
  extracted=out/'vocal-melody-guide.wav'
  sf.write(extracted,guide,vocal_rate,subtype='FLOAT')
 bass=None
 if follow_bass:
  from piano_arrangement import extract_band_stem
  from bass_replacement import track_band_bass
  print('Following the isolated bass groove…',flush=True)
  bass_path=extract_band_stem(backing,rate,root,out,'bass')
  bass_audio,bass_rate=sf.read(bass_path,dtype='float32')
  divisor=math.gcd(bass_rate,24000)
  bass_audio=resample_poly(bass_audio,24000//divisor,bass_rate//divisor)[:round(seconds*24000)]
  bass=track_band_bass(bass_audio,seconds)
 score=plan(notes,beats,seconds,genre,lead,'guitar' if source=='vocal' else source,melody_override=melody,bass_override=bass)
 if source in ('piano','keys','vocal') and genre=='rock' and lead!='rock-organ':
  performance,_,_=render_source(extracted,seconds,root,tone,notes_override=score['melody'],analysis={})
 audio,stems=render(score,root,performance if genre=='rock' else None)
 for name,data in stems.items():sf.write(out/(name+'.wav'),data,24000,subtype='FLOAT')
 midi.write(str(out/f'source-{source}-notes.mid'))
 metadata=dict(engine='source-note-band',genre=genre,lead=lead,seconds=seconds,sourceInstrument=source,followBass=bool(follow_bass),source=extraction,score=score,timingVerified=False)
 (out/'band-analysis.json').write_text(json.dumps(metadata),encoding='utf-8')
 for credit,name in [(root/'data/instrument-samples/LiveHQNatural/ATTRIBUTION.txt','LIVEHQ_ATTRIBUTION.txt'),(root/'data/instrument-samples/SeparateLibraries/ATTRIBUTION.txt','SAMPLE_ATTRIBUTION.txt'),(root/'data/nam/models/ATTRIBUTION.txt','NAM_ATTRIBUTION.txt')]:
  if credit.is_file():shutil.copyfile(credit,out/name)
 d=math.gcd(24000,rate);audio=resample_poly(audio,rate//d,24000//d)
 audio=np.pad(audio[:backing.shape[-1]],(0,max(0,backing.shape[-1]-len(audio))))
 return np.tile(audio,(backing.shape[0],1)),metadata
