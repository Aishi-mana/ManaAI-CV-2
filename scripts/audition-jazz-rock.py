"""Style auditions only: estimated harmony, synthesized band, original saved vocal."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
from arrangement_job import note, SR

root=Path(__file__).resolve().parents[1]
source=root/'exports/singing/arrangement-audition'
out=root/'exports/singing/jazz-rock-audition'
out.mkdir(parents=True,exist_ok=True)
analysis=json.loads((source/'analysis.json').read_text())
vocal,rate=sf.read(source/'mana-vocal.wav')
assert rate==SR
beat=analysis['beatSeconds'];rng=np.random.default_rng(42)

def tone(midi,duration,kind):
    t=np.arange(int(duration*SR))/SR;f=440*2**((midi-69)/12)
    envelope=np.minimum(t/.012,1)*np.minimum((duration-t)/.07,1)
    if kind=='bass':signal=np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t)
    else:
        signal=sum(np.sin(2*np.pi*f*h*t)/h for h in range(1,12))
        signal=np.tanh(signal*2)*np.exp(-t*2.4)
    return signal*np.maximum(envelope,0)*.15

for style in ['jazz','rock']:
    backing=np.zeros(len(vocal))
    def put(time,signal,gain=1):
        start=round(time*SR)
        if start<0 or start>=len(backing):return
        count=min(len(signal),len(backing)-start)
        backing[start:start+count]+=signal[:count]*gain
    for chord in analysis['chords']:
        begin,end=chord['start'],chord['end'];base=48+chord['root'];third=chord['third']
        hits=np.arange(begin,end,beat)
        for i,hit in enumerate(hits):
            if style=='jazz':
                # Seventh voicings and chord-tone bass; straight timing keeps the vocal aligned.
                if i%2==0:
                    for pitch in [base+third,base+7,base+(10 if third==3 else 11),base+14]:
                        put(hit,note(pitch,.9,'piano'),.1)
                put(hit,tone(base-12+[0,third,7,9][i%4],beat*.85,'bass'),.7)
            else:
                for pitch in [base-12,base-5,base]:put(hit,tone(pitch,beat*.92,'guitar'),.45)
                put(hit,tone(base-12,beat*.9,'bass'),.8)
    drum_start=analysis['chords'][0]['start']
    for i,hit in enumerate(np.arange(drum_start,len(vocal)/SR,beat)):
        t=np.arange(int(.18*SR))/SR
        if i%2==0:
            kick=np.sin(2*np.pi*(48*t+35*.035*(1-np.exp(-t/.035))))*np.exp(-t*28)
            put(hit,kick,.12 if style=='rock' else .04)
        else:
            noise=rng.normal(0,1,len(t));noise=sosfilt(butter(2,1800,fs=SR,btype='high',output='sos'),noise)
            put(hit,noise*np.exp(-t*(24 if style=='rock' else 12)),.065 if style=='rock' else .02)
        t=np.arange(int(.07*SR))/SR
        hat=sosfilt(butter(2,6500,fs=SR,btype='high',output='sos'),rng.normal(0,1,len(t)))*np.exp(-t*65)
        put(hit,hat,.025 if style=='rock' else .009)
    backing*=max(np.sqrt(np.mean(vocal*vocal)),.001)*(.42 if style=='rock' else .3)/max(np.sqrt(np.mean(backing*backing)),.001)
    mix=vocal+backing;mix*=min(1,.95/max(np.max(np.abs(mix)),.001))
    sf.write(out/f'{style}-backing.wav',backing,SR,subtype='PCM_16')
    sf.write(out/f'mana-{style}-mix.wav',mix,SR,subtype='PCM_16')
    assert len(mix)/SR==12 and np.max(np.abs(mix))<=.951
    print(style,'audition: 12 seconds; peak limited',flush=True)
(out/'manifest.json').write_text(json.dumps(dict(source=str(source),start=analysis['start'],seconds=12,approved=False,method='estimated chords with synthesized band; jazz seventh voicings, rock power chords'),indent=2))
