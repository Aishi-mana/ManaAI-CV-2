from pathlib import Path
import os,sys,json,subprocess,hashlib,math
root=Path(__file__).resolve().parents[1]
for k,v in {'NUMBA_CACHE_DIR':root/'data/music-cache/numba','TEMP':root/'work','TMP':root/'work'}.items():os.environ[k]=str(v)
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
sys.path.insert(0,str(root/'scripts'))
import numpy as np,soundfile as sf,librosa
from scipy.signal import resample_poly
seconds=int(sys.argv[1]) if len(sys.argv)>1 else 12
assert 1<=seconds<=60
out=root/('exports/singing/vocal-transition-20261108' if seconds!=12 else 'exports/singing/vocal-arrangement-20261108');out.mkdir(parents=True,exist_ok=True)
request=json.loads((root/'exports/singing/1794064484684/request.json').read_text())
source=Path(request['source']);digest=hashlib.sha256(source.read_bytes()).hexdigest()
original,sr=librosa.load(source,sr=44100,mono=False,offset=30,duration=seconds)
assert original.shape==(2,44100*seconds)
sf.write(out/'source-segment.wav',original.T,sr,subtype='FLOAT')
def run(script,*args,stdin=None):
 subprocess.run([sys.executable,str(root/script),*map(str,args)],input=stdin,text=True,check=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
print(f'Stage 1: isolate vocal and backing, source 30-{30+seconds}s',flush=True)
run('scripts/cover_lead.py',stdin=json.dumps(dict(root=str(root),source=str(out/'source-segment.wav'),output=str(out))))
print('Stage 2: isolate actual acoustic piano',flush=True)
run('work/extract-mega-piano-20261108.py',out/'backing-extracted.wav',out/'piano-extraction')
print('Stage 3: piano-specific transcription',flush=True)
run('work/test-piano-crnn-20261108.py',out/f'piano-extraction/Extracted piano - {seconds:g}s.wav',out/'piano-notes')
from arrangement_replacement import render_soundfont,SR
report=json.loads((out/'piano-notes/checks.json').read_text());notes=report['notes']
piano=render_soundfont(notes,seconds,root,4,0,midi_velocities=[max(1,round(v*.9)) for v in report['midiVelocities']])
candidates=sorted([n for n in notes if n[2]<=56 and n[1]-n[0]>=.6],key=lambda n:(n[0],n[2]))
bass=[]
for n in candidates:
 if bass and n[0]-bass[-1][0]<1.2:continue
 pitch=int(n[2])
 while pitch>47:pitch-=12
 while pitch<36:pitch+=12
 bass.append([n[0],min(n[1],n[0]+1.2),pitch,n[3]])
rms=lambda a:float(np.sqrt(np.mean(a*a)))
bass_audio=render_soundfont(bass,seconds,root,32,0,midi_velocities=[max(1,round(n[3]*127*.65)) for n in bass])
bass_audio*=min(1.,rms(piano)*.25/max(rms(bass_audio),1e-9))
drums=render_soundfont([[n[0],min(seconds,n[0]+.08),37,.2] for n in bass],seconds,root,0,0,percussion=True,midi_velocities=[30]*len(bass))
drums*=min(1.,rms(piano+bass_audio)*.08/max(rms(drums),1e-9))
arranged=piano+bass_audio+drums
lead,lead_sr=sf.read(out/'lead-extracted.wav',always_2d=True,dtype='float32')
assert rms(lead)>.0015
print('Stage 4: selected Mousey voice conversion',flush=True)
from trained_voice import TrainedVoice
voice=TrainedVoice(root,request['voice_profile'])
converted,converted_sr=voice.convert(lead,lead_sr)
def resample(a,rate):
 g=math.gcd(rate,SR);a=resample_poly(a,SR//g,rate//g,axis=0)
 return np.pad(a[:seconds*SR],(0,max(0,seconds*SR-len(a))))
converted=resample(converted,converted_sr)
backing_gain=min(1.,rms(converted)*.65/max(rms(arranged),1e-9))
vocal_gain=min(1.,rms(arranged)/max(rms(converted)*.65,1e-9))
mix=converted*vocal_gain+arranged*backing_gain
audition_gain=min(.07/max(rms(mix),1e-9),.95/max(float(abs(mix).max()),1e-9))
mix*=audition_gain
baseline=resample(original.mean(0),sr)
for name,a in [('Original vocal section',baseline),('Rearranged with Mousey',mix),('Arranged backing',arranged),('Mousey vocal',converted)]:
 assert np.isfinite(a).all() and len(a)==seconds*SR
 sf.write(out/(name+f' - {seconds:g}s.wav'),a,SR,subtype='PCM_16')
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
(out/'checks.json').write_text(json.dumps(dict(start=30,duration=seconds,pianoNotes=len(notes),bassNotes=bass,backingGain=backing_gain,vocalGain=vocal_gain,auditionGain=audition_gain,vocalRms=rms(converted)*vocal_gain*audition_gain,backingRms=rms(arranged)*backing_gain*audition_gain,peak=float(abs(mix).max()),sourceUnchanged=True,voiceProfile=request['voice_profile'],productionChanged=False,listeningApproved=False,scope='Vocal section coherence test, not full jazz conversion'),indent=2),encoding='utf-8')
print('VOCAL_ARRANGEMENT_READY',flush=True)
