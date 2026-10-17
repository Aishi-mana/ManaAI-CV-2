"""Conservative source-supported bass phrase review with fixed 4x release."""
import json,sys
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from scipy.signal import butter,sosfiltfilt
from arrangement_replacement import render_soundfont,SR
ROOT=Path('C:/AI/ManaAI-CV-2')

def review(source,notes):
    low=librosa.resample(source,orig_sr=SR,target_sr=12000)
    low=sosfiltfilt(butter(3,700,'lowpass',fs=12000,output='sos'),low)
    yin=librosa.yin(low,fmin=30.87,fmax=246.95,sr=12000,frame_length=2048,hop_length=120)
    ym=librosa.hz_to_midi(yin)
    spectrum=np.abs(librosa.stft(low,n_fft=8192,hop_length=120))
    frequencies=librosa.fft_frequencies(sr=12000,n_fft=8192)
    rms=librosa.feature.rms(y=low,frame_length=512,hop_length=120)[0]
    def support(p,start,end):
        a=max(0,round(start*100));b=min(spectrum.shape[1],max(a+1,round(end*100)))
        f=librosa.midi_to_hz(p);values=[]
        for harmonic in range(1,5):
            bins=np.flatnonzero(np.abs(frequencies-f*harmonic)<max(2,f*harmonic*.015))
            if len(bins):values.append(float(np.median(spectrum[bins,a:b].max(axis=0)))/harmonic)
        return sum(values)
    revised=[list(n) for n in notes];audit=[]
    for i,n in enumerate(revised):
        a,b,p,confidence=n
        # Avoid attacks, where low-frequency analysis often blends adjacent notes.
        first=round((a+.04)*100);last=min(len(ym),round((b-.02)*100))
        if last-first<6:continue
        observations=ym[first:last];candidate=int(round(float(np.median(observations))))
        stable=float(np.mean(np.abs(observations-candidate)<.35))
        current_score=support(p,a+.04,b-.02);alternative=support(candidate,a+.04,b-.02)
        accepted=candidate!=p and abs(candidate-p)<=12 and stable>=.8 and alternative>current_score*1.5
        audit.append(dict(index=i,start=a,end=b,old_pitch=p,candidate=candidate,stability=stable,support_ratio=alternative/max(current_score,1e-9),changed=accepted))
        if accepted:n[2]=candidate
    # A short untranscribed gap is recovered only with stable pitch, source energy and harmonic support.
    added=[]
    for i in range(len(notes)-1):
        start=notes[i][1];end=notes[i+1][0]
        if not .09<=end-start<=.35:continue
        a=round((start+.02)*100);b=min(len(ym),round((end-.02)*100))
        if b-a<5:continue
        values=ym[a:b];pitch=int(round(float(np.median(values))))
        stable=float(np.mean(np.abs(values-pitch)<.3))
        energy=float(np.mean(rms[a:min(b,len(rms))]))
        if stable>=.85 and energy>float(rms.max())*.10 and pitch not in [revised[i][2],revised[i+1][2]] and support(pitch,start+.02,end-.02)>1e-4:
            added.append([start,end,pitch,.6])
    # Correct pitch-tracker latency only where a nearby independent low-band attack
    # supports the same key; leave pitch changes without an attack in place.
    attacks=librosa.onset.onset_detect(y=low,sr=12000,hop_length=60,units='time',backtrack=True)
    used=set()
    for i,n in enumerate(revised):
        a,b,p,_=n
        options=[float(t) for t in attacks if a-.10<=t<a-.025 and t not in used and (i==0 or t>revised[i-1][0]+.06)]
        if not options:continue
        attack=max(options)
        evidence=support(p,attack+.015,min(a+.02,b))
        reference=support(p,a+.03,min(a+.10,b))
        if evidence<max(reference*.5,1e-4):continue
        previous=revised[i-1] if i else None
        if previous and previous[2]==p and previous[1]>=attack:continue
        n[0]=attack;used.add(attack)
        if previous and previous[1]>attack:previous[1]=max(previous[0]+.01,attack)
        audit.append(dict(index=i,old_start=a,new_start=attack,pitch=p,timing_changed=True))
    return sorted(revised+added,key=lambda n:n[0]),audit,added

def main():
    base=ROOT/'exports/singing/bass-performance-2026-10-15'
    data=json.loads((base/'report.json').read_text(encoding='utf-8'))
    source,_=librosa.load(data['source'],sr=SR,duration=19)
    notes,audit,added=review(source,data['notes'])
    old_vel={(n[0],n[1]):v for n,v in zip(data['notes'],data['velocities'])}
    strengths=[float(np.sqrt(np.mean(source[round(a*SR):round(min(b,a+.16)*SR)]**2))) for a,b,_,_ in notes]
    reference=max(float(np.percentile(strengths,90)),1e-9)
    velocities=[old_vel.get((n[0],n[1]),int(round(22+83*np.clip(v/reference,0,1)))) for n,v in zip(notes,strengths)]
    if not added and len(notes)==len(data['notes']):velocities=list(data['velocities'])
    out=ROOT/'exports/singing/bass-phrase-review-2026-10-15';out.mkdir(exist_ok=True)
    results=[]
    for name,program in [('finger-reviewed',33),('picked-reviewed',34)]:
        audio=render_soundfont(notes,19,ROOT,program,0,midi_velocities=velocities,release_scale=4)
        assert audio.shape==(456000,) and np.isfinite(audio).all()
        gain=min(.065/max(float(np.sqrt(np.mean(audio*audio))),1e-9),.9/max(float(np.max(np.abs(audio))),1e-9))
        sf.write(out/(name+'.wav'),audio*gain,SR,subtype='PCM_16')
        sf.write(out/(name+'-9-19.wav'),audio[216000:456000]*gain,SR,subtype='PCM_16')
        results.append(dict(name=name,peak=float(np.max(np.abs(audio*gain))),gain=gain))
    for name,start,end in [('phrase-9-12',9,12),('phrase-12-15',12,15),('phrase-15-19',15,19)]:
        original=source[round(start*SR):round(end*SR)];g=min(.065/max(float(np.sqrt(np.mean(original**2))),1e-9),.9/max(float(np.max(np.abs(original))),1e-9))
        sf.write(out/(name+'-original.wav'),original*g,SR)
        candidate,_=sf.read(out/'finger-reviewed.wav');sf.write(out/(name+'-candidate.wav'),candidate[round(start*SR):round(end*SR)],SR)
    sf.write(out/'original-9-19.wav',sf.read(base/'original-bass-9-19.wav')[0],SR)
    report=dict(notes=notes,velocities=velocities,audit=audit,added_notes=added,results=results,method='First44-note candidate retained unless independent YIN interior estimate has>=80%stability within35cents and >=1.5x source harmonic-comb support. New notes only in90–350ms gaps with>=85%stability, source energy and distinct neighboring pitch. Source-backed attack latency correction25–100ms only with same-key spectral support; preceding note-off capped at corrected attack.4x release fixed. Heuristic evidence is not ground truth; no original blended, app unchanged.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(dict(changes=[a for a in audit if a.get('changed') or a.get('timing_changed')],added=added,note_count=len(notes)),indent=2))

if __name__=='__main__':main()
