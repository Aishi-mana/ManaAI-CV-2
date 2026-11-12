from pathlib import Path
import sys,json
import faulthandler
faulthandler.dump_traceback_later(45,repeat=True)
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'scripts'))
import soundfile as sf
from cover_genre import restyle_backing
source=root/'exports/singing/1793880399944/instrumental.wav'
audio,sr=sf.read(source,start=18*44100,frames=12*44100,always_2d=True,dtype='float32')
out=root/'exports/singing/genre-rock-trial-20261105';out.mkdir(parents=True,exist_ok=True)
result,profile=restyle_backing(audio.T,sr,'rock',out)
(out/'checks.json').write_text(json.dumps(profile,indent=2),encoding='utf-8')
print('GENRE_TRIAL_READY',flush=True)
