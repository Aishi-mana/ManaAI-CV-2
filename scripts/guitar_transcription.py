"""Offline guitar-specific note inference, isolated from separator imports."""
from pathlib import Path
import os,sys,json,math,hashlib,subprocess,tempfile

MODEL_SHA256='59c8335517d1faf7d735fef29e061181d87b96385f2e9a08332791e2b64affd4'

def transcribe(path,seconds,root):
 root=Path(root)
 if not math.isfinite(seconds) or not 1<=seconds<=360:raise ValueError('Choose a guitar section from 1 to 360 seconds.')
 model=root/'data/guitar-transcription-models/best_model_guitar_v1_5.pth'
 if not model.is_file() or hashlib.sha256(model.read_bytes()).hexdigest()!=MODEL_SHA256:
  raise ValueError('Restore best_model_guitar_v1_5.pth in data/guitar-transcription-models.')
 if not (root/'data/guitar-transcription-engine/instrument_agnostic_amt').is_dir():
  raise ValueError('The installed guitar transcription engine is missing.')
 cache=root/'data/music-cache';cache.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory(prefix='guitar-notes-',dir=cache) as folder:
  target=Path(folder)/'notes.json'
  subprocess.run([sys.executable,str(Path(__file__).resolve()),str(root),str(Path(path).resolve()),str(target),str(seconds)],
   check=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
  notes=json.loads(target.read_text(encoding='utf-8'))
 if not notes:raise ValueError('No usable guitar notes detected. Try a section with a clearer guitar part.')
 return notes

if __name__=='__main__':
 root,source,target=map(Path,sys.argv[1:4]);seconds=float(sys.argv[4])
 os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
 os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
 os.environ['TEMP']=os.environ['TMP']=str(root/'work')
 sys.path[:0]=[str(root/'data/guitar-transcription-engine'),str(root/'data/transcription-packages')]
 import torch,pretty_midi,soundfile as sf
 torch.set_num_threads(4)
 def no_download(*args,**kwargs):raise RuntimeError('Automatic downloads are disabled for guitar conversion.')
 torch.hub.download_url_to_file=no_download
 from instrument_agnostic_amt.amt.cli import infer
 original_loader=infer.load_compatible_weights
 def strict_weights(*args,**kwargs):
  report=original_loader(*args,**kwargs)
  if report.missing_keys or report.unexpected_keys or report.shape_mismatches:
   raise ValueError('Guitar checkpoint does not completely match the installed engine.')
  return report
 infer.load_compatible_weights=strict_weights
 audio,rate=sf.read(source,always_2d=True,dtype='float32')
 sf.write(target.with_suffix('.wav'),audio[:round(seconds*rate)],rate,subtype='FLOAT')
 sys.argv=['infer','--checkpoint',str(root/'data/guitar-transcription-models/best_model_guitar_v1_5.pth'),
  '--type','guitar_v1_5','--audio',str(target.with_suffix('.wav')),'--output-midi',str(target.with_suffix('.mid')),'--device','cpu']
 infer.main()
 midi=pretty_midi.PrettyMIDI(str(target.with_suffix('.mid')))
 notes=sorted([[float(n.start),float(min(n.end,seconds)),int(n.pitch),float(n.velocity/127)]
  for i in midi.instruments if not i.is_drum for n in i.notes if 0<=n.start<min(n.end,seconds)],key=lambda n:(n[0],n[2]))
 target.write_text(json.dumps(notes),encoding='utf-8')
