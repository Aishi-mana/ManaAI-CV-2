"""Offline guitar transcription prerequisite, not timbre conversion approval."""
from pathlib import Path
import sys,os,hashlib,runpy,argparse
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--audio',type=Path,default=root/'exports/singing/melodyflow-guitar-electric-20261108/Original guitar.wav')
parser.add_argument('--output-dir',type=Path,default=root/'exports/singing/tsumugi-country-guitar-20261108')
args=parser.parse_args()
model=root/'data/guitar-transcription-models/best_model_guitar_v1_5.pth'
assert model.is_file(), f'User-supplied model required: {model}'
assert model.stat().st_size==57152017
assert hashlib.sha256(model.read_bytes()).hexdigest()=='59c8335517d1faf7d735fef29e061181d87b96385f2e9a08332791e2b64affd4'
os.environ['HF_HUB_OFFLINE']='1'
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
sys.path[:0]=[str(root/'work/tsumugi'),str(root/'data/transcription-packages')]
import torch
torch.set_num_threads(4)
def no_download(*args,**kwargs):
    raise RuntimeError('Automatic model downloads are disabled for this audition')
torch.hub.download_url_to_file=no_download
out=args.output_dir;out.mkdir(exist_ok=True)
sys.argv=['infer','--checkpoint',str(model),'--type','guitar_v1_5',
    '--audio',str(args.audio),
    '--output-midi',str(out/'source-guitar.mid'),'--device','cpu']
runpy.run_module('instrument_agnostic_amt.amt.cli.infer',run_name='__main__')
