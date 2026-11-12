"""Source-derived velocity/envelope estimates; never adds or retimes MIDI notes."""
from pathlib import Path
import sys,os,json,hashlib,subprocess,argparse
root=Path.cwd();os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path[:0]=[str(root/'data/transcription-packages'),str(root/'scripts')]
import numpy as np,soundfile as sf,pretty_midi
from scipy.signal import resample_poly,stft
from scipy.ndimage import uniform_filter1d
from arrangement_replacement import render_separate,SR
parser=argparse.ArgumentParser()
parser.add_argument('--output-dir',type=Path,default=root/'exports/singing/tsumugi-country-dynamics-20261108')
args=parser.parse_args()
out=args.output_dir
g=np.load(out/'source-guitar.npy').mean(0)
g=resample_poly(g,80,147);seconds=30
midi_path=out/'source-guitar.mid';digest=hashlib.sha256(midi_path.read_bytes()).hexdigest()
midi=pretty_midi.PrettyMIDI(str(midi_path))
notes=sorted([[float(n.start),float(min(n.end,seconds)),int(n.pitch),float(n.velocity/127)]
    for i in midi.instruments if not i.is_drum for n in i.notes if 0<=n.start<seconds],key=lambda n:(n[0],n[2]))
assert notes and len(g)==seconds*SR
f,t,z=stft(g,fs=SR,nperseg=4096,noverlap=3856)
power=np.abs(z)**2
strengths=[]
for begin,end,pitch,_ in notes:
    hz=440*2**((pitch-69)/12)
    frames=(t>=begin)&(t<=min(end,begin+.1))
    if not frames.any():frames[np.argmin(abs(t-begin))]=True
    energy=np.zeros(len(t))
    for h in range(1,5):
        bins=np.abs(f-h*hz)<max(9,h*hz*.015)
        if bins.any():energy+=power[bins].sum(0)/h
    strengths.append(float(np.sqrt(np.percentile(energy[frames],75))))
ref=max(float(np.percentile(strengths,85)),1e-8)
velocities=[1 if v<ref*.02 else int(np.clip(100+25*np.log2(max(v,1e-9)/ref),20,115)) for v in strengths]
print('Rendering',len(notes),'notes; source-derived velocity',min(velocities),max(velocities),flush=True)
clean=render_separate(notes,seconds,root,'electric-guitar',0,'clean',midi_velocities=velocities,guitar_release=.25)
def rms(a):return float(np.sqrt(np.mean(a*a)))
clean*=min(.065/max(rms(clean),1e-8),.9/max(float(abs(clean).max()),1e-8))
padded=np.pad(resample_poly(clean,2,1),(24000,24000))
sf.write(out/'amp-input.wav',padded,48000,subtype='FLOAT')
cmd=[str(root/'data/nam/build/tools/Release/render.exe'),str(root/'data/nam/models/jcm800-cab.nam'),str(out/'amp-input.wav'),str(out/'amp-output.wav')]
p=subprocess.run(cmd,capture_output=True,text=True,errors='replace',timeout=120,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
(out/'amp.log').write_text(p.stdout+p.stderr,encoding='utf-8');assert p.returncode==0
a,sr=sf.read(out/'amp-output.wav',dtype='float32');assert sr==48000 and a.shape==padded.shape
a=resample_poly(a[24000:24000+len(clean)*2],1,2)
a*=rms(g)/max(rms(a),1e-8)
def envelope(x):return np.sqrt(np.maximum(uniform_filter1d(x*x,size=round(SR*.1)),0))
source_env=envelope(g);before_env=envelope(a)
floor=max(float(np.percentile(source_env,95))*.005,1e-6)
# Bounded level transfer compensates for amp compression; never normalize every quiet note.
gain=np.clip(source_env/np.maximum(before_env,floor),0,1.8)
gain[source_env<floor]=0
gain=uniform_filter1d(gain,size=round(SR*.025))
dynamic=a*gain
assert np.isfinite(dynamic).all() and len(dynamic)==seconds*SR
def audition(name,x,rate):
    x=x*min(.07/max(rms(x),1e-9),.95/max(float(abs(x).max()),1e-9))
    assert np.isfinite(x).all() and len(x)==seconds*rate
    sf.write(out/name,x,rate,subtype='PCM_24')
    return {'peak':float(abs(x).max()),'rms':rms(x),'seconds':len(x)/rate}
report={'solo':audition('Dynamic electric guitar - 30s.wav',dynamic,SR),
    'source_solo':audition('Original guitar - 30s.wav',g,SR)}
back,br=sf.read(out/'Original backing.wav',always_2d=True,dtype='float32')
original_g=np.load(out/'source-guitar.npy').T
electric=resample_poly(dynamic,147,80)[:,None]
electric*=rms(original_g)/max(rms(electric),1e-9)
mix=back-original_g+electric
report['backing']=audition('Dynamic electric backing - 30s.wav',mix,br)
report['source_backing']=audition('Original backing - 30s.wav',back,br)
report.update(note_count=len(notes),notes=notes,velocities=velocities,source_note_strengths=strengths,
    midi_sha256=digest,note_events_unchanged=hashlib.sha256(midi_path.read_bytes()).hexdigest()==digest,
    dynamics_method='Source harmonic attack energy per MIDI note, plus smoothed source-RMS/output-RMS gain, max1.8; quiet source not independently normalized',
    source_envelope_correlation_before=float(np.corrcoef(source_env,before_env)[0,1]),
    source_envelope_correlation_after=float(np.corrcoef(source_env,envelope(dynamic))[0,1]),
    extra_generated_notes=0,transpose=0,productionChanged=False,listeningApproved=False,
    limitation='Longer transcription has not been user-approved. Dynamics are estimates, not original performance recovery.')
(out/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ['notes','velocities','source_note_strengths']}),flush=True)
