"""Check loaded weights and audition raw detected guitar notes without styling."""
from pathlib import Path
import os,sys,json,hashlib
root=Path.cwd()
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path[:0]=[str(root/'work/tsumugi'),str(root/'data/transcription-packages'),str(root/'scripts')]
import torch,numpy as np,pretty_midi,soundfile as sf
torch.set_num_threads(4)
from instrument_agnostic_amt.amt.modeling.checkpoints import load_checkpoint,extract_model_config,coerce_model_config,load_compatible_weights
from instrument_agnostic_amt.amt.modeling.model import AudioSemiCRFTransformer
path=root/'data/guitar-transcription-models/best_model_guitar_v1_5.pth'
checkpoint=load_checkpoint(path)
model=AudioSemiCRFTransformer(coerce_model_config(extract_model_config(checkpoint),for_inference=True))
loaded=load_compatible_weights(model,checkpoint,prefer_ema=True,require_complete_backbone=True)
assert not loaded.missing_keys and not loaded.unexpected_keys and not loaded.shape_mismatches, str(loaded)
out=root/'exports/singing/tsumugi-country-guitar-20261108'
midi=pretty_midi.PrettyMIDI(str(out/'source-guitar.mid'))
notes=sorted([[float(n.start),float(min(n.end,10)),int(n.pitch),float(n.velocity/127)] for i in midi.instruments if not i.is_drum for n in i.notes if 0<=n.start<10],key=lambda n:(n[0],n[2]))
assert len(notes)>0
from arrangement_replacement import render_soundfont,SR
audio=render_soundfont(notes,10,root,25,0,midi_velocities=[round(n[3]*127) for n in notes])
assert len(audio)==SR*10 and np.isfinite(audio).all()
audio*=min(.07/max(float(np.sqrt(np.mean(audio*audio))),1e-8),.95/max(float(np.abs(audio).max()),1e-8))
sf.write(out/'Detected notes - acoustic check.wav',audio,SR,subtype='PCM_24')
source=root/'exports/singing/melodyflow-guitar-electric-20261108/Original guitar.wav'
original,sr=sf.read(source,always_2d=True)
sf.write(out/'Original guitar.wav',original,sr,subtype='PCM_24')
report={'model_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'weights_loaded':len(loaded.loaded_keys),
    'missing_keys':list(loaded.missing_keys),'unexpected_keys':list(loaded.unexpected_keys),'shape_mismatches':list(loaded.shape_mismatches),
    'notes':notes,'note_count':len(notes),'pitch_range':[min(n[2] for n in notes),max(n[2] for n in notes)],
    'midi_programs':[int(i.program) for i in midi.instruments],'source_seconds':[18,28],
    'scope':'Raw transcription gate. Acoustic GM25 sample, no drive, no extra notes, no quantization; note-off shortened before repeated same key by existing renderer.',
    'velocity_note':'Model MIDI defaults to fixed velocity; loudness/expression is not validated.',
    'productionChanged':False,'listeningApproved':False}
(out/'note-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='notes'}),flush=True)
