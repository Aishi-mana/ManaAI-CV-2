from pathlib import Path
import json,os,subprocess,sys
import numpy as np,soundfile as sf
root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
os.environ['TEMP']=os.environ['TMP']=str(root/'work')
from arrangement_job import run
from band_mix import prepare
from scipy.signal import resample_poly

source=root/'exports/singing/1794090410615'
out=root/'work/band-mixer-smoke'
result=run(dict(style='country',start=4,seconds=16,vocal=str(source/'vc_mana-trained-v1.wav'),
                instrumental=str(source/'backing-extracted.wav'),data_root=str(root),output=str(out)))
manifest=result['bandMixParts']
assert [p['name'] for p in manifest]==['vocal','lead','accompaniment','bass','drums']
def remix(label,gains,parts=manifest):
 target=out/label
 target.mkdir(exist_ok=True)
 request=dict(paths=['\\\\?\\'+str(Path(p['path']).resolve()) for p in parts],gains=gains,output=str(target))
 result=subprocess.run([sys.executable,str(root/'scripts/band_mix.py')],input=json.dumps(request),text=True,capture_output=True,check=True)
 data=json.loads(result.stdout)
 return {name:sf.read(path,always_2d=True)[0] for name,path in data.items()}
reset=remix('reset',[p['gain'] for p in manifest])
original,sr=sf.read(result['mix'],always_2d=True)
assert np.max(np.abs(reset['mix']-original))<=2/32768
solo=remix('solo-bass',[0,0,0,1,0])
assert np.max(np.abs(solo['vocal']))==0 and np.array_equal(solo['mix'],solo['instrumental'])
bass,_=sf.read(manifest[3]['path'])
assert np.max(np.abs(solo['mix'][:,0]-bass))<1/32768 and abs(solo['mix']).max()>.001
muted=remix('mute-drums',[1,1,1,1,0])
adjusted=remix('adjusted',[.55,.8,1.2,.9,.25])
assert not np.array_equal(muted['mix'],reset['mix'])
assert np.max(np.abs(adjusted['mix']-adjusted['vocal']-adjusted['instrumental']))<=2/32768
stereo_dir=out/'create-cover-rate'
stereo_dir.mkdir(exist_ok=True)
vocal,_=sf.read(out/'mana-vocal.wav',dtype='float32')
backing,_=sf.read(out/'instrumental.wav',always_2d=True,dtype='float32')
voice=resample_poly(np.stack([vocal,vocal],axis=1),147,80,axis=0)
music=resample_poly(backing,147,80,axis=0)
stereo_parts=prepare(voice,music,44100,out/'band',stereo_dir,.6)
assert [p['gain'] for p in stereo_parts]==[1,.6,.6,.6,.6]
assert len(remix('create-cover-rate-remix',[.8,.6,.6,1.,0.],stereo_parts)['mix'])==16*44100
print('Verified generated preview parts, initial mix, bass solo, drum mute, adjusted stems and 44.1 kHz cover remix.')
