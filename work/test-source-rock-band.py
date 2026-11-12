"""First coordinated Rock-band audition. No production/UI/model changes."""
from pathlib import Path
import os,sys,json,hashlib
root=Path.cwd()
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
sys.path[:0]=[str(root/'scripts'),str(root/'data/transcription-packages')]
import numpy as np,soundfile as sf
from scipy.signal import resample_poly
from arrangement_replacement import render_soundfont,SR
out=root/'exports/singing/source-rock-band-20261108';out.mkdir(exist_ok=True)
seconds=30
note_path=root/'exports/singing/tsumugi-country-dynamics-20261108/checks.json'
note_hash=hashlib.sha256(note_path.read_bytes()).hexdigest()
analysis=json.loads(note_path.read_text(encoding='utf-8'))
notes=analysis['notes'];velocities=analysis['velocities']
events=[[*n[:3],v/127] for n,v in zip(notes,velocities)]
beat_path=root/'exports/singing/source-beat-grid-20261108/beat-analysis.json'
beat_info=json.loads(beat_path.read_text(encoding='utf-8'))['Country Roads']
beats=np.asarray(beat_info['beats'])
assert beat_info['source_start']==0 and np.all(np.diff(beats)>0)
assert len(beats)>20
interval=float(np.median(np.diff(beats)))
# Arrange a continuous 4/4 groove, anchored by the model's stable opening bars.
# Later raw two-beat downbeat flags are not used to reset or change the groove.
opening_bars=beat_info['downbeats'][:5]
assert all(np.min(abs(beats[::4]-b))<.04 for b in opening_bars)
bass=[];bass_evidence=[]
for index,begin in enumerate(beats):
    end=float(beats[index+1]) if index+1<len(beats) else min(seconds,begin+interval)
    if begin>=seconds:continue
    # Prefer source-supported held low guitar notes; never infer a key/scale/chord root.
    active=[(i,n) for i,n in enumerate(events) if n[2]<=56 and n[0]<begin+.12 and n[1]>begin+.025 and n[3]>=.2]
    if not active:
        active=[(i,n) for i,n in enumerate(events) if n[2]<=56 and begin<=n[0]<end and n[3]>=.2]
    if not active:continue
    chosen=min(active,key=lambda item:(item[1][2],-item[1][3]))
    source_index,note=chosen;pitch=int(note[2])
    while pitch>47:pitch-=12
    while pitch<35:pitch+=12
    level=int(np.clip(50+note[3]*35,50,85))
    for hit,accent in [(float(begin),1.),(float((begin+end)/2),.78)]:
        hold=min(seconds-hit,(end-begin)*.42)
        if hold<=.02:continue
        bass.append([hit,hit+hold,pitch,round(level*accent)/127])
        bass_evidence.append({'time':hit,'source_note_index':source_index,'source_pitch':note[2],'bass_pitch':pitch})
assert len(bass)>20
assert all(any((n[2]-source[2])%12==0 for source in events if source[2]<=56) for n in bass)
drums=[]
for i,begin in enumerate(beats):
    end=float(beats[i+1]) if i+1<len(beats) else min(seconds,begin+interval)
    if begin>=seconds:continue
    phase=i%4
    def hit(at,pitch,velocity,held=.08):
        if 0<=at<seconds:drums.append([float(at),float(min(seconds,at+held)),pitch,velocity/127])
    if phase in (0,2):hit(begin,36,94 if phase==0 else 82)
    if phase in (1,3):hit(begin,38,94 if phase==1 else 88)
    if phase==2:hit((begin+end)/2,36,62)
    hit(begin,42,60)
    hit((begin+end)/2,42,43)
    if i==0:hit(begin,49,42,.7)
drums.sort(key=lambda n:(n[0],n[2]))
print('Rendering coordinated source-derived bass and Rock kit',flush=True)
low=render_soundfont(bass,seconds,root,34,0,midi_velocities=[round(n[3]*127) for n in bass])
kit=render_soundfont(drums,seconds,root,16,0,percussion=True,midi_velocities=[round(n[3]*127) for n in drums])
guitar_path=root/'exports/singing/tsumugi-country-smoother-20261108/Smoother electric guitar - 30s.wav'
guitar_hash=hashlib.sha256(guitar_path.read_bytes()).hexdigest()
guitar,rate=sf.read(guitar_path,dtype='float32');assert rate==SR and len(guitar)==seconds*SR
rms=lambda x:float(np.sqrt(np.mean(x*x)))
# One fixed balance across the excerpt: quieter notes are not independently boosted.
low*=rms(guitar)*.38/max(rms(low),1e-8)
kit*=rms(guitar)*.55/max(rms(kit),1e-8)
mix=guitar+low+kit
assert len(mix)==SR*seconds and np.isfinite(mix).all()
def save(name,a,rate,target=.07):
    a=a*min(target/max(rms(a),1e-8),.95/max(float(np.abs(a).max()),1e-8))
    assert len(a)==seconds*rate and np.isfinite(a).all()
    sf.write(out/name,a,rate,subtype='PCM_24')
    return {'seconds':len(a)/rate,'rms':rms(a),'peak':float(np.abs(a).max())}
checks={'rock':save('Rock band - 30s.wav',mix,SR)}
original,original_rate=sf.read(root/'exports/singing/1794090410615/backing-extracted.wav',always_2d=True,dtype='float32')
checks['original']=save('Original backing - 30s.wav',original,original_rate)
for label,a in [('Guitar',guitar),('Bass',low),('Drums',kit)]:
    sf.write(out/(label+' stem.wav'),a,SR,subtype='FLOAT')
# Optional context mix uses an existing voice render; no voice generation.
vocal,vr=sf.read(root/'exports/singing/1794090410615/vc_mana-trained-v1.wav',always_2d=True,dtype='float32')
from math import gcd
d=gcd(vr,SR);vocal=resample_poly(vocal.mean(1),SR//d,vr//d)[:len(mix)]
assert len(vocal)==len(mix)
vocal*=rms(mix)*1.1/max(rms(vocal),1e-8)
checks['with_existing_voice']=save('Rock band with existing vocal - 30s.wav',mix+vocal,SR)
assert hashlib.sha256(guitar_path.read_bytes()).hexdigest()==guitar_hash
assert hashlib.sha256(note_path.read_bytes()).hexdigest()==note_hash
checks.update(source='Country Roads, source0–30s',guitar_audio_unchanged=True,guitar_notes_unchanged=True,
    meter='Arranged continuous4/4; anchored by five consistent opening raw downbeats. Later raw bar flags are not adopted.',
    beat_times=beats.tolist(),bass_notes=bass,bass_source_evidence=bass_evidence,drum_notes=drums,
    harmony='Bass pitch classes taken from detected source low guitar notes; no guessed chord progression or extra lead melody.',
    timbres={'guitar':'Previously accepted Tsumugi/SFZ/NAM audition','bass':'LiveHQ picked bass, program34','drums':'LiveHQ power kit, program16'},
    original_backing_overlay=False,vocal_regenerated=False,productionChanged=False,listeningApproved=False,
    scope='First Rock-band arrangement audition, not completed all-song Rock/Jazz/Pop support')
(out/'checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in checks.items() if k not in ['bass_notes','bass_source_evidence','drum_notes','beat_times']}),flush=True)
