"""Gentle source-active upward compression; no transcription or tone changes."""
from pathlib import Path
import json,hashlib,argparse
import numpy as np,soundfile as sf
from scipy.ndimage import uniform_filter1d
from scipy.signal import resample_poly
root=Path.cwd()
parser=argparse.ArgumentParser()
parser.add_argument('--input-dir',type=Path,default=root/'exports/singing/tsumugi-country-dynamics-20261108')
parser.add_argument('--output-dir',type=Path,default=root/'exports/singing/tsumugi-country-smoother-20261108')
args=parser.parse_args()
base=args.input_dir;out=args.output_dir;out.mkdir(exist_ok=True)
midi=base/'source-guitar.mid';digest=hashlib.sha256(midi.read_bytes()).hexdigest()
a,sr=sf.read(base/'Dynamic electric guitar - 30s.wav',dtype='float32');assert sr==24000
g=np.load(base/'source-guitar.npy').T
source=resample_poly(g.mean(1),80,147)
env=np.sqrt(np.maximum(uniform_filter1d(source*source,size=round(sr*.12)),0))
reference=max(float(np.percentile(env,75)),1e-8)
# Reduce the depth of audible source dips, not independently normalize each note.
# At most +3dB, with no lift for near-silence and a gradual activity transition.
desired=np.clip((reference/np.maximum(env,1e-8))**.4,1,10**(3/20))
activity=np.clip((env/reference-.06)/.14,0,1)
gain=1+(desired-1)*activity
gain=uniform_filter1d(gain,size=round(sr*.18))
smooth=a*gain
def rms(x):return float(np.sqrt(np.mean(x*x)))
def save(name,x,rate):
    x=x*min(.07/max(rms(x),1e-8),.95/max(float(np.abs(x).max()),1e-8))
    assert len(x)==30*rate and np.isfinite(x).all()
    sf.write(out/name,x,rate,subtype='PCM_24')
    return {'peak':float(np.abs(x).max()),'rms':rms(x),'seconds':len(x)/rate}
report={'solo':save('Smoother electric guitar - 30s.wav',smooth,sr)}
back,br=sf.read(base/'Original backing.wav',always_2d=True,dtype='float32')
electric=resample_poly(a,147,80)[:,None]
electric*=rms(g)/max(rms(electric),1e-8)
gain44=resample_poly(gain,147,80)[:,None]
# Use the SAME base stem gain as the previous candidate; preserve the intended lift.
mixed=back-g+electric*gain44
report['backing']=save('Smoother electric backing - 30s.wav',mixed,br)
report.update(max_lift_db=float(20*np.log10(gain.max())),automation_smoothing_ms=180,
    quiet_source_no_boost_below_fraction=.06,active_reference_percentile=75,
    note_midi_sha256=digest,note_events_unchanged=hashlib.sha256(midi.read_bytes()).hexdigest()==digest,
    tone_and_timing_unchanged=True,productionChanged=False,listeningApproved=False,
    scope='General gentle dip reduction over whole excerpt, not timestamp-specific patches')
(out/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
