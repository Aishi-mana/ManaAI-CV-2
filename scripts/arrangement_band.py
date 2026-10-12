"""Deterministic sax-led jazz and electric-string rock rendering."""
import numpy as np
from scipy.signal import butter,sosfilt
SR=24000

def tone(midi,duration,kind,rng):
    if duration*SR<1:return np.zeros(0)
    t=np.arange(int(duration*SR))/SR;f=440*2**((midi-69)/12)
    envelope=np.minimum(t/.012,1)*np.minimum((duration-t)/.07,1)
    if kind=='bass':signal=np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t)
    elif kind=='sax':
        # Reed-like harmonic/formant model with breath and a delayed vibrato.
        vibrato=.004*np.sin(2*np.pi*5.2*t)*np.minimum(t/.2,1)
        phase=2*np.pi*f*np.cumsum(1+vibrato)/SR
        signal=np.zeros(len(t))
        for h in range(1,22):
            hz=f*h
            colour=.25+1.4*np.exp(-((hz-850)/650)**2)+.6*np.exp(-((hz-2200)/900)**2)
            signal+=np.sin(phase*h)*colour/h**1.1
        breath=sosfilt(butter(2,[700,5000],fs=SR,btype='bandpass',output='sos'),rng.normal(0,1,len(t)))
        signal=(signal+.045*breath)*np.minimum(t/.04,1)
        signal/=max(np.max(np.abs(signal)),.001)
    else:
        # Excited string through a simple amp and cabinet model.
        delay=max(2,round(SR/f));ring=rng.uniform(-1,1,delay);pluck=np.zeros(len(t))
        for i in range(len(t)):
            j=i%delay;pluck[i]=ring[j];ring[j]=.498*(ring[j]+ring[(j+1)%delay])
        pickup=sosfilt(butter(2,160,fs=SR,btype='highpass',output='sos'),pluck)
        amp=np.tanh(pickup*8)
        signal=sosfilt(butter(2,3800,fs=SR,output='sos'),amp)
        signal*=np.exp(-t*1.3)
    return signal*np.maximum(envelope,0)*.15

def render_band(chords,beat,size,style,note):
    rng=np.random.default_rng(42)
    backing=np.zeros(size)
    def put(time,signal,gain=1):
        start=round(time*SR)
        if start<0 or start>=len(backing):return
        count=min(len(signal),len(backing)-start)
        backing[start:start+count]+=signal[:count]*gain
    for chord in chords:
        begin,end=chord['start'],chord['end'];base=48+chord['root'];third=chord['third']
        hits=np.arange(begin,end,beat)
        for i,hit in enumerate(hits):
            if style=='jazz':
                # Seventh voicings and chord-tone bass; straight timing keeps the vocal aligned.
                if i%2==0:
                    for pitch in [base+third,base+7,base+(10 if third==3 else 11),base+14]:
                        put(hit,note(pitch,.9,'piano'),.055)
                put(hit,tone(base-12+[0,third,7,9][i%4],beat*.85,'bass',rng),.5)
                if i%2==0:put(hit+.06,tone(base+12+[7,third,10 if third==3 else 11,2][(i//2)%4],min(beat*1.6,end-hit),'sax',rng),1.5)
            else:
                for j,pitch in enumerate([base-12,base-5,base]):put(hit+j*.012,tone(pitch,beat*1.3,'guitar',rng),.9)
                if i%2==0:put(hit+.025,tone(base+12+[0,7,third,7][i%4],beat*1.6,'guitar',rng),.9)
                put(hit,tone(base-12,beat*.9,'bass',rng),.8)
    drum_start=chords[0]['start']
    for i,hit in enumerate(np.arange(drum_start,size/SR,beat)):
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
    return backing
