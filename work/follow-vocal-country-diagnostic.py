from pathlib import Path
import os,sys
import librosa,numpy as np,soundfile as sf
from scipy.ndimage import median_filter
root=Path.cwd()
sys.path.insert(0,str(root/'scripts'))
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba')
out=root/'exports/singing/follow-vocal-country-audition'
x,sr=sf.read(out/'Original vocal guide.wav',dtype='float32')
f0,voiced,prob=librosa.pyin(x,sr=sr,fmin=librosa.note_to_hz('C3'),fmax=librosa.note_to_hz('C6'),frame_length=2048,hop_length=120,fill_na=np.nan)
np.savez(root/'work/follow-vocal-country-pitch.npz',f0=f0,voiced=voiced,prob=prob)
for threshold in [.3,.45]:
 valid=voiced&np.isfinite(f0)&(prob>=threshold)
 pitch=np.zeros(len(f0),int)
 pitch[valid]=np.rint(librosa.hz_to_midi(f0[valid])).astype(int)
 pitch=median_filter(pitch,size=5)
 boundaries=np.r_[0,np.flatnonzero(pitch[1:]!=pitch[:-1])+1,len(pitch)]
 notes=[(a*.005,b*.005,int(pitch[a]),round(float(np.mean(prob[a:b])),2)) for a,b in zip(boundaries,boundaries[1:]) if b-a>=11 and pitch[a]>0]
 print(threshold,notes)
