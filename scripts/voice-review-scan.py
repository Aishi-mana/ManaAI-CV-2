from pathlib import Path
import json,hashlib
import numpy as np,soundfile as sf,librosa
root=Path(r'C:\Users\Admin\Downloads\Yuuki Voice');out=Path('exports/voice-review');out.mkdir(parents=True,exist_ok=True)
rows=[]
for p in sorted(root.rglob('*.wav')):
 y,sr=sf.read(p,always_2d=True);mono=y.mean(1);low=librosa.resample(mono,orig_sr=sr,target_sr=16000);rms=librosa.feature.rms(y=low,frame_length=512,hop_length=160)[0];floor=float(np.percentile(rms,10));active=float(np.mean(rms>max(floor*2,.01)));peak=float(np.max(np.abs(y)));energy=float(np.sqrt(np.mean(mono**2)));clipping=float(np.mean(np.abs(y)>.999));
 pitch=librosa.yin(low,fmin=90,fmax=650,sr=16000,frame_length=1024,hop_length=160);voiced=rms[:len(pitch)]>max(.015,energy*.35);pitch=pitch[:len(voiced)][voiced];median=float(np.median(pitch)) if len(pitch) else 0;spread=float(np.percentile(pitch,80)-np.percentile(pitch,20)) if len(pitch)>3 else 0
 rows.append({'file':str(p),'filename':p.name,'seconds':round(len(mono)/sr,3),'rms':round(energy,5),'peak':round(peak,5),'clippedFraction':round(clipping,5),'pitchMedian':round(median,1),'pitchSpread':round(spread,1),'lowEnergyFloor':round(floor,5),'activeFraction':round(active,3),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'classification':'pending acoustic triage','referenceReady':False})
(out/'inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print('Scanned',len(rows),'WAVs; no originals modified.')
