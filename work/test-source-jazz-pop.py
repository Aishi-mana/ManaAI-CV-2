"""Coordinated Jazz/Pop auditions using the same source-note/beat foundation as Rock."""
from pathlib import Path
import sys,os,json,hashlib
root=Path.cwd();os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path[:0]=[str(root/'scripts'),str(root/'data/transcription-packages')]
import numpy as np,soundfile as sf
from arrangement_replacement import render_soundfont,SR
out=root/'exports/singing/source-jazz-pop-20261108';out.mkdir(exist_ok=True)
source_path=root/'exports/singing/tsumugi-country-dynamics-20261108/checks.json'
source_hash=hashlib.sha256(source_path.read_bytes()).hexdigest()
source=json.loads(source_path.read_text(encoding='utf-8'))
events=[[*n[:3],v/127] for n,v in zip(source['notes'],source['velocities'])]
rock=json.loads((root/'exports/singing/source-rock-band-20261108/checks.json').read_text(encoding='utf-8'))
beats=np.array(rock['beat_times']);period=float(np.median(np.diff(beats)));seconds=30
rms=lambda x:float(np.sqrt(np.mean(x*x)))
def normalize(x,target):return x*min(target/max(rms(x),1e-8),.95/max(float(np.abs(x).max()),1e-8))
def save(name,x):
    x=normalize(x,.07)
    assert len(x)==seconds*SR and np.isfinite(x).all()
    sf.write(out/name,x,SR,subtype='PCM_24')
    return {'seconds':len(x)/SR,'rms':rms(x),'peak':float(np.abs(x).max())}
def sample(notes,program,drums=False,vel_scale=1):
    return render_soundfont(notes,seconds,root,program,0,percussion=drums,
        midi_velocities=[max(1,min(127,round(n[3]*127*vel_scale))) for n in notes])
def hit(events,at,pitch,velocity,hold=.08):
    if 0<=at<seconds:events.append([float(at),float(min(seconds,at+hold)),int(pitch),velocity/127])
def lower(p,lo=36,hi=55):
    while p>hi:p-=12
    while p<lo:p+=12
    return int(p)
roots={round(n[0],5):n for n in rock['bass_notes']}
results={}

# Jazz: source guitar notes played by acoustic piano, source-supported upright
# bass movement, and a sparse swung ride/sidestick groove. No separate solo added.
piano=normalize(sample(events,0,vel_scale=.92),.07)
jazz_bass=[];bass_evidence=[];last_pitch=None
for i,b in enumerate(beats):
    end=float(beats[i+1]) if i+1<len(beats) else min(seconds,b+period)
    root_note=roots.get(round(float(b),5))
    if root_note is None:continue
    candidates=[(k,n) for k,n in enumerate(events) if n[2]<=64 and n[3]>=.2 and n[0]<b+.12 and n[1]>b+.025]
    pitch=int(root_note[2]);chosen=None
    if i%4 and candidates:
        # Move only among notes actually present in the source harmony here.
        options=[(k,n,lower(n[2])) for k,n in candidates]
        options=[x for x in options if x[2]!=pitch] or options
        chosen=min(options,key=lambda x:(abs(x[2]-(last_pitch if last_pitch is not None else pitch)), -x[1][3]))
        pitch=chosen[2]
    hit(jazz_bass,b,pitch,74 if i%4==0 else 64,hold=(end-b)*.82)
    bass_evidence.append({'time':float(b),'pitch':pitch,'source_note_index':None if chosen is None else chosen[0],
        'root_evidence':'shared Rock source-bass map' if chosen is None else 'active source guitar pitch class'})
    last_pitch=pitch
jazz_drums=[]
for i,b in enumerate(beats):
    end=float(beats[i+1]) if i+1<len(beats) else min(seconds,b+period)
    hit(jazz_drums,b,51,56 if i%2==0 else 48,.3)
    if i%2:hit(jazz_drums,b+(end-b)*2/3,51,40,.2)
    if i%2:hit(jazz_drums,b,44,38,.08)
    if i%4==0:hit(jazz_drums,b,36,39,.08)
    if i%4==3:hit(jazz_drums,b,37,41,.08)
upright=normalize(sample(jazz_bass,32),rms(piano)*.42)
jazz_kit=normalize(sample(jazz_drums,32,True),rms(piano)*.24)
jazz=piano+upright+jazz_kit
results['jazz']=dict(audio=save('Jazz combo - 30s.wav',jazz),bass_notes=jazz_bass,drum_notes=jazz_drums,
    bass_source_evidence=bass_evidence,instruments=['Acoustic piano (all source notes)','Upright bass','Light jazz ride/sidestick kit'],
    melodic_note_events_unchanged=True,additional_lead_melody=False)

# Pop: bright electric keys carry the same source part; a restrained octave pad
# follows only existing bass pitch classes. Shared beat grid drives picked bass
# and a straight pop kick/snare/hat pattern, without the Rock amp sound.
keys=normalize(sample(events,4),.07)
pad_notes=[]
for n in rock['bass_notes']:
    if not any(abs(n[0]-b)<.001 for b in beats):continue
    p=int(n[2])+24
    end=min(seconds,n[0]+period*1.05)
    if pad_notes and pad_notes[-1][2]==p and n[0]-pad_notes[-1][1]<.05:
        pad_notes[-1][1]=end
    else:pad_notes.append([float(n[0]),float(end),p,.35])
pad=normalize(sample(pad_notes,89),rms(keys)*.12)
pop_bass=normalize(sample(rock['bass_notes'],33),rms(keys)*.42)
pop_drums=[]
for i,b in enumerate(beats):
    end=float(beats[i+1]) if i+1<len(beats) else min(seconds,b+period)
    hit(pop_drums,b,36,85 if i%4==0 else 72)
    if i%2:
        hit(pop_drums,b,38,86)
        hit(pop_drums,b,39,48)
    hit(pop_drums,b,42,59)
    hit(pop_drums,(b+end)/2,42,43)
pop_kit=normalize(sample(pop_drums,0,True),rms(keys)*.45)
pop=keys+pad+pop_bass+pop_kit
results['pop']=dict(audio=save('Pop band - 30s.wav',pop),bass_notes=rock['bass_notes'],drum_notes=pop_drums,pad_notes=pad_notes,
    instruments=['Bright electric piano (all source notes)','Restrained synth pad','Electric bass','Straight pop kick/snare/clap/hat kit'],
    melodic_note_events_unchanged=True,additional_lead_melody=False)
for label,a in [('Jazz piano',piano),('Jazz bass',upright),('Jazz drums',jazz_kit),('Pop keys',keys),('Pop pad',pad),('Pop bass',pop_bass),('Pop drums',pop_kit)]:
    sf.write(out/(label+' stem.wav'),a,SR,subtype='FLOAT')
assert hashlib.sha256(source_path.read_bytes()).hexdigest()==source_hash
results.update(source='Country Roads source0–30s',source_note_count=len(events),source_note_hash_unchanged=True,
    beat_times=beats.tolist(),meter='Same continuous4/4 grid as Rock audition; bar-phase uncertainty retained.',
    original_backing_overlay=False,voice_regenerated=False,productionChanged=False,listeningApproved=False,
    scope='First coordinated Jazz/Pop auditions, not yet validated general-purpose genre conversion')
(out/'checks.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps({k:v['audio'] for k,v in results.items() if k in ['jazz','pop']}),flush=True)
