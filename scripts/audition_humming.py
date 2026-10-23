"""One bounded humming audition; never overwrites active musical clips."""
from pathlib import Path
import argparse,json,sys
import numpy as np
import soundfile as sf
from scipy.ndimage import gaussian_filter1d

def guide(sr=24000,bright=False):
    rng=np.random.default_rng(42)
    durations=np.array([.55,.62,.69,.55,.60,.51,.67] if bright else [.74,.68,.92,.71,.60,.95])
    starts=np.r_[.16,.16+np.cumsum(durations)[:-1]]
    end=.16+sum(durations);t=np.arange(round((end+.25)*sr))/sr
    notes=np.array([64,67,69,67,64,62,60] if bright else [60,64,67,64,62,60],dtype=float)
    pitch=np.full(len(t),notes[0])
    for start,note in zip(starts,notes):pitch[t>=start]=note
    # Continuous phase and short portamento avoid oscillator restarts at note edges.
    pitch=gaussian_filter1d(pitch,.035*sr)
    vibrato=.09*np.sin(2*np.pi*(4.6*t+.04*t*t))
    pitch+=vibrato*np.clip((t-.45)/.5,0,1)+.025*np.sin(2*np.pi*.7*t)
    freq=440*2**((pitch-69)/12);phase=np.cumsum(2*np.pi*freq/sr)
    voice=np.zeros(len(t))
    for harmonic in range(1,18):
        hz=freq*harmonic
        # A closed-mouth nasal hum rather than the previous open-vowel spectrum.
        weight=(np.exp(-((hz-280)/200)**2)+.24*np.exp(-((hz-1100)/300)**2)+.03)/harmonic
        voice+=weight*np.sin(harmonic*phase)
    envelope=np.clip((t-.12)/.14,0,1)*np.clip((end-t)/.28,0,1)
    envelope*=.82+.10*np.sin(2*np.pi*.53*t)+.04*np.sin(2*np.pi*1.3*t)
    # One short phrase break, not a mechanical gap between every note.
    envelope*=1-.88*np.exp(-.5*((t-starts[3])/.065)**2)
    voice=voice*envelope
    voice+=gaussian_filter1d(rng.normal(0,1,len(t)),2)*.001*envelope
    voice*=.24/max(float(np.max(np.abs(voice))),.001)
    return voice.astype(np.float32),sr

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--render',action='store_true');parser.add_argument('--bright',action='store_true');args=parser.parse_args()
    root=Path(__file__).resolve().parents[1];out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
    active=(root/'exports/singing/musical-moments').resolve()
    if out==active or active in out.parents:raise ValueError('Use a separate audition folder.')
    audio,sr=guide(bright=args.bright);source=out/'connected-guide.wav';sf.write(source,audio,sr)
    result={'seconds':len(audio)/sr,'guide':str(source),'activeLibraryChanged':False}
    if args.render:
        from singing_job import run
        rendered=run(dict(repo=str(root/'data/seed-vc'),source=str(source),reference=str(root/'data/custom-voice/references/mana-v2'/('cheerful-r2.wav' if args.bright else 'default-r2.wav')),start=0,seconds=len(audio)/sr,separate=False,output=str(out/'conversion'),diffusion_steps=30))
        import shutil
        candidate=out/('bright-hum-connected.wav' if args.bright else 'soft-hum-connected.wav');shutil.copyfile(rendered['vocal'],candidate);result['candidate']=str(candidate)
    (out/'audition.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps(result),flush=True)
