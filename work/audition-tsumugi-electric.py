"""Render user-approved note list with electric samples, then local NAM amp."""
from pathlib import Path
import os,sys,json,hashlib,subprocess
root=Path.cwd();os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path[:0]=[str(root/'data/transcription-packages'),str(root/'scripts')]
import numpy as np,soundfile as sf
from scipy.signal import resample_poly
from arrangement_replacement import render_separate,SR
base=root/'exports/singing/tsumugi-country-guitar-20261108'
out=root/'exports/singing/tsumugi-country-electric-20261108';out.mkdir(exist_ok=True)
note_path=base/'note-check.json';digest=hashlib.sha256(note_path.read_bytes()).hexdigest()
notes=json.loads(note_path.read_text(encoding='utf-8'))['notes']
clean=render_separate(notes,10,root,'electric-guitar',0,'clean',
    midi_velocities=[round(n[3]*127) for n in notes],guitar_release=.25)
def rms(x):return float(np.sqrt(np.mean(x*x)))
clean*=min(.065/max(rms(clean),1e-9),.9/max(float(np.abs(clean).max()),1e-9))
assert len(clean)==10*SR and np.isfinite(clean).all()
padded=np.pad(resample_poly(clean,2,1),(24000,24000))
sf.write(out/'amp-input.wav',padded,48000,subtype='FLOAT')
command=[str(root/'data/nam/build/tools/Release/render.exe'),str(root/'data/nam/models/jcm800-cab.nam'),str(out/'amp-input.wav'),str(out/'amp-output.wav')]
result=subprocess.run(command,capture_output=True,text=True,errors='replace',timeout=120,
    creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
(out/'amp.log').write_text(result.stdout+result.stderr,encoding='utf-8')
assert result.returncode==0,result.stderr
a,sr=sf.read(out/'amp-output.wav',dtype='float32')
assert sr==48000 and a.shape==padded.shape and np.isfinite(a).all()
driven=resample_poly(a[24000:24000+len(clean)*2],1,2)
def audition(name,a,rate):
    a=a*min(.07/max(rms(a),1e-9),.95/max(float(np.abs(a).max()),1e-9))
    assert np.isfinite(a).all() and len(a)==10*rate
    sf.write(out/name,a,rate,subtype='PCM_24')
    return {'rms':rms(a),'peak':float(np.abs(a).max()),'seconds':len(a)/rate}
report={'clean':audition('Clean electric guitar.wav',clean,SR),
    'amp':audition('Distorted electric guitar.wav',driven,SR),
    'source_notes_sha256':digest,'note_count':len(notes),'pitches_and_event_times_unchanged':True,
    'renderer_noteoff_policy':'same-key note ends before next attack, identical to approved acoustic gate',
    'sample_release_seconds':.25,'shift_semitones':0,'extra_notes':0,'note_filtering':False,
    'dynamic_velocity':'same fixed100 MIDI velocities as approved gate',
    'sample_patch':'BlackAndGreenGuitars/Programs/04-green_twang.sfz','amp_model':'jcm800-cab.nam',
    'productionChanged':False,'listeningApproved':False}
# Replace only the acoustic stem in the retained backing, at its original RMS.
back,rate=sf.read(root/'exports/singing/1794090410615/backing-extracted.wav',dtype='float32',always_2d=True)
back=back[18*rate:28*rate]
g=np.load(root/'exports/singing/country-guitar-drive-20261108/guitar-with-context.npy')[:,2*rate:12*rate].T
electric=resample_poly(driven,147,80)[:,None];electric=np.repeat(electric,2,axis=1)
electric*=rms(g)/max(rms(electric),1e-9)
mixed=back-g+electric
report['backing']=audition('Distorted electric backing.wav',mixed,rate)
assert hashlib.sha256(note_path.read_bytes()).hexdigest()==digest
(out/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
