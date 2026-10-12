"""Offline six-stem guitar separation -> Basic Pitch MIDI -> sax audition."""
import os,sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'data/transcription-packages'))
os.environ['TORCH_HOME']=str(ROOT/'data/music-cache/torch')
import numpy as np
import soundfile as sf
import librosa
import torch
from arrangement_band import tone,SR

SOURCE=ROOT/'exports/singing/1791717415984'
OUT=ROOT/'exports/singing/guitar-midi-sax-audition'
OUT.mkdir(parents=True,exist_ok=True)
torch.set_num_threads(8)
length=12
guitar_file=OUT/'isolated-guitar.wav'
if not guitar_file.exists():
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    print('Loading six-stem guitar separation model…',flush=True)
    model=get_model('htdemucs_6s').cpu().eval()
    audio,sr=librosa.load(SOURCE/'instrumental.wav',sr=model.samplerate,mono=False,duration=length)
    if audio.ndim==1:audio=np.stack([audio,audio])
    source=torch.from_numpy(audio).float();ref=source.mean(0);mean=ref.mean();std=ref.std().clamp(min=1e-6)
    with torch.no_grad():stems=apply_model(model,((source-mean)/std)[None],device='cpu',shifts=0,split=True,overlap=.25,progress=True)[0]
    stems=stems*std+mean
    guitar=stems[model.sources.index('guitar')].numpy()
    sf.write(guitar_file,guitar.T,sr,subtype='PCM_16')
    residual=audio-guitar
    sf.write(OUT/'remaining-original-instruments.wav',residual.T,sr,subtype='PCM_16')
    del model,stems,source
    import gc;gc.collect()

print('Transcribing isolated guitar with Basic Pitch ONNX…',flush=True)
from basic_pitch import build_icassp_2022_model_path,FilenameSuffix
from basic_pitch.inference import predict
_,midi,events=predict(guitar_file,model_or_model_path=build_icassp_2022_model_path(FilenameSuffix.onnx),minimum_note_length=90,minimum_frequency=100,maximum_frequency=1500,onset_threshold=.55,frame_threshold=.35)
midi.write(str(OUT/'guitar-transcription.mid'))
(OUT/'note-events.json').write_text(json.dumps(events,default=lambda value:value.tolist() if hasattr(value,'tolist') else float(value)),encoding='utf-8')
if not events:raise ValueError('No guitar notes detected. Review the isolated stem.')
result=json.loads((SOURCE/'result.json').read_text())
vocal,_=librosa.load(result['vocal'],sr=SR,duration=length)
residual,_=librosa.load(OUT/'remaining-original-instruments.wav',sr=SR,duration=length)
guitar,_=librosa.load(guitar_file,sr=SR,duration=length)
size=min(len(vocal),len(residual));vocal=vocal[:size];residual=residual[:size]
sax=np.zeros(size);guitar_render=np.zeros(size);rng=np.random.default_rng(42)
# Thin overlapping chord notes to one melodic voice for a playable sax line.
last_end=0;kept=[]
for event in sorted(events,key=lambda n:n[0]):
    begin,end,pitch,amplitude,*_=event
    if begin<last_end-.03:continue
    if end-begin<.09 or amplitude<.15:continue
    begin=max(begin,last_end);end=min(end,size/SR)
    if end<=begin:continue
    offset=round(begin*SR)
    for instrument,target in [('sax',sax),('guitar',guitar_render)]:
        signal=tone(int(pitch),end-begin,instrument,rng)*float(amplitude)
        count=min(len(signal),size-offset)
        if count>0:target[offset:offset+count]+=signal[:count]
    last_end=end;kept.append([begin,end,int(pitch)])

def level(signal):return max(float(np.sqrt(np.mean(signal**2))),.001)
vr=level(vocal)
def mix(name,backing):
    mixed=vocal+backing;mixed*=min(1,.95/max(float(np.max(np.abs(mixed))),.001))
    sf.write(OUT/name,mixed,SR,subtype='PCM_16')
    assert np.isfinite(mixed).all() and np.max(np.abs(mixed))<=.951
sf.write(OUT/'sax-melody.wav',sax*min(1,.95/max(np.max(np.abs(sax)),.001)),SR,subtype='PCM_16')
mix('original-guitar-reference.wav',residual*vr*.28/level(residual)+guitar[:size]*vr*.25/level(guitar))
mix('transcribed-guitar-check.wav',residual*vr*.28/level(residual)+guitar_render*vr*.25/level(guitar_render))
mix('mana-guitar-to-sax.wav',residual*vr*.28/level(residual)+sax*vr*.3/level(sax))
(OUT/'analysis.json').write_text(json.dumps(dict(source=str(SOURCE),seconds=size/SR,noteCount=len(events),saxNotes=kept,approved=False,remainingBacking='Original non-guitar instruments retained; timbre swap, not a full jazz arrangement'),indent=2))
print('Saved guitar reference, MIDI check and sax replacement:',OUT,flush=True)
