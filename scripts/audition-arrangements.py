"""Offline accompaniment auditions from saved stems; never modifies approved audio.
Chord estimates and synthesized instruments are prototypes, not learned arrangements.
"""
import json
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'exports/singing/1791669063502'
OUT = ROOT / 'exports/singing/arrangement-audition'
START, LENGTH, SR = 15, 12, 24000


def note(midi, duration, style):
    t = np.arange(int(duration * SR)) / SR
    f = 440 * 2 ** ((midi - 69) / 12)
    if style == 'piano':
        tone = sum(np.sin(2 * np.pi * f * h * (1 + .0003 * h*h) * t)
                   * np.exp(-t * (1.8 + .35*h)) / h**1.7 for h in range(1, 9))
    else:
        # Deterministic filtered pluck, avoiding repeated noise changes between auditions.
        rng = np.random.default_rng(midi)
        delay = max(2, round(SR/f))
        ring = rng.uniform(-1, 1, delay)
        tone = np.zeros(len(t))
        for i in range(len(t)):
            j = i % delay
            tone[i] = ring[j]
            ring[j] = .496 * (ring[j] + ring[(j+1) % delay])
        tone *= np.exp(-t*.65)
    envelope = np.minimum(t/.008, 1) * np.minimum((duration-t)/.06, 1)
    return tone * np.maximum(envelope, 0)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    result = json.loads((SOURCE/'result.json').read_text())
    vocal, _ = librosa.load(result['vocal'], sr=SR, offset=START, duration=LENGTH)
    original, _ = librosa.load(SOURCE/'instrumental.wav', sr=SR, offset=START, duration=LENGTH)
    size = min(len(vocal), len(original))
    vocal, original = vocal[:size], original[:size]
    harmonic = librosa.effects.harmonic(original)
    chroma = librosa.feature.chroma_stft(y=harmonic, sr=SR, hop_length=512)
    tempo, beats = librosa.beat.beat_track(y=original, sr=SR, hop_length=512)
    beat = 60 / float(np.asarray(tempo).reshape(-1)[0]) if np.asarray(tempo).size else .5
    beat = float(np.clip(beat, .3, 1.2))
    times = librosa.frames_to_time(beats, sr=SR, hop_length=512)
    times = times[(times>=0) & (times<size/SR)]
    if len(times)<4: times=np.arange(0,size/SR,beat)
    templates=[]
    for root in range(12):
        for quality,third in [('major',4),('minor',3)]:
            template=np.zeros(12);template[[root,(root+third)%12,(root+7)%12]]=[1,.8,.8]
            templates.append((root,third,quality,template/np.linalg.norm(template)))
    chords=[]
    for index in range(0,len(times),4):
        begin=float(times[index]);end=float(times[index+4]) if index+4<len(times) else size/SR
        a=int(begin*SR/512);b=max(a+1,int(end*SR/512))
        energy=chroma[:,a:b].mean(axis=1)
        root,third,quality,_=max(templates,key=lambda entry:float(energy@entry[3]))
        chords.append(dict(start=begin,end=end,root=root,third=third,quality=quality))
    sf.write(OUT/'mana-vocal.wav',vocal,SR,subtype='PCM_16')
    def mix(backing):
        vr=max(np.sqrt(np.mean(vocal*vocal)),.001);br=max(np.sqrt(np.mean(backing*backing)),.001)
        mixed=vocal+backing*(vr*.35/br)
        return mixed*min(1,.95/max(np.max(np.abs(mixed)),.001))
    sf.write(OUT/'original-backing-mix.wav',mix(original),SR,subtype='PCM_16')
    for style in ['piano','guitar']:
        backing=np.zeros(size)
        for chord in chords:
            pitches=[48+chord['root'],48+chord['root']+chord['third'],55+chord['root'],60+chord['root']]
            hits=times[(times>=chord['start']) & (times<chord['end'])]
            for i,hit in enumerate(hits):
                selected=[pitches[i%4]] if style=='piano' else pitches[:3]
                for j,midi in enumerate(selected):
                    offset=int((hit+(j*.025 if style=='guitar' else 0))*SR)
                    if offset>=size:continue
                    signal=note(midi,min(1.5,(size-offset)/SR),style)*.18
                    backing[offset:offset+len(signal)]+=signal
        sf.write(OUT/f'{style}-backing.wav',backing,SR,subtype='PCM_16')
        sf.write(OUT/f'mana-{style}-mix.wav',mix(backing),SR,subtype='PCM_16')
    (OUT/'analysis.json').write_text(json.dumps(dict(source=str(SOURCE),start=START,seconds=size/SR,beatSeconds=beat,chords=chords,approved=False,method='estimated triads + synthesized instruments'),indent=2))
    print('Saved piano and guitar auditions:',OUT,flush=True)


if __name__=='__main__': main()
